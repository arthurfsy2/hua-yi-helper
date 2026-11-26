// ==UserScript==
// @name         🧠 子川助手·统一考核自动答题 v1.2.0（内置2026公需课题库+联网作答）
// @namespace    http://tampermonkey.net/
// @version      1.2.0
// @description  子川助手配套脚本：华医网统一课程考核(sdnew.91huayi.com)自动答题。题库匹配 → AI联网 → 免费搜索三级作答，题库未命中也能答；内置2026公需课《人工智能赋能高质量发展》20题题库。不自动交卷，答完后提示人工核对。
// @author       Lin (WorkBuddy)
// @license      AGPL License
// @match        https://sdnew.91huayi.com/ExamInterface/ComputerExamIndex*
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function () {
  'use strict';

  // ═══════════════════════════════════════════════════════════════
  // 题库（Q_BANK）：kw=题干关键词（用于匹配），options=选项文本，
  // ans=答案（单选/多选为选项字母，判断为 '对'/'错'）
  // 新增题目：按同样格式追加一条即可（题干关键词要足够独特）
  // 题库未命中的题会自动走 AI 联网 → 免费搜索（见下方配置面板）
  // ═══════════════════════════════════════════════════════════════
  const Q_BANK = [
    // ── 单选题 (7) ──
    { kw: '人才培养更注重的思维能力', type: 'single', ans: ['C'],
      options: ['A. 机械记忆能力', 'B. 线性逻辑推理能力', 'C. 创造性和批判性思维', 'D. 单一学科解题能力'] },
    { kw: '不是传统的人工智能的应用', type: 'single', ans: ['B'],
      options: ['A. 垃圾邮件过滤器', 'B. 深度学习', 'C. 搜索引擎', 'D. 指纹识别'] },
    { kw: 'DeepSeek的推理模型R1', type: 'single', ans: ['B'],
      options: ['A. 简单文本生成', 'B. 复杂推理和深度分析', 'C. 标准化文案撰写', 'D. 基础数据统计'] },
    { kw: '生物制造领域的协同创新', type: 'single', ans: ['D'],
      options: ['A. 生成新材料分子', 'B. 自动化发酵过程', 'C. 预测遗传信息', 'D. 手动调节温度'] },
    { kw: '共建数字网络', type: 'single', ans: ['C'],
      options: ['A. 天气预报', 'B. 生态保护', 'C. 智能服务', 'D. 绿色算力'] },
    { kw: '共建教育资源', type: 'single', ans: ['A'],
      options: ['A. 联合培养', 'B. 技术共进', 'C. 治理共商', 'D. 产业应用'] },
    { kw: 'AI驱动的新型科研范式', type: 'single', ans: ['C'],
      options: ['A. 基于假设的推理', 'B. 依赖高性能计算', 'C. 数据驱动、模型驱动与人机协同驱动', 'D. 纯粹的实验探索'] },
    // ── 多选题 (6) ──
    { kw: '人工智能工作模式主要包括', type: 'multi', ans: ['A', 'B'],
      options: ['A. 推理模型', 'B. 通用模型', 'C. 分类模型', 'D. 识别模型'] },
    { kw: '人工智能的关键技术', type: 'multi', ans: ['B', 'C', 'D'],
      options: ['A. AR/VR', 'B. 机器学习', 'C. 计算机视觉', 'D. 生物特征识别'] },
    { kw: '国产大模型', type: 'multi', ans: ['B', 'C', 'D'],
      options: ['A. ChatGPT', 'B. DeepSeek', 'C. 豆包', 'D. 元宝'] },
    { kw: '易被机器取代的工作类型', type: 'multi', ans: ['A', 'B', 'C'],
      options: ['A. 体力劳动者', 'B. 电话客服', 'C. 新闻编辑', 'D. 创造性研发工作'] },
    { kw: '实施人工智能行动', type: 'multi', ans: ['B', 'C', 'D'],
      options: ['A. "人工智能+"具生智能', 'B. "人工智能+"民生福祉', 'C. "人工智能+"治理能力', 'D. "人工智能+"全球合作'] },
    { kw: '传统的人工智能常用模型', type: 'multi', ans: ['A', 'C', 'D'],
      options: ['A. 传统机器学习（ML）模型', 'B. 深度学习模型', 'C. 增强学习模型', 'D. 数学模型'] },
    // ── 判断题 (7) ──
    { kw: '跨模态科学数据处理能力', type: 'judge', ans: ['对'],
      options: ['对', '错'] },
    { kw: '生成式AI在广告宣传领域', type: 'judge', ans: ['错'],
      options: ['对', '错'] },
    { kw: '科学大模型的核心', type: 'judge', ans: ['错'],
      options: ['对', '错'] },
    { kw: '深刻改变传统农业', type: 'judge', ans: ['对'],
      options: ['对', '错'] },
    { kw: '设计思维是一种以人为中心', type: 'judge', ans: ['对'],
      options: ['对', '错'] },
    { kw: '存在信息泄露的风险', type: 'judge', ans: ['错'],
      options: ['对', '错'] },
    { kw: '逻辑推理能力是一维的', type: 'judge', ans: ['错'],
      options: ['对', '错'] },
  ];

  let answeredCount = 0;
  let lastQuestionSig = '';
  const LOG_PREFIX = '【子川助手·统一考核】';

  function log(msg) {
    console.log(LOG_PREFIX + msg);
    try {
      const el = document.createElement('div');
      el.style.cssText = 'position:fixed;right:12px;bottom:80px;z-index:2147483647;background:#1677ff;color:#fff;font:12px/1.6 "Microsoft YaHei";padding:6px 10px;border-radius:6px;max-width:320px;box-shadow:0 2px 8px rgba(0,0,0,.25)';
      el.textContent = msg;
      document.body.appendChild(el);
      setTimeout(() => el.remove(), 4000);
    } catch (e) {}
  }

  // ═══════════════════════════════════════════════════════════════
  // 【v1.2.0】联网作答（题库未命中时的兜底）
  // ⚠️ localStorage 按 origin 隔离：主脚本(cme28域)配的 AI 接口这里读不到，
  //    需要在本考试页通过右下角「AI配置」按钮单独配置一次（存 sdnew 域）。
  // ═══════════════════════════════════════════════════════════════
  function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }

  function aiConfigured() {
    return !!(lsGet('hyu_ai_base') && lsGet('hyu_ai_key') && lsGet('hyu_ai_model'));
  }

  // AI 作答：返回字母串（"B"/"ABCD"）或 '对'/'错'；失败抛异常
  async function aiAskOnline(question, options, isJudge) {
    const base = (lsGet('hyu_ai_base') || '').replace(/\/+$/, '');
    const prompt = isJudge
      ? '你正在帮助用户完成继续教育考试判断题，请判断正误。\n题目：' + question +
        '\n只输出一个字：对 或 错，不要输出任何其他内容。'
      : '你正在帮助用户完成继续教育考试，请选出所有正确选项（单选题只有一个正确项，多选题可能有多个）。\n题目：' +
        question + '\n选项：\n' + options.join('\n') +
        '\n只输出正确选项的字母（多选把字母连写，如 ABCD），不要输出任何其他内容。';
    const ctrl = new AbortController();
    const to = setTimeout(() => ctrl.abort(), 20000);
    let res;
    try {
      res = await fetch(base + '/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + lsGet('hyu_ai_key') },
        body: JSON.stringify({ model: lsGet('hyu_ai_model'), messages: [{ role: 'user', content: prompt }], temperature: 0 }),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(to); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const content = String((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '').trim();
    if (isJudge) {
      if (/[错误×x]/.test(content)) return '错';
      if (/[对√]/.test(content)) return '对';
      throw new Error('AI 未返回对/错: ' + content.slice(0, 30));
    }
    const letters = content.toUpperCase().match(/[A-Z]/g) || [];
    const maxLetter = String.fromCharCode(65 + Math.max(options.length - 1, 0));
    const uniq = [];
    for (const L of letters) if (L <= maxLetter && !uniq.includes(L)) uniq.push(L);
    if (!uniq.length) throw new Error('AI 未返回选项字母: ' + content.slice(0, 30));
    return uniq.join('');
  }

  // 免费搜索：公共代理抓 Bing/百度结果页提取答案模式（无需 Key）
  // ⚠️ 境外公共代理在大陆网络多数不可达，故默认关（「搜索」开关控制），
  //    避免每题白等代理超时；网络可达环境打开即可。
  async function fetchViaProxy(targetUrl, timeoutMs) {
    const proxies = [
      u => 'https://api.allorigins.win/raw?url=' + encodeURIComponent(u),
      u => 'https://api.codetabs.com/v1/proxy?quest=' + encodeURIComponent(u),
    ];
    for (const p of proxies) {
      const ctrl = new AbortController();
      const to = setTimeout(() => ctrl.abort(), timeoutMs || 8000);
      try {
        const res = await fetch(p(targetUrl), { signal: ctrl.signal });
        clearTimeout(to);
        if (!res.ok) continue;
        const text = await res.text();
        if (text && text.length > 500) return text;
      } catch (e) { clearTimeout(to); }
    }
    return null;
  }

  function htmlToText(html) {
    return String(html)
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<[^>]+>/g, ' ')
      .replace(/&nbsp;/g, ' ')
      .replace(/&[a-z]+;/gi, ' ')
      .replace(/\s+/g, ' ');
  }

  async function freeSearchAnswer(question, options, isJudge) {
    if (lsGet('hyu_search_on') !== '1') return null;
    const query = String(question).slice(0, 60) + ' 答案';
    const engines = ['https://www.bing.com/search?q=', 'https://www.baidu.com/s?wd='];
    for (const engine of engines) {
      const html = await fetchViaProxy(engine + encodeURIComponent(query));
      if (!html) continue;
      const text = htmlToText(html);
      const qHead = String(question).replace(/\s+/g, '').slice(0, 15);
      if (qHead && !text.replace(/\s+/g, '').includes(qHead)) continue;
      if (isJudge) {
        const j = text.match(/答案\s*[：:是为]*\s*(对|错|正确|错误|√|×)/);
        if (j) return /[错误×]/.test(j[1]) ? '错' : '对';
      } else {
        const m = text.match(/(?:正确答案|参考答案|【答案】|答案)\s*[：:是为于]*\s*([A-Z]{1,6})/);
        if (m) {
          const maxLetter = String.fromCharCode(65 + Math.max(options.length - 1, 0));
          const uniq = [];
          for (const L of m[1].split('')) if (L <= maxLetter && !uniq.includes(L)) uniq.push(L);
          if (uniq.length) return uniq.join('');
        }
      }
    }
    return null;
  }

  // ═══════════════════════════════════════════════════════════════
  // 【v1.2.0】配置面板（右下角小按钮组）
  // ═══════════════════════════════════════════════════════════════
  function ensurePanel() {
    if (document.getElementById('hyu-sd-panel')) return;
    const box = document.createElement('div');
    box.id = 'hyu-sd-panel';
    box.style.cssText = 'position:fixed;right:12px;bottom:12px;z-index:2147483647;display:flex;gap:6px;font:12px "Microsoft YaHei";';
    const btnCss = 'padding:4px 10px;border-radius:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;';
    box.innerHTML =
      '<span id="hyu-sd-cfg" style="' + btnCss + '">AI配置</span>' +
      '<span id="hyu-sd-test" style="' + btnCss + '">测试</span>' +
      '<span id="hyu-sd-search" style="' + btnCss + '" title="免费联网搜答案（走公共代理，网络不通自动跳过）">搜索:关</span>';
    document.body.appendChild(box);

    const searchBtn = box.querySelector('#hyu-sd-search');
    function refreshSearch() {
      const on = lsGet('hyu_search_on') === '1';
      searchBtn.textContent = '搜索:' + (on ? '开' : '关');
      searchBtn.style.background = on ? '#1677ff' : '#e0e0e0';
      searchBtn.style.color = on ? '#fff' : '#555';
    }
    searchBtn.onclick = () => {
      const on = lsGet('hyu_search_on') === '1';
      lsSet('hyu_search_on', on ? '0' : '1');
      refreshSearch();
      log('免费搜索已' + (on ? '关闭' : '开启'));
    };
    refreshSearch();

    box.querySelector('#hyu-sd-cfg').onclick = () => {
      const base = prompt('AI 接口地址（OpenAI 兼容，填到 /v1 为止）：', lsGet('hyu_ai_base') || 'https://api.openai.com/v1');
      if (base === null) return;
      const key = prompt('API Key（仅保存在本浏览器）：', lsGet('hyu_ai_key') || '');
      if (key === null) return;
      const model = prompt('模型名：', lsGet('hyu_ai_model') || '');
      if (model === null) return;
      lsSet('hyu_ai_base', base.trim());
      lsSet('hyu_ai_key', key.trim());
      lsSet('hyu_ai_model', model.trim());
      log(aiConfigured() ? 'AI 配置已保存，题库未命中将联网作答' : '配置不完整，仍用题库作答');
    };

    box.querySelector('#hyu-sd-test').onclick = async () => {
      if (!aiConfigured()) { alert('请先点「AI配置」填好接口地址、Key 和模型名'); return; }
      try {
        const r = await aiAskOnline('1+1=?', ['A. 1', 'B. 2', 'C. 3'], false);
        alert('AI 接口正常 ✓（测试题返回 ' + r + '，应为 B）');
      } catch (e) {
        alert('AI 调用失败：' + e.message + '\n常见原因：接口不支持浏览器跨域(CORS)、Key 无效、地址填错');
      }
    };
  }

  // 提取当前显示的题目文本（从"一、单选题"等标题后的题目块）
  function getCurrentQuestionText() {
    const body = document.body ? document.body.innerText : '';
    // 找题型标题行之后的内容
    const m = body.match(/[一二三四五]、[^\n]*\n((?:.|\n)*?)(?:下\s*一\s*题|上\s*一\s*题|我要交卷|交卷)/);
    if (m) return m[1].trim();
    // 【v1.1.0 兜底】题型标题结构变化（官方加 banner/改标题格式）导致主正则失效时，
    // 改取第一个"题号+题干"行（如 "1 人才培养……"）。每题文本不同——tick 的 sig 去重
    // 依赖这一点；matchBank 用 includes 匹配关键词，题干行同样能命中题库。
    const n = body.match(/(?:^|\n)\s*(\d{1,3})\s*[、.．,，]?\s*([^\n]{8,120})/);
    return n ? (n[1] + ' ' + n[2]).trim() : '';
  }

  // 匹配题库：按题干关键词
  function matchBank(text) {
    if (!text) return null;
    // 去掉题号前缀（如 "1 "、"12 "）
    const q = text.replace(/^\d+\s*/, '');
    for (const item of Q_BANK) {
      if (q.includes(item.kw) || text.includes(item.kw)) return item;
    }
    return null;
  }

  // 【v1.2.0】从题目块解析选项行（"A. xxx" 格式），供联网作答使用
  function parsePageOptions(qText) {
    const opts = [];
    const re = /(?:^|\n)\s*([A-Z])[.．、,，:：]\s*([^\n]{1,80})/g;
    let m;
    while ((m = re.exec(qText))) opts.push(m[1] + '. ' + m[2].trim());
    return opts;
  }

  // 【v1.2.0】判断题识别：独立"对/错"行，或两个选项均为对/错类文本
  function detectJudge(qText, pageOptions) {
    if (/\n\s*(对|错)\s*\n/.test(qText)) return true;
    if (pageOptions.length === 2) {
      const strip = s => s.replace(/^[A-Z][.．、,，:：]\s*/, '');
      if (/^(对|错|正确|错误|√|×)$/.test(strip(pageOptions[0])) &&
          /^(对|错|正确|错误|√|×)$/.test(strip(pageOptions[1]))) return true;
    }
    return false;
  }

  // 找到并点击页面中文本匹配的元素（忽略大小写、首尾空格、全角半角）
  function clickByText(targetText, multi) {
    const norm = s => s.replace(/\s+/g, '').toLowerCase();
    const target = norm(targetText);
    if (!target) return false;
    const all = document.querySelectorAll('label, div, span, li, p, button, a');
    let clicked = false;
    for (const el of all) {
      const t = norm(el.innerText || '');
      if (t === target) {
        // 只点可见元素
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) {
          el.click();
          clicked = true;
          if (!multi) break;
        }
      }
    }
    return clicked;
  }

  // 【v1.2.0】按字母点选页面选项（先按去前缀文本精确匹配，回退带前缀整行匹配）
  function answerByLetters(letters, pageOptions) {
    let ok = true;
    for (const L of String(letters)) {
      const idx = L.charCodeAt(0) - 65;
      const opt = pageOptions[idx];
      if (!opt) { ok = false; log('⚠️ 联网答案含超出选项范围的字母: ' + L); continue; }
      const stripped = opt.replace(/^[A-Z][.．、,，:：]\s*/, '');
      if (clickByText(stripped, true)) continue;
      if (clickByText(opt, true)) continue;
      ok = false;
      log('⚠️ 未找到选项: ' + opt);
    }
    return ok;
  }

  // 答题：根据题库答案点击选项
  function answerQuestion(item) {
    let ok = true;
    for (const ans of item.ans) {
      // 判断/单选/多选：答案字母 → 找对应选项文本；判断用 '对'/'错'
      let targetText = null;
      if (item.type === 'judge') {
        targetText = ans; // '对' 或 '错'
      } else {
        const idx = ans.charCodeAt(0) - 65; // A=0
        targetText = item.options[idx] ? item.options[idx].replace(/^[A-Z][.．、]\s*/, '') : null;
        // 选项文本可能带 "A. " 前缀，去掉后用后半段匹配
        if (!targetText) continue;
      }
      const hit = clickByText(targetText, item.type !== 'judge');
      if (!hit) { ok = false; log('⚠️ 未找到选项: ' + targetText); }
    }
    return ok;
  }

  // 点击"下一题"
  function clickNext() {
    const els = document.querySelectorAll('button, a, span, div');
    for (const el of els) {
      const t = (el.innerText || '').replace(/\s+/g, '');
      if (t === '下一题') {
        const r = el.getBoundingClientRect();
        if (r.width > 0 && r.height > 0) { el.click(); return true; }
      }
    }
    return false;
  }

  // 【v1.2.0】题库未命中 → AI 联网 → 免费搜索 → 都失败提示人工
  async function answerOnline(qText) {
    const pageOptions = parsePageOptions(qText);
    const isJudge = detectJudge(qText, pageOptions);
    let ans = null;
    if (aiConfigured()) {
      try {
        ans = isJudge ? await aiAskOnline(qText, pageOptions, true) : await aiAskOnline(qText, pageOptions, false);
        if (ans) log('🤖 AI 联网作答 → ' + ans);
      } catch (e) { log('⚠️ AI 作答失败: ' + e.message); }
    }
    if (!ans) {
      try {
        ans = await freeSearchAnswer(qText, pageOptions, isJudge);
        if (ans) log('🔍 免费搜索命中 → ' + ans);
      } catch (e) {}
    }
    if (!ans) {
      log('❌ 题库/联网均未命中，请人工作答并考虑补充题库: ' + qText.slice(0, 40));
      return;
    }
    const ok = isJudge ? clickByText(ans) : answerByLetters(ans, pageOptions);
    answeredCount++;
    setTimeout(() => {
      if (ok && !clickNext()) log('✅ 已答完可见题目（共 ' + answeredCount + ' 题），请人工核对后交卷！');
    }, 400);
  }

  // 主流程：轮询检测题目 → 匹配 → 答题 → 下一题
  function tick() {
    const qText = getCurrentQuestionText();
    const sig = qText.slice(0, 80);
    if (!qText || sig === lastQuestionSig) return;
    lastQuestionSig = sig;

    const item = matchBank(qText);
    if (!item) {
      // 【v1.2.0】题库未命中不再卡死，转联网作答
      log('题库未命中，尝试联网作答: ' + qText.slice(0, 30));
      answerOnline(qText);
      return;
    }
    log('🎯 匹配到题目，自动作答: ' + item.kw + ' → ' + item.ans.join('+'));
    const ok = answerQuestion(item);
    answeredCount++;
    setTimeout(() => {
      // 【v1.2.0】去掉硬编码 20 题：点不动"下一题"即答到最后一题
      if (ok && !clickNext()) log('✅ 已答完可见题目（共 ' + answeredCount + ' 题），请人工核对后交卷！');
    }, 400);
  }

  function start() {
    log('脚本已启动，等待考试题目...');
    ensurePanel();
    setInterval(tick, 1500);
    // 立即跑一次
    setTimeout(tick, 800);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
