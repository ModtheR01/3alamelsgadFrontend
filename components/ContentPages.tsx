'use client';

import React, { useState } from 'react';
import { useLanguage } from '@/lib/context/LanguageContext';
import { BRAND_CONFIG } from '@/lib/brandConfig';
import {
  Truck,
  ShieldCheck,
  HelpCircle,
  Mail,
  Phone,
  MapPin,
  MessageCircle,
  ChevronDown,
  ChevronUp,
  Clock,
  Send,
  CheckCircle2,
  Ruler,
  Instagram,
  ArrowUpRight,
} from 'lucide-react';

export function ShippingView() {
  const { t } = useLanguage();

  return (
    <div id="shipping-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="py-8 sm:py-12 border-b border-[#EAE3D8] space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('خدمة التوصيل والشحن', 'Shipping & Delivery')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#251811] tracking-tight">
            {t('الشحن والتوصيل لجميع محافظات مصر', 'Nationwide Egyptian Delivery')}
          </h1>
          <p className="text-xs sm:text-base text-[#736357] font-normal leading-relaxed">
            {t(
              'نوفر شحناً آمناً وسريعاً لكافة المحافظات المصرية عبر شركات شحن موثوقة ومندوبين متخصصين.',
              'Reliable and safe door-to-door delivery across all Egyptian governorates.'
            )}
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#5C4A3E] leading-relaxed">
          <section className="space-y-2.5">
            <h3 className="text-base sm:text-lg font-bold text-[#251811]">
              {t('١. مدة التجهيز والتوصيل', '1. Dispatch & Delivery Timelines')}
            </h3>
            <p>
              {t(
                'يتم تجهيز طلبات السجاد الجاهز وشحنها خلال ٢ إلى ٤ أيام عمل. بالنسبة للأروال بالمتر التي تتطلب قصاً وسرفلة خاصة، يستغرق التجهيز من ٣ إلى ٥ أيام عمل لضمان دقة الأطراف وجودة الإنهاء.',
                'In-stock carpets are dispatched within 2 to 4 business days. Custom-cut Arawal runners requiring precision edging are prepared in 3 to 5 business days.'
              )}
            </p>
          </section>

          <section className="space-y-3">
            <h3 className="text-base sm:text-lg font-bold text-[#251811]">
              {t('٢. مصاريف الشحن حسب المحافظة', '2. Delivery Rates by Governorate')}
            </h3>
            <p>
              {t(
                'تختلف قيمة الشحن وفقاً للمحافظة المسجلة عند إتمام الطلب، وتتراوح عادة بين ٦٠ إلى ٢٢٠ جنيهاً مصرياً حسب بعد المسافة.',
                'Shipping costs vary between 60 and 220 EGP based on the selected Egyptian governorate.'
              )}
            </p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 pt-2">
              {BRAND_CONFIG.governorates.slice(0, 9).map((gov) => (
                <div key={gov.id} className="p-3 rounded-xl bg-white border border-[#E8DEC0] flex justify-between items-center text-xs">
                  <span className="font-bold text-[#251811]">{gov.nameAr}</span>
                  <span className="text-[#A27B5C] font-extrabold">{gov.shippingCost} ج.م</span>
                </div>
              ))}
            </div>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-base sm:text-lg font-bold text-[#251811]">
              {t('٣. المعاينة عند الاستلام', '3. Inspection on Delivery')}
            </h3>
            <p>
              {t(
                'يحق للعميل فتح الشحنة ومعاينة السجاد والتأكد من المقاس وجودة الخيوط والألوان بحضور مندوب الشحن قبل سداد باقي قيمة الطلب نقداً.',
                'Customers are entitled to inspect the carpets and verify measurements and color fidelity upon arrival prior to settling the balance.'
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function ReturnsView() {
  const { t } = useLanguage();

  return (
    <div id="returns-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="py-8 sm:py-12 border-b border-[#EAE3D8] space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('خدمة العملاء', 'Customer Service')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#251811] tracking-tight">
            {t('سياسة الاستبدال والاسترجاع', 'Returns & Exchange Policy')}
          </h1>
          <p className="text-xs sm:text-base text-[#736357] font-normal leading-relaxed">
            {t('حرصاً منا على رضاكم التام عن كل قطعة سجاد تقتنونها من عالم السجاد.', 'Dedicated to your complete satisfaction with every rug.')}
          </p>
        </div>

        <div className="space-y-8 text-xs sm:text-sm text-[#5C4A3E] leading-relaxed">
          <section className="space-y-2.5">
            <h3 className="text-base sm:text-lg font-bold text-[#251811]">
              {t('١. فحص الشحنة فور الاستلام', '1. Inspection at Delivery')}
            </h3>
            <p>
              {t(
                'نوصي دائماً بفحص السجادة والتأكد من سلامتها ومطابقتها للمواصفات المطلوبة فور وصول المندوب. في حال وجود أي عيب مصنعي أو اختلاف في المقاس، يتم الاستبدال فوراً دون أي تكلفة إضافية على العميل.',
                'Please examine your carpet upon receipt. Any manufacturing defect or sizing discrepancy will be replaced immediately with zero additional cost.'
              )}
            </p>
          </section>

          <section className="space-y-2.5">
            <h3 className="text-base sm:text-lg font-bold text-[#251811]">
              {t('٢. سياسة الأروال بالمتر (القص الخاص)', '2. Custom-Cut Arawal Runners')}
            </h3>
            <p>
              {t(
                'الأروال التي يتم قصها وسرفلتها خصيصاً وفقاً لأبعاد ومقاسات طلبها العميل (عروض 60، 80، 100، 120 سم مع طول محدد) لا يمكن إرجاعها إلا في حال وجود عيب في النسيج أو خطأ في المقاس من جانبنا.',
                'Runner rolls cut and customized specifically to client-requested dimensions are eligible for return only in cases of manufacturing flaws or measurement errors.'
              )}
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

export function FaqView() {
  const { t } = useLanguage();
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const faqs = [
    {
      qAr: 'ما هي عروض الأروال والمشايات المتاحة لديكم؟',
      qEn: 'What are the available Arawal runner roll widths?',
      aAr: 'الأروال متاحة حصرياً بأربعة عروض قياسية محددة: 60 سم، 80 سم، 100 سم، و120 سم. ويمكنك تحديد أي طول تريده بالمتر، ويتم الحساب بضرب سعر المتر في الطول المطلوب.',
      aEn: 'Arawal runner rolls are available strictly in 4 widths: 60, 80, 100, and 120 cm. You may select any length in meters, priced as Unit Price × Length.',
    },
    {
      qAr: 'كيف يتم تأكيد الطلب بعد تسجيله على الموقع؟',
      qEn: 'How is an order confirmed after submission?',
      aAr: 'تسجيل الطلب ينشئه بحالة "غير مؤكد". يقوم فريق مبيعات عالم السجاد بالتحقق من تحويل الدفعة أو مصاريف الشحن عبر إنستاباي أو فودافون كاش، ثم يتم تحويل حالة الطلب إلى "مؤكد" والبدء في التجهيز.',
      aEn: 'Orders are initially recorded as "Not Confirmed". Our team reviews payment proofs (InstaPay or Mobile Wallet) before updating status to "Confirmed".',
    },
    {
      qAr: 'ما هي طرق الدفع المتاحة؟',
      qEn: 'What payment options are available?',
      aAr: 'نوفر الدفع عبر تطبيق إنستاباي (alamelsgad@instapay)، فودافون كاش ومحافظ الهواتف (01010750072)، أو الدفع عند الاستلام مع تحويل مصاريف الشحن مسبقاً لضمان جدية الشحن.',
      aEn: 'We accept InstaPay (alamelsgad@instapay), Vodafone Cash (01010750072), or Cash on Delivery (with shipping fee transferred upfront).',
    },
    {
      qAr: 'هل يمكنني معاينة السجاد في المعرض؟',
      qEn: 'Can I inspect the carpets in a showroom?',
      aAr: 'نعم، يشرفنا استقبالكم في معرض عالم السجاد بالمنصورة يومياً من الساعة 10 صباحاً حتى 11 مساءً لتجربة الملمس ومشاهدة الألوان على الطبيعة.',
      aEn: 'Yes! You are welcome to visit our showroom in Mansoura daily from 10:00 AM to 11:00 PM to experience textures and colorways in person.',
    },
    {
      qAr: 'كيف أقوم بتنظيف السجاد وبدائل السجاد؟',
      qEn: 'How should I clean and maintain my carpets?',
      aAr: 'يُنصح بالكنس الدوري بالمكنسة الكهربائية، وتنظيف البقع فور حدوثها بقطعة قماش مبللة مع منظف لطيف بدون فرك قاسي. بدائل السجاد خفيفة الوزن يمكن غسلها بسهولة وسريعة الجفاف.',
      aEn: 'Regular vacuuming and spot cleaning with mild detergent is recommended. Lightweight carpet alternatives are machine-washable and quick-drying.',
    },
  ];

  return (
    <div id="faq-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-10">
        <div className="py-8 sm:py-12 border-b border-[#EAE3D8] space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('إجابات شاملة', 'Help Center')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#251811] tracking-tight">
            {t('الأسئلة الشائعة حول السجاد والأروال', 'Frequently Asked Questions')}
          </h1>
          <p className="text-xs sm:text-base text-[#736357] font-normal leading-relaxed">
            {t('كل ما يهمك معرفته عن المقاسات، الدفع، التوصيل، وجودة الخامات.', 'Everything you need to know about dimensions, payments, and carpet care.')}
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, idx) => {
            const isOpen = openIdx === idx;
            return (
              <div
                key={idx}
                className="rounded-2xl bg-white border border-[#E8DEC0] overflow-hidden shadow-xs transition-all"
              >
                <button
                  onClick={() => setOpenIdx(isOpen ? null : idx)}
                  className="w-full p-5 text-start flex items-center justify-between gap-4 font-bold text-sm text-[#251811] hover:text-[#A27B5C]"
                >
                  <span>{t(faq.qAr, faq.qEn)}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-[#A27B5C] shrink-0" /> : <ChevronDown className="w-5 h-5 text-[#9C8A7C] shrink-0" />}
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 pt-1 text-xs sm:text-sm text-[#5C4A3E] leading-relaxed border-t border-[#F2EDE5]">
                    {t(faq.aAr, faq.aEn)}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export function ContactView() {
  const { t } = useLanguage();
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [sent, setSent] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const url = `https://wa.me/${BRAND_CONFIG.whatsappNumber}?text=${encodeURIComponent(
      `رسالة من الموقع:\nالاسم: ${name}\nالهاتف: ${phone}\nالرسالة: ${message}`
    )}`;
    window.open(url, '_blank');
    setSent(true);
  };

  return (
    <div id="contact-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-12">
        <div className="py-8 sm:py-12 border-b border-[#EAE3D8] space-y-2">
          <span className="text-xs uppercase tracking-widest font-bold text-[#A27B5C]">
            {t('تواصل مباشر', 'Direct Contact')}
          </span>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-[#251811] tracking-tight">
            {t('تواصل مع فريق عالم السجاد', 'Get in Touch with Alamelsgad')}
          </h1>
          <p className="text-xs sm:text-base text-[#736357] font-normal leading-relaxed">
            {t('نسعد باستفساراتكم حول المقاسات، الأسعار، وتجهيز الشحنات لجميع المحافظات.', 'We are delighted to assist with custom sizes, pricing, and orders.')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-14">
          {/* Contact Details & Showroom (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="p-6 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-5 text-xs text-[#5C4A3E]">
              <h3 className="text-base font-bold text-[#251811] pb-3 border-b border-[#F0E8DC]">
                {t('معلومات المعرض والاتصال', 'Showroom & Contact Details')}
              </h3>

              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#A27B5C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#251811] block mb-0.5">{t('المعرض الرئيسي:', 'Main Showroom:')}</span>
                    <a href={BRAND_CONFIG.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-[#A27B5C] underline">
                      {t(BRAND_CONFIG.addressAr, BRAND_CONFIG.addressEn)}
                      <ArrowUpRight className="w-3.5 h-3.5 inline ms-1" />
                    </a>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <Phone className="w-5 h-5 text-[#A27B5C] shrink-0" />
                  <div>
                    <span className="font-bold text-[#251811] block mb-0.5">{t('الهاتف والواتساب:', 'Phone & WhatsApp:')}</span>
                    <a href={`tel:${BRAND_CONFIG.phone}`} className="font-mono text-sm font-bold text-[#251811]">
                      {BRAND_CONFIG.phoneDisplay}
                    </a>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-[#A27B5C] shrink-0 mt-0.5" />
                  <div>
                    <span className="font-bold text-[#251811] block mb-0.5">{t('مواعيد العمل:', 'Working Hours:')}</span>
                    <span>{t(BRAND_CONFIG.hoursAr, BRAND_CONFIG.hoursEn)}</span>
                  </div>
                </div>
              </div>

              {/* Direct WhatsApp Action */}
              <div className="pt-2">
                <a
                  href={BRAND_CONFIG.whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 rounded-xl bg-[#25D366] hover:bg-[#20BA5A] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
                >
                  <MessageCircle className="w-4 h-4" />
                  <span>{t('محادثة واتساب مباشرة', 'Instant WhatsApp Chat')}</span>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form (7 cols) */}
          <div className="lg:col-span-7">
            <form onSubmit={handleSubmit} className="p-6 sm:p-8 rounded-2xl bg-white border border-[#E8DEC0] shadow-xs space-y-4">
              <h3 className="text-base font-bold text-[#251811] pb-2">
                {t('أرسل لنا استفسارك أو طلبك المخصص', 'Send an Inquiry or Custom Request')}
              </h3>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#251811]">{t('الاسم الكريم:', 'Your Name:')}</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder={t('أدخل اسمك بالكامل', 'Full Name')}
                  className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#251811]">{t('رقم الهاتف / الواتساب:', 'Phone Number:')}</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="01010750072"
                  className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-[#251811]">{t('تفاصيل الاستفسار أو المقاسات المطلوبة:', 'Your Message or Sizing Request:')}</label>
                <textarea
                  rows={4}
                  required
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={t('اكتب استفسارك عن نوع السجاد أو مقاسات الأروال المطلوبة...', 'Tell us about your carpet requirements...')}
                  className="w-full p-2.5 rounded-xl border border-[#DED4C7] bg-[#FAF8F5] text-xs font-medium focus:outline-none focus:ring-1 focus:ring-[#A27B5C]"
                />
              </div>

              <button
                type="submit"
                className="w-full py-3.5 rounded-full bg-[#251811] hover:bg-[#3D291D] text-white font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-2 shadow-md"
              >
                <Send className="w-4 h-4 text-[#C49F74]" />
                <span>{t('إرسال الاستفسار عبر واتساب', 'Send via WhatsApp')}</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PrivacyView() {
  const { t } = useLanguage();

  return (
    <div id="privacy-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-xs sm:text-sm text-[#5C4A3E] leading-relaxed">
        <h1 className="text-3xl font-extrabold text-[#251811] border-b border-[#EAE3D8] pb-4">
          {t('سياسة الخصوصية — عالم السجاد', 'Privacy Policy — Alamelsgad')}
        </h1>
        <p>
          {t(
            'نلتزم في عالم السجاد بحماية خصوصية عملائنا الكرام. لا نستخدم بيانات الاتصال أو العناوين إلا لغرض إتمام طلبات السجاد والتوصيل وتحديثكم بحالة الشحنات.',
            'We respect your privacy. Contact details and addresses are used solely to process carpet orders and coordinate shipments.'
          )}
        </p>
      </div>
    </div>
  );
}

export function TermsView() {
  const { t } = useLanguage();

  return (
    <div id="terms-page" className="pt-24 sm:pt-32 pb-24 sm:pb-32 bg-[#FAF8F5] min-h-screen">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 space-y-8 text-xs sm:text-sm text-[#5C4A3E] leading-relaxed">
        <h1 className="text-3xl font-extrabold text-[#251811] border-b border-[#EAE3D8] pb-4">
          {t('الشروط والأحكام — عالم السجاد', 'Terms & Conditions — Alamelsgad')}
        </h1>
        <p>
          {t(
            'إنشاء الطلب عبر الموقع يسجله بحالة "غير مؤكد"، وتتم مراجعة المقاسات والدفع من قبل إدارة عالم السجاد قبل التأكيد النهائي والشحن.',
            'Orders placed online are initially "Not Confirmed" and are confirmed upon administrative verification of measurements and payment receipts.'
          )}
        </p>
      </div>
    </div>
  );
}
