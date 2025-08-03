import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input, Button } from '@mantine/core';
import { Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { toast } from 'react-toastify';
import LoginImage from '../components/features/user-onboard/assets/Cartoon.webp'

// --- Social Login Button Component ---
const SocialButton = ({ icon, label }) => (
  <button
    type="button"
    className="flex-1 flex items-center justify-center gap-2 py-3 px-4 border border-gray-300 rounded-lg hover:bg-gray-50 transition-all duration-200"
  >
    {icon}
    <span className="font-medium text-gray-700">{label}</span>
  </button>
);

// --- Main Login Page Component ---
const LoginPage = () => {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Basic validation before sending to API
    if (!formData.email || !formData.password) {
      return toast.error("Please enter both email and password.");
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/api/users/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Login failed. Please check your credentials.");
      } else {
        // Store user data and token
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify(data.user));

        // Show success message
        toast.success(data.message || "Login successful! Redirecting...");

        // Dispatch events to notify other components (like Navbar) immediately
        window.dispatchEvent(new Event("userStateChange"));
        window.dispatchEvent(new Event("storage"));

        // Small delay to let the user see the toast, then navigate
        setTimeout(() => {
          navigate("/dashboard");
        }, 1000);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Network error or server is down. Please try again later.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="w-full max-w-5xl grid lg:grid-cols-2 bg-white rounded-2xl shadow-2xl overflow-hidden">

        {/* Left Visual Panel */}
        <div className="hidden lg:flex flex-col items-center justify-center p-12 bg-[#FFF7F5]">
          <img
            src={LoginImage}
            alt="Illustration of a character planning a task"
            className="w-full"
            onError={(e) => { e.target.onerror = null; e.target.src='https://placehold.co/400x400/FFF7F5/333333?text=Illustration'; }}
          />
        </div>

        {/* Right Form Panel */}
        <div className="p-8 sm:p-12 flex flex-col justify-center">
          <div className="w-full max-w-md mx-auto">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Login</h1>
            <p className="text-gray-600 mb-8">Welcome back! Please enter your details.</p>

            <form onSubmit={handleSubmit} className="space-y-6">
              <Input.Wrapper label="Email" required>
                <Input
                  icon={<Mail size={16} />}
                  name="email"
                  type="email"
                  placeholder="daniel21fisher@gmail.com"
                  value={formData.email}
                  onChange={handleChange}
                  size="md"
                  required
                />
              </Input.Wrapper>

              <Input.Wrapper label="Password" required>
                <Input
                  icon={<Lock size={16} />}
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={formData.password}
                  onChange={handleChange}
                  size="md"
                  required
                  rightSection={
                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="text-gray-500">
                      {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  }
                />
              </Input.Wrapper>

              <div className="text-right">
                <a href="#" className="text-sm font-medium text-blue-600 hover:underline">
                  Forgot Password?
                </a>
              </div>

              <Button type="submit" fullWidth size="md" loading={loading}
                className="bg-[#FF6B6B] hover:bg-[#ff5252] text-white font-bold"
              >
                Log In
              </Button>
            </form>

            <div className="flex items-center my-8">
              <hr className="flex-grow border-gray-300" />
              <span className="mx-4 text-gray-500 font-medium">Or Continue With</span>
              <hr className="flex-grow border-gray-300" />
            </div>

            <div className="flex gap-4">
              <SocialButton icon={<img src="https://www.google.com/favicon.ico" alt="Google" className="w-5 h-5"/>} label="Google" />
              <SocialButton icon={<img src="https://www.facebook.com/favicon.ico" alt="Facebook" className="w-5 h-5"/>} label="Facebook" />
              <SocialButton icon={<img src="https://apple.com/favicon.ico" alt="Apple" className="w-5 h-5"/>} label="Apple" />
            </div>

            <p className="text-center text-sm text-gray-600 mt-8">
              Don't have an account?{' '}
              <Link to="/register" className="font-semibold text-blue-600 hover:underline">
                Sign Up here
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;