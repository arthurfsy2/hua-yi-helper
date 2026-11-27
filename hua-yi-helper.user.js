// ==UserScript==
// @name         🥇【子川助手 v2.8.5】全网唯一真实免费|无人值守|自动静音|视频助手|考试助手|不疲劳
// @namespace    http://tampermonkey.net/
// @version      2.10.6
// @description  适配华医网 2026.11 最新页面（v2.8.6 AI报错带服务端原文；v2.8.5 实测修复 Anthropic 兼容层思考块解析+max_tokens；v2.8.4 修切课清空中间库+桥状态实时显示）
// @author       五创作者:吴喻伦比 四创作者：Arthurfsy2   三创作者：Mriio   二创作者：境界程序员   原创作者：Dr.S
// @license      AGPL License
// @match        *://*.91huayi.com/course_ware/course_ware_polyv.aspx?*
// @match        *://*.91huayi.com/course_ware/course_ware_cc.aspx*
// @match        *://*.91huayi.com/pages/exam.aspx?*
// @match        *://*.91huayi.com/pages/exam_result.aspx?*
// @match        *://*.91huayi.com/*
// @grant        none
// @noframes
// @run-at       document-start
// @downloadURL  https://raw.githubusercontent.com/arthurfsy2/hua-yi-helper/main/hua-yi-helper.user.js
// @updateURL    https://raw.githubusercontent.com/arthurfsy2/hua-yi-helper/main/hua-yi-helper.user.js
// ==/UserScript==

// 脚本版本号（单一来源）。油猴环境优先读 GM_info；
// 通过自动化框架（Playwright/WorkBuddy 等）注入时 GM_info 不存在，回退到此常量。
// ⚠️ 修改时需与顶部 @version 及 @name 中的版本号保持一致。
var HYU_VERSION = "2.10.6";

var newupdate =
  "2026.11.27 v2.9.6 学分计划重构为两阶段状态机：①学习记录待修课按记住的顺序自动续学 ②目录补足差额；手动选课自动采纳为当前课不再强制切回；修「计划队列不跟随顺序变更」+「课件入口误开新标签页」\n" +
  "2026.11.27 v2.9.5 选课窗重做：继教首页+学习记录两页进入即弹、居中、20秒倒计时无操作按默认顺序自动开始、先学可调序、选过记住不再弹、面板「课程顺序」随时↑调整+重置记忆\n" +
  "2026.11.27 v2.9.4 官网首页公告/图片预览遮挡层自动关闭（修点菜单无反应）；学习记录页接入学分计划（选课小窗+学习记录课程优先+手动选课自动采纳）\n" +
  "2026.11.27 v2.9.2/2.9.3 修学分计划卡在课程详情页：课件列表在 iframe 内需跨框读取；课件行新版结构=div.course[data-href]（无a链接），直接读 data-href 取 cwid 顶层导航；待考试课件纳入调度；播放页完成自动切下一门\n" +
  "2026.11.27 v2.8.8 修 AI 422「missing field content」：v2.8.5 把 messages content 误写成未定义变量被 JSON.stringify 丢弃；补真函数回归测试防复发\n" +
  "2026.11.27 v2.8.7 DeepSeek 专例：/anthropic 地址自动规范化为 /v1（OpenAI 格式）——实测 /anthropic 兼容层对请求体校验不稳定（同一体部分环境 422 反序列化失败），/v1 处处稳定且支持关思考；同 Key 两端点通用，配置无需改\n" +
  "2026.11.27 v2.8.6 AI报错带上服务端原文（422=参数错误，响应体写明哪个字段不合法，如模型名抄错带脚注；401=Key无效 402=余额不足），不再只报状态码猜原因\n" +
  "2026.11.27 v2.8.5 实测修复 AI「响应无文本」：DeepSeek Anthropic 兼容层 content 是分块数组且第一块是思考块（[{thinking},{text}]），旧解析只读第一块→永远空。现扫全块拼 text、无 text 块退 thinking；max_tokens 1024→4096（防长题思考耗尽截断）。用真实 Key 端到端验证 /anthropic 与 /v1 两格式均正确返回；AI 请求自动加 thinking:disabled 关闭思考（选择题无需推理，实测输出 13token→1token，两格式同参数均生效）\n" +
  "2026.11.27 v2.8.4 修复：切到另一节课会把中间库（历轮试错攒的正确答案）清空——进课页只清单次考试临时键，中间库仅在考试通过后清理；面板桥状态改 hyHasBridge 实时刷新（修“桥正常工作却显示未装”假象）；AI 空响应时亮出响应结构+原文片段定位真因；deepseek-chat/reasoner 下线提示\n" +
  "2026.11.27 v2.8.3 搜索桥检测加固：新增 DOM 事件通道（油猴沙箱隔离时 window 属性互不可见=「已装桥却提示未安装」的根因），桥脚本请更新到 v1.1.0；AI 响应解析兜底（reasoning模型/分段content/接口报错直透不再吞成“未返回选项字母”），DeepSeek 预设更新 deepseek-flash（2026 在售）；题库导出纳入考试中间库（未通过轮次已确认正确的题也能导出）\n" +
  "2026.11.27 v2.8.2 实测修正：考试按钮解锁信号=disabled移除（href恒为#，旧判据导致模式2进不了考试+片尾自愈误判无限重看）；待考试未解锁先等30秒再跳课；搜索提取修补：小写/全角字母、多选A,B,C、优先取题干后最近答案\n" +
  "2026.11.27 v2.8.1 导出含课堂问答（改存答案文字）；空库时显示各题库统计与原因；新增「搜索自检」按钮定位桥/验证页/未命中；课堂问答优先级改为 题库→百度→AI→试错\n" +
  "2026.11.27 v2.8.0 修复「上次答对的题还答错」：题干归一化匹配题库；作答链改为 题库→百度搜索→AI→试错，百度与AI互斥开关\n" +
  "2026.11.26 v2.6.1 AI支持智谱Anthropic兼容接口（/api/anthropic，预填glm-5-flash）；修复模式2视频播完不进考试直接切课的漏判（考试按钮已解锁即进考试）\n" +
  "2026.11.26 v2.6.0 面板重做：分区可折叠+限高滚动不再遮屏；AI配置改面板内表单（三项校验+保存/取消，不再连弹输入框）；实测2x同样触发时长校验→删除开课策略恒定1x\n" +
  "2026.11.26 v2.5.2 开课速度策略（1x稳/2x快可切换，2x被拒自动1x重看）；片尾学习中自愈重看；AI每次调用浮窗+面板显示；搜索代理熔断\n" +
  "2026.11.26 v2.5.1 倍速不再默认恢复历史值（每次打开一律1x，防止服务端判定「观看时长不足」）；自动确认「观看时长不足」弹窗重看；AI配置预填智谱免费接口\n" +
  "2026.11.26 v2.5.0 新增 4x/6x/8x 高倍速；新增联网搜答案（免费搜索+可选AI接口）；新增互动病例(case.91huayi.com)自动答题+步进\n" +
  "2026.11.26 v2.4.1 修复倍速播放弹「不能拖拽」温馨提示（页面改版后旧关闭逻辑失效，现强制隐藏+适配新版按钮）\n" +
  "2026.11.26 v2.4.0 静音双保险；面板新增课程进度+答案库导出导入；刷完系统通知\n" +
  "2026.8.27 v2.2.3 修复非油猴环境注入时面板版本号显示错误\n" +
  "2026.8.27 v2.2.2 修复课程页出现多个面板（脚本不再注入 iframe）\n" +
  "2026.8.25 v2.2.1 课堂问答自动试错答题（华医网自有组件，允许重复提交）\n" +
  "2026.8.24 v2.2.0 课程跳转优先级：学习中(高%)优先；自动关闭layer_tips弹窗\n" +
  "2026.8.24 v2.1.1 面板可拖拽/最小化/调透明度；登录页自动勾选协议\n" +
  "2026.8.24 v2.1.0 登录页自动填充解锁（Edge 可保存密码）+ 登录提示条\n" +
  "2026.8.24 v2.0.3-fix 修复视频播完不切课（本地播放完成检测）";
//更新历史
//■2026.6.10 新增暂停刷新跳转功能：视频暂停后等3秒刷新页面，若状态为已完成/待考试则自动搜索下一未学习/学习中课程
//■2026.6.9 新增课程列表页自动扫描功能：在课程列表页(course.aspx/cme.aspx)自动识别"未学习"、"播放至：x%"、"学习中"的课程，按优先级依次点击进入学习，实现从课程列表无人值守自动刷课。
//■2025.6.13 原作者跑路啦，无奈只能我接手更新了，对作者代码还不熟，将就着先用吧。修复了视频自动跳转下一个的问题。
//■2024.8.1网页布局和提示窗改版，调整检测逻辑；既然禁用倍速，不再显示变速按钮；得学分更快的双卫网小助手考试功能已开发完毕，正在优化缩短视频时间，完善后发布，欢迎天使投资人
//■2024.7.16因部分地区考试不用二维码，所以将进入考试的方式回滚到旧版本方便更多人使用，因此可能会导致部分全国通用版的用户依旧偶尔自动进入考试失败，以后再另行观察。感谢大家的意见
//■2024.7.14优化静音时间点；优化更新内容展示；优化播放逻辑，已完成的视频不再引起卡顿
//■2024.7.13优化进入考试的逻辑，不再依赖考试按钮
//■2024.7.11根据用户反馈，增加了登录界面关闭悬浮窗的按钮
//■2024.7.8增加了当前页面是否有对应代码的提示，增加了作者脚本的分享链接
//■2024.6.21智能检测剩余任务，以防有人直接看最后一节课导致脚本发呆
//■2024.6.19新增了从考试结果界面自动返回原课程的功能（官方网站改版，主动删除网页中的继续学习按钮）
//■2024.6.18针对华医网答题模块改版，已更新语法
//■2024.6.7根据赞赏和评论区反馈，修复了一种视频意外暂停的情况
//■2024.6.5增加视频过程中对温馨提示（疲劳）的检测
//■2024.6.3尝试修复CC播放器和保利威播放器加载事件bug
//■2024.4.28由于与用户无法取得联系，在页面上增加了反馈机制的说明
//■2024.4.15修复了不自动切换视频的问题（因网站版本限制，目前脚本倍速已失效）
//■2024.1.11在人脸识别页面增加温馨提醒，考试功能仅为答案遍历，而非自动搜索答案
//■2023.12.25添加了网页静音代码，润物细无声
//■2023.12.24优化了倍速调整的逻辑，无需刷新网页
//■2023.12.21将脚本控制台上移到显眼的位置，方便用户操作；增加生效的倍速按钮变色(删除了原先的文字提醒)
//■2023.12.15新增模式切换，可以选择先单刷视频（无人值守），刷完再打开考试开关，就可以连续考试了
//■2023.12.3优化了视频播放逻辑，能够自动切换下一个视频，而不是播完1个就卡在考试认证处（也导致了不修改代码就无法进入考试）
//■2023.12.1调整默认播放速度5倍（仅首次登录起效，后续以用户更改过的倍速保存），免得用户感觉不到脚本在运行

// ═══════════════════════════════════════════
// 顶层窗口判定（配合 @noframes 双保险）
// 课程页嵌了 4 个同域 iframe（临床指南/用药帮手/临床路径/华医AI），
// 若脚本注入 iframe 会各自弹出一个"此页面非视频、考试或未适配"面板。
// 仅在顶层窗口运行，iframe 内一律不执行。
// ═══════════════════════════════════════════
function __hyIsTopFrame__() {
  try {
    return window.top === window.self;
  } catch (e) {
    // 跨域访问 window.top 抛异常 → 说明当前就在 iframe 里
    return false;
  }
}

// ═══════════════════════════════════════════
// 反作弊拦截（document-start阶段执行）
// 必须在页面脚本注册click监听器之前拦截
// ═══════════════════════════════════════════
(function () {
  if (!__hyIsTopFrame__()) return;
  // 【核心修复0】最早时机：保存原始 console 方法，防止页面脚本覆盖
  var _rawConsole = {};
  try {
    _rawConsole.log = console.log.bind(console);
    _rawConsole.warn = console.warn.bind(console);
    _rawConsole.error = console.error.bind(console);
  } catch (e) {}
  // 保存原始 console 对象的引用（必须在 defineProperty 之前）
  var _origConsole = window.console;
  // 阻止页面覆盖 console
  try {
    Object.defineProperty(window, "console", {
      get: function () {
        return _origConsole;
      },
      set: function () {},
      configurable: false,
    });
  } catch (e) {}
  // 用安全封装替代全局 console.log
  var _safeLog = function () {
    try {
      _rawConsole.log.apply(null, arguments);
    } catch (e) {}
  };
  window.__huaYiLog = _safeLog; // 暴露给后续代码使用
  window.__rawConsole = _rawConsole; // 暴露原始 console 方法供恢复

  // 【核心修复】最早时机：在页面任何脚本执行前，立即将 blockAbnormalPlugin 覆盖为空函数
  // 这是最关键的一步，必须在页面定义/调用它之前完成
  try {
    window.blockAbnormalPlugin = function () {};
    _safeLog("【子川助手】已抢先覆盖 blockAbnormalPlugin");
  } catch (e) {}

  // 【核心修复】拦截 Object.defineProperty，防止页面用不可配置方式重新定义 blockAbnormalPlugin
  var _origDefineProperty = Object.defineProperty;
  Object.defineProperty = function (obj, prop, descriptor) {
    if (obj === window && prop === "blockAbnormalPlugin") {
      _safeLog(
        "【子川助手】已拦截 blockAbnormalPlugin 的 Object.defineProperty 重定义",
      );
      return window;
    }
    return _origDefineProperty.apply(this, arguments);
  };

  // 拦截 addEventListener：扩大拦截范围，所有在 document 上检查 isTrusted 的 click 监听器一律拦截
  var _origAddEventListener = EventTarget.prototype.addEventListener;
  EventTarget.prototype.addEventListener = function (type, listener, options) {
    // 拦截 contextmenu 事件监听，防止考试页面禁用右键
    if (type === "contextmenu") {
      _safeLog("【子川助手】已拦截右键屏蔽监听器");
      return;
    }
    if (this === document && type === "click") {
      var listenerStr = String(listener);
      // 扩大拦截：只要是检查 isTrusted 的 click 监听器都拦截（不限于 blockAbnormalPlugin）
      if (listenerStr.indexOf("isTrusted") !== -1) {
        _safeLog("【子川助手】已拦截反脚本点击检测监听器");
        return;
      }
    }
    return _origAddEventListener.call(this, type, listener, options);
  };

  // 拦截 setInterval：阻止倍速检测定时器 + 修复 queryIsAuth 泄漏
  var _faceIntervals = {}; // 追踪 face.aspx 页面 queryIsAuth 定时器
  var _origSetInterval = window.setInterval;
  window.setInterval = function (callback, delay) {
    var cbStr = String(callback);
    if (
      cbStr.indexOf("blockAbnormalPlugin") !== -1 &&
      cbStr.indexOf("ratePlayLimitNum") !== -1
    ) {
      _safeLog("【子川助手】已拦截倍速检测定时器");
      return 0;
    }
    var id = _origSetInterval.apply(this, arguments);
    // 自动管理 queryIsAuth 定时器：每次新建前清理旧定时器，防止泄漏
    if (cbStr.indexOf("queryIsAuth") !== -1) {
      var keys = Object.keys(_faceIntervals);
      for (var k = 0; k < keys.length; k++) {
        clearInterval(_faceIntervals[keys[k]]);
        delete _faceIntervals[keys[k]];
      }
      _faceIntervals[id] = id;
    }
    return id;
  };

  // 代理 clearInterval：修复页面 clearInterval(queryIsAuth) 传入函数引用无效的 bug
  var _origClearInterval = window.clearInterval;
  window.clearInterval = function (id) {
    if (typeof id === "function" && id.name === "queryIsAuth") {
      var keys = Object.keys(_faceIntervals);
      for (var k = 0; k < keys.length; k++) {
        _origClearInterval(_faceIntervals[keys[k]]);
        delete _faceIntervals[keys[k]];
      }
      return;
    }
    if (_faceIntervals[id]) {
      delete _faceIntervals[id];
    }
    return _origClearInterval.call(this, id);
  };

  // 【新增】拦截 setTimeout：同样可能有反脚本检测延时器
  var _origSetTimeout = window.setTimeout;
  window.setTimeout = function (callback, delay) {
    var cbStr = String(callback);
    if (cbStr.indexOf("blockAbnormalPlugin") !== -1) {
      _safeLog("【子川助手】已拦截反脚本 setTimeout");
      return 0;
    }
    return _origSetTimeout.apply(this, arguments);
  };

  // Body 出现时立即清除页面限制（比 DOMContentLoaded 更早）
  if (typeof MutationObserver !== "undefined") {
    var _bodyObserver = new MutationObserver(function (mutations, obs) {
      if (document.body) {
        obs.disconnect();
        try {
          document.body.removeAttribute("oncontextmenu");
          document.body.removeAttribute("oncopy");
          document.body.removeAttribute("onbeforecopy");
          document.body.removeAttribute("onhelp");
          document.body.oncontextmenu = null;
          document.body.oncopy = null;
          document.body.onbeforecopy = null;
          document.body.onhelp = null;
          document.oncontextmenu = null;
        } catch (e) {}
      }
    });
    _bodyObserver.observe(document.documentElement || document, {
      childList: true,
      subtree: true,
    });
  }
})();

// ═══════════════════════════════════════════════════════════════════════════
// 登录页(secure/login.aspx)自动填充解锁 —— document-start 立即执行
// 官方禁用浏览器自动填充的三招：
//   ① 密码框 autocomplete="new-password" + 账号框 autocomplete="off"
//   ② 密码框 type="text"（非 password，Edge 识别密码框并提示保存的硬前提被破坏）
//   ③ display:none 蜜罐假框（标准 username/password），诱导浏览器把凭据填进看不见的框
// 本模块把这些属性还原，让 Edge 像普通网站一样正常保存/回填账号密码。
// 不自动填表、不做复杂操作，仅在登录页顶部显示一条解锁提示条（可关闭）。
// ═══════════════════════════════════════════════════════════════════════════
(function () {
  "use strict";
  if (!__hyIsTopFrame__()) return;
  if (location.hostname.indexOf("91huayi.com") === -1) return;
  var tipShown = false;

  function unlock() {
    // ① 密码框还原为标准密码框
    var pwd = document.getElementById("txt_user_pwd");
    if (pwd) {
      pwd.setAttribute("type", "password");
      pwd.setAttribute("autocomplete", "current-password");
    }
    // ② 账号框还原
    var user = document.getElementById("txt_user_name");
    if (user) {
      user.setAttribute("autocomplete", "username");
    }
    // ③ 蜜罐假框全部降级为 off
    var divs = document.querySelectorAll(
      'div[style*="display: none"], div[style*="display:none"]',
    );
    for (var i = 0; i < divs.length; i++) {
      var inputs = divs[i].querySelectorAll("input");
      for (var j = 0; j < inputs.length; j++) {
        inputs[j].setAttribute("autocomplete", "off");
      }
    }
    // ④ 自动勾选"我已仔细阅读并同意"协议复选框
    var checkboxes = document.querySelectorAll('input[type="checkbox"]');
    for (var k = 0; k < checkboxes.length; k++) {
      var label = checkboxes[k].parentElement
        ? checkboxes[k].parentElement.textContent
        : "";
      if (
        label.indexOf("同意") !== -1 ||
        label.indexOf("协议") !== -1 ||
        label.indexOf("保护政策") !== -1
      ) {
        if (!checkboxes[k].checked) {
          checkboxes[k].checked = true;
          checkboxes[k].dispatchEvent(new Event("change", { bubbles: true }));
          checkboxes[k].dispatchEvent(new Event("click", { bubbles: true }));
        }
        break;
      }
    }
  }

  function showTip() {
    if (tipShown) return;
    // 使用 v2 key，旧版已关闭的不受影响（新功能新提示）
    try {
      if (localStorage.getItem("hyu_unlock_tip_dismissed_v2")) return;
    } catch (e) {}
    tipShown = true;

    function doInsert() {
      // 防重复
      if (document.getElementById("hyu-unlock-tip")) return;

      var tip = document.createElement("div");
      tip.id = "hyu-unlock-tip";
      tip.style.cssText =
        "position:fixed;top:0;left:0;right:0;z-index:999999;" +
        "background:#eaf6fb;border-bottom:1px solid #188AAE;" +
        "color:#0e5d7a;padding:10px 20px;" +
        'font:13px/1.5 "Microsoft YaHei",sans-serif;' +
        "display:flex;align-items:center;justify-content:center;gap:10px;";
      tip.innerHTML =
        '<span style="font-size:18px;">🔓</span>' +
        "<span>" +
        "<b>「子川助手」</b> 已解除官方浏览器自动填充限制，" +
        "浏览器现在可以正常保存/回填账号密码" +
        "</span>" +
        '<span id="hyu-unlock-tip-x" title="关闭" style="cursor:pointer;color:#188AAE;font-weight:700;font-size:16px;line-height:1;flex-shrink:0;padding:0 4px;">✕</span>';
      (document.body || document.documentElement).appendChild(tip);
      tip
        .querySelector("#hyu-unlock-tip-x")
        .addEventListener("click", function () {
          try {
            localStorage.setItem("hyu_unlock_tip_dismissed_v2", "1");
          } catch (e) {}
          if (tip.parentNode) tip.parentNode.removeChild(tip);
        });
    }

    if (document.body) {
      doInsert();
    } else {
      document.addEventListener("DOMContentLoaded", doInsert);
      window.addEventListener("load", doInsert);
    }
  }

  function tryUnlock() {
    if (document.getElementById("txt_user_pwd")) {
      unlock();
      showTip();
      return true;
    }
    return false;
  }

  // MutationObserver 抢在 Edge 自动填充之前把属性改好（document 一定存在，稳妥）
  var root = document.documentElement || document;
  var obs = new MutationObserver(function () {
    if (tryUnlock()) obs.disconnect();
  });
  try {
    obs.observe(root, { childList: true, subtree: true });
  } catch (e) {}
  // 多级兜底：立即试一次 + DOM 就绪 + load（幂等）
  tryUnlock();
  document.addEventListener("DOMContentLoaded", function () {
    tryUnlock();
  });
  window.addEventListener("load", function () {
    tryUnlock();
  });
})();

// Wait for DOM ready since @run-at document-start
function __hyInit__() {
  if (!__hyIsTopFrame__()) return;
  (function () {
    "use strict";

    // 【登录页分流】secure/login.aspx 的自动填充解锁由顶层 IIFE 处理，这里直接返回
    if (document.getElementById("txt_user_pwd")) {
      console.log("【子川助手】检测到登录页，仅启用自动填充解锁");
      return;
    }

    // 【hysslogin SSO 登录页】Vue 应用，直接操作 Vue 实例填账号密码
    if (location.hostname.indexOf("hysslogin") !== -1) {
      try { HY_hyssloginHelper(); } catch (e) { console.error("【子川助手·hysslogin登录助手】初始化错误:", e); }
      return;
    }

    // 【存活证明】在页面左上角注入一个不可见的标记，证明脚本已注入
    try {
      var _indicator = document.createElement("div");
      _indicator.id = "__huayi_helper_loaded__";
      _indicator.style.cssText =
        "position:fixed;top:0;left:0;width:0;height:0;overflow:hidden;z-index:-1;";
      if (document.body) document.body.appendChild(_indicator);
    } catch (e) {}

    // 【恢复 console】页面脚本（hyjquery.min.js）可能覆盖了 console.log
    // 直接通过 Object.defineProperty 强制覆盖，绕过只读限制
    try {
      if (window.__rawConsole) {
        Object.defineProperty(console, "log", {
          value: window.__rawConsole.log,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(console, "warn", {
          value: window.__rawConsole.warn,
          writable: true,
          configurable: true,
        });
        Object.defineProperty(console, "error", {
          value: window.__rawConsole.error,
          writable: true,
          configurable: true,
        });
        console.info = window.__rawConsole.log; // 备用：页面通常不会覆盖 info
      }
    } catch (e) {}
    // 同时写入页面可见标记，证明脚本已执行
    try {
      if (document.body) {
        var _dbg = document.createElement("div");
        _dbg.id = "__hy_dbg__";
        _dbg.textContent = "子川助手已加载";
        _dbg.style.cssText =
          "position:fixed;bottom:2px;right:2px;font-size:10px;color:#4cb0f9;z-index:99999;opacity:0.8;pointer-events:none;";
        document.body.appendChild(_dbg);
        setTimeout(function () {
          var el = document.getElementById("__hy_dbg__");
          if (el) el.remove();
        }, 5000);
      }
    } catch (e) {}

    // 清除页面内联的右键/复制/帮助限制（考试页面会设置这些属性）
    (function cleanupBodyRestrictions() {
      try {
        var body = document.body;
        if (!body) return;
        body.removeAttribute("oncontextmenu");
        body.removeAttribute("oncopy");
        body.removeAttribute("onbeforecopy");
        body.removeAttribute("onhelp");
        body.oncontextmenu = null;
        body.oncopy = null;
        body.onbeforecopy = null;
        body.onhelp = null;
        // 同时移除 document 级别的右键限制
        document.oncontextmenu = null;
        console.log("【子川助手】已清除页面右键/复制限制");
      } catch (e) {}
    })();

    var submitTime = 4900; //交卷时间控制
    var reTryTime = 2100; //重考,视频进入考试延时控制
    var examTime = 5000; //听课完成进入考试延时
    var randomX = 5000; //随机延时上限
    var vSpeed = 1; //首次使用脚本的默认播放速度
    var autoSkip = false; //一个可能会封号的功能。
    //记录字段
    var keyPlayRate = "JJ_Playrate";
    var keyTest = "JJ_Test";
    var keyResult = "JJ_Result";
    var keyThisTitle = "JJ_ThisTitle";
    var keyTestAnswer = "JJ_TestAnswer";
    var keyRightAnswer = "JJ_RightAnswer";
    var keyAllAnswer = "JJ_AllAnswer";
    //按钮样式
    var btstyleB =
      "font-size: 12px;font-weight: 300;text-decoration: none;text-align: center;line-height: 20px;height: 20px;padding: 0 5px;display: inline-block;appearance: none;cursor: pointer;border: none;box-sizing: border-box;transition-property: all;transition-duration: .3s;background-color: #4cb0f9;border-color: #4cb0f9;border-radius: 4px;margin: 5px;color: #FFF;";
    //页面判别
    var urlInfos = window.location.href.split("/");
    var urlTip = urlInfos[urlInfos.length - 1].split("?")[0];
    var huayi = getHuayi();
    var nspeed = 0;
    var clock = null;
    var clockms = null; // killsendQuestion3 定时器引用（全局共享）
    var courseFinished = false; // 防止两个检测器重复触发跳转
    var navCooldownUntil = 0; // 跳转冷却期：此时间戳之前禁止再次跳转
    var hyuExamWaitUntil = 0; //【v2.8.2】待考试但按钮未解锁时的等待截止时间（最多30s）
    var _lastCompletedCheck = 0; // debounce：连续两次读到"已完成"才真正触发
    var hyuExamWaitStart = 0; //【v2.10.4】考试按钮解锁等待起点（弹窗/后台延迟时不跳过）

    advis();
    var tixingEl = document.querySelector("[id='tixing']");
    if (tixingEl)
      tixingEl.innerHTML =
        "当前网址已适配ヾ(๑╹◡╹)ﾉ&quot<br>失效请赞赏联系&nbsp&nbspε(┬┬﹏┬┬)3";
    // 【v2.5.0】互动病例（case.91huayi.com）——注意其 URL 查询串含未编码的
    // backUrl=http://...，urlTip 的 split("/") 计算会被干扰，故改用 hostname 判定
    if (location.hostname.indexOf("case.91huayi.com") !== -1) {
      console.log("当前任务: 互动病例自动学习");
      var caseTipEl = document.querySelector("[id='tixing']");
      if (caseTipEl)
        caseTipEl.innerHTML =
          "互动病例自动答题+步进中ヾ(๑╹◡╹)ﾉ<br>答错不卡流程，参考答案自动入库";
      caseInteractiveStart();
    } else if (urlTip == "face.aspx") {
      //刷脸认证页面
      console.log("当前任务: 刷脸认证");
      huayi.faceAuth();
    } else if (urlTip == "course_ware_polyv.aspx") {
      //保利威播放器视频页面
      console.log("当前任务: 华医看视频");
      document.querySelector("div[id='Div1']").style.top = "40px";
      huayi.seeVideo(1);
    } else if (urlTip == "course_ware_cc.aspx") {
      //CC播放器视频页面
      console.log("当前任务: 华医看视频");
      document.querySelector("div[id='Div1']").style.top = "40px";
      huayi.seeVideo(2);
    } else if (urlTip == "exam.aspx") {
      //考试页面
      console.log("当前任务: 华医考试");
      // 再次确保清理 body 限制
      (function () {
        try {
          var body = document.body;
          if (body) {
            body.removeAttribute("oncontextmenu");
            body.removeAttribute("oncopy");
            body.removeAttribute("onbeforecopy");
            body.removeAttribute("onhelp");
            body.oncontextmenu = null;
          }
          document.oncontextmenu = null;
        } catch (e) {}
      })();
      // 如果 DOMContentLoaded 阶段题目还未加载，轮询等待
      var examRetry = 0;
      function tryDoTest() {
        var questions = document.querySelectorAll("table.tablestyle");
        if (questions.length > 0) {
          console.log("【子川助手】考试题目已加载，开始答题");
          huayi.doTest();
        } else if (examRetry < 30) {
          examRetry++;
          setTimeout(tryDoTest, 500);
        } else {
          console.log("【子川助手】考试题目加载超时，强制尝试");
          huayi.doTest();
        }
      }
      tryDoTest();
    } else if (urlTip == "course.aspx" || urlTip == "cme.aspx") {
      //课程列表页面
      console.log("当前任务: 课程列表");
      huayi.courseList();
    } else if (urlTip == "exam_result.aspx") {
      //考试结果页面
      console.log("当前任务: 华医考试结果审核");
      ensurePageScripts(function () {
        huayi.doResult();
      });
    } else {
      console.log("其它情况");
      // 【v2.9.4】官网首页（www.91huayi.com）公告弹窗遮挡整页点击：pcPopupOverlay
      // （mednews 公告 iframe）+ imagePreviewOverlay（空图片预览层 z-index 9999）盖住
      // 全页 → 点「继续教育」等任何菜单都没反应。自动隐藏这两个层（实测隐藏后跳转正常）
      (function autoDismissHomeOverlays() {
        var n = 0;
        var t = setInterval(function () {
          var hit = false;
          ["pcPopupOverlay", "imagePreviewOverlay"].forEach(function (id) {
            var el = document.getElementById(id);
            if (el && el.style.display !== "none") {
              el.style.display = "none";
              hit = true;
            }
          });
          if (hit) {
            console.log("【子川助手】已自动关闭官网首页遮挡弹层（解除整页点击遮挡）");
            clearInterval(t);
          }
          if (++n > 30) clearInterval(t);
        }, 1000);
      })();
      // 【2026.8.24】自动关闭课程列表页的弹窗
      (function autoClosePopups() {
        function tryClose() {
          // 关闭 Vue 弹窗（wind_layer）
          var checkbox = document.querySelector('.wind_layer .checkbox-input');
          var windBtn = document.querySelector('.wind_layer .imp_btn');
          if (checkbox && !checkbox.checked) {
            checkbox.checked = true;
            checkbox.dispatchEvent(new Event('change', { bubbles: true }));
          }
          if (windBtn) windBtn.click();
          // 关闭提示弹窗（layer_tips）
          var tipBtn = document.getElementById('btn_course_tip_ok');
          if (tipBtn) tipBtn.click();
        }
        // 立即尝试
        setTimeout(tryClose, 1000);
        // MutationObserver 兜底（Vue 异步渲染）
        var observer = new MutationObserver(function () {
          if (document.querySelector('.wind_layer .imp_btn') || document.getElementById('btn_course_tip_ok')) {
            tryClose();
            observer.disconnect();
          }
        });
        observer.observe(document.body || document.documentElement, { childList: true, subtree: true });
      })();
      var urlInf = window.location.href.split("/");
      var urlErr = urlInf[urlInf.length - 3].split("?")[0];
      if (urlErr == "error.html") {
        setTimeout(function () {
          console.log("网络错误，等待后台数据同步后刷新网页");
          location.reload();
        }, 15000); // 15秒后刷新，确保状态已更新
      } else {
        try {
          var tixingEl2 = document.querySelector("[id='tixing']");
          if (tixingEl2)
            tixingEl2.innerHTML =
              "此页面非视频、考试或未适配<br>失效请赞赏联系&nbsp&nbspε(┬┬﹏┬┬)3";
        } catch (error) {}
      }
    }

    // 禁用反作弊检测（覆盖 blockAbnormalPlugin 全局函数，静默所有异常插件提示）
    function killAntiCheat() {
      try {
        if (typeof blockAbnormalPlugin === "function") {
          window.blockAbnormalPlugin = function () {};
          console.log("【子川助手】blockAbnormalPlugin 已覆盖为空函数");
        }
      } catch (e) {}
      // 清除 body 上的右键/复制/帮助限制（考试页面 via 内联属性）
      try {
        var body = document.body;
        if (body) {
          body.removeAttribute("oncontextmenu");
          body.removeAttribute("oncopy");
          body.removeAttribute("onbeforecopy");
          body.removeAttribute("onhelp");
          body.oncontextmenu = null;
          body.oncopy = null;
          body.onbeforecopy = null;
          body.onhelp = null;
        }
        document.oncontextmenu = null;
      } catch (e) {}
    }

    function getHuayi() {
      return {
        courseList: function () {
          addAnwserCopybtn();
          DelAllAnwser();

          console.log("【子川助手】课程列表页，开始扫描待学习课程...");
          // 延时确保页面完全加载后再扫描
          setTimeout(function () {
            autoEnterCourse();
          }, 1500);
        },
        seeVideo: function (e) {
          suppressProcessbarTip(); // 【v2.4.1】根除「不能拖拽」提示弹窗（倍速跳跃必触发，详见函数注释）
          // 【v2.5.1→v2.6.0】倍速恒定 1x。服务端校验的是真实观看时长（墙钟），
          // 不是播放进度：>1x 提前"播完"会触发「观看时长不足」完成被拒（用户实测
          // 2x 同样被拒，v2.5.2 的开课速度策略已删除）。倍速按钮仅页内临时使用。
          var playRateNow = 1;
          // 【v2.8.4 修复】进课页只清单次考试的临时键（本次试错进度/错题表/答案暂存）。
          // 原来调用 cleanKeyStorage() 连中间库 JJ_RightAnswer 一起清——切到另一节课
          // 就把历轮试错攒下的正确答案全部抹掉（v2.8.3 导出计数含中间库后用户才看见）。
          // 中间库只在考试「通过」时（doResult）随正式库合并后统一清理。
          cleanExamTempOnly();

          // 【新增】刷新后检查：如果由暂停刷新触发，扫描侧边栏状态，已完成/待考试则跳转下一课程
          (function () {
            var skipDone = sessionStorage.getItem("hua_yi_post_refresh");
            if (skipDone) {
              sessionStorage.removeItem("hua_yi_post_refresh");
              // 立即阻止检测循环再次触发刷新，防止死循环
              courseFinished = true;
              navCooldownUntil = Date.now() + 5000;
              console.log(
                "【子川助手】刷新后检测到标记，检查当前课程状态...",
              );
              setTimeout(function () {
                try {
                  var state = getCurrentCourseState();
                  if (state) {
                    console.log("【子川助手】刷新后课程状态: " + state);
                    if (state == "已完成" || state == "待考试") {
                      console.log(
                        "【子川助手】确认课程已" +
                          state +
                          "，搜索下一个未学习/学习中课程...",
                      );
                      var lis = document.querySelectorAll(
                        "li.lis-inside-content",
                      );
                      var found = false;
                      for (var i = 0; i < lis.length; i++) {
                        var status = getCourseStatus(lis[i]);
                        if (status === "未学习" || status === "学习中") {
                          console.log(
                            "【子川助手】找到课程（" +
                              status +
                              "），开始学习",
                          );
                          var targetLi = lis[i];
                          var navigated = false;
                          var onclickAttr =
                            targetLi.getAttribute("onclick") || "";
                          var urlMatch = onclickAttr.match(
                            /location\.href=["\u0027]([^"\u0027]+)["\u0027]/,
                          );
                          if (urlMatch && urlMatch[1]) {
                            window.location.href = urlMatch[1];
                            navigated = true;
                          }
                          if (!navigated) {
                            var h2 = targetLi.querySelector("h2");
                            if (h2) {
                              h2.click();
                              navigated = true;
                            }
                          }
                          if (!navigated) {
                            targetLi.click();
                          }
                          found = true;
                          break;
                        }
                      }
                      if (!found) {
                        console.log(
                          "【子川助手】未找到未学习或学习中课程，可能全部已完成",
                        );
                      }
                    } else {
                      console.log(
                        "【子川助手】课程状态为" + state + "，继续正常播放",
                      );
                    }
                  }
                } catch (e) {
                  console.log("【子川助手】刷新后状态检查出错: " + e);
                }
              }, 2000);
            }
          })();
          asynckillsendQuestion(); //屏蔽课堂问答的函数；
          killsendQuestion2(); //屏蔽课堂问答的函数2；

          killsendQuestion3(); //循环检测问答对话框是否弹出。
          qaStart(); //【v2.2.1】课堂问答自动试错答题（华医网自有组件）

          // 倍速按钮和脚本信息已整合到 advis() 面板中
          //速度调节部分

          // 立即应用倍速（不等onload，polyv播放器可能已初始化）
          ratechg(playRateNow);
          console.log("【子川助手】已触发倍速设置: " + playRateNow + "x");

          window.onload = function () {
            localStorage.setItem(
              keyThisTitle,
              JSON.stringify(window.document.title),
            ); //储存章节标题
            // console.log("准备激活加速");
            ratechg(playRateNow);
            if (autoSkip == true) {
              //秒过功能，签完别尝试
              setTimeout(
                function () {
                  skipVideo();
                },
                submitTime + Math.ceil(Math.random() * randomX),
              );
              console.log("秒过了！");
            }
            clock = setInterval(examherftest, 3000);
            switch (e) {
              case 1:
                  window.s2j_onPlayerInitOver();
                  {
                    // console.log("polyv加载完毕，静音，稍后尝试触发一次播放");
                    player?.j2s_setVolume(0);
                    muteAllVideos(); // 【v2.4.0】静音双保险
                    setTimeout(function () {
                      try {
                        //document.querySelector("video").volume = 0;//实际测试，主要靠这一条静音
                        player.j2s_resumeVideo();
                        muteAllVideos(); // 恢复播放后再压一次音量（防外部事件恢复音量）
                        examherftest();
                        hyuAfterResume(); // 【v2.5.2】时长不足自愈（见函数注释）
                      //document.querySelector("button[onclick='closeBangZhu()']").click();//关闭温馨提醒
                    } catch (error) {
                      console.log("上一段代码有误");
                    }
                  }, 2000); //延时点击播放，之前是5秒
                }
                break;
              case 2:
                  window.on_CCH5player_ready();
                  {
                    //console.log("CCplayer加载完毕，静音，稍后尝试触发一次播放");
                    cc_js_Player?.setVolume(0);
                    muteAllVideos(); // 【v2.4.0】静音双保险
                    setTimeout(function () {
                      try {
                        //document.querySelector("video").volume = 0;//实际测试，主要靠这一条静音
                        cc_js_Player.play().catch(function () {});
                        muteAllVideos(); // 恢复播放后再压一次音量（防外部事件恢复音量）
                        examherftest();
                        hyuAfterResume(); // 【v2.5.2】时长不足自愈（见函数注释）
                      //document.querySelector("button[onclick='closeBangZhu()']").click();//关闭温馨提醒
                    } catch (error) {
                      console.log("上一段代码有误");
                    }
                  }, 2000); //延时点击播放，之前是5秒
                }
                break;
              default:
                console.log("其他播放器？");
            }
            startWatchEnd(); //【修复 2026.8.24】启动本地播放完成检测（不依赖华医网状态翻转）
          };
        },
        doTest: async function () {
          var questions = JSON.parse(localStorage.getItem(keyTest)) || {};
          var qRightAnswer =
            JSON.parse(localStorage.getItem(keyRightAnswer)) || {};
          if (JSON.stringify(qRightAnswer) == "{}") {
            qRightAnswer = LoadRightAnwser();
          }
          var qTestAnswer = {};
          var index = 0;
          // 【v2.10.4】上次交卷的错题表：答错过的题本轮不再重复吃同一答案（AI/题库都跳过种子）
          var qWrongLast = JSON.parse(localStorage.getItem(keyResult)) || {};

          // 【v2.8.0】作答优先级（按用户要求）：①题库/答案库 → ②百度搜索（开百度时）
          // → ③AI（仅百度关闭且 AI 开启时）→ ④试错。百度/AI 互斥：开了百度就不再问
          // AI（省 token，见面板开关联动）；两者都关则直接试错。
          var aiAnswers = {};
          try {
            var tables = document.querySelectorAll(
              "table[class='tablestyle']",
            );
            var askList = [];
            for (var ti = 0; ti < tables.length; ti++) {
              var tq = null;
              try {
                tq = tables[ti]
                  .querySelector(".q_name")
                  .innerText.replace(/^[0-9]+[、.，,]\s*/, "")
                  .replace(/\s*/g, "");
              } catch (e) {
                continue;
              }
              if (qRightAnswer.hasOwnProperty(tq)) continue;
              if (questions.hasOwnProperty(tq)) continue;
              var labels = tables[ti].getElementsByTagName("label");
              var opts = [];
              for (var oi = 0; oi < labels.length; oi++) {
                opts.push((labels[oi].innerText || "").trim());
              }
              if (opts.length > 1) askList.push({ q: tq, opts: opts });
            }
              if (askList.length) {
                var useSearch = searchOn();
                var useAi = aiReady() && !useSearch; // 互斥：百度开则 AI 不参与
                // 【v2.8.1】开百度但没装搜索桥——直连不可用只能走公共代理（大陆基本不通），
                // 提前明确告知，避免"开了百度还是试错"却不知原因
                if (useSearch && !hyHasBridge()) {
                  hyToast(
                    "⚠️ 百度搜索已开但未装「搜索桥」脚本（hua-yi-search.user.js）——当前只能走公共代理，大概率搜不到、回退试错。安装后刷新即可直连",
                  );
                }
                var mode = useSearch
                  ? "百度搜索"
                  : useAi
                    ? "AI"
                    : "试错";
                console.log(
                  "【子川助手】对 " +
                    askList.length +
                    " 道未知答案题目作答（当前联网方式：" +
                    mode +
                    "）",
                );
                hyToast("🤝 联网预答 " + askList.length + " 道未知题（" + mode + "）");
              for (var ki = 0; ki < askList.length; ki++) {
                var gotAns = null;
                if (useSearch) {
                  try {
                    var sAns = await freeSearchAnswer(
                      askList[ki].q,
                      askList[ki].opts,
                    );
                    if (sAns) {
                      gotAns = sAns.charAt(0);
                      console.log(
                        "【子川助手·搜索】第 " + (ki + 1) + " 题命中 → " + gotAns,
                      );
                      hyToast("🔍 搜索第 " + (ki + 1) + " 题命中 → " + gotAns);
                    }
                  } catch (e) {}
                } else if (useAi) {
                  try {
                    gotAns = await aiAskChoice(askList[ki].q, askList[ki].opts);
                    console.log(
                      "【子川助手·AI】第 " + (ki + 1) + " 题 → " + gotAns,
                    );
                    hyToast("🤖 AI 第 " + (ki + 1) + " 题 → " + gotAns);
                  } catch (e) {
                    console.log(
                      "【子川助手·AI】第 " +
                        (ki + 1) +
                        " 题失败: " +
                        e.message,
                    );
                  }
                }
                if (gotAns) aiAnswers[askList[ki].q] = gotAns;
              }
            }
          } catch (e) {
            console.log("【子川助手】联网预答异常，全部回退试错: " + e.message);
          }

          while (true) {
            var question = document.querySelectorAll(
              "table[class='tablestyle']",
            )[index];

            if (question == null) break;
            else {
              var q = question
                .querySelector(".q_name")
                .innerText.replace(/^[0-9]+[、.，,]\s*/, "")
                .replace(/\s*/g, ""); //问题的具体文本

              // 【v2.8.0】题干归一化查找：修复"上次答对的题这次还答错"。
              // 旧逻辑 qRightAnswer[q] 精确匹配题干，题干里空格/标点/全半角/
              // 题号有任何差异就 miss → 重新从 A 试错。现先精确查，查不到用
              // 归一化（去空白+去标点）后的键模糊匹配题库，命中即回填正确答案。
              var hitKey = q;
              if (!qRightAnswer.hasOwnProperty(q)) {
                var nq = hyNormKey(q);
                for (var hk in qRightAnswer) {
                  if (hyNormKey(hk) === nq) {
                    hitKey = hk;
                    console.log(
                      "【子川助手】题干微调仍命中答案库（归一化匹配）: " +
                        q.slice(0, 20) +
                        "…",
                    );
                    break;
                  }
                }
              }

              if (qRightAnswer.hasOwnProperty(hitKey)) {
                //当查询到记录了正确答案时的操作

                //console.log("问题:"+ q + ",有答案:"+ qRightAnswer[hitKey]);
                var rightSelection = findAnwser(
                  "tbody",
                  index,
                  qRightAnswer[hitKey],
                ); //返回答案选项label
                // 【v2.10.4】上次交卷此题按该答案答错 → 从此答案字母推进下一项（打破死循环）
                var wrongBefore = qWrongLast.hasOwnProperty(q);
                if (rightSelection && wrongBefore) {
                  var bankLetter = (rightSelection.innerText || "")
                    .trim()
                    .substring(0, 1);
                  var nextLetter = getNextChoice(bankLetter);
                  var nextAnswer = getChoiceCode(nextLetter);
                  var nextLabel = document
                    .querySelectorAll("tbody")
                    [index].getElementsByTagName("label")[nextAnswer];
                  if (nextLabel) {
                    questions[q] = nextLetter;
                    try {
                      qTestAnswer[q] = nextLabel.innerText.substring(3);
                    } catch (error) {}
                    console.log(
                      "【子川助手】题库答案上次答错，推进到 " + nextLetter + ": " + q.slice(0, 20) + "…",
                    );
                    nextLabel.click();
                  } else {
                    // 推进越界（已到最后一项）→ 回 A 重启轮转
                    //【v2.10.6 修复】此前误点 rightSelection（还是题库的旧答案！）
                    questions[q] = "A";
                    var labelA = document
                      .querySelectorAll("tbody")
                      [index].getElementsByTagName("label")[0];
                    try {
                      qTestAnswer[q] = labelA.innerText.substring(3);
                    } catch (error) {}
                    console.log(
                      "【子川助手】选项推进越界，回到 A: " + q.slice(0, 20) + "…",
                    );
                    if (labelA) labelA.click();
                  }
                } else if (rightSelection) {
                  rightSelection.click();
                } else {
                  // 找不到匹配答案（可能选项文本已变化），回退到猜测模式
                  console.log("已知答案匹配失败，回退猜测: " + q);
                  if (questions.hasOwnProperty(q)) {
                    questions[q] = getNextChoice(questions[q]);
                  } else {
                    questions[q] = "A";
                  }
                  var answer = getChoiceCode(questions[q]);
                  var element = document
                    .querySelectorAll("tbody")
                    [index].getElementsByTagName("label")[answer];
                  if (!element) {
                    console.log(
                      "找不到选项，选项更改为A index: " +
                        index +
                        " answer: " +
                        answer,
                    );
                    questions[q] = "A";
                    answer = getChoiceCode("A");
                    element = document
                      .querySelectorAll("tbody")
                      [index].getElementsByTagName("label")[answer];
                  }
                  try {
                    var answerText = element.innerText.substring(3);
                    qTestAnswer[q] = answerText;
                  } catch (error) {
                    console.log("答案文本获取失败A：" + error);
                  }
                  element.click();
                }
              } else {
                if (
                  aiAnswers.hasOwnProperty(q) &&
                  !qWrongLast.hasOwnProperty(q)
                ) {
                  // 【v2.5.0】AI 联网答案作为试错的起点：答对随考试通过记入答案库；
                  // 【v2.10.4】上次交卷答错的题不再重复吃同一 AI/搜索答案——
                  // 否则每轮都被重置回同一错答案，试错推进被覆盖形成死循环
                  questions[q] = aiAnswers[q];
                  console.log(
                    "【子川助手·AI】" + q.slice(0, 24) + "… → 选择 " + aiAnswers[q],
                  );
                } else if (questions.hasOwnProperty(q)) {
                  questions[q] = getNextChoice(questions[q]); //通过Unicode数字+1切换到下一个选项，返回的是字母选项
                  //console.log("不知道答案:"+ q+"，测试："+questions[q]);
                } else {
                  //如果系统没有记录
                  questions[q] = "A";
                }

                var answer = getChoiceCode(questions[q]); //将字母选项转换为Unicode数字并减去A代表的65，等于选项顺序，0是第一个选项
                var element = document
                  .querySelectorAll("tbody")
                  [index].getElementsByTagName("label")[answer]; //获取到的是4-5个选项的数组answer等于选项顺序，0是第一个选项
                //document.querySelector("#gvQuestion_rbl_" + index + "_" + answer + "_" + index);

                if (!element) {
                  //选项除错机制
                  console.log(
                    "找不到选项，选项更改为A index: " +
                      index +
                      " answer: " +
                      answer,
                  );
                  questions[q] = "A";
                  answer = getChoiceCode("A");
                  element = document
                    .querySelectorAll("tbody")
                    [index].getElementsByTagName("label")[answer]; //获取到的是4-5个选项的数组answer等于选项顺序，0是第一个选项
                  //document.querySelector("#gvQuestion_rbl_" + index + "_" + answer + "_" + index);
                  //localStorage.removeItem(keyTest)
                }
                try {
                  var answerText = element.innerText.substring(3); //"A、"占用3个字符
                  //console.log("测试语法:" + (answerText == element.innerText.trim().substring(2)));

                  //element.nextSibling.innerText.trim().substring(2); //获得当前答案文本
                  qTestAnswer[q] = answerText;
                  //console.log("qTestAnswer："+error);
                } catch (error) {
                  console.log("答案文本获取失败A：" + error);
                }
                element.click();
              }
              index = index + 1;
            }
          }

          //存储相关记录

          localStorage.setItem(keyTest, JSON.stringify(questions));
          localStorage.setItem(keyTestAnswer, JSON.stringify(qTestAnswer));

          setTimeout(
            function () {
              document.querySelector("#btn_submit").click();
            },
            submitTime + Math.ceil(Math.random() * randomX),
          ); //交卷延时
          ///专用函数区
          function findAnwser(qakey, index, rightAnwserText) {
            var answerslist = document.querySelectorAll(qakey)[index];
            var arr = answerslist.getElementsByTagName("label");

            for (var i = 0; i < arr.length; i++) {
              //console.log(arr[i].innerText);
              if (arr[i].innerText.substring(3) == rightAnwserText) {
                //if (arr[i].innerText.trim().substring(2) == rightAnwserText) {
                return arr[i];
              }
            }
          }

          function getChoiceCode(an) {
            //用于获取选项字符编码
            var charin = an || "A";
            return charin.charCodeAt(0) - "A".charCodeAt(0);
          }

          function getNextChoice(an) {
            //用于获取下一个选项字符
            var code = an.charCodeAt(0) + 1;
            return String.fromCharCode(code);
          }
          ///专用函数区结束
        },
        faceAuth: function () {
          console.log("【子川助手】刷脸认证页面，确保脚本加载...");
          ensurePageScripts(function () {
            // 监听页面 QR 码状态，自动处理过期刷新
            setTimeout(function () {
              var refreshEl = document.getElementById("refresh");
              var saoRefresh = document.getElementById("sao_refresh");
              if (
                saoRefresh &&
                saoRefresh.style.display !== "none" &&
                refreshEl
              ) {
                console.log("【子川助手】检测到二维码已过期，自动刷新...");
                refreshEl.click();
              }
            }, 10000);

            console.log("【子川助手】刷脸认证页面修复完成");
            var tixingEl = document.querySelector("[id='tixing']");
            if (tixingEl)
              tixingEl.innerHTML = "刷脸认证页面<br>请使用掌上华医扫码";
          });
        },
        doResult: function () {
          //var res = document.getElementsByTagName("b")[0].innerText;
          //var dds = document.getElementsByTagName("dd");
          var res = $(".tips_text")[0].innerText;
          var dds = $(".state_cour_lis");
          localStorage.removeItem(keyResult); //移除错题表缓存

          // ===== 【2026.8.24 新增】检测"课程进度页"（视频播完后跳转到 exam_result.aspx）
          // 页面结构：li.state_cour_lis > p.state_lis_text + input.state_lis_btn[value="已完成"|"立即学习"|"待考试"]
          // 如果有"立即学习"按钮，说明是课程进度页而非考试结果页，直接点击下一课
          var nextBtn = null;
          var nextTitle = "";
          for (var i = 0; i < dds.length; i++) {
            var btn = dds[i].querySelector("input.state_lis_btn");
            var status = btn ? btn.value : "";
            if (status === "立即学习" || status === "待考试") {
              nextBtn = btn;
              var titleEl = dds[i].querySelector("p.state_lis_text");
              nextTitle = titleEl
                ? titleEl.getAttribute("title") || titleEl.innerText
                : "";
              break;
            }
          }
          if (nextBtn) {
            console.log(
              "【子川助手】检测到课程进度页，找到下一课：" + nextTitle,
            );
            setTimeout(function () {
              nextBtn.click();
            }, 1500);
            return; // 不走下面的考试逻辑
          }

          // ===== 原有考试结果逻辑 =====
          if (
            res == "考试通过" ||
            res == "考试通过！" ||
            res == "完成项目学习可以申请学分了"
          ) {
            //考试通过
            console.log("考试通过");
            saveRightAnwser(); //记录最后一次答对的题目。
            SaveAllAnwser(); //存储所有记录的答案
            cleanKeyStorage(); //如果通过清理答案

            // 考试通过后：回到课程列表页让 auto-scan 处理
            setTimeout(function () {
              console.log(
                "【子川助手】返回课程列表页，自动扫描将处理下一课程",
              );
              window.location.href = window.location.origin + "/pages/cme.aspx";
            }, 1000);
          } else {
            //考试没过
            console.log("考试未通过");
            document.querySelector("p[class='tips_text']").innerText =
              "本次未通过，正在尝试更换答案\r\n（此为正常现象，脚本几秒后刷新，请勿操作）";
            var qWrong = {};
            for (var i = 0; i < dds.length; ++i) {
              var imgEl = dds[i].querySelector("img");
              var pEl = dds[i].querySelector("p");
              if (!imgEl || !pEl) continue;
              if (!imgEl.src.includes("bar_img")) {
                //这里表示否定
                // 与 doTest() 保持一致的文本提取：去掉前2字符（如"1、"）再移除空白
                var wrongQ = pEl.title;
                // title 可能包含"1、问题文本"格式，统一去掉前缀序号
                wrongQ = wrongQ
                  .replace(/^\d+[、.，,]\s*/, "")
                  .replace(/\s*/g, "");
                qWrong[wrongQ] = i;
              }
            }

            if (Object.keys(qWrong).length > 0) {
              localStorage.setItem(keyResult, JSON.stringify(qWrong));
              saveRightAnwser();
              setTimeout(
                function () {
                  $("input[type=button][value='重新考试']").click();
                },
                (reTryTime + Math.ceil(Math.random() * randomX)) * 1,
              );

              //重新考试
            }
          }
        },
      };
    }

    //---------------------------------全局函数区------------------------------//
    // 通用：确保页面依赖脚本（jQuery / layer.js）已加载，失败则重新注入或刷新
    function ensurePageScripts(onReady, retryCount) {
      retryCount = retryCount || 0;
      if (retryCount > 3) {
        console.log("【子川助手】脚本加载重试超过3次，刷新页面...");
        setTimeout(function () {
          location.reload();
        }, 2000);
        return;
      }

      function injectScript(src, onload, onerror) {
        var s = document.createElement("script");
        s.src = src;
        s.onload = onload;
        s.onerror = onerror;
        document.head.appendChild(s);
      }

      // 检查 jQuery
      if (typeof $ === "undefined") {
        console.log(
          "【子川助手】jQuery 未加载，动态注入 (重试" + retryCount + ")...",
        );
        injectScript(
          "/scripts/hyjquery.min.js",
          function () {
            console.log("【子川助手】jQuery 注入成功");
            ensurePageScripts(onReady, 0); // 重置计数，继续检查 layer
          },
          function () {
            console.log("【子川助手】jQuery 注入失败，重试...");
            setTimeout(function () {
              ensurePageScripts(onReady, retryCount + 1);
            }, 1500);
          },
        );
        return;
      }

      // 检查 layer.js
      if (typeof layer === "undefined") {
        console.log(
          "【子川助手】layer.js 未加载，动态注入 (重试" +
            retryCount +
            ")...",
        );
        injectScript(
          "/scripts/layer/layer.js",
          function () {
            console.log("【子川助手】layer.js 注入成功");
            onReady();
          },
          function () {
            console.log("【子川助手】layer.js 注入失败，重试...");
            setTimeout(function () {
              ensurePageScripts(onReady, retryCount + 1);
            }, 1500);
          },
        );
        return;
      }

      // 都已就绪
      onReady();
    }

    //答案记录函数区开始//
    function SaveAllAnwser() {
      //保存历史题目答案
      var qAllAnswer = JSON.parse(localStorage.getItem(keyAllAnswer)) || {};
      var qRightAnswer = JSON.parse(localStorage.getItem(keyRightAnswer)) || {};
      var qTitle =
        JSON.parse(localStorage.getItem(keyThisTitle)) || "没有记录到章节名称";
      var qOldAnswer = qAllAnswer[qTitle] || {};
      for (var q in qRightAnswer) {
        qOldAnswer[q] = qRightAnswer[q];
      }
      qAllAnswer[qTitle] = qOldAnswer;

      if (qAllAnswer != null) {
        //保存正确答案
        localStorage.setItem(keyAllAnswer, JSON.stringify(qAllAnswer));
      }
    }
    function LoadRightAnwser() {
      //加载历史题目答案
      var qAllAnswer = JSON.parse(localStorage.getItem(keyAllAnswer)) || {};
      //var qRightAnswer = JSON.parse(localStorage.getItem(keyRightAnswer)) ||{};
      var qTitle =
        JSON.parse(localStorage.getItem(keyThisTitle)) || "没有记录到章节名称";
      if (qTitle == "没有记录到章节名称") {
        console.log("没找到章节名称");
      }
      var qOldAnswer = qAllAnswer[qTitle] || {};
      // 【v2.7.2】全库检索兜底：当前章节没记录的题，到所有章节找
      //（含「__导入题库__」——从题库文件导入的题不分章节，任何考试都能命中）
      for (var c in qAllAnswer) {
        if (typeof qAllAnswer[c] !== "object") continue;
        for (var q in qAllAnswer[c]) {
          if (!(q in qOldAnswer)) qOldAnswer[q] = qAllAnswer[c][q];
        }
      }
      return qOldAnswer;
    }
    function saveRightAnwser() {
      //记录本次测试到的正确答案

      var qRightAnswer = JSON.parse(localStorage.getItem(keyRightAnswer)) || {};
      var qTestAnswer = JSON.parse(localStorage.getItem(keyTestAnswer)) || {};
      var qkeyTest = JSON.parse(localStorage.getItem(keyTest)) || {};

      //错题表
      var qWrongs = JSON.parse(localStorage.getItem(keyResult)) || {};

      for (var q in qTestAnswer) {
        //debugger;
        var iswrong = false;
        if (!qWrongs.hasOwnProperty(q)) {
          //当查询到记录了正确答案时的操作
          console.log("正确的题目：" + q + "，答案：" + qTestAnswer[q]);
          qRightAnswer[q] = qTestAnswer[q];
        } else {
          console.log("错误的题目：" + q + "，答案：" + qTestAnswer[q]);
        }
      }
      localStorage.removeItem(keyTestAnswer); //清理临时记录
      if (qRightAnswer != null) {
        //保存正确答案
        localStorage.setItem(keyRightAnswer, JSON.stringify(qRightAnswer));
      }
    }
    //答案记录函数区结束//

    //答案复制相关按钮
    function addAnwserCopybtn() {
      //插入答案复制按钮
      var mainDiv = document.getElementById("main_div");
      if (!mainDiv) {
        console.log("【子川助手】当前页面无 main_div，跳过答案按钮插入");
        return;
      }
      let alink = document.createElement("a");
      alink.innerHTML = "显示已记录答案";
      alink.style = btstyleB;

      alink.onclick = function (event) {
        var qAllAnswer = JSON.parse(localStorage.getItem(keyAllAnswer)) || {};
        var Aout = JSON.stringify(qAllAnswer, null, "\t");
        //Aout=encodeURIComponent(Aout);
        //window.prompt("请复制",Aout);
        if (document.getElementById("AnwserOut")) {
          document.getElementById("AnwserOut").innerHTML = Aout;
        } else {
          let textout = document.createElement("textarea");
          textout.id = "AnwserOut";
          textout.innerHTML = Aout;
          textout.rows = 20;
          textout.cols = 30;
          var mDiv = document.getElementById("main_div");
          if (mDiv) {
            mDiv.parentNode.append(textout);
          } else {
            document.body.appendChild(textout);
          }
        }
      };
      mainDiv.parentNode.append(alink);
    }
    function DelAllAnwser() {
      //插入清除答案按钮
      var mainDiv = document.getElementById("main_div");
      if (!mainDiv) {
        console.log("【子川助手】当前页面无 main_div，跳过答案按钮插入");
        return;
      }
      let alink = document.createElement("a");
      alink.innerHTML = "清除已记录答案";
      alink.style = btstyleB;

      alink.onclick = function (event) {
        var r = confirm("确定清除历史答案？!");
        if (r) {
          localStorage.removeItem(keyAllAnswer);
        }
      };
      mainDiv.parentNode.append(alink);
    }
    //答案复制相关按钮 end
    function skipVideo() {
      //这是跳过视频的代码
      var oVideo = document.getElementsByTagName("video")[0];
      if (oVideo) {
        oVideo.currentTime = oVideo.duration - 1;
      }
    }

    function clickexam() {
      //延时点击考试按钮（先激活播放器再点，否则按钮不可点击）
      console.log("准备进入考试，先激活播放器...");
      // 华医网进入考试按钮需要播放器处于播放状态才可点击，先触发播放
      try {
        var video = document.querySelector("video");
        if (video) {
          video.muted = true;
          video.volume = 0;
          video.play().catch(function () {});
        }
        // polyv播放器
        if (
          typeof player !== "undefined" &&
          player &&
          typeof player.j2s_resumeVideo === "function"
        ) {
          player.j2s_resumeVideo();
        }
        // cc播放器
        if (
          typeof cc_js_Player !== "undefined" &&
          cc_js_Player &&
          typeof cc_js_Player.play === "function"
        ) {
          cc_js_Player.play().catch(function () {});
        }
      } catch (e) {
        console.log("激活播放器失败: " + e);
      }
      // 等待播放器激活后点击考试按钮
      setTimeout(
        function () {
          console.log("已点击考试按钮");
          document.querySelector("#jrks").click();
        },
        2000 + Math.ceil(Math.random() * 2000),
      );
    }
    // addSkipbtn / addratebtn 已移除 —— 倍速按钮已整合到 advis() 面板中
    var _speedCurrentRate = 1;
    var _speedSkipTimer = null;

    function ratechg(ra) {
      //倍率调整（v4：currentTime跳跃方案，不改playbackRate，避免polyv检测）
      _speedCurrentRate = ra;
      localStorage.setItem(keyPlayRate, ra);
      console.log(
        "【子川助手】倍率调整为 " + ra + "x（currentTime跳跃模式）",
      );

      // 清除旧定时器
      clearInterval(nspeed);
      clearInterval(_speedSkipTimer);

      // 如果速度<=1，正常设置playbackRate即可
      if (ra <= 1) {
        var videos = document.querySelectorAll("video");
        for (var i = 0; i < videos.length; i++) {
          try {
            videos[i].playbackRate = ra;
          } catch (e) {}
        }
        return;
      }

      // 确保playbackRate为1（不触发polyv限速检测）
      var allVids = document.querySelectorAll("video");
      for (var v = 0; v < allVids.length; v++) {
        try {
          allVids[v].playbackRate = 1;
        } catch (e) {}
      }

      // 高速跳跃间隔（每250ms跳一次，更平滑）
      var JUMP_INTERVAL = 250;
      // 每次跳跃额外时间 = (倍速-1) * 间隔秒数
      // 2x: 每250ms额外跳250ms → 每250ms实际前进500ms
      // 3x: 每250ms额外跳500ms → 每250ms实际前进750ms
      var extraPerJump = (ra - 1) * (JUMP_INTERVAL / 1000);

      _speedSkipTimer = setInterval(function () {
        var video = document.querySelector("video");
        if (video && !video.paused && !video.ended) {
          try {
            var newTime = video.currentTime + extraPerJump;
            // 不超过视频总时长
            if (video.duration && newTime < video.duration - 0.5) {
              video.currentTime = newTime;
            }
          } catch (e) {}
        }
      }, JUMP_INTERVAL);

      // 同时用nspeed保持playbackRate=1（防止polyv意外修改）
      nspeed = setInterval(function () {
        var videos = document.querySelectorAll("video");
        for (var i = 0; i < videos.length; i++) {
          try {
            if (videos[i].playbackRate !== 1) {
              videos[i].playbackRate = 1;
            }
          } catch (e) {}
        }
      }, 1000);
    }
    // addrateinfo 已移除 —— 速度显示已整合到 advis() 面板

    // addinfo 已移除 —— 模式切换和信息展示已整合到 advis() 面板

    // changelayout 已移除 —— 旧版 jj 面板已被 advis() 取代

    function cleanExamTempOnly() {
      //【v2.8.4】单次考试的临时键：试错进度（keyTest）/错题表（keyResult）/本轮答案暂存
      //（keyTestAnswer）。不含中间库 keyRightAnswer——那是跨课程复用的已确认正确答案。
      localStorage.removeItem(keyTest);
      localStorage.removeItem(keyResult);
      localStorage.removeItem(keyTestAnswer);
    }
    function cleanKeyStorage() {
      //缓存清理（仅考试「通过」时调用：中间库已并入正式库，此时才整体清空）
      localStorage.removeItem(keyTest);
      localStorage.removeItem(keyResult);
      localStorage.removeItem(keyTestAnswer);
      localStorage.removeItem(keyRightAnswer);
    }

    // 【v2.4.0】视频静音双保险：muted + defaultMuted + volume=0 同时设置，
    // 防止播放器内部事件把音量拉回；video 元素缺失时安全跳过
    // （旧代码直接 document.querySelector("video").defaultMuted = true 在元素未就绪时会抛错，
    //   一旦抛错会中断 window.onload 后半段，导致 startWatchEnd 不启动）
    function muteAllVideos() {
      var videos = document.querySelectorAll("video");
      for (var i = 0; i < videos.length; i++) {
        try {
          videos[i].muted = true;
          videos[i].defaultMuted = true;
          videos[i].volume = 0;
        } catch (e) {}
      }
    }

    // 【v2.4.1】根除倍速播放时反复弹出的「不能拖拽」温馨提示。
    // 页面检测机制（2026.11 实测 polyv 页）：s2j_onPlayerInitOver 里给 polyv 挂了
    // videoSeeked 监听——每次 seek 完成后，只要 currentTime ≥ 已播最大时长-3 就执行
    // $("#div_processbar_tip").show()。本脚本倍速的本质是每 250ms 把 currentTime
    // 向前跳一次（playbackRate 恒为 1，躲开 timerSSS 限速检测），于是每次跳跃都会
    // 命中该检测 → 弹窗反复弹出甚至常驻。
    // 对策：注入 CSS !important 强制隐藏该弹窗（jQuery .show() 的内联 display:block
    // 压不过 !important）。播放、进度记账（timerPlayMax 每 1.5s 写 localStorage）、
    // 学时上报均不受影响；killsendQuestion3 轮询里另配 DOM 兜底关闭。
    function suppressProcessbarTip() {
      if (document.getElementById("__hyu_tip_css")) return;
      try {
        var st = document.createElement("style");
        st.id = "__hyu_tip_css";
        st.textContent = "#div_processbar_tip{display:none !important;}";
        (document.head || document.documentElement).appendChild(st);
        console.log(
          "【子川助手】已屏蔽「不能拖拽」提示弹窗（倍速跳跃会触发 videoSeeked 检测）",
        );
      } catch (e) {}
      // 双保险：页面内联脚本的 function 声明会覆盖 document-start 阶段的空函数占位，
      // 此处（DOMContentLoaded 时机）再压一次，确保倍速期间服务端进度轮询返回异常码时
      // （blockAbnormalPlugin 分支）也不会销毁播放器。
      try {
        window.blockAbnormalPlugin = function () {};
      } catch (e) {}
    }

    // ════════ 【v2.5.0】AI 联网答题（OpenAI 兼容 Chat Completions）════════
    // 配置存 localStorage（hyu_ai_base / hyu_ai_key / hyu_ai_model），由面板
    // 「AI 联网答题」区的按钮写入。三个配置缺一即视为未配置，所有调用点自动
    // 回退原有逻辑（答案库 → 试错）。接口需支持浏览器跨域（CORS），
    // OpenAI 及大多数兼容服务默认支持。
    function aiConfigured() {
      try {
        return !!(
          localStorage.getItem("hyu_ai_base") &&
          localStorage.getItem("hyu_ai_key") &&
          localStorage.getItem("hyu_ai_model")
        );
      } catch (e) {
        return false;
      }
    }

    // 【v2.7.3】AI 作答总开关：配置好（三项全填）且显式开启（hyu_ai_on=1）才真正作答。
    // 用户未实测前默认关闭——配了 Key 也不会调用；面板「测试」通过后自动开启。
    function aiReady() {
      try {
        return aiConfigured() && localStorage.getItem("hyu_ai_on") === "1";
      } catch (e) {
        return false;
      }
    }

    // 把题目+选项发给 AI，返回正确选项字母（单选如 "A"；multi=true 时返回多个如 "ABCD"）。
    // 失败抛异常，由调用方回退。
    async function aiAskChoice(question, optionTexts, multi) {
      var base = (localStorage.getItem("hyu_ai_base") || "").replace(/\/+$/, "");
      // 【v2.8.7】DeepSeek 专例：/anthropic 兼容层对请求体校验不稳定（同一体从部分环境发
      // 422 "Failed to deserialize the JSON body"、部分环境 200——实测复现结论），而 /v1
      // OpenAI 格式处处稳定且支持关思考。DeepSeek 同一把 Key 两个端点通用 → 自动规范化
      // 到 /v1（用户配置无需改动）。其他厂商（智谱 /api/anthropic 等）不受影响。
      if (/api\.deepseek\.com/i.test(base)) {
        base = base.replace(/\/anthropic$/i, "/v1");
      }
      var promptTxt =
        "你正在帮助用户完成医学继续教育课程测试，请选出正确选项。\n" +
        "题目：" +
        question +
        "\n选项：\n" +
        optionTexts
          .map(function (t, i) {
            return String.fromCharCode(65 + i) + "、" + t;
          })
          .join("\n") +
        "\n只输出正确选项的字母" +
        (multi
          ? "（这是多选题，可能有多个正确选项，把所有正确字母连在一起输出，如 ABCD）"
          : "（单选题，只输出一个字母）") +
        "，不要输出任何其他内容。";
      var ctrl = new AbortController();
      var to = setTimeout(function () {
        ctrl.abort();
      }, 20000);
      // 【v2.6.1】双格式兼容：接口地址以 /anthropic 结尾走 Anthropic Messages 格式
      // （如智谱 https://open.bigmodel.cn/api/anthropic），否则走 OpenAI Chat 格式
      var isAnthropic = /\/anthropic\/?$/i.test(base);
      var res;
      try {
        res = await fetch(
          isAnthropic ? base + "/v1/messages" : base + "/chat/completions",
          {
            method: "POST",
            headers: isAnthropic
              ? {
                  "Content-Type": "application/json",
                  "x-api-key": localStorage.getItem("hyu_ai_key"),
                  "anthropic-version": "2023-06-01",
                }
              : {
                  "Content-Type": "application/json",
                  Authorization:
                    "Bearer " + localStorage.getItem("hyu_ai_key"),
                },
            body: JSON.stringify(
              isAnthropic
                ? {
                    model: localStorage.getItem("hyu_ai_model"),
                    max_tokens: 4096, //【v2.8.5】1024 会被推理模型的思考耗尽→text块被截断为空
                    // 【实测】关闭思考模式：选择字母这种任务不需要推理，输出从13token降到1
                    // （DeepSeek Anthropic 兼容层用原生 thinking 参数；文档的 reasoning.effort=none 实测无效）
                    thinking: { type: "disabled" },
                    messages: [{ role: "user", content: promptTxt }],
                  }
                : {
                    model: localStorage.getItem("hyu_ai_model"),
                    messages: [{ role: "user", content: promptTxt }],
                    temperature: 0,
                    // 【实测】OpenAI 格式同参数生效：无 reasoning_content，输出仅 1 token
                    thinking: { type: "disabled" },
                  },
            ),
            signal: ctrl.signal,
          },
        );
      } finally {
        clearTimeout(to);
      }
      if (!res.ok) {
        //【v2.8.6】带上服务端返回的具体原因（422=参数错误，响应体写明哪个字段不合法；
        // 401=Key无效 402=余额不足），不再只报状态码让人猜
        var errBody = "";
        try {
          errBody = (await res.text()).slice(0, 120);
        } catch (e2) {}
        throw new Error("HTTP " + res.status + (errBody ? ": " + errBody : ""));
      }
      // 【v2.8.3】先取原文再解析：JSON 解析失败时能把响应开头放进报错（地址填错会返回 HTML 页）
      var rawText = await res.text();
      var data;
      try {
        data = JSON.parse(rawText);
      } catch (e2) {
        throw new Error("响应不是 JSON（地址可能填错）: " + rawText.slice(0, 80));
      }
      // 【v2.8.3】接口层报错直接透传（模型名不存在/额度不足等，此前被吞成"未返回选项字母"）
      if (data && data.error) {
        var emsg =
          (data.error && (data.error.message || data.error.msg)) ||
          JSON.stringify(data.error);
        throw new Error("接口报错: " + String(emsg).slice(0, 90));
      }
      var content;
      if (isAnthropic) {
        // 【v2.8.5 实测修复】DeepSeek/智谱 Anthropic 兼容层的 content 是分块数组，
        // 第一个块可能是思考块：[{type:"thinking",thinking:...},{type:"text",text:"B"}]
        // 旧解析只读 content[0].text → 永远取到空（"响应无文本"）。现扫全块拼 text；
        // 连 text 块都没有再退 thinking 块（思考文本里也含答案字母，聊胜于无）。
        var blocks = Array.isArray(data.content) ? data.content : [];
        var txtParts = [];
        var thinkParts = [];
        for (var bi = 0; bi < blocks.length; bi++) {
          var blk = blocks[bi] || {};
          if (typeof blk.text === "string" && blk.text) txtParts.push(blk.text);
          else if (typeof blk.thinking === "string" && blk.thinking)
            thinkParts.push(blk.thinking);
        }
        content = txtParts.join(" ");
        if (!content) content = thinkParts.join(" ");
        if (
          !content &&
          data.stop_reason === "max_tokens"
        ) {
          throw new Error(
            "思考超长被截断(stop_reason=max_tokens)——重试一次或换个模型",
          );
        }
      } else {
        var msg0 =
          data.choices && data.choices[0] && data.choices[0].message
            ? data.choices[0].message
            : null;
        // 【v2.8.3】兜底：① reasoning 模型文本可能在 reasoning_content 而 content 为空
        // ② 新版接口 content 可能是 [{type:"text",text:...}] 分段数组
        var c0 = msg0 ? (msg0.content || msg0.reasoning_content || "") : "";
        if (Array.isArray(c0)) {
          c0 = c0
            .map(function (p) {
              return (p && p.text) || "";
            })
            .join("");
        }
        content = String(c0 || "");
      }
      // 【v2.8.4】所有兜底取完仍无文本 → 把响应结构和原文片段亮出来（模型名错/额度尽/
      // 网关劫持都能一眼定位），不再吞成"未返回选项字母:"
      if (!content) {
        throw new Error(
          "响应无文本(text/reasoning均空) 键[" +
            (data ? Object.keys(data).join(",") : "?") +
            "] 原文:" +
            rawText.slice(0, 100),
        );
      }
      if (multi) {
        var letters = String(content).toUpperCase().match(/[A-Z]/g);
        if (!letters || !letters.length)
          throw new Error("AI 未返回选项字母: " + String(content).slice(0, 50));
        // 按选项范围过滤（去掉选项之外的字母，如解析文本里的无关字母）
        var maxIdx = optionTexts.length - 1;
        var filtered = [];
        for (var li = 0; li < letters.length; li++) {
          var code = letters[li].charCodeAt(0) - 65;
          if (code >= 0 && code <= maxIdx && filtered.indexOf(letters[li]) === -1)
            filtered.push(letters[li]);
        }
        if (!filtered.length)
          throw new Error("AI 字母不在选项范围内: " + letters.join(""));
        aiRecordLast(question, filtered.join(""));
        return filtered.join("");
      }
      var m = String(content).toUpperCase().match(/\b([A-Z])\b/);
      if (!m)
        throw new Error("AI 未返回选项字母: " + String(content).slice(0, 50));
      aiRecordLast(question, m[1]);
      return m[1];
    }

    // 课堂问答用：把 AI 返回的字母映射到选项下标（优先按选项文本首字母匹配）
    function aiPickOptionIndex(letter, opts) {
      letter = (letter || "").toUpperCase();
      for (var i = 0; i < opts.length; i++) {
        if (opts[i].text.toUpperCase().charAt(0) === letter) return i;
      }
      var code = letter.charCodeAt(0) - 65;
      if (code >= 0 && code < opts.length) return code;
      return -1;
    }

    // ════════ 【v2.5.0】免费联网搜答案（无需任何 API Key）════════
    // 思路：通过公共 CORS 代理抓 Bing/百度搜索结果页，从摘要文本中提取
    // 「正确答案：X」模式。继教题目在网上题库重复度高，命中率可观；
    // 找不到时返回 null，调用方回退兜底逻辑。免费代理不稳定属正常，
    // 双引擎+双代理轮流尝试，单请求 8 秒超时。
    async function fetchViaProxy(targetUrl, timeoutMs) {
      var proxies = [
        function (u) {
          return "https://api.allorigins.win/raw?url=" + encodeURIComponent(u);
        },
        function (u) {
          return "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(u);
        },
      ];
      for (var pi = 0; pi < proxies.length; pi++) {
        var ctrl = new AbortController();
        var to = setTimeout(function () {
          ctrl.abort();
        }, timeoutMs || 5000);
        try {
          var res = await fetch(proxies[pi](targetUrl), { signal: ctrl.signal });
          clearTimeout(to);
          if (!res.ok) continue;
          var text = await res.text();
          if (text && text.length > 500) return text;
        } catch (e) {
          clearTimeout(to);
        }
      }
      return null;
    }

    // 从搜索结果 HTML 提取纯文本
    function searchHtmlToText(html) {
      return String(html)
        .replace(/<script[\s\S]*?<\/script>/gi, " ")
        .replace(/<style[\s\S]*?<\/style>/gi, " ")
        .replace(/<[^>]+>/g, " ")
        .replace(/&nbsp;/g, " ")
        .replace(/&[a-z]+;/gi, " ")
        .replace(/\s+/g, " ");
    }

    // 在文本中找「答案」模式，返回字母串（"B" 或 "ABC"）；校验字母在选项范围内
    // 【v2.8.2】实测百度摘要里的真实形态修补：
    // ① 小写「答案 :c」、全角「Ｂ」也认（旧正则只认大写半角→一直提取不到）；
    // ② 多选「答案：A,B,C」整串提取（旧正则逗号截断只取到A）；
    // ③ 整页第一条「答案：X」可能是别的题的（百度搜索框回显会导致题干校验假阳性）
    //    → 若能定位题干，优先取题干之后 800 字内最近的一处。
    function extractAnswerPattern(text, optionCount, stemHead) {
      if (!text) return null;
      var maxLetter = String.fromCharCode(65 + optionCount - 1);
      var re = /(?:正确答案|参考答案|【答案】|答案)\s*[：:是为于]*\s*([A-Za-zＡ-Ｚａ-ｚ]{1,6}(?:\s*[,，、]\s*[A-Za-zＡ-Ｚａ-ｚ]{1,6}){0,5})/g;
      var hits = [];
      var m;
      while ((m = re.exec(text)) !== null) {
        var upper = m[1].toUpperCase();
        var norm = "";
        for (var i = 0; i < upper.length; i++) {
          var code = upper.charCodeAt(i);
          if (code >= 0xff21 && code <= 0xff3a) code -= 0xfee0; // 全角Ａ-Ｚ转半角
          var ch = String.fromCharCode(code);
          if (ch >= "A" && ch <= maxLetter && norm.indexOf(ch) === -1) norm += ch;
        }
        if (norm) hits.push({ idx: m.index, ans: norm });
        if (m.index === re.lastIndex) re.lastIndex++; // 防零宽死循环
      }
      if (!hits.length) return null;
      if (stemHead) {
        var head = String(stemHead).replace(/\s+/g, "").slice(0, 15);
        if (head) {
          var stemRe = new RegExp(
            head
              .split("")
              .map(function (c) {
                return c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
              })
              .join("\\s*"),
          );
          var sm = stemRe.exec(text);
          if (sm) {
            var stemEnd = sm.index + sm[0].length;
            for (var h = 0; h < hits.length; h++) {
              if (hits[h].idx >= stemEnd && hits[h].idx - stemEnd < 800) {
                return hits[h].ans;
              }
            }
          }
        }
      }
      return hits[0].ans; // 定位不到题干时退回旧行为：全页第一条
    }

    // 免费搜答案主入口：返回 "B"/"ABCD" 或 null。
    // 【v2.7.3】传输链：①配套「搜索桥」脚本（window.__hySearchWeb，油猴 GM 直连
    // 百度/必应，不受浏览器跨域限制，大陆可用、秒回）→ ②公共代理兜底（多数大陆
    // 网络不可达，可达时自动熔断 10 分钟防白等）。默认关闭（hyu_search_on=1 开启），
    // AI 作答独立开关（hyu_ai_on），两者互不影响。
    var __hyuSearchDeadUntil = 0; // 搜索熔断：所有传输全失败后 10 分钟内直接跳过
    var __hyuSearchMissToasted = false; // 【v2.8.1】未命中提示每页只弹一次
    // 【v2.8.3】搜索桥检测与事件通道：v1.0.0 桥只往 unsafeWindow 挂 __hySearchWeb，
    // 油猴沙箱隔离时主脚本的 window 读不到它 → "明明装了桥却提示未安装"。
    // DOM 事件跨沙箱一定可达：hySearchBridgeReady/hySearchPong 探测，hySearchReq/hySearchRes_<id> 传数据。
    var __hyBridgeSeen = false;
    var __hyBridgeProbed = false;
    document.addEventListener("hySearchBridgeReady", function () {
      __hyBridgeSeen = true;
    });
    document.addEventListener("hySearchPong", function () {
      __hyBridgeSeen = true;
    });
    function hyHasBridge() {
      return typeof window.__hySearchWeb === "function" || __hyBridgeSeen;
    }
    function hyBridgeProbe() {
      // 探测事件通道上的桥（600ms 应答窗口；每页只主动探一次，之后靠缓存标志）
      return new Promise(function (resolve) {
        if (hyHasBridge()) return resolve(true);
        if (__hyBridgeProbed) return resolve(false);
        __hyBridgeProbed = true;
        var to = setTimeout(function () {
          resolve(false);
        }, 600);
        document.addEventListener(
          "hySearchPong",
          function () {
            clearTimeout(to);
            resolve(true);
          },
          { once: true },
        );
        try {
          document.dispatchEvent(new CustomEvent("hySearchPing"));
        } catch (e) {
          clearTimeout(to);
          resolve(false);
        }
      });
    }
    function hyBridgeFetchViaEvents(url, timeoutMs) {
      return new Promise(function (resolve, reject) {
        var id = "hys" + Date.now() + Math.floor(Math.random() * 100000);
        var evtName = "hySearchRes_" + id;
        var to = setTimeout(function () {
          cleanup();
          reject(new Error("桥事件通道超时"));
        }, timeoutMs || 15000);
        function onRes(e) {
          var d = (e.detail || {});
          clearTimeout(to);
          cleanup();
          if (d.ok) resolve(d.text);
          else reject(new Error(d.err || "桥请求失败"));
        }
        function cleanup() {
          document.removeEventListener(evtName, onRes);
        }
        document.addEventListener(evtName, onRes);
        document.dispatchEvent(
          new CustomEvent("hySearchReq", { detail: { id: id, url: url } }),
        );
      });
    }
    function searchOn() {
      try {
        return localStorage.getItem("hyu_search_on") === "1";
      } catch (e) {
        return false;
      }
    }
    async function searchFetchPage(url) {
      // ① 搜索桥·window 直调（页面上下文注入时可用）
      try {
        if (typeof window.__hySearchWeb === "function") {
          var viaBridge = await window.__hySearchWeb(url);
          if (viaBridge && viaBridge.length > 300) return viaBridge;
        }
      } catch (e) {}
      // ②【v2.8.3】搜索桥·事件通道（沙箱隔离时的兜底）
      if (await hyBridgeProbe()) {
        try {
          var viaEvt = await hyBridgeFetchViaEvents(url);
          if (viaEvt && viaEvt.length > 300) return viaEvt;
        } catch (e2) {}
      }
      // ③ 公共代理兜底
      return await fetchViaProxy(url, 12000);
    }
    async function freeSearchAnswer(question, optionTexts) {
      if (!searchOn()) return null;
      if (Date.now() < __hyuSearchDeadUntil) return null;
      var hasBridge = hyHasBridge(); //【v2.8.3】含事件通道探测标志
      var query = String(question).slice(0, 60) + " 答案";
      var engines = [
        { name: "百度", url: "https://www.baidu.com/s?wd=" },
        { name: "必应", url: "https://cn.bing.com/search?q=" },
      ];
      var fetchedAny = false;
      var gotAny = false;
      for (var ei = 0; ei < engines.length; ei++) {
        var html = await searchFetchPage(
          engines[ei].url + encodeURIComponent(query),
        );
        if (!html) {
          console.log(
            "【子川助手·搜索】" +
              engines[ei].name +
              " 抓取失败（" +
              (hasBridge
                ? "桥已装，请求被拒/超时"
                : "未装搜索桥脚本，公共代理不可达") +
              "）",
          );
          continue;
        }
        fetchedAny = true;
        // 【v2.8.1】百度风控：自动化请求可能返回「安全验证」页，明确告知
        if (
          html.indexOf("百度安全验证") !== -1 ||
          html.indexOf("安全验证") !== -1
        ) {
          console.log("【子川助手·搜索】" + engines[ei].name + " 返回安全验证页（请求特征被识别），跳过");
          continue;
        }
        var text = searchHtmlToText(html);
        // 【v2.8.2】区分「真没搜到」与「搜到但没答案」：百度无结果页有固定提示语
        if (
          text.indexOf("没有找到相关结果") !== -1 ||
          text.indexOf("很抱歉，没有找到") !== -1
        ) {
          console.log(
            "【子川助手·搜索】" + engines[ei].name + " 无相关结果（题库外新题，网上暂无该题）",
          );
          continue;
        }
        // 题干包含校验（注意：搜索框会回显查询词，此项为弱校验，提取时另做就近定位）
        var qHead = String(question).replace(/\s+/g, "").slice(0, 15);
        if (qHead && text.replace(/\s+/g, "").indexOf(qHead) === -1) {
          console.log("【子川助手·搜索】" + engines[ei].name + " 搜到结果但不含本题题干（题库外新题，网上暂无答案）");
          continue;
        }
        var ans = extractAnswerPattern(text, optionTexts.length, question);
        if (ans) {
          gotAny = true;
          console.log(
            "【子川助手·搜索】" +
              engines[ei].name +
              "命中答案: " +
              ans +
              "（题干: " +
              String(question).slice(0, 20) +
              "…）",
          );
          hyToast("🔍 搜索命中 → " + ans);
          return ans;
        }
        console.log("【子川助手·搜索】" + engines[ei].name + " 有结果但未提取到「答案：X」模式");
      }
      if (!fetchedAny) {
        __hyuSearchDeadUntil = Date.now() + 600000;
        hyToast(
          hasBridge
            ? "🔍 搜索请求失败（桥已装但被拒/超时），10 分钟内跳过"
            : "🔍 搜索不可达：未装「搜索桥」脚本且公共代理不通，10 分钟内跳过——请安装 hua-yi-search.user.js 后刷新",
        );
        console.log("【子川助手·搜索】全部传输不可达，熔断 10 分钟");
      } else if (!gotAny && !__hyuSearchMissToasted) {
        __hyuSearchMissToasted = true;
        hyToast("🔍 搜索抓到了结果但没找到答案，本题回退试错（F12 看详细原因）");
      }
      return null;
    }

    // 【v2.5.2】右下角浮窗提示（AI 调用/搜索命中/自愈动作等关键事件可视化）
    function hyToast(msg) {
      try {
        var box = document.getElementById("hyu_toast_box");
        if (!box) {
          box = document.createElement("div");
          box.id = "hyu_toast_box";
          box.style.cssText =
            "position:fixed;right:12px;bottom:12px;z-index:2147483647;" +
            "display:flex;flex-direction:column;gap:6px;align-items:flex-end;" +
            "font:12px/1.5 'Microsoft YaHei',sans-serif;pointer-events:none;";
          (document.body || document.documentElement).appendChild(box);
        }
        var t = document.createElement("div");
        t.style.cssText =
          "background:rgba(21,101,192,.94);color:#fff;padding:6px 12px;" +
          "border-radius:8px;max-width:300px;box-shadow:0 2px 8px rgba(0,0,0,.25);";
        t.textContent = msg;
        box.appendChild(t);
        while (box.children.length > 4) box.removeChild(box.firstChild);
        setTimeout(function () {
          if (t.parentNode) t.parentNode.removeChild(t);
        }, 5000);
      } catch (e) {}
    }

    // 【v2.5.2】记录最近一次 AI 调用（面板 AI 区显示，回应"感觉不到 AI 在运行"）
    function aiRecordLast(question, ans) {
      try {
        localStorage.setItem(
          "hyu_ai_last",
          new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(11, 16) +
            " " +
            String(question).slice(0, 14) +
            "→" +
            ans,
        );
      } catch (e) {}
    }

    // 【v2.5.2】时长不足自愈：播放器恢复播放后检查——
    // ① 本页由「观看时长不足」弹窗确认刷新而来（sessionStorage 标记）→ 从头 1x 重看；
    // ② 打开时进度就在片尾、状态仍是"学习中"（= 此前完成上报被服务端拒）→ 同样重看。
    // 重看恒为 1x：服务端累计真实观看时长，1x 完整重看一遍即可补足，之后正常完成/切课。
    function hyuAfterResume() {
      try {
        var v = document.querySelector("video");
        if (!v || !v.duration) return;
        var flagged = false;
        try {
          if (sessionStorage.getItem("hyu_rewatch_1x") === "1") {
            sessionStorage.removeItem("hyu_rewatch_1x");
            flagged = true;
          }
        } catch (e) {}
        if (!flagged) {
          var st = getCurrentCourseState();
          if (
            v.currentTime >= v.duration - 3 &&
            st !== "已完成" &&
            st !== "待考试" &&
            !hyExamBtnUnlocked() //【v2.8.2】考试按钮已解锁=完成已被接受（徽章可能延迟显示"学习中"），重看会死循环
          ) {
            flagged = true; // 片尾 + 未通过 → 需要重看补时长
          }
        }
        if (!flagged) return;
        try {
          v.currentTime = 0;
        } catch (e) {}
        try {
          if (
            typeof player !== "undefined" &&
            player &&
            typeof player.j2s_seekVideo === "function"
          )
            player.j2s_seekVideo(0);
        } catch (e) {}
        try {
          if (
            typeof cc_js_Player !== "undefined" &&
            cc_js_Player &&
            typeof cc_js_Player.seek === "function"
          )
            cc_js_Player.seek(0);
        } catch (e) {}
        ratechg(1); // 重看恒为 1x
        hyToast("⚠️ 本课观看时长不足被拒，自动从头 1x 重看补足时长");
        console.log("【子川助手】时长校验未通过，自动从头 1x 重看");
      } catch (e) {}
    }

    // 【v2.8.0】题干归一化：去空白+去标点+全角转半角，用于题库模糊匹配
    // （修复"上次答对的题这次还答错"——题干有空格/标点/括号全半角差异即精确匹配失效）
    function hyNormKey(s) {
      return String(s || "")
        .replace(/\s+/g, "")
        .replace(/[，。、；：？！,.;:?!"'（）()【】\[\]{}<>《》“”‘’~·—\-_…*#@$%^&+=|\\/]/g, "")
        .replace(/：/g, ":")
        .toLowerCase();
    }

    async function examherftest() {
      //考试按钮激活状态检测
      // 跳转冷却期内或已在处理中，直接跳过
      if (courseFinished || Date.now() < navCooldownUntil) return;

      try {
        var hreftestEl = document.getElementById("jrks");
        if (!hreftestEl) return; // DOM 未就绪，等待下次检测

        var hreftest = hreftestEl.attributes["href"].value;
        var state = getCurrentCourseState();
        if (!state) return; // 无法获取状态，等待下次检测

        if (
          state == "已完成" ||
          hyExamBtnUnlocked() || //【v2.8.2】href恒为#，改判 disabled 已移除
          (typeof getMaxPlayTime == "function" ? getMaxPlayTime() | 0 : 1) ==
            (typeof player.j2s_getDuration == "function"
              ? player.j2s_getDuration() | 0
              : 0) ||
          (typeof getMaxPlayTime == "function" ? getMaxPlayTime() | 0 : 1) ==
            (typeof player.getDuration == "function"
              ? player.getDuration() | 0
              : 0)
        ) {
          // debounce：需要连续两次检测都确认"已完成"才触发（防止瞬时误判）
          if (state == "已完成" && Date.now() - _lastCompletedCheck > 2000) {
            _lastCompletedCheck = Date.now();
            console.log("examherftest: 首次检测到已完成，等待二次确认");
            return;
          }
          _lastCompletedCheck = 0;

          if (
            localStorage.getItem("华医mode") == "2" &&
            (state == "待考试" || hyExamBtnUnlocked())
          ) {
            // 【v2.7.2】逐课考试：本课视频播完且考试按钮已解锁 → 立即进本课考试
            //（state=已完成 说明考试已通过，不重复进考）
            if (hyExamBtnUnlocked() && state != "已完成" && tryClickExamHere()) {
              hyuExamWaitStart = 0;
              return;
            }
            // 【v2.10.4】按钮锁定（如「眼睛休息一下」弹窗未关/后台未就绪）：
            // 等待解锁而不是直接跳过——弹窗被脚本自动关闭后按钮即解锁，
            // 下一轮检测自动进考试；60 秒仍锁定才按原逻辑跳过（下轮课程轮转后会回来重试）
            if (!hyExamBtnUnlocked()) {
              if (!hyuExamWaitStart) {
                hyuExamWaitStart = Date.now();
                console.log(
                  "【子川助手】考试按钮暂未解锁（待考试），等待中（最长60秒）...",
                );
                hyToast("⏳ 考试按钮解锁中，等待自动进入考试...");
              }
              if (Date.now() - hyuExamWaitStart < 60000) {
                return; // 等下一轮检测
              }
              console.log("【子川助手】考试按钮等待超时（60秒），暂跳本课考试");
              hyToast("⚠️ 考试按钮60秒未解锁，暂跳本课（轮转后会回来重试）");
            }
            hyuExamWaitStart = 0;
            if (hasRemainingCourses()) {
              console.log(
                "mode=2,当前课程已完成，但还有未学完课程，跳转下一课程",
              );
              courseFinished = true;
              if (clockms) {
                clearInterval(clockms);
                clockms = null;
              }
              playNext();
            } else {
              console.log("mode=2,所有课程已学完，准备进入考试");
              courseFinished = true;
              if (clockms) {
                clearInterval(clockms);
                clockms = null;
              }
              sleep(5000);
              try {
                clickexam();
              } catch (error) {
                console.log("扫码进入考试");
                window.open("/pages/exam_tip.aspx?cwrid=" + cwrid, "_self");
              }
            }
          } else {
            if (localStorage.getItem("华医mode") == "2") {
              console.log("mode=2,本节课已完成且考试已通过");
            } else {
              console.log("mode=1,课程已学完，准备跳转下一课程 (clock)");
              courseFinished = true;
              // 同时停掉 killsendQuestion3 的定时器，避免双重触发
              if (clockms) {
                clearInterval(clockms);
                clockms = null;
              }
              playNext();
            }
          }
          // 跳转后冷却：10秒内禁止再次检测到"已完成"就跳转
          navCooldownUntil = Date.now() + 5000;
        } else {
          _lastCompletedCheck = 0; // 状态变了，重置 debounce
        }
      } catch (err) {
        // DOM 变动中（如页面正在跳转），静默忽略
      }
    }
    function sleep(timeout) {
      return new Promise((resolve) => {
        setTimeout(resolve, timeout);
      });
    }
    function asynckillsendQuestion() {
      (async function () {
        while (!window.player || !window.player.sendQuestion) {
          await sleep(20);
        }
        //console.log("课堂问答跳过插入");
        player.sendQuestion = function () {
          //console.log("播放器尝试弹出课堂问答，已屏蔽。");
        };
      })();
    }
    function killsendQuestion2() {
      if (typeof isInteraction == "undefined") {
        //console.log('变量未定义');
      } else {
        console.log("isInteraction设置off");
        isInteraction = "off";
      }
    }
    async function killsendQuestion3() {
      //点击跳过按钮版的跳过课堂答题
      // 使用全局 clockms（如果已有旧定时器先清理）
      if (clockms) {
        clearInterval(clockms);
        clockms = null;
      }
      clockms = setInterval(async function () {
        // 跳转冷却期内，跳过视频完成检测（但对话框跳过仍正常执行）
        var inCooldown = Date.now() < navCooldownUntil;

        try {
          if ($(".pv-ask-head").length && $(".pv-ask-head").length > 0) {
            console.log("检测到问题对话框，尝试跳过");
            $(".pv-ask-skip").click();
          }
        } catch (err) {
          console.log(err);
        }
        try {
          if ($(".signBtn").length && $(".signBtn").length > 0) {
            console.log("检测到签到对话框，尝试跳过");
            $(".signBtn").click();
          }
        } catch (err) {
          console.log(err);
        }
        try {
          // 【v2.4.1】2026.11 改版：旧版关闭按钮 button[onclick='closeProcessbarTip()']
          // 已不存在，新版是 input.rig_btn（知道了）和 img.colse_btn（✕），均为内联
          // onclick 直接 hide()。正常情况下弹窗已被 suppressProcessbarTip() 的 CSS
          // 强制隐藏（computed display 恒为 none），此处仅为该 CSS 失效时的兜底。
          var $tipDlg = $("div[id='div_processbar_tip']");
          if ($tipDlg.length && $tipDlg.css("display") == "block") {
            console.log("检测到温馨提示对话框（不能拖拽），尝试跳过");
            if (
              $("button[onclick='closeProcessbarTip()']").length &&
              $("button[onclick='closeProcessbarTip()']").length > 0
            ) {
              $("button[onclick='closeProcessbarTip()']").click();
            } else {
              $tipDlg.find("input.rig_btn, img.colse_btn").trigger("click");
              if ($tipDlg.css("display") == "block") $tipDlg.hide();
            }
          }
        } catch (err) {
          console.log(err);
        }
        try {
          if (
            $("button[class='btn_sign']").length &&
            $("button[class='btn_sign']").length > 0
          ) {
            console.log("检测到温馨提示对话框（疲劳提醒），尝试跳过");
            $("button[class='btn_sign']").click();
          }
        } catch (err) {
          console.log(err);
        }
        // 【v2.5.1】服务端判定「观看时长不足，请重新观看」：自动点确定 → 页面刷新重看。
        // 该弹窗来自完成上报接口的异常返回（倍速>1x 播完但累计真实观看时长不够，完成被拒）。
        try {
          var $insufficientTip = $(".layui-layer").filter(function () {
            return (this.textContent || "").indexOf("观看时长不足") !== -1;
          });
          if ($insufficientTip.length) {
            console.log(
              "【子川助手】服务端判定观看时长不足，自动确认并从头 1x 重看",
            );
            try {
              sessionStorage.setItem("hyu_rewatch_1x", "1");
            } catch (e2) {}
            hyToast("⚠️ 观看时长不足被拒，自动确认并从头 1x 重看");
            var $insufficientOk = $insufficientTip
              .find(".layui-layer-btn0, .layui-layer-btn a")
              .first();
            if ($insufficientOk.length) $insufficientOk.click();
          }
        } catch (err) {
          console.log(err);
        }
        try {
          var state = getCurrentCourseState();
          if (!state) return; // DOM 未就绪，等待下次检测
          if (
            $("video").prop("paused") == true &&
            state != "已完成" &&
            state != "待考试"
          ) {
            console.log("视频意外暂停，恢复播放");
            $("video")
              .get(0)
              .play()
              .catch(function () {});
            $("video").prop("volume", 0);
            $("video").prop("muted", true);
          } else if (state == "待考试" && !inCooldown) {
            // 待考试：优先搜索学习中/未学习课程，找不到再进入考试
            if (courseFinished) return;
            // 【v2.8.2】模式2：考试按钮未解锁（disabled 未移除，考试任务接口未返回）
            // → 先等最多30秒再行动；等期内下个tick复查，解锁立即进考试，超时才跳下一课
            if (localStorage.getItem("华医mode") == "2") {
              if (!hyExamBtnUnlocked()) {
                if (!hyuExamWaitUntil) {
                  hyuExamWaitUntil = Date.now() + 30000;
                  console.log(
                    "【子川助手】本课待考试但考试按钮未解锁，最多等30秒（解锁即自动进考试）...",
                  );
                }
                if (Date.now() < hyuExamWaitUntil) return; // 下个tick复查
                console.log(
                  "【子川助手】等待超时仍未解锁，跳下一课（本课保持待考试，后续补考）",
                );
              }
              hyuExamWaitUntil = 0;
            }
            courseFinished = true;
            clearInterval(clockms);
            clockms = null;
            if (clock) {
              clearInterval(clock);
              clock = null;
            }
            try {
              document.querySelector("video").pause();
            } catch (e) {}
            // 【v2.7.2】模式2逐课考试：状态已翻转为待考试 → 立即进本课考试
            if (
              localStorage.getItem("华医mode") == "2" &&
              tryClickExamHere()
            )
              return;
            console.log(
              "【子川助手】当前课程状态为待考试，搜索学习中/未学习课程...",
            );
            var lis = document.querySelectorAll("li.lis-inside-content");
            var foundLi = null;
            for (var n = 0; n < lis.length; n++) {
              var st = getCourseStatus(lis[n]);
              if (st === "未学习" || st === "学习中") {
                foundLi = lis[n];
                console.log("【子川助手】找到课程（" + st + "），开始学习");
                break;
              }
            }
            if (foundLi) {
              // 导航到找到的课程
              var navigated = false;
              var onclickAttr = foundLi.getAttribute("onclick") || "";
              var urlMatch = onclickAttr.match(
                /location\.href=['"]([^'"]+)['"]/,
              );
              if (urlMatch && urlMatch[1]) {
                window.location.href = urlMatch[1];
                navigated = true;
              }
              if (!navigated) {
                var h2 = foundLi.querySelector("h2");
                if (h2) {
                  h2.click();
                  navigated = true;
                }
              }
              if (!navigated) {
                foundLi.click();
              }
              navCooldownUntil = Date.now() + 5000;
            } else {
              // 没有学习中/未学习课程，检查是否进入考试
              if (localStorage.getItem("华医mode") == "2") {
                console.log(
                  "【子川助手】无剩余可学课程，准备进入考试 (clockms)",
                );
                await new Promise((resolve) => setTimeout(resolve, 2000));
                try {
                  clickexam();
                } catch (error) {
                  console.log("扫码进入考试");
                  window.open(
                    "/pages/exam_tip.aspx?cwrid=" +
                      (typeof cwrid !== "undefined" ? cwrid : ""),
                    "_self",
                  );
                }
              } else {
                console.log(
                  "【子川助手】单刷模式，全部课程已完成 (clockms)",
                );
              }
            }
          } else if (state == "已完成" && !inCooldown) {
            if (courseFinished) return;
            courseFinished = true;
            clearInterval(clockms);
            clockms = null;
            if (clock) {
              clearInterval(clock);
              clock = null;
            }
            try {
              document.querySelector("video").pause();
            } catch (e) {}
            sessionStorage.setItem("hua_yi_post_refresh", "1");
            console.log("【子川助手】课程已完成，3秒后刷新页面检查状态");
            await new Promise((resolve) => setTimeout(resolve, 3000));
            location.reload();
          }
        } catch (err) {
          // DOM 变动中，静默忽略
        }
      }, 2000);
    }
    function advis() {
      var div1 = document.createElement("div");
      var currentMode = localStorage.getItem("华医mode");
      var modeIsExam = currentMode == 2;
      var modeLabel = modeIsExam ? "视频+考试" : "单刷视频";
      var modeColor = modeIsExam ? "#e8f5e9" : "#f0f7ff";
      var modeBorder = modeIsExam ? "#a5d6a7" : "#d0e4f7";
      var modeTextColor = modeIsExam ? "#2e7d32" : "#1976d2";
      // 恢复面板位置/透明度/折叠状态
      var savedPos = null,
        savedOpacity = 1,
        savedCollapsed = false;
      try {
        var sp = JSON.parse(localStorage.getItem("hyu_panel_pos"));
        if (sp && typeof sp.x === "number" && typeof sp.y === "number")
          savedPos = sp;
        var so = localStorage.getItem("hyu_panel_opacity");
        if (so !== null) savedOpacity = parseFloat(so);
        savedCollapsed = localStorage.getItem("hyu_panel_collapsed") === "1";
      } catch (e) {}
      var initTop = savedPos ? savedPos.y : 180;
      var initLeft = savedPos ? savedPos.x : 40;
      div1.innerHTML =
        `
    <div id='Div1' style="
        width: 238px;
        font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
        font-size: 12px;
        position: fixed;
        top: ` +
        initTop +
        `px;
        left: ` +
        initLeft +
        `px;
        z-index: 99999;
        background: rgba(255,255,255,` +
        savedOpacity +
        `);
        border: 1px solid #e0e0e0;
        border-radius: 8px;
        box-shadow: 0 2px 12px rgba(0,0,0,0.12);
        overflow: hidden;
        transition: opacity 0.3s;
        user-select: none;
    ">
        <style>
            #Div1 .hyu-sec{background:#fafafa;border:1px solid #e8e8e8;border-radius:6px;padding:6px 8px;margin-bottom:6px;color:#333;line-height:1.5;}
            #Div1 .hyu-row{display:flex;align-items:center;gap:6px;flex-wrap:wrap;}
            #Div1 .hyu-sec-t{font-weight:bold;color:#555;}
            #Div1 .hyu-btn{display:inline-block;padding:2px 9px;border-radius:10px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;line-height:1.6;}
            #Div1 .hyu-btn:hover{filter:brightness(0.95);}
            #Div1 .hyu-btnrow{display:flex;gap:5px;flex-wrap:wrap;margin-top:5px;align-items:center;}
            #Div1 .speedBtn{display:inline-block;padding:2px 9px;border-radius:10px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;line-height:1.6;}
            #Div1 .hyu-speed-row{display:flex;flex-wrap:wrap;gap:5px;margin-top:4px;}
            #Div1 details.hyu-details{font-size:12px;color:#333;background:#fafafa;border:1px solid #e8e8e8;border-radius:6px;padding:4px 8px;margin-bottom:6px;line-height:1.5;}
            #Div1 details.hyu-details summary{cursor:pointer;font-weight:bold;color:#555;user-select:none;font-size:12px;list-style:none;}
            #Div1 details.hyu-details summary::-webkit-details-marker{display:none;}
            #Div1 details.hyu-details summary::before{content:"▸ ";color:#999;}
            #Div1 details.hyu-details[open] summary::before{content:"▾ ";}
            #Div1 .hyu-in{width:100%;box-sizing:border-box;border:1px solid #ccc;border-radius:5px;padding:3px 6px;font-size:12px;margin-top:5px;background:#fff;color:#333;}
            #Div1 #tixing{font-size:12px;color:#666;line-height:1.5;padding:6px 8px;background:#f5f7fa;border-radius:5px;margin-bottom:6px;}
            #Div1 #update{font-size:11px;color:#999;line-height:1.5;padding-top:2px;}
            #Div1 #hyu-ai-form-hint{color:#c62828;font-size:11px;margin-top:4px;display:none;line-height:1.4;}
            #Div1 #hyu-ai-status{font-size:11px;color:#666;line-height:1.5;}
        </style>
        <div id="hyu-panel-header" style="
            background: linear-gradient(135deg, #4cb0f9, #3a8fd4);
            color: #fff;
            padding: 8px 12px;
            font-size: 14px;
            font-weight: bold;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: move;
        ">
            <span>子川助手 v` +
        (typeof GM_info !== "undefined"
          ? GM_info["script"]["version"]
          : HYU_VERSION) +
        `</span>
            <span style="display:flex;gap:8px;align-items:center;">
                <span id='hyu-minimize' style="cursor:pointer;font-size:14px;line-height:1;opacity:0.85;" title="最小化面板">─</span>
                <span id='clo' style="cursor:pointer;font-size:16px;line-height:1;opacity:0.85;" title="关闭面板">×</span>
            </span>
        </div>
        <div id="hyu-panel-body" style="padding:8px;max-height:calc(100vh - 92px);overflow-y:auto;` +
        (savedCollapsed ? "display:none;" : "") +
        `">
            <div id="tixing">当前页面无代码！！！</div>
            <div id="modeSection" class="hyu-sec hyu-row" style="background:` +
        modeColor +
        `;border-color:` +
        modeBorder +
        `;">
                <span class="hyu-sec-t">模式</span>
                <span id="modeLabel" style="display:inline-block;padding:2px 10px;border-radius:10px;font-weight:bold;cursor:pointer;user-select:none;background:` +
        modeTextColor +
        `;color:#fff;" title="点击切换：单刷视频（只需学时）/ 视频+考试（需要学分）">` +
        modeLabel +
        `</span>
            </div>
            <div class="hyu-sec hyu-row" title="视频页每15秒刷新；本包完成数/剩余课时/预计剩余时长">
                <span class="hyu-sec-t">进度</span>
                <span id="hyu-progress-text" style="color:#666;">读取中…</span>
            </div>
            <div id="speedSection" class="hyu-sec" title="服务端校验真实观看时长：>1x 提前播完会被拒（时长不足需重看），默认恒为 1x">
                <span class="hyu-sec-t">速度</span>
                <span style="font-size:11px;color:#999;">默认1x（>1x 可能被拒需重看，建议1和1.5x选择）</span>
                <div class="hyu-speed-row">
                    <span class="speedBtn" data-rate="1">1x</span>
                    <span class="speedBtn" data-rate="1.5">1.5x</span>
                    <span class="speedBtn" data-rate="2">2x</span>
                    <span class="speedBtn" data-rate="3">3x</span>
                    <span class="speedBtn" data-rate="4">4x</span>
                    <span class="speedBtn" data-rate="6">6x</span>
                    <span class="speedBtn" data-rate="8">8x</span>
                </div>
            </div>
            <div id="hyu-ai-section" class="hyu-sec">
                <span class="hyu-sec-t">联网答题</span>
                <span style="font-size:11px;color:#999;">题库未命中时作答（AI准确率高(付费但极便宜（答百题约几分钱，但需手动配置）。)，百度看脸）</span>
                <div id="hyu-ai-status">读取中…</div>
                <div class="hyu-btnrow">
                    <span id="hyu-ai-toggle" class="hyu-btn" title="AI 作答总开关（默认关；配置并在「测试」通过后自动开启，也可手动切换）">AI:关</span>
                    <span id="hyu-ai-config" class="hyu-btn" title="打开配置表单：接口地址 / API Key / 模型名（点预设自动填）">配置AI</span>
                    <span id="hyu-ai-test" class="hyu-btn" title="发一道测试题验证 AI 接口是否可用（通过后自动开启 AI）">测试</span>
                    <span id="hyu-ai-clear" class="hyu-btn" title="删除已保存的 AI 地址/Key/模型（恢复答案库+试错作答）">清除配置</span>
                </div>
                <div id="hyu-ai-form" style="display:none;">
                    <div class="hyu-btnrow" style="margin-top:5px;">
                        <span class="hyu-ai-preset" data-p="0" title="注册送额度，标 FREE 的模型完全免费。cloud.siliconflow.cn">①硅基·免费</span>
                        <span class="hyu-ai-preset" data-p="1" title="阿里云百炼，qwen-flash 有免费额度">②通义千问</span>
                        <span class="hyu-ai-preset" data-p="2" title="付费但极便宜（答百题约几分钱）。platform.deepseek.com">③DeepSeek</span>
                    </div>
                    <input id="hyu-ai-in-base" class="hyu-in" placeholder="接口地址（点上方预设自动填）">
                    <input id="hyu-ai-in-key" class="hyu-in" type="password" placeholder="API Key（各家官网注册免费创建）">
                    <input id="hyu-ai-in-model" class="hyu-in" placeholder="模型名（点上方预设自动填）">
                    <div id="hyu-ai-form-hint"></div>
                    <div class="hyu-btnrow">
                        <span id="hyu-ai-save" class="hyu-btn" style="background:#1976d2;color:#fff;">保存</span>
                        <span id="hyu-ai-cancel" class="hyu-btn">取消</span>
                    </div>
                </div>
                <div class="hyu-btnrow">
                    <span id="hyu-search-toggle" class="hyu-btn" title="百度/必应搜索答案（无需AI）：装配套「搜索桥」脚本后直连秒回；未装则走公共代理（大陆多不通，不可达自动熔断10分钟）。答对自动入库">百度搜索:关</span>
                    <span id="hyu-search-test" class="hyu-btn" title="检测搜索链路：桥是否安装、百度是否能抓通、是否被风控">搜索自检</span>
                </div>
            </div>
            <div id="hyu-credit-section" class="hyu-sec" title="学分定向学习：3学分优先，余2补一门2学分课，余1补一门1学分课，补满即停；优先学习记录中已开始的课程">
                <span class="hyu-sec-t">学分学习</span>
                <span style="font-size:11px;color:#999;">3学分优先，余数补2/1学分课，达标自动停</span>
                <div class="hyu-btnrow">
                    <input id="hyu-credit-in" class="hyu-in" type="number" min="1" step="1" placeholder="目标学分" style="width:90px;">
                    <span id="hyu-credit-start" class="hyu-btn" style="background:#2e7d32;color:#fff;" title="在继教首页/课程列表页点击：按规则自动选课并逐门学习">开始刷学分</span>
                    <span id="hyu-credit-stop" class="hyu-btn" title="停止学分学习计划（当前进度保留）">停止</span>
                </div>
                <div id="hyu-credit-status" style="font-size:11px;color:#666;">未启动（在继教首页点「开始刷学分」）</div>
                <details class="hyu-details" id="hyu-lr-order-details">
                    <summary>课程顺序（学习记录优先级）</summary>
                    <div id="hyu-lr-order-list" style="font-size:12px;color:#333;margin-top:4px;">读取中…</div>
                    <div class="hyu-btnrow" style="margin-top:4px;">
                        <span id="hyu-lr-order-reset" class="hyu-btn" title="清除记住的课程顺序：下次进入继教首页/学习记录会重新弹选课窗">重置顺序记忆</span>
                    </div>
                </details>
            </div>
            <details class="hyu-details">
                <summary>永久题库（导出/导入文件）</summary>
                <div style="font-size:11px;color:#999;margin-top:4px;line-height:1.5;">
                    文件为「问题 → 答案」的 JSON。导出存到本机=永久保存（localStorage 会被清浏览器数据抹掉）；被清后导入即恢复。新题由 AI 联网答，答完自动入库，越用越厚。
                </div>
                <div class="hyu-btnrow">
                    <span id="hyu-ans-export" class="hyu-btn" title="导出全部问答为「问题→答案」JSON 文件">导出题库文件</span>
                    <span id="hyu-ans-import" class="hyu-btn" title="选择之前导出的题库文件，一键恢复">导入题库文件</span>
                </div>
            </details>
            <details class="hyu-details">
                <summary>面板透明度</summary>
                <div class="hyu-row" style="margin-top:4px;">
                    <span style="font-size:11px;color:#999;">透明</span>
                    <input id="hyu-opacity-slider" type="range" min="20" max="100" value="` +
        Math.round(savedOpacity * 100) +
        `" style="flex:1;cursor:pointer;">
                    <span style="font-size:11px;color:#999;">不透明</span>
                </div>
            </details>
            <div style="text-align:center;color:#bbb;font-size:13px;font-weight:bold;padding:3px 0 1px;user-select:none;letter-spacing:2px;">吴喻伦比</div>
        </div>
    </div>`;
      if (document.body) {
        document.body.append(div1);
      } else {
        document.addEventListener("DOMContentLoaded", function () {
          document.body.append(div1);
        });
      }

      // ====== 拖拽功能 ======
      var panel = document.getElementById("Div1");
      var header = document.getElementById("hyu-panel-header");
      if (panel && header) {
        var isDragging = false,
          dragOffsetX = 0,
          dragOffsetY = 0;
        header.addEventListener("mousedown", function (e) {
          if (e.target.id === "clo" || e.target.id === "hyu-minimize") return;
          isDragging = true;
          dragOffsetX = e.clientX - panel.getBoundingClientRect().left;
          dragOffsetY = e.clientY - panel.getBoundingClientRect().top;
          e.preventDefault();
        });
        document.addEventListener("mousemove", function (e) {
          if (!isDragging) return;
          var newX = e.clientX - dragOffsetX;
          var newY = e.clientY - dragOffsetY;
          // 限制在视口内
          newX = Math.max(0, Math.min(window.innerWidth - 60, newX));
          newY = Math.max(0, Math.min(window.innerHeight - 30, newY));
          panel.style.left = newX + "px";
          panel.style.top = newY + "px";
        });
        document.addEventListener("mouseup", function () {
          if (isDragging) {
            isDragging = false;
            // 保存位置
            try {
              localStorage.setItem(
                "hyu_panel_pos",
                JSON.stringify({
                  x: parseInt(panel.style.left),
                  y: parseInt(panel.style.top),
                }),
              );
            } catch (e) {}
          }
        });
      }

      // ====== 透明度控制 ======
      var opacitySlider = document.getElementById("hyu-opacity-slider");
      if (opacitySlider && panel) {
        opacitySlider.addEventListener("input", function () {
          var val = parseInt(this.value) / 100;
          panel.style.background = "rgba(255,255,255," + val + ")";
          try {
            localStorage.setItem("hyu_panel_opacity", String(val));
          } catch (e) {}
        });
      }

      // ====== 最小化按钮 ======
      var minBtn = document.getElementById("hyu-minimize");
      var panelBody = document.getElementById("hyu-panel-body");
      if (minBtn && panelBody) {
        // 初始状态恢复
        if (savedCollapsed) {
          panelBody.style.display = "none";
          minBtn.textContent = "□";
          minBtn.title = "展开面板";
        }
        minBtn.onclick = function () {
          var isHidden = panelBody.style.display === "none";
          panelBody.style.display = isHidden ? "block" : "none";
          minBtn.textContent = isHidden ? "─" : "□";
          minBtn.title = isHidden ? "最小化面板" : "展开面板";
          try {
            localStorage.setItem("hyu_panel_collapsed", isHidden ? "0" : "1");
          } catch (e) {}
        };
      }

      // 关闭按钮
      var clo = document.getElementById("clo");
      if (clo) {
        clo.onclick = function () {
          if (panel) panel.style.display = "none";
        };
      }

      // 模式切换按钮
      var modeLabelEl = document.querySelector("#modeLabel");
      if (modeLabelEl) {
        modeLabelEl.onclick = function () {
          var current = localStorage.getItem("华医mode");
          if (current == 2) {
            localStorage.setItem("华医mode", "1");
            modeLabelEl.innerText = "单刷视频";
            modeLabelEl.style.background = "#1976d2";
            var sec = document.querySelector("#modeSection");
            if (sec) {
              sec.style.background = "#f0f7ff";
              sec.style.borderColor = "#d0e4f7";
            }
            console.log("【子川助手】已切换为单刷视频模式");
          } else {
            localStorage.setItem("华医mode", "2");
            modeLabelEl.innerText = "视频+考试";
            modeLabelEl.style.background = "#2e7d32";
            var sec = document.querySelector("#modeSection");
            if (sec) {
              sec.style.background = "#e8f5e9";
              sec.style.borderColor = "#a5d6a7";
            }
            console.log("【子川助手】已切换为视频+考试模式");
          }
        };
      }

      // 倍速按钮事件
      var speedBtns = document.querySelectorAll(".speedBtn");
      var savedSpeed = 1; // 【v2.5.1】每次打开页面默认 1x，不再恢复历史倍速（服务端校验真实观看时长）
      for (var s = 0; s < speedBtns.length; s++) {
        (function (btn) {
          var rate = parseFloat(btn.getAttribute("data-rate"));
          // 高亮已保存的速度
          if (Math.abs(rate - savedSpeed) < 0.01) {
            btn.style.background = "#1976d2";
            btn.style.color = "#fff";
          }
          btn.onclick = function () {
            // >1x 首次点击提醒：服务端可能判定「观看时长不足」要求重看
            if (rate > 1 && !sessionStorage.getItem("hyu_speed_warned")) {
              if (
                !confirm(
                  "服务端校验真实观看时长：>1x 提前播完会被拒，\n" +
                    "弹「观看时长不足，请重新观看」等于白刷。\n\n仍要开 " +
                    rate +
                    "x 吗？（本次提醒后不再弹出）",
                )
              )
                return;
              try {
                sessionStorage.setItem("hyu_speed_warned", "1");
              } catch (e) {}
            }
            // 重置所有按钮样式
            var allBtns = document.querySelectorAll(".speedBtn");
            for (var a = 0; a < allBtns.length; a++) {
              allBtns[a].style.background = "#e0e0e0";
              allBtns[a].style.color = "#555";
            }
            // 高亮当前按钮
            btn.style.background = "#1976d2";
            btn.style.color = "#fff";
            // 应用倍速
            ratechg(rate);
          };
        })(speedBtns[s]);
      }

      // ====== 【v2.6.0】AI 联网答题：面板内表单配置（三项校验 + 明确反馈）======
      function refreshAiStatus() {
        var el = document.getElementById("hyu-ai-status");
        if (!el) return;
        // 【v2.7.2】清理旧版本残留的空 Key（空字符串会让"已配置"判断失真）
        try {
          if (localStorage.getItem("hyu_ai_key") === "")
            localStorage.removeItem("hyu_ai_key");
        } catch (e) {}
        var lastAi = null;
        try {
          lastAi = localStorage.getItem("hyu_ai_last");
        } catch (e) {}
        var aOnMain = false;
        try {
          aOnMain = localStorage.getItem("hyu_ai_on") === "1";
        } catch (e) {}
        if (aiConfigured()) {
          var mdl = localStorage.getItem("hyu_ai_model") || "";
          el.innerHTML =
            "✓ 已配置：" +
            mdl +
            (aOnMain ? "（AI开关:开）" : "（AI开关:关，点下方「AI」开启或测试通过自动开）") +
            "<br>上次AI调用：" +
            (lastAi || "尚未调用");
          // 【v2.8.4】DeepSeek 旧模型已下线提示（用户存过 deepseek-chat 会一直"未返回选项字母"）
          if (mdl === "deepseek-chat" || mdl === "deepseek-reasoner") {
            el.innerHTML +=
              '<br><span style="color:#c62828;">⚠ 该模型名已下线（2026 在售：deepseek-flash / deepseek-v4-pro）。请点「配置AI」→ 点一下「③DeepSeek」预设 → 保存 → 测试</span>';
          }
          el.style.color = aOnMain ? "#2e7d32" : "#b26a00";
        } else {
          el.innerHTML =
            "AI 未配置（作答走：答案库→百度搜索→试错）<br>要用 AI：点「配置AI」→ 选预设 → 填 Key → 测试";
          el.style.color = "#666";
        }
        // 【v2.7.3】搜索桥就绪提示；【v2.8.4】改用 hyHasBridge()（含事件通道标志）
        // 并在桥就绪事件到达时自动刷新本区——旧逻辑只查 window 属性且只渲染一次，
        // 桥走事件通道正常工作时这里仍显示"未装"，纯属假象
        var bridgeOn = hyHasBridge();
        if (!bridgeOn) {
          el.innerHTML +=
            '<br><span style="color:#c62828;">⚠ 未检测到「搜索桥」：请安装/更新 hua-yi-search.user.js 到 v1.1.0 后刷新（旧版只走公共代理，大陆基本不通）</span>';
          // 异步探一次事件通道，桥在就自动重绘为就绪状态
          hyBridgeProbe().then(function (ok) {
            if (ok) refreshAiStatus();
          });
        }
        var st2 = document.getElementById("hyu-search-toggle");
        if (st2) {
          var sOn = false;
          try {
            sOn = localStorage.getItem("hyu_search_on") === "1";
          } catch (e) {}
          st2.textContent = "百度搜索:" + (sOn ? "开" : "关");
          st2.style.background = sOn ? "#2e7d32" : "#e0e0e0";
          st2.style.color = sOn ? "#fff" : "#555";
        }
        // 【v2.7.3】AI 作答总开关状态
        var at = document.getElementById("hyu-ai-toggle");
        if (at) {
          var aOn = false;
          try {
            aOn = localStorage.getItem("hyu_ai_on") === "1";
          } catch (e) {}
          at.textContent = "AI:" + (aOn ? "开" : "关");
          at.style.background = aOn ? "#e65100" : "#e0e0e0";
          at.style.color = aOn ? "#fff" : "#555";
        }
      }
      // 【v2.8.4】桥经事件通道就绪时自动重绘面板状态（否则提示永远是"未装"假象）
      document.addEventListener("hySearchBridgeReady", refreshAiStatus);
      document.addEventListener("hySearchPong", refreshAiStatus);
      var aiToggleBtn = document.getElementById("hyu-ai-toggle");
      if (aiToggleBtn) {
        aiToggleBtn.onclick = function () {
          var on = false;
          try {
            on = localStorage.getItem("hyu_ai_on") === "1";
            localStorage.setItem("hyu_ai_on", on ? "0" : "1");
            // 【v2.8.0】百度/AI 互斥：开 AI 自动关百度
            if (!on) {
              try {
                localStorage.setItem("hyu_search_on", "0");
              } catch (e2) {}
            }
          } catch (e) {}
          refreshAiStatus();
          hyToast(
            on
              ? "AI 作答已关闭"
              : "AI 作答已开启（百度搜索已自动关闭，两者互斥）",
          );
        };
      }
      var searchToggleBtn = document.getElementById("hyu-search-toggle");
      if (searchToggleBtn) {
        searchToggleBtn.onclick = function () {
          var on = false;
          try {
            on = localStorage.getItem("hyu_search_on") === "1";
            localStorage.setItem("hyu_search_on", on ? "0" : "1");
            // 【v2.8.0】百度/AI 互斥：开百度自动关 AI
            if (!on) {
              try {
                localStorage.setItem("hyu_ai_on", "0");
              } catch (e2) {}
            }
          } catch (e) {}
          refreshAiStatus();
          hyToast(
            on
              ? "百度搜索已关闭"
              : "百度搜索已开启（AI 已自动关闭，两者互斥）" +
                (hyHasBridge()
                  ? "｜搜索桥已就绪，直连秒回"
                  : "｜未检测到搜索桥（装了 v1.1.0 桥则会走事件通道），将尝试公共代理"),
          );
        };
      }
      // ====== 【v2.8.1】搜索自检：定位"开了百度还是试错"到底卡在哪一环 ======
      // 【v2.8.3】检测升级：window 直调不可用时再探事件通道（桥 v1.1.0），都能用才算装好
      var searchTestBtn = document.getElementById("hyu-search-test");
      if (searchTestBtn) {
        searchTestBtn.onclick = async function () {
          searchTestBtn.textContent = "自检中…";
          var viaWindow = typeof window.__hySearchWeb === "function";
          var viaEvents = await hyBridgeProbe();
          if (!viaWindow && !viaEvents) {
            searchTestBtn.textContent = "搜索自检";
            hyToast(
              "❌ 搜索桥未安装/未响应：确认 hua-yi-search.user.js 已安装且为 v1.1.0（旧版 v1.0.0 请更新）后刷新本页（当前只能走公共代理，大陆基本不通，搜索等于关闭）",
            );
            return;
          }
          try {
            var html = viaWindow
              ? await window.__hySearchWeb(
                  "https://www.baidu.com/s?wd=" +
                    encodeURIComponent("华医网 继续教育 课件 答案"),
                )
              : await hyBridgeFetchViaEvents(
                  "https://www.baidu.com/s?wd=" +
                    encodeURIComponent("华医网 继续教育 课件 答案"),
                );
            if (String(html).indexOf("安全验证") !== -1) {
              hyToast("⚠️ 桥已通，但百度返回安全验证页（请求特征被识别）——稍后再试或换必应");
            } else {
              hyToast(
                "✓ 搜索链路正常（抓到百度结果页 " +
                  Math.round(String(html).length / 1024) +
                  "KB）——搜索没命中答案属正常（网上无该题），会回退试错",
              );
            }
          } catch (e) {
            hyToast("✗ 桥请求失败：" + e.message + "（检查网络、油猴中搜索桥是否启用）");
          }
          searchTestBtn.textContent = "搜索自检";
        };
      }
      // ════════ 【v2.9.0】学分学习面板 ════════
      var creditStartBtn = document.getElementById("hyu-credit-start");
      if (creditStartBtn) {
        creditStartBtn.onclick = function () {
          var inp = document.getElementById("hyu-credit-in");
          var target = parseFloat(inp && inp.value);
          if (!target || target <= 0) {
            hyToast("❗先输入目标学分（如 25）");
            return;
          }
          var cands = hyuCreditCandidates();
          // 【v2.9.6】两阶段：①学习记录待修课（按记住的顺序）②目录补足（排除 LR 课程）。
          // LR 学分先计入目标，目录只补差额。
          var lrAll = hyuLrOrdered(hyuCreditLRLoad());
          var lrSum = 0;
          lrAll.forEach(function (r) {
            if (lrSum < target - 0.01) lrSum += r.credit;
          });
          lrSum = Math.min(lrSum, target);
          var need = Math.round((target - lrSum) * 10) / 10;
          var lrNorms = lrAll.map(function (r) {
            return hyuCreditTitleNorm(r.name);
          });
          var lrCodes = lrAll.map(function (r) {
            return r.code;
          });
          var candsNoLR = cands.filter(function (c) {
            var cn = hyuCreditTitleNorm(c.title);
            var isLR = lrNorms.some(function (ln) {
              return ln.indexOf(cn) !== -1 || cn.indexOf(ln) !== -1;
            });
            if (!isLR && c.code) {
              isLR = lrCodes.indexOf(c.code) !== -1;
            }
            return !isLR;
          });
          var plan = {
            active: true,
            target: target,
            queue: hyuCreditBuildQueue(need, candsNoLR, [], {}),
            done: [],
            visited: {},
            startedAt: Date.now(),
          };
          if (need > 0 && !plan.queue.length && !lrAll.length) {
            hyToast("❗选不出可用课程（候选不足）");
            return;
          }
          try {
            localStorage.removeItem("hyu_lr_play_stopped"); //【v2.10.2】重新开始时解除停止
          } catch (e) {}
          hyuCreditSave(plan);
          hyuCreditRefreshStatus();
          var msg =
            "✓ 学分计划建立：目标 " + target + " 学分（学习记录优先修 " +
            Math.min(lrAll.length, Math.ceil(target / 3)) + " 门相关课" +
            (plan.queue.length ? "，目录补 " + plan.queue.length + " 门" : "") +
            "）";
          hyToast(msg);
          setTimeout(function () {
            if (lrAll.length) {
              location.href = location.origin + "/pages/study_info_list.aspx";
            } else if (plan.queue[0]) {
              location.href =
                location.origin +
                "/pages/course.aspx?cid=" +
                plan.queue[0].cid;
            } else {
              location.href = location.origin + "/cme/index";
            }
          }, 1200);
        };
      }
      var creditStopBtn = document.getElementById("hyu-credit-stop");
      if (creditStopBtn) {
        creditStopBtn.onclick = function () {
          var p = hyuCreditLoad();
          if (!p || !p.active) {
            hyToast("当前没有进行中的学分计划");
            return;
          }
          p.active = false;
          try {
            localStorage.setItem("hyu_lr_play_stopped", "1"); //【v2.10.2】同时停掉顺序播放模式
          } catch (e) {}
          hyuCreditSave(p);
          hyuCreditRefreshStatus();
          hyToast(
            "已停止学分计划（已完成 " + p.done.length + " 门/" +
              hyuCreditCreditsDone(p) + " 学分）",
          );
        };
      }
      hyuCreditRefreshStatus();
      // ════════ 【v2.9.5】课程顺序编辑器（学习记录优先级，随时可改） ════════
      var orderListEl = document.getElementById("hyu-lr-order-list");
      var orderDetailsEl = document.getElementById("hyu-lr-order-details");
      if (orderListEl && orderDetailsEl) {
        orderDetailsEl.addEventListener("toggle", function () {
          if (orderDetailsEl.open) hyuCreditRenderOrderList();
        });
        var orderResetBtn = document.getElementById("hyu-lr-order-reset");
        if (orderResetBtn) {
          orderResetBtn.onclick = function () {
            hyuLROrderSave([]);
            try {
              sessionStorage.removeItem("hyu_lr_dismiss");
            } catch (e) {}
            hyuCreditRenderOrderList();
            hyToast(
              "已重置课程顺序记忆：下次进入继教首页/学习记录会重新弹选课窗",
            );
          };
        }
        hyuCreditRenderOrderList();
      }
      // ════ 【v2.7.2】AI 模型预设（浏览器实测可直连的三家）══════
      // 2026.11.27 实测：智谱 open.bigmodel.cn（anthropic/openai 两格式）均被浏览器
      // 跨域拦截（Failed to fetch）——不是 Key 问题，是接口不发 CORS 头，已移出预设。
      // DeepSeek / 通义 / 硅基 实测直连 OK（401 响应可到达，换真 Key 即可用）。
      var AI_PRESETS = [
        { name: "硅基·免费", base: "https://api.siliconflow.cn/v1", model: "Qwen/Qwen2.5-7B-Instruct", tip: "cloud.siliconflow.cn 注册送额度，模型页标 FREE 的完全免费" },
        { name: "通义千问", base: "https://dashscope.aliyuncs.com/compatible-mode/v1", model: "qwen-flash", tip: "阿里云百炼控制台，qwen-flash 有免费额度" },
        { name: "DeepSeek", base: "https://api.deepseek.com/v1", model: "deepseek-flash", tip: "platform.deepseek.com，付费但答上百题约几分钱（2026 在售模型：deepseek-flash / deepseek-v4-pro，老模型 deepseek-chat 已下线则报「Model Not Exist」）" },
      ];
      var presetBtns = document.querySelectorAll(".hyu-ai-preset");
      for (var pi = 0; pi < presetBtns.length; pi++) {
        (function (btn) {
          var p = AI_PRESETS[parseInt(btn.getAttribute("data-p"), 10)];
          if (!p) return;
          btn.onclick = function () {
            document.getElementById("hyu-ai-in-base").value = p.base;
            document.getElementById("hyu-ai-in-model").value = p.model;
            var hint = document.getElementById("hyu-ai-form-hint");
            if (hint) {
              hint.textContent = "已选「" + p.name + "」。获取 Key：" + p.tip;
              hint.style.color = "#1565c0";
              hint.style.display = "block";
            }
            try {
              document.getElementById("hyu-ai-in-key").focus();
            } catch (e) {}
          };
        })(presetBtns[pi]);
      }
      var aiCfgBtn = document.getElementById("hyu-ai-config");
      if (aiCfgBtn) {
        aiCfgBtn.onclick = function () {
          var form = document.getElementById("hyu-ai-form");
          if (!form) return;
          var opening = form.style.display === "none";
          form.style.display = opening ? "block" : "none";
          if (opening) {
            var hint = document.getElementById("hyu-ai-form-hint");
            if (hint) hint.style.display = "none";
            document.getElementById("hyu-ai-in-base").value =
              localStorage.getItem("hyu_ai_base") ||
              "https://api.deepseek.com/anthropic";
            document.getElementById("hyu-ai-in-key").value =
              localStorage.getItem("hyu_ai_key") || "";
            document.getElementById("hyu-ai-in-model").value =
              localStorage.getItem("hyu_ai_model") || "deepseek-flash";
            try {
              document.getElementById("hyu-ai-in-key").focus();
            } catch (e) {}
          }
        };
      }
      var aiSaveBtn = document.getElementById("hyu-ai-save");
      if (aiSaveBtn) {
        aiSaveBtn.onclick = function () {
          var base = document
            .getElementById("hyu-ai-in-base")
            .value.trim();
          var key = document.getElementById("hyu-ai-in-key").value.trim();
          var model = document
            .getElementById("hyu-ai-in-model")
            .value.trim();
          var hint = document.getElementById("hyu-ai-form-hint");
          // 三项全填才保存——缺 Key 时明确提示获取路径，不再"保存了等于没配"
          if (!base || !key || !model) {
            if (hint) {
              hint.textContent =
                "❗三项都要填（缺 Key 无法调用）。免费 Key：open.bigmodel.cn 注册 → 右上角「API Key」创建";
              hint.style.display = "block";
            }
            return;
          }
          try {
            localStorage.setItem("hyu_ai_base", base);
            localStorage.setItem("hyu_ai_key", key);
            localStorage.setItem("hyu_ai_model", model);
          } catch (e) {}
          document.getElementById("hyu-ai-form").style.display = "none";
          refreshAiStatus();
          hyToast("✓ AI 配置已保存（" + model + "），点「测试」验证");
        };
      }
      var aiCancelBtn = document.getElementById("hyu-ai-cancel");
      if (aiCancelBtn) {
        aiCancelBtn.onclick = function () {
          var form = document.getElementById("hyu-ai-form");
          if (form) form.style.display = "none";
        };
      }
      var aiTestBtn = document.getElementById("hyu-ai-test");
      if (aiTestBtn) {
        aiTestBtn.onclick = async function () {
          if (!aiConfigured()) {
            hyToast("❗未配置：点「配置AI」填三项（Key 必填）");
            refreshAiStatus();
            return;
          }
          aiTestBtn.textContent = "测试中…";
          try {
            var letter = await aiAskChoice("1+1=?", [
              "A. 1",
              "B. 2",
              "C. 3",
              "D. 4",
            ]);
            // 【v2.7.3】测试通过自动开启 AI 作答（总开关默认关，测试即实测，通过才开）
            try {
              localStorage.setItem("hyu_ai_on", "1");
            } catch (e2) {}
            refreshAiStatus();
            hyToast(
              "✓ AI 接口正常（模型 " +
                localStorage.getItem("hyu_ai_model") +
                "，返回 " +
                letter +
                "），AI 作答已自动开启",
            );
          } catch (e) {
            hyToast(
              "✗ AI 调用失败：" +
                e.message +
                "（Key 无效/不支持跨域/地址填错；失败时自动回退答案库+试错）",
            );
          }
          aiTestBtn.textContent = "测试";
        };
      }
      var aiClearBtn = document.getElementById("hyu-ai-clear");
      if (aiClearBtn) {
        aiClearBtn.onclick = function () {
          try {
            ["hyu_ai_base", "hyu_ai_key", "hyu_ai_model"].forEach(function (
              k,
            ) {
              localStorage.removeItem(k);
            });
          } catch (e) {}
          var form = document.getElementById("hyu-ai-form");
          if (form) form.style.display = "none";
          refreshAiStatus();
          hyToast("已清除 AI 配置（答题回退答案库+试错）");
        };
      }
      refreshAiStatus();

      // ====== 【v2.4.0】课程进度显示（视频页侧边栏可读时每 15 秒刷新） ======
      var progressEl = document.getElementById("hyu-progress-text");
      function updatePanelProgress() {
        if (!progressEl) return;
        var lis = document.querySelectorAll("li.lis-inside-content");
        if (!lis.length) {
          progressEl.textContent = "进入视频页后显示进度";
          return;
        }
        var done = 0,
          learning = 0,
          notDone = 0,
          examCount = 0;
        for (var i = 0; i < lis.length; i++) {
          var st = getCourseStatus(lis[i]);
          if (st.indexOf("已完成") !== -1) done++;
          else if (st.indexOf("学习中") !== -1) learning++;
          else if (st.indexOf("未学习") !== -1) notDone++;
          else if (st.indexOf("待考试") !== -1) examCount++;
        }
        var v = document.querySelector("video");
        var avgMin = v && v.duration ? Math.round(v.duration / 60) : 0;
        var remaining = learning + notDone + examCount;
        var est =
          avgMin > 0 && remaining > 0
            ? "，约需 " + Math.round(remaining * avgMin) + " 分钟"
            : "";
        var curLi = getCurrentCourseLi();
        var h2 = curLi ? curLi.querySelector("h2") : null;
        var title = h2
          ? h2.textContent.replace(/\s+/g, " ").trim().slice(0, 24)
          : "";
        progressEl.innerHTML =
          "本包 <b>" + done + "/" + lis.length + "</b> 已完成，剩 " + remaining + " 节" + est +
          (title ? "<br>正在学：" + title : "");
      }
      updatePanelProgress();
      setInterval(updatePanelProgress, 15000);

      // ════ 【v2.7.2】永久题库文件：纯「问题 → 答案」JSON ════
      // localStorage 会被浏览器清数据/换电脑清掉。导出格式按用户要求为
      // { "问题": "答案文字", ... } 的扁平映射；导入时恢复到答案库（自动
      // 全库检索，不分章节）。AI 配置不再混入文件（3 项手动重填更快）。
      var BK_OLD_KEYS = [
        keyAllAnswer,
        "JJ_QA_Answer",
        "JJ_Case_Answer",
        "hyu_ai_base",
        "hyu_ai_key",
        "hyu_ai_model",
      ];
      function bkCollect() {
        var out = {};
        try {
          var all = JSON.parse(localStorage.getItem(keyAllAnswer) || "{}");
          for (var c in all) {
            if (typeof all[c] !== "object") continue;
            for (var q in all[c]) {
              if (!(q in out)) out[q] = all[c][q];
            }
          }
        } catch (e) {}
        // 【v2.8.3】纳入考试中间库（keyRightAnswer）：试错循环中每轮「没被判错」的题
        // 实时存这里，但只有「通过」才合并进章节库（keyAllAnswer）——此前未通过期间
        // 导出永远为空，用户误以为没记录。中间库同样参与作答命中（doTest 首选）。
        try {
          var mid = JSON.parse(localStorage.getItem(keyRightAnswer) || "{}");
          for (var qm in mid) {
            if (!(qm in out)) out[qm] = mid[qm];
          }
        } catch (e) {}
        try {
          var cases = JSON.parse(localStorage.getItem("JJ_Case_Answer") || "{}");
          for (var q2 in cases) {
            if (!(q2 in out)) out[q2] = cases[q2];
          }
        } catch (e) {}
        // 【v2.8.1】课堂问答（文字版）：此前存的数字索引不含答案文本、无法导出，
        // 现答题时同步存文字（qaTextKey），导出即可见
        try {
          var qa = JSON.parse(localStorage.getItem("JJ_QA_AnswerText") || "{}");
          for (var q3 in qa) {
            if (!(q3 in out)) out[q3] = qa[q3];
          }
        } catch (e) {}
        return out;
      }
      // 【v2.8.1】各题库统计（导出按钮计数 + 空库原因提示）；v2.8.3 增加考试中间库
      function bkStats() {
        var st = { exam: 0, qa: 0, case: 0, mid: 0 };
        try {
          var all = JSON.parse(localStorage.getItem(keyAllAnswer) || "{}");
          for (var c in all) {
            if (typeof all[c] === "object")
              for (var q in all[c]) st.exam++;
          }
        } catch (e) {}
        try {
          st.mid = Object.keys(JSON.parse(localStorage.getItem(keyRightAnswer) || "{}")).length;
        } catch (e) {}
        try {
          st.qa = Object.keys(JSON.parse(localStorage.getItem("JJ_QA_AnswerText") || "{}")).length;
        } catch (e) {}
        try {
          st.case = Object.keys(JSON.parse(localStorage.getItem("JJ_Case_Answer") || "{}")).length;
        } catch (e) {}
        return st;
      }
      // 兼容 v2.7.0 旧版打包格式（含 AI 配置）的恢复
      function bkRestore(bundle) {
        var restored = 0;
        for (var k in bundle) {
          if (k === "__huayi_bank__" || k === "exportedAt") continue;
          if (BK_OLD_KEYS.indexOf(k) === -1) continue;
          try {
            if (typeof bundle[k] === "string" && bundle[k] !== "") {
              localStorage.setItem(k, bundle[k]);
              restored++;
            }
          } catch (e) {}
        }
        return restored;
      }
      var ansExportBtn = document.getElementById("hyu-ans-export");
      if (ansExportBtn) {
        function refreshExportCount() {
          try {
            var st = bkStats();
            ansExportBtn.textContent =
              "导出题库(" + (st.exam + st.qa + st.case + st.mid) + ")";
          } catch (e) {}
        }
        refreshExportCount();
        ansExportBtn.onclick = function () {
          var bank = bkCollect();
          var n = Object.keys(bank).length;
          if (!n) {
            var st = bkStats();
            alert(
              "题库当前为空。各题库统计：\n" +
                "· 课件考试题库：" + st.exam + " 条 —— 考试「通过」后转入正式库\n" +
                "· 考试中间库：" + st.mid + " 条 —— 试错轮次中「没被判错」的题实时存这里（未通过期间也生效，脚本重考直接命中；v2.8.3 起一并导出）\n" +
                "· 课堂问答：" + st.qa + " 条（答完自动存）\n" +
                "· 互动病例：" + st.case + " 条（提交后从参考答案自动存）\n\n" +
                "两个库都是 0 的常见原因：①考试是手动作答的（只有脚本自动作答的题才会记录答案文字）；②考试页打开了但还没交过卷。\n\n" +
                "另：统一考核的作答记忆存在 sdnew 域（浏览器按域名隔离），请在统一考核考试页右下角点「导出」。"
            );
            return;
          }
          var blob = new Blob([JSON.stringify(bank, null, 2)], {
            type: "application/json",
          });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download =
            "hua-yi-题库-" + new Date().toISOString().slice(0, 10) + ".json";
          document.body.appendChild(a);
          a.click();
          hyToast("✓ 已导出 " + n + " 条问答（保存好该文件=永久题库）");
          setTimeout(function () {
            URL.revokeObjectURL(a.href);
            if (a.parentNode) a.parentNode.removeChild(a);
          }, 5000);
        };
      }
      var ansImportBtn = document.getElementById("hyu-ans-import");
      if (ansImportBtn) {
        ansImportBtn.onclick = function () {
          var input = document.createElement("input");
          input.type = "file";
          input.accept = ".json,application/json";
          input.style.display = "none";
          input.onchange = function () {
            var file = input.files && input.files[0];
            if (!file) {
              input.remove();
              return;
            }
            var reader = new FileReader();
            reader.onload = function () {
              try {
                var incoming = JSON.parse(reader.result);
                if (!incoming || typeof incoming !== "object" || Array.isArray(incoming))
                  throw new Error("文件格式不正确（需为 JSON 对象）");
                if (incoming.__huayi_bank__) {
                  // v2.7.0 旧版打包格式
                  var n0 = bkRestore(incoming);
                  alert("导入成功：恢复 " + n0 + " 条记录");
                  refreshAiStatus();
                } else {
                  // 判断：纯「问题→答案」映射（值全为字符串）vs 旧版章节结构（值为对象）
                  var flat = true;
                  for (var k0 in incoming) {
                    if (
                      incoming[k0] &&
                      typeof incoming[k0] === "object"
                    ) {
                      flat = false;
                      break;
                    }
                  }
                  var added = 0;
                  if (flat) {
                    // 【v2.7.2】纯问答映射 → 存入「__导入题库__」章节，
                    // LoadRightAnwser 全库检索兜底，任何章节的考试都能命中
                    var cur = {};
                    try {
                      cur = JSON.parse(localStorage.getItem(keyAllAnswer) || "{}");
                    } catch (e) {}
                    var ch = cur["__导入题库__"] || {};
                    for (var q in incoming) {
                      if (
                        typeof incoming[q] === "string" &&
                        !(q in ch)
                      ) {
                        ch[q] = incoming[q];
                        added++;
                      }
                    }
                    if (added) {
                      cur["__导入题库__"] = ch;
                      localStorage.setItem(keyAllAnswer, JSON.stringify(cur));
                    }
                    alert(
                      "导入成功：新增 " +
                        added +
                        " 条问答（考试时自动全库匹配，不分章节）",
                    );
                  } else {
                    // 旧版章节结构
                    var curData = {};
                    try {
                      curData = JSON.parse(localStorage.getItem(keyAllAnswer) || "{}");
                    } catch (e) {}
                    var merged = {};
                    for (var chapter in incoming) {
                      if (typeof incoming[chapter] !== "object") continue;
                      merged[chapter] = {};
                      for (var q1 in curData[chapter] || {}) merged[chapter][q1] = curData[chapter][q1];
                      for (var qi in incoming[chapter]) {
                        if (!(qi in merged[chapter])) added++;
                        merged[chapter][qi] = incoming[chapter][qi];
                      }
                    }
                    for (var c2 in curData) {
                      if (!(c2 in merged)) merged[c2] = curData[c2];
                    }
                    localStorage.setItem(keyAllAnswer, JSON.stringify(merged));
                    alert("导入成功：新增 " + added + " 条答案（旧版章节格式）");
                  }
                }
              } catch (e) {
                alert("导入失败：" + e.message);
              }
              input.remove();
            };
            reader.readAsText(file);
          };
          document.body.appendChild(input);
          input.click();
        };
      }
    }

    // ====== 【修复 2026.8.24】本地播放完成检测：华医网改版后 getMaxPlayTime() 被移除、
    // 状态不再即时翻转为"已完成/待考试"，旧逻辑永远等不到学完信号。改为直接用播放器
    // 时间 API 判断"视频已播到结尾"，播完即切下一课。 ======
    var watchEndTimer = null;
    var watchEndLastMark = 0;
    function startWatchEnd() {
      if (watchEndTimer) {
        clearInterval(watchEndTimer);
        watchEndTimer = null;
      }
      watchEndTimer = setInterval(function () {
        try {
          if (courseFinished || Date.now() < navCooldownUntil) return;
          var v = document.querySelector("video");
          if (!v) return;
          var dur = v.duration;
          var cur = v.currentTime;
          // 兜底1：polyv j2s API
          if (window.player) {
            try {
              if (typeof window.player.j2s_getDuration === "function") {
                var d2 = window.player.j2s_getDuration();
                if (d2 && d2 > 0) dur = d2;
              }
              if (typeof window.player.j2s_getCurrentTime === "function") {
                var t2 = window.player.j2s_getCurrentTime();
                if (t2 && t2 > 0) cur = t2;
              }
            } catch (e) {}
          }
          // 兜底2：cc 播放器
          if (typeof cc_js_Player !== "undefined" && cc_js_Player) {
            try {
              if (typeof cc_js_Player.duration === "function") {
                var d3 = cc_js_Player.duration();
                if (d3 && d3 > 0) dur = d3;
              }
              if (typeof cc_js_Player.currentTime === "function") {
                var t3 = cc_js_Player.currentTime();
                if (t3 && t3 > 0) cur = t3;
              }
            } catch (e) {}
          }
          if (!dur || dur <= 0) return;
          if (cur >= dur - 3) {
            // 已到结尾：先标记，4秒后二次确认（防抖动），再强制切课
            if (!watchEndLastMark) {
              watchEndLastMark = Date.now();
              return;
            }
            // 【v2.5.2】4s→6s：给完成上报的响应留时间——被拒时「观看时长不足」弹窗
            // 会在数秒后出现，避免抢在弹窗前强制切课导致本课永远卡在"学习中"
            if (Date.now() - watchEndLastMark < 6000) return;
            watchEndLastMark = 0;
            var state = getCurrentCourseState();
            if (state === "已完成" || state === "待考试") {
              watchEndLastMark = 0;
              return;
            } // 华医网已翻状态，交给原逻辑
            console.log(
              "【子川助手·修复】视频播完但状态仍为[" +
                state +
                "]，强制切换下一课",
            );
            courseFinished = true;
            if (clock) {
              clearInterval(clock);
              clock = null;
            }
            if (clockms) {
              clearInterval(clockms);
              clockms = null;
            }
            if (watchEndTimer) {
              clearInterval(watchEndTimer);
              watchEndTimer = null;
            }
            // 【v2.5.1】若服务端已弹「观看时长不足」（完成被拒），不切课——
            // 点弹窗确定让页面刷新重看（重看默认 1x，补足真实观看时长后再正常完成）
            var $rejectTip = $(".layui-layer").filter(function () {
              return (this.textContent || "").indexOf("观看时长不足") !== -1;
            });
            if ($rejectTip.length) {
              console.log(
                "【子川助手】完成被服务端拒绝（观看时长不足），自动确认并从头 1x 重看",
              );
              try {
                sessionStorage.setItem("hyu_rewatch_1x", "1");
              } catch (e2) {}
              hyToast("⚠️ 完成被拒（时长不足），自动确认并从头 1x 重看");
              var $rejectOk = $rejectTip
                .find(".layui-layer-btn0, .layui-layer-btn a")
                .first();
              if ($rejectOk.length) $rejectOk.click();
              return;
            }
            // 【v2.7.2】模式2：状态未翻转但考试按钮已解锁 → 就地进本课考试，不切课
            if (localStorage.getItem("华医mode") == "2" && tryClickExamHere())
              return;
            playNext();
          } else {
            watchEndLastMark = 0;
          }
        } catch (e) {}
      }, 2000);
    }

    // ====== 【修复 2026.8.24】切课 URL 规范化：onclick 里的 course_ware.aspx 是详情页，
    // 直接改写为 course_ware_polyv.aspx（播放器页），避免一次服务端重定向，并补默认参数 ======
    function extractNavUrl(onclickAttr) {
      var m = (onclickAttr || "").match(/location\.href=['"]([^'"]+)['"]/);
      if (!m || !m[1]) return null;
      var u = m[1];
      if (
        /course_ware\.aspx/i.test(u) &&
        !/course_ware_(polyv|cc)\.aspx/i.test(u)
      ) {
        u = u.replace(/course_ware\.aspx/i, "course_ware_polyv.aspx");
        if (!/[\?&]ff=/.test(u))
          u += (u.indexOf("?") >= 0 ? "&" : "?") + "ff=0&ft=0&t=0";
      }
      return u;
    }

    // 获取侧边栏课程项的状态文本（待考试/学习中/未学习/已完成等）
    function getCourseStatus(li) {
      try {
        var btn = li.querySelector("button");
        return btn ? btn.innerText.trim() : "";
      } catch (e) {
        return "";
      }
    }

    // 判断侧边栏中是否还有未完成学习的课程（学习中或未学习）
    // 注意：视频页侧边栏可能没有状态按钮，此时保守处理——假设有剩余课程
    function hasRemainingCourses() {
      var lis = document.querySelectorAll("li.lis-inside-content");
      var foundLearning = false;
      var unknownCount = 0;
      var totalCount = lis.length;
      for (var i = 0; i < totalCount; i++) {
        var status = getCourseStatus(lis[i]);
        if (status === "学习中" || status === "未学习") {
          foundLearning = true;
        } else if (status === "" || status === "未知") {
          unknownCount++;
        }
      }
      if (foundLearning) return true;
      // 如果所有课程状态都读取不到（侧边栏无按钮），保守假设有剩余课程需要学习
      if (unknownCount === totalCount && totalCount > 0) {
        console.log("hasRemainingCourses: 无法读取课程状态，假设有剩余课程");
        return true;
      }
      return false;
    }

    // 获取当前正在播放的课程 li 元素（通过 current-playing class）
    function getCurrentCourseLi() {
      var cur = document.querySelector("li.lis-inside-content.current-playing");
      if (!cur) {
        // 回退：通过 top_play 图标定位
        var topPlay = document.querySelector("i[id='top_play']");
        if (topPlay) {
          var li = topPlay.closest("li.lis-inside-content");
          if (li) return li;
        }
      }
      return cur;
    }

    // 获取当前课程的状态文本（优先使用 current-playing class，回退 DOM 遍历）
    function getCurrentCourseState() {
      var li = getCurrentCourseLi();
      if (li) return getCourseStatus(li);
      // 最后的回退：旧的 DOM 遍历方式
      try {
        var topPlay = document.querySelectorAll("i[id='top_play']");
        if (topPlay.length) {
          return topPlay[0].parentNode.nextElementSibling.nextElementSibling
            .nextElementSibling.innerText;
        }
      } catch (e) {}
      return "";
    }

    // ════════ 【v2.9.0】学分定向学习 ════════
    // 用户规则：输入目标学分（如25）→ 优先「学习记录」中已开始未完成的课程 → 其余从
    // 课程目录选 3 学分课程 → 剩余 2 学分补一门 2 学分课、剩 1 补一门 1 学分课、
    // 补满（0）即停。计划存 localStorage 跨页面存活，hyuCreditTick 每5秒推进：
    // 不在当前课程页就导航过去；课程页侧边栏全部「已完成」即计入并切下一门；
    // 到达时就已完成的课程不计学分、自动换替补。
    var hyuCreditKey = "hyu_credit_plan";
    var hyuCreditPriorityKey = "hyu_credit_priority";
    function hyuCreditLoad() {
      try {
        return JSON.parse(localStorage.getItem(hyuCreditKey)) || null;
      } catch (e) {
        return null;
      }
    }
    function hyuCreditSave(p) {
      try {
        if (p) localStorage.setItem(hyuCreditKey, JSON.stringify(p));
        else localStorage.removeItem(hyuCreditKey);
      } catch (e) {}
    }
    function hyuCreditPriorityLoad() {
      try {
        return JSON.parse(localStorage.getItem(hyuCreditPriorityKey)) || [];
      } catch (e) {
        return [];
      }
    }
    // 从当前页面 DOM 收集课程候选：a[href*=course.aspx?cid=] + 容器内「X.X学分」文本
    // 【v2.9.4】附带解析「项目编号」（2026-XX-XX-XXX(国)），用于与学习记录行精确匹配
    function hyuCreditCandidates() {
      var out = [];
      var seen = {};
      var links = document.querySelectorAll('a[href*="course.aspx?cid="]');
      for (var i = 0; i < links.length; i++) {
        var href = links[i].getAttribute("href") || "";
        var m = href.match(/course\.aspx\?cid=([A-Za-z0-9-]+)/i);
        if (!m || seen[m[1].toLowerCase()]) continue;
        var credit = 0;
        var title = (links[i].innerText || "").trim();
        var code = null;
        var node = links[i];
        for (var up = 0; up < 6 && node; up++) {
          var txt = node.innerText || "";
          var cm = txt.match(/(\d+(?:\.\d+)?)\s*学分/);
          if (cm) {
            credit = parseFloat(cm[1]);
            var cd = txt.match(/(\d{4}-\d{2}-\d{2}-\d+)(?=[（(]|$|\s)/);
            if (cd) code = cd[1];
            if (!title) {
              var ln = txt.split("\n").filter(function (s) {
                return s.trim().length > 4;
              });
              title = (ln[0] || "").trim();
            }
            break;
          }
          node = node.parentElement;
        }
        if (credit > 0) {
          seen[m[1].toLowerCase()] = 1;
          out.push({ cid: m[1], credit: credit, title: (title || m[1]).slice(0, 40), code: code });
        }
      }
      return out;
    }
    // 按用户规则构建队列：3学分优先取整，余数精确补 2/1 学分。
    // 【v2.9.0 增强】余数课在当前目录找不到时，自动降 3 学分数量改用小学分课组合
    // 精确凑满（如 25 = 7×3 + 2×2）；实在凑不满才略超（保证 ≥ 目标，学分要求是下限）。
    // priorityCids（学习记录已开始的课）排最前，其学分先计入。
    function hyuCreditBuildQueue(target, candidates, priorityCids, excludeMap) {
      var ex = excludeMap || {};
      var queue = [];
      var used = {};
      var byCreditDesc = candidates.slice().sort(function (a, b) {
        return b.credit - a.credit;
      });
      function mark(c) {
        used[c.cid.toLowerCase()] = 1;
        queue.push(c);
      }
      // 小学分课（<3）中找子集恰好凑满 need（最多5门，池小递归安全）
      function subsetFill(smalls, need, maxN) {
        var res = [];
        function walk(i, left, acc) {
          if (Math.abs(left) < 0.01 && acc.length) {
            res = acc.slice();
            return true;
          }
          if (i >= smalls.length || acc.length >= maxN || left < -0.01)
            return false;
          acc.push(smalls[i]);
          if (walk(i + 1, Math.round((left - smalls[i].credit) * 10) / 10, acc))
            return true;
          acc.pop();
          return walk(i + 1, left, acc);
        }
        walk(0, need, []);
        return res;
      }
      // ① 学习记录优先候选：学分大的先计入，直到达到目标
      var pr = [];
      for (var pi = 0; pi < priorityCids.length; pi++) {
        var key = String(priorityCids[pi]).toLowerCase();
        for (var ci = 0; ci < candidates.length; ci++) {
          if (candidates[ci].cid.toLowerCase() === key && !used[key]) {
            pr.push(candidates[ci]);
            break;
          }
        }
      }
      pr.sort(function (a, b) {
        return b.credit - a.credit;
      });
      var sum = 0;
      for (var qi = 0; qi < pr.length && sum < target - 0.01; qi++) {
        mark(pr[qi]);
        sum += pr[qi].credit;
      }
      var remain = Math.round((target - sum) * 10) / 10;
      if (remain <= 0) return queue;
      // ② 候选池：3学分档 与 小学分档
      var threes = byCreditDesc.filter(function (c) {
        return (
          c.credit >= 3 && !used[c.cid.toLowerCase()] && !ex[c.cid.toLowerCase()]
        );
      });
      var smalls = byCreditDesc.filter(function (c) {
        return (
          c.credit < 3 && !used[c.cid.toLowerCase()] && !ex[c.cid.toLowerCase()]
        );
      });
      // ③ 精确组合：n3 从最多往下试，余数用小学分课子集凑满
      var best = null;
      var n3max = Math.min(threes.length, Math.floor(remain / 3));
      for (var n3 = n3max; n3 >= 0 && !best; n3--) {
        var left = Math.round((remain - n3 * 3) * 10) / 10;
        if (left < -0.01) continue;
        if (Math.abs(left) < 0.01) {
          best = { n3: n3, fill: [] };
        } else {
          var subset = subsetFill(smalls, left, 5);
          if (subset.length) best = { n3: n3, fill: subset };
        }
      }
      if (!best) {
        // 精确凑不满：3学分尽量多 + 小学分课选 ≥ 余数中最小的（略超保证达标）
        var n3use = n3max;
        var left2 = Math.round((remain - n3use * 3) * 10) / 10;
        var cand = null;
        if (left2 > 0) {
          var overs = smalls
            .filter(function (c) {
              return c.credit >= left2 - 0.01;
            })
            .sort(function (a, b) {
              return a.credit - b.credit;
            });
          cand = overs[0] || smalls[0] || null;
        }
        best = { n3: n3use, fill: cand ? [cand] : [] };
      }
      for (var ti = 0; ti < best.n3 && ti < threes.length; ti++) {
        mark(threes[ti]);
      }
      best.fill.forEach(mark);
      return queue;
    }
    function hyuCreditCreditsDone(p) {
      var s = 0;
      for (var i = 0; i < p.done.length; i++) s += p.done[i].credit;
      return Math.round(s * 10) / 10;
    }
    function hyuCreditStatusText(p) {
      if (!p || !p.active)
        return p && p.done.length
          ? "已停止（已完成 " + p.done.length + " 门 / " + hyuCreditCreditsDone(p) + " 学分）"
          : "未启动（在继教首页点「开始刷学分」）";
      var cur = p.queue[0];
      var tag = p.lrOnly ? "【顺序播放】" : "目标 " + p.target + " 学分：";
      return (
        tag + "已修 " + p.done.length + " 门/" +
        hyuCreditCreditsDone(p) + " 学分" +
        (cur ? "，当前：" + cur.title + "（" + cur.credit + "学分）" : "，队列空") +
        "，排队 " + p.queue.length + " 门"
      );
    }
    function hyuCreditRefreshStatus() {
      try {
        var el = document.getElementById("hyu-credit-status");
        if (el) el.textContent = hyuCreditStatusText(hyuCreditLoad());
      } catch (e) {}
    }
    // 控制器：每5秒推进计划
    // ════════ 【v2.9.4】学习记录页（/pages/study_info_list.aspx）接入 ════════
    // 页面表格列：项目名称 | 项目编号 | 学分类型(含 X.X学分) | 操作(继续学习)。
    // 用户规则：学分计划开启 → 按学习记录先学（表格顺序=用户选择顺序）→ 再选其他课 →
    // 学分修够；未开启 → 尊重手动选择，此页只提供「选课小窗」辅助跳转，不强制切课。
    function hyuCreditLRParse() {
      var rows = [];
      var trs = document.querySelectorAll("table tr");
      for (var i = 0; i < trs.length; i++) {
        var tds = trs[i].querySelectorAll("td");
        if (tds.length < 3) continue;
        var name = (tds[0].innerText || "").trim();
        var codeM = (tds[1].innerText || "").match(/(\d{4}-\d{2}-\d{2}-\d+)/);
        var cm = (tds[2].innerText || "").match(/(\d+(?:\.\d+)?)\s*学分/);
        if (!name || !cm) continue;
        var act = tds[tds.length - 1];
        var clickEl =
          act.querySelector("a, button, input[type=button]") || act;
        //【v2.10.1】cid 在继续学习元素的 onclick 属性里（正则必须转义 \? 和 \.）
        var cidSrc =
          (clickEl && clickEl.getAttribute("onclick")) ||
          act.innerHTML ||
          "";
        var cidM = cidSrc.match(/course\.aspx\?cid=([A-Za-z0-9-]+)/i);
        rows.push({
          name: name,
          code: codeM ? codeM[1] : null,
          credit: parseFloat(cm[1]),
          cid: cidM ? cidM[1] : null,
          clickEl: clickEl,
        });
      }
      return rows;
    }
    function hyuCreditLRLoad() {
      try {
        return JSON.parse(localStorage.getItem("hyu_credit_lr")) || [];
      } catch (e) {
        return [];
      }
    }
    function hyuCreditLRSave(rows) {
      try {
        localStorage.setItem(
          "hyu_credit_lr",
          JSON.stringify(
            rows.map(function (r) {
              return { name: r.name, credit: r.credit, code: r.code || null, cid: r.cid || null };
            }),
          ),
        );
      } catch (e) {}
    }
    // 学习记录课程 → 目录候选的优先 cid 列表（编号精确匹配，名称兜底；
    // 【v2.9.5】顺序按 hyu_lr_order 用户记忆排序）
    function hyuCreditLRPriorityCids(cands) {
      var lr = hyuCreditLRLoad().map(function (r) {
        return { name: r.name, credit: r.credit, code: r.code };
      });
      var ordered = hyuLrOrdered(lr);
      var out = [];
      ordered.forEach(function (r) {
        cands.forEach(function (c) {
          var hit =
            (r.code && c.code && c.code === r.code) ||
            (!r.code &&
              c.title &&
              (c.title.indexOf(r.name) !== -1 ||
                r.name.indexOf(c.title) !== -1));
          if (hit && out.indexOf(c.cid) === -1) out.push(c.cid);
        });
      });
      return out;
    }
    // 选课顺序窗（v2.9.5 重做）：继教首页/项目筛选 + 学习记录 两个画面进入即弹（居中），
    // 点「先学」把该课调到第一位，20 秒无操作按当前顺序自动开始；任何点击重置倒计时。
    // 选过顺序后记住（hyu_lr_order，按项目编号），下次不再弹；面板「课程顺序」可随时改。
    function hyuLROrderLoad() {
      try {
        return JSON.parse(localStorage.getItem("hyu_lr_order")) || [];
      } catch (e) {
        return [];
      }
    }
    function hyuLROrderSave(codes) {
      try {
        localStorage.setItem("hyu_lr_order", JSON.stringify(codes));
      } catch (e) {}
    }
    // 供 UI/计划的课程行：学习记录页实时解析，其他页用存储值
    function hyuLrRowsForUi() {
      if (/study_info_list/i.test(location.pathname)) {
        var rows = hyuCreditLRParse();
        if (rows.length) {
          hyuCreditLRSave(rows);
          return rows;
        }
      }
      return hyuCreditLRLoad().map(function (r) {
        return { name: r.name, credit: r.credit, code: r.code, cid: r.cid, clickEl: null };
      });
    }
    function hyuLrOrdered(rows) {
      var order = hyuLROrderLoad();
      if (!order.length) return rows;
      var out = [];
      order.forEach(function (code) {
        rows.forEach(function (r) {
          if (r.code === code && out.indexOf(r) === -1) out.push(r);
        });
      });
      rows.forEach(function (r) {
        if (out.indexOf(r) === -1) out.push(r);
      });
      return out;
    }
    function hyuLrProceed(rows, ordered) {
      hyuLROrderSave(
        ordered.map(function (r) {
          return r.code;
        }),
      );

      var w = document.getElementById("hyu-lr-order-win");
      if (w) w.remove();
      var first = ordered[0];
      if (!first) return;
      if (first.cid) {
        //【v2.9.9】同页导航（站点继续学习=window.open 会开新标签页）
        location.href = location.origin + '/pages/course.aspx?cid=' + first.cid;
      } else if (first.clickEl) {
        first.clickEl.click(); // 学习记录页：点该行「继续学习」（旧结构兜底）
      } else {
        // 目录页：按项目编号匹配目录候选拿 cid
        var cands = hyuCreditCandidates();
        var hit = null;
        cands.forEach(function (c) {
          if (!hit && first.code && c.code === first.code) hit = c;
        });
        if (hit) {
          location.href =
            location.origin + "/pages/course.aspx?cid=" + hit.cid;
        } else {
          location.href = location.origin + "/pages/cme.aspx"; // 我的继教目录里继续匹配
        }
      }
    }
    function hyuLrOrderWindow(rows, mode) {
      if (document.getElementById("hyu-lr-order-win")) return;
      try {
        if (window.__hyuLrDismissed === true) return; //【v2.10.3】暂不学习只抑制当前页面，下次进入仍弹
      } catch (e) {}
      if (!rows.length) return;
      var ordered = hyuLrOrdered(rows);
      var left = 20;
      var w = document.createElement("div");
      w.id = "hyu-lr-order-win";
      w.style.cssText =
        "position:fixed;left:50%;top:44%;transform:translate(-50%,-50%);z-index:2147483647;" +
        "background:#fff;border:2px solid #1565c0;border-radius:12px;padding:16px 20px;" +
        "font:13px/1.8 'Microsoft YaHei',sans-serif;box-shadow:0 8px 32px rgba(0,0,0,.3);width:480px;max-width:92vw;";
      function render() {
        var rowsHtml = "";
        ordered.forEach(function (r, i) {
          rowsHtml +=
            '<div style="display:flex;align-items:center;gap:8px;padding:4px 0;border-bottom:1px dashed #e0e0e0;">' +
            '<span style="color:#1565c0;font-weight:bold;width:18px;">' + (i + 1) + ".</span>" +
            '<span style="flex:1;color:#333;">' + r.name.slice(0, 30) + "（" + r.credit + "学分）</span>" +
            (i > 0
              ? '<span class="hyu-lr-first" data-i="' + i + '" style="background:#2e7d32;color:#fff;padding:1px 10px;border-radius:8px;cursor:pointer;white-space:nowrap;">先学</span>'
              : '<span style="color:#2e7d32;font-weight:bold;white-space:nowrap;">← 先学</span>') +
            "</div>";
        });
        w.innerHTML =
          '<div style="font-weight:bold;font-size:14px;color:#1565c0;margin-bottom:4px;">📚 选择先学哪门课</div>' +
          '<div style="color:#666;margin-bottom:8px;">点「先学」把该课调到第一位；<b id="hyu-lr-cd" style="color:#e65100;">' + left + "</b> 秒无操作将按当前顺序自动开始学习</div>" +
          rowsHtml +
          '<div style="margin-top:10px;display:flex;gap:10px;align-items:center;">' +
          '<span id="hyu-lr-go" style="background:#1976d2;color:#fff;padding:4px 14px;border-radius:8px;cursor:pointer;">按当前顺序开始 ▶</span>' +
          '<span id="hyu-lr-dismiss" style="color:#999;cursor:pointer;text-decoration:underline;">暂不学习</span>' +
          "</div>";
      }
      render();
      document.body.appendChild(w);
      var cdTimer = null;
      function startCd() {
        if (cdTimer) clearInterval(cdTimer);
        cdTimer = setInterval(function () {
          left--;
          var el = document.getElementById("hyu-lr-cd");
          if (el) el.textContent = left;
          if (left <= 0) {
            clearInterval(cdTimer);
            hyuLrProceed(rows, ordered); // 20 秒无操作：按当前顺序自动开始
          }
        }, 1000);
      }
      render();
      startCd();
      w.addEventListener("click", function (e) {
        var t = e.target;
        if (!t.classList) return;
        if (t.classList.contains("hyu-lr-first")) {
          var i = parseInt(t.getAttribute("data-i"), 10);
          var moved = ordered.splice(i, 1)[0];
          ordered.unshift(moved);
          left = 20; // 操作重置倒计时
          render();
          startCd();
        } else if (t.id === "hyu-lr-go") {
          if (cdTimer) clearInterval(cdTimer);
          hyuLrProceed(rows, ordered);
        } else if (t.id === "hyu-lr-dismiss") {
          if (cdTimer) clearInterval(cdTimer);
          window.__hyuLrDismissed = true; //【v2.10.3】仅抑制当前页面
          w.remove();
        }
      });
    }
    // 【v2.9.6】标题归一化（去空白，用于课程名匹配）
    function hyuCreditTitleNorm(s) {
      return String(s || "").replace(/\s+/g, "");
    }
    // 学习记录里还没修的课（按记住的顺序；已计学分的课跳过）
    function hyuCreditLRPending(p) {
      var doneT = p.done.map(function (d) {
        return hyuCreditTitleNorm(d.title);
      });
      return hyuLrOrdered(hyuCreditLRLoad()).filter(function (r) {
        var n = hyuCreditTitleNorm(r.name);
        return !doneT.some(function (t) {
          return t.indexOf(n) !== -1 || n.indexOf(t) !== -1;
        });
      });
    }
    // 统一调度下一步：达标结束 → LR 待修去学习记录页 → 队列头课程页 → 目录补
    function hyuCreditGotoNext(p) {
      var got = hyuCreditCreditsDone(p);
      if (p.lrOnly) {
        // 顺序播放模式：LR 全部修完 → 结束
        var pend = hyuCreditLRPending(p);
        if (pend.length) {
          p.navLock = Date.now() + 8000;
          hyuCreditSave(p);
          location.href = location.origin + "/pages/study_info_list.aspx";
          return;
        }
        p.active = false;
        p.lrPlayDone = true;
        hyuCreditSave(p);
        hyuCreditRefreshStatus();
        hyToast("🎉 顺序播放完成：学习记录课程已全部学完");
        return;
      }
      if (got >= p.target - 0.01) {
        p.active = false;
        p.current = null;
        hyuCreditSave(p);
        hyuCreditRefreshStatus();
        hyToast("🎉 学分目标达成：已修 " + p.done.length + " 门 / " + got + " 学分");
        console.log("【子川助手·学分】目标达成：" + got + "/" + p.target);
        return;
      }
      if (hyuCreditLRPending(p).length) {
        p.navLock = Date.now() + 8000;
        hyuCreditSave(p);
        location.href = location.origin + "/pages/study_info_list.aspx";
        return;
      }
      if (p.queue[0]) {
        p.navLock = Date.now() + 8000;
        hyuCreditSave(p);
        location.href =
          location.origin + "/pages/course.aspx?cid=" + p.queue[0].cid;
        return;
      }
      p.navLock = Date.now() + 8000;
      hyuCreditSave(p);
      location.href = location.origin + "/cme/index";
    }
    // 学习记录页：计划活跃且已选顺序 → 按记住的顺序自动点第一门「待修课」的「继续学习」
    // 【v2.10.4】多标签单飞锁：30 秒内只允许一个标签调度 LR（防多标签重复开课/并发播放）
    function hyuCreditLRAutoContinue(p, lrPending) {
      var lr = hyuCreditLRParse();
      if (!lr.length) return;
      var lastNav = 0;
      try {
        lastNav = parseInt(localStorage.getItem("hyu_lr_nav_ts") || "0", 10);
      } catch (e) {}
      if (lastNav && Date.now() - lastNav < 30000) {
        hyuCreditDbg("LRAutoContinue:另一标签 " + Math.round((Date.now() - lastNav) / 1000) + " 秒前已调度，本标签跳过");
        return;
      }
      try {
        localStorage.setItem("hyu_lr_nav_ts", String(Date.now()));
      } catch (e) {}
      var ordered = hyuLrOrdered(lr);
      for (var i = 0; i < ordered.length; i++) {
        var r = ordered[i];
        var isPending = lrPending.some(function (lp) {
          if (lp.code && r.code) return lp.code === r.code;
          var a = hyuCreditTitleNorm(r.name);
          var b = hyuCreditTitleNorm(lp.name);
          return a.indexOf(b) !== -1 || b.indexOf(a) !== -1;
        });
        if (isPending && (r.cid || r.clickEl)) {
          hyuCreditDbg("LRAutoContinue:命中 r.cid=" + (r.cid || "null").slice(0, 10));
          p.navLock = Date.now() + 10000;
          hyuCreditSave(p);
          console.log(
            "【子川助手·学分】学习记录优先：进入「" + r.name + "」",
          );
          //【v2.9.9】同页导航（站点的继续学习是 window.open 会开新标签页导致标签爆炸）
          if (r.cid) {
            location.href =
              location.origin + "/pages/course.aspx?cid=" + r.cid;
          } else {
            r.clickEl.click();
          }
          return;
        }
      }
    }

    // 【调试信标】仅本地 8964 模拟站可达时生效，生产环境静默失败
    function hyuCreditDbg(m) {
      try {
        fetch("http://127.0.0.1:8964/beacon?m=" + encodeURIComponent(String(m).slice(0, 150)));
      } catch (e) {}
    }
    // 【v2.9.2】课程详情页的课件列表在 iframe 内（2026.11 实测顶层文档 lis=0），
    // 所有课件状态读取必须跨同源 iframe 收集
    function hyuCreditLisAll() {
      var out = [];
      var docs = [document];
      try {
        var fs = document.querySelectorAll("iframe");
        for (var i = 0; i < fs.length; i++) {
          try {
            var d = fs[i].contentDocument;
            if (d) docs.push(d);
          } catch (e) {}
        }
      } catch (e) {}
      for (var j = 0; j < docs.length; j++) {
        try {
          var lis = docs[j].querySelectorAll("li.lis-inside-content");
          for (var k = 0; k < lis.length; k++) out.push(lis[k]);
        } catch (e) {}
      }
      return out;
    }
    // 【v2.9.3 实测重写】2026.11 课程详情页课件行结构 = div.course[data-href=course_ware?cwid]
    // + button 状态文本（无 <a> 链接，站点靠 goCourseWare(this) 读 data-href 导航）。
    // 旧版 li.lis-inside-content+a[href] 结构仅保留兜底。
    function hyuCreditAllDone() {
      var rows = document.querySelectorAll('[data-href*="course_ware"]');
      if (rows.length) {
        for (var i = 0; i < rows.length; i++) {
          var b = rows[i].querySelector("button");
          if ((b ? b.innerText.trim() : "") !== "已完成") return false;
        }
        return true;
      }
      var lis = hyuCreditLisAll();
      if (!lis.length) return false;
      for (var j = 0; j < lis.length; j++) {
        var b2 = lis[j].querySelector("button");
        if ((b2 ? b2.innerText.trim() : "") !== "已完成") return false;
      }
      return true;
    }
    // 找第一个未完成课件（待考试/学习中/未学习都算——待考试=要进考试才算完成），
    // 返回 cwid，顶层直接导航（course_ware.aspx 会 302 到 polyv）。
    // 【v2.10.3】课件行在 iframe 内（与课件列表同），需跨同源 iframe 收集
    function hyuCreditDeepRows() {
      var out = [];
      var roots = [document];
      try {
        var fs = document.querySelectorAll("iframe");
        for (var i = 0; i < fs.length; i++) {
          try {
            var d = fs[i].contentDocument;
            if (d) roots.push(d);
          } catch (e) {}
        }
      } catch (e) {}
      for (var j = 0; j < roots.length; j++) {
        try {
          var rr = roots[j].querySelectorAll('[data-href*="course_ware"]');
          for (var k = 0; k < rr.length; k++) out.push(rr[k]);
        } catch (e) {}
      }
      return out;
    }
    function hyuCreditFirstUnfinished() {
      var rows = hyuCreditDeepRows();
      for (var i = 0; i < rows.length; i++) {
        var b = rows[i].querySelector("button");
        var st = b ? b.innerText.trim() : "";
        var m = (rows[i].getAttribute("data-href") || "").match(
          /cwid=([A-Za-z0-9-]+)/i,
        );
        if (st !== "已完成" && m) {
          return { cwid: m[1], status: st };
        }
      }
      var lis = hyuCreditLisAll();
      for (var j = 0; j < lis.length; j++) {
        var b2 = lis[j].querySelector("button");
        var st2 = b2 ? b2.innerText.trim() : "";
        var a = lis[j].querySelector('a[href*="course_ware"]');
        if (!a) continue;
        var m2 = (a.getAttribute("href") || "").match(/cwid=([A-Za-z0-9-]+)/i);
        if ((st2 === "未学习" || st2 === "学习中") && m2) {
          return { cwid: m2[1], status: st2 };
        }
      }
      return null;
    }
    // 【v2.9.5】面板「课程顺序」列表渲染（↑ 把该课设为先学，即时保存）
    function hyuCreditRenderOrderList() {
      try {
        var el = document.getElementById("hyu-lr-order-list");
        if (!el) return;
        var ordered = hyuLrOrdered(hyuCreditLRLoad());
        if (!ordered.length) {
          el.innerHTML =
            '<span style="color:#999;">尚未识别到学习记录课程——先去「学习记录」页打开一次</span>';
          return;
        }
        var html = "";
        ordered.forEach(function (r, i) {
          html +=
            '<div style="display:flex;align-items:center;gap:4px;margin:2px 0;">' +
            '<span style="flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:#333;">' +
            (i + 1) + ". " + r.name.slice(0, 22) + "（" + r.credit + "学分）</span>" +
            (i === 0
              ? '<span style="color:#2e7d32;padding:0 6px;font-weight:bold;">先学</span>'
              : '<span style="color:#999;padding:0 6px;">第' + (i + 1) + '门</span>') +
            "</div>";
        });
        el.innerHTML = html;
      } catch (e) {}
    }
    function hyuCreditTick() {
      hyuCreditRefreshStatus();
      // 【v2.9.5】选课顺序窗：继教首页/项目筛选 + 学习记录 两个画面进入即弹
      //（未选过顺序时才弹，选过记住；「暂不学习」本会话不再弹），与是否开计划无关
      var onLrPage = /study_info_list/i.test(location.pathname);
      var onCatalogPage =
        /\/cme\/index/i.test(location.pathname) ||
        /pages\/cme\.aspx/i.test(location.pathname);
      if (
        (onLrPage || onCatalogPage) &&
        !document.getElementById("hyu-lr-order-win") &&
        hyuLROrderLoad().length === 0
      ) {
        var dismissed = false;
        dismissed = window.__hyuLrDismissed === true; //【v2.10.3】页面级
        if (!dismissed) {
          var rowsUi = hyuLrRowsForUi();
          if (rowsUi.length) hyuLrOrderWindow(rowsUi, onLrPage ? "lr" : "cat");
        }
      }
      // 选课窗显示中：暂停学分调度（把 20 秒留给用户选择）
      if (document.getElementById("hyu-lr-order-win")) return;
      var p = hyuCreditLoad();
      // 【v2.10.2】顺序播放模式：选过顺序且未停止时——无论计划是否开启，
      // 都按记住的顺序自动播放学习记录课程（学完为止，不补目录、不计学分目标）
      var lrStopFlag = false;
      try {
        lrStopFlag = localStorage.getItem("hyu_lr_play_stopped") === "1";
      } catch (e) {}
      var sessionDismiss = false;
      try {
        sessionDismiss = sessionStorage.getItem("hyu_lr_dismiss") === "1";
      } catch (e) {}
      var orderCodes = hyuLROrderLoad();
      if (
        (!p || !p.active) &&
        !(p && p.stopped) &&
        orderCodes.length &&
        !lrStopFlag &&
        !sessionDismiss
      ) {
        var lrRowsAll = hyuCreditLRLoad();
        var orderedAll = hyuLrOrdered(lrRowsAll);
        var doneT0 = p && p.done
          ? p.done.map(function (d) {
              return hyuCreditTitleNorm(d.title);
            })
          : [];
        var pending0 = orderedAll.filter(function (r) {
          var n = hyuCreditTitleNorm(r.name);
          return !doneT0.some(function (t) {
            return t.indexOf(n) !== -1 || n.indexOf(t) !== -1;
          });
        });
        if (pending0.length) {
          var lrTotal = 0;
          orderedAll.forEach(function (r) {
            lrTotal += r.credit;
          });
          lrTotal = Math.round(lrTotal * 10) / 10;
          p = {
            active: true,
            lrOnly: true,
            target: lrTotal,
            queue: [],
            done: p && p.done ? p.done : [],
            visited: p && p.visited ? p.visited : {},
            current: p && p.current ? p.current : null,
            startedAt: Date.now(),
          };
          console.log(
            "【子川助手·学分】顺序播放模式：学习记录课程 " +
              pending0.length +
              " 门待修",
          );
        }
      }
      if (!p || !p.active) return;
      if (Date.now() < (p.navLock || 0)) return;
      var path = location.pathname;
      var lrPending = hyuCreditLRPending(p); // 学习记录里还没修的课（按记住的顺序）
      var cur = p.current; // 当前学习中的课（进入课程详情页时采纳设置）
      var gotCred = hyuCreditCreditsDone(p);
      // ⓪【v2.10.4】polyv 并发违规自动关标签：本账号多标签同时播放会触发平台违规检测。
      // 检测到提示 → 本标签若是脚本打开的（window.open 产物）可自关；手动打开的请手动关。
      if (/course_ware_(polyv|cc)\.aspx/i.test(path)) {
        try {
          var bodyText = document.body.innerText || "";
          if (
            bodyText.indexOf("已有视频在播放") !== -1 ||
            bodyText.indexOf("同一视频") !== -1 ||
            bodyText.indexOf("请关闭已播放") !== -1
          ) {
            if (!window.__hyuCloseTried) {
              window.__hyuCloseTried = true;
              hyToast("⚠️ 检测到多标签并发播放，3 秒后自动关闭本标签");
              setTimeout(function () {
                window.close();
                setTimeout(function () {
                  hyToast("❗本标签无法自动关闭，请手动关闭此播放标签");
                }, 600);
              }, 3000);
            }
          }
        } catch (e) {}
      }
      // ① 播放页：不打扰；当前课全部课件已完成 → 计学分 → 调度下一步
      if (/course_ware_(polyv|cc)\.aspx/i.test(path)) {
        if (!cur) return; // 手动打开的播放页，不打扰
        var lisP = hyuCreditLisAll();
        if (!lisP.length) return; // 侧边栏未就绪
        if (!hyuCreditAllDone()) return; // 还在学，不打扰
        p.done.push({ cid: cur.cid, credit: cur.credit, title: cur.title });
        p.current = null;
        p.navLock = Date.now() + 8000;
        hyuCreditSave(p);
        hyToast(
          "📚 学分课完成：" + cur.title + "（" + cur.credit + "学分），累计 " +
            hyuCreditCreditsDone(p) + "/" + p.target,
        );
        hyuCreditGotoNext(p);
        return;
      }
      if (/exam(_result)?\.aspx/i.test(path)) return; // 考试中不打扰
      // ② 学习记录页：有待修课且无当前课 → 按顺序自动点第一门「继续学习」；学完回调度
      if (onLrPage) {
        if (lrPending.length && !p.current) {
          hyuCreditLRAutoContinue(p, lrPending);
          return;
        }
        if (p.current) {
          // 学到一半回到了学习记录页：回当前课程页继续
          p.navLock = Date.now() + 8000;
          hyuCreditSave(p);
          location.href =
            location.origin + "/pages/course.aspx?cid=" + p.current.cid;
          return;
        }
        hyuCreditGotoNext(p); // LR 修完/无 LR：目录补足或结束
        return;
      }
      // ③ 课程详情页：识别当前课 → 进第一个未完成课件；全部已完成 → 计学分调度下一步
      if (/course\.aspx/i.test(path)) {
        var cid = (location.href.match(/cid=([A-Za-z0-9-]+)/i) || [])[1];
        var pageTitle = "";
        try {
          var tEl = document.querySelector("h3 strong");
          pageTitle = tEl ? (tEl.innerText || "").trim() : "";
        } catch (e) {}
        var pn = hyuCreditTitleNorm(pageTitle);
        var isCur = cur && cid && cid.toLowerCase() === cur.cid.toLowerCase();
        if (!isCur && pn) {
          // 【v2.10.2 修正】采纳规则收紧：只采纳「学习记录待修课」或「LR 修完后的队列课」；
          // 与计划无关的课（如随手点开的目录课）不再抢当当前课——按计划目标导航离开。
          // （此前任何课都会被采纳 → 出现"跳到学习记录里没有的课"）
          var credit = null;
          var lrHitP = lrPending.filter(function (r) {
            var n = hyuCreditTitleNorm(r.name);
            return n.indexOf(pn) !== -1 || pn.indexOf(n) !== -1;
          })[0];
          var qIdx = -1;
          if (!lrHitP && lrPending.length === 0) {
            p.queue.forEach(function (q, qi) {
              var qn = hyuCreditTitleNorm(q.title);
              if (
                qIdx === -1 &&
                qn &&
                (qn.indexOf(pn) !== -1 || pn.indexOf(qn) !== -1)
              ) {
                qIdx = qi;
              }
            });
          }
          if (lrHitP) {
            credit = lrHitP.credit;
          } else if (qIdx >= 0) {
            credit = p.queue[qIdx].credit;
          } else if (lrPending.length === 0) {
            var lrAllHit = hyuCreditLROrdered().filter(function (r) {
              var n = hyuCreditTitleNorm(r.name);
              return n.indexOf(pn) !== -1 || pn.indexOf(n) !== -1;
            })[0];
            if (lrAllHit) credit = lrAllHit.credit;
          }
          if (credit !== null) {
            // 计划内课程：采纳为当前课
            p.current = { cid: cid, credit: credit, title: pageTitle };
            p.visited = p.visited || {};
            p.visited[cid.toLowerCase()] = 1;
            if (qIdx >= 0) p.queue.splice(qIdx, 1);
            p.navLock = Date.now() + 10000;
            hyuCreditSave(p);
            hyToast(
              "✓ 学分计划当前课程：" + pageTitle.slice(0, 24) + "（按" +
                credit + "学分计）",
            );
          } else {
            // 非计划课程：回计划目标（LR 待修优先）
            p.navLock = Date.now() + 8000;
            hyuCreditSave(p);
            console.log(
              "【子川助手·学分】" +
                pageTitle.slice(0, 20) +
                " 不在计划内，返回计划课程",
            );
            if (lrPending.length) {
              location.href =
                location.origin + "/pages/study_info_list.aspx";
            } else if (p.queue[0]) {
              location.href =
                location.origin +
                "/pages/course.aspx?cid=" +
                p.queue[0].cid;
            } else {
              location.href = location.origin + "/cme/index";
            }
            return;
          }
        }
        if (!p.current) {
          // 识别失败（页面结构异常）：回当前课/队首/LR 页/目录
          p.navLock = Date.now() + 8000;
          hyuCreditSave(p);
          if (cur) {
            location.href =
              location.origin + "/pages/course.aspx?cid=" + cur.cid;
          } else if (lrPending.length) {
            location.href = location.origin + "/pages/study_info_list.aspx";
          } else if (p.queue[0]) {
            location.href =
              location.origin + "/pages/course.aspx?cid=" + p.queue[0].cid;
          } else {
            location.href = location.origin + "/cme/index";
          }
          return;
        }
        if (hyuCreditAllDone()) {
          // 本课全部课件已完成 → 计学分 → 调度下一步
          p.done.push({
            cid: p.current.cid,
            credit: p.current.credit,
            title: p.current.title,
          });
          hyToast(
            "📚 学分课完成：" + p.current.title + "（" + p.current.credit +
              "学分），累计 " + hyuCreditCreditsDone(p) + "/" + p.target,
          );
          p.current = null;
          p.navLock = Date.now() + 8000;
          hyuCreditSave(p);
          hyuCreditGotoNext(p);
          return;
        }
        // 还有未完成课件：顶层直接进入第一个未完成课件的播放页（站内 302 到 polyv）
        var fu = hyuCreditFirstUnfinished();
        if (fu) {
          p.navLock = Date.now() + 10000;
          hyuCreditSave(p);
          console.log(
            "【子川助手·学分】进入课件（" + fu.status + "）：cwid=" + fu.cwid,
          );
          location.href =
            location.origin + "/course_ware/course_ware.aspx?cwid=" + fu.cwid;
          return;
        }
        return; // 课件条目还没有可进入的链接，等下一轮
      }
      // ④ 目录页：补足队列（LR 课程由 LR 阶段负责，目录只做补足且排除 LR 课程）
      if (onCatalogPage) {
        if (p.lrOnly) {
          // 顺序播放模式：不补目录，回学习记录页继续
          p.navLock = Date.now() + 8000;
          hyuCreditSave(p);
          location.href = location.origin + "/pages/study_info_list.aspx";
          return;
        }
        var need = Math.round((p.target - gotCred) * 10) / 10;
        var ex = {};
        p.done.forEach(function (d) {
          ex[d.cid.toLowerCase()] = 1;
        });
        Object.keys(p.visited || {}).forEach(function (k) {
          ex[k] = 1;
        });
        if (p.current) ex[p.current.cid.toLowerCase()] = 1;
        // 排除学习记录课程（编号/名称匹配的目录候选）——它们由 LR 阶段调度
        var lrNames = hyuLrOrdered(hyuCreditLRLoad()).map(function (r) {
          return hyuCreditTitleNorm(r.name);
        });
        var cands = hyuCreditCandidates().filter(function (c) {
          var cn = hyuCreditTitleNorm(c.title);
          return !lrNames.some(function (ln) {
            return ln.indexOf(cn) !== -1 || cn.indexOf(ln) !== -1;
          });
        });
        if (need > 0 && !p.queue.length) {
          p.queue = hyuCreditBuildQueue(need, cands, [], ex);
          hyuCreditSave(p);
        }
        if (p.queue[0]) {
          p.navLock = Date.now() + 8000;
          hyuCreditSave(p);
          location.href =
            location.origin + "/pages/course.aspx?cid=" + p.queue[0].cid;
          return;
        }
        if (need > 0) {
          hyToast("⚠️ 目录里暂时找不到更多可学课程，10 分钟后重试");
          p.navLock = Date.now() + 600000;
          hyuCreditSave(p);
          return;
        }
        p.active = false;
        hyuCreditSave(p);
        hyuCreditRefreshStatus();
        hyToast("🎉 学分目标达成：已修 " + p.done.length + " 门 / " + gotCred + " 学分");
        return;
      }
      // ⑤ 其他页面：回当前课程页 / LR 页 / 队首 / 目录
      p.navLock = Date.now() + 8000;
      hyuCreditSave(p);
      if (p.current) {
        console.log("【子川助手·学分】从 " + path + " 回到当前课程：" + p.current.title);
        location.href =
          location.origin + "/pages/course.aspx?cid=" + p.current.cid;
      } else if (lrPending.length) {
        location.href = location.origin + "/pages/study_info_list.aspx";
      } else if (p.queue[0]) {
        location.href =
          location.origin + "/pages/course.aspx?cid=" + p.queue[0].cid;
      } else {
        location.href = location.origin + "/cme/index";
      }
    }
    setInterval(hyuCreditTick, 5000);
    hyuCreditRefreshStatus();

    // 【v2.4.0】全部刷完系统通知（Web Notification；浏览器未授权时静默降级为控制台日志，
    // 授权请求由浏览器在首次触发时弹出，被拒后不再打扰）
    var __allDoneNotified = false;
    function notifyAllDone(where) {
      if (__allDoneNotified) return;
      __allDoneNotified = true;
      console.log("【子川助手】全部课程已完成（" + where + "）");
      try {
        if (!("Notification" in window)) return;
        var show = function () {
          try {
            var n = new Notification("子川助手：全部课程已刷完 🎉", {
              body: "已无未学习/学习中课程（" + where + "），可以休息啦～",
            });
            setTimeout(function () {
              try {
                n.close();
              } catch (e) {}
            }, 10000);
          } catch (e) {}
        };
        if (Notification.permission === "granted") show();
        else if (Notification.permission !== "denied") {
          Notification.requestPermission()
            .then(function (p) {
              if (p === "granted") show();
            })
            .catch(function () {});
        }
      } catch (e) {}
    }

    var playNextRunning = false; // 防止并发调用
    // 【v2.8.2 实测修正】考试按钮解锁信号：2026.11 线上 DOM 中 #jrks 的 href
    // 恒为 "#"（点不点得动与 href 无关），真实解锁 = disabled 属性被站点移除
    //（锁定: disabled="disabled" + class inputstyle2_2；解锁: 无 disabled + inputstyle2）。
    // 旧逻辑判 href≠"#" 在真实站点上永远不成立 → 模式2永远进不了考试。
    function hyExamBtnUnlocked() {
      try {
        var jrks = document.querySelector("#jrks");
        if (!jrks) return false;
        // 属性完全移除 = 解锁（实测锁定态为 disabled="disabled"；"" 视为仍锁定，宁可不点）
        return jrks.getAttribute("disabled") === null;
      } catch (e) {
        return false;
      }
    }
    // 【v2.6.1→v2.8.2】模式2逐课考试：本课视频播完、考试按钮已解锁（disabled 已移除）时
    // 立即点击进入本课考试（用户要求"播完就考"，不再等全部刷完统一考）。
    // 按钮未解锁（考试任务接口未返回）返回 false，调用方继续原有切课逻辑，
    // 本课保持待考试状态，后续 clock 检测到解锁会补进考试。
    function tryClickExamHere() {
      try {
        var jrks = document.querySelector("#jrks");
        if (jrks && hyExamBtnUnlocked()) {
          console.log("【子川助手】模式2：本课视频已播完，立即进入本课考试");
          courseFinished = true;
          if (clock) {
            clearInterval(clock);
            clock = null;
          }
          if (clockms) {
            clearInterval(clockms);
            clockms = null;
          }
          if (watchEndTimer) {
            clearInterval(watchEndTimer);
            watchEndTimer = null;
          }
          navCooldownUntil = Date.now() + 8000;
          hyToast("📝 本课视频播完，进入考试");
          clickexam();
          return true;
        }
      } catch (e) {}
      return false;
    }
    async function playNext() {
      if (playNextRunning) {
        console.log("playNext 已在执行中，跳过");
        return;
      }
      playNextRunning = true;

      // 跳转前：停掉两个检测定时器，设置冷却期，防止页面切换期间误判
      if (clock) {
        clearInterval(clock);
        clock = null;
      }
      if (clockms) {
        clearInterval(clockms);
        clockms = null;
      }
      navCooldownUntil = Date.now() + 5000; // 5秒冷却（已验证安全间隔）

      try {
        //自动播放下一个视频的逻辑
        var currentLi = getCurrentCourseLi();
        if (!currentLi) {
          console.log("未找到当前播放课程，尝试按钮方式跳转");
          fallbackToNextCourse();
          return;
        }
        const lis = document.querySelectorAll("li.lis-inside-content");
        var index = Array.from(lis).findIndex(function (li) {
          return li === currentLi;
        }); //找出当前页面是第几个课程
        console.log("当前视频索引: " + index + ", 总课程数: " + lis.length);
        // 修复：index 为 -1 时说明找不到当前元素，应走 fallback
        if (index >= 0 && index + 1 < lis.length) {
          // 模式2（视频+考试）：从当前位置向后扫描，跳过"待考试"/"已完成"课程
          // 优先完成所有学习任务，最后统一考试
          var isMode2 = localStorage.getItem("华医mode") == "2";
          var nextIdx = -1;
          for (var k = index + 1; k < lis.length; k++) {
            var st = getCourseStatus(lis[k]);
            if (isMode2 && (st === "待考试" || st === "已完成")) {
              console.log(
                "mode=2: 跳过第" + (k + 1) + "个课程（状态:" + st + "）",
              );
              continue;
            }
            nextIdx = k;
            break;
          }
          if (nextIdx >= 0) {
            index = nextIdx;
            console.log("跳转到第 " + (index + 1) + " 个课程");
            // 优先使用 li 元素的 onclick 跳转（提取 href 直接跳转更可靠）
            var targetLi = lis[index];
            var navigated = false;
            // 方式1: 从 onclick 属性提取 url 直接跳转（【修复 2026.8.24】规范化到 polyv 播放器页）
            var onclickAttr = targetLi.getAttribute("onclick") || "";
            var navUrl = extractNavUrl(onclickAttr);
            if (navUrl) {
              console.log("通过 onclick 提取 URL 跳转: " + navUrl);
              window.location.href = navUrl;
              navigated = true;
            }
            if (!navigated) {
              // 方式2: 尝试点击 h2（兼容旧版）
              var h2 = targetLi.querySelector("h2");
              if (h2) {
                console.log("通过点击 h2 跳转");
                h2.click();
                navigated = true;
              }
            }
            if (!navigated) {
              // 方式3: 直接点击 li
              console.log("通过点击 li 跳转");
              targetLi.click();
            }
            setTimeout(function () {
              try {
                document
                  .evaluate(
                    "//button[contains(., '知道了')]",
                    document,
                    null,
                    XPathResult.ANY_TYPE,
                  )
                  .iterateNext()
                  .click();
              } catch (err) {
                console.log("未找到弹窗");
              }
            }, 2000);
          } else {
            // 【v2.6.1】模式2无可学课程：优先当前页直接进考试
            if (isMode2 && tryClickExamHere()) return;
            console.log("侧边栏剩余课程均为待考试/已完成，尝试进入考试");
            fallbackToNextCourse();
          }
        } else {
          if (
            localStorage.getItem("华医mode") == "2" &&
            tryClickExamHere()
          )
            return;
          console.log(
            "侧边栏已无更多视频（index=" + index + "），尝试跳转到下一课程",
          );
          fallbackToNextCourse();
        }
      } finally {
        // 等待页面完成跳转，然后重新启动检测
        await new Promise((resolve) => setTimeout(resolve, 5000));
        courseFinished = false;
        playNextRunning = false;
        // 注意：clock 在 seeVideo 初始化中通过 onload 重新设置
        // clockms 在 killsendQuestion3 中重新创建（由 seeVideo 调用）
      }
    } // 从 playNext 中抽出的 fallback 逻辑：查找并点击学习中/未学习/待考试的课程
    function fallbackToNextCourse() {
      // 严格按优先级查找，排除"已完成"
      var allBtns = document.querySelectorAll('button, input[type="button"]');
      var found = false;
      var mode = localStorage.getItem("华医mode");

      // 第1优先级：学习中（按进度百分比降序，优先完成度高的）
      var learningBtns = [];
      for (var b2 = 0; b2 < allBtns.length; b2++) {
        var val2 = allBtns[b2].value || allBtns[b2].textContent || "";
        if (val2.trim() === "学习中") {
          var progress = 0;
          var container = allBtns[b2].parentElement;
          if (container) {
            var containerText = container.textContent || "";
            var pctMatch = containerText.match(/(\d+)\s*%/);
            if (pctMatch) {
              progress = parseInt(pctMatch[1]);
            }
          }
          learningBtns.push({ el: allBtns[b2], progress: progress });
        }
      }
      learningBtns.sort(function (a, b) {
        return b.progress - a.progress;
      });
      for (var m = 0; m < learningBtns.length; m++) {
        var item = learningBtns[m];
        console.log(
          "找到【学习中】课程（进度" + item.progress + "%），开始学习",
        );
        var sib2 = item.el.parentElement.querySelector("a[href]");
        if (!sib2)
          sib2 =
            item.el.previousElementSibling || item.el.nextElementSibling;
        if (sib2 && sib2.tagName === "A") {
          sib2.click();
        } else {
          item.el.click();
        }
        found = true;
        break;
      }

      // 第2优先级：未学习
      if (!found) {
        for (var b = 0; b < allBtns.length; b++) {
          var val = allBtns[b].value || allBtns[b].textContent || "";
          if (val.trim() === "未学习") {
            console.log("找到【未学习】课程，开始学习");
            var sib = allBtns[b].parentElement.querySelector("a[href]");
            if (!sib)
              sib =
                allBtns[b].previousElementSibling ||
                allBtns[b].nextElementSibling;
            if (sib && sib.tagName === "A") {
              sib.click();
            } else {
              allBtns[b].click();
            }
            found = true;
            break;
          }
        }
      }

      // 第3优先级：待考试（mode2）
      if (!found && mode == "2") {
        for (var b3 = 0; b3 < allBtns.length; b3++) {
          var val3 = allBtns[b3].value || allBtns[b3].textContent || "";
          if (val3.trim() === "待考试") {
            console.log("找到【待考试】课程，开始学习");
            var sib3 = allBtns[b3].parentElement.querySelector("a[href]");
            if (!sib3)
              sib3 =
                allBtns[b3].previousElementSibling ||
                allBtns[b3].nextElementSibling;
            if (sib3 && sib3.tagName === "A") {
              sib3.click();
            } else {
              allBtns[b3].click();
            }
            found = true;
            break;
          }
        }
      }

      if (!found) {
        console.log("没有找到任何待处理按钮，可能全部已完成");
        notifyAllDone("无待处理课程"); // 【v2.4.0】系统通知
        if (clock) {
          clearInterval(clock);
          clock = null;
        }
        if (clockms) {
          clearInterval(clockms);
          clockms = null;
        }
      }
    }

    // 课程列表页：自动扫描并进入待学习课程
    function autoEnterCourse() {
      // 【v2.9.1 修正】学分计划激活时只在「目录页」（cme.aspx 等）让位给 hyuCreditTick；
      // 课程详情页（course.aspx）必须照常执行——它负责点进第一个课件，禁掉就会卡在详情页
      var __cp = hyuCreditLoad();
      if (
        __cp &&
        __cp.active &&
        location.pathname.toLowerCase().indexOf("course.aspx") === -1
      ) {
        console.log("【子川助手·学分】目录页让位给学分计划调度");
        return;
      }
      console.log("【子川助手】自动扫描课程列表中...");

      // 辅助函数：查找与状态元素关联的课程链接
      function findAssociatedLink(el) {
        // 策略1：检查元素自身是否是链接
        if (el.tagName === "A" && el.href) return el;

        // 策略2：在兄弟元素中查找链接（匹配 playNext 中的模式）
        var siblings = el.parentElement ? el.parentElement.children : [];
        for (var i = 0; i < siblings.length; i++) {
          if (siblings[i] !== el) {
            if (siblings[i].tagName === "A" && siblings[i].href)
              return siblings[i];
            var childLink = siblings[i].querySelector
              ? siblings[i].querySelector("a[href]")
              : null;
            if (childLink) return childLink;
          }
        }

        // 策略3：向上查找最近的行/卡片，然后找其中的第一个链接
        var row = el.closest
          ? el.closest(
              'tr, .course-item, .list-item, li, .card, [class*="course"], [class*="item"]',
            )
          : null;
        if (row) {
          var rowLink = row.querySelector("a[href]");
          if (rowLink) return rowLink;
        }

        // 策略4：在父元素中查找链接
        if (el.parentElement) {
          var parentLink = el.parentElement.querySelector("a[href]");
          if (parentLink) return parentLink;
          // 再上一级
          if (el.parentElement.parentElement) {
            var grandLink =
              el.parentElement.parentElement.querySelector("a[href]");
            if (grandLink) return grandLink;
          }
        }

        // 策略5：jQuery 兄弟查找（匹配 playNext 模式：直接点击兄弟元素）
        try {
          var $el = $(el);
          // 优先找 <a> 兄弟
          var $sib = $el.siblings("a").eq(0);
          if ($sib.length) return $sib[0];
          // 任意兄弟（playNext 就是直接 click 兄弟）
          $sib = $el.siblings().eq(0);
          if ($sib.length) {
            // 兄弟本身就是可点元素
            if ($sib.is('a, button, input[type="button"]')) return $sib[0];
            // 兄弟内部有链接
            var $child = $sib.find("a").eq(0);
            if ($child.length) return $child[0];
            // 兄弟自身也可返回（可能有 onclick 处理）
            return $sib[0];
          }
          // 也尝试查找父元素的兄弟
          var $parentSib = $el.parent().siblings().eq(0);
          if ($parentSib.length) {
            var $link = $parentSib.is("a")
              ? $parentSib
              : $parentSib.find("a").eq(0);
            if ($link.length) return $link[0];
            return $parentSib[0];
          }
        } catch (e) {}

        return null;
      }

      // 辅助函数：执行点击
      function tryClickCourse(statusEl, description) {
        var link = findAssociatedLink(statusEl);
        if (link) {
          console.log(
            "✅ 【子川助手】" +
              description +
              "，开始学习：" +
              (link.textContent || link.innerText || "").trim(),
          );
          link.click();
          return true;
        }
        return false;
      }

      var clicked = false;
      var allElements = document.querySelectorAll(
        'button, input[type="button"], span, div, a.btn, td, font',
      );

      // ========== 第1优先级：查找"学习中"的课程（按进度百分比降序，优先完成度高的） ==========
      console.log("  → 查找【学习中】课程（按进度排序）...");
      var learningCourses = [];
      for (var k = 0; k < allElements.length; k++) {
        var el2 = allElements[k];
        var text2 = (el2.textContent || el2.value || "").trim();
        if (text2 === "学习中" && text2.indexOf("已完成") === -1) {
          // 向上查找父级容器，提取百分比数字
          var progress = 0;
          var container = el2.closest
            ? el2.closest(
                "tr, .course-item, .list-item, li, .card, [class*='course'], [class*='item'], td, div",
              )
            : el2.parentElement;
          if (container) {
            var containerText = container.textContent || "";
            var pctMatch = containerText.match(/(\d+)\s*%/);
            if (pctMatch) {
              progress = parseInt(pctMatch[1]);
            }
          }
          learningCourses.push({ el: el2, progress: progress });
        }
      }
      // 按进度降序排列，优先完成度高的课程
      learningCourses.sort(function (a, b) {
        return b.progress - a.progress;
      });
      for (var m = 0; m < learningCourses.length; m++) {
        var item = learningCourses[m];
        if (
          tryClickCourse(
            item.el,
            "找到【学习中】课程（进度" + item.progress + "%）",
          )
        ) {
          clicked = true;
          break;
        }
      }

      // ========== 第2优先级：查找"播放至：x%"的课程（x < 100） ==========
      if (!clicked) {
        console.log("  → 查找【播放至：x%】未完成课程...");
        var allElems = document.querySelectorAll("*");
        for (var j = 0; j < allElems.length; j++) {
          var elem = allElems[j];
          // 只在叶子节点且不包含"已完成"的节点查找
          if (
            elem.children.length === 0 &&
            (elem.textContent || "").indexOf("已完成") === -1
          ) {
            var txt = elem.textContent || "";
            var match = txt.match(/播放至[：:]\s*(\d+)\s*%/);
            if (match) {
              var progress = parseInt(match[1]);
              if (progress < 100) {
                if (
                  tryClickCourse(
                    elem,
                    "找到未完成课程（播放至" + progress + "%）",
                  )
                ) {
                  clicked = true;
                  break;
                }
              }
            }
          }
        }
      }

      // ========== 第3优先级：查找"未学习"的课程 ==========
      if (!clicked) {
        console.log("  → 查找【未学习】课程...");
        for (var i = 0; i < allElements.length; i++) {
          var el = allElements[i];
          var text = (el.textContent || el.value || el.innerText || "").trim();
          // 精确匹配，并且排除"已完成"
          if (
            (text === "未学习" || text.indexOf("未学习") === 0) &&
            text.indexOf("已完成") === -1
          ) {
            if (tryClickCourse(el, "找到【未学习】课程")) {
              clicked = true;
              break;
            }
          }
        }
      }

      // ========== 第4优先级：查找"待考试"的课程 ==========
      if (!clicked) {
        console.log("  → 查找【待考试】课程...");
        for (var l = 0; l < allElements.length; l++) {
          var el3 = allElements[l];
          var text3 = (el3.textContent || el3.value || "").trim();
          if (text3 === "待考试" && text3.indexOf("已完成") === -1) {
            if (tryClickCourse(el3, "找到【待考试】课程")) {
              clicked = true;
              break;
            }
          }
        }
      }

      // ========== 第5优先级：宽松查找——找含有课程链接的可点击区域 ==========
      if (!clicked) {
        console.log("  → 宽松模式：遍历查找可用的课程链接...");
        // 尝试在"课程学习与考试"区域内查找
        var sections = document.querySelectorAll("*");
        var targetSection = null;
        for (var m = 0; m < sections.length; m++) {
          if (
            sections[m].children.length > 0 &&
            (sections[m].textContent || "").indexOf("课程学习与考试") !== -1 &&
            sections[m].children.length <= 15
          ) {
            targetSection = sections[m];
            break;
          }
        }

        var searchScope = targetSection || document.body;
        var statusBtns = searchScope.querySelectorAll(
          'button, input[type="button"]',
        );
        for (var n = 0; n < statusBtns.length; n++) {
          var btnText = (
            statusBtns[n].textContent ||
            statusBtns[n].value ||
            ""
          ).trim();
          // 排除"已完成"
          // 严格排除"已完成"（部分按钮可能包含"已完成"子串）
          if (
            btnText &&
            btnText !== "已完成" &&
            btnText.indexOf("已完成") === -1 &&
            btnText.indexOf("完成") === -1
          ) {
            if (
              tryClickCourse(
                statusBtns[n],
                "宽松匹配到课程（状态：" + btnText + "）",
              )
            ) {
              clicked = true;
              break;
            }
          }
        }

        // 如果还没找到，直接找"课程学习与考试"区域内的第一个链接
        if (!clicked && targetSection) {
          var firstLink = targetSection.querySelector("a[href]");
          if (
            firstLink &&
            firstLink.href &&
            firstLink.href.indexOf("javascript:") === -1
          ) {
            console.log(
              "✅ 【子川助手】在课程学习与考试区域找到课程链接，尝试进入",
            );
            firstLink.click();
            clicked = true;
          }
        }
      }

      if (!clicked) {
        console.log(
          "📋 【子川助手】未找到需要学习的课程。可能全部已完成，或页面结构已变更。",
        );
        console.log(
          "   提示：如页面有未学习课程但脚本未识别，请在Greasyfork反馈区留言。",
        );
        notifyAllDone("课程列表无未完成课程"); // 【v2.4.0】系统通知
      }
    }

    // ════════ 【v2.2.1】课堂问答自动试错答题 ════════
    // 华医网视频页的自有"课堂问答"组件（标题"课堂问答" + 单选选项 + 提交按钮），
    // 不走 Polyv 的 sendQuestion 通道，旧逻辑（asynckillsendQuestion/.pv-ask-skip）拦截不到。
    // 已实测：该组件允许重复提交 → 用试错算法依次点击选项→提交→弹窗消失即答对。
    // 答案按题目记忆到 localStorage（JJ_QA_Answer），下次遇到直接命中，不再试错。
    var qaTimer = null;
    var qaState = { widget: null, triedIndex: -1, lastSubmitAt: 0 };
    var qaKey = "JJ_QA_Answer";
    var qaTextKey = "JJ_QA_AnswerText"; // 【v2.8.1】课堂问答答案文字（题干→选项文本，供导出/人工阅读）
    var qaLogKey = "JJ_QA_Log"; // 答题记录（最近 20 条，页面/agent 可读）

    // 记录课堂问答动作（localStorage，纯油猴挂机场景可回查；时间=北京时间）
    function qaLog(msg) {
      try {
        var arr = JSON.parse(localStorage.getItem(qaLogKey)) || [];
        arr.push(new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(11, 19) + " " + msg);
        if (arr.length > 20) arr = arr.slice(-20);
        localStorage.setItem(qaLogKey, JSON.stringify(arr));
      } catch (e) {}
    }

    // 查找"课堂问答"弹窗：找可见的"提交"按钮，向上找含"课堂问答"文本的容器
    function qaFindWidget() {
      var btns = document.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) {
        var b = btns[i];
        if (!b.offsetParent) continue;
        var bt = (b.textContent || "").trim();
        if (bt.indexOf("提交") === -1) continue;
        var p = b.parentElement;
        for (var d = 0; d < 6 && p; d++) {
          if ((p.textContent || "").indexOf("课堂问答") !== -1) return p;
          p = p.parentElement;
        }
      }
      return null;
    }

    // 提取题目（用于答案记忆 key）
    function qaExtractQuestion(w) {
      var t = (w.textContent || "").replace(/\s+/g, " ").trim();
      var idx = t.indexOf("课堂问答");
      var q = idx >= 0 ? t.slice(idx + 4) : t;
      return q.slice(0, 60);
    }

    // 提取选项元素（华医网真实弹窗的 A/B 是自定义 div/span 模拟单选，不是真 input）
    function qaExtractOptions(w) {
      var opts = [];
      // 1) 优先: label / 含 option/answer/choice/radio class 的元素
      var nodes = w.querySelectorAll('label, [class*="option"], [class*="answer"], [class*="choice"], [class*="radio"]');
      // 2) 兜底: 弹窗内所有 div/span/li/p，筛 textContent 符合"选项"模式的
      if (nodes.length === 0) {
        nodes = w.querySelectorAll('div, span, li, p');
      }
      for (var i = 0; i < nodes.length; i++) {
        var o = nodes[i];
        if (!o.offsetParent) continue;
        var txt = (o.textContent || "").trim();
        if (!txt) continue;
        if (txt.indexOf("提交") !== -1 || txt.indexOf("课堂问答") !== -1) continue;
        if (txt.length > 80) continue;  // 严格短文本（华医网选项通常 < 40 字符）
        // 选项特征：以 A./B./C./D. 开头，或"正确/错误/是/否/对/错"
        if (!/^[A-D][\.\s:：、]\s*\S|^[A-D]\s*$|^\s*(正确|错误|是|否|对|错)\s*$/i.test(txt)) continue;
        // 去重
        var dup = false;
        for (var j = 0; j < opts.length; j++) {
          if (opts[j].text === txt.slice(0, 60)) { dup = true; break; }
        }
        if (dup) continue;
        opts.push({ el: o, text: txt.slice(0, 60) });
      }
      return opts;
    }

    // 在弹窗内找"提交"按钮
    function qaFindSubmit(w) {
      var btns = w.querySelectorAll("button");
      for (var i = 0; i < btns.length; i++) {
        if ((btns[i].textContent || "").indexOf("提交") !== -1) return btns[i];
      }
      return null;
    }

    // 主循环：每 2 秒检测一次课堂问答
    function qaStart() {
      if (qaTimer) {
        clearInterval(qaTimer);
        qaTimer = null;
      }
      qaTimer = setInterval(function () {
        try {
          var w = qaFindWidget();
          if (!w) {
            // 弹窗已消失（答对/跳过）或尚未出现
            if (qaState.widget) qaLog("弹窗已消失（答对），本次课堂问答完成");
            qaState.widget = null;
            qaState.triedIndex = -1;
            qaState.aiPending = false;
            return;
          }
          var opts = qaExtractOptions(w);
          if (opts.length === 0) {
            // 只在首次检测到弹窗但找不到选项时记录（避免每 2 秒刷屏）
            if (qaState.widget !== w) qaLog("⚠️ 检测到课堂问答弹窗但未找到选项（DOM 结构可能变化）");
            return;
          }

          // 提交后留 3 秒给服务端校验，期间不动作（避免误判"答错"）
          if (qaState.widget === w && Date.now() - qaState.lastSubmitAt < 3000) return;

          var q = qaExtractQuestion(w);
          var mem = {};
          try { mem = JSON.parse(localStorage.getItem(qaKey)) || {}; } catch (e) {}
          // 【v2.8.1】统一写库：索引进 qaKey（弹窗复用），答案文字进 qaTextKey（导出/阅读）
          function qaSaveAnswer(qq, idx, text) {
            mem[qq] = idx;
            try { localStorage.setItem(qaKey, JSON.stringify(mem)); } catch (e) {}
            if (text) {
              try {
                var qt = JSON.parse(localStorage.getItem(qaTextKey) || "{}");
                qt[qq] = String(text).slice(0, 60);
                localStorage.setItem(qaTextKey, JSON.stringify(qt));
              } catch (e) {}
            }
          }

          if (qaState.widget !== w) {
            // 新弹窗：先查记忆，命中直接选
            qaState.widget = w;
            qaLog("检测到课堂问答弹窗，找到 " + opts.length + " 个选项");
            if (mem[q] !== undefined && mem[q] >= 0 && mem[q] < opts.length) {
              console.log("【子川助手·课堂问答】记忆命中，直接选第 " + (mem[q] + 1) + " 项");
              qaLog("记忆命中，直接选第 " + (mem[q] + 1) + " 项");
              qaState.triedIndex = mem[q];
              try { opts[mem[q]].el.click(); } catch (e) { qaLog("点击选项异常: " + e.message); }
              var sb = qaFindSubmit(w);
              if (sb) { sb.click(); qaState.lastSubmitAt = Date.now(); }
              return;
            }
            // 【v2.8.1】优先级：百度搜索 → AI → 试错（与面板作答链一致）
            if (searchOn()) {
              qaState.aiPending = true;
              var srchOpts = opts.map(function (o) { return o.text; });
              freeSearchAnswer(q, srchOpts)
                .then(function (ans) {
                  qaState.aiPending = false;
                  if (qaState.widget !== w || !ans) return;
                  var sIdx = aiPickOptionIndex(ans.charAt(0), opts);
                  if (sIdx < 0) {
                    qaLog("搜索结果无法匹配选项: " + ans + "，下轮试错");
                    return;
                  }
                  qaLog("搜索联网选择第 " + (sIdx + 1) + " 项: " + opts[sIdx].text);
                  hyToast("🔍 搜索课堂问答 → 第 " + (sIdx + 1) + " 项");
                  qaState.triedIndex = sIdx;
                  try { opts[sIdx].el.click(); } catch (e) { qaLog("点击选项异常: " + e.message); }
                  var sb3 = qaFindSubmit(w);
                  if (sb3) { sb3.click(); qaState.lastSubmitAt = Date.now(); }
                  qaSaveAnswer(q, sIdx, opts[sIdx].text);
                })
                .catch(function () {
                  qaState.aiPending = false;
                });
              return;
            }
            if (aiReady()) {
              qaState.aiPending = true;
              var aiOpts = opts.map(function (o) { return o.text; });
              aiAskChoice(q, aiOpts)
                .then(function (letter) {
                  qaState.aiPending = false;
                  if (qaState.widget !== w) return; // 弹窗已消失或已切换
                  var aiIdx = aiPickOptionIndex(letter, opts);
                  if (aiIdx < 0) {
                    qaLog("AI 返回无法匹配的选项: " + letter + "，下轮试错");
                    return;
                  }
                  qaLog("AI 联网选择第 " + (aiIdx + 1) + " 项: " + opts[aiIdx].text);
                  hyToast("🤖 AI 课堂问答 → 第 " + (aiIdx + 1) + " 项");
                  qaState.triedIndex = aiIdx;
                  try { opts[aiIdx].el.click(); } catch (e) { qaLog("点击选项异常: " + e.message); }
                  var sb2 = qaFindSubmit(w);
                  if (sb2) { sb2.click(); qaState.lastSubmitAt = Date.now(); }
                  qaSaveAnswer(q, aiIdx, opts[aiIdx].text);
                })
                .catch(function (e) {
                  qaState.aiPending = false;
                  qaLog("AI 作答失败，回退试错: " + e.message);
                });
              return;
            }
            qaState.triedIndex = -1;
          }

          // 弹窗仍在且过判定时间 → 上一个答案错了 → 试下一个
          if (qaState.aiPending) return; // 【v2.5.0】AI 正在联网作答，先挂起试错
          qaState.triedIndex++;
          if (qaState.triedIndex >= opts.length) {
            // 所有选项都试过还错（弹窗还没消失）→ 不再循环，提示用户
            if (qaState.triedIndex === opts.length) {
              qaLog("❌ 所有 " + opts.length + " 个选项都试错，弹窗仍存在（请人工答或检查是否被锁）");
            }
            qaState.triedIndex = 0; // 保险
            return;
          }
          console.log(
            "【子川助手·课堂问答】尝试第 " +
              (qaState.triedIndex + 1) +
              " 项: " +
              opts[qaState.triedIndex].text,
          );
          qaLog("尝试第 " + (qaState.triedIndex + 1) + " 项: " + opts[qaState.triedIndex].text);
          try { opts[qaState.triedIndex].el.click(); } catch (e) { qaLog("点击选项异常: " + e.message); }
          var sub = qaFindSubmit(w);
          if (sub) {
            sub.click();
            qaState.lastSubmitAt = Date.now();
          } else {
            qaLog("⚠️ 弹窗内未找到提交按钮");
          }
          // 先记当前索引；若答错，下一轮会覆盖为下一索引；答对则弹窗消失，保留的就是正确答案
          qaSaveAnswer(q, qaState.triedIndex, opts[qaState.triedIndex].text);
        } catch (e) {
          console.log("【子川助手·课堂问答】异常: " + e.message);
        }
      }, 2000);
    }

    // ════════ 【v2.5.0】互动病例（case.91huayi.com）自动答题 + 步进 ════════
    // 实测机制（2026.11）：
    //  ① 题目一次性提交——提交后选项 locked、按钮变 done，不能重试 → 试错不可行；
    //  ② 反馈直接给出「参考答案是 X」，可解析入答案库（重学同题直接命中）；
    //  ③ 答错不卡流程（全部提交即可进下一步），只影响正确率。
    // 答题优先链：答案库 → AI（已配置）→ 免费联网搜索 → 兜底（单选A/多选全选，保流程推进）。
    var caseTimer = null;
    var caseKey = "JJ_Case_Answer";

    function caseLog(msg) {
      console.log("【子川助手·互动病例】" + msg);
      try {
        var arr = JSON.parse(localStorage.getItem("JJ_Case_Log")) || [];
        arr.push(
          new Date(Date.now() + 8 * 3600 * 1000).toISOString().slice(11, 19) +
            " " +
            msg,
        );
        if (arr.length > 20) arr = arr.slice(-20);
        localStorage.setItem("JJ_Case_Log", JSON.stringify(arr));
      } catch (e) {}
    }

    function caseNorm(s) {
      return String(s || "")
        .replace(/\s+/g, "")
        .trim();
    }

    // 收集一题的选项 [{letter, el, text}]（单选 .qopt/.okey；多选 .multi-opt/.ckbox）
    // 选项标记可能是"✓"等非字母（判断题），用索引字母兜底，保证可选中提交
    function caseGetOptions(block) {
      var out = [];
      var singles = block.querySelectorAll(".qopt");
      var multis = block.querySelectorAll(".multi-opt");
      function normLetter(raw, idx) {
        raw = String(raw || "").trim();
        return /^[A-Z]$/.test(raw) ? raw : String.fromCharCode(65 + idx);
      }
      if (singles.length) {
        for (var i = 0; i < singles.length; i++) {
          out.push({
            letter: normLetter(
              (singles[i].querySelector(".okey") || {}).textContent,
              i,
            ),
            el: singles[i],
            text: caseNorm(singles[i].textContent).replace(/^[A-Z]/, ""),
          });
        }
      } else if (multis.length) {
        for (var j = 0; j < multis.length; j++) {
          out.push({
            letter: normLetter(
              (multis[j].querySelector(".ckbox") || {}).textContent,
              j,
            ),
            el: multis[j],
            text: caseNorm(multis[j].textContent).replace(/^[A-Z]/, ""),
          });
        }
      }
      return out;
    }

    // 按字母选选项并提交（letters: "E" / "ABCD"）；新题初始必为未选态，直接点击目标项
    function casePickAndSubmit(block, letters) {
      try {
        var opts = caseGetOptions(block);
        var want = String(letters || "")
          .toUpperCase()
          .replace(/[^A-Z]/g, "");
        if (!want) return;
        var clicked = 0;
        for (var i = 0; i < opts.length; i++) {
          if (want.indexOf(opts[i].letter) !== -1) {
            opts[i].el.click();
            clicked++;
          }
        }
        if (!clicked) return;
        // 等 Vue 更新选中态后再提交
        setTimeout(function () {
          try {
            var btn = block.querySelector("button.q-submit-btn");
            if (btn && !btn.className.includes("done")) btn.click();
          } catch (e) {}
        }, 350);
      } catch (e) {
        caseLog("提交异常: " + e.message);
      }
    }

    // 解析已提交题目的反馈「参考答案」写入答案库
    function caseHarvestAnswers() {
      try {
        var mem = JSON.parse(localStorage.getItem(caseKey)) || {};
        var blocks = document.querySelectorAll(".q-block");
        var n = 0;
        for (var i = 0; i < blocks.length; i++) {
          var b = blocks[i];
          var btn = b.querySelector("button.q-submit-btn");
          if (!btn || !btn.className.includes("done")) continue;
          var q = caseNorm((b.querySelector(".qtxt") || {}).textContent);
          if (!q || mem[q]) continue;
          var fb = b.querySelector(".fb-wrap");
          if (!fb) continue;
          var m = (fb.textContent || "").match(
            /参考答案是\s*([A-Z](?:\s*[、,，]\s*[A-Z])*)/,
          );
          if (!m) continue;
          var ans = m[1].replace(/[^A-Z]/g, "");
          if (ans) {
            mem[q] = ans;
            n++;
          }
        }
        if (n) {
          localStorage.setItem(caseKey, JSON.stringify(mem));
          caseLog("已从反馈解析 " + n + " 道题的参考答案入库（下次学习直接命中）");
        }
      } catch (e) {}
    }

    // 处理本步骤所有未提交的题
    async function caseAnswerPending() {
      var blocks = document.querySelectorAll(".q-block");
      var mem = {};
      try {
        mem = JSON.parse(localStorage.getItem(caseKey)) || {};
      } catch (e) {}
      for (var i = 0; i < blocks.length; i++) {
        var b = blocks[i];
        var btn = b.querySelector("button.q-submit-btn");
        if (!btn || btn.className.includes("done")) continue;
        var q = caseNorm((b.querySelector(".qtxt") || {}).textContent);
        if (!q) continue;
        if (b.getAttribute("data-hyu-busy")) continue; // AI/搜索处理中
        var isMulti =
          ((b.querySelector(".qlabel") || {}).textContent || "").indexOf(
            "多选",
          ) !== -1;
        var opts = caseGetOptions(b);
        var promptOpts = opts.map(function (o) {
          return o.letter + "、" + o.text;
        });
        var that = b;

        if (mem[q]) {
          casePickAndSubmit(that, mem[q]);
          caseLog("答案库命中 → " + mem[q] + "（" + q.slice(0, 18) + "…）");
          continue;
        }
        // 【v2.8.0】题干归一化兜底匹配病例答案库（同课件考试的模糊命中修复）
        {
          var nqC = hyNormKey(q);
          var hitC = null;
          for (var mk in mem) {
            if (hyNormKey(mk) === nqC) {
              hitC = mk;
              break;
            }
          }
          if (hitC) {
            casePickAndSubmit(that, mem[hitC]);
            caseLog("答案库归一化命中 → " + mem[hitC]);
            continue;
          }
        }

        // 异步作答：②百度搜索（开启时）→ ③AI（百度关且 AI 开时，互斥）→ 兜底
        that.setAttribute("data-hyu-busy", "1");
        (async function (block, question, multi, options, optTexts) {
          var answered = false;
          var useSearch = searchOn();
          var useAi = aiReady() && !useSearch;
          if (useSearch) {
            try {
              var sAns0 = await freeSearchAnswer(question, optTexts);
              if (sAns0) {
                casePickAndSubmit(block, multi ? sAns0 : sAns0.charAt(0));
                caseLog("百度搜索作答 → " + (multi ? sAns0 : sAns0.charAt(0)));
                hyToast("🔍 搜索病例作答 → " + (multi ? sAns0 : sAns0.charAt(0)));
                answered = true;
              }
            } catch (e) {
              caseLog("搜索作答失败: " + e.message);
            }
          }
          if (!answered && useAi) {
            try {
              var aiAns = await aiAskChoice(question, optTexts, multi);
              casePickAndSubmit(block, aiAns);
              caseLog("AI 联网作答 → " + aiAns);
              hyToast("🤖 AI 病例作答 → " + aiAns);
              answered = true;
            } catch (e) {
              caseLog("AI 作答失败: " + e.message);
            }
          }
          if (!answered) {
            try {
              var sAns = await freeSearchAnswer(question, optTexts);
              if (sAns) {
                if (multi) {
                  casePickAndSubmit(block, sAns);
                } else {
                  casePickAndSubmit(block, sAns.charAt(0));
                }
                caseLog("免费搜索命中 → " + (multi ? sAns : sAns.charAt(0)));
                hyToast("🔍 搜索命中 → " + (multi ? sAns : sAns.charAt(0)));
                answered = true;
              }
            } catch (e) {
              caseLog("免费搜索失败: " + e.message);
            }
          }
          if (!answered) {
            // 兜底：保流程推进（答错不卡步骤，参考答案会自动入库，下次学习命中）
            var fallback = multi
              ? options
                  .map(function (o) {
                    return o.letter;
                  })
                  .join("")
              : "A";
            casePickAndSubmit(block, fallback);
            caseLog(
              "答案库/AI/搜索均未命中，兜底提交 " +
                fallback +
                "（参考答案将入库，重学时自动答对）",
            );
            hyToast("⚠️ 未命中兜底提交 " + fallback + "（参考答案将入库）");
          }
          block.removeAttribute("data-hyu-busy");
        })(that, q, isMulti, opts, promptOpts);
      }
    }

    // 主循环：每 2.5 秒 —— 收割参考答案 → 答题 → 全部完成后自动步进
    function caseInteractiveStart() {
      caseLog("互动病例自动学习启动");
      var lastNextAt = 0;
      caseTimer = setInterval(async function () {
        try {
          caseHarvestAnswers();
          var blocks = document.querySelectorAll(".q-block");
          var unfinished = 0;
          for (var i = 0; i < blocks.length; i++) {
            var btn = blocks[i].querySelector("button.q-submit-btn");
            if (btn && !btn.className.includes("done")) unfinished++;
          }
          if (unfinished > 0) {
            await caseAnswerPending();
            return; // 等下一轮确认全部提交完成
          }
          // 无未完成题目（或本步骤无题）→ 步进
          if (Date.now() - lastNextAt < 2500) return;
          var btns = Array.from(document.querySelectorAll("button"));
          var next = btns.find(function (b) {
            return b.offsetParent && /→$/.test((b.textContent || "").trim());
          });
          if (next) {
            lastNextAt = Date.now();
            next.click();
            return;
          }
          // 总结页：完成按钮（无「→」时）
          var done = btns.find(function (b) {
            return (
              b.offsetParent &&
              /完成/.test((b.textContent || "").trim()) &&
              !/已完成/.test(b.className)
            );
          });
          if (done) {
            done.click();
            caseLog("已点击完成按钮，互动病例学习结束");
          }
        } catch (e) {
          console.log("【子川助手·互动病例】轮询异常: " + e.message);
        }
      }, 2500);
    }

    //---------------------------------全局函数区end------------------------------//

    // ═══════════════════════════════════════════════════════════════════════════
    // hysslogin SSO 登录助手（解锁 Edge 自动填充 + 填账号密码 + 勾协议）
    // 仅在 hysslogin.91huayi.com 登录页生效。
    // 与 cmeXX 登录页的 unlock() 同思路：还原 autocomplete 属性让 Edge 正常回填，
    // 再通过 Vue 实例直接写入账号密码和勾选协议。
    // 凭据从 localStorage(hyw_cred) 读取，不内置任何默认值；无凭据则仅解锁。
    // ═══════════════════════════════════════════════════════════════════════════
    function HY_hyssloginHelper() {
      console.log("【子川助手·hysslogin登录助手】已启动");

      // 1) 读取凭据：仅从 localStorage 读取，不内置默认值
      function getCred() {
        try {
          var s = localStorage.getItem("hyw_cred");
          if (s) {
            var o = JSON.parse(s);
            if (o && o.account && o.password) return o;
          }
        } catch (e) {}
        return null;
      }

      // 2) 解锁 Edge 自动填充：移除 Vue 设置的 autocomplete 阻碍属性
      function unlockAutofill() {
        document.querySelectorAll('input[autocomplete="new-password"], input[autocomplete="off"]').forEach(function (el) {
          if (el.type === "password" || el.name === "password" || el.id === "password") {
            el.setAttribute("autocomplete", "current-password");
          } else if (el.type === "text" || el.name === "username" || el.id === "username") {
            el.setAttribute("autocomplete", "username");
          }
        });
      }
      unlockAutofill();
      // MutationObserver 兜底：Vue 动态渲染的输入框也能解锁
      var _unlockObserver = new MutationObserver(function () { unlockAutofill(); });
      _unlockObserver.observe(document.documentElement, { childList: true, subtree: true });

      // 3) 等待 Vue 实例挂载（Vue2 会在 #app 挂 __vue__）
      function waitVue(cb, tries) {
        tries = tries || 0;
        var app = document.getElementById("app");
        if (app && app.__vue__) { cb(app.__vue__); return; }
        if (tries > 120) { console.error("【hysslogin登录助手】等待 Vue 实例超时"); return; }
        setTimeout(function () { waitVue(cb, tries + 1); }, 150);
      }

      // 4) 主流程：切到密码登录 → 填账号密码（如有） → 自动勾协议
      waitVue(function (vm) {
        try { vm.toPass(); } catch (e) { console.error("toPass 失败", e); }
        setTimeout(function () {
          var cred = getCred();
          if (cred) {
            try {
              vm.user.userName = cred.account;
              vm.user.password = cred.password;
              if ("displayValue" in vm) vm.displayValue = cred.password;
              console.log("【hysslogin登录助手】账号密码已填入");
            } catch (e) { console.error("填值失败", e); }
          } else {
            console.log("【hysslogin登录助手】未找到凭据，请手动输入账号密码");
          }
          // 自动勾选"我已仔细阅读并同意"协议复选框
          try { vm.check = true; } catch (e) {}
          // 同时操作 DOM 兜底（Vue 可能未监听某些 checkbox）
          document.querySelectorAll('input[type="checkbox"]').forEach(function (cb) {
            var label = cb.parentElement ? cb.parentElement.textContent : "";
            if (label.indexOf("同意") !== -1 || label.indexOf("协议") !== -1 || label.indexOf("保护政策") !== -1) {
              if (!cb.checked) {
                cb.checked = true;
                cb.dispatchEvent(new Event("change", { bubbles: true }));
                cb.dispatchEvent(new Event("click", { bubbles: true }));
              }
            }
          });
        }, 600);
      });
    }
  })();
  // DOMContentLoaded wrapper end
}
// 根据 readyState 决定立即执行还是等待 DOMContentLoaded
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", __hyInit__);
} else {
  __hyInit__();
}
