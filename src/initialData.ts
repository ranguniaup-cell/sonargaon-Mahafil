import { CommitteeMember, Transaction, InvitedScholar, ActivityService, GalleryPhoto, MahfilDetails, MahfilProgramItem } from './types';

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
    type: 'expense',
    category: 'অন্যান্য',
    description: '২০২৪ সালের উদ্বৃত্ত হতে অগ্রিম খরচ সমন্বয়',
    amount: 40000,
    receiptNo: '১২',
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
  },
  {
    id: 't2024_i01',
    date: '2024-09-28',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 141712,
    donorName: 'রশিদ বই নং-০১ হতে প্রাপ্ত আয়',
    receiptNo: '01',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i02',
    date: '2024-09-28',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 77020,
    donorName: 'রশিদ বই নং-০২ হতে প্রাপ্ত আয়',
    receiptNo: '02',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i03',
    date: '2024-09-28',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 52511,
    donorName: 'রশিদ বই নং-০৩ হতে প্রাপ্ত আয়',
    receiptNo: '03',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i04',
    date: '2024-09-28',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 55400,
    donorName: 'রশিদ বই নং-০৪ হতে প্রাপ্ত আয়',
    receiptNo: '04',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i05',
    date: '2024-09-28',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 40500,
    donorName: 'রশিদ বই নং-০৫ হতে প্রাপ্ত আয়',
    receiptNo: '05',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i06',
    date: '2024-09-28',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 46500,
    donorName: 'রশিদ বই নং-০৬ হতে প্রাপ্ত আয়',
    receiptNo: '06',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i07',
    date: '2024-09-28',
    type: 'income',
    category: 'সদস্য চাঁদা',
    amount: 47500,
    donorName: 'রশিদ বই নং-০৭ হতে প্রাপ্ত আয়',
    receiptNo: '07',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i08',
    date: '2024-09-28',
    type: 'income',
    category: 'অন্যান্য',
    amount: 4300,
    donorName: 'বিবিধ আয় (নলা ও চামড়া)',
    receiptNo: '08',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_i09',
    date: '2024-09-28',
    type: 'income',
    category: 'অন্যান্য',
    amount: -5500,
    donorName: 'বকেয়া সমন্বয় (উক্ত টাকা মালিক পক্ষ এখনো প্রদান করেনি)',
    description: 'মালিক পক্ষ কর্তৃক বকেয়া যা এখনো সংগৃহীত হয়নি',
    receiptNo: '09',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e01',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: '১টি ০৫ মণ ওজনের গরু ক্রয়',
    amount: 118100,
    receiptNo: 'v01',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e02',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'গরুর মাংস ক্রয় ৬০ কেজি',
    amount: 37800,
    receiptNo: 'v02',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e03',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'চাউল ১৫ বস্তা',
    amount: 27150,
    receiptNo: 'v03',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e04',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'লাকড়ী ক্রয় ১৬ মণ',
    amount: 8000,
    receiptNo: 'v04',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e05',
    date: '2024-09-28',
    type: 'expense',
    category: 'মঞ্চ ও ডেকোরেশন',
    description: 'ডেকোরেশন খরচ',
    amount: 21000,
    receiptNo: 'v05',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e06',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'কাঁচা বাজার',
    amount: 8650,
    receiptNo: 'v06',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e07',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'বাবুর্চিকে প্রদান',
    amount: 12700,
    receiptNo: 'v07',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e08',
    date: '2024-09-28',
    type: 'expense',
    category: 'মাইক ও সাউন্ড সিস্টেম',
    description: 'মাইক ভাড়া',
    amount: 10300,
    receiptNo: 'v08',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e09',
    date: '2024-09-28',
    type: 'expense',
    category: 'পোস্টার ও মাইকিং প্রচার',
    description: 'গাড়ী ভাড়া সম্পূর্ণ এবং মাইকিং করা',
    amount: 5220,
    receiptNo: 'v09',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e10',
    date: '2024-09-28',
    type: 'expense',
    category: 'স্টেশনারি ও যাতায়াত',
    description: 'মনিহারী ক্রয়',
    amount: 1010,
    receiptNo: 'v10',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e11',
    date: '2024-09-28',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'ইট ক্রয় ১০০ পিস',
    amount: 1000,
    receiptNo: 'v11',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e12',
    date: '2024-09-28',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'সাংбавить কে প্রদান',
    amount: 1500,
    receiptNo: 'v12',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e13',
    date: '2024-09-28',
    type: 'expense',
    category: 'পোস্টার ও মাইকিং প্রচার',
    description: 'প্রিন্টিং তথা রশিদ বই, ব্যানার, প্রচার পত্র',
    amount: 5500,
    receiptNo: 'v13',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e14',
    date: '2024-09-28',
    type: 'expense',
    category: 'মঞ্চ ও ডেকোরেশন',
    description: 'ফুলের মালা ও সাজ-সজ্জা',
    amount: 3100,
    receiptNo: 'v14',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e15',
    date: '2024-09-28',
    type: 'expense',
    category: 'মঞ্চ ও ডেকোরেশন',
    description: 'বাঁশ ক্রয়',
    amount: 450,
    receiptNo: 'v15',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e16',
    date: '2024-09-28',
    type: 'expense',
    category: 'স্টেশনারি ও যাতায়াত',
    description: 'ডেম্পার ভাড়া তথা তেল খরচ (আলমগীর)',
    amount: 1000,
    receiptNo: 'v16',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e17',
    date: '2024-09-28',
    type: 'expense',
    category: 'স্টেশনারি ও যাতায়াত',
    description: 'টলি ভাড়া আলম',
    amount: 300,
    receiptNo: 'v17',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e18',
    date: '2024-09-28',
    type: 'expense',
    category: 'স্টেশনারি ও যাতায়াত',
    description: 'শহরে যাতায়ত (অছি)',
    amount: 300,
    receiptNo: 'v18',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e19',
    date: '2024-09-28',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'গরিব মানুষ লসু কে প্রদান',
    amount: 500,
    receiptNo: 'v19',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e20',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'দই টক ১০ পিস × ১৩০',
    amount: 1300,
    receiptNo: 'v20',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e21',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'guest, decoration, baburchi etc entertainment',
    amount: 5901,
    receiptNo: 'v21',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e22',
    date: '2024-09-28',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'কোরআন খতব (৪ জন)',
    amount: 1500,
    receiptNo: 'v22',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e23',
    date: '2024-09-28',
    type: 'expense',
    category: 'তাবাররুক ও আপ্যায়ন',
    description: 'মুদির দোকান বাজার',
    amount: 52417,
    receiptNo: 'v23',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e24',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'হুজুর কেবলা কে হাদিয়া প্রদান',
    amount: 4000,
    receiptNo: 'v24',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e25',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'হুজুরে সাহজাদা কে হাদিয়া প্রদান',
    amount: 5000,
    receiptNo: 'v25',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e26',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'আ.ন.ম নাজমুল হোসাইন কে হাদিয়া প্রদান',
    amount: 2000,
    receiptNo: 'v26',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e27',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাও. আজিজুল হক কে হাদিয়া প্রদান',
    amount: 1000,
    receiptNo: 'v27',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e28',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাও. রাহাতুল মোস্তফা কে হাদিয়া প্রদান',
    amount: 1000,
    receiptNo: 'v28',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e29',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাও. হানিফ হুজুর কে হাদিয়া প্রদান',
    amount: 500,
    receiptNo: 'v29',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e30',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাও. আহমদ হোসাইন কে হাদিয়া প্রদান',
    amount: 10500,
    receiptNo: 'v30',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e31',
    date: '2024-09-28',
    type: 'expense',
    category: 'বক্তা ও অতিথি হাদিয়া',
    description: 'মাও. আবুল কালাম বয়ানী কে হাদিয়া প্রদান',
    amount: 15000,
    receiptNo: 'v31',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2024_e32',
    date: '2024-09-28',
    type: 'expense',
    category: 'অন্যান্য',
    description: 'বিবিধ খরচ',
    amount: 500,
    receiptNo: 'v32',
    recordedBy: 'মো: তারেক জামাল',
    year: 2024
  },
  {
    id: 't2023_opening',
    date: '2023-12-31',
    type: 'income',
    category: 'অন্যান্য',
    amount: 47000,
    donorName: '২০২২ (১৩,০৯২/-) ও ২০২৩ (৩৩,৯০৮/-) সালের সমন্বিত হাতে নগদ উদ্বৃত্ত',
    description: '২০২২ সালের হাতে নগদ ১৩,০৯২/- টাকা এবং ২০২৩ সালের হাতে নগদ ৩৩,৯০৮/- টাকা সমন্বিত করে মোট ৪৭,০০০/- টাকা প্রারম্ভিক উদ্বৃত্ত হিসেবে ২০২৩ সালে প্রদর্শন',
    receiptNo: 'সমন্বয়',
    recordedBy: 'মো: তারেক জামাল',
    year: 2023
  }
];

export const defaultCategories = {
  income: ['চাঁদা ও অনুদান', 'অন্যান্য'],
  expense: ['মঞ্চ ও ডেকোরেশন', 'মাইক ও সাউন্ড সিস্টেম', 'বক্তা ও অতিথি হাদিয়া', 'পোস্টার ও মাইকিং প্রচার', 'তাবাররুক ও আপ্যায়ন', 'আলোকসজ্জা', 'স্টেশনারি ও যাতায়াত', 'অন্যান্য']
};

export const initialScholars: InvitedScholar[] = [
  { id: 's0', name: 'ছৈয়দ মুহাম্মদ মছিহুদ্দৌলা(মা:জি:আ:)', title: 'মহাসচিব -আহলে সুন্নাত ওয়াল জামা\'য়াত বাংলাদেশ। সাজ্জাদানশীল, ছৈয়দ বাড়ী দরবার শরীফ, ফটিকছড়ি', topic: 'সভাপতিত্ব করবেন', serialNo: 1 },
  { id: 's1', name: 'আল্লামা মুফতি ওবাইদুল্লাহ আশরাফী আল-কাদেরী', title: 'আন্তর্জাতিক খ্যাতিসম্পন্ন ইসলামী চিন্তাবিদ ও মুফাসসিরে কুরআন (ঢাকা)', topic: 'পবিত্র মিলাদুন্নবী (দঃ) ও আকিদা আহলে সুন্নাত ওয়াল জামাত', serialNo: 2 },
  { id: 's2', name: 'মাওলানা হাফেজ কারী কুতুব উদ্দিন আল-কাদেরী', title: 'খতিব - ষোলশহর জামে মসজিদ (চট্টগ্রাম)', topic: 'তাজিম এ মোস্তফা ও জশনে জুলুস উদযাপন', serialNo: 3 },
  { id: 's3', name: 'মাওলানা মোহাম্মদ আলী আকবর নুরী', title: 'মুহাদ্দিস - স্থানীয় আলিয়া মাদ্রাসা (রাঙ্গুনিয়া)', topic: 'মানব কল্যাণে রাসূল (দঃ) এর আদর্শ', serialNo: 4 },
];

export const initialActivities: ActivityService[] = [
  { 
    id: 'a1', 
    title: 'দ্বীনি আলোচনা ও ওয়ায', 
    description: 'দেশবরেণ্য ও আন্তর্জাতিক খ্যাতিসম্পন্ন ওলামায়ে কেরাম ও মাশায়েখদের আমন্ত্রণ জানিয়ে খাঁটি সুন্নী আকিদা ও আমলের সঠিক আলোচনা পেশ করা।' 
  },
  { 
    id: 'a2', 
    title: 'ঐতিহাসিক বর্ণাঢ্য জশনে জুলুস উদযাপন', 
    description: '১২ই রবিউল আউয়াল সকালে বিশ্বনবী (দঃ) এর শুভাগমন উপলক্ষে এলাকার ধর্মপ্রাণ তৌহিদী জনতার স্বতঃস্ফূর্ত অংশগ্রহণে বর্ণাঢ্য আনন্দ মিছিল ও জুলুস উদযাপন।' 
  },
  { 
    id: 'a3', 
    title: 'তাবাররুক বিতরণ ও মেহমানদারি', 
    description: 'পবিত্র মিলাদুন্নবী (দঃ) মাহফিল শেষে শরিক হওয়া হাজারো আশেকে রাসূল ধর্মপ্রাণ মুসলমানদের মাঝে সুশৃঙ্খলভাবে নেয়ামত ও তাবাররুক বিতরণ নিশ্চিত করা।' 
  },
  { 
    id: 'a4', 
    title: 'কুরআন তিলাওয়াত ও হামদ-না’ত প্রতিযোগিতা', 
    description: 'স্থানীয় মাদ্রাসা, হেফজখানা ও স্কুল-কলেজের কোমলমতি শিক্ষার্থীদের অংশগ্রহণে বিশুদ্ধ কিরাত ও না’তে রাসুল (দঃ) প্রতিযোগিতা এবং কৃতিদের সম্মাননা প্রদান।' 
  },
  { 
    id: 'a5', 
    title: 'অসহায় ও দুস্থদের মাঝে কল্যাণ সহায়তা', 
    description: 'পবিত্র মাহফিল উপলক্ষে এলাকার গরিব, এতিম ও দুস্থ পরিবারের মাঝে খাদ্য ও বস্ত্র সহায়তা এবং রক্তদান ক্যাম্প কর্মসূচি পরিচালনা।' 
  },
  { 
    id: 'a6', 
    title: 'আয়-ব্যয় হিসাবের শতভাগ স্বচ্ছতা', 
    description: 'সাধারণ জনগণ ও প্রবাসী ভাইদের কষ্টার্জিত আমানতের প্রতিটি টাকার হিসাবের সর্বোচ্চ স্বচ্ছতা ডিজিটাল পোর্টাল ও লেজারের মাধ্যমে নিশ্চিত করা।' 
  }
];

export const initialGalleryPhotos: GalleryPhoto[] = [
  {
    id: 'photo_1',
    title: 'সোনারগাঁও আজিমুশশান জশনে জুলুসের বর্ণাঢ্য শোভাযাত্রা',
    url: 'https://images.unsplash.com/photo-1591604129939-f1efa4d9f7fa?auto=format&fit=crop&w=1200&q=80',
    category: 'জশনে জুলুস',
    date: '১২ই রবিউল আউয়াল',
    serialNo: 1
  },
  {
    id: 'photo_2',
    title: 'মাহফিলের সুবিশাল প্যান্ডেল ও আলোকোজ্জ্বল মূল মঞ্চ',
    url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=1200&q=80',
    category: 'মাহফিল ময়দান',
    date: 'মাহফিল রজনী',
    serialNo: 2
  },
  {
    id: 'photo_3',
    title: 'রাতের নয়নাভিরাম তোরণ ও সড়ক আলোকসজ্জা',
    url: 'https://images.unsplash.com/photo-1519817650390-64a93db51149?auto=format&fit=crop&w=1200&q=80',
    category: 'আলোকসজ্জা',
    date: 'প্রস্তুতি সপ্তাহ',
    serialNo: 3
  },
  {
    id: 'photo_4',
    title: 'ধর্মপ্রাণ আশেকে রাসূলদের মাঝে সুশৃঙ্খল তাবাররুক বিতরণ',
    url: 'https://images.unsplash.com/photo-1564769625905-50e93615e769?auto=format&fit=crop&w=1200&q=80',
    category: 'তাবাররুক বিতরণ',
    date: 'মাহফিল সমাপনী',
    serialNo: 4
  },
  {
    id: 'photo_5',
    title: 'উদযাপন পরিষদের প্রস্তুতি ও এলাকা ভিত্তিক সমন্বয় সভা',
    url: 'https://images.unsplash.com/photo-1577962917302-cd874c4e31d2?auto=format&fit=crop&w=1200&q=80',
    category: 'প্রস্তুতি ও সভা',
    date: 'সমন্বয় বৈঠক',
    serialNo: 5
  },
  {
    id: 'photo_6',
    title: 'আমন্ত্রিত ওলামায়ে কেরামের মোবারক তাকরীর ও দোয়া মোনাজাত',
    url: 'https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?auto=format&fit=crop&w=1200&q=80',
    category: 'মাহফিল ময়দান',
    date: 'আখেরী মোনাজাত',
    serialNo: 6
  }
];

export const initial2026Programs: MahfilProgramItem[] = [
  {
    id: 'prog_1',
    time: 'সকাল ০৮:০০ ঘটিকা',
    title: 'ঐতিহাসিক বর্ণাঢ্য জশনে জুলুস ও শোভাযাত্রা',
    speaker: 'উদযাপন পরিষদ, গণ্যমান্য ব্যক্তিবর্গ ও সর্বস্তরের আশেকে রাসুল',
    details: 'সোনারগাঁও জামে মসজিদ ও প্রাথমিক বিদ্যালয় প্রাঙ্গণ থেকে শুরু হয়ে প্রধান প্রধান সড়ক প্রদক্ষিণ, সালাতু সালাম ও দোয়া।'
  },
  {
    id: 'prog_2',
    time: 'সকাল ১০:৩০ ঘটিকা',
    title: 'পবিত্র কুরআন খতম, হামদ-নাত ও কিরাত প্রতিযোগিতা',
    speaker: 'স্থানীয় মাদ্রাসা ও হেফজখানার শিক্ষার্থী এবং বিচারকমণ্ডলী',
    details: 'কোরআনে কারীমের তিলাওয়াত, না’তে রাসুল প্রতিযোগিতা ও কৃতি শিক্ষার্থীদের মাঝে বিশেষ পুরস্কার বিতরণ।'
  },
  {
    id: 'prog_3',
    time: 'বাদ যোহর (দুপুর ০২:০০ ঘটিকা)',
    title: 'উদ্বোধনী অধিবেশন ও স্থানীয় ওলামায়ে কেরামের তাকরীর',
    speaker: 'স্থানীয় বরেণ্য ওলামায়ে কেরাম ও খতীববৃন্দ',
    details: 'সীরাতুন্নবী (দঃ) ও ঈদে মিলাদুন্নবী (দঃ) এর তাৎপর্য শীর্ষক মোবারক আলোচনা ও বয়ান।'
  },
  {
    id: 'prog_4',
    time: 'বাদ আসর (বিকাল ০৪:৪৫ ঘটিকা)',
    title: 'বিশেষ অতিথি ও আমন্ত্রিত মেহমানদের জ্ঞানগর্ভ নসীহত',
    speaker: 'আমন্ত্রিত বিশিষ্ট ওলামায়ে কেরাম ও শিক্ষাবিদগণ',
    details: 'রাসূলুল্লাহ (দঃ) এর জীবনাদর্শ, সুন্নাত ও মুসলিম উম্মাহর ঐক্য রক্ষা বিষয়ে বিশেষ নসীহত ও দিকনির্দেশনা।'
  },
  {
    id: 'prog_5',
    time: 'বাদ মাগরিব (সন্ধ্যা ০৬:১৫ ঘটিকা)',
    title: 'আজিমুশশান মূল মাহফিল ও প্রধান বক্তার বিশেষ বয়ান',
    speaker: 'আন্তর্জাতিক ও দেশবরেণ্য প্রধান বক্তা এবং বিশিষ্ট আলোচকবৃন্দ',
    details: 'পবিত্র কুরআন ও সহীহ হাদিসের আলোকে তাফসীর, আকিদায়ে আহলে সুন্নাত ও হেদায়াতি বয়ান।'
  },
  {
    id: 'prog_6',
    time: 'বাদ এশা ও রাত ১১:০০ ঘটিকা',
    title: 'সালাতু সালাম, আখেরী মোনাজাত ও তাবাররুক বিতরণ',
    speaker: 'পীর-মাশায়েখ, ওলামা পরিষদ ও উদযাপন পরিষদ',
    details: 'বিশ্ব মুসলিম উম্মাহ ও দেশের সমৃদ্ধি কামনায় আখেরী মোনাজাত এবং সমবেত হাজারো ভক্তের মাঝে সুশৃঙ্খল তাবাররুক বিতরণ।'
  }
];

export const initial2027Programs: MahfilProgramItem[] = [
  {
    id: 'prog_27_1',
    time: 'সকাল ০৮:০০ ঘটিকা',
    title: 'ঐতিহাসিক বর্ণাঢ্য জশনে জুলুস ও শোভাযাত্রা',
    speaker: 'উদযাপন পরিষদ ও স্থানীয় গণ্যমান্য ব্যক্তিবর্গ',
    details: 'সোনারগাঁও জামে মসজিদ প্রাঙ্গণ থেকে শুরু হয়ে প্রধান প্রধান সড়ক প্রদক্ষিণ ও সালাতু সালাম।'
  },
  {
    id: 'prog_27_2',
    time: 'সকাল ১০:৩০ ঘটিকা',
    title: 'পবিত্র কুরআন খতম, হামদ-নাত ও কিরাত প্রতিযোগিতা',
    speaker: 'স্থানীয় মাদ্রাসা ও হেফজখানার শিক্ষার্থী এবং ক্বারী সাহেবগণ',
    details: 'কোরআনে কারীমের তিলাওয়াত ও কৃতি শিক্ষার্থীদের মাঝে বিশেষ পুরস্কার বিতরণ।'
  },
  {
    id: 'prog_27_3',
    time: 'বাদ যোহর (দুপুর ০২:০০ ঘটিকা)',
    title: 'উদ্বোধনী অধিবেশন ও স্থানীয় ওলামায়ে কেরামের তাকরীর',
    speaker: 'স্থানীয় বরেণ্য ওলামা ও খতীববৃন্দ',
    details: 'সীরাতুন্নবী (দঃ) ও ঈদে মিলাদুন্নবী (দঃ) এর তাৎপর্য শীর্ষক মোবারক আলোচনা।'
  },
  {
    id: 'prog_27_4',
    time: 'বাদ আসর (বিকাল ০৪:৪৫ ঘটিকা)',
    title: 'বিশেষ অতিথি ও আমন্ত্রিত মেহমানদের জ্ঞানগর্ভ নসীহত',
    speaker: 'আমন্ত্রিত বিশিষ্ট ওলামায়ে কেরাম',
    details: 'রাসূলুল্লাহ (দঃ) এর জীবনাদর্শ, সুন্নাত ও মুসলিম উম্মাহর ঐক্য রক্ষা বিষয়ে বিশেষ নসীহত।'
  },
  {
    id: 'prog_27_5',
    time: 'বাদ মাগরিব (সন্ধ্যা ০৬:১৫ ঘটিকা)',
    title: 'আজিমুশশান মূল মাহফিল ও প্রধান বক্তার বিশেষ বয়ান',
    speaker: 'প্রধান মেহমান ও প্রধান বক্তা',
    details: 'পবিত্র কুরআন ও সহীহ হাদিসের আলোকে তাফসীর এবং হেদায়াতি বয়ান।'
  },
  {
    id: 'prog_27_6',
    time: 'বাদ এশা ও রাত ১১:০০ ঘটিকা',
    title: 'সালাতু সালাম, আখেরী মোনাজাত ও তাবাররুক বিতরণ',
    speaker: 'পীর-মাশায়েখ ও ওলামা পরিষদ',
    details: 'বিশ্ব মুসলিম উম্মাহর শান্তি ও মাগফিরাত কামনায় বিশেষ দোয়া এবং সুশৃঙ্খল তাবাররুক বণ্টন।'
  }
];

export const initialMahfilDetails: MahfilDetails = {
  year: 2026,
  date: '১২ই রবিউল আউয়াল ১৪৪৮ হিজরী (সম্ভাব্য ০৫ সেপ্টেম্বর ২০২৬ খ্রি.)',
  time: 'সকাল ৮:০০ ঘটিকা হতে বর্ণাঢ্য জশনে জুলুস এবং যোহরের নামাজের পর হতে মূল আজিমুশশান মাহফিল।',
  location: 'সোনারগাঁও সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন সুবিশাল ময়দান, রাঙ্গুনিয়া, চট্টগ্রাম।',
  targetDate: '2026-09-05',
  theme: 'বিশ্বশান্তি প্রতিষ্ঠায় রাসূলুল্লাহ (দঃ) এর জীবনাদর্শই একমাত্র মুক্তির পথ',
  programs: initial2026Programs,
  isFinancePublic: false,
  isReportPublic: false
};
