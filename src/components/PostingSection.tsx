import React from 'react';
import { Transaction } from '../types';
import {
  Calendar,
  Send,
  Check,
  ChevronDown,
  Building2,
  Receipt,
  Trash2,
  TrendingUp,
  TrendingDown,
  Lock,
  KeyRound,
  ShieldCheck,
  RefreshCw,
  Search,
  ArrowRight,
  Filter,
  CheckCircle2,
  Sparkles,
  DollarSign,
  X,
  Plus
} from 'lucide-react';
import { cleanNumericInput, toEnglishDigits } from '../lib/numberUtils';
import {
  getTransactionYear,
  sortTransactionsFIFO,
  GENERAL_INCOME_CATEGORIES,
  GENERAL_EXPENSE_CATEGORIES,
  isHouseCollection
} from '../lib/transactionUtils';

// Helper for Bangla digits
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
};

// Helper for displaying date in DD/MM/YYYY format
const formatDisplayDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const [y, m, d] = parts;
    return `${d}/${m}/${y}`;
  }
  return dateStr;
};

export interface PostingSectionProps {
  transactions: Transaction[];
  onAddTransaction: (newT: Omit<Transaction, 'id'>) => Promise<void> | void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  onUpdateTransaction?: (updatedT: Transaction) => Promise<void> | void;
  isAdminLoggedIn?: boolean;
  setIsAdminLoggedIn?: (val: boolean) => void;
  activeHouses?: string[];
  onAddHouse?: (houseName: string) => Promise<void> | void;
  onNavigate?: (tab: string) => void;
  initialYear?: string;
}

export default function PostingSection({
  transactions = [],
  onAddTransaction,
  onDeleteTransaction,
  isAdminLoggedIn = false,
  setIsAdminLoggedIn,
  activeHouses = [
    'বৈদ্য বাড়ী',
    'সওদাগর বাড়ী',
    'চৌধুরী বাড়ী',
    'মিয়াজী বাড়ী',
    'শিকদার বাড়ী',
    'তালুকদার বাড়ী',
    'হাজী বাড়ী',
    'মুন্সী বাড়ী',
    'মাওলানা বাড়ী',
    'ডাক্তার বাড়ী',
    'খান বাড়ী',
    'মোল্লা বাড়ী',
    'মাস্টার বাড়ী',
    'দরবেশ বাড়ী'
  ],
  onAddHouse,
  onNavigate,
  initialYear = '2026'
}: PostingSectionProps) {
  // Form state
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().split('T')[0]);
  const [type, setType] = React.useState<'income' | 'expense'>('income');
  const [amount, setAmount] = React.useState<string>('');
  const [donorName, setDonorName] = React.useState<string>(''); // চাঁদা দাতার নাম / প্রাপক
  const [selectedHouse, setSelectedHouse] = React.useState<string>(''); // আয়ের ক্ষেত্রে বিবরণে বাড়ির নাম
  const [description, setDescription] = React.useState<string>(''); // অতিরিক্ত বিবরণ বা খাত
  const [expenseCategory, setExpenseCategory] = React.useState<string>(''); // ব্যয়ের খাত (auto নয়, ব্যবহারকারী সিলেক্ট করলে তবেই হবে)
  
  // House Search & Selection State
  const [houseSearchQuery, setHouseSearchQuery] = React.useState<string>('');

  // New House Creation State
  const [showNewHouseForm, setShowNewHouseForm] = React.useState<boolean>(false);
  const [newHouseInput, setNewHouseInput] = React.useState<string>('');
  const [newHouseError, setNewHouseError] = React.useState<string>('');
  const [isCreatingHouse, setIsCreatingHouse] = React.useState<boolean>(false);
  const [localAddedHouses, setLocalAddedHouses] = React.useState<string[]>([]);

  // Robust list of houses with guaranteed default fallback and local additions
  const allHouses = React.useMemo(() => {
    const base = (activeHouses && activeHouses.length > 0) ? activeHouses : [
      'বৈদ্য বাড়ী',
      'সওদাগর বাড়ী',
      'চৌধুরী বাড়ী',
      'মিয়াজী বাড়ী',
      'শিকদার বাড়ী',
      'তালুকদার বাড়ী',
      'হাজী বাড়ী',
      'মুন্সী বাড়ী',
      'মাওলানা বাড়ী',
      'ডাক্তার বাড়ী',
      'খান বাড়ী',
      'মোল্লা বাড়ী',
      'মাস্টার বাড়ী',
      'দরবেশ বাড়ী'
    ];
    const combined = [...base];
    localAddedHouses.forEach((h) => {
      if (!combined.includes(h)) combined.push(h);
    });
    return combined;
  }, [activeHouses, localAddedHouses]);

  // Filter houses based on search input (case insensitive & handles Bangla properly)
  const filteredHouses = React.useMemo(() => {
    if (!houseSearchQuery.trim()) return allHouses;
    const q = houseSearchQuery.toLowerCase().trim();
    return allHouses.filter((h) => h.toLowerCase().includes(q));
  }, [allHouses, houseSearchQuery]);

  // Year selector
  const [selectedYear, setSelectedYear] = React.useState<string>(initialYear || '2026');
  
  // Status and UI state
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string>('');
  const [showPasswordModal, setShowPasswordModal] = React.useState<boolean>(false);
  const [passwordInput, setPasswordInput] = React.useState<string>('');
  const [passwordError, setPasswordError] = React.useState<string>('');
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);

  // Search and filter for recent postings list
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [postingFilter, setPostingFilter] = React.useState<'all' | 'income' | 'expense'>('all');

  // Sync date year with selectedYear if user changes year
  const currentYearNum = parseInt(selectedYear, 10);

  // Filter transactions for this year
  const yearTransactions = React.useMemo(() => {
    const list = transactions.filter((t) => getTransactionYear(t) === currentYearNum);
    // Show newest first for recent postings list
    return [...list].sort((a, b) => {
      const timeA = typeof a.createdAt === 'number' ? a.createdAt : 0;
      const timeB = typeof b.createdAt === 'number' ? b.createdAt : 0;
      if (timeA !== timeB) return timeB - timeA;
      return (b.date || '').localeCompare(a.date || '');
    });
  }, [transactions, currentYearNum]);

  // Financial summary for this year
  const totalIncome = React.useMemo(() => {
    return yearTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [yearTransactions]);

  const totalExpense = React.useMemo(() => {
    return yearTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [yearTransactions]);

  const balance = totalIncome - totalExpense;

  // Filtered recent postings
  const filteredRecentPostings = React.useMemo(() => {
    return yearTransactions.filter((t) => {
      if (postingFilter === 'income' && t.type !== 'income') return false;
      if (postingFilter === 'expense' && t.type !== 'expense') return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const matchDonor = (t.donorName || '').toLowerCase().includes(term);
      const matchDesc = (t.description || '').toLowerCase().includes(term);
      const matchHouse = (t.houseName || '').toLowerCase().includes(term);
      const matchCategory = (t.category || '').toLowerCase().includes(term);
      const matchAmount = t.amount.toString().includes(toEnglishDigits(term));
      return matchDonor || matchDesc || matchHouse || matchCategory || matchAmount;
    });
  }, [yearTransactions, postingFilter, searchTerm]);

  // Handle Admin Authentication
  const handleAdminAuth = (e: React.FormEvent) => {
    e.preventDefault();
    if (passwordInput === 'T@a546195') {
      sessionStorage.setItem('mahfil_admin_logged', 'true');
      if (setIsAdminLoggedIn) {
        setIsAdminLoggedIn(true);
      }
      setShowPasswordModal(false);
      setPasswordInput('');
      setPasswordError('');
    } else {
      setPasswordError('ভুল পাসওয়ার্ড! সঠিক অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
    }
  };

  // Form Submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check admin authorization
    const isAuthorized = isAdminLoggedIn || sessionStorage.getItem('mahfil_admin_logged') === 'true';
    if (!isAuthorized) {
      setShowPasswordModal(true);
      return;
    }

    // Amount validation
    const parsedAmount = parseInt(toEnglishDigits(cleanNumericInput(amount)), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    setIsSubmitting(true);
    try {
      // Determine description and houseName
      let finalDescription = description.trim();
      let finalHouseName: string | undefined = undefined;
      let finalCategory: string;

      if (type === 'income') {
        if (selectedHouse && selectedHouse !== 'অন্যান্য') {
          finalHouseName = selectedHouse;
          finalCategory = 'বাড়ি ভিত্তিক চাঁদা';
        } else {
          finalCategory = 'সাধারণ অনুদান ও কালেকশন';
        }
      } else {
        // Expense: If category selected by user, use it; otherwise fallback to 'সাধারণ ব্যয়'
        finalCategory = expenseCategory.trim() || (finalDescription ? finalDescription : 'সাধারণ ব্যয়');
      }

      const newTransaction: Omit<Transaction, 'id'> = {
        date: date || new Date().toISOString().split('T')[0],
        type,
        category: finalCategory,
        amount: parsedAmount,
        donorName: donorName.trim() || undefined,
        description: finalDescription || undefined, // বিবরণ দেওয়া না থাকলে সম্পূর্ণ ঐচ্ছিক থাকবে
        houseName: finalHouseName,
        recordedBy: 'অ্যাডমিন',
        year: currentYearNum,
        createdAt: Date.now()
      };

      await onAddTransaction(newTransaction);

      // Show success notification
      setSuccessMessage(
        `${type === 'income' ? 'আয়' : 'ব্যয়'} পোস্টিং সফলভাবে সম্পন্ন হয়েছে! পরিমাণ: ৳ ${toBanglaNum(parsedAmount.toLocaleString('bn-BD'))}`
      );
      setTimeout(() => setSuccessMessage(''), 5000);

      // Reset specific fields but keep date for convenience
      setAmount('');
      setDonorName('');
      setSelectedHouse('');
      setDescription('');
      setExpenseCategory('');
    } catch (err) {
      console.error('Posting failed:', err);
      alert('পোস্টিং সংরক্ষণে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete
  const handleDelete = async (id: string) => {
    if (!isAdminLoggedIn && sessionStorage.getItem('mahfil_admin_logged') !== 'true') {
      setShowPasswordModal(true);
      return;
    }
    if (!window.confirm('আপনি কি নিশ্চিতভাবে এই পোস্টিংটি মুছে ফেলতে চান?')) {
      return;
    }
    setIsDeletingId(id);
    try {
      if (onDeleteTransaction) {
        await onDeleteTransaction(id);
      }
    } catch (err) {
      console.error(err);
      alert('মুছে ফেলতে সমস্যা হয়েছে।');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Handle Create New House directly from Posting Page
  const handleCreateHouse = async (customName?: string) => {
    const rawName = (customName || newHouseInput).trim();
    if (!rawName) {
      setNewHouseError('অনুগ্রহ করে বাড়ির নাম লিখুন।');
      return;
    }

    // Check if house already exists
    const existing = allHouses.find((h) => h.trim().toLowerCase() === rawName.toLowerCase());
    if (existing) {
      setSelectedHouse(existing);
      setShowNewHouseForm(false);
      setNewHouseInput('');
      setHouseSearchQuery('');
      setSuccessMessage(`'${existing}' বাড়িটি ইতোমধ্যে তালিকায় রয়েছে এবং নির্বাচন করা হয়েছে।`);
      setTimeout(() => setSuccessMessage(''), 4000);
      return;
    }

    // Verify admin authority if required
    const isAuthorized = isAdminLoggedIn || sessionStorage.getItem('mahfil_admin_logged') === 'true';
    if (!isAuthorized) {
      setShowPasswordModal(true);
      return;
    }

    setIsCreatingHouse(true);
    setNewHouseError('');
    try {
      // Optimistically add to local houses list
      setLocalAddedHouses((prev) => [...prev, rawName]);

      if (onAddHouse) {
        await onAddHouse(rawName);
      }

      // Immediately select the newly created house for posting
      setSelectedHouse(rawName);
      setShowNewHouseForm(false);
      setNewHouseInput('');
      setHouseSearchQuery('');
      setSuccessMessage(`✓ নতুন বাড়ি '${rawName}' সফলভাবে তৈরি ও নির্বাচিত হয়েছে!`);
      setTimeout(() => setSuccessMessage(''), 5000);
    } catch (err) {
      console.error('Failed to create house:', err);
      setNewHouseError('নতুন বাড়ি যুক্ত করতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsCreatingHouse(false);
    }
  };

  return (
    <div id="posting-section" className="max-w-4xl mx-auto space-y-8 animate-fade-in text-[#3c3c3c] pb-12">
      
      {/* Top Header & Year Selection */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-[#064e3b] flex items-center gap-2">
            <Send className="w-6 h-6 text-[#2563eb] -rotate-12" />
            <span>দৈনিক আয়-ব্যয় পোস্টিং</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            সহজেই আয় বা ব্যয়ের তথ্য এন্ট্রি করুন এবং তাত্ক্ষণিক হিসাব হালনাগাদ রাখুন
          </p>
        </div>

        {/* Year Selector & Admin Status Badge */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-slate-200 rounded-xl px-2.5 py-1.5 shadow-xs">
            <span className="text-xs font-bold text-slate-600 mr-2">অর্থবছর:</span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="bg-transparent font-black text-sm text-[#064e3b] outline-none cursor-pointer"
            >
              <option value="2027">২০২৭</option>
              <option value="2026">২০২৬</option>
              <option value="2025">২০২৫</option>
              <option value="2024">২০২৪</option>
              <option value="2023">২০২৩</option>
            </select>
          </div>

          {!isAdminLoggedIn && (
            <button
              onClick={() => setShowPasswordModal(true)}
              className="px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
              title="পোস্টিং করতে অ্যাডমিন হিসেবে আনলক করুন"
            >
              <Lock className="w-3.5 h-3.5 text-amber-700" />
              <span>আনলক করুন</span>
            </button>
          )}

          {isAdminLoggedIn && (
            <div className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 rounded-xl text-xs font-bold flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>অ্যাডমিন সক্রিয়</span>
            </div>
          )}
        </div>
      </div>

      {/* Success Notification Alert */}
      {successMessage && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-900 animate-fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span className="text-sm font-bold">{successMessage}</span>
        </div>
      )}

      {/* ========================================================
          POSTING FORM CONTAINER (EXACTLY MATCHING USER SCREENSHOT)
          ======================================================== */}
      <div className="max-w-xl mx-auto space-y-4">
        
        {/* 1. TOP CARD: পোস্টিং তারিখ */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-3.5 sm:p-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="w-5 h-5 text-[#2563eb] shrink-0" />
            <label htmlFor="posting-date-input" className="text-slate-800 font-extrabold text-sm sm:text-base select-none">
              পোস্টিং তারিখ:
            </label>
          </div>

          {/* Date Picker Display Box */}
          <div className="relative">
            <div className="border border-slate-300 hover:border-blue-500 rounded-xl px-3.5 py-1.5 bg-white flex items-center gap-2 cursor-pointer transition-colors shadow-2xs">
              <span className="font-bold text-slate-800 text-sm sm:text-base tracking-wide">
                {formatDisplayDate(date)}
              </span>
              <ChevronDown className="w-4 h-4 text-slate-500 pointer-events-none" />
            </div>
            {/* Transparent Native Date Picker over the display box */}
            <input
              id="posting-date-input"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
            />
          </div>
        </div>

        {/* 2. MAIN TABLE CARD */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="bg-white rounded-2xl border border-slate-300 shadow-xs">
            
            {/* Header Row: [ বিবরণ ] | [ ✓ আয় ] [ ব্যয় ] */}
            <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[130px_1fr] border-b border-slate-200">
              
              {/* Left Column: Solid Vibrant Blue Header */}
              <div className="bg-[#2563eb] text-white font-black text-sm sm:text-base flex items-center justify-center py-3.5 px-3 border-r border-slate-200 select-none">
                বিবরণ
              </div>

              {/* Right Column: Toggle Switches for আয় and ব্যয় */}
              <div className="bg-slate-50/60 p-2 sm:p-2.5 flex items-center justify-around gap-2">
                
                {/* Income Toggle Button */}
                <button
                  type="button"
                  onClick={() => setType('income')}
                  className={`flex-1 max-w-[140px] py-2 px-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                    type === 'income'
                      ? 'bg-[#059669] text-white shadow-xs'
                      : 'bg-transparent text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  {type === 'income' && <Check className="w-4 h-4 stroke-[3]" />}
                  <span>আয়</span>
                </button>

                {/* Expense Toggle Button */}
                <button
                  type="button"
                  onClick={() => setType('expense')}
                  className={`flex-1 max-w-[140px] py-2 px-4 rounded-xl font-bold text-sm sm:text-base transition-all duration-150 flex items-center justify-center gap-1.5 cursor-pointer ${
                    type === 'expense'
                      ? 'bg-[#dc2626] text-white shadow-xs'
                      : 'bg-transparent text-[#991b1b] hover:bg-red-50'
                  }`}
                >
                  {type === 'expense' && <Check className="w-4 h-4 stroke-[3]" />}
                  <span>ব্যয়</span>
                </button>

              </div>
            </div>

            {/* Row 1: টাকার পরিমাণ */}
            <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[130px_1fr] border-b border-slate-200">
              <div className="p-3.5 sm:p-4 border-r border-slate-200 flex items-center font-bold text-slate-800 text-sm sm:text-base bg-white select-none">
                টাকার পরিমাণ
              </div>
              <div className="p-3 sm:p-4 flex flex-col justify-center bg-white space-y-2">
                <div className="flex items-center">
                  <span className="text-slate-400 font-black text-lg sm:text-xl mr-2 select-none">
                    ৳
                  </span>
                  <input
                    id="posting-amount-input"
                    type="text"
                    inputMode="numeric"
                    pattern="[0-9]*"
                    required
                    value={amount}
                    onChange={(e) => setAmount(cleanNumericInput(e.target.value))}
                    placeholder="টাকার পরিমাণ লিখুন"
                    className="w-full text-slate-900 font-extrabold text-base sm:text-lg outline-none placeholder:text-slate-400 placeholder:font-normal bg-transparent"
                  />
                </div>

                {/* Quick preset chips for rapid input on mobile */}
                <div className="flex flex-wrap items-center gap-1.5 pt-0.5">
                  <span className="text-[10px] font-bold text-slate-400 select-none">কুইক:</span>
                  {[500, 1000, 2000, 5000].map((quickVal) => (
                    <button
                      key={quickVal}
                      type="button"
                      onClick={() => setAmount(quickVal.toString())}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 border border-slate-200 hover:border-blue-300 rounded-lg text-[11px] font-bold text-slate-700 transition-colors cursor-pointer select-none active:scale-95"
                    >
                      +{toBanglaNum(quickVal)}
                    </button>
                  ))}
                  {amount && (
                    <button
                      type="button"
                      onClick={() => setAmount('')}
                      className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-red-500 font-semibold transition-colors cursor-pointer select-none"
                    >
                      ক্লিয়ার
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Row 2: চাঁদা দাতার নাম (for income) / প্রাপক বা ব্যয়ের খাত (for expense) */}
            <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[130px_1fr] border-b border-slate-200">
              <div className="p-3.5 sm:p-4 border-r border-slate-200 flex items-center font-bold text-slate-800 text-sm sm:text-base bg-white select-none">
                {type === 'income' ? 'চাঁদা দাতার নাম' : 'ব্যয়ের খাত / প্রাপক'}
              </div>
              <div className="p-3 sm:p-4 flex items-center bg-white">
                <input
                  type="text"
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder={
                    type === 'income'
                      ? 'চাঁদা দাতার নাম লিখুন (ঐচ্ছিক)'
                      : 'প্রাপকের নাম বা ব্যয়ের খাত লিখুন'
                  }
                  className="w-full text-slate-900 font-semibold text-sm sm:text-base outline-none placeholder:text-slate-400 placeholder:font-normal bg-transparent"
                />
              </div>
            </div>

            {/* Row 3: বিবরণ (আয়ের ক্ষেত্রে চাঁদা দাতার নাম ও বিবরণে বাড়ির নাম সিলেক্ট করার ব্যবস্থা) */}
            <div className="grid grid-cols-[105px_1fr] sm:grid-cols-[130px_1fr]">
              <div className="p-3.5 sm:p-4 border-r border-slate-200 flex items-center font-bold text-slate-800 text-sm sm:text-base bg-white select-none">
                বিবরণ
              </div>
              
              <div className="p-3 sm:p-4 bg-white space-y-2.5">
                
                {/* Income: Searchable House Selector & Description */}
                {type === 'income' ? (
                  <>
                    <div className="space-y-2 bg-slate-50/80 p-2.5 sm:p-3.5 rounded-2xl border border-slate-200">
                      
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <label htmlFor="house-select-dropdown" className="text-xs font-black text-slate-800 flex items-center gap-1.5 select-none">
                          <Building2 className="w-4 h-4 text-blue-600" />
                          <span>বাড়ির নাম নির্বাচন করুন:</span>
                        </label>
                        
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {selectedHouse && (
                            <div className="flex items-center gap-1.5 bg-blue-100/90 text-blue-800 text-[11px] font-bold px-2 py-0.5 rounded-lg shadow-2xs">
                              <span>🏡 {selectedHouse}</span>
                              <button
                                type="button"
                                onClick={() => setSelectedHouse('')}
                                className="text-red-500 hover:text-red-700 p-0.5 cursor-pointer font-extrabold"
                                title="নির্বাচন বাতিল"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <button
                            type="button"
                            onClick={() => {
                              setShowNewHouseForm((prev) => !prev);
                              setNewHouseError('');
                            }}
                            className={`text-[11px] font-extrabold px-2.5 py-1 rounded-lg flex items-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95 ${
                              showNewHouseForm
                                ? 'bg-blue-600 text-white'
                                : 'text-blue-700 hover:text-white bg-blue-50 hover:bg-blue-600 border border-blue-200'
                            }`}
                          >
                            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                            <span>{showNewHouseForm ? 'ফর্ম বন্ধ' : '+ নতুন বাড়ি'}</span>
                          </button>
                        </div>
                      </div>

                      {/* New House Creation Expansion Form */}
                      {showNewHouseForm && (
                        <div className="p-3 bg-blue-50 border-2 border-blue-200 rounded-xl space-y-2 animate-fade-in shadow-2xs">
                          <div className="flex items-center justify-between">
                            <span className="text-xs font-black text-blue-900 flex items-center gap-1.5">
                              <Sparkles className="w-4 h-4 text-blue-600" />
                              <span>নতুন বাড়ি সৃষ্টি করুন:</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setShowNewHouseForm(false);
                                setNewHouseInput('');
                                setNewHouseError('');
                              }}
                              className="text-slate-400 hover:text-slate-700 p-0.5 cursor-pointer"
                              title="বন্ধ করুন"
                            >
                              <X className="w-3.5 h-3.5" />
                            </button>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <input
                              type="text"
                              autoFocus
                              value={newHouseInput}
                              onChange={(e) => {
                                setNewHouseInput(e.target.value);
                                if (newHouseError) setNewHouseError('');
                              }}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  e.preventDefault();
                                  handleCreateHouse();
                                }
                              }}
                              placeholder="নতুন বাড়ির নাম লিখুন (যেমন: কবিরাজ বাড়ী)..."
                              className="flex-1 bg-white border border-blue-300 rounded-lg px-3 py-1.5 text-xs sm:text-sm font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500 shadow-2xs"
                            />
                            <button
                              type="button"
                              disabled={isCreatingHouse || !newHouseInput.trim()}
                              onClick={() => handleCreateHouse()}
                              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-lg text-xs sm:text-sm font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-xs active:scale-95 transition-all"
                            >
                              {isCreatingHouse ? (
                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Plus className="w-3.5 h-3.5" />
                              )}
                              <span>তৈরি করুন</span>
                            </button>
                          </div>

                          {newHouseError && (
                            <p className="text-xs text-red-600 font-bold">{newHouseError}</p>
                          )}
                        </div>
                      )}

                      {/* 1. Live Search Input */}
                      <div className="relative">
                        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          id="house-search-input"
                          type="text"
                          value={houseSearchQuery}
                          onChange={(e) => setHouseSearchQuery(e.target.value)}
                          placeholder="বাড়ির নাম দিয়ে সার্চ করুন (যেমন: বৈদ্য, চৌধুরী, খান...)"
                          className="w-full bg-white border border-slate-300 rounded-xl pl-9 pr-8 py-2 text-xs sm:text-sm font-semibold text-slate-900 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all placeholder:text-slate-400 placeholder:font-normal"
                        />
                        {houseSearchQuery && (
                          <button
                            type="button"
                            onClick={() => setHouseSearchQuery('')}
                            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700 p-1 cursor-pointer"
                            title="সার্চ মুছুন"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>

                      {/* Quick Action when search term is not an existing house */}
                      {houseSearchQuery.trim() && !allHouses.some(h => h.trim().toLowerCase() === houseSearchQuery.trim().toLowerCase()) && (
                        <div className="p-2 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2 animate-fade-in">
                          <span className="text-xs text-amber-900 font-medium truncate">
                            💡 <strong className="font-bold">"{houseSearchQuery.trim()}"</strong> তালিকায় নেই
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCreateHouse(houseSearchQuery.trim())}
                            className="px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shrink-0 cursor-pointer shadow-2xs active:scale-95 transition-all"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>নতুন বাড়ি হিসেবে সৃষ্টি করুন</span>
                          </button>
                        </div>
                      )}

                      {/* 2. Standard Dropdown Menu */}
                      <div>
                        <select
                          id="house-select-dropdown"
                          value={selectedHouse}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val.startsWith('__NEW_HOUSE__:')) {
                              const nameToMake = val.replace('__NEW_HOUSE__:', '');
                              handleCreateHouse(nameToMake);
                            } else {
                              setSelectedHouse(val);
                            }
                          }}
                          className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none cursor-pointer shadow-2xs"
                        >
                          <option value="">-- ড্রপডাউন মেনু থেকে বাড়ি বেছে নিন ({filteredHouses.length}টি বাড়ি) --</option>
                          <option value="">🚫 কোনো নির্দিষ্ট বাড়ি নয় (সাধারণ অনুদান)</option>
                          {filteredHouses.map((house) => (
                            <option key={house} value={house}>
                              🏡 {house}
                            </option>
                          ))}
                          {houseSearchQuery.trim() && !allHouses.some(h => h.trim().toLowerCase() === houseSearchQuery.trim().toLowerCase()) && (
                            <option value={`__NEW_HOUSE__:${houseSearchQuery.trim()}`}>
                              ✨ + "{houseSearchQuery.trim()}" নতুন বাড়ি সৃষ্টি ও নির্বাচন করুন
                            </option>
                          )}
                        </select>
                      </div>

                      {/* 3. Interactive Quick-Tap House Pills */}
                      <div className="pt-1">
                        <div className="flex items-center justify-between text-[11px] text-slate-500 font-bold mb-1.5 px-0.5 select-none">
                          <span>বা সরাসরি ট্যাপ করুন:</span>
                          {selectedHouse && (
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedHouse('');
                                setHouseSearchQuery('');
                              }}
                              className="text-red-500 hover:text-red-700 font-bold flex items-center gap-0.5 cursor-pointer text-[10px]"
                            >
                              <X className="w-3 h-3" />
                              <span>সিলেকশন মুছুন</span>
                            </button>
                          )}
                        </div>

                        <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto p-1.5 bg-white border border-slate-200 rounded-xl">
                          <button
                            type="button"
                            onClick={() => setSelectedHouse('')}
                            className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none active:scale-95 ${
                              !selectedHouse
                                ? 'bg-slate-800 text-white shadow-xs'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            সাধারণ অনুদান
                          </button>

                          {filteredHouses.map((house) => {
                            const isSel = selectedHouse === house;
                            return (
                              <button
                                key={house}
                                type="button"
                                onClick={() => {
                                  setSelectedHouse(house);
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer select-none flex items-center gap-1 active:scale-95 ${
                                  isSel
                                    ? 'bg-blue-600 text-white shadow-xs ring-2 ring-blue-300'
                                    : 'bg-slate-100 text-slate-800 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-200'
                                }`}
                              >
                                <span>🏡</span>
                                <span>{house}</span>
                                {isSel && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                              </button>
                            );
                          })}

                          {filteredHouses.length === 0 && houseSearchQuery.trim() && (
                            <button
                              type="button"
                              onClick={() => handleCreateHouse(houseSearchQuery.trim())}
                              className="px-3 py-1.5 bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold cursor-pointer flex items-center gap-1.5 shadow-2xs active:scale-95"
                            >
                              <Plus className="w-3.5 h-3.5 text-amber-700" />
                              <span>+ "{houseSearchQuery.trim()}" নতুন বাড়ি হিসেবে সৃষ্টি ও সিলেক্ট করুন</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>

                    <input
                      id="posting-description-input"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="আয়ের কারণ বা অতিরিক্ত বিবরণ (যেমন: বাৎসরিক অনুদান / ৫ম কিস্তি)"
                      className="w-full text-slate-800 font-medium text-xs sm:text-sm outline-none placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-blue-400 focus:bg-white transition-all shadow-2xs"
                    />
                  </>
                ) : (
                  /* Expense: Category selection & detailed description (Both 100% optional, no auto-selection) */
                  <div className="space-y-2 bg-slate-50/80 p-2.5 sm:p-3.5 rounded-2xl border border-slate-200">
                    <div className="flex items-center justify-between gap-2 flex-wrap">
                      <label htmlFor="expense-category-select" className="text-xs font-black text-slate-800 flex items-center gap-1.5 select-none">
                        <span>ব্যয়ের খাত নির্বাচন (ঐচ্ছিক):</span>
                      </label>
                      {expenseCategory && (
                        <button
                          type="button"
                          onClick={() => setExpenseCategory('')}
                          className="text-red-500 hover:text-red-700 text-[11px] font-bold flex items-center gap-0.5 cursor-pointer bg-red-50 px-2 py-0.5 rounded-md border border-red-200"
                        >
                          <X className="w-3 h-3" />
                          <span>সিলেকশন মুছুন</span>
                        </button>
                      )}
                    </div>

                    <div className="relative">
                      <select
                        id="expense-category-select"
                        value={expenseCategory}
                        onChange={(e) => setExpenseCategory(e.target.value)}
                        className="w-full bg-white border border-slate-300 rounded-xl px-3 py-2.5 text-slate-800 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-red-500 focus:border-red-500 outline-none cursor-pointer transition-all shadow-2xs"
                      >
                        <option value="">-- ব্যয়ের খাত বেছে নিন (ঐচ্ছিক, স্বয়ংক্রিয় নয়) --</option>
                        {GENERAL_EXPENSE_CATEGORIES.map((cat) => (
                          <option key={cat} value={cat}>
                            📌 {cat}
                          </option>
                        ))}
                      </select>
                    </div>

                    <input
                      id="expense-description-input"
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="ব্যয়ের কারণ বা বিবরণ লিখুন (ঐচ্ছিক - খালি রেখেও পোস্টিং করা যাবে)"
                      className="w-full text-slate-800 font-medium text-xs sm:text-sm outline-none placeholder:text-slate-400 bg-white border border-slate-200 rounded-xl px-3 py-2 focus:border-red-400 focus:bg-white transition-all shadow-2xs"
                    />
                  </div>
                )}

              </div>
            </div>

          </div>

          {/* 3. BOTTOM RIGHT ACTION BUTTON (Blue Pill with Send Icon) */}
          <div className="flex justify-end pt-1">
            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-[#2563eb] hover:bg-[#1d4ed8] text-white font-black text-sm sm:text-base px-8 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-150 active:scale-95 flex items-center gap-2 cursor-pointer disabled:opacity-60 select-none"
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>পোস্টিং হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 sm:w-5 sm:h-5 -rotate-12" />
                  <span>পোস্টিং</span>
                </>
              )}
            </button>
          </div>
        </form>

      </div>

      {/* ========================================================
          FINANCIAL SUMMARY CARDS (CURRENT YEAR)
          ======================================================== */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4">
        <div className="bg-white border border-emerald-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-emerald-800">মোট জমা / আয় ({toBanglaNum(selectedYear)})</p>
            <p className="text-base sm:text-lg font-black text-emerald-900">
              ৳ {toBanglaNum(totalIncome.toLocaleString('bn-BD'))}
            </p>
          </div>
        </div>

        <div className="bg-white border border-red-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-red-50 text-red-700 flex items-center justify-center shrink-0">
            <TrendingDown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-red-800">মোট খরচ / ব্যয় ({toBanglaNum(selectedYear)})</p>
            <p className="text-base sm:text-lg font-black text-red-900">
              ৳ {toBanglaNum(totalExpense.toLocaleString('bn-BD'))}
            </p>
          </div>
        </div>

        <div className="bg-white border border-blue-200 rounded-2xl p-4 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <DollarSign className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] font-bold text-blue-800">উদ্বৃত্ত / তহবিল ব্যালেন্স</p>
            <p className={`text-base sm:text-lg font-black ${balance >= 0 ? 'text-blue-950' : 'text-red-700'}`}>
              ৳ {toBanglaNum(balance.toLocaleString('bn-BD'))}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================================
          RECENT POSTINGS LIST (সাম্প্রতিক পোস্টিং সমূহ)
          ======================================================== */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        
        {/* List Header & Search Filter */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <h3 className="font-black text-slate-900 text-sm sm:text-base flex items-center gap-2">
              <Receipt className="w-4 h-4 text-blue-600" />
              <span>সাম্প্রতিক পোস্টিং রেকর্ড ({toBanglaNum(selectedYear)})</span>
              <span className="text-xs bg-slate-200 text-slate-700 px-2 py-0.5 rounded-full font-bold">
                {toBanglaNum(filteredRecentPostings.length)} টি
              </span>
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              সর্বশেষ এন্ট্রি করা পোস্টিংগুলো এখানে প্রদর্শিত হচ্ছে
            </p>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Type Filter Pills */}
            <div className="flex bg-white border border-slate-200 rounded-xl p-0.5 text-xs font-bold">
              <button
                type="button"
                onClick={() => setPostingFilter('all')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  postingFilter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                সকল
              </button>
              <button
                type="button"
                onClick={() => setPostingFilter('income')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  postingFilter === 'income' ? 'bg-emerald-600 text-white' : 'text-slate-600 hover:text-emerald-700'
                }`}
              >
                আয়
              </button>
              <button
                type="button"
                onClick={() => setPostingFilter('expense')}
                className={`px-2.5 py-1 rounded-lg transition-colors cursor-pointer ${
                  postingFilter === 'expense' ? 'bg-red-600 text-white' : 'text-slate-600 hover:text-red-700'
                }`}
              >
                ব্যয়
              </button>
            </div>

            {/* Search Input */}
            <div className="relative flex-1 sm:w-48">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="খুঁজুন..."
                className="w-full bg-white border border-slate-200 rounded-xl pl-8 pr-3 py-1 text-xs outline-none focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Table / List */}
        {filteredRecentPostings.length === 0 ? (
          <div className="p-8 text-center text-slate-500">
            <p className="font-bold text-sm">এই বছরে কোনো পোস্টিং পাওয়া যায়নি</p>
            <p className="text-xs text-slate-400 mt-1">উপরের ফর্ম থেকে নতুন পোস্টিং সংরক্ষণ করুন</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/75 border-b border-slate-200 text-slate-700 font-extrabold">
                <tr>
                  <th className="py-2.5 px-3 text-center w-10">ক্রম</th>
                  <th className="py-2.5 px-3">তারিখ</th>
                  <th className="py-2.5 px-3 text-center">ধরণ</th>
                  <th className="py-2.5 px-3">দাতার নাম / প্রাপক</th>
                  <th className="py-2.5 px-3">বিবরণ / বাড়ি</th>
                  <th className="py-2.5 px-3 text-right">টাকা</th>
                  {isAdminLoggedIn && <th className="py-2.5 px-3 text-center w-16">অ্যাকশন</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredRecentPostings.map((tx, idx) => (
                  <tr key={tx.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-2.5 px-3 text-center font-bold text-slate-500">
                      {toBanglaNum(idx + 1)}
                    </td>
                    <td className="py-2.5 px-3 font-semibold text-slate-800 whitespace-nowrap">
                      {formatDisplayDate(tx.date)}
                    </td>
                    <td className="py-2.5 px-3 text-center whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md font-extrabold text-[11px] ${
                          tx.type === 'income'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-red-100 text-red-800'
                        }`}
                      >
                        {tx.type === 'income' ? 'আয়' : 'ব্যয়'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-bold text-slate-900">
                      {tx.donorName || '-'}
                    </td>
                    <td className="py-2.5 px-3 text-slate-700">
                      <div className="flex flex-col">
                        <span className="font-semibold text-slate-900">{tx.description || tx.category}</span>
                        {tx.houseName && (
                          <span className="text-[11px] text-blue-700 font-bold flex items-center gap-1 mt-0.5">
                            <Building2 className="w-3 h-3 inline" /> {tx.houseName}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-right font-black whitespace-nowrap">
                      <span className={tx.type === 'income' ? 'text-emerald-700' : 'text-red-600'}>
                        {tx.type === 'income' ? '+' : '-'} ৳ {toBanglaNum(tx.amount.toLocaleString('bn-BD'))}
                      </span>
                    </td>
                    {isAdminLoggedIn && (
                      <td className="py-2.5 px-3 text-center">
                        <button
                          onClick={() => handleDelete(tx.id)}
                          disabled={isDeletingId === tx.id}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          title="পোস্টিং মুছে ফেলুন"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>

      {/* Quick Links / Shortcuts to other financial tools */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
        <button
          type="button"
          onClick={() => onNavigate && onNavigate('finance')}
          className="text-xs font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1.5 cursor-pointer"
        >
          <span>আয়-ব্যয় পূর্ণাঙ্গ হিসাব বিবরণী দেখুন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate && onNavigate('house-donations')}
          className="text-xs font-bold text-emerald-700 hover:text-emerald-900 flex items-center gap-1.5 cursor-pointer"
        >
          <span>বাড়িভিত্তিক চাঁদা তালিকা ও কালেকশন</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* ========================================================
          ADMIN PASSWORD UNLOCK MODAL
          ======================================================== */}
      {showPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
          <div className="bg-white rounded-3xl p-6 sm:p-8 max-w-sm w-full shadow-2xl border border-slate-200 text-center space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-amber-50 border border-amber-200 text-amber-600 flex items-center justify-center mx-auto">
              <KeyRound className="w-6 h-6" />
            </div>

            <div>
              <h3 className="font-extrabold text-slate-900 text-lg">অ্যাডমিন পাসওয়ার্ড</h3>
              <p className="text-xs text-slate-500 mt-1">
                পোস্টিং সংরক্ষণ করতে অনুগ্রহ করে নির্ধারিত অ্যাডমিন পাসওয়ার্ড প্রদান করুন
              </p>
            </div>

            <form onSubmit={handleAdminAuth} className="space-y-3">
              <input
                type="password"
                required
                autoFocus
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="পাসওয়ার্ড লিখুন..."
                className="w-full bg-slate-50 border border-slate-300 rounded-xl px-4 py-2.5 text-center font-bold text-slate-900 outline-none focus:ring-2 focus:ring-blue-500"
              />

              {passwordError && (
                <p className="text-xs font-bold text-red-600">{passwordError}</p>
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowPasswordModal(false);
                    setPasswordInput('');
                    setPasswordError('');
                  }}
                  className="flex-1 py-2 rounded-xl border border-slate-300 text-slate-700 text-xs font-bold hover:bg-slate-50 cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs cursor-pointer"
                >
                  যাচাই করুন
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
