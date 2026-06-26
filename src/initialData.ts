import { CommitteeMember, Transaction, InvitedScholar, ActivityService } from './types';

export const initialCommitteeMembers: CommitteeMember[] = [
  // উপদেষ্টা (Advisors)
  { id: '17', name: 'মাওলানা মতিউর রহমান নেজামী', designation: 'প্রধান উপদেষ্টা', type: 'advisor', serialNo: 1 },
  { id: '18', name: 'মাস্টার মো: ইদরীস', designation: 'উপদেষ্টা', type: 'advisor', serialNo: 2 },
  { id: '19', name: 'মো: জিয়াউর রহমান কোম্পানি', designation: 'উপদেষ্টা', type: 'advisor', serialNo: 3 },

  // নেতৃবৃন্দ (Leaders)
  { id: '1', name: 'মাস্টার মো: আবদুস সত্তার', designation: 'সভাপতি', type: 'leader', serialNo: 4 },
  { id: '2', name: 'মো: শহিদুল্লাহ', designation: 'সহ-সভাপতি', type: 'leader', serialNo: 5 },
  { id: '3', name: 'মোঃ লোকমান বৈদ্য', designation: 'সাধারণ সম্পাদক', type: 'leader', serialNo: 6 },
  { id: '4', name: 'মো: হেলাল উদ্দিন', designation: 'সহ-সাধারণ সম্পাদক', type: 'leader', serialNo: 7 },
  { id: '5', name: 'মো: তারেক জামাল', designation: 'অর্থ সম্পাদক', type: 'leader', serialNo: 8 },
  { id: '6', name: 'মো: মাহি', designation: 'সহ-অর্থ সম্পাদক', type: 'leader', serialNo: 9 },
  { id: '7', name: 'মো: জোনায়েদ আকবর', designation: 'সাংগঠনিক সম্পাদক', type: 'leader', serialNo: 10 },
  { id: '8', name: 'হাফেজ মোঃ তামিম', designation: 'প্রচার সম্পাদক', type: 'leader', serialNo: 11 },
  { id: '9', name: 'মো: আনোয়ার', designation: 'প্রবাসী বিষয়ক সম্পাদক', type: 'leader', serialNo: 12 },

  // সিনিয়র সদস্য (Senior Members)
  { id: '10', name: 'মো: শিহাব সওদাগর', designation: 'সিনিয়র সদস্য', type: 'member', serialNo: 13 },
  { id: '11', name: 'মো: আরিফ', designation: 'সিনিয়র সদস্য', type: 'member', serialNo: 14 },
  { id: '12', name: 'মো: সালাহউদ্দিন', designation: 'সিনিয়র সদস্য', type: 'member', serialNo: 15 },
  { id: '13', name: 'মো: আশরাফ', designation: 'সিনিয়র সদস্য', type: 'member', serialNo: 16 },
  { id: '14', name: 'মো: সাইমন সওদাগর', designation: 'সিনিয়র সদস্য', type: 'member', serialNo: 17 },
  { id: '15', name: 'মো: আলমগীর ড্রাইভার', designation: 'সিনিয়র সদস্য', type: 'member', serialNo: 18 },
  { id: '16', name: 'সোলেমান ড্রাইভার', designation: 'সিনিয়র সদস্য', type: 'member', serialNo: 19 },
];

export const initialTransactions: Transaction[] = [
  {
    id: 't2025_01',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 59700,
    donorName: '৮নং বই হতে আয়',
    receiptNo: '01',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_02',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 61200,
    donorName: '১১নং বই হতে আয়',
    receiptNo: '02',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_03',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 85811,
    donorName: '১২নং বই হতে আয়',
    receiptNo: '03',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_04',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 125200,
    donorName: '১৩নং বই হতে আয়',
    receiptNo: '04',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_05',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 10000,
    donorName: '১৫নং বই হতে আয় (১ম অংশ)',
    receiptNo: '05',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_06',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 90315,
    donorName: '১৫নং বই হতে আয় (২য় অংশ)',
    receiptNo: '06',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_07',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 48500,
    donorName: '১৬নং বই হতে আয়',
    receiptNo: '07',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_08',
    date: '2025-09-20',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 49700,
    donorName: '১৭নং বই হতে আয়',
    receiptNo: '08',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_09',
    date: '2025-09-20',
    type: 'income',
    category: 'অন্যান্য',
    amount: 32300,
    donorName: 'পাঞ্জাবি থেকে আয়',
    receiptNo: '09',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_10',
    date: '2025-09-20',
    type: 'income',
    category: 'অন্যান্য',
    amount: 3450,
    donorName: 'তেল বিক্রয় বাবদ আয়',
    receiptNo: '10',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_11',
    date: '2025-09-20',
    type: 'income',
    category: 'অন্যান্য',
    amount: 6600,
    donorName: 'গরুর পা, নলা, জিল্ড',
    receiptNo: '11',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_12',
    date: '2025-09-20',
    type: 'income',
    category: 'অন্যান্য',
    amount: 40000,
    donorName: 'ব্যাংক হতে উত্তোলন',
    receiptNo: '12',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_13',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'গরু ক্রয় ২টি',
    amount: 236500,
    receiptNo: '13',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_14',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'লাকড়ি, সবজি, মুদির দোকানের বাজার',
    amount: 92370,
    receiptNo: '14',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_15',
    date: '2025-09-20',
    type: 'expense',
    category: 'মঞ্চ ও ডেকোরেশন',
    description: 'ডেকোরেশন ভাড়া বাবদ',
    amount: 20000,
    receiptNo: '15',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_16',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'চাউল ক্রয় (২০×১৮৯০)',
    amount: 37800,
    receiptNo: '16',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_17',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'বাবুর্চির মজুরি প্রদান',
    amount: 14500,
    receiptNo: '17',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_18',
    date: '2025-09-20',
    type: 'expense',
    category: 'মাইক ও সাউন্ড সিস্টেম',
    description: 'মাইক ভাড়া ও বোনাস',
    amount: 17000,
    receiptNo: '18',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_19',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'পাঞ্জাবির কাপড় ক্রয় ও যাতায়ত',
    amount: 25990,
    receiptNo: '19',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_20',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'বড় হুজুর কেবলা',
    amount: 7000,
    receiptNo: '20',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_21',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'ছোট হুজুর কেবলা/ শাহজাদা',
    amount: 5000,
    receiptNo: '21',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_22',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাওঃ ইদ্রিস আনসারী',
    amount: 17200,
    receiptNo: '22',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_23',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাওঃ সেকান্দর হোসেন',
    amount: 13200,
    receiptNo: '23',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_24',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাওঃ আ.ন.ম নাজমুল হোসাইন নঈমী',
    amount: 2000,
    receiptNo: '24',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_25',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাওঃ আজিজ হুজুর',
    amount: 2000,
    receiptNo: '25',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_26',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাওঃ রাহাতুল মোস্তাফা',
    amount: 1000,
    receiptNo: '26',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_27',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাওঃ আঃ খালেক হুজুর',
    amount: 5150,
    receiptNo: '27',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_28',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাওঃ হানিফ হুজুর',
    amount: 500,
    receiptNo: '28',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_29',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'কেরাত ও নাতে মোস্তফার পুরস্কার প্রদান',
    amount: 6280,
    receiptNo: '29',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_30',
    date: '2025-09-20',
    type: 'expense',
    category: 'পোস্টার ও মাইকিং প্রচার',
    description: 'প্রচার ও মাইক ভাড়া',
    amount: 1200,
    receiptNo: '30',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_31',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'মুরগি, মাছ ও ডিম ক্রয়',
    amount: 3110,
    receiptNo: '31',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_32',
    date: '2025-09-20',
    type: 'expense',
    category: 'স্টেশনারি ও যাতায়াত',
    description: 'যাতায়াত ও পরিবহণ খরচ',
    amount: 6090,
    receiptNo: '32',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_33',
    date: '2025-09-20',
    type: 'expense',
    category: 'পোস্টার ও মাইকিং প্রচার',
    description: 'প্রিন্টিং খরচ',
    amount: 8050,
    receiptNo: '33',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_34',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'গরুর খাবার ক্রয়',
    amount: 350,
    receiptNo: '34',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_35',
    date: '2025-09-20',
    type: 'expense',
    category: 'স্টেশনারি ও যাতায়াত',
    description: 'ফটোকপি ও মনিহারি ক্রয়',
    amount: 465,
    receiptNo: '35',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_36',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'ছালেহীয়ার ছেলেদের শরবত বিতরণ',
    amount: 1000,
    receiptNo: '36',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_37',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'শিয়াল বুদ্দার মাহফিলের চাঁদা',
    amount: 500,
    receiptNo: '37',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_38',
    date: '2025-09-20',
    type: 'expense',
    category: 'মাইক ও সাউন্ড সিস্টেম',
    description: 'হ্যান্ড মাইক ক্রয়',
    amount: 750,
    receiptNo: '38',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_39',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'পতাকার কাপড় ক্রয় ও সেলাই',
    amount: 2060,
    receiptNo: '39',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_40',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'আপ্যায়ন ব্যয়',
    amount: 2987,
    receiptNo: '40',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_41',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'টেপ, কুঁড়া, ডিম জালি',
    amount: 645,
    receiptNo: '41',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_42',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'হুজুর কেবলার গাড়ি সাজ',
    amount: 7000,
    receiptNo: '42',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_43',
    date: '2025-09-20',
    type: 'expense',
    category: 'পোস্টার ও মাইকিং প্রচার',
    description: 'মিডিয়া প্রচার',
    amount: 1000,
    receiptNo: '43',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_44',
    date: '2025-09-20',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'হাফেজদের সম্মানী',
    amount: 1100,
    receiptNo: '44',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_45',
    date: '2025-09-20',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'শহরে তবাররুক প্রেরণে ফিল্টার ভাড়া',
    amount: 2400,
    receiptNo: '45',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_46',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'ইট ক্রয়',
    amount: 1100,
    receiptNo: '46',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_47',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'চাঁদা বকেয়া ও ফেরত',
    amount: 3000,
    receiptNo: '47',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_48',
    date: '2025-09-20',
    type: 'expense',
    category: 'স্টেশনারি ও যাতায়াত',
    description: 'তাজু ড্রাইভারের গাড়ি ভাড়া',
    amount: 700,
    receiptNo: '48',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  },
  {
    id: 't2025_49',
    date: '2025-09-20',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'পাঞ্জাবি সেলাই খরচ',
    amount: 24500,
    receiptNo: '49',
    recordedBy: 'মো: তারেক জামাল',
    year: 2025
  }
];

export const defaultCategories = {
  income: ['সদস্য চাঁদা', 'প্রবাসী অনুদান', 'স্থানীয় অনুদান', 'সাধারণ রশিদ কালেকশন', 'ব্যবসায়ী অনুদান', 'অন্যান্য'],
  expense: ['মঞ্চ ও ডেকোরেশন', 'মাইক ও সাউন্ড সিস্টেম', 'বক্তা ও অতিথি হাদিয়া', 'পোস্টার ও মাইকিং প্রচার', 'তাবাররুক ও আপ্যায়ন', 'আলোকসজ্জা', 'স্টেশনারি ও যাতায়াত', 'অন্যান্য']
};

export const initialScholars: InvitedScholar[] = [
  { id: 's1', name: 'আল্লামা মুফতি ওবাইদুল্লাহ আশরাফী আল-কাদেরী', title: 'প্রধান বক্তা, আন্তর্জাতিক খ্যাতিসম্পন্ন ইসলামী চিন্তাবিদ ও মুফাসসিরে কুরআন (ঢাকা)', topic: 'পবিত্র মিলাদুন্নবী (দঃ) ও আকিদা আহলে সুন্নাত ওয়াল জামাত', serialNo: 1 },
  { id: 's2', name: 'মাওলানা হাফেজ কারী কুতুব উদ্দিন আল-কাদেরী', title: 'বিশেষ বক্তা, খতিব - ষোলশহর জামে মসজিদ (চট্টগ্রাম)', topic: 'তাজিম এ মোস্তফা ও জশনে জুলুস উদযাপন', serialNo: 2 },
  { id: 's3', name: 'মাওলানা মোহাম্মদ আলী আকবর নুরী', title: 'আমন্ত্রিত বক্তা, মুহাদ্দিস - স্থানীয় আলিয়া মাদ্রাসা (রাঙ্গুনিয়া)', topic: 'মানব কল্যাণে রাসূল (দঃ) এর আদর্শ', serialNo: 3 },
];

export const initialActivities: ActivityService[] = [
  { id: 'a1', title: 'দ্বীনি আলোচনা ও ওয়ায', description: 'দেশবরেণ্য ও আন্তর্জাতিক খ্যাতিসম্পন্ন ওলামায়ে কেরাম ও মাশাейখদের আমন্ত্রণ জানিয়ে খাঁটি সুন্নী আকিদা ও আমলের সঠিক আলোচনা পেশ করা।' },
  { id: 'a2', title: 'তাবাররুক বিতরণ', description: 'পবিত্র মিলাদুন্নবী (দঃ) মাহফিল শেষে শরিক হওয়া হাজারো আশেকে রাসূল ধর্মপ্রাণ মুসলমানদের মাঝে সুশৃঙ্খলভাবে নেয়ামত ও তাবাররুক বিতরণ নিশ্চিত করা।' },
  { id: 'a3', title: 'আয়-ব্যয় হিসাবের স্বচ্ছতা', description: 'সাধারণ জনগণ ও প্রবাসী ভাইদের কষ্টার্জিত আমানতের প্রতিটি টাকার হিসাবের সর্বোচ্চ স্বচ্ছতা ডিজিটাল পোর্টালের মাধ্যমে নিশ্চিত করা।' }
];
