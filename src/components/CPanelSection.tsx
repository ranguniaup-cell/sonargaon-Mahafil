import React from 'react';
import { Transaction, CommitteeMember, MahfilDetails, InvitedScholar, ActivityService } from '../types';
import { defaultCategories } from '../initialData';
import { Lock, Unlock, Plus, Trash2, Key, Info, CheckCircle, AlertCircle, RefreshCw, Upload, Download, Eye, Pencil, Edit, Calendar, Mic, Sparkles, Users } from 'lucide-react';

interface CPanelSectionProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onDeleteTransaction: (id: string) => void;
  committeeMembers: CommitteeMember[];
  onAddMember: (m: Omit<CommitteeMember, 'id'>) => void;
  onUpdateMember: (m: CommitteeMember) => void;
  onDeleteMember: (id: string) => void;
  scholars?: InvitedScholar[];
  onAddScholar: (s: Omit<InvitedScholar, 'id'>) => void;
  onUpdateScholar: (s: InvitedScholar) => void;
  onDeleteScholar: (id: string) => void;
  activities?: ActivityService[];
  onAddActivity: (act: Omit<ActivityService, 'id'>) => void;
  onUpdateActivity: (act: ActivityService) => void;
  onDeleteActivity: (id: string) => void;
  mahfilDetails: MahfilDetails;
  onUpdateMahfilDetails: (d: MahfilDetails) => void;
  onResetData: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (status: boolean) => void;
}

export default function CPanelSection({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  committeeMembers,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  scholars = [],
  onAddScholar,
  onUpdateScholar,
  onDeleteScholar,
  activities = [],
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  mahfilDetails,
  onUpdateMahfilDetails,
  onResetData,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
}: CPanelSectionProps) {
  // Login form state
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');

  // Transaction form state
  const [tDate, setTDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [tYear, setTYear] = React.useState<number>(2026);
  const [tType, setTType] = React.useState<'income' | 'expense'>('income');
  const [tCategory, setTCategory] = React.useState(defaultCategories.income[0]);
  const [tCustomCategory, setTCustomCategory] = React.useState('');
  const [tAmount, setTAmount] = React.useState('');
  const [tDonor, setTDonor] = React.useState('');
  const [tDesc, setTDesc] = React.useState('');
  const [tReceipt, setTReceipt] = React.useState('');
  const [tRecordedBy, setTRecordedBy] = React.useState('মো: তারেক জামাল');
  const [tSuccessMsg, setTSuccessMsg] = React.useState('');

  // Sync year with selected date
  React.useEffect(() => {
    if (tDate) {
      const yearPart = new Date(tDate).getFullYear();
      if (yearPart && !isNaN(yearPart)) {
        setTYear(yearPart);
      }
    }
  }, [tDate]);

  // Member form state
  const [mName, setMName] = React.useState('');
  const [mDesignation, setMDesignation] = React.useState('');
  const [mType, setMType] = React.useState<'leader' | 'member' | 'advisor'>('leader');
  const [mSuccessMsg, setMSuccessMsg] = React.useState('');

  // Member inline editing states
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editDesignation, setEditDesignation] = React.useState('');
  const [editType, setEditType] = React.useState<'leader' | 'member' | 'advisor'>('leader');
  const [editSerialNo, setEditSerialNo] = React.useState('');

  // Mahfil details states
  const [mahfilDate, setMahfilDate] = React.useState(mahfilDetails.date);
  const [mahfilTime, setMahfilTime] = React.useState(mahfilDetails.time);
  const [mahfilLocation, setMahfilLocation] = React.useState(mahfilDetails.location);
  const [mahfilTargetDate, setMahfilTargetDate] = React.useState(mahfilDetails.targetDate);
  const [mahfilSuccessMsg, setMahfilSuccessMsg] = React.useState('');

  // Sync Mahfil details when prop updates
  React.useEffect(() => {
    setMahfilDate(mahfilDetails.date);
    setMahfilTime(mahfilDetails.time);
    setMahfilLocation(mahfilDetails.location);
    setMahfilTargetDate(mahfilDetails.targetDate);
  }, [mahfilDetails]);

  // Scholar form state
  const [sName, setSName] = React.useState('');
  const [sTitle, setSTitle] = React.useState('');
  const [sTopic, setSTopic] = React.useState('');
  const [sSerialNo, setSSerialNo] = React.useState('');
  const [sSuccessMsg, setSSuccessMsg] = React.useState('');

  // Scholar inline editing state
  const [editingScholarId, setEditingScholarId] = React.useState<string | null>(null);
  const [editSName, setEditSName] = React.useState('');
  const [editSTitle, setEditSTitle] = React.useState('');
  const [editSTopic, setEditSTopic] = React.useState('');
  const [editSSerialNo, setEditSSerialNo] = React.useState('');

  // Activity form state
  const [actTitle, setActTitle] = React.useState('');
  const [actDesc, setActDesc] = React.useState('');
  const [actSuccessMsg, setActSuccessMsg] = React.useState('');

  // Activity inline editing state
  const [editingActivityId, setEditingActivityId] = React.useState<string | null>(null);
  const [editActTitle, setEditActTitle] = React.useState('');
  const [editActDesc, setEditActDesc] = React.useState('');

  // active sub-tab in Cpanel
  const [cpanelTab, setCpanelTab] = React.useState<'transactions' | 'committee' | 'backups' | 'mahfil' | 'scholars' | 'activities'>('transactions');

  // Translate numbers to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Handle Login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    // Default admin password is "admin123" or "milad2026"
    if (password === 'admin123' || password === 'milad2026' || password === '1234') {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ডটি পুনরায় প্রদান করুন।');
    }
  };

  // Handle transaction submit
  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tAmount || isNaN(parseFloat(tAmount)) || parseFloat(tAmount) <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ প্রদান করুন।');
      return;
    }

    const finalCategory = tCategory === 'অন্যান্য' && tCustomCategory.trim() !== '' 
      ? tCustomCategory.trim() 
      : tCategory;

    onAddTransaction({
      date: tDate,
      type: tType,
      category: finalCategory,
      amount: parseFloat(tAmount),
      donorName: tType === 'income' ? tDonor : undefined,
      description: tType === 'expense' ? tDesc : (tDesc ? tDesc : undefined),
      receiptNo: tReceipt.trim() !== '' ? tReceipt.trim() : undefined,
      recordedBy: tRecordedBy,
      year: tYear
    });

    // Reset fields except date and recordedBy for ease of fast multi-entries
    setTAmount('');
    setTDonor('');
    setTDesc('');
    setTReceipt('');
    setTCustomCategory('');
    setTSuccessMsg('ভাউচার এন্ট্রি সফল হয়েছে!');
    setTimeout(() => setTSuccessMsg(''), 4000);
  };

  // Update default category selection when changing type
  React.useEffect(() => {
    if (tType === 'income') {
      setTCategory(defaultCategories.income[0]);
    } else {
      setTCategory(defaultCategories.expense[0]);
    }
  }, [tType]);

  // Handle Member submit
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim() || !mDesignation.trim()) {
      alert('সদস্যের নাম এবং পদবী উভয়ই আবশ্যক।');
      return;
    }

    // Get highest serial number currently
    const maxSerial = committeeMembers.reduce((max, m) => m.serialNo > max ? m.serialNo : max, 0);

    onAddMember({
      name: mName.trim(),
      designation: mDesignation.trim(),
      type: mType,
      serialNo: maxSerial + 1,
    });

    setMName('');
    setMDesignation('');
    setMSuccessMsg('নতুন সদস্য সফলভাবে কমিটিতে যুক্ত হয়েছেন!');
    setTimeout(() => setMSuccessMsg(''), 4000);
  };

  // Handle Mahfil Details Submit
  const handleMahfilSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mahfilDate.trim() || !mahfilTime.trim() || !mahfilLocation.trim() || !mahfilTargetDate.trim()) {
      alert('সকল তথ্য পূরণ করা আবশ্যক।');
      return;
    }
    onUpdateMahfilDetails({
      date: mahfilDate.trim(),
      time: mahfilTime.trim(),
      location: mahfilLocation.trim(),
      targetDate: mahfilTargetDate.trim()
    });
    setMahfilSuccessMsg('মাহফিল ও জশনে জুলুসের তথ্য সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => setMahfilSuccessMsg(''), 4000);
  };

  // Import Backup from JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.transactions)) {
          // Trigger file confirmation
          if (confirm('আপনি কি ব্যাকআপ ডেটা লোড করতে চান? এটি আপনার বর্তমান ডেটার সাথে যুক্ত হবে।')) {
            parsed.transactions.forEach((t: any) => onAddTransaction(t));
            alert('ব্যাকআপ ডেটা সফলভাবে ইম্পোর্ট করা হয়েছে!');
          }
        } else {
          alert('ত্রুটি: ফাইলের ফরম্যাট সঠিক নয়।');
        }
      } catch (err) {
        alert('ত্রুটি: ফাইলটি পড়া সম্ভব হয়নি।');
      }
    };
    reader.readAsText(file);
  };

  // Export backup JSON
  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ transactions, committeeMembers }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mahfil_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Login Panel if not logged in
  if (!isAdminLoggedIn) {
    return (
      <div id="cpanel-login-section" className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in text-[#3c3c3c]">
        <div className="bg-white border-2 border-[#d4cfc0] hover:border-[#bfa46f] rounded-2xl p-6 sm:p-8 shadow-md space-y-6 relative transition duration-300">
          {/* Decorative Corner Filigree */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#d4cfc0] rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#d4cfc0] rounded-tr-xl"></div>

          <div className="text-center space-y-2">
            <div className="h-12 w-12 bg-[#f5f2eb] border border-[#d4cfc0] rounded-full flex items-center justify-center mx-auto text-[#5d6d3e]">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-[#2d3a1d] tracking-wide">সি-প্যানেল প্রবেশদ্বার (C-Panel)</h3>
            <p className="text-xs text-[#3c3c3c]/80 font-light">
              উদযাপন পরিষদের অর্থ সম্পাদক ও পরিচালকদের জন্য সংরক্ষিত প্রশাসনিক প্যানেল।
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#5d6d3e] uppercase tracking-wider mb-1.5">
                পাসওয়ার্ড প্রদান করুন (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#bfa46f]">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-white border border-[#d4cfc0] rounded-xl text-sm text-[#3c3c3c] placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] focus:ring-1 focus:ring-[#bfa46f] transition"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-3 px-4 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md cursor-pointer"
            >
              লগইন করুন
            </button>
          </form>

          {/* Secure Tip */}
          <div className="bg-[#f5f2eb] border border-[#d4cfc0] p-3 rounded-lg space-y-1">
            <h4 className="text-[10px] font-bold text-[#5d6d3e] flex items-center space-x-1 uppercase">
              <Info className="h-3 w-3 text-[#bfa46f]" />
              <span>পরীক্ষামূলক তথ্য (Testing Tip)</span>
            </h4>
            <p className="text-[10px] text-[#3c3c3c]/80 font-light leading-normal">
              সি-প্যানেল ডেমো এবং কোড পর্যালোচনার জন্য পাসওয়ার্ডটি হলো: <code className="text-[#2d3a1d] font-bold bg-white px-1 py-0.5 rounded border border-[#d4cfc0]">admin123</code> অথবা <code className="text-[#2d3a1d] font-bold bg-white px-1 py-0.5 rounded border border-[#d4cfc0]">1234</code>
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render Logged-In Administrative Controls
  return (
    <div id="cpanel-admin-section" className="space-y-8 pb-16 animate-fade-in text-[#3c3c3c]">
      {/* Top Welcome Title */}
      <div className="bg-white border border-[#d4cfc0] rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-center space-y-4 sm:space-y-0 shadow-sm">
        <div className="flex items-center space-x-3 text-center sm:text-left">
          <div className="h-10 w-10 bg-[#f5f2eb] border border-[#d4cfc0] rounded-full flex items-center justify-center text-[#5d6d3e]">
            <Unlock className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h3 className="text-base font-bold text-[#2d3a1d] tracking-wide">সি-প্যানেল ড্যাশবোর্ড (Administrator)</h3>
            <p className="text-[11px] text-[#5d6d3e]">সম্মানিত পরিচালক, আপনার সফল লগইন সম্পন্ন হয়েছে।</p>
          </div>
        </div>

        {/* Sub-tabs within Cpanel */}
        <div className="flex flex-wrap gap-1 bg-[#f5f2eb] p-1 rounded-xl border border-[#d4cfc0] justify-center sm:justify-start">
          <button
            id="subtab-transactions"
            onClick={() => setCpanelTab('transactions')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              cpanelTab === 'transactions' ? 'bg-[#5d6d3e] text-white font-bold' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            আয়-ব্যয় পোস্টিং
          </button>
          <button
            id="subtab-committee"
            onClick={() => setCpanelTab('committee')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              cpanelTab === 'committee' ? 'bg-[#5d6d3e] text-white font-bold' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            কমিটি এডিট ও সংযোজন
          </button>
          <button
            id="subtab-mahfil"
            onClick={() => setCpanelTab('mahfil')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              cpanelTab === 'mahfil' ? 'bg-[#5d6d3e] text-white font-bold' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            মাহফিল বিবরণী এডিট
          </button>
          <button
            id="subtab-scholars"
            onClick={() => setCpanelTab('scholars')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              cpanelTab === 'scholars' ? 'bg-[#5d6d3e] text-white font-bold' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            হুজুরদের তালিকা এডিট
          </button>
          <button
            id="subtab-activities"
            onClick={() => setCpanelTab('activities')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              cpanelTab === 'activities' ? 'bg-[#5d6d3e] text-white font-bold' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            কার্যক্রম ও সেবাসমূহ
          </button>
          <button
            id="subtab-backups"
            onClick={() => setCpanelTab('backups')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              cpanelTab === 'backups' ? 'bg-[#5d6d3e] text-white font-bold' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            রিসেট ও ব্যাকআপ
          </button>
        </div>
      </div>

      {/* Sub-Tab Content 1: Transaction Voucher Entry Form & Delete Ledger */}
      {cpanelTab === 'transactions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Transaction Form Panel */}
          <div className="lg:col-span-5 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm relative">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center space-x-2 border-b border-[#ece8de] pb-3">
              <Plus className="h-5 w-5 text-[#5d6d3e]" />
              <span>নতুন ভাউচার পোস্টিং (Voucher Entry)</span>
            </h4>

            <form onSubmit={handleTransactionSubmit} className="space-y-4 text-xs sm:text-sm">
              {/* Type Switcher */}
              <div>
                <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase tracking-wider mb-1.5">লেনদেনের ধরন (Transaction Type)</label>
                <div className="grid grid-cols-2 gap-2 bg-[#f5f2eb] p-1 rounded-xl border border-[#d4cfc0]">
                  <button
                    id="type-select-income"
                    type="button"
                    onClick={() => setTType('income')}
                    className={`py-2 rounded-lg font-bold text-center transition cursor-pointer ${
                      tType === 'income' ? 'bg-[#5d6d3e] text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
                    }`}
                  >
                    আয় (Income)
                  </button>
                  <button
                    id="type-select-expense"
                    type="button"
                    onClick={() => setTType('expense')}
                    className={`py-2 rounded-lg font-bold text-center transition cursor-pointer ${
                      tType === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
                    }`}
                  >
                    ব্যয় (Expense)
                  </button>
                </div>
              </div>

              {/* Amount, Date & Year Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">টাকার পরিমাণ (টাকা) *</label>
                  <input
                    id="amount-input"
                    type="number"
                    required
                    placeholder="উদা: ৫০০০"
                    value={tAmount}
                    onChange={(e) => setTAmount(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                  />
                </div>
                <div>
                  <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">ভাউচার তারিখ (Date)</label>
                  <input
                    id="date-input"
                    type="date"
                    required
                    value={tDate}
                    onChange={(e) => setTDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">হিসাবের বছর (Financial Year)</label>
                  <select
                    id="year-input"
                    value={tYear}
                    onChange={(e) => setTYear(parseInt(e.target.value, 10))}
                    className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition cursor-pointer"
                  >
                    <option value={2024}>২০২৪ খ্রি.</option>
                    <option value={2025}>২০২৫ খ্রি.</option>
                    <option value={2026}>২০২৬ খ্রি.</option>
                  </select>
                </div>
              </div>

              {/* Receipt No */}
              <div>
                <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">রশিদ নম্বর / ভাউচার রেফারেন্স (Receipt No)</label>
                <input
                  id="receipt-input"
                  type="text"
                  placeholder="উদা: ০১০৫ বা ই-০৫৫"
                  value={tReceipt}
                  onChange={(e) => setTReceipt(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              {/* Category dropdown */}
              <div>
                <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">খাত নির্বাচন (Category)</label>
                <select
                  id="category-select"
                  value={tCategory}
                  onChange={(e) => setTCategory(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition cursor-pointer"
                >
                  {(tType === 'income' ? defaultCategories.income : defaultCategories.expense).map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                  <option value="অন্যান্য">অন্যান্য (নতুন খাত)</option>
                </select>
              </div>

              {/* Custom Category Input if selected other */}
              {tCategory === 'অন্যান্য' && (
                <div className="animate-scale-in">
                  <label className="block text-[#bfa46f] text-[10px] font-bold uppercase mb-1">নতুন খাতের নাম লিখুন</label>
                  <input
                    id="custom-category-input"
                    type="text"
                    required
                    placeholder="উদা: আলোকসজ্জা অনুদান"
                    value={tCustomCategory}
                    onChange={(e) => setTCustomCategory(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                  />
                </div>
              )}

              {/* Contributor Name (For Income) */}
              {tType === 'income' ? (
                <div>
                  <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">দাতার নাম / উৎস (Contributor/Source) *</label>
                  <input
                    id="donor-input"
                    type="text"
                    required
                    placeholder="উদা: মো: আলমগীর (সিনিয়র সদস্য)"
                    value={tDonor}
                    onChange={(e) => setTDonor(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                  />
                </div>
              ) : (
                /* Expense Details */
                <div>
                  <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">ব্যয়ের বিস্তারিত বিবরণ (Expense Details) *</label>
                  <textarea
                    id="desc-input"
                    required
                    rows={2}
                    placeholder="উদা: সাউন্ড সার্ভিসকে ডেকোরেশন পেমেন্ট দেওয়া হলো..."
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                  />
                </div>
              )}

              {/* Description/Notes for Income (Optional) */}
              {tType === 'income' && (
                <div>
                  <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">বিবরণ / মন্তব্য (ঐচ্ছিক)</label>
                  <textarea
                    id="income-desc-input"
                    rows={1}
                    placeholder="অতিরিক্ত কোনো মন্তব্য..."
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                  />
                </div>
              )}

              {/* Entry Person Name */}
              <div>
                <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">এন্ট্রি কারী কর্মকর্তা (Recorded By)</label>
                <input
                  id="recorder-input"
                  type="text"
                  required
                  placeholder="উদা: মো: তারেক জামাল"
                  value={tRecordedBy}
                  onChange={(e) => setTRecordedBy(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              {/* Success Notification Alert */}
              {tSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#5d6d3e] bg-[#5d6d3e]/10 p-2.5 rounded-lg border border-[#5d6d3e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{tSuccessMsg}</span>
                </div>
              )}

              <button
                id="transaction-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                ভাউচার এন্ট্রি সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List/Delete Transaction Panel */}
          <div className="lg:col-span-7 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center justify-between border-b border-[#ece8de] pb-3">
              <span>লেনদেন সংশোধন ও অপসারণ তালিকা</span>
              <span className="text-[10px] font-semibold text-[#5d6d3e]">মোট লেনদেন: {toBanglaNum(transactions.length)} টি</span>
            </h4>

            <div className="overflow-y-auto max-h-[500px] divide-y divide-[#ece8de]">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <div
                    id={`admin-transaction-item-${t.id}`}
                    key={t.id}
                    className="py-3 flex justify-between items-center space-x-4 hover:bg-[#f5f2eb]/40 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2">
                        <span className={`h-2 w-2 rounded-full ${t.type === 'income' ? 'bg-[#5d6d3e]' : 'bg-red-600'}`}></span>
                        <span className="text-xs font-bold text-[#2d3a1d]">{t.category}</span>
                        {t.receiptNo && (
                          <span className="text-[10px] font-mono bg-[#f5f2eb] border border-[#d4cfc0] text-[#5d6d3e] px-1.5 py-0.5 rounded">
                            রশিদ: {toBanglaNum(t.receiptNo)}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#3c3c3c] mt-1 truncate font-light">
                        {t.type === 'income' ? t.donorName : t.description}
                      </p>
                      <span className="text-[10px] text-[#5d6d3e] block mt-0.5">{toBanglaNum(t.date)} | এন্ট্রি: {t.recordedBy}</span>
                    </div>

                    <div className="flex items-center space-x-3">
                      <span className={`text-xs font-bold font-mono ${t.type === 'income' ? 'text-[#5d6d3e]' : 'text-red-700'}`}>
                        ৳{toBanglaNum(t.amount)}
                      </span>
                      <button
                        id={`delete-trans-btn-${t.id}`}
                        onClick={() => {
                          if (confirm(`আপনি কি এই ${t.type === 'income' ? 'আয়' : 'ব্যয়'} হিসাবটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
                            onDeleteTransaction(t.id);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-600 text-red-700 hover:text-white rounded border border-red-500/20 hover:border-red-600 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[#8a817c] text-xs">কোনো ভাউচার হিসাব পাওয়া যায়নি।</div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Content 2: Add / Manage Committee Members */}
      {cpanelTab === 'committee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Member Insertion Form */}
          <div className="lg:col-span-5 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center space-x-2 border-b border-[#ece8de] pb-3">
              <Plus className="h-5 w-5 text-[#5d6d3e]" />
              <span>নতুন সদস্য যুক্তকরণ ফর্ম</span>
            </h4>

            <form onSubmit={handleMemberSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">সদস্যের পুরো নাম *</label>
                <input
                  id="member-name-input"
                  type="text"
                  required
                  placeholder="উদা: আলহাজ্ব মো: তারেক রহমান"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              <div>
                <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">পদবী (Designation) *</label>
                <input
                  id="member-designation-input"
                  type="text"
                  required
                  placeholder="উদা: সহ-সাংগঠনিক সম্পাদক"
                  value={mDesignation}
                  onChange={(e) => setMDesignation(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              <div>
                <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1.5">সদস্যের বিভাগ (Category Group)</label>
                <select
                  id="member-type-select"
                  value={mType}
                  onChange={(e) => setMType(e.target.value as any)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition cursor-pointer"
                >
                  <option value="leader">পরিষদ নির্বাহী কর্মকর্তা (Leader)</option>
                  <option value="member">সিনিয়র সদস্য (Senior Member)</option>
                  <option value="advisor">সম্মানিত উপদেষ্টা (Advisor)</option>
                </select>
              </div>

              {mSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#5d6d3e] bg-[#5d6d3e]/10 p-2.5 rounded-lg border border-[#5d6d3e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{mSuccessMsg}</span>
                </div>
              )}

              <button
                id="member-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                কমিটিতে যুক্ত করুন
              </button>
            </form>
          </div>

          {/* Committee list with immediate delete trigger */}
          <div className="lg:col-span-7 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center justify-between border-b border-[#ece8de] pb-3">
              <span>বর্তমান কমিটি সদস্য অপসারণ প্যানেল</span>
              <span className="text-[10px] text-[#5d6d3e]">মোট সদস্য: {toBanglaNum(committeeMembers.length)} জন</span>
            </h4>

            <div className="overflow-y-auto max-h-[500px] divide-y divide-[#ece8de] space-y-2">
              {committeeMembers.map((member) => (
                <div
                  id={`admin-member-item-${member.id}`}
                  key={member.id}
                  className="py-3 px-2 rounded-lg transition"
                >
                  {editingMemberId === member.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        onUpdateMember({
                          id: member.id,
                          name: editName,
                          designation: editDesignation,
                          type: editType,
                          serialNo: parseInt(editSerialNo, 10) || member.serialNo,
                        });
                        setEditingMemberId(null);
                      }}
                      className="space-y-3 bg-[#f5f2eb] p-3 rounded-xl border border-[#bfa46f]/30"
                    >
                      <h5 className="text-xs font-bold text-[#2d3a1d]">সদস্যের তথ্য সংশোধন</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[#5d6d3e] text-[9px] font-bold mb-1">নাম</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="block w-full px-2.5 py-1.5 bg-white border border-[#d4cfc0] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#5d6d3e] text-[9px] font-bold mb-1">পদবী</label>
                          <input
                            type="text"
                            required
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="block w-full px-2.5 py-1.5 bg-white border border-[#d4cfc0] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#5d6d3e] text-[9px] font-bold mb-1">বিভাগ</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as any)}
                            className="block w-full px-2 py-1.5 bg-white border border-[#d4cfc0] rounded"
                          >
                            <option value="leader">পরিষদ নির্বাহী কর্মকর্তা (Leader)</option>
                            <option value="member">সদস্য (Member)</option>
                            <option value="advisor">উপদেষ্টা (Advisor)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#5d6d3e] text-[9px] font-bold mb-1">ক্রমিক নম্বর (Serial No.)</label>
                          <input
                            type="number"
                            required
                            value={editSerialNo}
                            onChange={(e) => setEditSerialNo(e.target.value)}
                            className="block w-full px-2.5 py-1.5 bg-white border border-[#d4cfc0] rounded"
                          />
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(null)}
                          className="px-3 py-1.5 bg-white border border-[#d4cfc0] text-[#3c3c3c] rounded hover:bg-gray-100 transition"
                        >
                          বাতিল
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#5d6d3e] text-white rounded font-bold hover:bg-[#43522f] transition"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center space-x-4">
                      <div>
                        <h5 className="text-xs font-bold text-[#2d3a1d]">{member.name}</h5>
                        <p className="text-[10px] text-[#bfa46f] font-bold mt-0.5">{member.designation}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[9px] text-[#5d6d3e] bg-[#5d6d3e]/10 border border-[#d4cfc0]/40 px-1.5 py-0.5 rounded inline-block">
                            {member.type === 'leader' ? 'নেতৃবৃন্দ' : (member.type === 'advisor' ? 'উপদেষ্টা' : 'সিনিয়র সদস্য')}
                          </span>
                          <span className="text-[9px] text-[#3c3c3c]/60 bg-[#f5f2eb] px-1.5 py-0.5 rounded inline-block">
                            ক্রমিক: {toBanglaNum(member.serialNo)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          id={`edit-member-btn-${member.id}`}
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setEditName(member.name);
                            setEditDesignation(member.designation);
                            setEditType(member.type);
                            setEditSerialNo(member.serialNo.toString());
                          }}
                          className="p-1.5 bg-[#5d6d3e]/10 hover:bg-[#5d6d3e] text-[#5d6d3e] hover:text-white rounded border border-[#5d6d3e]/20 transition cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-member-btn-${member.id}`}
                          onClick={() => {
                            if (confirm(`আপনি কি "${member.name}" কে কমিটি থেকে স্থায়ীভাবে অপসারণ করতে চান?`)) {
                              onDeleteMember(member.id);
                            }
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-600 text-red-700 hover:text-white rounded border border-red-500/20 hover:border-red-600 transition cursor-pointer"
                          title="অপসারণ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Content: Edit Mahfil Details */}
      {cpanelTab === 'mahfil' && (
        <div className="max-w-2xl mx-auto bg-white border border-[#d4cfc0] rounded-2xl p-6 sm:p-8 shadow-sm">
          <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center space-x-2 border-b border-[#ece8de] pb-3">
            <Calendar className="h-5 w-5 text-[#5d6d3e]" />
            <span>আসন্ন পবিত্র মাহফিল ও জুলুস বিবরণী সংশোধন</span>
          </h4>

          <form onSubmit={handleMahfilSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">নির্ধারিত তারিখ *</label>
              <input
                type="text"
                required
                placeholder="উদা: ১২ই রবিউল আউয়াল ১৪৪৮ হিজরী (সম্ভাব্য ২০২৬ খ্রি.)"
                value={mahfilDate}
                onChange={(e) => setMahfilDate(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition"
              />
            </div>

            <div>
              <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">সময়সূচী *</label>
              <textarea
                required
                rows={2}
                placeholder="উদা: সকাল ৮:০০ ঘটিকা হতে বর্ণাঢ্য জশনে জুলুস এবং যোহরের নামাজের পর হতে মূল আজিমুশশান মাহফিল।"
                value={mahfilTime}
                onChange={(e) => setMahfilTime(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition"
              />
            </div>

            <div>
              <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">মাহফিল ময়দান *</label>
              <input
                type="text"
                required
                placeholder="উদা: সোনারগাঁও সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন বিশাল ময়দান, রাঙ্গুনিয়া, চট্টগ্রাম।"
                value={mahfilLocation}
                onChange={(e) => setMahfilLocation(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition"
              />
            </div>

            <div>
              <label className="block text-[#5d6d3e] text-[10px] font-bold uppercase mb-1">কাউন্টডাউন শেষ সময় (Target Date for Countdown) *</label>
              <input
                type="date"
                required
                value={mahfilTargetDate}
                onChange={(e) => setMahfilTargetDate(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#d4cfc0] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#bfa46f] transition cursor-pointer"
              />
              <span className="text-[10px] text-[#8a817c] mt-1 block font-light">এই তারিখটি দিয়ে প্রথম পাতার কাউন্টডাউন টাইমারটি স্বয়ংক্রিয়ভাবে হিসাব করা হবে।</span>
            </div>

            {mahfilSuccessMsg && (
              <div className="flex items-center space-x-2 text-xs text-[#5d6d3e] bg-[#5d6d3e]/10 p-2.5 rounded-lg border border-[#5d6d3e]/20">
                <CheckCircle className="h-4 w-4 text-[#5d6d3e]" />
                <span>{mahfilSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              মাহফিল তথ্য ও তারিখ সংরক্ষণ করুন
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab Content 4: Manage Invited Scholars for 2026 */}
      {cpanelTab === 'scholars' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Scholar Form Panel */}
          <div className="lg:col-span-4 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center space-x-2 border-b border-[#ece8de] pb-3">
              <Plus className="h-5 w-5 text-[#5d6d3e]" />
              <span>নতুন বক্তা ও মেহমান যুক্ত করুন</span>
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!sName.trim() || !sTitle.trim()) {
                  alert('নাম এবং পরিচয় আবশ্যক!');
                  return;
                }
                onAddScholar({
                  name: sName.trim(),
                  title: sTitle.trim(),
                  topic: sTopic.trim() || undefined,
                  serialNo: Number(sSerialNo) || (scholars.length + 1),
                });
                setSName('');
                setSTitle('');
                setSTopic('');
                setSSerialNo('');
                setSSuccessMsg('বক্তা সফলভাবে তালিকায় যুক্ত হয়েছেন!');
                setTimeout(() => setSSuccessMsg(''), 3000);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#5d6d3e] uppercase mb-1.5">হুজুরের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আল্লামা মুফতি ওবাইদুল্লাহ আশরাফী"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5d6d3e] uppercase mb-1.5">উপাধি / পদবি / ঠিকানা *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: প্রধান বক্তা, বিশিষ্ট ইসলামী চিন্তাবিদ ও খতিব..."
                  value={sTitle}
                  onChange={(e) => setSTitle(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5d6d3e] uppercase mb-1.5">আলোচনার বিষয় (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: তাজিম এ মোস্তফা ও জশনে জুলুস উদযাপন"
                  value={sTopic}
                  onChange={(e) => setSTopic(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5d6d3e] uppercase mb-1.5">সিরিয়াল নম্বর (প্রদর্শন ক্রম)</label>
                <input
                  type="number"
                  placeholder={`যেমন: ${toBanglaNum(scholars.length + 1)}`}
                  value={sSerialNo}
                  onChange={(e) => setSSerialNo(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              {sSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#5d6d3e] bg-[#5d6d3e]/10 p-2.5 rounded-lg border border-[#5d6d3e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{sSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                বক্তা তালিকায় যুক্ত করুন
              </button>
            </form>
          </div>

          {/* Scholars List Panel */}
          <div className="lg:col-span-8 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm overflow-hidden">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center justify-between border-b border-[#ece8de] pb-3">
              <span className="flex items-center space-x-2">
                <Mic className="h-5 w-5 text-[#5d6d3e]" />
                <span>২০২৬ সালের দাওয়াতকৃত বক্তাগণের তালিকা</span>
              </span>
              <span className="text-xs bg-[#f5f2eb] border border-[#d4cfc0] px-2.5 py-1 rounded-full text-[#5d6d3e] font-semibold">
                সর্বমোট: {toBanglaNum(scholars.length)} জন
              </span>
            </h4>

            {scholars.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8a817c]">কোনো আমন্ত্রিত হুজুর যুক্ত করা হয়নি।</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#ece8de] text-xs font-bold text-[#5d6d3e] bg-[#fdfcf7]">
                      <th className="py-3 px-2 text-center w-12">ক্রম</th>
                      <th className="py-3 px-3">নাম ও পরিচয়</th>
                      <th className="py-3 px-3">আলোচনার বিষয়</th>
                      <th className="py-3 px-3 text-center w-28">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scholars.map((sch) => {
                      const isEditing = editingScholarId === sch.id;
                      return (
                        <tr key={sch.id} className="border-b border-[#ece8de]/70 text-xs hover:bg-[#fdfcf7]/60 transition">
                          <td className="py-3 px-2 text-center font-mono">
                            {isEditing ? (
                              <input
                                type="number"
                                value={editSSerialNo}
                                onChange={(e) => setEditSSerialNo(e.target.value)}
                                className="w-10 p-1 border border-[#d4cfc0] rounded text-center"
                              />
                            ) : (
                              toBanglaNum(sch.serialNo)
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editSName}
                                  onChange={(e) => setEditSName(e.target.value)}
                                  className="w-full p-1 border border-[#d4cfc0] rounded font-bold text-xs"
                                  placeholder="হুজুরের নাম"
                                />
                                <textarea
                                  value={editSTitle}
                                  onChange={(e) => setEditSTitle(e.target.value)}
                                  className="w-full p-1 border border-[#d4cfc0] rounded text-[11px] resize-none"
                                  rows={2}
                                  placeholder="পরিচিতি"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-[#2d3a1d]">{sch.name}</div>
                                <div className="text-[11px] text-[#5d6d3e] mt-0.5">{sch.title}</div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSTopic}
                                onChange={(e) => setEditSTopic(e.target.value)}
                                className="w-full p-1 border border-[#d4cfc0] rounded text-xs"
                                placeholder="আলোচনার বিষয়"
                              />
                            ) : (
                              <span className="italic text-[#3c3c3c]">{sch.topic || 'নির্ধারিত হয়নি'}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    if (!editSName.trim() || !editSTitle.trim()) {
                                      alert('নাম এবং পরিচয় আবশ্যক!');
                                      return;
                                    }
                                    onUpdateScholar({
                                      id: sch.id,
                                      name: editSName.trim(),
                                      title: editSTitle.trim(),
                                      topic: editSTopic.trim() || undefined,
                                      serialNo: Number(editSSerialNo) || sch.serialNo,
                                    });
                                    setEditingScholarId(null);
                                  }}
                                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition cursor-pointer"
                                  title="সংরক্ষণ"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingScholarId(null)}
                                  className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded transition cursor-pointer"
                                  title="বাতিল"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingScholarId(sch.id);
                                    setEditSName(sch.name);
                                    setEditSTitle(sch.title);
                                    setEditSTopic(sch.topic || '');
                                    setEditSSerialNo(String(sch.serialNo));
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded transition cursor-pointer"
                                  title="সম্পাদনা করুন"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`আপনি কি নিশ্চিতভাবে "${sch.name}"-কে তালিকা থেকে বাদ দিতে চান?`)) {
                                      onDeleteScholar(sch.id);
                                    }
                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded transition cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab Content 5: Manage Activities & Services */}
      {cpanelTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Activity Form Panel */}
          <div className="lg:col-span-4 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center space-x-2 border-b border-[#ece8de] pb-3">
              <Plus className="h-5 w-5 text-[#5d6d3e]" />
              <span>নতুন কার্যক্রম বা সেবা যোগ করুন</span>
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!actTitle.trim() || !actDesc.trim()) {
                  alert('শিরোনাম ও বিবরণ আবশ্যক!');
                  return;
                }
                onAddActivity({
                  title: actTitle.trim(),
                  description: actDesc.trim(),
                });
                setActTitle('');
                setActDesc('');
                setActSuccessMsg('নতুন কার্যক্রম সফলভাবে যুক্ত হয়েছে!');
                setTimeout(() => setActSuccessMsg(''), 3000);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#5d6d3e] uppercase mb-1.5">কার্যক্রম/সেবার শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: তাবাররুক বিতরণ"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#5d6d3e] uppercase mb-1.5">বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="যেমন: তাবাররুক বিতরণের সুশৃঙ্খল পরিকল্পনা..."
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] transition resize-none"
                />
              </div>

              {actSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#5d6d3e] bg-[#5d6d3e]/10 p-2.5 rounded-lg border border-[#5d6d3e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{actSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                কার্যক্রম তালিকায় যুক্ত করুন
              </button>
            </form>
          </div>

          {/* Activities List Panel */}
          <div className="lg:col-span-8 bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#2d3a1d] mb-5 flex items-center space-x-2 border-b border-[#ece8de] pb-3">
              <Users className="h-5 w-5 text-[#5d6d3e]" />
              <span>আমাদের বর্তমান কার্যক্রম ও সেবাসমূহ</span>
            </h4>

            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8a817c]">কোনো কার্যক্রম বা সেবা পাওয়া যায়নি।</div>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => {
                  const isEditing = editingActivityId === act.id;
                  return (
                    <div key={act.id} className="border border-[#ece8de] rounded-xl p-4 hover:border-[#bfa46f] hover:bg-[#fdfcf7]/30 transition relative group">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#5d6d3e] uppercase mb-1">কার্যক্রমের শিরোনাম</label>
                            <input
                              type="text"
                              value={editActTitle}
                              onChange={(e) => setEditActTitle(e.target.value)}
                              className="w-full p-2 border border-[#d4cfc0] rounded-lg text-xs font-bold text-[#2d3a1d]"
                              placeholder="শিরোনাম"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#5d6d3e] uppercase mb-1">বিস্তারিত বিবরণ</label>
                            <textarea
                              value={editActDesc}
                              onChange={(e) => setEditActDesc(e.target.value)}
                              className="w-full p-2 border border-[#d4cfc0] rounded-lg text-xs resize-none"
                              rows={3}
                              placeholder="বিবরণ"
                            />
                          </div>
                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              onClick={() => {
                                if (!editActTitle.trim() || !editActDesc.trim()) {
                                  alert('শিরোনাম ও বিবরণ আবশ্যক!');
                                  return;
                                }
                                onUpdateActivity({
                                  id: act.id,
                                  title: editActTitle.trim(),
                                  description: editActDesc.trim(),
                                });
                                setEditingActivityId(null);
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition cursor-pointer"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>সংরক্ষণ করুন</span>
                            </button>
                            <button
                              onClick={() => setEditingActivityId(null)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-xs transition cursor-pointer"
                            >
                              <span>বাতিল</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start space-x-4">
                          <div className="space-y-1">
                            <h5 className="font-bold text-[#2d3a1d] text-sm">{act.title}</h5>
                            <p className="text-xs text-[#3c3c3c]/90 leading-relaxed font-light">{act.description}</p>
                          </div>
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingActivityId(act.id);
                                setEditActTitle(act.title);
                                setEditActDesc(act.description);
                              }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`আপনি কি নিশ্চিতভাবে "${act.title}" কার্যক্রমটি মুছে ফেলতে চান?`)) {
                                  onDeleteActivity(act.id);
                                }
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab Content 3: Reset Data & Backups (JSON format) */}
      {cpanelTab === 'backups' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Backups Panel */}
          <div className="bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-[#2d3a1d] flex items-center space-x-2 border-b border-[#ece8de] pb-3">
              <Download className="h-5 w-5 text-[#5d6d3e]" />
              <span>ডেটা ব্যাকআপ ও ইম্পোর্ট</span>
            </h4>
            <p className="text-xs text-[#3c3c3c]/80 leading-relaxed font-light">
              আপনার সমস্ত লেনদেনের হিসেব ও কমিটির তালিকা একটি সুরক্ষিত জেসন (JSON) ফাইলে ব্যাকআপ করে রাখতে পারেন। যেকোনো সময় এই ব্যাকআপ ফাইলটি পুনরায় আপলোড করে ডেটা পুনরুদ্ধার করা সম্ভব।
            </p>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              {/* Export Backup Button */}
              <button
                id="export-backup-btn"
                onClick={handleExportBackup}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-white hover:bg-[#f5f2eb] text-[#5d6d3e] rounded-xl text-xs font-bold border border-[#d4cfc0] transition cursor-pointer shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>জেসন ব্যাকআপ এক্সপোর্ট</span>
              </button>

              {/* Import Backup Button Wrapper */}
              <label className="flex-1 flex items-center justify-center space-x-2 py-3 bg-[#f5f2eb] hover:bg-[#ece8de] text-[#2d3a1d] rounded-xl text-xs font-bold border border-[#d4cfc0] cursor-pointer transition text-center shadow-sm">
                <Upload className="h-4 w-4 text-[#5d6d3e]" />
                <span>জেসন ফাইল ইম্পোর্ট</span>
                <input
                  id="import-backup-file"
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={handleImportBackup}
                />
              </label>
            </div>
          </div>

          {/* Reset/Factory Database Panel */}
          <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
            <h4 className="text-base font-bold text-red-700 flex items-center space-x-2 border-b border-red-100 pb-3">
              <RefreshCw className="h-5 w-5 text-red-600" />
              <span>ডেটা রিসেট ও ফ্যাক্টরি রিস্টোর</span>
            </h4>
            <p className="text-xs text-[#3c3c3c]/80 leading-relaxed font-light">
              আপনি কি সমস্ত লেনদেনের রেকর্ড এবং কাস্টম কমিটি সরিয়ে প্রথম অবস্থায় ফিরে যেতে চান? ডেটা রিসেট করলে আপনার নিজের হাতে যোগ করা যাবতীয় হিসাব মুছে যাবে এবং প্রারম্ভিক নমুনা তথ্যসমূহ পুনর্বহাল হবে।
            </p>

            <button
              id="reset-db-btn"
              onClick={() => {
                if (confirm('সতর্কতা: আপনি কি সত্যিই সমস্ত আর্থিক ডেটা রিসেট করতে চান? এই প্রক্রিয়াটি আর ফেরত আনা যাবে না।')) {
                  onResetData();
                  alert('সমস্ত ডাটা সফলভাবে প্রথম অবস্থায় রিসেট করা হয়েছে!');
                }
              }}
              className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              ফ্যাক্টরি ডেটা রিসেট করুন
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
