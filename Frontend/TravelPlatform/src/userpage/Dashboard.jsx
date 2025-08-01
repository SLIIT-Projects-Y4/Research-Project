import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

const Dashboard = () => {
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-grow p-6">
        <h2 className="text-2xl font-semibold mb-4">
          Welcome, {user?.name || "User"}!
        </h2>
        <p className="text-gray-700">Email: {user?.email}</p>
        <p className="text-gray-700">Country: {user?.country}</p>
        {/* Add more user info as needed */}
      </main>
      <Footer />
    </div>
  );
};

export default Dashboard;
