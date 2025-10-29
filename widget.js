(function () {
  const FLAG = "__MY_CHATBOT_WIDGET__";
  const VERSION = "2025/10/27:mobile-viewport-fix"; // 모바일 브라우저 UI 대응 개선

  if (window[FLAG]?.teardown) {
    try {
      window[FLAG].teardown();
    } catch (e) {
      console.warn("[widget] old teardown error:", e);
    }
  }
  window[FLAG] = { version: VERSION };

  // ===== 설정/기본값 =====
  var cfg = window.MyChatbotWidget || {};
  var botUrl = cfg.url || "https://chat.growxd.co.kr/user/home";

  // 위치 제어용 상태 (기본: 오른쪽-하단 20px)
  var anchor = {
    x: cfg.anchor?.x || "right", // "left" | "right"
    y: cfg.anchor?.y || "bottom", // "top"  | "bottom"
  };
  var offset = {
    x: cfg.offset?.x ?? 20,
    y: cfg.offset?.y ?? 20,
  };

  // 버튼/패널 기본 크기
  var baseSize = cfg.size || { width: 500, height: 720 };

  // 데스크톱/모바일 반응형 크기 계산
  function getResponsiveSize() {
    var isMobile = window.innerWidth <= 768;
    var isSmallMobile = window.innerWidth <= 480;

    if (isSmallMobile) {
      return {
        width: Math.min(window.innerWidth - 40, 400),
        height: Math.min(window.innerHeight * 0.8, 600),
      };
    } else if (isMobile) {
      return {
        width: Math.min(window.innerWidth - 60, 450),
        height: Math.min(window.innerHeight * 0.75, 650),
      };
    } else {
      return baseSize;
    }
  }

  // ===== 전역 노출 API (대시보드/콘솔에서 호출 가능) =====
  window[FLAG].setPosition = function (next) {
    if (next?.anchor) anchor = { ...anchor, ...next.anchor };
    if (next?.offset) offset = { ...offset, ...next.offset };
    if (next?.size) baseSize = { ...baseSize, ...next.size };
    updateWidgetSize();
    updateWidgetPosition();
  };

  // ===== DOM refs =====
  var btn, overlay, iframe, mobClose;
  var swallowNextBtnClick = false;

  // ===== 스타일 주입 =====
  function injectStyles() {
    if (document.getElementById("mycbw-style")) return;
    var style = document.createElement("style");
    style.id = "mycbw-style";
    var size = getResponsiveSize();
    style.textContent = `
      @keyframes mycbw-pop {
        0%   { transform: translateY(16px) scale(.92); opacity: 0; }
        60%  { transform: translateY(-4px) scale(1.03); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      .mycbw-btn {
        position: fixed; width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(116deg, #D5D9EB -10%, #717BBC 50%, #3E4784 90%);
        color: #fff; display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 10000000; box-shadow: 0 4px 12px rgba(0,0,0,.2);
        font-size: 24px; font-family: Arial, sans-serif;
        animation: mycbw-pop 520ms cubic-bezier(.2,.75,.2,1);
        transition: transform 220ms ease, box-shadow 220ms ease;
      }
      .mycbw-btn:hover { transform: translateY(-2px) scale(1.04); }
      .mycbw-btn:active { transform: translateY(0) scale(.98); }
      
      @media (max-width: 768px) {
        .mycbw-btn {
          /* 모바일에서 safe area 고려 */
          margin-bottom: env(safe-area-inset-bottom);
          margin-right: env(safe-area-inset-right);
          margin-left: env(safe-area-inset-left);
        }
      }

      .mycbw-overlay {
        position: fixed; inset: 0; background: transparent;
        opacity: 0; visibility: hidden; pointer-events: none;
        z-index: 2147483645; transition: opacity 220ms ease;
      }
      .mycbw-overlay.open { opacity: 1; visibility: visible; }

      .mycbw-frame {
        position: fixed; /* 위치는 JS에서만 제어 */
        width: ${size.width}px; height: ${size.height}px;
        border: 1px solid #ddd; border-radius: 16px; background: #fff; overflow: hidden;
        z-index: 2147483646; box-shadow: 0 14px 40px rgba(0,0,0,.28);
        opacity: 0; transform: translateY(12px) scale(.98); visibility: hidden; pointer-events: none;
        transition: opacity 260ms cubic-bezier(.2,.75,.2,1), transform 260ms cubic-bezier(.2,.75,.2,1);
        will-change: opacity, transform;
        box-sizing: border-box; /* safe area inset padding을 고려한 박스 크기 */
      }
      .mycbw-frame.open {
        opacity: 1; transform: translateY(0) scale(1); visibility: visible; pointer-events: auto;
      }
      .mycbw-frame.closing {
        opacity: 0; transform: translateY(12px) scale(.98); visibility: visible; pointer-events: none;
      }

      .mycbw-btn .mycbw-btn-close { display: none; }
      .mycbw-btn.open .mycbw-btn-close { display: flex; }
      
      @media (max-width: 768px) {
        .mycbw-frame {
          inset: 0 !important;
          width: 100vw !important;
          height: 100dvh !important; /* dynamic viewport height로 브라우저 UI 고려 */
          max-height: -webkit-fill-available !important; /* iOS Safari 지원 */
          border-radius: 0 !important; border: 0 !important;
          transform: translateY(0) scale(1);
          /* Safe area inset 적용 */
          padding-top: env(safe-area-inset-top);
          padding-bottom: env(safe-area-inset-bottom);
          padding-left: env(safe-area-inset-left);
          padding-right: env(safe-area-inset-right);
        }
        .mycbw-mob-close.open { display: block; }
      }

      .mycbw-mob-close {
        position: fixed;
        /* Safe area를 고려한 위치 설정 */
        top: calc(12px + env(safe-area-inset-top));
        right: calc(12px + env(safe-area-inset-right));
        width: 40px; height: 40px; border: 0; border-radius: 9999px;
        background: rgba(0,0,0,.55); color: #fff; font-size: 26px; line-height: 40px; text-align: center;
        z-index: 2147483647; display: none; cursor: pointer;
        box-shadow: 0 6px 18px rgba(0,0,0,.25);
        -webkit-tap-highlight-color: transparent;
      }
      .mycbw-mob-close:active { transform: scale(.96); }
    `;
    document.head.appendChild(style);
  }

  function isMobile() {
    return window.matchMedia && window.matchMedia("(max-width: 768px)").matches;
  }

  // ===== 위치 적용 =====
  function applyPositionTo(el, extra = { yLift: 0 }) {
    if (!el) return;
    el.style.left = el.style.right = el.style.top = el.style.bottom = "";

    // X축
    if (anchor.x === "left") el.style.left = offset.x + "px";
    else el.style.right = offset.x + "px";

    // Y축
    var oy = (offset.y || 0) + (extra.yLift || 0);
    if (anchor.y === "top") el.style.top = oy + "px";
    else el.style.bottom = oy + "px";
  }

  function updateWidgetPosition() {
    applyPositionTo(btn, { yLift: 0 });
    applyPositionTo(iframe, { yLift: 70 }); // 버튼 위로 살짝 띄움
  }

  // ===== 크기 반영 =====
  function updateWidgetSize() {
    var newSize = getResponsiveSize();
    if (iframe) {
      iframe.style.width = newSize.width + "px";
      iframe.style.height = newSize.height + "px";
    }
  }

  // ===== 메인 런 =====
  function run() {
    injectStyles();

    // 버튼
    btn = document.createElement("div");
    btn.className = "mycbw-btn";
    // 위치는 JS로만 제어
    btn.innerHTML = `
      <svg width="45" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFAEB" />
            <stop offset="100%" stop-color="#FDB022" />
          </linearGradient>
        </defs>
        <path d="M41.3059 24.9773C40.1508 16.4013 32.6091 10.2066 24.0547 10.6452C24.1859 10.381 
            24.3266 10.122 24.4777 9.86898C24.9059 10.122 25.3677 10.311 25.8503 10.4328C27.747 10.9612 
            29.7291 9.92855 30.3835 8.07141C30.7003 7.0483 31.012 5.22224 31.8191 4.44261L33.0278 3.09055C33.2298 
            2.85916 33.2056 2.50776 32.9742 2.30573C32.8896 2.23234 32.7852 2.18572 32.6738 2.17277C32.3837 2.14255 
            25.5516 1.46825 23.4132 4.34677C22.4887 5.4804 22.5767 7.62073 23.6394 9.12647C23.3157 9.64882 23.0308 10.1945 
            22.7865 10.7583C13.9438 11.8798 7.54243 19.8411 8.41091 28.7711C8.61292 30.8518 9.20773 32.8747 10.1634 34.7336C10.3136 
            35.0401 10.3455 35.3915 10.2515 35.7204L8.67162 41.651C8.46616 42.4186 8.92198 43.2077 9.69031 
            43.4132C9.93376 43.4779 10.1902 43.4779 10.4336 43.4132L16.3627 41.8323C16.6916 41.7382 17.043 41.7693 17.3503 
            41.9204C19.6855 43.1248 22.2754 43.7516 24.9033 43.7499C25.6388 43.7499 26.3735 43.7016 27.103 43.6057C36.1684 42.384 42.5283 
            34.0446 41.3068 24.9773H41.3059ZM19.5983 23.387C18.3466 23.387 17.3313 22.3717 17.3313 21.1197C17.3313 19.8678 18.3466 18.8525 
            19.5983 18.8525C20.8501 18.8525 21.8654 19.8678 21.8654 21.1197C21.8654 22.3717 20.8501 23.387 19.5983 23.387ZM24.3396 4.99604C25.5637 
            3.34697 29.2595 3.113 31.4902 3.18897L31.037 3.69578C30.0718 4.64896 29.73 6.5061 29.3613 7.76232C29.3001 7.97903 29.1956 8.1802 29.0549 
            8.35547C27.7996 9.90697 26.225 9.52967 25.1252 8.93911C26.0774 7.59482 27.3585 6.51646 28.846 5.80848C29.13 5.69797 29.2716 5.37765 
            29.1611 5.0936C29.0506 4.80955 28.7303 4.66795 28.4463 4.77933C26.8198 5.52788 25.4118 6.6805 24.356 8.12667C24.343 8.0999 24.3266 8.07573 
            24.3154 8.04896C23.7724 6.74957 23.781 5.7515 24.3413 4.9969L24.3396 4.99604ZM30.4914 24.5197C30.4249 24.6838 29.7913 26.1317 
            27.0995 26.389C24.4078 26.6463 23.5117 25.3451 23.4176 25.1958C23.333 25.0602 23.3053 24.8962 23.3416 24.7408C23.3779 24.5854 
            23.4737 24.4498 23.6092 24.3652C23.7448 24.2806 23.9088 24.253 24.0642 24.2892C24.2196 24.3255 24.3551 24.4213 24.4397 24.5569C24.4552 
            24.5776 25.0423 25.3754 26.9847 25.1889C28.9271 25.0032 29.3527 24.1088 29.37 24.0717C29.4347 23.9275 29.5521 23.8144 29.6989 
            23.7557C29.8448 23.6969 30.0088 23.6961 30.1547 23.7557C30.2997 23.8135 30.4163 23.9257 30.4793 24.0691C30.5423 24.2124 30.5466 24.3738 
            30.4914 24.5197ZM30.1789 22.0919C28.9271 22.0919 27.9119 21.0766 27.9119 19.8247C27.9119 18.5728 28.9271 17.5574 30.1789 17.5574C31.4307 
            17.5574 32.4459 18.5728 32.4459 19.8247C32.4459 21.0766 31.4307 22.0919 30.1789 22.0919Z"
          fill="url(#iconGradient)"
        />
      </svg>`;
    document.body.appendChild(btn);

    // 버튼 내부 클로즈(작은 X)
    var btnClose = document.createElement("div");
    btnClose.className = "mycbw-btn-close";
    btnClose.innerHTML = "&times;";
    Object.assign(btnClose.style, {
      position: "absolute",
      top: "0",
      right: "0",
      width: "20px",
      height: "20px",
      borderRadius: "6px",
      background: "linear-gradient(116deg, #717BBC 50%, #3E4784 90%)",
      color: "white",
      fontSize: "20px",
      alignItems: "center",
      justifyContent: "center",
      boxShadow: "0 2px 6px rgba(0,0,0,.2)",
      cursor: "pointer",
    });
    btnClose.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      swallowNextBtnClick = true;
      closePanel();
    });
    btnClose.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.appendChild(btnClose);

    // 모바일 상단 닫기 버튼
    mobClose = document.createElement("button");
    mobClose.className = "mycbw-mob-close";
    mobClose.setAttribute("aria-label", "닫기");
    mobClose.innerHTML = "&times;";
    mobClose.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    });
    mobClose.addEventListener("touchstart", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    mobClose.addEventListener("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    });
    document.body.appendChild(mobClose);

    // 오버레이
    overlay = document.createElement("div");
    overlay.className = "mycbw-overlay";
    document.body.appendChild(overlay);

    // 패널(iframe)
    iframe = document.createElement("iframe");
    iframe.className = "mycbw-frame";
    iframe.setAttribute(
      "allow",
      "clipboard-read; clipboard-write; microphone; camera"
    );

    // 세션 전송/하트비트
    function getSession() {
      var m = document.cookie.match(/(?:^|;\s*)PHPSESSID=([^;]+)/);
      return m ? m[1] : null;
    }
    var targetOrigin;
    try {
      targetOrigin = new URL(botUrl).origin;
    } catch (_) {
      targetOrigin = "*";
    }

    function sendSession(extra = {}) {
      if (!iframe.contentWindow) return;
      var session = getSession();
      iframe.contentWindow.postMessage(
        {
          type: "SET_SESSION",
          phpsessid: session,
          mode: "chat-user-mode",
          ...extra,
        },
        targetOrigin
      );
    }

    var heartbeatId = null,
      heartbeatStarted = false;
    function startHeartbeat() {
      if (heartbeatStarted) return;
      heartbeatStarted = true;
      if (!heartbeatId) {
        heartbeatId = setInterval(sendSession, 10_000);
        window[FLAG]._hb = heartbeatId;
      }
    }
    function stopHeartbeat() {
      if (heartbeatId) {
        clearInterval(heartbeatId);
        heartbeatId = null;
      }
      heartbeatStarted = false;
    }

    iframe.addEventListener("load", function () {
      /* no-op (요구사항) */
    });

    window.addEventListener("message", function (e) {
      // 보안 권장: origin 화이트리스트
      // const ALLOWED = ["https://chat.growxd.co.kr", "https://admin.growxd.co.kr"];
      // if (!ALLOWED.includes(e.origin)) return;

      var d = e.data;

      // iFrame 쪽에서 준비되었다고 알림
      if (targetOrigin !== "*" && e.origin !== targetOrigin) {
        // 아래의 WIDGET_CONFIG는 어드민 도메인에서 올 수도 있으니 여기서 바로 return하지 않음
      }
      if (d && d.type === "WIDGET_READY") {
        if (heartbeatStarted) sendSession();
      }

      // ===== 핵심: 원격 위치/크기 설정 수신 =====
      if (d && d.type === "WIDGET_CONFIG" && d.payload) {
        if (d.payload.anchor) anchor = { ...anchor, ...d.payload.anchor };
        if (d.payload.offset) offset = { ...offset, ...d.payload.offset };
        if (d.payload.size) {
          baseSize = { ...baseSize, ...d.payload.size };
          updateWidgetSize();
        }
        updateWidgetPosition();
      }
    });

    iframe.src = botUrl;
    document.body.appendChild(iframe);

    // 최초 위치/크기 적용
    updateWidgetSize();
    updateWidgetPosition();

    // 열림/닫힘
    var isOpen = false;
    function openPanel() {
      if (isOpen) return;
      isOpen = true;
      btn.classList.add("open");
      btn.setAttribute("aria-expanded", "true");
      overlay.classList.add("open");
      iframe.classList.remove("closing");
      iframe.classList.add("open");
      if (isMobile()) {
        // 모바일에서 배경 스크롤 방지
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        mobClose.classList.add("open");
      }
      sendSession({ modal: true });
      startHeartbeat();
    }
    function closePanel() {
      if (!isOpen) return;
      isOpen = false;
      btn.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");
      sendSession({ modal: false });
      iframe.classList.add("closing");
      // 모바일에서 설정한 스타일 모두 리셋
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
      mobClose.classList.remove("open");
      var onEnd = function (ev) {
        if (ev && ev.target !== iframe) return;
        iframe.classList.remove("open");
        iframe.classList.remove("closing");
        overlay.classList.remove("open");
        iframe.removeEventListener("transitionend", onEnd);
      };
      iframe.addEventListener("transitionend", onEnd);
    }

    // 버튼 이벤트
    btn.addEventListener("click", function (e) {
      if (swallowNextBtnClick) {
        swallowNextBtnClick = false;
        e.preventDefault();
        e.stopPropagation();
        return;
      }
      isOpen ? closePanel() : openPanel();
    });
    btn.addEventListener("touchstart", function (e) {
      e.preventDefault();
      e.stopPropagation();
    });
    btn.addEventListener("touchend", function (e) {
      e.preventDefault();
      e.stopPropagation();
      if (swallowNextBtnClick) {
        swallowNextBtnClick = false;
        return;
      }
      isOpen ? closePanel() : openPanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });

    // 리사이즈: 크기 + 위치 재적용
    var resizeTimeout;
    window.addEventListener("resize", function () {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(function () {
        updateWidgetSize();
        updateWidgetPosition();
      }, 250);

      if (isOpen && isMobile()) {
        document.documentElement.style.overflow = "hidden";
        document.body.style.overflow = "hidden";
        document.body.style.position = "fixed";
        document.body.style.width = "100%";
        document.body.style.height = "100%";
        mobClose.classList.add("open");
      } else {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
        document.body.style.position = "";
        document.body.style.width = "";
        document.body.style.height = "";
        mobClose.classList.remove("open");
      }
    });

    // 페이지 이탈 시 하트비트 정리
    window.addEventListener("beforeunload", function () {
      stopHeartbeat();
    });
  }

  // teardown
  window[FLAG].teardown = function () {
    try {
      clearInterval(window[FLAG]._hb);
    } catch {}
    try {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    } catch {}
    try {
      btn && btn.remove();
    } catch {}
    try {
      overlay && overlay.remove();
    } catch {}
    try {
      iframe && iframe.remove();
    } catch {}
    try {
      document.querySelector(".mycbw-mob-close")?.remove();
    } catch {}
    try {
      document.getElementById("mycbw-style")?.remove();
    } catch {}
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
