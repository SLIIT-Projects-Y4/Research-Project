// src/pages/RegisterPage.jsx
import React, { useState } from 'react';
import { register as apiRegister } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper } from '@mantine/core';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [touched, setTouched] = useState({ name: false, email: false, password: false });
  const [loading, setLoading] = useState(false);

  const onChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  const onBlur = (field) => () => setTouched({ ...touched, [field]: true });

  const onSubmit = async (e) => {
    e.preventDefault();
    setTouched({ name: true, email: true, password: true });

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
    <div
      className="relative min-h-screen flex items-center justify-center bg-cover bg-center"
      style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?travel,adventure,sky')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-md p-6 animate-fadeIn">
        <Paper shadow="2xl" radius="xl" p="xl" className="bg-white/90 backdrop-blur-lg border border-gray-200">
          <h1 className="text-4xl font-extrabold text-center mb-2 text-gray-900 tracking-wide">
            Join the Journey
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Create your account and start exploring new horizons
          </p>

          <form onSubmit={onSubmit} className="space-y-6">
            <TextInput
              label="Full Name"
              name="name"
              placeholder="Enter your full name"
              value={form.name}
              onChange={onChange}
              onBlur={onBlur('name')}
              error={touched.name && !form.name ? 'Name is required' : null}
              classNames={{
                input:
                  "rounded-lg shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition",
                label: "font-semibold text-gray-700",
              }}
            />

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
                  "rounded-lg shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition",
                label: "font-semibold text-gray-700",
              }}
            />

            <PasswordInput
              label="Password"
              name="password"
              placeholder="Choose a strong password"
              value={form.password}
              onChange={onChange}
              onBlur={onBlur('password')}
              error={touched.password && !form.password ? 'Password is required' : null}
              classNames={{
                input:
                  "rounded-lg shadow-sm border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400 transition",
                label: "font-semibold text-gray-700",
              }}
            />

            <Button
              type="submit"
              loading={loading}
              fullWidth
              size="md"
              className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white shadow-lg transition rounded-lg font-semibold tracking-wide"
            >
              {loading ? 'Preparing your journey...' : 'Start Exploring'}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-700">
            Already a traveler?{' '}
            <Link to="/login" className="text-indigo-600 hover:underline font-medium">
              Log in and continue
            </Link>
          </p>
        </Paper>
      </div>
    </div>
  );
}
