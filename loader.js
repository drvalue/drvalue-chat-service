(function () {
  const LOADER_FLAG = "__MY_CHATBOT_LOADER__";
  const REPO = "drvalue/drvalue-chat-service";
  const VERSION_JS = `https://cdn.jsdelivr.net/gh/${REPO}@main/version.js`;
  const WIDGET_JS = `https://cdn.jsdelivr.net/gh/${REPO}@main/widget.js`;

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

  async function loadWidget(url, ver) {
    const u = ver ? withParam(url, "v=" + encodeURIComponent(ver)) : url;
    await add(u);
  }

  (async function run() {
    try {
      // 1) version.js 시도
      await add(VERSION_JS);
      const m = window.__WIDGET_MANIFEST__;
      if (m && m.url) {
        await loadWidget(m.url, m.version || "");
      } else {
        // 2) 매니페스트 없음 → 직접 로드
        await loadWidget(WIDGET_JS, String(Date.now()));
      }
    } catch {
      // 3) 폴백
      try {
        await loadWidget(WIDGET_JS, String(Date.now()));
      } catch {}
    } finally {
      try {
        delete window.__WIDGET_MANIFEST__;
      } catch {}
    }
  })();
})();
