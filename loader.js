(function () {
  console.log("hihi");
  const FLAG = "__MY_CHATBOT_WIDGET__";
  const REPO = "drvalue/drvalue-chat-service";

  // version.js 후보들 (브랜치/미러 포함)
  const VERSION_SCRIPT_CANDIDATES = [
    `https://cdn.jsdelivr.net/gh/${REPO}/version.js`,
    `https://cdn.jsdelivr.net/gh/${REPO}@main/version.js`,
    `https://fastly.jsdelivr.net/gh/${REPO}/version.js`,
    `https://raw.githubusercontent.com/${REPO}/main/version.js`,
  ];

  // 위젯 기본 URL(매니페스트 실패 시 폴백)
  const WIDGET_BASE_URLS = [
    `https://cdn.jsdelivr.net/gh/${REPO}/widget.js`,
    `https://cdn.jsdelivr.net/gh/${REPO}@main/widget.js`,
    `https://fastly.jsdelivr.net/gh/${REPO}/widget.js`,
    `https://raw.githubusercontent.com/${REPO}/main/widget.js`,
  ];

  const POLL_INTERVAL_MS =
    (window.MyChatbotWidget && window.MyChatbotWidget.poll) || 0;

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
        resolve();
      };
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  function teardownOld() {
    try {
      if (window[FLAG]?.teardown) window[FLAG].teardown();
    } catch (e) {}
  }

  async function loadVersionScript() {
    let lastErr;
    for (const u of VERSION_SCRIPT_CANDIDATES) {
      try {
        await loadScript(u);
        return true;
      } catch (e) {
        lastErr = e;
      }
    }
    console.warn("[widget] all version.js candidates failed", lastErr);
    return false;
  }

  async function loadWidget(baseUrl, ver) {
    await loadScript(`${baseUrl}?v=${encodeURIComponent(ver || Date.now())}`);
    window[FLAG] = {
      ...(window[FLAG] || {}),
      __widgetLoaded: true,
      version: ver || "",
    };
    if (baseUrl) localStorage.setItem("WIDGET_URL", baseUrl);
    if (ver) localStorage.setItem("WIDGET_VERSION", ver);
  }

  async function loadWidgetFallback() {
    for (const base of WIDGET_BASE_URLS) {
      try {
        await loadWidget(base, String(Date.now()));
        return true;
      } catch (_) {}
    }
    return false;
  }

  async function ensureLatestOnce() {
    // 1) version.js 로드 시도
    const ok = await loadVersionScript();

    let latestVer = "";
    let baseUrl = "";
    if (ok && window.__WIDGET_MANIFEST__) {
      latestVer = String(window.__WIDGET_MANIFEST__.version || "").trim();
      baseUrl = String(window.__WIDGET_MANIFEST__.url || "").trim();
    }

    // 2) 이미 최신이면 스킵
    const currentVer =
      window[FLAG]?.version || localStorage.getItem("WIDGET_VERSION") || "";
    if (
      latestVer &&
      baseUrl &&
      currentVer === latestVer &&
      window[FLAG]?.__widgetLoaded
    ) {
      return;
    }

    // 3) 교체 로드
    try {
      if (latestVer && baseUrl) {
        teardownOld();
        await loadWidget(baseUrl, latestVer);
      } else {
        // version.js 자체가 막히거나 비어있을 때 폴백
        const ok2 = await loadWidgetFallback();
        if (!ok2)
          console.error(
            "[widget] widget fallback failed - check CSP(script-src) and paths"
          );
      }
    } finally {
      // 다음 주기를 위해 전역 매니페스트 정리(선택)
      try {
        delete window.__WIDGET_MANIFEST__;
      } catch {}
    }
  }

  ensureLatestOnce();
  if (POLL_INTERVAL_MS > 0) {
    setInterval(ensureLatestOnce, POLL_INTERVAL_MS);
  }
})();
