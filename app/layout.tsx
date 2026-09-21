import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Tocco House — Objects with Character',
  description: 'Contemporary Egyptian design house specializing in distinctive fiberglass furniture, sculptural pieces, and architectural design objects.',
  openGraph: {
    title: 'Tocco House — Objects with Character',
    description: 'Contemporary Egyptian design house specializing in distinctive fiberglass furniture, sculptural pieces, and architectural design objects.',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Tocco House — Objects with Character',
    description: 'Contemporary Egyptian design house specializing in distinctive fiberglass furniture, sculptural pieces, and architectural design objects.',
  },
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className="scroll-smooth">
      <body className="bg-[#FAF8F5] text-[#1C1A19] font-sans antialiased selection:bg-[#643D26] selection:text-white" suppressHydrationWarning>
        {children}
      </body>
    </html>
  );
}
