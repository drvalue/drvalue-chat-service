(function () {
  const FLAG = "__MY_CHATBOT_WIDGET__";
  const VERSION = "2025-08-27-01";

  if (window[FLAG]?.teardown) {
    try {
      window[FLAG].teardown();
    } catch (e) {
      console.warn("[widget] old teardown error:", e);
    }
  }
  window[FLAG] = { version: VERSION };

  var cfg = window.MyChatbotWidget || {};
  var botUrl = cfg.url || "https://chat.growxd.co.kr/user/home";
  var side = cfg.position === "left" ? "left" : "right";
  var size = cfg.size || { width: 500, height: 720 };

  var btn, overlay, iframe;

  function injectStyles() {
    if (document.getElementById("mycbw-style")) return;
    var style = document.createElement("style");
    style.id = "mycbw-style";
    style.textContent = `
      @keyframes mycbw-pop {
        0%   { transform: translateY(16px) scale(.92); opacity: 0; }
        60%  { transform: translateY(-4px) scale(1.03); opacity: 1; }
        100% { transform: translateY(0) scale(1); opacity: 1; }
      }
      .mycbw-btn {
        position: fixed; bottom: 20px; width: 60px; height: 60px; border-radius: 50%;
        background: linear-gradient(116deg, #D5D9EB -10%, #717BBC 50%, #3E4784 90%);
        color: #fff; display: flex; align-items: center; justify-content: center;
        cursor: pointer; z-index: 2147483647; box-shadow: 0 4px 12px rgba(0,0,0,.2);
        font-size: 24px; font-family: Arial, sans-serif;
        animation: mycbw-pop 520ms cubic-bezier(.2,.75,.2,1);
        transition: transform 220ms ease, box-shadow 220ms ease;
      }
      .mycbw-btn:hover { transform: translateY(-2px) scale(1.04); }
      .mycbw-btn:active { transform: translateY(0) scale(.98); }

      /* 투명 오버레이(클릭 막지 않음) */
      .mycbw-overlay {
        position: fixed; inset: 0; background: transparent;
        opacity: 0; visibility: hidden; pointer-events: none;
        z-index: 2147483645; transition: opacity 220ms ease;
      }
      .mycbw-overlay.open { opacity: 1; visibility: visible; }

      /* 패널: 기본은 숨김 상태 */
      .mycbw-frame {
        position: fixed; bottom: 90px;
        width: ${size.width}px; height: ${size.height}px;
        border: 1px solid #ddd; border-radius: 16px; background: #fff; overflow: hidden;
        z-index: 2147483646; box-shadow: 0 14px 40px rgba(0,0,0,.28);
        opacity: 0; transform: translateY(12px) scale(.98); visibility: hidden; pointer-events: none;
        transition: opacity 260ms cubic-bezier(.2,.75,.2,1), transform 260ms cubic-bezier(.2,.75,.2,1);
        will-change: opacity, transform;
      }
      /* 열림 상태: 보이면서 제자리 */
      .mycbw-frame.open {
        opacity: 1; transform: translateY(0) scale(1); visibility: visible; pointer-events: auto;
      }
      /* 닫힘 애니 중: 눈에 보이게 두고(visibility:visible), opacity/transform만 원래 위치로 */
      .mycbw-frame.closing {
        opacity: 0; transform: translateY(12px) scale(.98); visibility: visible; pointer-events: none;
      }

      .mycbw-btn .mycbw-btn-close { display: none; }
      .mycbw-btn.open .mycbw-btn-close { display: flex; }
    `;
    document.head.appendChild(style);
  }

  function run() {
    injectStyles();

    // 버튼
    btn = document.createElement("div");
    btn.className = "mycbw-btn";
    btn.style[side] = "20px";
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

    var btnClose = document.createElement("div");
    btnClose.className = "mycbw-btn-close";
    btnClose.innerHTML = "&times;";
    btnClose.style.position = "absolute";
    btnClose.style.top = "0";
    btnClose.style.right = "0";
    btnClose.style.width = "20px";
    btnClose.style.height = "20px";
    btnClose.style.borderRadius = "6px";
    btnClose.style.background =
      "linear-gradient(116deg, #717BBC 50%, #3E4784 90%)";
    btnClose.style.color = "white";
    btnClose.style.fontSize = "20px";
    btnClose.style.alignItems = "center";
    btnClose.style.justifyContent = "center";
    btnClose.style.boxShadow = "0 2px 6px rgba(0,0,0,.2)";
    btnClose.style.cursor = "pointer";

    // 이벤트
    btnClose.addEventListener("pointerdown", function (e) {
      e.preventDefault();
      e.stopPropagation();
      closePanel();
    });

    // 일부 환경에서 click이 추가로 발생할 수 있어 부모 토글까지 차단만 함
    btnClose.addEventListener("click", function (e) {
      e.preventDefault();
      e.stopPropagation();
      // closePanel() 호출 안 함 (중복 방지)
    });

    btn.appendChild(btnClose);

    // 오버레이
    overlay = document.createElement("div");
    overlay.className = "mycbw-overlay";
    document.body.appendChild(overlay);

    // 패널(iframe)
    iframe = document.createElement("iframe");
    iframe.className = "mycbw-frame";
    iframe.style[side] = "20px";

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

    // 하트비트: 처음 열렸을 때부터 시작, 이후엔 계속 유지
    var heartbeatId = null;
    var heartbeatStarted = false;
    function startHeartbeat() {
      if (heartbeatStarted) return;
      heartbeatStarted = true;
      if (!heartbeatId) {
        heartbeatId = setInterval(sendSession, 10_000);
        window[FLAG]._hb = heartbeatId; // ← 전역 플래그에 보관
      }
    }
    function stopHeartbeat() {
      if (heartbeatId) {
        clearInterval(heartbeatId);
        heartbeatId = null;
      }
      heartbeatStarted = false;
    }

    // iframe 로드 시에는 전송/하트비트 시작하지 않음 (요구사항)
    iframe.addEventListener("load", function () {
      // no-op
    });

    // 위젯 준비 신호: 하트비트가 시작된 이후라면 1회 더 전송(안전)
    window.addEventListener("message", function (e) {
      if (targetOrigin !== "*" && e.origin !== targetOrigin) return;
      if (e.data && e.data.type === "WIDGET_READY") {
        if (heartbeatStarted) sendSession();
      }
    });

    iframe.setAttribute(
      "allow",
      "clipboard-read; clipboard-write; microphone; camera"
    );
    iframe.src = botUrl;
    document.body.appendChild(iframe);

    // 열림/닫힘 토글
    var isOpen = false;

    function openPanel() {
      if (isOpen) return;
      isOpen = true;
      overlay.classList.add("open");
      iframe.classList.remove("closing");
      iframe.classList.add("open");

      // 플로팅 버튼: 열림 상태 클래스 + 접근성 상태
      btn.classList.add("open");
      btn.setAttribute("aria-expanded", "true");

      // 열 때: modal:true
      sendSession({ modal: true });
      startHeartbeat();
    }

    function closePanel() {
      if (!isOpen) return;
      isOpen = false;

      // 닫을 때: modal:false
      sendSession({ modal: false });
      iframe.classList.add("closing");

      // 플로팅 버튼: 닫힘 상태 클래스 + 접근성 상태
      btn.classList.remove("open");
      btn.setAttribute("aria-expanded", "false");

      var onEnd = function (ev) {
        if (ev && ev.target !== iframe) return;
        iframe.classList.remove("open");
        iframe.classList.remove("closing");
        overlay.classList.remove("open");
        iframe.removeEventListener("transitionend", onEnd);
      };
      iframe.addEventListener("transitionend", onEnd);
    }

    btn.addEventListener("click", function () {
      isOpen ? closePanel() : openPanel();
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closePanel();
    });

    // 페이지 이탈 시 정리
    window.addEventListener("beforeunload", function () {
      // 페이지 떠날 때만 정리
      stopHeartbeat();
    });
  }

  window[FLAG].teardown = function () {
    try {
      clearInterval(window[FLAG]._hb);
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
      document.getElementById("mycbw-style")?.remove();
    } catch {}
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
