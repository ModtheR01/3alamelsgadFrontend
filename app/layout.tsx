import type { Metadata, Viewport } from 'next';
import './globals.css';
import { LanguageProvider } from '@/lib/context/LanguageContext';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: '#1F150F',
};

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
      <body
        className="bg-[#FBF9F5] text-[#21160F] font-sans antialiased selection:bg-[#9E734F] selection:text-white"
        suppressHydrationWarning
      >
        <LanguageProvider>{children}</LanguageProvider>
      </body>
    </html>
  );
}
