// ==UserScript==
// @name         🥇【子川助手 v2.5.0】全网唯一真实免费|无人值守|自动静音|视频助手|考试助手|不疲劳
// @namespace    http://tampermonkey.net/
// @version      2.5.0
// @description  适配华医网 2026.11 最新页面（v2.5.0 互动病例自动答题+联网搜答案+4/6/8 倍速；v2.4.1 根除倍速「不能拖拽」提示弹窗）
// @author       四创作者：Arthurfsy2   三创作者：Mriio   二创作者：境界程序员   原创作者：Dr.S
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
var HYU_VERSION = "2.5.0";

var newupdate =
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
    var _lastCompletedCheck = 0; // debounce：连续两次读到"已完成"才真正触发

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
          var tr = localStorage.getItem(keyPlayRate);
          //console.log("存储读取" + tr);//读取倍速
          //var playRateNow = tr ? tr : vSpeed;
          var playRateNow = tr ? parseFloat(tr) : vSpeed;
          cleanKeyStorage();

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

          // 【v2.5.0】联网预答：只对「答案库没有 + 从未试错过」的题目联网作答
          // （重考时已试错过的题继续试错轮转，避免联网答案与试错轮转打架）。
          // 优先 AI（已配置），失败/未配置自动走免费搜索；两者都拿不到则纯试错。
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
                  .innerText.substring(2)
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
              console.log(
                "【子川助手】对 " +
                  askList.length +
                  " 道未知答案题目联网作答（AI/免费搜索）...",
              );
              for (var ki = 0; ki < askList.length; ki++) {
                var gotAns = null;
                if (aiConfigured()) {
                  try {
                    gotAns = await aiAskChoice(askList[ki].q, askList[ki].opts);
                    console.log(
                      "【子川助手·AI】第 " + (ki + 1) + " 题 → " + gotAns,
                    );
                  } catch (e) {
                    console.log(
                      "【子川助手·AI】第 " +
                        (ki + 1) +
                        " 题失败: " +
                        e.message,
                    );
                  }
                }
                if (!gotAns) {
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
                    }
                  } catch (e) {}
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
                .innerText.substring(2)
                .replace(/\s*/g, ""); //问题的具体文本
              //thisQuestions=thisQuestions+q+"@"

              if (qRightAnswer.hasOwnProperty(q)) {
                //当查询到记录了正确答案时的操作

                //console.log("问题:"+ q + ",有答案:"+ qRightAnswer[q]);
                var rightSelection = findAnwser(
                  "tbody",
                  index,
                  qRightAnswer[q],
                ); //返回答案选项label
                if (rightSelection) {
                  rightSelection.click();
                } else {
                  // 找不到匹配答案（可能题目文本已变化），回退到猜测模式
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
                if (aiAnswers.hasOwnProperty(q)) {
                  // 【v2.5.0】AI 联网答案作为试错的起点：答对随考试通过记入答案库；
                  // 答错则重考时 getNextChoice 自动切下一项，试错流程无缝接手
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
        return {};
      }
      var qOldAnswer = qAllAnswer[qTitle] || {};
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

    function cleanKeyStorage() {
      //缓存清理
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

    // 把题目+选项发给 AI，返回正确选项字母（单选如 "A"；multi=true 时返回多个如 "ABCD"）。
    // 失败抛异常，由调用方回退。
    async function aiAskChoice(question, optionTexts, multi) {
      var base = (localStorage.getItem("hyu_ai_base") || "").replace(/\/+$/, "");
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
      var res;
      try {
        res = await fetch(base + "/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: "Bearer " + localStorage.getItem("hyu_ai_key"),
          },
          body: JSON.stringify({
            model: localStorage.getItem("hyu_ai_model"),
            messages: [{ role: "user", content: promptTxt }],
            temperature: 0,
          }),
          signal: ctrl.signal,
        });
      } finally {
        clearTimeout(to);
      }
      if (!res.ok) throw new Error("HTTP " + res.status);
      var data = await res.json();
      var content =
        (data.choices &&
          data.choices[0] &&
          data.choices[0].message &&
          data.choices[0].message.content) ||
        "";
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
        return filtered.join("");
      }
      var m = String(content).toUpperCase().match(/\b([A-Z])\b/);
      if (!m)
        throw new Error("AI 未返回选项字母: " + String(content).slice(0, 50));
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
        }, timeoutMs || 8000);
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

    // 在文本中找「答案」模式，返回字母串（"B" 或 "ABCD"）；校验字母在选项范围内
    function extractAnswerPattern(text, optionCount) {
      if (!text) return null;
      var maxLetter = String.fromCharCode(65 + optionCount - 1);
      // 优先匹配「正确答案/参考答案/答案」后跟字母
      var patterns = [
        /(?:正确答案|参考答案|【答案】|答案)\s*[：:是为于]*\s*([A-Z]{1,6})/,
      ];
      for (var pi = 0; pi < patterns.length; pi++) {
        var m = text.match(patterns[pi]);
        if (!m) continue;
        var letters = m[1].split("").filter(function (L) {
          return L >= "A" && L <= maxLetter;
        });
        if (letters.length) {
          // 去重保序
          var uniq = [];
          for (var i = 0; i < letters.length; i++) {
            if (uniq.indexOf(letters[i]) === -1) uniq.push(letters[i]);
          }
          return uniq.join("");
        }
      }
      return null;
    }

    // 免费搜答案主入口：返回 "B"/"ABCD" 或 null。
    // ⚠️ 依赖境外公共 CORS 代理（allorigins/codetabs），大陆网络环境多数不可达——
    // 故默认关闭（hyu_search_on=1 才启用，面板 AI 区的「搜索」开关控制），
    // 避免每题白白等待 30 秒代理超时。网络可达（如公司专线/代理环境）时打开即可。
    async function freeSearchAnswer(question, optionTexts) {
      try {
        if (localStorage.getItem("hyu_search_on") !== "1") return null;
      } catch (e) {
        return null;
      }
      var query = String(question).slice(0, 60) + " 答案";
      var engines = [
        "https://www.bing.com/search?q=",
        "https://www.baidu.com/s?wd=",
      ];
      for (var ei = 0; ei < engines.length; ei++) {
        var html = await fetchViaProxy(engines[ei] + encodeURIComponent(query));
        if (!html) continue;
        var text = searchHtmlToText(html);
        // 先确认摘要里确实包含题干片段（防止乱匹配别的题）
        var qHead = String(question).replace(/\s+/g, "").slice(0, 15);
        if (qHead && text.replace(/\s+/g, "").indexOf(qHead) === -1) continue;
        var ans = extractAnswerPattern(text, optionTexts.length);
        if (ans) {
          console.log(
            "【子川助手·搜索】第 " +
              (ei + 1) +
              " 个引擎命中答案: " +
              ans +
              "（题干: " +
              String(question).slice(0, 20) +
              "…）",
          );
          return ans;
        }
      }
      return null;
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
          hreftest != "#" ||
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
            (state == "待考试" || (state == "已完成" && hreftest != "#"))
          ) {
            // mode=2：检查侧边栏是否还有学习中/未学习课程
            // 如果有，优先完成学习；只有全部学完才进入考试
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
        width: 240px;
        font-family: 'Microsoft YaHei', '微软雅黑', sans-serif;
        font-size: 14px;
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
        <div id="hyu-panel-header" style="
            background: linear-gradient(135deg, #4cb0f9, #3a8fd4);
            color: #fff;
            padding: 12px 16px;
            font-size: 16px;
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
                <span id='hyu-minimize' style="cursor:pointer;font-size:16px;line-height:1;opacity:0.85;" title="最小化面板">─</span>
                <span id='clo' style="cursor:pointer;font-size:18px;line-height:1;opacity:0.85;" title="关闭面板">×</span>
            </span>
        </div>
        <div id="hyu-panel-body" style="padding: 14px 16px;` +
        (savedCollapsed ? "display:none;" : "") +
        `">
            <div id="tixing" style="
                font-size: 13px;
                color: #666;
                line-height: 1.6;
                padding: 8px 12px;
                background: #f5f7fa;
                border-radius: 4px;
                margin-bottom: 10px;
            ">当前页面无代码！！！</div>
            <div id="modeSection" style="
                font-size: 13px;
                color: #333;
                line-height: 1.6;
                padding: 10px 12px;
                background: ` +
        modeColor +
        `;
                border-radius: 4px;
                border: 1px solid ` +
        modeBorder +
        `;
                margin-bottom: 10px;
            ">
                <div style="font-weight:bold;margin-bottom:6px;color:#555;">当前模式</div>
                <div id="modeLabel" style="
                    display: inline-block;
                    padding: 5px 16px;
                    border-radius: 14px;
                    font-weight: bold;
                    font-size: 14px;
                    cursor: pointer;
                    transition: all 0.3s;
                    user-select: none;
                    background: ` +
        modeTextColor +
        `;
                    color: #fff;
                ">` +
        modeLabel +
        `</div>
                <div style="font-size:11px;color:#999;margin-top:4px;">点击按钮切换模式</div>
                <div style="font-size:11px;color:#999;margin-top:2px;">'默认1x，建议2x以内'</div>
            </div>
            <div id="hyu-progress-section" style="
                font-size: 13px;
                color: #333;
                line-height: 1.6;
                padding: 10px 12px;
                background: #fafafa;
                border-radius: 4px;
                border: 1px solid #e8e8e8;
                margin-bottom: 10px;
            ">
                <div style="font-weight:bold;margin-bottom:6px;color:#555;">课程进度</div>
                <div id="hyu-progress-text" style="font-size:12px;color:#666;">读取中…</div>
            </div>
            <div id="hyu-answer-section" style="
                font-size: 13px;
                color: #333;
                line-height: 1.6;
                padding: 10px 12px;
                background: #fafafa;
                border-radius: 4px;
                border: 1px solid #e8e8e8;
                margin-bottom: 10px;
            ">
                <div style="font-weight:bold;margin-bottom:6px;color:#555;">答案库</div>
                <div style="display:flex;gap:6px;">
                    <span id="hyu-ans-export" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">导出 JSON</span>
                    <span id="hyu-ans-import" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">导入 JSON</span>
                </div>
            </div>
            <div id="hyu-ai-section" style="
                font-size: 13px;
                color: #333;
                line-height: 1.6;
                padding: 10px 12px;
                background: #fafafa;
                border-radius: 4px;
                border: 1px solid #e8e8e8;
                margin-bottom: 10px;
            ">
                <div style="font-weight:bold;margin-bottom:6px;color:#555;">AI 联网答题（可选）</div>
                <div id="hyu-ai-status" style="font-size:12px;color:#666;">读取中…</div>
                <div style="display:flex;gap:6px;margin-top:6px;">
                    <span id="hyu-ai-config" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">配置</span>
                    <span id="hyu-ai-test" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">测试</span>
                    <span id="hyu-ai-clear" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">清除</span>
                    <span id="hyu-search-toggle" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;" title="免费联网搜答案（依赖公共代理，网络不通自动跳过）">搜索:关</span>
                </div>
                <div style="font-size:11px;color:#999;margin-top:4px;">考试/课堂问答/互动病例自动联网作答；未配置或失败自动回退答案库+试错。免费搜索走公共代理（大陆网络多不通，默认关）</div>
            </div>
            <div id="speedSection" style="
                font-size: 13px;
                color: #333;
                line-height: 1.6;
                padding: 10px 12px;
                background: #fafafa;
                border-radius: 4px;
                border: 1px solid #e8e8e8;
                margin-bottom: 10px;
            ">
                <div style="font-weight:bold;margin-bottom:6px;color:#555;">播放速度</div>
                <div style="display:flex;flex-wrap:wrap;gap:6px;">
                    <span class="speedBtn" data-rate="1" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#1976d2;color:#fff;user-select:none;">1x</span>
                    <span class="speedBtn" data-rate="1.5" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">1.5x</span>
                    <span class="speedBtn" data-rate="2" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">2x</span>
                    <span class="speedBtn" data-rate="3" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">3x</span>
                    <span class="speedBtn" data-rate="4" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">4x</span>
                    <span class="speedBtn" data-rate="6" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">6x</span>
                    <span class="speedBtn" data-rate="8" style="display:inline-block;padding:3px 10px;border-radius:12px;font-size:12px;cursor:pointer;background:#e0e0e0;color:#555;user-select:none;">8x</span>
                </div>
            </div>
            <div id="hyu-opacity-section" style="
                font-size: 13px;
                color: #333;
                line-height: 1.6;
                padding: 10px 12px;
                background: #fafafa;
                border-radius: 4px;
                border: 1px solid #e8e8e8;
                margin-bottom: 10px;
            ">
                <div style="font-weight:bold;margin-bottom:6px;color:#555;">面板透明度</div>
                <div style="display:flex;align-items:center;gap:8px;">
                    <span style="font-size:11px;color:#999;">透明</span>
                    <input id="hyu-opacity-slider" type="range" min="20" max="100" value="` +
        Math.round(savedOpacity * 100) +
        `" style="flex:1;cursor:pointer;">
                    <span style="font-size:11px;color:#999;">不透明</span>
                </div>
            </div>
            <div id='update' style="
                font-size: 12px;
                color: #999;
                line-height: 1.5;
                border-top: 1px solid #eee;
                padding-top: 10px;
            ">
                <span style="color:#666;font-weight:bold;">更新记录</span><br>
                ` +
        newupdate +
        `
            </div>
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
      var savedSpeed = parseFloat(localStorage.getItem(keyPlayRate)) || 1;
      for (var s = 0; s < speedBtns.length; s++) {
        (function (btn) {
          var rate = parseFloat(btn.getAttribute("data-rate"));
          // 高亮已保存的速度
          if (Math.abs(rate - savedSpeed) < 0.01) {
            btn.style.background = "#1976d2";
            btn.style.color = "#fff";
          }
          btn.onclick = function () {
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

      // ====== 【v2.5.0】AI 联网答题配置 ======
      function refreshAiStatus() {
        var el = document.getElementById("hyu-ai-status");
        if (!el) return;
        if (aiConfigured()) {
          el.textContent =
            "已配置：" +
            localStorage.getItem("hyu_ai_model") +
            "（将联网作答）";
          el.style.color = "#2e7d32";
        } else {
          el.textContent = "未配置（答案库 + 试错作答）";
          el.style.color = "#666";
        }
        var st2 = document.getElementById("hyu-search-toggle");
        if (st2) {
          var sOn = false;
          try {
            sOn = localStorage.getItem("hyu_search_on") === "1";
          } catch (e) {}
          st2.textContent = "搜索:" + (sOn ? "开" : "关");
          st2.style.background = sOn ? "#1976d2" : "#e0e0e0";
          st2.style.color = sOn ? "#fff" : "#555";
        }
      }
      var searchToggleBtn = document.getElementById("hyu-search-toggle");
      if (searchToggleBtn) {
        searchToggleBtn.onclick = function () {
          var on = false;
          try {
            on = localStorage.getItem("hyu_search_on") === "1";
            localStorage.setItem("hyu_search_on", on ? "0" : "1");
          } catch (e) {}
          refreshAiStatus();
          console.log(
            "【子川助手】免费搜索已" +
              (on ? "关闭" : "开启") +
              "（走公共代理，网络不通自动跳过）",
          );
        };
      }
      var aiCfgBtn = document.getElementById("hyu-ai-config");
      if (aiCfgBtn) {
        aiCfgBtn.onclick = function () {
          var base = prompt(
            "AI 接口地址（OpenAI 兼容，填到 /v1 为止，如 https://api.openai.com/v1）：",
            localStorage.getItem("hyu_ai_base") || "https://api.openai.com/v1",
          );
          if (base === null) return;
          var key = prompt(
            "API Key（仅保存在本浏览器，用于联网答题）：",
            localStorage.getItem("hyu_ai_key") || "",
          );
          if (key === null) return;
          var model = prompt(
            "模型名（建议用支持联网搜索或知识面广的模型）：",
            localStorage.getItem("hyu_ai_model") || "",
          );
          if (model === null) return;
          try {
            localStorage.setItem("hyu_ai_base", base.trim());
            localStorage.setItem("hyu_ai_key", key.trim());
            localStorage.setItem("hyu_ai_model", model.trim());
          } catch (e) {}
          refreshAiStatus();
        };
      }
      var aiTestBtn = document.getElementById("hyu-ai-test");
      if (aiTestBtn) {
        aiTestBtn.onclick = async function () {
          if (!aiConfigured()) {
            alert("请先点「配置」填好接口地址、Key 和模型名");
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
            alert("AI 接口正常 ✓（测试题返回：" + letter + "，应为 B）");
          } catch (e) {
            alert(
              "AI 调用失败：" +
                e.message +
                "\n常见原因：接口不支持浏览器跨域(CORS)、Key 无效、地址填错。\n" +
                "配置正确前，考试仍会用答案库+试错作答，不影响使用。",
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
          refreshAiStatus();
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

      // ====== 【v2.4.0】答案库导出/导入（跨浏览器/跨电脑迁移已记录答案） ======
      var ansExportBtn = document.getElementById("hyu-ans-export");
      if (ansExportBtn) {
        ansExportBtn.onclick = function () {
          var data = localStorage.getItem(keyAllAnswer) || "{}";
          try {
            if (!Object.keys(JSON.parse(data)).length) {
              alert("答案库为空，通过考试后才会有记录");
              return;
            }
          } catch (e) {}
          var blob = new Blob([data], { type: "application/json" });
          var a = document.createElement("a");
          a.href = URL.createObjectURL(blob);
          a.download = "hua-yi-answers-" + new Date().toISOString().slice(0, 10) + ".json";
          document.body.appendChild(a);
          a.click();
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
                if (!incoming || typeof incoming !== "object" || Array.isArray(incoming)) {
                  throw new Error("文件格式不正确（需为本脚本导出的 JSON）");
                }
                var curData = {};
                try {
                  curData = JSON.parse(localStorage.getItem(keyAllAnswer) || "{}");
                } catch (e) {}
                var merged = {};
                var added = 0;
                for (var chapter in incoming) {
                  if (typeof incoming[chapter] !== "object") continue;
                  merged[chapter] = {};
                  for (var q in curData[chapter] || {}) merged[chapter][q] = curData[chapter][q];
                  for (var qi in incoming[chapter]) {
                    if (!(qi in merged[chapter])) added++;
                    merged[chapter][qi] = incoming[chapter][qi];
                  }
                }
                for (var c2 in curData) {
                  if (!(c2 in merged)) merged[c2] = curData[c2];
                }
                localStorage.setItem(keyAllAnswer, JSON.stringify(merged));
                alert("导入成功：新增 " + added + " 条答案（同名答案以导入文件为准，其余保留）");
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
            if (Date.now() - watchEndLastMark < 4000) return;
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
            console.log("侧边栏剩余课程均为待考试/已完成，尝试进入考试");
            fallbackToNextCourse();
          }
        } else {
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
            // 【v2.5.0】AI 联网作答（异步，本轮先返回，结果回来后再点击提交；
            // 答对弹窗消失即记为正确答案，答错下轮试错自动接手）
            if (aiConfigured()) {
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
                  qaState.triedIndex = aiIdx;
                  try { opts[aiIdx].el.click(); } catch (e) { qaLog("点击选项异常: " + e.message); }
                  var sb2 = qaFindSubmit(w);
                  if (sb2) { sb2.click(); qaState.lastSubmitAt = Date.now(); }
                  mem[q] = aiIdx; // 答对则保留为正确答案；答错下轮试错会覆盖
                  try { localStorage.setItem(qaKey, JSON.stringify(mem)); } catch (e) {}
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
          mem[q] = qaState.triedIndex;
          try { localStorage.setItem(qaKey, JSON.stringify(mem)); } catch (e) {}
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

        // 异步作答（AI → 免费搜索 → 兜底），标记 busy 防重复处理
        that.setAttribute("data-hyu-busy", "1");
        (async function (block, question, multi, options, optTexts) {
          var answered = false;
          if (aiConfigured()) {
            try {
              var aiAns = await aiAskChoice(question, optTexts, multi);
              casePickAndSubmit(block, aiAns);
              caseLog("AI 联网作答 → " + aiAns);
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
