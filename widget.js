// widget.js (순수 JS)
(function () {
  if (window.__MY_CHATBOT_WIDGET__) return;
  window.__MY_CHATBOT_WIDGET__ = true;

  var cfg = window.MyChatbotWidget || {};
  var botUrl = cfg.url || "http://115.68.178.142:90/user/home";
  var color = cfg.color || "#F5FAFF";
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
      background: "black", // 배경 검정
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

    // 여기에 SVG 넣기
    btn.innerHTML = `
      <svg width="30" height="30" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg">
        <path d="M41.3059 24.9773C40.1508 16.4013 ... 30.1789 22.0919Z" fill="#ffbb00"/>
      </svg>
    `;

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
