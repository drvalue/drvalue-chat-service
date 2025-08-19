// widget.js (순수 JS)
(function () {
  if (window.__MY_CHATBOT_WIDGET__) return;
  window.__MY_CHATBOT_WIDGET__ = true;

  var cfg = window.MyChatbotWidget || {};
  var botUrl = cfg.url || "http://115.68.178.142:90/user/home";
  var color = cfg.color || "#4a90e2";
  var side = cfg.position === "left" ? "left" : "right";
  var size = cfg.size || { width: 400, height: 600 };

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
    btn.innerText = "💬";
    applyStyles(btn, {
      position: "fixed",
      bottom: "20px",
      width: "60px",
      height: "60px",
      borderRadius: "50%",
      background: color,
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
    document.body.appendChild(btn);

    // iframe
    var iframe = document.createElement("iframe");
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
