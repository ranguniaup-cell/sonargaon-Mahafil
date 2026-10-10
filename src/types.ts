export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense'; // আয় | ব্যয়
  category: string; // খাত
  amount: number; // টাকা
  donorName?: string; // দাতার নাম (আয়ের ক্ষেত্রে)
  description?: string; // বিবরণ
  receiptNo?: string; // রশিদ নং
  recordedBy: string; // কে এন্ট্রি করেছে
  year?: number; // বছর (২০২৪, ২০২৫, ২০২৬ ইত্যাদি)
  houseName?: string; // বাড়ির নাম (নতুন বাড়ির চাঁদার জন্য)
  donationType?: 'cash' | 'item'; // চাঁদার ধরণ: নগদ টাকা নাকি পণ্য/দ্রব্য দান
  itemName?: string; // দানকৃত পণ্যের নাম ও পরিমাণ (যেমন: ১ বস্তা চাল, ৫ কেজি তেল, ১ মণ চিনি ইত্যাদি)
  createdAt?: number; // পোস্টিং তৈরির টাইমস্ট্যাম্প (FIFO ক্রম বজায় রাখার জন্য)
}

export interface CommitteeMember {
  id: string;
  name: string;
  designation: string;
  phone?: string;
  type: 'leader' | 'member' | 'advisor';
  serialNo: number;
}

export interface Announcement {
  id: string;
  date: string;
  title: string;
  content: string;
  isActive: boolean;
}

export interface MahfilProgramItem {
  id: string;
  time: string; // যেমন: "সকাল ০৮:০০ ঘটিকা", "বাদ যোহর", "বাদ মাগরিব", "রাত ১১:০০ ঘটিকা"
  title: string; // কর্মসূচির শিরোনাম, যেমন: "ঐতিহাসিক বর্ণাঢ্য জশনে জুলুস", "কুরআন তিলাওয়াত ও হামদ-নাত", "প্রধান বক্তার নসীহত"
  speaker?: string; // বক্তা / মেহমান / পরিচালনাকারী
  details?: string; // কর্মসূচির বিস্তারিত তথ্য
}

export interface MahfilDetails {
  year?: number; // সক্রিয় মাহফিল বছর (যেমন: ২০২৭, ২০২৬ ইত্যাদি)
  date: string;
  time: string;
  location: string;
  targetDate: string;
  theme?: string; // মাহফিলের স্লোগান বা প্রতিপাদ্য বিষয়
  programs?: MahfilProgramItem[]; // বিস্তারিত কর্মসূচি ও সময়সূচী
  isFinancePublic?: boolean; // অ্যাডমিন কর্তৃক সর্বসাধারণের জন্য আয়-ব্যয় উন্মুক্তকরণের অনুমোদন
  isReportPublic?: boolean;  // অ্যাডমিন কর্তৃক সর্বসাধারণের জন্য রিপোর্ট মেনু ও ডাউনলোড কেন্দ্র উন্মুক্তকরণের অনুমোদন
}

export interface InvitedScholar {
  id: string;
  name: string; // হুজুরের নাম
  title: string; // উপাধি / পরিচয়
  topic?: string; // আলোচনার বিষয়
  serialNo: number; // সিরিয়াল নম্বর
}

export interface ActivityService {
  id: string;
  title: string;
  description: string;
}

export interface GalleryPhoto {
  id: string;
  title: string; // ছবির শিরোনাম / ক্যাপশন
  url: string; // ছবির লিঙ্ক বা বেস৬৪ ডাটা
  category?: string; // ক্যাটাগরি (যেমন: জশনে জুলুস, মাহফিল ময়দান, আলোকসজ্জা, তাবাররুক বিতরণ ইত্যাদি)
  date?: string; // ছবি ধারণের তারিখ
  serialNo?: number; // ক্রম
}

export interface VisitorLog {
  id: string;
  timestamp: number;
  date: string;
  time: string;
  page: string;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  visitorId: string;
  isNew?: boolean;
}

export interface ActiveSession {
  sessionId: string;
  visitorId: string;
  lastActive: number;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
  page: string;
}

export interface VisitorSummary {
  totalVisits: number;
  uniqueVisitors: number;
  todayVisits: number;
  activeNow: number;
  dailyVisits: Record<string, number>;
  deviceBreakdown: {
    mobile: number;
    desktop: number;
    tablet: number;
  };
  browserBreakdown: Record<string, number>;
  pageBreakdown: Record<string, number>;
  lastUpdated?: number;
}

