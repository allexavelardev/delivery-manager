import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Delivery Manager · Operação', description: 'Gestão inteligente para delivery' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR" suppressHydrationWarning><body>{children}</body></html>;
}
