import React, { useState, useEffect } from 'react';
import { register as apiRegister } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@mantine/core';
import { toast } from 'react-toastify';
import { User, Mail, Lock, ArrowRight } from 'lucide-react';
import loginImage from '../../public/assets/loginImage.jpg'

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
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
    if (!form.name || !form.email || !form.password) {
      toast.error('Please fill all fields');
      return;
    }
    try {
      setLoading(true);
      const res = await apiRegister(form);
      toast.success(res?.message || 'Registration successful. Please log in.');
      navigate('/login');
    } catch {
      toast.error('Registration failed. Please check your details and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen overflow-hidden relative">
         {/* Top Ribbon */}
      <div className="fixed top-0 inset-x-0 z-30 border-b border-white/10">
  <div className="bg-gradient-to-r from-[#001C33]/95 via-[#001C33] to-[#001C33]/95">
    <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
      <div className="h-16 sm:h-20 flex items-center justify-center">
        <h1 className="font-display font-extrabold text-white text-3xl sm:text-4xl tracking-wide flex items-center gap-2">
          <span>Travel</span>
          <span className="text-brave-orange">MACHAN</span>
        </h1>
      </div>
    </div>
  </div>
</div>
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
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="w-full max-w-xl">
          <div
            className="rounded-3xl backdrop-blur-3xl border-2 p-10 shadow-2xl"
            style={{
              background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.25), rgba(255, 255, 255, 0.08))',
              backdropFilter: 'blur(40px)',
              WebkitBackdropFilter: 'blur(40px)',
              borderColor: 'rgba(255, 255, 255, 0.5)',
              boxShadow: `
                inset 0 1px 2px rgba(255, 255, 255, 0.5),
                0 8px 32px rgba(0, 0, 0, 0.1),
                0 0 0 1px rgba(31, 38, 135, 0.2)
              `,
            }}
          >
            {/* Header */}
            <div className="text-center mb-8">
              <h1 className="font-display text-2xl font-black text-white mb-2 drop-shadow-lg">
                Join Us
              </h1>
              <p className="font-body font-display text-sm text-desert-lilly drop-shadow">
                Start your adventure today
              </p>
            </div>

            {/* Form */}
            <form onSubmit={onSubmit} className="space-y-4">
              {/* Name and Email Row */}
              <div className="grid grid-cols-2 gap-3">
                {/* Name Input */}
                <div>
                  <label className="font-display text-xs font-bold text-white mb-2 block uppercase tracking-widest opacity-95 drop-shadow">
                    Name
                  </label>
                  <div className="relative group">
                    <User
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none"
                      style={{ color: focused === 'name' ? '#FD661E' : 'rgba(255, 255, 255, 0.7)' }}
                    />
                    <input
                      type="text"
                      name="name"
                      placeholder="Your name"
                      value={form.name}
                      onChange={onChange}
                      onFocus={() => setFocused('name')}
                      onBlur={() => setFocused(null)}
                      required
                      className="w-full pl-10 pr-3 py-3 rounded-lg border-2 transition-all duration-300 font-body text-sm backdrop-blur-sm"
                      style={{
                        borderColor: focused === 'name' ? '#FD661E' : 'rgba(255, 255, 255, 0.3)',
                        background: focused === 'name' ? 'rgba(255, 250, 245, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                        boxShadow:
                          focused === 'name'
                            ? '0 0 0 3px rgba(253, 102, 30, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                            : 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                        color: focused === 'name' ? '#001C33' : '#ffffff',
                      }}
                    />
                  </div>
                </div>

                {/* Email Input */}
                <div>
                  <label className="font-display text-xs font-bold text-white mb-2 block uppercase tracking-widest opacity-95 drop-shadow">
                    Email
                  </label>
                  <div className="relative group">
                    <Mail
                      size={18}
                      className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none"
                      style={{ color: focused === 'email' ? '#FD661E' : 'rgba(255, 255, 255, 0.7)' }}
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
                      className="w-full pl-10 pr-3 py-3 rounded-lg border-2 transition-all duration-300 font-body text-sm backdrop-blur-sm"
                      style={{
                        borderColor: focused === 'email' ? '#FD661E' : 'rgba(255, 255, 255, 0.3)',
                        background: focused === 'email' ? 'rgba(255, 250, 245, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                        boxShadow:
                          focused === 'email'
                            ? '0 0 0 3px rgba(253, 102, 30, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                            : 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
                        color: focused === 'email' ? '#001C33' : '#ffffff',
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="font-display text-xs font-bold text-white mb-2 block uppercase tracking-widest opacity-95 drop-shadow">
                  Password
                </label>
                <div className="relative group">
                  <Lock
                    size={18}
                    className="absolute left-4 top-1/2 -translate-y-1/2 transition-colors z-10 pointer-events-none"
                    style={{ color: focused === 'password' ? '#FD661E' : 'rgba(255, 255, 255, 0.7)' }}
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
                    className="w-full pl-10 pr-3 py-3 rounded-lg border-2 transition-all duration-300 font-body text-sm backdrop-blur-sm"
                    style={{
                      borderColor: focused === 'password' ? '#FD661E' : 'rgba(255, 255, 255, 0.3)',
                      background: focused === 'password' ? 'rgba(255, 250, 245, 0.95)' : 'rgba(255, 255, 255, 0.15)',
                      boxShadow:
                        focused === 'password'
                          ? '0 0 0 3px rgba(253, 102, 30, 0.2), inset 0 1px 2px rgba(255, 255, 255, 0.5)'
                          : 'inset 0 1px 2px rgba(255, 255, 255, 0.3)',
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
                className="mt-8 rounded-lg font-display font-bold flex items-center justify-center gap-2 text-white h-12 text-base"
                styles={{
                  root: {
                    background: 'linear-gradient(135deg, #FD661E, #F15A2B)',
                    height: '48px',
                    fontSize: '15px',
                    fontWeight: 700,
                    '&:hover': {
                      background: 'linear-gradient(135deg, #E5591A, #D94D21)',
                    },
                    '&:active': {
                      transform: 'scale(0.98)',
                    },
                  },
                }}
              >
                <span>{loading ? 'Creating...' : 'Create Account'}</span>
                {!loading && <ArrowRight size={18} className="ml-2 transition-transform group-hover:translate-x-1" />}
              </Button>
            </form>

            {/* Divider */}
            <div className="my-6 flex items-center gap-3">
              <div className="flex-1 h-px bg-white opacity-20"></div>
              <span className="font-body text-xs text-desert-lilly opacity-70">Already have one?</span>
              <div className="flex-1 h-px bg-white opacity-20"></div>
            </div>

            {/* Sign in link */}
            <p className="text-center font-body text-base text-white opacity-90 font-semibold">
              Already have an account?{' '}
              <Link
                to="/login"
                className="font-display font-bold text-desert-lilly hover:text-brave-orange transition-colors"
              >
                Log in
              </Link>
            </p>

            {/* Footer */}
            <div className="mt-8 pt-6 border-t border-white border-opacity-20">
              <p className="font-body text-xs text-center text-desert-lilly opacity-80">
                ✈️ Explore • Connect • Discover
              </p>
            </div>
          </div>

          {/* Trust badges */}
          <div className="flex justify-center gap-6 mt-8 text-center">
            <div className="text-white">
              <div className="font-display font-bold text-lg">50K+</div>
              <div className="font-body text-xs font-medium opacity-80">Active Travelers</div>
            </div>
            <div className="w-px bg-white opacity-30"></div>
            <div className="text-white">
              <div className="font-display font-bold text-lg">180+</div>
              <div className="font-body text-xs font-medium opacity-80">Countries</div>
            </div>
            <div className="w-px bg-white opacity-30"></div>
            <div className="text-white">
              <div className="font-display font-bold text-lg">⭐ 4.9</div>
              <div className="font-body text-xs font-medium opacity-80">Rated</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}