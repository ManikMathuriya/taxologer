export default function WhatsAppButton() {
  const phone = "919999999999"; // 👉 replace with your number

  const handleClick = () => {
    const message = encodeURIComponent(
      "Hi, I need help with tax filing"
    );

    window.open(`https://wa.me/${phone}?text=${message}`, "_blank");
  };

  return (
    <button
      onClick={handleClick}
      className="fixed bottom-5 right-5 bg-green-500 hover:bg-green-600 text-white px-5 py-3 rounded-full shadow-xl flex items-center gap-2 z-50"
    >
      💬 WhatsApp
    </button>
  );
}