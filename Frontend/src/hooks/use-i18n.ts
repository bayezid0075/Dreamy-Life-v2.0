import { useLanguage } from '@/components/providers/language-provider';

const messages = {
  en: {
    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.wallet': 'Wallet',
    'nav.recharge': 'Recharge',
    'nav.driveOffer': 'Drive Offer',
    'nav.referrals': 'Referrals',
    'nav.memberships': 'Memberships',
    'nav.shop': 'Reseller Shop',
    'nav.orders': 'My Orders',
    'nav.marketplace': 'Marketplace',
    'nav.vendor': 'Vendor',
    'nav.myShop': 'My Shop',
    'nav.rewards': 'Rewards',
    'nav.payment': 'Payment',
    'nav.settings': 'Settings',
    'nav.help': 'Help & Support',
    'nav.mainSection': 'Main',
    'nav.shopSection': 'Shop',
    'nav.vendorSection': 'Vendor',
    'nav.otherSection': 'Other',
    'nav.becomeVendor': 'Become a Vendor',
    'nav.logout': 'Logout',

    // Theme
    'theme.light': 'Light Mode',
    'theme.dark': 'Dark Mode',

    // Settings page
    'settings.title': 'Settings',
    'settings.subtitle': 'Personalize your Dreamy Life experience',
    'settings.language.title': 'Language',
    'settings.language.description':
      'Choose your interface language. Bangla is the default for Dreamy Life.',
    'settings.language.bn': 'Bangla',
    'settings.language.en': 'English',
    'settings.language.switchToEn': 'Switch to English',
    'settings.language.switchToBn': 'Switch to Bangla',
    'settings.language.note': 'Your language preference is saved on this device.',

    // Generic
    'generic.back': 'Back',
  },
  bn: {
    // Navigation
    'nav.dashboard': 'ড্যাশবোর্ড',
    'nav.wallet': 'ওয়ালেট',
    'nav.recharge': 'রিচার্জ',
    'nav.driveOffer': 'ড্রাইভ অফার',
    'nav.referrals': 'রেফারেল',
    'nav.memberships': 'মেম্বারশিপ',
    'nav.shop': 'রিসেলার শপ',
    'nav.orders': 'আমার অর্ডার',
    'nav.marketplace': 'মার্কেটপ্লেস',
    'nav.vendor': 'ভেন্ডর',
    'nav.myShop': 'আমার শপ',
    'nav.rewards': 'রিওয়ার্ডস',
    'nav.payment': 'পেমেন্ট',
    'nav.settings': 'সেটিংস',
    'nav.help': 'হেল্প ও সাপোর্ট',
    'nav.mainSection': 'মেইন',
    'nav.shopSection': 'শপ',
    'nav.vendorSection': 'ভেন্ডর',
    'nav.otherSection': 'অন্যান্য',
    'nav.becomeVendor': 'ভেন্ডর হোন',
    'nav.logout': 'লগআউট',

    // Theme
    'theme.light': 'লাইট মোড',
    'theme.dark': 'ডার্ক মোড',

    // Settings page
    'settings.title': 'সেটিংস',
    'settings.subtitle': 'আপনার ড্রিমি লাইফ অভিজ্ঞতা নিজের মতো করে ঠিক করুন',
    'settings.language.title': 'ভাষা',
    'settings.language.description':
      'আপনি কোন ভাষায় ব্যবহার করতে চান সেটি নির্বাচন করুন। ড্রিমি লাইফের ডিফল্ট ভাষা বাংলা।',
    'settings.language.bn': 'বাংলা',
    'settings.language.en': 'ইংরেজি',
    'settings.language.switchToEn': 'English এ যান',
    'settings.language.switchToBn': 'বাংলা তে ফিরুন',
    'settings.language.note': 'ভাষা পছন্দ শুধু এই ডিভাইসের জন্য সংরক্ষিত হয়।',

    // Generic
    'generic.back': 'পেছনে যান',
  },
};

type Language = keyof typeof messages;
type MessageKey = keyof (typeof messages)['en'];

export function useI18n() {
  const { language } = useLanguage();
  const lang: Language = language ?? 'bn';
  const dict = messages[lang];

  const t = (key: MessageKey, fallback?: string) => {
    return (dict as any)[key] ?? fallback ?? key;
  };

  return { t, language: lang };
}

