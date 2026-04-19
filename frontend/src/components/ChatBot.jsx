import { useEffect, useState } from "react";

export default function ChatBot() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const el = document.getElementById("chatbot-btn");
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
      id="chatbot-btn"
      onClick={() => setOpen(!open)}
      style={{ position: "fixed", bottom: 20, left: 20 }}
      className="bg-blue-600 text-white px-4 py-3 rounded-full"
    >
      💬
    </button>
  );
}