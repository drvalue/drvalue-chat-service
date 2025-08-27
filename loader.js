(function () {
  const LOADER_FLAG = "__MY_CHATBOT_LOADER__"; // 로더 전용
  const WIDGET_FLAG = "__MY_CHATBOT_WIDGET__"; // (위젯이 쓰는 키: 접근만, 설정하지 않음)
  const REPO = "drvalue/drvalue-chat-service";
  const VERSION_JS = `https://cdn.jsdelivr.net/gh/${REPO}@main/version.js`;
  const WIDGET_JS = `https://cdn.jsdelivr.net/gh/${REPO}@main/widget.js`;

  if (window[LOADER_FLAG]) return; // 로더 중복 방지
  window[LOADER_FLAG] = { initialized: true };

  const loaded = new Set();
  function add(src) {
    return new Promise((res, rej) => {
      if (loaded.has(src)) return res();
      const s = document.createElement("script");
      s.src = src + (src.includes("?") ? "&" : "?") + "t=" + Date.now(); // 캐시버스터
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
    await add(url + (ver ? `&v=${encodeURIComponent(ver)}` : ""));
    // 여기서도 위젯 플래그를 만들지 말 것! (위젯이 스스로 설정하게 둠)
  }

  (async function run() {
    try {
      // 1) version.js 시도 (fetch 없이 script로)
      await add(VERSION_JS);
      const m = window.__WIDGET_MANIFEST__;
      if (m && m.url) {
        await loadWidget(m.url, m.version || "");
      } else {
        // 2) 매니페스트 없음 → 직접 위젯 로드
        await loadWidget(WIDGET_JS, Date.now().toString());
      }
    } catch {
      // 3) 완전 폴백
      try {
        await loadWidget(WIDGET_JS, Date.now().toString());
      } catch {}
    } finally {
      try {
        delete window.__WIDGET_MANIFEST__;
      } catch {}
    }
  })();
})();
