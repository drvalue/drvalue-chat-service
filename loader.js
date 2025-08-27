(function () {
  const FLAG = "__MY_CHATBOT_WIDGET__"; // 전역 상태 플래그
  const MANIFEST_URL = "https://chat.growxd.co.kr/widget/version.json"; // 최신버전 체크
  const POLL_INTERVAL_MS = 0; // 페이지 로드시 1회만 체크. 실시간 핫픽스 원하면 300000(5분) 등으로

  // 중복 삽입 방지
  if (window[FLAG]?.__loaderInitialized) return;
  window[FLAG] = window[FLAG] || {};
  window[FLAG].__loaderInitialized = true;

  // 이미 로드된 위젯이 있으면 정리(선택)
  function teardownOld() {
    try {
      if (window[FLAG]?.teardown) window[FLAG].teardown();
    } catch (e) {
      console.warn("[widget] teardown error:", e);
    }
  }

  // 동적 스크립트 로더
  function loadScript(src) {
    return new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.onload = () => resolve();
      s.onerror = (e) => reject(e);
      document.head.appendChild(s);
    });
  }

  async function fetchManifest() {
    const url = `${MANIFEST_URL}?t=${Date.now()}`; // 매번 신선도 확보
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) throw new Error(`manifest fetch failed: ${res.status}`);
    return res.json();
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
        // 이미 최신 위젯이면 아무것도 안함
        return;
      }

      // 기존 위젯 정리(선택)
      teardownOld();

      // 캐시버스터로 즉시 최신
      const widgetUrl = `${baseUrl}?v=${encodeURIComponent(latestVer)}`;
      await loadScript(widgetUrl);

      // 위젯 코드 내부에서 window[FLAG].version = latestVer; 설정해도 좋지만,
      // 여기서도 보조적으로 기록해 둠
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

  // 최초 1회
  ensureLatestOnce();

  // 실시간 핫업데이트가 필요하면 주기적으로 재확인
  if (POLL_INTERVAL_MS > 0) {
    setInterval(ensureLatestOnce, POLL_INTERVAL_MS);
  }
})();
