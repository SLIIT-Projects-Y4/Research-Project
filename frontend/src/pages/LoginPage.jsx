import React, { useState, useEffect } from 'react';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../store/auth.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '@mantine/core';
import { toast } from 'react-toastify';
import { Mail, Lock, ArrowRight } from 'lucide-react';
import { motion } from 'framer-motion';
import loginImage from '../../public/assets/loginImage.jpg';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [focused, setFocused] = useState(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e) => setMousePos({ x: e.clientX, y: e.clientY });
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return toast.error('Please enter your email and password');
    try {
      setLoading(true);
      const res = await apiLogin(form);
      login(res.token, res.user);
      toast.success('Login successful');
      navigate(res.user?.onboarding_needed ? '/onboarding' : '/home');
    } catch {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const brand = 'var(--color-brave-orange)';
  const brandDark = 'var(--color-hot-embers)';

  const containerVariants = {
    hidden: { opacity: 0, y: 40 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { type: 'spring', stiffness: 80, damping: 18, delayChildren: 0.15, staggerChildren: 0.08 },
    },
  };
  const itemVariants = { hidden: { opacity: 0, y: 20 }, visible: { opacity: 1, y: 0, transition: { duration: 0.4 } } };

  return (
    <div className="min-h-screen overflow-hidden relative">

      {/* Header */}
      <motion.div
        className="fixed top-0 inset-x-0 z-30 border-b border-white/10"
        initial={{ opacity: 0, y: -20, filter: 'blur(6px)' }}
        animate={{ opacity: 1, y: 0, filter: 'blur(0)' }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="bg-gradient-to-r from-[#001C33]/95 via-[#001C33] to-[#001C33]/95">
          <div className="max-w-screen-xl mx-auto px-4 sm:px-6">
            <div className="h-16 sm:h-20 flex items-center justify-center">
              <motion.h1
                className="font-display font-extrabold text-white text-3xl sm:text-4xl tracking-wide flex items-center gap-2"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3, duration: 0.6 }}
              >
                <span>Travel</span>
                <motion.span
                  className="text-[var(--color-brave-orange)]"
                  animate={{ color: ['#FD661E', '#F15A2B', '#FD661E'] }}
                  transition={{ duration: 3, repeat: Infinity }}
                >
                  MACHAN
                </motion.span>
              </motion.h1>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Background */}
      <motion.div
        className="fixed inset-0 bg-cover bg-center"
        style={{ backgroundImage: `url(${loginImage})`, backgroundAttachment: 'fixed' }}
        initial={{ scale: 1 }}
        animate={{ scale: 1.05 }}
        transition={{ duration: 10, ease: 'easeInOut', repeat: Infinity, repeatType: 'reverse' }}
      >
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(circle at ${mousePos.x}px ${mousePos.y}px,
              rgba(0, 28, 51, 0.25) 0%, rgba(0, 28, 51, 0.75) 100%)`,
            backdropFilter: 'blur(2px)',
            transition: 'background 0.25s ease-out',
          }}
        />
      </motion.div>

      {/* Main Content */}
      <motion.div
        className="relative z-0 min-h-screen flex flex-col items-center justify-center px-4 sm:px-6 py-8 sm:py-12 pt-24 sm:pt-28"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div
          className="w-full max-w-md rounded-2xl sm:rounded-3xl border p-8 sm:p-10 shadow-[0_8px_40px_rgba(0,0,0,0.35)]"
          style={{
            background: 'rgba(0, 28, 51, 0.65)',
            borderColor: 'rgba(255,255,255,0.18)',
            backdropFilter: 'blur(18px)',
          }}
          variants={itemVariants}
        >
          {/* Header */}
          <motion.div className="text-center mb-8" variants={itemVariants}>
            <h2 className="font-display text-white text-3xl sm:text-4xl font-extrabold leading-tight mb-1">
              Welcome Back
            </h2>
            <p className="font-body text-[14px] sm:text-[15px] text-[var(--color-heart-of-ice)]/90">
              Log in to continue your journey
            </p>
          </motion.div>

          {/* Form */}
          <motion.form onSubmit={onSubmit} className="space-y-5 sm:space-y-6" variants={containerVariants}>
            {/* Email */}
            <motion.div variants={itemVariants}>
              <label className="font-display text-xs sm:text-[13px] font-semibold mb-2 block uppercase tracking-wide text-white/95">
                Email Address
              </label>
              <div className="relative group">
                <motion.div
                  animate={{
                    scale: focused === 'email' ? 1.2 : 1,
                    color: focused === 'email' ? brand : 'rgba(255,255,255,0.7)',
                  }}
                  transition={{ type: 'spring', stiffness: 250, damping: 15 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
                >
                  <Mail size={18} />
                </motion.div>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={onChange}
                  onFocus={() => setFocused('email')}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-lg border text-[15px] font-body transition-all placeholder-white/60 focus:outline-none"
                  style={{
                    borderColor: focused === 'email' ? brand : 'rgba(255,255,255,0.25)',
                    background: focused === 'email' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>
            </motion.div>

            {/* Password */}
            <motion.div variants={itemVariants}>
              <label className="font-display text-xs sm:text-[13px] font-semibold mb-2 block uppercase tracking-wide text-white/95">
                Password
              </label>
              <div className="relative group">
                <motion.div
                  animate={{
                    scale: focused === 'password' ? 1.2 : 1,
                    color: focused === 'password' ? brand : 'rgba(255,255,255,0.7)',
                  }}
                  transition={{ type: 'spring', stiffness: 250, damping: 15 }}
                  className="absolute left-3 top-1/2 -translate-y-1/2 z-10"
                >
                  <Lock size={18} />
                </motion.div>
                <input
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={onChange}
                  onFocus={() => setFocused('password')}
                  onBlur={() => setFocused(null)}
                  required
                  className="w-full pl-10 pr-3 py-3 rounded-lg border text-[15px] font-body transition-all placeholder-white/60 focus:outline-none"
                  style={{
                    borderColor: focused === 'password' ? brand : 'rgba(255,255,255,0.25)',
                    background: focused === 'password' ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.08)',
                    color: '#fff',
                  }}
                />
              </div>
            </motion.div>

            {/* Submit */}
            <motion.div variants={itemVariants}>
              <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} transition={{ type: 'spring', stiffness: 250, damping: 15 }}>
                <Button
                  type="submit"
                  loading={loading}
                  fullWidth
                  className="mt-6 rounded-lg font-display font-semibold flex items-center justify-center gap-2 text-white text-[15px] h-11 sm:h-12"
                  styles={{
                    root: {
                      background: `linear-gradient(135deg, ${brand}, ${brandDark})`,
                      boxShadow: '0 6px 20px rgba(253, 102, 30, 0.35)',
                      transition: 'all 0.25s ease',
                    },
                  }}
                >
                  <motion.span animate={{ x: loading ? 10 : 0, opacity: loading ? 0.8 : 1 }} transition={{ duration: 0.3 }}>
                    {loading ? 'Taking off…' : 'Login'}
                  </motion.span>
                  {!loading && (
                    <motion.div initial={{ x: 0 }} whileHover={{ x: 5 }} transition={{ type: 'spring', stiffness: 250, damping: 12 }}>
                      <ArrowRight size={18} />
                    </motion.div>
                  )}
                </Button>
              </motion.div>
            </motion.div>
          </motion.form>

          {/* Divider */}
          <motion.div className="my-6 flex items-center gap-3" variants={itemVariants}>
            <div className="flex-1 h-px bg-white/20"></div>
            <span className="font-body text-xs text-white/70">New here?</span>
            <div className="flex-1 h-px bg-white/20"></div>
          </motion.div>

          {/* Sign up link */}
          <motion.p className="text-center font-body text-[14px] text-[var(--color-heart-of-ice)]" variants={itemVariants}>
            Don’t have an account?{' '}
            <Link to="/register" className="font-semibold text-[var(--color-brave-orange)] hover:underline">
              Create an account
            </Link>
          </motion.p>
        </motion.div>
      </motion.div>
    </div>
  );
}
