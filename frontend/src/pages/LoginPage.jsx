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
      toast.success('Welcome aboard, traveler!');
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
      style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?travel,journey,explore')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Login Card */}
      <div className="relative z-10 w-full max-w-md p-6 animate-fadeIn">
        <Paper
          shadow="2xl"
          radius="xl"
          p="xl"
          className="bg-white/90 backdrop-blur-lg border border-gray-200"
        >
          <h1 className="text-4xl font-extrabold text-center mb-2 text-gray-900 tracking-wide">
            Welcome Back
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Log in to continue your adventure across the world
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            <TextInput
              label="Email Address"
              name="email"
              placeholder="traveler@example.com"
              value={form.email}
              onChange={onChange}
              onBlur={onBlur('email')}
              error={touched.email && !form.email ? 'Email is required' : null}
              classNames={{
                input:
                  'rounded-lg shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition',
                label: 'font-semibold text-gray-700',
              }}
            />

            <PasswordInput
              label="Password"
              name="password"
              placeholder="Your secret passport key"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur('password')}
              error={touched.password && !form.password ? 'Password is required' : null}
              classNames={{
                input:
                  'rounded-lg shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition',
                label: 'font-semibold text-gray-700',
              }}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition rounded-lg font-semibold tracking-wide"
            >
              {loading ? 'Checking your boarding pass...' : 'Log In & Explore'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-700">
            New to the journey?{' '}
            <Link to="/register" className="text-indigo-600 hover:underline font-medium">
              Create an account
            </Link>
          </p>
        </Paper>
      </div>
    </div>
  );
}

