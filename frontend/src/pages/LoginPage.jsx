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
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Paper shadow="md" p="xl" className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6">Log in</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput label="Email" name="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
          <PasswordInput label="Password" name="password" placeholder="••••••••" value={form.password} onChange={onChange} required />
          <Button type="submit" loading={loading} className="w-full">Log in</Button>
        </form>
        <p className="mt-4 text-sm">
          New here?{' '}
          <Link to="/register" className="text-blue-600 hover:underline">Create an account</Link>
        </p>
      </Paper>
    </div>
  );
}
