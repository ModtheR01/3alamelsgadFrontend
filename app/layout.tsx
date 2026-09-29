import type { Metadata } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/context/LanguageContext';

export const metadata: Metadata = {
  title: 'عالم السجاد | Alamelsgad — لمسة تغير شكل بيتك',
  description:
    'عالم السجاد: سجاد تركي فاخر، سجاد شرقي أصيل، بدائل سجاد عصرية، وأروال مخصصة بالمتر لتجميل منزلك بأرقى الألوان والمقاسات.',
  keywords: [
    'سجاد تركي',
    'سجاد شرقي',
    'أروال بالمتر',
    'بدائل السجاد',
    'عالم السجاد',
    'سجاد مودرن',
    'سجاد كلاسيك',
    'Alamelsgad',
    'موكيت ومشايات',
  ],
  openGraph: {
    title: 'عالم السجاد | Alamelsgad — لمسة تغير شكل بيتك',
    description:
      'أرقى تشكيلات السجاد التركي والشرقي والأروال بالمتر لتجديد ديكور بيتك بأعلى جودة وتوصيل لجميع المحافظات.',
    type: 'website',
    locale: 'ar_EG',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'عالم السجاد | Alamelsgad — لمسة تغير شكل بيتك',
    description:
      'أرقى تشكيلات السجاد التركي والشرقي والأروال بالمتر لتجديد ديكور بيتك بأعلى جودة وتوصيل لجميع المحافظات.',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ar" dir="rtl" className="scroll-smooth">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Cairo:wght@300;400;500;600;700;800;900&display=swap"
          rel="stylesheet"
        />
      </head>
      <body
        className="bg-[#FBF9F5] text-[#21160F] font-sans antialiased selection:bg-[#9E734F] selection:text-white"
        suppressHydrationWarning
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
