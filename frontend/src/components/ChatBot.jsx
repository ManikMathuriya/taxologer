import { useMemo, useState } from "react";

const quickReplies = [
  "What documents are required?",
  "What is ITR 1?",
  "How can I upload documents?",
  "How do I track my status?",
  "How do I pay?",
  "How can I contact support?",
];

function getBotReply(message) {
  const text = message.toLowerCase().trim();

  if (
    text.includes("hello") ||
    text.includes("hi") ||
    text.includes("hey")
  ) {
    return "Hi 👋 I’m your Tax Assistant. You can ask about ITR filing, documents, payment, tracking, or support.";
  }

  if (
    text.includes("document") ||
    text.includes("pan") ||
    text.includes("aadhaar") ||
    text.includes("form16") ||
    text.includes("form 16")
  ) {
    return "For most users, common documents include PAN, Aadhaar, and Form 16. In some cases, extra documents may be needed depending on your filing type.";
  }

  if (
    text.includes("itr 1") ||
    text.includes("salaried") ||
    text.includes("salary")
  ) {
    return "ITR 1 is generally suitable for salaried individuals with a simpler income profile. On your website, the ITR 1 (Salaried person) package is the beginner-friendly option.";
  }

  if (
    text.includes("business") ||
    text.includes("itr for business") ||
    text.includes("balance sheet") ||
    text.includes("tds")
  ) {
    return "The business package is designed for users who need deeper support like computation, TDS info, balance sheet help, verified documents, and support assistance.";
  }

  if (
    text.includes("upload") ||
    text.includes("camera") ||
    text.includes("photo")
  ) {
    return "You can upload documents in two ways: capture a live document photo using your camera, or upload a saved document photo/PDF from your device.";
  }

  if (
    text.includes("track") ||
    text.includes("status") ||
    text.includes("progress")
  ) {
    return "After creating your request, you can track progress from Pending → Documents Submitted → Under Review → Document Verified → Completed.";
  }

  if (
    text.includes("payment") ||
    text.includes("pay") ||
    text.includes("razorpay") ||
    text.includes("cash")
  ) {
    return "You can usually complete payment online or choose Cash on Delivery, depending on the request flow available in your dashboard.";
  }

  if (
    text.includes("price") ||
    text.includes("cost") ||
    text.includes("package") ||
    text.includes("499") ||
    text.includes("599")
  ) {
    return "Current packages are: ITR 1 (Salaried person) at ₹499, and ITR (For Business Individual) at ₹599.";
  }

  if (
    text.includes("support") ||
    text.includes("whatsapp") ||
    text.includes("contact") ||
    text.includes("help")
  ) {
    return "You can use the WhatsApp button on the website for direct support. It’s the fastest way to connect with your team.";
  }

  if (
    text.includes("refund") ||
    text.includes("processing time") ||
    text.includes("time")
  ) {
    return "Processing time depends on document completeness and review status. Uploading clear documents helps speed things up.";
  }

  return "I can help with packages, documents, uploads, payments, tracking, and support. Try asking something like: 'What documents are required?'";
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState([
    {
      text: "Hi! I’m your Tax Assistant. Ask me about tax filing, documents, packages, payment, or service tracking.",
      sender: "bot",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const sendMessage = async (textToSend) => {
    const cleanText = textToSend.trim();
    if (!cleanText) return;

    const userMessage = {
      text: cleanText,
      sender: "user",
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/chatbot/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ message: cleanText }),
      });

      const data = await res.json();

      const botMessage = {
        text: data.reply,
        sender: "bot",
      };

      setMessages((prev) => [...prev, botMessage]);

    } catch (error) {
      setMessages((prev) => [
        ...prev,
        {
          text: "Something went wrong. Please try again.",
          sender: "bot",
        },
      ]);
    }

    setInput("");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <>
      <button
        onClick={() => setOpen((prev) => !prev)}
        className="fixed bottom-5 left-5 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-full shadow-xl z-50"
      >
        🤖 Chat
      </button>

      {open && (
        <div className="fixed bottom-20 left-5 w-[340px] max-w-[calc(100vw-24px)] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col overflow-hidden z-50">
          <div className="bg-blue-600 text-white px-4 py-3">
            <h3 className="font-semibold">Tax Assistant</h3>
            <p className="text-xs text-blue-100 mt-1">
              Quick help for filing, documents, and support
            </p>
          </div>

          <div className="p-3 border-b bg-slate-50">
            <div className="flex flex-wrap gap-2">
              {quickReplies.map((item) => (
                <button
                  key={item}
                  onClick={() => sendMessage(item)}
                  className="text-xs bg-white border border-slate-300 rounded-full px-3 py-1 hover:bg-slate-100"
                >
                  {item}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 h-80 overflow-y-auto p-3 space-y-3 bg-white">
            {messages.map((msg, index) => (
              <div
                key={index}
                className={`max-w-[85%] px-3 py-2 rounded-2xl text-sm ${
                  msg.sender === "user"
                    ? "ml-auto bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-800"
                }`}
              >
                {msg.text}
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="border-t p-3 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about tax filing..."
              className="flex-1 border border-slate-300 rounded-xl px-3 py-2 outline-none focus:border-blue-600"
            />
            <button
              type="submit"
              disabled={!canSend}
              className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 disabled:bg-slate-400"
            >
              Send
            </button>
          </form>
        </div>
      )}
    </>
  );
}