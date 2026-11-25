import type { ReactNode } from 'react';
import { Sidebar } from './sidebar';

export function CompanyLayout({ children, eyebrow, title, description }: { children:ReactNode; eyebrow:string; title:string; description:string }) {
  return <div className="min-h-screen flex"><Sidebar/><main className="min-w-0 flex-1 px-4 pt-20 pb-8 sm:px-7 lg:px-10 lg:pt-9"><header className="mb-8"><p className="text-sm text-[var(--muted)] mb-1">{eyebrow}</p><h1 className="font-serif text-4xl tracking-tight">{title}<span className="text-[var(--primary)]">.</span></h1><p className="text-sm text-[var(--muted)] mt-2">{description}</p></header>{children}</main></div>;
}
