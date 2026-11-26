// ==UserScript==
// @name         🧠 子川助手·统一考核自动答题 v1.1.0（内置2026公需课题库）
// @namespace    http://tampermonkey.net/
// @version      1.1.0
// @description  子川助手配套脚本：华医网统一课程考核(sdnew.91huayi.com)自动答题，内置2026公需课《人工智能赋能高质量发展》20题题库，自动匹配并点击答案、自动切题。不自动交卷，答完后提示人工核对。
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

  // 主流程：轮询检测题目 → 匹配 → 答题 → 下一题
  function tick() {
    const qText = getCurrentQuestionText();
    const sig = qText.slice(0, 80);
    if (!qText || sig === lastQuestionSig) return;
    lastQuestionSig = sig;

    const item = matchBank(qText);
    if (!item) {
      log('❌ 题库未匹配到本题，请人工作答并考虑补充题库: ' + qText.slice(0, 50));
      return;
    }
    log('🎯 匹配到题目，自动作答: ' + item.kw + ' → ' + item.ans.join('+'));
    const ok = answerQuestion(item);
    answeredCount++;
    setTimeout(() => {
      if (ok) clickNext();
      if (answeredCount >= 20) log('✅ 已自动作答 ' + answeredCount + ' 题，请人工核对后交卷！');
    }, 400);
  }

  function start() {
    log('脚本已启动，等待考试题目...');
    setInterval(tick, 1500);
    // 立即跑一次
    setTimeout(tick, 800);
  }

  if (document.readyState === 'complete') start();
  else window.addEventListener('load', start);
})();
