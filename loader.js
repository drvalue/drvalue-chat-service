(function () {
  console.log("hi");
  const FLAG = "__MY_CHATBOT_WIDGET__";
  const REPO = "drvalue/drvalue-chat-service";

  // 반드시 @main 기준으로만 시도 (경로 혼란 제거)
  const VERSION_JS = `https://cdn.jsdelivr.net/gh/${REPO}@main/version.js`;
  const WIDGET_JS = `https://cdn.jsdelivr.net/gh/${REPO}@main/widget.js`;

  if (window[FLAG]?.__loaderInitialized) return;
  window[FLAG] = window[FLAG] || {};
  window[FLAG].__loaderInitialized = true;

  const loaded = new Set();
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (loaded.has(src)) return resolve();
      const s = document.createElement("script");
      s.src = `${src}?t=${Date.now()}`; // 캐시버스터
      s.async = true;
      s.onload = () => {
        loaded.add(src);
        console.debug("[widget] loaded:", src);
        resolve();
      };
      s.onerror = (e) => {
        console.error("[widget] load error:", src, e);
        reject(e);
      };
      document.head.appendChild(s);
    });
  }

  function teardownOld() {
    try {
      if (window[FLAG]?.teardown) window[FLAG].teardown();
    } catch (e) {}
  }

  async function ensureLatestOnce() {
    // 1) version.js 먼저 시도
    let latestVer = "",
      baseUrl = "";
    try {
      await loadScript(VERSION_JS);
      if (window.__WIDGET_MANIFEST__) {
        latestVer = String(window.__WIDGET_MANIFEST__.version || "").trim();
        baseUrl = String(window.__WIDGET_MANIFEST__.url || "").trim();
        console.debug("[widget] manifest:", { latestVer, baseUrl });
      } else {
        console.warn(
          "[widget] version.js loaded but __WIDGET_MANIFEST__ missing"
        );
      }
    } catch (e) {
      console.warn(
        "[widget] version.js failed, will fallback to widget.js directly"
      );
    }

    // 2) 최신 판단 후 로드
    const currentVer =
      window[FLAG]?.version || localStorage.getItem("WIDGET_VERSION") || "";

    if (
      latestVer &&
      baseUrl &&
      currentVer === latestVer &&
      window[FLAG]?.__widgetLoaded
    ) {
      console.debug("[widget] already latest, skip");
      return;
    }

    try {
      teardownOld();

      if (latestVer && baseUrl) {
        await loadScript(`${baseUrl}?v=${encodeURIComponent(latestVer)}`);
        window[FLAG] = {
          ...(window[FLAG] || {}),
          __widgetLoaded: true,
          version: latestVer,
        };
        localStorage.setItem("WIDGET_VERSION", latestVer);
        localStorage.setItem("WIDGET_URL", baseUrl);
      } else {
        // 3) 폴백: 버전 없이 @main/widget.js 강제 로드
        await loadScript(`${WIDGET_JS}?v=${Date.now()}`);
        window[FLAG] = {
          ...(window[FLAG] || {}),
          __widgetLoaded: true,
          version: "",
        };
      }
    } finally {
      try {
        delete window.__WIDGET_MANIFEST__;
      } catch {}
    }
  }

  ensureLatestOnce();

  // 필요하면 폴링
  const POLL = (window.MyChatbotWidget && window.MyChatbotWidget.poll) || 0;
  if (POLL > 0) setInterval(ensureLatestOnce, POLL);
})();
