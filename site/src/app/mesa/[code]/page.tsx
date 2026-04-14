'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export default function MesaPage() {
  const { code } = useParams<{ code: string }>();
  const router = useRouter();
  const [error, setError] = useState('');

  useEffect(() => {
    if (!code) return;

    (async () => {
      try {
        const res = await fetch(`${API_URL}/mesa/${code}/session`, { method: 'POST' });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.message || 'Mesa não encontrada');
        }
        const data = await res.json();

        // Store session + table code in sessionStorage
        sessionStorage.setItem('mesa-session', JSON.stringify({
          sessionToken: data.sessionToken,
          expiresAt: data.expiresAt,
          table: data.table,
          code,
        }));

        // Redirect to /pedido — no sensitive info in URL
        router.replace('/pedido');
      } catch (e: any) {
        setError(e.message || 'Erro ao conectar');
      }
    })();
  }, [code, router]);

  if (error) {
    return (
      <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center p-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">😕</p>
          <h1 className="text-xl font-bold text-gray-900 mb-2">Mesa Não Encontrada</h1>
          <p className="text-gray-500">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F8F9FB] flex items-center justify-center">
      <div className="text-center">
        <div className="w-10 h-10 border-4 border-[#FF6B00] border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        <p className="text-gray-500">Conectando à mesa...</p>
      </div>
    </div>
  );
}
