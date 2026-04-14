'use client';

import { useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth';

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'E-mail ou senha incorretos';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6">
      <div className="text-center mb-8">
        <Image src="/logo.png" alt="Prize Club" width={160} height={60} className="h-14 w-auto mx-auto mb-4 brightness-0 invert" />
        <p className="text-sm text-[var(--text-secondary)]">Portal do Cliente</p>
      </div>

      <form onSubmit={handleLogin} className="w-full max-w-sm space-y-4">
        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl">
            {error}
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">E-mail</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="seu@email.com"
            required
            autoComplete="email"
            className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-primary-500/50 transition"
          />
        </div>

        <div>
          <label className="block text-xs font-medium text-[var(--text-secondary)] mb-1.5">Senha</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              autoComplete="current-password"
              className="w-full px-4 py-3 rounded-xl bg-[var(--input-bg)] border border-[var(--input-border)] text-[var(--text)] placeholder:text-[var(--text-muted)] outline-none focus:border-primary-500/50 transition pr-12"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary-500 text-white py-3 rounded-xl font-semibold hover:bg-primary-400 transition disabled:opacity-50 text-sm flex items-center justify-center gap-2"
        >
          {loading ? 'Entrando...' : 'Entrar'}
        </button>

        <p className="text-center text-[10px] text-[var(--text-muted)] mt-4">
          Prize Clube &copy; {new Date().getFullYear()}
        </p>
      </form>
    </div>
  );
}
