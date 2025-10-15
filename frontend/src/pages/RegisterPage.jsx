import React, { useState } from 'react';
import { register as apiRegister } from '../api/auth';
import { useNavigate, Link } from 'react-router-dom';
import { TextInput, PasswordInput, Button, Paper } from '@mantine/core';
import { toast } from 'react-toastify';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);

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
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <Paper shadow="md" p="xl" className="w-full max-w-md">
        <h1 className="text-2xl font-semibold mb-6">Create an account</h1>
        <form onSubmit={onSubmit} className="space-y-4">
          <TextInput label="Name" name="name" placeholder="Your full name" value={form.name} onChange={onChange} required />
          <TextInput label="Email" name="email" placeholder="you@example.com" value={form.email} onChange={onChange} required />
          <PasswordInput label="Password" name="password" placeholder="••••••••" value={form.password} onChange={onChange} required />
          <Button type="submit" loading={loading} className="w-full">Register</Button>
        </form>
        <p className="mt-4 text-sm">
          Already have an account?{' '}
          <Link to="/login" className="text-blue-600 hover:underline">Log in</Link>
        </p>
      </Paper>
    </div>
  );
}
