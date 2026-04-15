import React from "react";
import { useNavigate } from "react-router-dom";

function Navbar({ title, onMenuClick }) {
  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("role");
  navigate("/login");
};

  return (
    <header className="bg-white border-b px-4 md:px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuClick}
          className="md:hidden bg-gray-100 px-3 py-2 rounded-lg"
        >
          ☰
        </button>

        <h2 className="text-xl md:text-2xl font-semibold text-gray-800">
          {title}
        </h2>
      </div>

      <button
        onClick={handleLogout}
        className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600"
      >
        Logout
      </button>
    </header>
  );
}

export default Navbar;