#!/usr/bin/env node
/**
 * 子川助手 · 全自动闭环调度器（守护进程）
 *
 * 闭环链路：
 *   复用登录态(storageState) → 打开课程列表(cme.aspx) → 注入主脚本自动刷课
 *   → 巡检（session 续期 / 卡死恢复 / 跨课程包 / 完成判定）
 *   → 全部刷完 → 邮件通知（可选）→ 退出
 *
 * 用法:
 *   node scripts/auto-looper.mjs                 # 默认前台跑（有窗口）
 *   node scripts/auto-looper.mjs --headless      # 无头模式（长跑推荐）
 *   node scripts/auto-looper.mjs --dry-run       # 只验证链路（1 轮），不进入长循环
 *   node scripts/auto-looper.mjs --rounds 3      # 巡检 3 轮后退出（测试用）
 *   node scripts/auto-looper.mjs --mode 1        # 模式 1=单刷视频（默认 2=视频+考试）
 *
 * 必填配置（scripts/.env.local）：
 *   HUAYI_HOST —— 你所在地区的华医网主机名，形如 cmeXX.91huayi.com
 *                 （浏览器登录后看地址栏；各地区不同，故不内置默认值）
 *
 * 两个可选功能（均从 scripts/.env.local 读取，不配置也能跑）：
 *   ① 验证码自动识别 —— VISION_BASE_URL / VISION_MODEL / VISION_API_KEY
 *      不配置时会强制显示浏览器窗口，由人工输入验证码；登录态存盘后即可再用 --headless。
 *      配置说明见 scripts/lib/vision-ocr.cjs 顶部注释。
 *   ② 邮件通知 —— RESEND_API_KEY / RESEND_FROM / RESEND_TO
 *      不配置则仅写日志。
 *
 * 日志: logs/auto-looper.log（追加） + 控制台同步输出
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { loadVisionConfig, describeVisionConfig, recognizeCaptcha } from './lib/vision-ocr.cjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SD = path.join(ROOT, 'test-screenshots');
const LOG_DIR = path.join(ROOT, 'logs');
const STATE_FILE = path.join(ROOT, 'local', 'storage-state.json');
const ACCOUNT_FILE = path.join(ROOT, 'local', 'yhw_account.json');
const SCRIPT_FILE = path.join(ROOT, 'hua-yi-helper.user.js');
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
const LOG_FILE = path.join(LOG_DIR, 'auto-looper.log');

// ── CLI 配置 ──
const args = process.argv.slice(2);
function argVal(name) {
  const i = args.indexOf('--' + name);
  return i >= 0 ? args[i + 1] : undefined;
}
const CONFIG = {
  headless: args.includes('--headless'),
  dryRun: args.includes('--dry-run'),
  rounds: parseInt(argVal('rounds'), 10) || Infinity,
  mode: parseInt(argVal('mode'), 10) || 2,
  pollMs: 60_000,          // 巡检间隔
  evaluateTimeout: 10_000, // 页面 evaluate 超时
  stallReloadAfter: 3,     // 连续 N 次 evaluate 超时 → reload
  videoIdleMs: 5 * 60_000, // 视频 currentTime 停滞阈值
  doneConfirmRounds: 3,    // "全部完成"连续确认轮数
};

// ── 环境变量（scripts/.env.local） ──
function loadEnv() {
  const env = {};
  try {
    const c = fs.readFileSync(path.join(ROOT, 'scripts', '.env.local'), 'utf-8');
    for (const line of c.split('\n')) {
      const t = line.trim();
      const i = t.indexOf('=');
      if (i > 0 && !t.startsWith('#')) env[t.slice(0, i)] = t.slice(i + 1);
    }
  } catch (e) {}
  return env;
}
const ENV = loadEnv();
const RESEND_API_KEY = ENV.RESEND_API_KEY || '';
const RESEND_FROM = ENV.RESEND_FROM || '';
const RESEND_TO = ENV.RESEND_TO || '';
const scriptContent = fs.readFileSync(SCRIPT_FILE, 'utf-8');

// ── 站点域名（必填）──
// 华医网按地区划分子域（形如 cmeXX.91huayi.com，各地区数字不同），
// 因此不内置任何默认值：从 scripts/.env.local 的 HUAYI_HOST 读取。
// 查法：浏览器登录后看地址栏，把主机名整段填进去。
const HUAYI_HOST = (ENV.HUAYI_HOST || '').trim().replace(/^https?:\/\//, '').replace(/\/+$/, '');
if (!HUAYI_HOST) {
  console.error('[配置错误] 未设置 HUAYI_HOST。');
  console.error('请在 scripts/.env.local 中添加：HUAYI_HOST=cmeXX.91huayi.com');
  console.error('（把 XX 换成你实际看到的数字：浏览器登录华医网后，地址栏里的主机名就是它）');
  process.exit(1);
}
const LIST_URL = `https://${HUAYI_HOST}/pages/cme.aspx`;
const LOGIN_URL = `https://${HUAYI_HOST}/secure/login.aspx`;
const ENV_PATH = path.join(ROOT, 'scripts', '.env.local');

/**
 * 登录成功后自动检测 cmeXX 主机名并写入 .env.local。
 * 用户无需手动查找地址栏——脚本自动记住。
 */
async function autoDetectHost(page) {
  try {
    // 等待重定向链完成：用户可能从 www.91huayi.com 或 hysslogin 登录，
    // 会经过多次跳转才到达 cmeXX.91huayi.com。最多等 15 秒。
    let host = '';
    let m = null;
    for (let i = 0; i < 15; i++) {
      host = await page.evaluate(() => window.location.hostname);
      m = host.match(/^(cme\d+\.91huayi\.com)$/);
      if (m) break;
      await sleep(1000);
    }
    if (!m) { log(`⚠️ 等待超时，当前主机名 "${host}"，非 cmeXX 格式，跳过自动写入`, 'WARN'); return; }
    const detected = m[1];
    if (detected === HUAYI_HOST) { log(`✔ HUAYI_HOST 已正确配置: ${detected}`); return; }
    // 更新 .env.local（先删所有 HUAYI_HOST 行再统一加一行，避免重复空行）
    let env = '';
    try { env = fs.readFileSync(ENV_PATH, 'utf-8'); } catch (e) { env = ''; }
    env = env.replace(/^HUAYI_HOST=.*$/gm, '').trimEnd();
    env += `\nHUAYI_HOST=${detected}\n`;
    fs.writeFileSync(ENV_PATH, env, 'utf-8');
    log(`✨ 已自动更新 HUAYI_HOST: ${HUAYI_HOST || '(空)'} → ${detected}`);
  } catch (e) {
    log('⚠️ 自动检测主机名失败: ' + e.message, 'WARN');
  }
}

// ── 验证码识别（可选，OpenAI 兼容通用配置；未配置则降级为人工输入） ──
const VISION = loadVisionConfig(path.join(ROOT, 'scripts', '.env.local'));
// 未配置视觉识别时无法在无头浏览器里人工输码 → 强制关闭无头
if (!VISION.enabled && CONFIG.headless) {
  CONFIG.headless = false;
  CONFIG.forcedHeadful = true;
}

// ── 日志（北京时间 GMT+8） ──
function ts() {
  const d = new Date(Date.now() + 8 * 3600 * 1000);
  return d.toISOString().replace('T', ' ').slice(0, 19);
}
function log(msg, level = 'INFO') {
  const line = `[${ts()}] [${level}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(LOG_FILE, line + '\n'); } catch (e) {}
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

/** 账号脱敏：身份证/手机号等只保留头尾，避免明文出现在邮件里 */
function maskAccount(s) {
  const v = String(s || '');
  if (v.length <= 6) return '***';
  return v.slice(0, 3) + '*'.repeat(Math.max(3, v.length - 6)) + v.slice(-3);
}


// ── 邮件通知（可选；收发地址一律从 .env.local 读，不走命令行以免出现在进程/日志中） ──
async function sendMail(subject, body) {
  if (!RESEND_API_KEY || !RESEND_FROM || !RESEND_TO) {
    const miss = [
      !RESEND_API_KEY && 'RESEND_API_KEY',
      !RESEND_FROM && 'RESEND_FROM',
      !RESEND_TO && 'RESEND_TO',
    ].filter(Boolean).join(', ');
    log(`[通知跳过] 邮件未配置（缺 ${miss}），仅记录日志。${subject}`, 'WARN');
    return false;
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: RESEND_FROM,
        to: RESEND_TO.split(',').map(s => s.trim()).filter(Boolean),
        subject,
        text: body,
      }),
    });
    const ok = res.ok;
    log(`邮件发送${ok ? '成功' : '失败(' + res.status + ')'}: ${subject}`, ok ? 'INFO' : 'WARN');
    return ok;
  } catch (e) { log('邮件发送异常: ' + e.message, 'WARN'); return false; }
}

// ── 自动登录（session 过期兜底；成功后导出新 storageState） ──
async function ensureLoggedIn(ctx) {
  const account = JSON.parse(fs.readFileSync(ACCOUNT_FILE, 'utf-8'));
  const page = await ctx.newPage();
  log('打开登录页，开始自动登录...');
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  await page.evaluate(() => {
    const t = document.getElementById('type_pwd');
    if (t) { t.style.display = ''; t.click(); }
    document.querySelectorAll('.card_box').forEach(c => { if (c.querySelector('#txt_user_pwd')) c.style.display = 'block'; });
  });
  await page.waitForTimeout(1500);

  // 横幅：自动识别 or 提示人工输码
  await page.evaluate((auto) => {
    const b = document.createElement('div');
    b.id = '__looper_login_banner__';
    b.style.cssText = 'position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483647!important;color:#fff!important;text-align:center!important;padding:12px!important;font:bold 16px "Microsoft YaHei",sans-serif!important;';
    b.style.background = auto ? '#ff1744' : '#1976d2';
    b.textContent = auto
      ? '🤖 调度器自动登录中（AI 识别验证码），请勿操作'
      : '👤 请手动输入图形验证码并点击登录（账号密码已填好，登录后调度器会自动继续刷课）';
    (document.body || document.documentElement).appendChild(b);
  }, VISION.enabled);

  await page.evaluate((acc) => {
    const u = document.getElementById('txt_user_name');
    if (u) { u.value = acc.hyw_account; u.dispatchEvent(new Event('input', { bubbles: true })); }
    const p = document.getElementById('txt_user_pwd');
    if (p) { p.value = acc.hyw_password; p.dispatchEvent(new Event('input', { bubbles: true })); p.dispatchEvent(new Event('change', { bubbles: true })); }
    const r = document.getElementById('txt_user_pwd_real');
    if (r) r.value = acc.hyw_password;
  }, account);
  await page.waitForTimeout(500);
  await page.evaluate(() => {
    const cb = document.getElementById('agree1');
    if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
  });

  let ok = false;
  if (!VISION.enabled) {
    // 人工模式：等待用户在窗口里输码登录（最长 10 分钟，调度器期间挂起等待）
    log('验证码自动识别未配置 → 等待人工输入验证码（最长 10 分钟）...', 'WARN');
    const deadline = Date.now() + 600000;
    while (Date.now() < deadline) {
      if (!page.url().includes('login.aspx')) {
        // 可能仍在跳转中，等页面稳定后再继续（避免后续操作撞上销毁的上下文）
        await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
        await sleep(2000);
        ok = true;
        break;
      }
      await sleep(2000);
    }
    if (!ok) log('人工登录等待超时', 'ERROR');
  } else for (let i = 1; i <= 5 && !ok; i++) {
    log(`验证码识别第 ${i} 次...`);
    const img = await page.$('#yzm_img');
    if (!img) { log('找不到验证码元素', 'WARN'); break; }
    const buf = await img.screenshot();
    let code = '';
    try { code = await recognizeCaptcha(VISION, buf.toString('base64')); log('识别结果: ' + code); }
    catch (e) { log('视觉接口失败: ' + e.message, 'WARN'); }
    if (!code) { await page.click('#yzm_img'); await page.waitForTimeout(1500); continue; }

    await page.evaluate((c) => {
      const inp = document.getElementById('txt_img_code');
      if (inp) { inp.value = c; inp.dispatchEvent(new Event('input', { bubbles: true })); }
    }, code);
    await page.waitForTimeout(300);
    await page.evaluate(() => {
      // 登录按钮兼容两代结构：旧版 button.btn_login（部分区域子域可能未改版）；
      // 2026.11 起密码卡片内是无 id/class 的 <button>登 录</button>，按文本+可见性匹配
      const btns = document.querySelectorAll('button.btn_login');
      for (const b of btns) { const r = b.getBoundingClientRect(); if (r.width > 100 && r.y > 100) { b.click(); return; } }
      const card = Array.from(document.querySelectorAll('.card_box')).find(c => c.querySelector('#txt_user_pwd'));
      const scope = card || document;
      for (const b of scope.querySelectorAll('button')) {
        const t = (b.textContent || '').replace(/\s+/g, '');
        const r = b.getBoundingClientRect();
        if (t === '登录' && r.width > 0) { b.click(); return; }
      }
    });
    await page.waitForTimeout(4000);
    if (!page.url().includes('login.aspx')) { ok = true; break; }
    await page.evaluate(() => { document.querySelectorAll('.layui-layer-btn0').forEach(b => b.click()); });
    await page.click('#yzm_img');
    await page.waitForTimeout(1500);
  }

  if (!ok) { log(VISION.enabled ? '自动登录失败（5 次验证码未通过）' : '登录失败（人工输入超时）', 'ERROR'); await page.close().catch(() => {}); return false; }
  log('✅ 自动登录成功: ' + page.url());
  // 自动检测 cmeXX 主机名并写入 .env.local（首次运行时用户无需手动配置）
  await autoDetectHost(page);
  try { await ctx.storageState({ path: STATE_FILE }); log('已导出新 storage-state.json'); } catch (e) { log('导出 storageState 失败: ' + e.message, 'WARN'); }
  await page.close().catch(() => {});
  return true;
}

// ── 页面查找工具 ──
function openPages(ctx) { return ctx.pages().filter(p => !p.isClosed()); }

// ── 页面 console 转发：课堂问答/自动答题等关键消息写入日志（幂等） ──
function hookConsole(page) {
  if (page.__looperConsoleHooked) return;
  page.__looperConsoleHooked = true;
  page.on('console', (msg) => {
    const t = msg.text();
    if (/课堂问答|自动答题|签到/.test(t)) log('[页面] ' + t);
  });
}
function hookAllPages(ctx) {
  for (const p of openPages(ctx)) hookConsole(p);
}
function isLoginUrl(u) { return /login\.aspx|hysslogin/i.test(u); }
function isVideoUrl(u) { return /course_ware_(polyv|cc)\.aspx/i.test(u); }
function isDetailUrl(u) { return /course\.aspx/i.test(u); }
function isListUrl(u) { return /cme\.aspx/i.test(u); }

async function safeEval(page, fn, arg) {
  try { return await page.evaluate(fn, arg); } catch (e) { return undefined; }
}

/** 检测是否有页面处于登录态失效（登录页 or 游客视图 or 页面内"会话过期"提示） */
async function detectLoggedOut(ctx) {
  for (const p of openPages(ctx)) {
    const u = p.url();
    if (isLoginUrl(u)) return true;
    const hasForm = await safeEval(p, () => !!document.getElementById('txt_user_pwd'));
    if (hasForm) return true;
    // 游客视图检测：storageState 失效时 cme.aspx 不跳登录页，但显示"登录 注册"且无用户操作入口
    const guest = await safeEval(p, () => {
      const t = document.body.textContent || '';
      return t.includes('登录') && t.includes('注册') && !t.includes('退出') && !t.includes('注销');
    });
    if (guest) return true;
    // 页面内会话过期提示：仅检查弹窗/提示层内容（短文本），避免页面正文"登录"导航文案误报
    const kickedDialog = await safeEval(p, () => {
      const sel = '.layui-layer-content, .layer-content, .layui-layer-dialog, [class*="dialog"] [class*="content"], .mess';
      for (const el of document.querySelectorAll(sel)) {
        const t = (el.textContent || '').trim();
        if (!t || t.length > 300) continue;
        if (/登录(已)?过期|会话(已)?失效|请(先)?登录|重新登录|登录状态已失效/.test(t)) return true;
      }
      return false;
    });
    if (kickedDialog) { log('检测到会话过期弹窗: ' + u, 'WARN'); return true; }
  }
  return false;
}

/** 打开课程列表页并确保主脚本工作（注入依赖 addInitScript 已在 context 全局） */
async function openListPage(ctx) {
  let page = openPages(ctx).find(p => isListUrl(p.url()));
  if (!page) page = openPages(ctx)[0] || await ctx.newPage();
  await page.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(2500);
  await safeEval(page, () => { document.querySelectorAll('.layui-layer-btn0').forEach(b => b.click()); });
  await safeEval(page, (m) => { localStorage.setItem('华医mode', String(m)); }, CONFIG.mode);
  // 非 headless 时挂"刷课中"横幅
  if (!CONFIG.headless) {
    await safeEval(page, () => {
      if (document.getElementById('__looper_banner__')) return;
      const b = document.createElement('div');
      b.id = '__looper_banner__';
      b.style.cssText = 'position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483647!important;background:#4caf50!important;color:#fff!important;text-align:center!important;padding:8px!important;font:bold 14px "Microsoft YaHei",sans-serif!important;';
      b.textContent = '🤖 子川助手自动刷课中（无人值守），请勿操作本浏览器窗口';
      document.body.appendChild(b);
    });
  }
  await page.waitForTimeout(4000);
  return page;
}

/** 从页面提取课程状态按钮文本（用于完成判定） */
async function collectStatusTexts(page) {
  return safeEval(page, () => {
    const out = [];
    for (const b of document.querySelectorAll('button, input[type="button"]')) {
      const t = (b.value || b.textContent || '').trim();
      if (t) out.push(t);
    }
    return out;
  }, []);
}

const TODO_RE = /未学习|学习中|待考试|播放至|继续学习/;

/** 判定：cme.aspx 是否还有未完成课程 */
async function hasTodoOnList(page) {
  const texts = await collectStatusTexts(page);
  return texts.some(t => TODO_RE.test(t));
}

/** 判定：course.aspx 详情页是否已无未完成课时 */
async function isDetailAllDone(page) {
  const texts = await collectStatusTexts(page);
  return texts.length > 0 && !texts.some(t => TODO_RE.test(t));
}

// ── 状态导出（agent/skill 可识别接口）：logs/auto-looper-status.json ──
function pageType(u) {
  if (isLoginUrl(u)) return 'login';
  if (isVideoUrl(u)) return 'video';
  if (isDetailUrl(u)) return 'detail';
  if (isListUrl(u)) return 'list';
  return 'other';
}
async function writeStatus(ctx, opts = {}) {
  try {
    const status = {
      ts: new Date().toISOString(),
      tsLocal: ts(),
      state: opts.state || 'RUNNING',
      round: opts.round ?? null,
      roundsLimit: opts.roundsLimit ?? null,
      loggedIn: opts.loggedIn ?? null,
      message: opts.message || '',
      pages: [],
      todos: { listHasTodo: opts.listHasTodo ?? null },
      video: opts.video || null,
      overall: opts.overall || null, // { overallPct, totalMin, completedMin, remainHours, avgDurMin }
    };
    for (const p of openPages(ctx)) {
      const u = p.url();
      const entry = { url: u, type: pageType(u) };
      if (entry.type === 'video') {
        const st = await safeEval(p, () => {
          const v = document.querySelector('video');
          return v ? {
            currentTime: Math.round(v.currentTime || 0),
            duration: Math.round(v.duration || 0),
            paused: v.paused,
            status: (document.querySelector('li.current-playing button') || {}).textContent || '',
          } : null;
        });
        if (st) Object.assign(entry, st);
      }
      status.pages.push(entry);
    }
    fs.writeFileSync(path.join(LOG_DIR, 'auto-looper-status.json'), JSON.stringify(status, null, 2));
  } catch (e) { /* 状态写入失败不影响主流程 */ }
}

// ── 主流程 ──
async function main() {
  log(`════ 子川助手·自动闭环调度器启动 ════`);
  log(`配置: headless=${CONFIG.headless} dryRun=${CONFIG.dryRun} rounds=${CONFIG.rounds} mode=${CONFIG.mode} host=${HUAYI_HOST}`);
  log(`邮件通知: ${RESEND_API_KEY && RESEND_FROM && RESEND_TO ? '已配置' : '未配置（仅写日志）'}`);
  // 可选功能状态自检（验证码自动识别）
  for (const line of describeVisionConfig(VISION).split('\n')) log(line);
  if (CONFIG.forcedHeadful) {
    log('已忽略 --headless：未配置验证码自动识别时必须显示窗口，否则无法人工输码。', 'WARN');
    log('登录成功后登录态会存入 local/storage-state.json，之后即可正常使用 --headless。', 'WARN');
  }

  const browser = await chromium.launch({
    headless: CONFIG.headless,
    args: ['--disable-blink-features=AutomationControlled'],
  });

  // 首次 newContext 即注入 storageState（若存在）
  const ctxOptions = {
    viewport: { width: 1600, height: 900 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  };
  if (fs.existsSync(STATE_FILE)) ctxOptions.storageState = STATE_FILE;
  const ctx = await browser.newContext(ctxOptions);
  await ctx.addInitScript(() => {
    try { Object.defineProperty(navigator, 'webdriver', { get: () => false, configurable: true }); } catch (e) {}
  });

  // ★ 全局注入主脚本：仅在华医网域（91huayi.com）的页面 document-start 注入，
  //   避免 about:blank / 其他域页面执行主脚本产生 localStorage 噪音错误
  if (!fs.existsSync(SCRIPT_FILE)) { log('找不到主脚本文件: ' + SCRIPT_FILE, 'ERROR'); await browser.close(); process.exit(1); }
  await ctx.addInitScript({ content: `if (location.hostname.indexOf('91huayi.com') !== -1) {\n${scriptContent}\n}` });
  log('主脚本已全局注入（addInitScript，document-start，仅 91huayi.com）');

  // 新标签页追踪 + console 转发
  ctx.on('page', (p) => {
    log('🔔 新标签页: ' + p.url());
    hookConsole(p);
    p.on('pageerror', e => log('页面错误: ' + e.message, 'WARN'));
  });
  // 巡检前先挂一遍（覆盖已存在页面）
  hookAllPages(ctx);

  // 首次打开课程列表（若 storageState 失效会自动走登录）
  let listPage = await openListPage(ctx);
  if (await detectLoggedOut(ctx)) {
    log('检测到登录态失效，自动重新登录...');
    const okLogin = await ensureLoggedIn(ctx);
    if (!okLogin) { await sendMail('华医网刷课：登录失败', VISION.enabled ? '5 次验证码均未通过，需要人工介入。' : '未配置验证码自动识别，且人工输入超时。'); await browser.close(); process.exit(1); }
    listPage = await openListPage(ctx);
  }

  // 初始扫描结果
  const initTodo = await hasTodoOnList(listPage);
  log(`初始状态: 课程列表${initTodo ? '存在未完成课程' : '未发现未完成课程（可能已全部刷完）'}`);
  await writeStatus(ctx, { round: 0, roundsLimit: CONFIG.rounds, loggedIn: !(await detectLoggedOut(ctx)), listHasTodo: initTodo, message: '初始化完成', overall: null });

  // ── 巡检循环 ──
  let round = 0;
  let stallCount = 0;
  let doneConfirm = 0;
  let lastVideoT = {}; // url -> { t, at }
  let lastProgress = {}; // url -> { done, learning, notDone, exam, total, title }（用于"刷完一课"检测）

  while (round < CONFIG.rounds) {
    round++;
    log(`\n════ 巡检轮次 ${round}/${CONFIG.rounds === Infinity ? '∞' : CONFIG.rounds} ════`);

    // 1) session 检查
    if (await detectLoggedOut(ctx)) {
      log('⚠️ 被踢回登录页（session 过期），自动重登...');
      const ok = await ensureLoggedIn(ctx);
      if (!ok) { await sendMail('华医网刷课：自动登录失败', '需要人工介入。'); break; }
      listPage = await openListPage(ctx);
    }

    // 2) 视频页健康检查 + 课时进度统计（"刷完一课"检测）
    const videoPages = openPages(ctx).filter(p => isVideoUrl(p.url()));
    for (const vp of videoPages) {
      const st = await safeEval(vp, () => {
        const v = document.querySelector('video');
        return v ? { t: v.currentTime || 0, paused: v.paused, dur: v.duration || 0, status: (document.querySelector('li.current-playing button') || {}).textContent || '' } : null;
      }, null);
      if (!st) { stallCount++; if (stallCount >= CONFIG.stallReloadAfter) { log('视频页无响应，reload', 'WARN'); await vp.reload().catch(() => {}); stallCount = 0; } continue; }
      stallCount = 0;
      const key = vp.url();
      const prev = lastVideoT[key];
      lastVideoT[key] = { t: st.t, at: Date.now() };
      if (st.paused && !/已完成|待考试/.test(st.status)) {
        log('视频意外暂停，恢复播放', 'WARN');
        await safeEval(vp, () => { const v = document.querySelector('video'); if (v) { v.muted = true; v.play().catch(() => {}); } });
      }
      if (prev && Math.abs(st.t - prev.t) < 0.5 && Date.now() - prev.at > CONFIG.videoIdleMs) {
        log(`视频进度停滞(${st.t.toFixed(0)}s/${st.dur.toFixed(0)}s)，reload 恢复`, 'WARN');
        await vp.reload().catch(() => {});
        delete lastVideoT[key];
      }

      // 【新增】课时进度统计：检测"刚刷完一节" + 计算总体进度（精确到分钟）
      const prog = await safeEval(vp, () => {
        const lis = document.querySelectorAll('li.lis-inside-content');
        let done = 0, learning = 0, notDone = 0, exam = 0;
        for (const li of lis) {
          const s = ((li.querySelector('button') || {}).textContent || '').trim();
          if (s.indexOf('已完成') !== -1) done++;
          else if (s.indexOf('学习中') !== -1) learning++;
          else if (s.indexOf('未学习') !== -1) notDone++;
          else if (s.indexOf('待考试') !== -1) exam++;
        }
        const cur = document.querySelector('li.lis-inside-content.current-playing h2, li.lis-inside-content.current-playing');
        // 折叠所有空白（含换行）：li.textContent 会带换行，否则日志被截成两行、正则无法整行匹配
        const norm = (s) => (s || '').replace(/\s+/g, ' ').trim().slice(0, 40);
        const title = cur ? norm(cur.textContent) : norm(document.title);
        return { done, learning, notDone, exam, total: lis.length, title };
      }, null);
      if (prog && prog.total > 0) {
        const pk = 'prog:' + key;
        const prevProg = lastProgress[pk];
        lastProgress[pk] = prog;
        const vpct = st.dur > 0 ? Math.round(st.t / st.dur * 100) : 0;
        const remaining = prog.notDone + prog.learning + prog.exam;

        // ── 总体进度计算（基于视频 duration 累加，非简单计数）──
        const avgDurMin = st.dur > 0 ? st.dur / 60 : 45; // 当前课时长度（分钟），兜底 45 分钟
        const totalMin = Math.round(prog.total * avgDurMin); // 本包总分钟数
        const completedMin = Math.round(prog.done * avgDurMin + st.t / 60); // 已完成分钟（已完成课时 + 当前播放）
        const overallPct = totalMin > 0 ? Math.round(completedMin / totalMin * 100) : 0;
        const remainHours = totalMin > completedMin ? ((totalMin - completedMin) / 60).toFixed(1) : '0';

        // 每轮输出当前状态：正在学什么 + 进度 + 总体进度
        log(`📺 正在学习: ${prog.title || '(未知)'} | 视频 ${vpct}% (${Math.round(st.t)}s/${Math.round(st.dur)}s) | 本包 ${prog.done}/${prog.total} | 总进度 ${overallPct}%（${completedMin}分/${totalMin}分），剩余约 ${remainHours}h`);
        if (prevProg && prog.done > prevProg.done) {
          log(`✅ 已刷完课程: ${prog.title || '(未知)'} | 本包已完成 ${prog.done}/${prog.total}，剩余 ${remaining} 节`);
        }

        // 传递总体进度给 status.json
        // 同时落盘课时明细（title/done/total/learning/notDone/exam/视频秒数），
        // 让外部保活检查只读 status.json 即可，无需解析日志文本
        lastProgress.__overall = {
          overallPct,
          totalMin,
          completedMin,
          remainHours,
          avgDurMin: Math.round(avgDurMin),
          title: prog.title || '',
          done: prog.done,
          total: prog.total,
          remaining,
          learning: prog.learning,
          notDone: prog.notDone,
          exam: prog.exam,
          videoPct: vpct,
          videoCur: Math.round(st.t),
          videoDur: Math.round(st.dur),
        };
      }
    }

    // 3) 详情页（course.aspx）检查：无未完成课时 → 回列表
    const detailPages = openPages(ctx).filter(p => isDetailUrl(p.url()));
    for (const dp of detailPages) {
      const done = await isDetailAllDone(dp);
      if (done) {
        log('课程包内课时已全部完成，回到课程列表扫描下一包');
        await dp.goto(LIST_URL, { waitUntil: 'domcontentloaded', timeout: 30000 }).catch(() => {});
      }
    }

    // 4) 完成判定（cme.aspx）
    if (listPage && !listPage.isClosed()) {
      const todo = await hasTodoOnList(listPage);
      if (!todo) {
        doneConfirm++;
        log(`课程列表无未完成课程（连续确认 ${doneConfirm}/${CONFIG.doneConfirmRounds}）`);
        if (doneConfirm >= CONFIG.doneConfirmRounds) {
          log('🎉 全部课程已刷完！');
          await sendMail('华医网刷课完成 ✅', `所有课程已刷完（${new Date().toLocaleString('zh-CN')}）。\n账号：${maskAccount(JSON.parse(fs.readFileSync(ACCOUNT_FILE, 'utf-8')).hyw_account)}`);
          break;
        }
      } else {
        doneConfirm = 0;
        log('仍有未完成课程，主脚本继续自动刷课中...');
      }
    }

    if (CONFIG.dryRun) { log('dry-run 模式：链路验证完成，退出'); break; }

    // 状态导出（agent/skill 接口）
    await writeStatus(ctx, {
      round, roundsLimit: CONFIG.rounds,
      loggedIn: !(await detectLoggedOut(ctx)),
      listHasTodo: listPage && !listPage.isClosed() ? await hasTodoOnList(listPage) : null,
      message: '巡检中',
      video: lastVideoT,
      overall: lastProgress.__overall || null,
    });

    await sleep(CONFIG.pollMs);
  }

  // ── 收尾 ──
  await browser.close();
  log('════ 调度器退出 ════');
  process.exit(0);
}

main().catch(async (e) => {
  log('调度器异常: ' + (e.stack || e.message), 'ERROR');
  await sendMail('华医网刷课：调度器异常', String(e.stack || e.message));
  process.exit(1);
});
