(function () {
  // ================== 설정 ==================
  const FLAG = "__MY_CHATBOT_WIDGET__"; // 전역 상태 키
  const REPO = "drvalue/drvalue-chat-service"; // 깃허브 user/repo
  // version.json을 깃에서 직접 가져옴(우선 jsDelivr, 실패시 raw)
  const MANIFEST_CANDIDATES = [
    `https://cdn.jsdelivr.net/gh/${REPO}/version.json`,
    `https://fastly.jsdelivr.net/gh/${REPO}/version.json`,
    `https://raw.githubusercontent.com/${REPO}/main/version.json`,
  ];
  // 페이지 로드시 1회만 체크(=0). 열려있는 탭에서도 핫업데이트 원하면 분 단위로 설정 (예: 300000 = 5분)
  const POLL_INTERVAL_MS =
    (window.MyChatbotWidget && window.MyChatbotWidget.poll) || 0;
  // 요청 타임아웃(ms)
  const FETCH_TIMEOUT_MS = 7000;
  // ==========================================

  // 중복 삽입 방지
  if (window[FLAG]?.__loaderInitialized) return;
  window[FLAG] = window[FLAG] || {};
  window[FLAG].__loaderInitialized = true;

  // 기존 위젯 정리(선택)
  function teardownOld() {
    try {
      if (window[FLAG]?.teardown) window[FLAG].teardown();
    } catch (e) {
      console.warn("[widget] teardown error:", e);
    }
  }

  // 동적 스크립트 로더(동일 src 중복 로드 방지)
  const loadedSrcSet = new Set();
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      if (loadedSrcSet.has(src)) return resolve();
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      // 필요한 경우 SRI 사용 가능(예: s.integrity = "..."; s.crossOrigin = "anonymous";)
      s.onload = () => {
        loadedSrcSet.add(src);
        resolve();
      };
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  // fetch with timeout
  async function fetchWithTimeout(url, opt = {}, timeoutMs = FETCH_TIMEOUT_MS) {
    const ctrl = new AbortController();
    const id = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
      const res = await fetch(url, {
        cache: "no-store",
        signal: ctrl.signal,
        ...opt,
      });
      return res;
    } finally {
      clearTimeout(id);
    }
  }

  // 매니페스트 가져오기(여러 후보 URL 시도)
  async function fetchManifest() {
    let lastErr;
    for (const base of MANIFEST_CANDIDATES) {
      const url = `${base}?t=${Date.now()}`; // 캐시 버스터
      try {
        const res = await fetchWithTimeout(url);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json(); // { version, url }
      } catch (e) {
        lastErr = e;
        console.warn("[widget] manifest fetch failed:", url, e);
      }
    }
    throw lastErr || new Error("manifest fetch failed");
  }

  async function ensureLatestOnce() {
    try {
      const manifest = await fetchManifest(); // {version, url}
      const latestVer = String(manifest.version || "").trim();
      const baseUrl = String(manifest.url || "").trim();

      if (!latestVer || !baseUrl) {
        throw new Error("invalid manifest fields");
      }

      const currentVer =
        window[FLAG]?.version || localStorage.getItem("WIDGET_VERSION") || "";

      if (currentVer === latestVer && window[FLAG]?.__widgetLoaded) {
        // 이미 최신 위젯이면 생략
        return;
      }

      // 기존 위젯 정리 후 최신 로드
      teardownOld();

      // 캐시버스터 쿼리로 즉시 최신 반영
      const widgetUrl = `${baseUrl}?v=${encodeURIComponent(latestVer)}`;
      await loadScript(widgetUrl);

      // 상태 기록
      window[FLAG] = {
        ...(window[FLAG] || {}),
        version: latestVer,
        __widgetLoaded: true,
      };
      localStorage.setItem("WIDGET_VERSION", latestVer);
      localStorage.setItem("WIDGET_URL", baseUrl);
    } catch (e) {
      console.warn("[widget] latest load failed, trying last known...", e);

      // 매니페스트 실패 시 마지막 정상 URL+버전으로 폴백
      const lastUrl = localStorage.getItem("WIDGET_URL");
      const lastVer = localStorage.getItem("WIDGET_VERSION");
      if (lastUrl && lastVer) {
        try {
          await loadScript(`${lastUrl}?v=${encodeURIComponent(lastVer)}`);
          window[FLAG] = {
            ...(window[FLAG] || {}),
            version: lastVer,
            __widgetLoaded: true,
          };
        } catch (e2) {
          console.error("[widget] fallback load failed", e2);
        }
      }
    }
  }

  // DOM 준비 전에도 동작 가능(즉시 1회)
  ensureLatestOnce();

  // 열려있는 탭에서도 핫업데이트 원하면 주기적으로 확인
  if (POLL_INTERVAL_MS > 0) {
    setInterval(ensureLatestOnce, POLL_INTERVAL_MS);
  }
})();
