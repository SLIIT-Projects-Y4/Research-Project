// src/pages/LoginPage.jsx
import React, { useState } from 'react';
import { login as apiLogin } from '../api/auth';
import { useAuth } from '../store/auth.jsx';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper } from '@mantine/core';
import { toast } from 'react-toastify';

export default function LoginPage() {
  const navigate = useNavigate();
  const { login } = useAuth();
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState({ email: false, password: false });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const onBlur = (field) => () => setTouched({ ...touched, [field]: true });

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ email: true, password: true });

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
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?travel,airplane')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <Paper shadow="xl" radius="xl" p="xl" className="bg-white/80 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-center mb-2">Log in</h1>
          <p className="text-center text-gray-600 mb-6">Welcome back! Enter your credentials to continue</p>

          <form onSubmit={onSubmit} className="space-y-5">
            <TextInput
              label="Email"
              name="email"
              placeholder="you@example.com"
              value={form.email}
              onChange={onChange}
              onBlur={onBlur('email')}
              error={touched.email && !form.email ? 'Email is required' : null}
              classNames={{
                input: "rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition",
                label: "font-medium text-gray-700",
              }}
            />

            <PasswordInput
              label="Password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur('password')}
              error={touched.password && !form.password ? 'Password is required' : null}
              classNames={{
                input: "rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition",
                label: "font-medium text-gray-700",
              }}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white shadow-lg transition rounded-lg"
            >
              Log in
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-700">
            New here?{' '}
            <Link to="/register" className="text-blue-600 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </Paper>
      </div>
    </div>
  );
}