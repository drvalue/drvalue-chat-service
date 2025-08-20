// widget.js (순수 JS)
(function () {
  if (window.__MY_CHATBOT_WIDGET__) return;
  window.__MY_CHATBOT_WIDGET__ = true;

  var cfg = window.MyChatbotWidget || {};
  var botUrl = cfg.url || "http://115.68.178.142:90/user/home";
  var side = cfg.position === "left" ? "left" : "right";
  var size = cfg.size || { width: 430, height: 650 };

  function applyStyles(el, styles) {
    for (var k in styles) {
      if (!Object.prototype.hasOwnProperty.call(styles, k)) continue;
      var v = styles[k];
      if (v == null) continue;
      el.style[k] = v;
    }
  }

  function run() {
    // 버튼
    var btn = document.createElement("div");
    applyStyles(btn, {
      position: "fixed",
      bottom: "20px",
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      background:
        "linear-gradient(116deg, #D5D9EB -10%, #717BBC 50%, #3E4784 90%)",
      color: "#fff",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      cursor: "pointer",
      zIndex: "2147483647",
      boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
      fontSize: "24px",
      fontFamily: "Arial, sans-serif",
    });
    btn.style[side] = "20px";

    btn.innerHTML = `
      <svg width="45" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="iconGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="#FFFAEB" /> <stop offset="100%" stop-color="#FDB022" />
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

    // iframe
    var iframe = document.createElement("iframe");
    var match = document.cookie.match(/(?:^|;\s*)PHPSESSID=([^;]+)/);
    var session = match ? match[1] : null;

    var targetOrigin;
    try {
      targetOrigin = new URL(botUrl).origin;
    } catch (_) {
      targetOrigin = "*";
    }

    function sendSession() {
      if (!iframe.contentWindow) return;
      iframe.contentWindow.postMessage(
        { type: "SET_SESSION", phpsessid: session },
        targetOrigin
      );
    }

    // iframe이 완전히 로드된 뒤 한 번 전송
    iframe.addEventListener("load", function () {
      sendSession();
    });

    // iframe(React)이 "준비됨"을 알려오면 다시 전송 (리스너 등록 후 확실히 전달)
    window.addEventListener("message", function (e) {
      if (targetOrigin !== "*" && e.origin !== targetOrigin) return;
      if (e.data && e.data.type === "WIDGET_READY") {
        sendSession();
      }
    });

    iframe.src = botUrl;
    iframe.setAttribute(
      "allow",
      "clipboard-read; clipboard-write; microphone; camera"
    );
    applyStyles(iframe, {
      position: "fixed",
      bottom: "90px",
      width: String(size.width) + "px",
      height: String(size.height) + "px",
      border: "1px solid #ddd",
      borderRadius: "12px",
      display: "none",
      zIndex: "2147483646",
      boxShadow: "0 4px 20px rgba(0,0,0,0.3)",
      background: "#fff",
      overflow: "hidden",
    });
    iframe.style[side] = "20px";
    document.body.appendChild(iframe);

    // 토글
    btn.addEventListener("click", function () {
      iframe.style.display = iframe.style.display === "none" ? "block" : "none";
    });

    // ESC로 닫기
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") iframe.style.display = "none";
    });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run, { once: true });
  } else {
    run();
  }
})();
