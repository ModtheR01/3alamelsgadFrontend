/**
 * Official Alamelsgad (عالم السجاد) Brand Constants & Configuration
 * Source of truth for brand links, contact channels, and showroom metadata.
 */

export const BRAND_CONFIG = {
  nameAr: 'عالم السجاد',
  nameEn: 'Alamelsgad',
  taglineAr: 'لمسة تغير شكل بيتك',
  taglineEn: 'A touch that transforms your home',
  phone: '+201010750072',
  phoneDisplay: '01010750072',
  whatsappNumber: '201010750072',
  whatsappUrl:
    'https://api.whatsapp.com/send/?phone=%2B201010750072&text&type=phone_number&app_absent=0',
  facebookUrl:
    'https://www.facebook.com/alamelsgad?mibextid=wwXIfr&rdid=g6IzlbseaoQijR29&share_url=https%3A%2F%2Fwww.facebook.com%2Fshare%2F19KRUouRrT%2F%3Fmibextid%3DwwXIfr#',
  instagramUrl: 'https://www.instagram.com/alamelsgad?igsi=MTFhbjJ3OWIycG93MQ%3D%3D',
  tiktokUrl: 'https://www.tiktok.com/@alamelsgad123?_r=1',
  googleMapsUrl:
    'https://www.google.com/maps/place/%D8%B9%D8%A7%D9%84%D9%85+%D8%A7%D9%84%D8%B3%D8%AC%D8%A7%D8%AF%E2%80%AD/@31.0483445,31.4038586,17z/data=!3m1!4b1!4m6!3m5!1s0x14f79d7444b18405:0x32e14297ac3ddc8f!8m2!3d31.0483445!4d31.4038586!16s%2Fg%2F11f3xffcn1!18m1!1e1?entry=ttu&g_ep=EgoyMDI2MDkyMy4wIKXMDSoASAFQAw%3D%3D',
  addressAr: 'معرض عالم السجاد، المنصورة، مصر',
  addressEn: 'Alamelsgad Showroom, Mansoura, Egypt',
  hoursAr: 'يومياً من 10 صباحاً حتى 11 مساءً',
  hoursEn: 'Daily from 10:00 AM to 11:00 PM',

  // Egyptian Governorates Shipping Rates (Source of truth defaults)
  governorates: [
    { id: 'cairo', nameAr: 'القاهرة', nameEn: 'Cairo', shippingCost: 100 },
    { id: 'giza', nameAr: 'الجيزة', nameEn: 'Giza', shippingCost: 100 },
    { id: 'dakahlia', nameAr: 'الدقهلية (المنصورة)', nameEn: 'Dakahlia (Mansoura)', shippingCost: 60 },
    { id: 'alexandria', nameAr: 'الإسكندرية', nameEn: 'Alexandria', shippingCost: 120 },
    { id: 'sharqia', nameAr: 'الشرقية', nameEn: 'Sharqia', shippingCost: 100 },
    { id: 'gharbia', nameAr: 'الغربية', nameEn: 'Gharbia', shippingCost: 90 },
    { id: 'monufia', nameAr: 'المنوفية', nameEn: 'Monufia', shippingCost: 100 },
    { id: 'qalyubia', nameAr: 'القليوبية', nameEn: 'Qalyubia', shippingCost: 100 },
    { id: 'damietta', nameAr: 'دمياط', nameEn: 'Damietta', shippingCost: 80 },
    { id: 'beheira', nameAr: 'البحيرة', nameEn: 'Beheira', shippingCost: 120 },
    { id: 'kafr_el_sheikh', nameAr: 'كفر الشيخ', nameEn: 'Kafr El Sheikh', shippingCost: 90 },
    { id: 'ismailia', nameAr: 'الإسماعيلية', nameEn: 'Ismailia', shippingCost: 130 },
    { id: 'suez', nameAr: 'السويس', nameEn: 'Suez', shippingCost: 130 },
    { id: 'port_said', nameAr: 'بورسعيد', nameEn: 'Port Said', shippingCost: 120 },
    { id: 'fayoum', nameAr: 'الفيوم', nameEn: 'Fayoum', shippingCost: 140 },
    { id: 'beni_suef', nameAr: 'بني سويف', nameEn: 'Beni Suef', shippingCost: 150 },
    { id: 'minya', nameAr: 'المنيا', nameEn: 'Minya', shippingCost: 160 },
    { id: 'assiut', nameAr: 'أسيوط', nameEn: 'Assiut', shippingCost: 170 },
    { id: 'sohag', nameAr: 'سوهاج', nameEn: 'Sohag', shippingCost: 180 },
    { id: 'qena', nameAr: 'قنا', nameEn: 'Qena', shippingCost: 190 },
    { id: 'luxor', nameAr: 'الأقصر', nameEn: 'Luxor', shippingCost: 200 },
    { id: 'aswan', nameAr: 'أسوان', nameEn: 'Aswan', shippingCost: 220 },
    { id: 'red_sea', nameAr: 'البحر الأحمر (الغردقة)', nameEn: 'Red Sea (Hurghada)', shippingCost: 220 },
    { id: 'south_sinai', nameAr: 'جنوب سيناء (شرم الشيخ)', nameEn: 'South Sinai (Sharm El Sheikh)', shippingCost: 230 },
    { id: 'matrouh', nameAr: 'مطروح والساحل الشمالي', nameEn: 'Matrouh & North Coast', shippingCost: 180 },
  ],

  // ARAWAL (أروال) Specifications (Controlled by Admin per product)
  arawal: {
    defaultWidths: [60, 80, 100, 120],
    defaultWidth: 80,
    minMeterLength: 1,
    maxMeterLength: 30,
    lengthStep: 0.5, // e.g. 1m, 1.5m, 2m, 2.5m...
  },
};

export type ArawalWidth = number;

export interface ArawalSelection {
  isArawal: boolean;
  width: number;
  lengthMeters: number;
  unitPricePerMeter: number;
  totalPrice: number;
}
