import React from "react";
import { useNavigate } from "react-router-dom";

const Header = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
  localStorage.removeItem("token");
  localStorage.removeItem("user"); // remove user data
  navigate("/login");
};

  return (
    <header className="bg-blue-600 text-white px-4 py-3 flex items-center justify-between">
      <h1 className="text-xl font-semibold">Travel Platform</h1>
      <button
        onClick={handleLogout}
        className="bg-white text-blue-600 px-3 py-1 rounded hover:bg-gray-200 text-sm"
      >
        Logout
      </button>
    </header>
  );
};

export default Header;
