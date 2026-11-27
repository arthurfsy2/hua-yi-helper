// ==UserScript==
// @name         🔍 子川助手·搜索桥 v1.0.0（百度/必应直连，供主脚本搜索用）
// @namespace    http://tampermonkey.net/
// @version      1.0.0
// @description  子川助手配套脚本：通过油猴 GM_xmlhttpRequest 直连抓取百度/必应搜索结果页（不受浏览器跨域限制，大陆网络可用）。主脚本/统一考核脚本会自动调用本脚本；不单独做任何事。装一次即可，建议与主脚本一起安装。
// @author       Lin (WorkBuddy)
// @license      AGPL License
// @match        *://*.91huayi.com/*
// @grant        GM_xmlhttpRequest
// @connect      www.baidu.com
// @connect      m.baidu.com
// @connect      cn.bing.com
// @connect      www.bing.com
// @run-at       document-start
// @noframes
// ==/UserScript==

// 为什么需要这个独立小脚本：
// 浏览器安全模型禁止网页脚本跨域读取百度/必应的搜索结果页（实测公共代理在大陆
// 基本不可达），而油猴的 GM_xmlhttpRequest 不受跨域限制——但它会把脚本带离页面
// 上下文，主脚本的反作弊拦截必须留在页面上下文里，两者权限互斥。
// 所以搜索能力单独装在这个小脚本里：它向页面暴露 window.__hySearchWeb(url)，
// 主脚本检测到就自动用它抓百度（无代理、秒回）；没装则回退公共代理路径。
(function () {
  "use strict";
  if (window.top !== window.self) return; // 与主脚本一致，只在顶层窗口运行

  function gmGet(url, timeoutMs) {
    return new Promise(function (resolve, reject) {
      if (typeof GM_xmlhttpRequest === "undefined") {
        reject(new Error("no GM_xmlhttpRequest"));
        return;
      }
      GM_xmlhttpRequest({
        url: url,
        method: "GET",
        timeout: timeoutMs || 15000,
        headers: {
          // 百度对无 UA 的请求可能返回验证页，带上浏览器 UA
          "User-Agent": navigator.userAgent,
          Accept: "text/html,application/xhtml+xml",
        },
        onload: function (r) {
          if (r.status === 200 && r.responseText && r.responseText.length > 300) {
            resolve(r.responseText);
          } else {
            reject(new Error("HTTP " + r.status));
          }
        },
        onerror: function () {
          reject(new Error("network error"));
        },
        ontimeout: function () {
          reject(new Error("timeout"));
        },
      });
    });
  }

  // 暴露给页面：主脚本调用 window.__hySearchWeb(完整URL) → Promise<HTML文本>
  // 允许的目标域受 @connect 白名单限制，其他域 GM 会直接拒绝
  var ALLOWED = ["www.baidu.com", "m.baidu.com", "cn.bing.com", "www.bing.com"];
  function install() {
    var target = typeof unsafeWindow !== "undefined" ? unsafeWindow : window;
    target.__hySearchWeb = function (url) {
      try {
        var ok = false;
        for (var i = 0; i < ALLOWED.length; i++) {
          if (String(url).indexOf("https://" + ALLOWED[i] + "/") === 0) ok = true;
        }
        if (!ok) return Promise.reject(new Error("域不在白名单"));
        return gmGet(url);
      } catch (e) {
        return Promise.reject(e);
      }
    };
    target.__hySearchBridge = "1.0.0"; // 主脚本可用于显示"搜索桥已就绪"
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", install, { once: true });
  } else {
    install();
  }
})();
