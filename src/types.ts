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

export interface MahfilDetails {
  date: string;
  time: string;
  location: string;
  targetDate: string;
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

