'use client';

import { FormEvent, useState } from 'react';
import { Mail, Store } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase';

export default function LoginPage() {
  const [email, setEmail] = useState(''); const [message, setMessage] = useState(''); const [error, setError] = useState(''); const [loading, setLoading] = useState(false);
  async function sendMagicLink(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setLoading(true); setError(''); setMessage('');
    const { error: authError } = await createSupabaseBrowserClient().auth.signInWithOtp({ email: email.trim(), options: { emailRedirectTo: `${window.location.origin}/auth/callback?next=/` } });
    setLoading(false); if (authError) setError(authError.message); else setMessage('Link enviado. Confira seu e-mail para entrar no painel.');
  }
  return <main className="min-h-screen grid place-items-center bg-[var(--background)] px-4"><section className="w-full max-w-md panel p-7 sm:p-9">
    <div className="flex items-center gap-3 mb-8"><div className="w-11 h-11 rounded-xl bg-[var(--primary)] text-white grid place-items-center"><Store size={22}/></div><div><div className="font-extrabold tracking-tight">delivery<span className="text-[var(--primary)]">manager</span></div><div className="text-[10px] tracking-[.08em] text-[var(--muted)]">PAINEL DA OPERAÇÃO</div></div></div>
    <h1 className="font-serif text-3xl tracking-tight">Entrar no painel</h1><p className="text-sm text-[var(--muted)] mt-2 mb-7">Receba um link seguro no seu e-mail para acessar sua operação.</p>
    <form onSubmit={sendMagicLink} className="space-y-4"><label className="block text-sm font-semibold" htmlFor="email">E-mail da equipe</label><div className="relative"><Mail size={16} className="absolute left-3 top-3 text-[var(--muted)]"/><input id="email" required type="email" autoComplete="email" value={email} onChange={event=>setEmail(event.target.value)} placeholder="voce@suaempresa.com" className="w-full h-11 pl-9 pr-3 rounded-lg border border-[var(--line)] bg-[var(--background)] outline-none focus:border-[var(--primary)]"/></div><button disabled={loading} className="w-full h-11 rounded-lg bg-[var(--primary)] hover:bg-[var(--primary-strong)] disabled:opacity-60 text-white font-bold text-sm">{loading ? 'Enviando…' : 'Enviar link de acesso'}</button></form>
    {message&&<p role="status" className="mt-4 rounded-lg bg-[#e7eee0] text-[#4a5d23] px-3 py-2 text-sm">{message}</p>}{error&&<p role="alert" className="mt-4 rounded-lg bg-[#f7e5de] text-[var(--primary)] px-3 py-2 text-sm">{error}</p>}
  </section></main>;
}
