export type PaymentMethodId = 'JAZZCASH' | 'EASYPAISA' | 'USDT';

export type PaymentChannel = {
  id: PaymentMethodId;
  label: string;
  icon: string;
  accountNumber?: string;
  accountName?: string;
  instructionsUrdu: string[];
};

export const PAYMENT_CHANNELS: Record<PaymentMethodId, PaymentChannel> = {
  JAZZCASH: {
    id: 'JAZZCASH',
    label: 'JazzCash',
    icon: '/jazzcash.png',
    accountNumber: '03235131973',
    accountName: 'Ghulam Hussain',
    instructionsUrdu: [
      'براہ کرم دی گئی رقم بالکل اتنی ہی منتقل کریں جتنی آرڈر میں لکھی ہے۔',
      'ادائیگی کے بعد اسکرین شاٹ لازمی اپلوڈ کریں۔',
      'غلط یا نامکمل اسکرین شاٹ کی صورت میں درخواست مسترد ہو سکتی ہے۔'
    ]
  },
  EASYPAISA: {
    id: 'EASYPAISA',
    label: 'EasyPaisa',
    icon: '/easypaisa.png',
    accountNumber: '03312685179',
    accountName: 'Ghulam Hussain',
    instructionsUrdu: [
      'ایزی پیسہ ٹرانسفر مکمل ہونے کے بعد ریفرنس محفوظ رکھیں۔',
      'ادائیگی کا ثبوت واضح تصویر میں اپلوڈ کریں۔',
      'ایڈمن منظوری کے بعد بیلنس اکاؤنٹ میں شامل ہوگا۔'
    ]
  },
  USDT: {
    id: 'USDT',
    label: 'USDT',
    icon: '/usdt.png',
    instructionsUrdu: [
      'یو ایس ڈی ٹی ڈپازٹ کیلئے پہلے سپورٹ سے رابطہ کریں۔',
      'نیٹ ورک اور والٹ ایڈریس ہمیشہ دوبارہ چیک کریں۔',
      'غلط نیٹ ورک پر بھیجی گئی رقم واپس نہیں ہوگی۔'
    ]
  }
};

export function isPaymentMethodId(value: string): value is PaymentMethodId {
  return ['JAZZCASH', 'EASYPAISA', 'USDT'].includes(value);
}

export function getPaymentChannel(method: PaymentMethodId) {
  return PAYMENT_CHANNELS[method];
}
