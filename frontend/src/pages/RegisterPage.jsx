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
      style={{ backgroundImage: "url('https://source.unsplash.com/1600x900/?travel,city,airplane')" }}
    >
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/40"></div>

      {/* Registration Card */}
      <div className="relative z-10 w-full max-w-md p-6">
        <Paper shadow="xl" radius="xl" p="xl" className="bg-white/80 backdrop-blur-md">
          <h1 className="text-3xl font-bold text-center mb-2">Create Your Account</h1>
          <p className="text-center text-gray-600 mb-6">
            Start your journey with us today
          </p>

          <form onSubmit={onSubmit} className="space-y-5">
            <TextInput
              label="Name"
              name="name"
              placeholder="Your full name"
              value={form.name}
              onChange={onChange}
              onBlur={onBlur('name')}
              error={touched.name && !form.name ? 'Name is required' : null}
              classNames={{
                input: "rounded-lg shadow-sm border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition",
                label: "font-medium text-gray-700",
              }}
            />

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
              Register
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-gray-700">
            Already have an account?{' '}
            <Link to="/login" className="text-blue-600 hover:underline font-medium">
              Log in
            </Link>
          </p>
        </Paper>
      </div>
    </div>
  );
}
