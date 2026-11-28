import './globals.css';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Delivery Manager · Operação', description: 'Gestão inteligente para delivery' };
export default function RootLayout({children}:{children:React.ReactNode}) {
  return <html lang="pt-BR" suppressHydrationWarning><head><script dangerouslySetInnerHTML={{__html:`(function(){try{var saved=localStorage.getItem('dm-theme');var dark=saved==='dark'||((!saved||saved==='system')&&window.matchMedia('(prefers-color-scheme: dark)').matches);document.documentElement.dataset.theme=dark?'dark':'light';}catch(e){}})()`}} /></head><body>{children}</body></html>;
}
