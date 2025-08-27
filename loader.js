(function () {
  const LOADER_FLAG = "__MY_CHATBOT_LOADER__";
  const REPO = "drvalue/drvalue-chat-service";

  const VERSION_JS_CANDIDATES = [
    `https://cdn.jsdelivr.net/gh/${REPO}@main/version.js`,
    `https://fastly.jsdelivr.net/gh/${REPO}@main/version.js`,
  ];
  const WIDGET_JS_CANDIDATES = [
    `https://cdn.jsdelivr.net/gh/${REPO}@main/widget.js`,
    `https://fastly.jsdelivr.net/gh/${REPO}@main/widget.js`,
  ];

  if (window[LOADER_FLAG]) return;
  window[LOADER_FLAG] = { initialized: true };

  const loaded = new Set();
  function withParam(url, param) {
    return url + (url.includes("?") ? "&" : "?") + param;
  }
  function add(src) {
    return new Promise((res, rej) => {
      if (loaded.has(src)) return res();
      const s = document.createElement("script");
      s.src = withParam(src, "t=" + Date.now()); // 캐시버스터
      s.async = true;
      s.onload = () => {
        loaded.add(src);
        res();
      };
      s.onerror = (e) => rej(e);
      document.head.appendChild(s);
    });
  }
  async function tryAddAny(urls) {
    for (const u of urls) {
      try {
        await add(u);
        return true;
      } catch {}
    }
    return false;
  }
  async function loadWidgetWithVersion(urls, ver) {
    for (const base of urls) {
      try {
        const u = ver ? withParam(base, "v=" + encodeURIComponent(ver)) : base;
        await add(u);
        return true;
      } catch {}
    }
    return false;
  }

  (async function run() {
    try {
      const ok = await tryAddAny(VERSION_JS_CANDIDATES);
      let ver = "",
        url = "";
      if (ok && window.__WIDGET_MANIFEST__) {
        ver = String(window.__WIDGET_MANIFEST__.version || "").trim();
        url = String(window.__WIDGET_MANIFEST__.url || "").trim();
      }
      if (url) {
        await add(ver ? withParam(url, "v=" + encodeURIComponent(ver)) : url);
      } else {
        const ok2 = await loadWidgetWithVersion(
          WIDGET_JS_CANDIDATES,
          String(Date.now())
        );
        if (!ok2) console.error("[widget] widget load fallback failed");
      }
    } catch {
      try {
        await tryAddAny(WIDGET_JS_CANDIDATES);
      } catch {}
    } finally {
      try {
        delete window.__WIDGET_MANIFEST__;
      } catch {}
    }
  })();
})();
