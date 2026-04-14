'use client';

import { useState } from 'react';
import { UserPlus, Eye, EyeOff, ArrowLeft, Check, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { registerUser } from '@/services/api';

function formatCPF(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 6) return `${digits.slice(0, 3)}.${digits.slice(3)}`;
  if (digits.length <= 9) return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6)}`;
  return `${digits.slice(0, 3)}.${digits.slice(3, 6)}.${digits.slice(6, 9)}-${digits.slice(9)}`;
}

function formatPhone(value: string) {
  const digits = value.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return `(${digits}`;
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
}

export default function CadastroPage() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '', cpfCnpj: '', password: '', confirmPassword: '',
  });
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordMatch = form.password === form.confirmPassword;
  const passwordStrong = form.password.length >= 6;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!passwordMatch) {
      setError('As senhas não coincidem');
      return;
    }

    setLoading(true);
    try {
      const payload: any = {
        name: form.name,
        email: form.email,
        password: form.password,
      };
      if (form.phone) payload.phone = form.phone.replace(/\D/g, '');
      if (form.cpfCnpj) payload.cpfCnpj = form.cpfCnpj.replace(/\D/g, '');

      const { data } = await registerUser(payload);
      const { accessToken, refreshToken } = data;

      setSuccess(true);

      // Auto-redirect to PWA after 2 seconds
      setTimeout(() => {
        const pwaUrl = process.env.NEXT_PUBLIC_PWA_URL || 'http://localhost:3002';
        window.location.href = `${pwaUrl}/?token=${accessToken}&refreshToken=${refreshToken}`;
      }, 2000);
    } catch (err: any) {
      const msg = err?.response?.data?.message;
      if (typeof msg === 'string') {
        if (msg.includes('already exists') || msg.includes('já existe') || msg.includes('Conflict')) {
          setError('Já existe uma conta com este email ou CPF.');
        } else {
          setError(msg);
        }
      } else if (Array.isArray(msg)) {
        setError(msg[0]);
      } else {
        setError('Erro ao criar conta. Tente novamente.');
      }
    }
    setLoading(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center p-4">
        <div className="bg-foreground/5 backdrop-blur-xl border border-foreground/10 rounded-3xl p-12 shadow-2xl text-center max-w-md">
          <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h1 className="text-3xl font-black text-foreground mb-3">Conta Criada!</h1>
          <p className="text-foreground/60 mb-4">
            Bem-vindo à Prize Club! Você será redirecionado para a área do cliente em instantes...
          </p>
          <div className="flex justify-center">
            <div className="w-6 h-6 border-2 border-primary-500/30 border-t-primary-500 rounded-full animate-spin" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-secondary-900 via-secondary-800 to-secondary-900 flex items-center justify-center p-4">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-primary-500/5 rounded-full blur-3xl" />
      </div>

      <div className="relative w-full max-w-lg">
        {/* Back link */}
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-foreground/50 hover:text-foreground mb-6 transition-colors text-sm"
        >
          <ArrowLeft size={16} />
          Voltar ao site
        </Link>

        {/* Card */}
        <div className="bg-foreground/5 backdrop-blur-xl border border-foreground/10 rounded-3xl p-8 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center mb-4">
              <Image src="/logo.png" alt="Prize Club" width={160} height={56} className="h-12 w-auto dark:brightness-0 dark:invert" />
            </div>
            <h1 className="text-2xl font-black text-foreground">Crie Sua Conta</h1>
            <p className="text-foreground/50 mt-2">Faça parte da família Prize Club</p>
          </div>

          {/* Error */}
          {error && (
            <div className="bg-red-500/10 border border-red-500/30 text-red-300 text-sm p-4 rounded-xl mb-6 flex items-start gap-2">
              <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">Nome completo *</label>
              <input
                type="text"
                required
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder="Seu nome completo"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">Email *</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                placeholder="seu@email.com"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">Telefone</label>
                <input
                  type="text"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: formatPhone(e.target.value) })}
                  className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="(22) 99999-9999"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/70 mb-1.5">CPF</label>
                <input
                  type="text"
                  value={form.cpfCnpj}
                  onChange={e => setForm({ ...form, cpfCnpj: formatCPF(e.target.value) })}
                  className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all"
                  placeholder="000.000.000-00"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">Senha *</label>
              <div className="relative">
                <input
                  type={showPass ? 'text' : 'password'}
                  required
                  minLength={6}
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  className="w-full px-4 py-3 bg-foreground/5 border border-foreground/10 rounded-xl text-foreground placeholder-foreground/30 focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 transition-all pr-12"
                  placeholder="Mínimo 6 caracteres"
                />
                <button
                  type="button"
                  onClick={() => setShowPass(!showPass)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-foreground/30 hover:text-foreground/50"
                >
                  {showPass ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {form.password && (
                <p className={`text-xs mt-1.5 ${passwordStrong ? 'text-green-400' : 'text-yellow-400'}`}>
                  {passwordStrong ? '✓ Senha válida' : 'Mínimo 6 caracteres'}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground/70 mb-1.5">Confirmar senha *</label>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={form.confirmPassword}
                onChange={e => setForm({ ...form, confirmPassword: e.target.value })}
                className={`w-full px-4 py-3 bg-foreground/5 border rounded-xl text-foreground placeholder-foreground/30 focus:outline-none focus:ring-1 transition-all ${
                  form.confirmPassword && !passwordMatch
                    ? 'border-red-500 focus:border-red-500 focus:ring-red-500'
                    : 'border-foreground/10 focus:border-primary-500 focus:ring-primary-500'
                }`}
                placeholder="Repita sua senha"
              />
              {form.confirmPassword && !passwordMatch && (
                <p className="text-xs mt-1.5 text-red-400">As senhas não coincidem</p>
              )}
            </div>

            <button
              type="submit"
              disabled={loading || !passwordMatch || !passwordStrong}
              className="w-full flex items-center justify-center gap-2 py-4 bg-primary-500 text-white font-bold rounded-xl hover:bg-primary-400 transition-all shadow-lg shadow-primary-500/25 disabled:opacity-50 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <UserPlus size={18} />
                  Criar Minha Conta
                </>
              )}
            </button>
          </form>

          {/* Login link */}
          <div className="text-center mt-6">
            <p className="text-foreground/50 text-sm">
              Já tem uma conta?{' '}
              <Link href="/login" className="text-primary-400 font-semibold hover:text-primary-300 transition-colors">
                Fazer login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
