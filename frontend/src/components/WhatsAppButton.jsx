import { useEffect } from "react";

export default function WhatsAppButton() {

  useEffect(() => {
    const el = document.getElementById("wa-btn");
    if (!el) return;

    let offsetX, offsetY;

    el.onmousedown = function (e) {
      offsetX = e.clientX - el.offsetLeft;
      offsetY = e.clientY - el.offsetTop;

      document.onmousemove = function (e) {
        el.style.left = e.clientX - offsetX + "px";
        el.style.top = e.clientY - offsetY + "px";
      };

      document.onmouseup = function () {
        document.onmousemove = null;
      };
    };
  }, []);

  return (
    <button
      id="wa-btn"
      style={{ position: "fixed", bottom: 80, right: 20 }}
      className="bg-green-500 text-white px-4 py-3 rounded-full"
    >
      WhatsApp
    </button>
  );
}