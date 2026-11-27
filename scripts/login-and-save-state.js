/**
 * 现场登录华医网 → 登录成功后导出新 storage-state.json
 * 用法: node scripts/login-and-save-state.js
 * 产出: local/storage-state.json（新快照，覆盖前自动备份旧文件）
 *
 * 验证码处理有两种模式，取决于 scripts/.env.local 是否配置了视觉模型：
 *   ① 已配置 VISION_BASE_URL / VISION_MODEL / VISION_API_KEY
 *      → 自动识别验证码，全程无需人工干预
 *   ② 未配置
 *      → 浏览器窗口保持打开，账号密码已自动填好，请人工输入验证码并点击登录
 * 详见 scripts/lib/vision-ocr.cjs 顶部的配置说明。
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');
const {
  loadVisionConfig,
  describeVisionConfig,
  recognizeCaptcha,
} = require('./lib/vision-ocr.cjs');

const ROOT = path.join(__dirname, '..');
const SD = path.join(ROOT, 'test-screenshots');
const STATE = path.join(ROOT, 'local', 'storage-state.json');
const ENV_PATH = path.join(ROOT, 'scripts', '.env.local');
const LOG_DIR = path.join(ROOT, 'logs');
if (!fs.existsSync(SD)) fs.mkdirSync(SD, { recursive: true });
if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

// ── 日志工具 ──
function ts() { const d = new Date(Date.now() + 8 * 3600 * 1000); return d.toISOString().replace('T', ' ').slice(0, 19); }
function log(msg, level = 'INFO') {
  const line = `[${ts()}] [${level}] ${msg}`;
  console.log(line);
  try { fs.appendFileSync(path.join(LOG_DIR, 'login-test.log'), line + '\n'); } catch (e) {}
}

const account = JSON.parse(fs.readFileSync(path.join(ROOT, 'local', 'yhw_account.json'), 'utf-8'));

// 站点域名：华医网按地区划分子域（形如 cmeXX.91huayi.com，各地区数字不同）。
// 首次运行时可为空——脚本会打开浏览器让你手动导航到登录页，登录成功后自动检测并写入。
const HUAYI_HOST = (() => {
  try {
    const m = fs.readFileSync(ENV_PATH, 'utf-8').match(/^HUAYI_HOST=(.+)$/m);
    return m ? m[1].trim().replace(/^https?:\/\//, '').replace(/\/+$/, '') : '';
  } catch (e) { return ''; }
})();
// 登录入口：
//   已配置 HUAYI_HOST → 直接用 cmeXX 子域登录页（自动填账号密码）
//   未配置            → 用 www.91huayi.com 入口，等用户手动导航到登录页
const LOGIN_URL = HUAYI_HOST ? `https://${HUAYI_HOST}/secure/login.aspx` : '';
const HOME_URL = HUAYI_HOST ? `https://${HUAYI_HOST}/cme/index` : '';
const ENTRY_URL = 'https://www.91huayi.com'; // 首次运行入口

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
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!m) { console.log(`⚠️ 等待超时，当前主机名 "${host}"，非 cmeXX 格式，跳过自动写入`); return; }
    const detected = m[1];
    if (detected === HUAYI_HOST) { console.log(`✔ HUAYI_HOST 已正确配置: ${detected}`); return; }
    // 更新 .env.local（处理可能存在的重复空行）
    let env = '';
    try { env = fs.readFileSync(ENV_PATH, 'utf-8'); } catch (e) { env = ''; }
    // 先删除所有 HUAYI_HOST 行，再统一加一行正确的
    env = env.replace(/^HUAYI_HOST=.*$/gm, '').trimEnd();
    env += `\nHUAYI_HOST=${detected}\n`;
    fs.writeFileSync(ENV_PATH, env, 'utf-8');
    console.log(`✨ 已自动更新 HUAYI_HOST: ${HUAYI_HOST || '(空)'} → ${detected}`);
    console.log(`   下次运行无需手动配置站点域名。`);
  } catch (e) {
    console.log('⚠️ 自动检测主机名失败: ' + e.message);
  }
}

// 视觉识别配置（可选）：未配置则降级为人工输入验证码
const VISION = loadVisionConfig(path.join(ROOT, 'scripts', '.env.local'));
console.log(describeVisionConfig(VISION));
console.log('');

/** 人工输入验证码模式：等待用户自行完成登录（最长 5 分钟） */
async function waitForManualLogin(page, timeoutMs = 300000) {
  console.log('👤 人工模式：账号密码已自动填好，请在浏览器窗口中输入验证码并点击登录。');
  console.log(`   等待中（最长 ${Math.round(timeoutMs / 60000)} 分钟）...`);
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (!page.url().includes('login.aspx')) {
      // 此刻可能仍在跳转中：等页面稳定后再返回，否则后续 page.evaluate
      // 会撞上被销毁的执行上下文（Execution context was destroyed）
      await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
      await page.waitForTimeout(2000);
      return true;
    }
    await page.waitForTimeout(2000);
  }
  console.log('⏰ 等待超时，未检测到登录成功。');
  return false;
}



(async () => {
  console.log('🧪 启动 Chromium...');
  const browser = await chromium.launch({ headless: false, args: ['--disable-blink-features=AutomationControlled'] });
  const ctx = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  });
  await ctx.addInitScript(() => { Object.defineProperty(navigator, 'webdriver', { get: () => false }); });
  const page = await ctx.newPage();

  // ── 首次运行（HUAYI_HOST 为空）：自动导航到登录入口，等用户完成登录 ──
  if (!HUAYI_HOST) {
    log('');
    log('════ 首次运行：HUAYI_HOST 未配置 ════');
    log('脚本将自动打开华医网并引导完成登录。');

    // 第 1 步：打开 www.91huayi.com
    log('[步骤1] 打开 www.91huayi.com...');
    await page.goto(ENTRY_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
    await page.waitForTimeout(3000);
    log('[步骤1] 当前 URL: ' + page.url());

    // 提示横幅：告知用户脚本正在自动导航
    await page.evaluate(() => {
      const b = document.createElement('div');
      b.id = '__auto_login_banner__';
      b.style.cssText = 'position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483647!important;background:#4caf50!important;color:#fff!important;text-align:center!important;padding:12px!important;font:bold 16px/1.4 "Microsoft YaHei",sans-serif!important;box-shadow:0 2px 8px rgba(0,0,0,.4)!important;';
      b.innerHTML = '🤖 子川助手·正在自动导航到登录页<br><span style="font-size:13px;font-weight:normal;opacity:.95;">请勿操作浏览器，脚本会自动完成后续步骤</span>';
      (document.body || document.documentElement).appendChild(b);
    });

    // 第 2 步：关闭可能的弹窗，然后点击"继续教育"
    log('[步骤2] 关闭弹窗 + 点击"继续教育"...');
    await page.evaluate(() => {
      document.querySelectorAll('.layui-layer-btn0, .layui-layer-close, [class*="close"]').forEach(b => b.click());
    });
    await page.waitForTimeout(1000);
    await page.evaluate(() => {
      const links = document.querySelectorAll('a');
      for (const a of links) {
        if (a.textContent.trim() === '继续教育') { a.click(); return; }
      }
    });
    await page.waitForTimeout(3000);
    log('[步骤2] 当前 URL: ' + page.url());

    // 第 3 步：点击弹窗中的"去登录"
    log('[步骤3] 点击"去登录"...');
    await page.evaluate(() => {
      const all = document.querySelectorAll('button, a, div, span');
      for (const b of all) {
        const t = (b.textContent || '').trim();
        if (t === '去登录' || t === '去 登录') { b.click(); return; }
      }
    });
    await page.waitForTimeout(5000);
    log('[步骤3] 当前 URL: ' + page.url());

    // 第 4 步：hysslogin 页面 —— Vue 实例直接操作
    log('[步骤4] 等待 hysslogin 页面...');
    for (let i = 0; i < 15; i++) {
      try {
        const u = page.url();
        if (u.includes('hysslogin')) { log('[步骤4] 已到达 hysslogin: ' + u.split('?')[0]); break; }
      } catch (e) {}
      await new Promise(r => setTimeout(r, 1000));
    }
    await new Promise(r => setTimeout(r, 3000));

    log('[步骤4] 切换到密码登录 + 填入账号密码...');
    await page.evaluate((acc) => {
      return new Promise((resolve) => {
        let tries = 0;
        function waitVue() {
          tries++;
          const app = document.getElementById('app');
          if (app && app.__vue__) {
            const vm = app.__vue__;
            try { vm.toPass(); } catch (e) {}
            setTimeout(() => {
              try {
                vm.user.userName = acc.hyw_account;
                vm.user.password = acc.hyw_password;
                if ('displayValue' in vm) vm.displayValue = acc.hyw_password;
                vm.check = true;
                console.log('[步骤4] Vue 填值成功');
              } catch (e) { console.error('[步骤4] Vue 填值失败:', e); }
              resolve();
            }, 800);
          } else if (tries > 120) {
            console.error('[步骤4] 等待 Vue 实例超时');
            resolve();
          } else {
            setTimeout(waitVue, 150);
          }
        }
        waitVue();
      });
    }, account);
    await new Promise(r => setTimeout(r, 1000));
    log('[步骤4] 账号密码已填入，当前 URL: ' + page.url());

    // 显示提示横幅
    await page.evaluate((autoOcr) => {
      const b = document.createElement('div');
      b.id = '__auto_login_banner__';
      b.style.cssText = 'position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483647!important;color:#fff!important;text-align:center!important;padding:12px!important;font:bold 16px/1.4 "Microsoft YaHei",sans-serif!important;box-shadow:0 2px 8px rgba(0,0,0,.4)!important;';
      if (autoOcr) {
        b.style.background = '#ff1744';
        b.innerHTML = '🤖 账号密码已填好，AI 正在自动识别验证码<br><span style="font-size:13px;font-weight:normal;opacity:.95;">请勿操作键盘鼠标，登录成功后会自动保存配置</span>';
      } else {
        b.style.background = '#1976d2';
        b.innerHTML = '👤 账号密码已填好，请手动输入验证码并点击登录<br><span style="font-size:13px;font-weight:normal;opacity:.95;">登录成功后脚本会自动检测并保存配置</span>';
      }
      (document.body || document.documentElement).appendChild(b);
    }, VISION.enabled);

    // hysslogin 验证码处理
    if (VISION.enabled) {
      for (let attempt = 1; attempt <= 5; attempt++) {
        log(`[步骤4-OCR] 验证码识别第 ${attempt} 次...`);
        const captchaImg = await page.$('#imgVerify');
        if (!captchaImg) { log('[步骤4-OCR] 找不到 #imgVerify', 'WARN'); break; }
        await new Promise(r => setTimeout(r, 1500));
        const buf = await captchaImg.screenshot();

        let code = '';
        try {
          code = await recognizeCaptcha(VISION, buf.toString('base64'));
          log(`[步骤4-OCR] AI识别: "${code}"`);
        } catch (e) {
          log('[步骤4-OCR] 视觉接口失败: ' + e.message, 'ERROR');
          break;
        }
        if (!code) { await page.click('#imgVerify'); await new Promise(r => setTimeout(r, 1500)); continue; }

        await page.evaluate((c) => {
          const app = document.getElementById('app');
          if (app && app.__vue__) {
            const vm = app.__vue__;
            try { vm.QRValue = c; } catch (e) {}
            var domV = document.querySelector('.verify_input');
            if (domV) { domV.value = c; domV.dispatchEvent(new Event('input', { bubbles: true })); }
            try { vm.userLogin(); } catch (e) { console.error('[步骤4-OCR] userLogin 失败', e); }
          }
        }, code);
        log('[步骤4-OCR] 已提交登录，等待跳转...');
        await new Promise(r => setTimeout(r, 3000));

        try {
          const u = page.url();
          log('[步骤4-OCR] 提交后 URL: ' + u);
          if (!u.includes('hysslogin')) { log('[步骤4-OCR] ✅ 验证码通过，已离开登录页'); break; }
          log('[步骤4-OCR] ⚠️ 仍在 hysslogin，验证码可能错误，重试...', 'WARN');
          await page.click('#imgVerify').catch(() => {});
          await new Promise(r => setTimeout(r, 1500));
        } catch (e) { log('[步骤4-OCR] URL 检测异常: ' + e.message, 'WARN'); break; }
      }
    } else {
      log('[步骤4] OCR 未配置，等待人工输入验证码...');
    }

    // 第 5 步：等待登录成功 → www 回调页 → 点"继续教育" → cmeXX
    log('[步骤5] 等待登录完成...');
    const deadline = Date.now() + 300000;
    let loggedIn = false;
    let phase = 'wait_login';
    while (Date.now() < deadline) {
      try {
        const url = page.url();
        if (phase === 'wait_login') {
          if (/^https?:\/\/www\.91huayi\.com\/index\.html\?code=/.test(url)) {
            log('[步骤5] ✅ 登录成功，跳转到回调页');
            phase = 'click_jxjy';
            await new Promise(r => setTimeout(r, 3000));
            log('[步骤5] 导航到"继续教育"...');
            // 直接导航到 href，比点击更可靠（避免 target="_blank" 在新标签打开）
            const href = await page.evaluate(() => {
              const links = document.querySelectorAll('a');
              for (const a of links) {
                if (a.textContent.trim() === '继续教育') return a.href;
              }
              return null;
            });
            if (href) {
              log('[步骤5] 找到 continue education href: ' + href);
              await page.goto(href, { waitUntil: 'domcontentloaded', timeout: 30000 });
            } else {
              log('[步骤5] 未找到"继续教育"链接', 'WARN');
            }
            await new Promise(r => setTimeout(r, 3000));
            log('[步骤5] 当前 URL: ' + page.url());
          }
        }
        // 阶段 2：等待跳转到 cmeXX 子域
        if (phase === 'click_jxjy') {
          if (/^https?:\/\/cme\d+\.91huayi\.com/.test(url)) {
            await page.waitForLoadState('domcontentloaded', { timeout: 15000 }).catch(() => {});
            await new Promise(r => setTimeout(r, 2000));
            loggedIn = true;
            break;
          }
        }
      } catch (e) {
        // 页面正在跳转——正常现象
      }
      await new Promise(r => setTimeout(r, 1000));
    }
    if (!loggedIn) {
      log('[步骤5] ⏰ 等待超时', 'ERROR');
      try { log('[步骤5] 当前 URL: ' + page.url(), 'ERROR'); } catch (e) {}
      await browser.close();
      process.exit(1);
    }

    log('[步骤5] ✅ 到达课程页: ' + page.url());
    log('[自动检测] 开始检测 cmeXX 主机名...');
    await autoDetectHost(page);

    // 导出 storageState
    if (fs.existsSync(STATE)) {
      const bak = STATE + '.bak-' + new Date().toISOString().slice(0, 10);
      if (!fs.existsSync(bak)) fs.copyFileSync(STATE, bak);
      log('[导出] 旧快照已备份: ' + bak);
    }
    await ctx.storageState({ path: STATE });
    log('[导出] 新 storage-state.json 已导出');
    log('════ 完成 ════');
    await browser.close();
    process.exit(0);
  }

  // ── 已配置 HUAYI_HOST：自动打开登录页 ──
  console.log('🌐 打开登录页...');
  await page.goto(LOGIN_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(3000);

  // 切密码登录 tab
  console.log('🔑 切换到密码登录...');
  await page.evaluate(() => {
    const t = document.getElementById('type_pwd');
    if (t) { t.style.display = ''; t.click(); }
    document.querySelectorAll('.card_box').forEach(c => { if (c.querySelector('#txt_user_pwd')) c.style.display = 'block'; });
  });
  await page.waitForTimeout(1500);

  // 横幅：自动模式提示"请勿操作"，人工模式提示"请输入验证码"
  await page.evaluate((auto) => {
    const banner = document.createElement('div');
    banner.id = '__auto_login_banner__';
    banner.style.cssText = 'position:fixed!important;top:0!important;left:0!important;right:0!important;z-index:2147483647!important;color:#fff!important;text-align:center!important;padding:12px!important;font:bold 16px/1.4 "Microsoft YaHei",sans-serif!important;box-shadow:0 2px 8px rgba(0,0,0,.4)!important;';
    if (auto) {
      banner.style.background = '#ff1744';
      banner.innerHTML = '🤖 子川助手·自动登录中（AI 识别图形验证码）<br><span style="font-size:13px;font-weight:normal;opacity:.95;">请勿操作键盘鼠标！脚本会在 5~15 秒内完成登录，浏览器窗口会自动关闭。</span>';
    } else {
      banner.style.background = '#1976d2';
      banner.innerHTML = '👤 请手动输入下方的图形验证码并点击登录<br><span style="font-size:13px;font-weight:normal;opacity:.95;">账号密码已自动填好。登录成功后脚本会自动导出登录态并关闭窗口。</span>';
    }
    (document.body || document.documentElement).appendChild(banner);
  }, VISION.enabled);

  // 填账号密码（input 事件触发页面同步 + 直写 hidden 域兜底）
  console.log('📝 填入账号密码...');
  await page.evaluate((acc) => {
    const u = document.getElementById('txt_user_name');
    if (u) { u.value = acc.hyw_account; u.dispatchEvent(new Event('input', { bubbles: true })); }
    const p = document.getElementById('txt_user_pwd');
    if (p) { p.value = acc.hyw_password; p.dispatchEvent(new Event('input', { bubbles: true })); p.dispatchEvent(new Event('change', { bubbles: true })); }
    const r = document.getElementById('txt_user_pwd_real');
    if (r) r.value = acc.hyw_password;
  }, account);
  await page.waitForTimeout(500);

  // 勾协议
  await page.evaluate(() => {
    const cb = document.getElementById('agree1');
    if (cb && !cb.checked) { cb.checked = true; cb.dispatchEvent(new Event('change', { bubbles: true })); }
  });

  // 登录：已配置视觉模型 → 自动识别验证码；未配置 → 等待人工输入
  let loggedIn = false;
  if (!VISION.enabled) {
    loggedIn = await waitForManualLogin(page);
  } else for (let attempt = 1; attempt <= 5; attempt++) {
    console.log(`\n🔄 第 ${attempt} 次识别验证码...`);
    const captchaImg = await page.$('#yzm_img');
    if (!captchaImg) { console.log('❌ 找不到验证码元素 #yzm_img'); break; }
    const buf = await captchaImg.screenshot();
    fs.writeFileSync(path.join(SD, `relogin-captcha-${attempt}.png`), buf);

    let code = '';
    try {
      code = await recognizeCaptcha(VISION, buf.toString('base64'));
      console.log(`🤖 AI识别: "${code}"`);
    } catch (e) {
      console.log(`❌ 视觉接口失败: ${e.message}`);
      console.log('→ 转为人工输入验证码模式。');
      loggedIn = await waitForManualLogin(page);
      break;
    }

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

    if (!page.url().includes('login.aspx')) { loggedIn = true; break; }

    // 错误弹窗关闭 + 刷新验证码
    await page.evaluate(() => { document.querySelectorAll('.layui-layer-btn0').forEach(b => b.click()); });
    await page.click('#yzm_img');
    await page.waitForTimeout(1500);
  }

  if (!loggedIn) {
    await page.screenshot({ path: path.join(SD, 'relogin-failed.png'), fullPage: false });
    console.log(VISION.enabled ? '❌ 登录失败（5 次验证码都未通过）' : '❌ 登录失败（人工输入超时）');
    await browser.close();
    process.exit(1);
  }

  console.log('\n✅ 登录成功! 跳转到:', page.url());

  // 自动检测 cmeXX 主机名并写入 .env.local（首次运行时用户无需手动配置）
  await autoDetectHost(page);

  // 以下 evaluate 全部容错：登录后站点可能仍在二次跳转，
  // 上下文被销毁不应导致整个流程失败（否则登录态来不及导出）
  // 登录成功后移除横幅（避免影响后续主页截图）
  await page.evaluate(() => { const b = document.getElementById('__auto_login_banner__'); if (b) b.remove(); }).catch(() => {});

  // 关掉可能弹窗
  await page.evaluate(() => { document.querySelectorAll('.layui-layer-btn0').forEach(b => b.click()); }).catch(() => {});
  await page.waitForTimeout(1000);

  // 打开课程主页确认"已登录视图"
  console.log('🌐 验证登录态：打开课程主页...');
  await page.goto(HOME_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(4000);
  const homeState = await page.evaluate(() => {
    const t = (document.body.textContent || '');
    return {
      url: location.href,
      isGuest: t.includes('登录') && t.includes('注册') && !t.includes('退出') && !t.includes('注销'),
      hasUserActions: t.includes('退出') || t.includes('注销') || t.includes('修改信息'),
    };
  });
  console.log('主页状态:', JSON.stringify(homeState, null, 2));
  if (homeState.isGuest) {
    console.log('⚠️ 注意：主页仍为游客视图，导出快照可能无效');
  }
  await page.screenshot({ path: path.join(SD, 'relogin-home.png'), fullPage: false });

  // 导出 storageState（先备份旧文件）
  if (fs.existsSync(STATE)) {
    const bak = STATE + '.bak-' + new Date().toISOString().slice(0, 10);
    if (!fs.existsSync(bak)) fs.copyFileSync(STATE, bak);
    console.log('🗂️ 旧快照已备份:', bak);
  }
  await ctx.storageState({ path: STATE });
  console.log('💾 新 storage-state.json 已导出');

  await browser.close();
  console.log('🏁 完成');
})();
