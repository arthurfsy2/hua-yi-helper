// ==UserScript==
// @name         🧠 子川助手·统一考核自动答题 v1.4.0（题库+百度/AI互斥作答）
// @namespace    http://tampermonkey.net/
// @version      1.4.0
// @description  子川助手配套脚本：华医网统一课程考核(sdnew.91huayi.com)自动答题。作答链：题库/记忆 → 百度搜索 → AI → 提示人工（百度与AI互斥开关，默认全关）；记忆可导出纯问答JSON永久保存；内置2026公需课20题题库。不自动交卷，答完后提示人工核对。
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

  // ═══════════════════════════════════════════════════════════════
  // 【v1.3.0】作答记忆：AI/免费搜索答过的题按题干存 localStorage，
  // 下次打开遇到同题直接命中——答案稳定不再答错。若某题 AI 答错了，
  // 点右下角「记忆:N」可清空重来（记忆不区分对错，以考试通过为准）。
  // ═══════════════════════════════════════════════════════════════
  const BANK_KEY = 'sd_q_bank';
  function bankLoad() {
    try { return JSON.parse(lsGet(BANK_KEY) || '{}'); } catch (e) { return {}; }
  }
  function bankKey(text) {
    // 去题号前缀+空白后取前 60 字符作 key（与 matchBank 的归一化一致）
    return String(text || '').replace(/^\d+\s*/, '').replace(/\s+/g, '').slice(0, 60);
  }
  function refreshBankLabel() {
    const b = document.getElementById('hyu-sd-bank');
    if (b) b.textContent = '记忆:' + Object.keys(bankLoad()).length;
  }

  function aiConfigured() {
    return !!(lsGet('hyu_ai_base') && lsGet('hyu_ai_key') && lsGet('hyu_ai_model'));
  }

  // 【v1.3.4】AI 作答总开关：配置好且显式开启才作答（默认关；测试通过自动开）
  function aiReady() {
    return aiConfigured() && lsGet('hyu_ai_on') === '1';
  }

  // AI 作答：返回字母串（"B"/"ABCD"）或 '对'/'错'；失败抛异常
  // 【v1.3.0】双格式兼容：地址以 /anthropic 结尾走 Anthropic Messages 格式
  // （如智谱 https://open.bigmodel.cn/api/anthropic），否则走 OpenAI Chat 格式
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
    const isAnthropic = /\/anthropic\/?$/i.test(base);
    let res;
    try {
      res = await fetch(isAnthropic ? base + '/v1/messages' : base + '/chat/completions', {
        method: 'POST',
        headers: isAnthropic
          ? { 'Content-Type': 'application/json', 'x-api-key': lsGet('hyu_ai_key'), 'anthropic-version': '2023-06-01' }
          : { 'Content-Type': 'application/json', Authorization: 'Bearer ' + lsGet('hyu_ai_key') },
        body: JSON.stringify(isAnthropic
          ? { model: lsGet('hyu_ai_model'), max_tokens: 1024, messages: [{ role: 'user', content: prompt }] }
          : { model: lsGet('hyu_ai_model'), messages: [{ role: 'user', content: prompt }], temperature: 0 }),
        signal: ctrl.signal,
      });
    } finally { clearTimeout(to); }
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    const content = (isAnthropic
      ? String((data.content && data.content[0] && data.content[0].text) || '')
      : String((data.choices && data.choices[0] && data.choices[0].message && data.choices[0].message.content) || '')
    ).trim();
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
      const to = setTimeout(() => ctrl.abort(), timeoutMs || 5000);
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

  // 【v1.2.2→v1.3.4】搜索：传输链 = 配套「搜索桥」（GM直连百度，秒回）→ 公共代理兜底；
  // 全部不可达熔断 10 分钟。百度优先、必应备选。
  let searchDeadUntil = 0;
  async function searchFetchPage(url) {
    try {
      if (typeof window.__hySearchWeb === 'function') {
        const viaBridge = await window.__hySearchWeb(url);
        if (viaBridge && viaBridge.length > 300) return viaBridge;
      }
    } catch (e) {}
    return await fetchViaProxy(url, 12000);
  }
  async function freeSearchAnswer(question, options, isJudge) {
    if (lsGet('hyu_search_on') !== '1') return null;
    if (Date.now() < searchDeadUntil) return null;
    const query = String(question).slice(0, 60) + ' 答案';
    const engines = ['https://www.baidu.com/s?wd=', 'https://cn.bing.com/search?q='];
    let fetchedAny = false;
    for (const engine of engines) {
      const html = await searchFetchPage(engine + encodeURIComponent(query));
      if (!html) continue;
      fetchedAny = true;
      const text = htmlToText(html);
      const qHead = String(question).replace(/\s+/g, '').slice(0, 15);
      if (qHead && !text.replace(/\s+/g, '').includes(qHead)) continue;
      if (isJudge) {
        const j = text.match(/答案\s*[：:是为]*\s*(对|错|正确|错误|√|×)/);
        if (j) { log('🔍 百度/必应命中（判断题）→ ' + j[1]); return /[错误×]/.test(j[1]) ? '错' : '对'; }
      } else {
        const m = text.match(/(?:正确答案|参考答案|【答案】|答案)\s*[：:是为于]*\s*([A-Z]{1,6})/);
        if (m) {
          const maxLetter = String.fromCharCode(65 + Math.max(options.length - 1, 0));
          const uniq = [];
          for (const L of m[1].split('')) if (L <= maxLetter && !uniq.includes(L)) uniq.push(L);
          if (uniq.length) { log('🔍 百度/必应命中 → ' + uniq.join('')); return uniq.join(''); }
        }
      }
    }
    if (!fetchedAny) {
      searchDeadUntil = Date.now() + 600000;
      log('🔍 搜索不可达（未装搜索桥且代理不通），10 分钟内跳过');
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
      '<span id="hyu-sd-cfg" style="' + btnCss + '" title="配置 AI 接口：地址/Key/模型（智谱 glm-5-flash 免费，已预填 Anthropic 接口）">配置AI</span>' +
      '<span id="hyu-sd-test" style="' + btnCss + '" title="发一道测试题验证 AI 接口">测试</span>' +
      '<span id="hyu-sd-ai-toggle" style="' + btnCss + '" title="AI 作答总开关（默认关；配置并在「测试」通过后自动开启）">AI:关</span>' +
      '<span id="hyu-sd-search" style="' + btnCss + '" title="百度/必应搜索答案（无需AI）：装配套「搜索桥」脚本后直连秒回；未装则走公共代理（大陆多不通，不可达自动熔断10分钟）。答对自动入库">百度搜索:关</span>' +
      '<span id="hyu-sd-bank" style="' + btnCss + '" title="AI/搜索答过的题已自动入库，下次同题直接命中；点击可清空（若某题答错，清空后重考会重新作答）">记忆:0</span>' +
      '<span id="hyu-sd-export" style="' + btnCss + '" title="把作答记忆+AI配置导出为 JSON 文件存到本机（永久保存，浏览器清数据也不丢）">导出</span>' +
      '<span id="hyu-sd-import" style="' + btnCss + '" title="选择之前导出的题库文件，一键恢复作答记忆和 AI 配置">导入</span>';
    document.body.appendChild(box);

    const searchBtn = box.querySelector('#hyu-sd-search');
    const aiToggle = box.querySelector('#hyu-sd-ai-toggle');
    function refreshSearch() {
      const on = lsGet('hyu_search_on') === '1';
      searchBtn.textContent = '百度搜索:' + (on ? '开' : '关');
      searchBtn.style.background = on ? '#2e7d32' : '#e0e0e0';
      searchBtn.style.color = on ? '#fff' : '#555';
      const aOn = lsGet('hyu_ai_on') === '1';
      if (aiToggle) {
        aiToggle.textContent = 'AI:' + (aOn ? '开' : '关');
        aiToggle.style.background = aOn ? '#e65100' : '#e0e0e0';
        aiToggle.style.color = aOn ? '#fff' : '#555';
      }
    }
    searchBtn.onclick = () => {
      const on = lsGet('hyu_search_on') === '1';
      lsSet('hyu_search_on', on ? '0' : '1');
      // 【v1.4.0】百度/AI 互斥：开百度自动关 AI
      if (!on) lsSet('hyu_ai_on', '0');
      refreshSearch();
      log('百度搜索已' + (on ? '关闭' : '开启（AI 已自动关闭，两者互斥）' + (typeof window.__hySearchWeb === 'function' ? '；搜索桥已就绪' : '；建议安装配套搜索桥脚本')));
    };
    if (aiToggle) {
      aiToggle.onclick = () => {
        const on = lsGet('hyu_ai_on') === '1';
        lsSet('hyu_ai_on', on ? '0' : '1');
        // 【v1.4.0】百度/AI 互斥：开 AI 自动关百度
        if (!on) lsSet('hyu_search_on', '0');
        refreshSearch();
        log('AI 作答已' + (on ? '关闭' : '开启（百度搜索已自动关闭，两者互斥；未配置时自动跳过）'));
      };
    }
    refreshSearch();

    // 【v1.3.3】永久题库文件：纯「问题 → 答案」JSON 导出/导入
    // （v1.3.1 旧打包格式仍可导入，AI 配置不再混入导出文件）
    box.querySelector('#hyu-sd-export').onclick = () => {
      const bank = bankLoad();
      const n = Object.keys(bank).length;
      if (!n) { log('记忆为空（AI/搜索答题后自动入库），暂无可导出'); return; }
      const blob = new Blob([JSON.stringify(bank, null, 2)], { type: 'application/json' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'sdexam-题库-' + new Date().toISOString().slice(0, 10) + '.json';
      document.body.appendChild(a);
      a.click();
      log('✓ 已导出 ' + n + ' 条问答（保存好该文件=永久题库）');
      setTimeout(() => { URL.revokeObjectURL(a.href); if (a.parentNode) a.parentNode.removeChild(a); }, 5000);
    };
    box.querySelector('#hyu-sd-import').onclick = () => {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = '.json,application/json';
      input.style.display = 'none';
      input.onchange = () => {
        const file = input.files && input.files[0];
        if (!file) { input.remove(); return; }
        const reader = new FileReader();
        reader.onload = () => {
          try {
            const b = JSON.parse(reader.result);
            if (!b || typeof b !== 'object' || Array.isArray(b)) throw new Error('文件格式不正确');
            const cur = bankLoad();
            let n = 0;
            if (b.__huayi_sd_bank__) {
              // v1.3.1 旧打包格式
              if (typeof b[BANK_KEY] === 'string') {
                const inc = JSON.parse(b[BANK_KEY]);
                for (const q in inc) if (!(q in cur)) { cur[q] = inc[q]; n++; }
              }
              for (const k of ['hyu_ai_base', 'hyu_ai_key', 'hyu_ai_model'])
                if (typeof b[k] === 'string' && b[k]) { lsSet(k, b[k]); n++; }
            } else {
              // 纯「问题→答案」映射
              for (const q in b)
                if (typeof b[q] === 'string' && !(q in cur)) { cur[q] = b[q]; n++; }
            }
            lsSet(BANK_KEY, JSON.stringify(cur));
            refreshBankLabel();
            log('✓ 导入成功：新增 ' + n + ' 条问答');
          } catch (e) { log('✗ 导入失败：' + e.message); }
          input.remove();
        };
        reader.readAsText(file);
      };
      document.body.appendChild(input);
      input.click();
    };

    // 【v1.3.0】作答记忆：点击清空（计数刷新函数 refreshBankLabel 定义在顶层）
    const bankBtn = box.querySelector('#hyu-sd-bank');
    if (bankBtn) {
      bankBtn.onclick = () => {
        const n = Object.keys(bankLoad()).length;
        if (!n) { log('作答记忆为空（AI/搜索答题后自动入库）'); return; }
        if (confirm('清空 ' + n + ' 条作答记忆？\n（若某些题 AI 答错了，清空后重考会重新作答；答对的清空后也会重新调 AI）')) {
          lsSet(BANK_KEY, '{}');
          refreshBankLabel();
          log('已清空作答记忆');
        }
      };
      refreshBankLabel();
    }

    // ════ 【v1.3.3】AI 模型预设（2026.11.27 浏览器实测：智谱接口被跨域拦截已移除；DeepSeek/通义/硅基可直连）══════
    const SD_PRESETS = [
      { name: '硅基·免费', base: 'https://api.siliconflow.cn/v1', model: 'Qwen/Qwen2.5-7B-Instruct', tip: 'cloud.siliconflow.cn 注册送额度，标 FREE 的模型完全免费' },
      { name: '通义千问', base: 'https://dashscope.aliyuncs.com/compatible-mode/v1', model: 'qwen-flash', tip: '阿里云百炼控制台，qwen-flash 有免费额度' },
      { name: 'DeepSeek', base: 'https://api.deepseek.com/v1', model: 'deepseek-chat', tip: 'platform.deepseek.com，付费但答上百题约几分钱' },
    ];
    box.querySelector('#hyu-sd-cfg').onclick = () => {
      let menu = '选择 AI 模型预设（输入序号回车；直接回车默认①）：\n';
      SD_PRESETS.forEach((p, i) => { menu += (i + 1) + '. ' + p.name + '（' + p.tip + '）\n'; });
      menu += '\n注：各家 API 都需注册创建 Key（免费模型也不扣费）。';
      const pick = prompt(menu, '1');
      if (pick === null) return;
      const p = SD_PRESETS[parseInt(pick, 10) - 1] || SD_PRESETS[0];
      const key = prompt('已选「' + p.name + '」· ' + p.model + '（' + p.tip + '）\n\n粘贴你的 API Key：', lsGet('hyu_ai_key') || '');
      if (key === null) return;
      if (!key.trim()) return log('❗配置未保存：Key 必填（各家官网注册免费创建）');
      lsSet('hyu_ai_base', p.base);
      lsSet('hyu_ai_key', key.trim());
      lsSet('hyu_ai_model', p.model);
      log('✓ AI 已配置（' + p.name + ' · ' + p.model + '），题库未命中将联网作答');
    };

    box.querySelector('#hyu-sd-test').onclick = async () => {
      if (!aiConfigured()) {
        alert('请先点右下角「配置AI」，依次填：① 接口地址 ② API Key ③ 模型名\n\n' +
              '免费方案：打开 open.bigmodel.cn（智谱）注册 → 右上角「API Key」新建 Key →\n' +
              '地址已预填 https://open.bigmodel.cn/api/anthropic，模型填 glm-5-flash（免费）。\n' +
              '三项全填才会保存——少一项都不行。');
        return;
      }
      try {
        const r = await aiAskOnline('1+1=?', ['A. 1', 'B. 2', 'C. 3'], false);
        lsSet('hyu_ai_on', '1'); // 【v1.3.4】测试通过自动开启 AI
        refreshSearch();
        alert('AI 接口正常 ✓（模型 ' + lsGet('hyu_ai_model') + '，测试题返回 ' + r + '，应为 B）\nAI 作答已自动开启');
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

  // 【v1.2.0→v1.3.0】题库未命中 → 作答记忆 → AI 联网 → 免费搜索 → 都失败提示人工
  async function answerOnline(qText) {
    const pageOptions = parsePageOptions(qText);
    const isJudge = detectJudge(qText, pageOptions);
    // 【v1.3.0】先查作答记忆：AI/搜索答过并入库的题直接命中，不再调 AI
    const bank = bankLoad();
    const bk = bankKey(qText);
    if (bank[bk]) {
      const ok = isJudge ? clickByText(bank[bk]) : answerByLetters(bank[bk], pageOptions);
      log('🧠 作答记忆命中 → ' + bank[bk]);
      answeredCount++;
      setTimeout(() => {
        if (ok && !clickNext()) log('✅ 已答完可见题目（共 ' + answeredCount + ' 题），请人工核对后交卷！');
      }, 400);
      return;
    }
    let ans = null;
    // 【v1.4.0】优先级：题库/记忆 → 百度搜索（开启时）→ AI（百度关且 AI 开，互斥）
    const useSearch = lsGet('hyu_search_on') === '1';
    const useAi = aiReady() && !useSearch;
    if (useSearch) {
      try {
        ans = await freeSearchAnswer(qText, pageOptions, isJudge);
        if (ans) log('🔍 百度搜索作答 → ' + ans);
      } catch (e) {}
    } else if (useAi) {
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
      log('❌ 题库/记忆/联网均未命中，请人工作答并考虑补充题库: ' + qText.slice(0, 40));
      return;
    }
    // 【v1.3.0】入库：下次同题直接命中（答错的题点右下角「记忆:N」清空重答）
    bank[bk] = ans;
    lsSet(BANK_KEY, JSON.stringify(bank));
    refreshBankLabel();
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
