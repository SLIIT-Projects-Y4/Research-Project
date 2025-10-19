import React, { useState, useEffect } from 'react';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../store/auth.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@mantine/core';
import { toast } from 'react-toastify';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import loginImage from '../../public/assets/loginImage.jpg'

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) {
      toast.error('Please enter your email and password');
      return;
    }
    try {
      setLoading(true);
      const res = await apiLogin(form);
      login(res.token, res.user);
      toast.success('Login successful');
      if (res.user?.onboarding_needed) navigate('/onboarding');
      else navigate('/home');
    } catch {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
      {/* Background with travel imagery */}
      <div
        className="fixed inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${loginImage})`,
          backgroundAttachment: 'fixed',
        }}
      >
        <div
          className="absolute inset-0 backdrop-blur-sm"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px, rgba(0, 28, 51, 0.3) 0%, rgba(0, 28, 51, 0.7) 100%)`,
            transition: 'background 0.3s ease-out',
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12">
        <div className="w-full max-w-md">
          <div
            className="rounded-2xl sm:rounded-3xl backdrop-blur-3xl border border-white border-opacity-40 p-6 sm:p-8 shadow-2xl"
            style={{
              background: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
            }}
          >
            {/* Header */}
            <div className="text-center mb-6 sm:mb-8">
              <h1 className="font-display text-2xl sm:text-3xl font-bold text-white mb-1 sm:mb-2">
                Welcome Back
              </h1>
              <p className="font-body text-xs sm:text-sm text-desert-lilly">
                Log in to continue your journey
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4 sm:space-y-5">
              {/* Email Input */}
              <div>
                <label className="font-display text-xs font-bold text-white mb-2 sm:mb-3 block uppercase tracking-wide opacity-90">
                  Email Address
                </label>
                <div className="relative group">
                  <Mail
                    size={18}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none w-4 sm:w-5 h-4 sm:h-5"
                    style={{ color: focused === 'email' ? '#FD661E' : '#ffffff' }}
                  />
                  <input
                    type="email"
                    name="email"
                    placeholder="you@example.com"
                    value={form.email}
                    onChange={onChange}
                    onFocus={() => setFocused('email')}
                    onBlur={() => setFocused(null)}
                    required
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 rounded-lg border-2 transition-all duration-300 font-body text-sm sm:text-base backdrop-blur-sm"
                    style={{
                      borderColor: focused === 'email' ? '#FD661E' : 'rgba(255, 255, 255, 0.3)',
                      background: focused === 'email' ? 'rgba(255, 250, 245, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                      boxShadow:
                        focused === 'email'
                          ? '0 0 0 3px rgba(253, 102, 30, 0.2)'
                          : 'none',
                      color: focused === 'email' ? '#001C33' : '#ffffff',
                    }}
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="font-display text-xs font-bold text-white mb-2 sm:mb-3 block uppercase tracking-wide opacity-90">
                  Password
                </label>
                <div className="relative group">
                  <Lock
                    size={18}
                    className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none w-4 sm:w-5 h-4 sm:h-5"
                    style={{ color: focused === 'password' ? '#FD661E' : '#ffffff' }}
                  />
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={form.password}
                    onChange={onChange}
                    onFocus={() => setFocused('password')}
                    onBlur={() => setFocused(null)}
                    required
                    className="w-full pl-10 sm:pl-12 pr-3 sm:pr-4 py-2.5 sm:py-3.5 rounded-lg border-2 transition-all duration-300 font-body text-sm sm:text-base backdrop-blur-sm"
                    style={{
                      borderColor: focused === 'password' ? '#FD661E' : 'rgba(255, 255, 255, 0.3)',
                      background: focused === 'password' ? 'rgba(255, 250, 245, 0.9)' : 'rgba(255, 255, 255, 0.2)',
                      boxShadow:
                        focused === 'password'
                          ? '0 0 0 3px rgba(253, 102, 30, 0.2)'
                          : 'none',
                      color: focused === 'password' ? '#001C33' : '#ffffff',
                    }}
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                loading={loading}
                fullWidth
                className="mt-6 sm:mt-8 rounded-lg font-display font-bold flex items-center justify-center gap-2 text-white h-11 sm:h-12 text-sm sm:text-base"
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #FD661E, #F15A2B)',
                    height: '44px',
                    fontSize: '14px',
                    '@media (min-width: 640px)': {
                      height: '48px',
                      fontSize: '15px',
                    },
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E5591A, #D94D21)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  },
                }}
              >
                <span>{loading ? 'Taking off...' : 'Login'}</span>
                {!loading && <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-5 sm:my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white opacity-20"></div>
              <span className="font-body text-xs text-desert-lilly opacity-70">New here?</span>
              <div className="flex-1 h-px bg-white opacity-20"></div>
            </div>

            {/* Sign up link */}
            <p className="text-center font-body text-xs sm:text-sm text-white opacity-90">
              Don't have an account?{' '}
              <Link
                to="/register"
                className="font-semibold text-desert-lilly hover:text-brave-orange transition-colors"
              >
                Create an account
              </Link>
            </p>

            {/* Footer */}
            <div className="mt-6 sm:mt-8 pt-4 sm:pt-6 border-t border-white border-opacity-20">
              <p className="font-body text-xs text-center text-desert-lilly opacity-80">
                ✈️ Explore • Connect • Discover
              </p>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}