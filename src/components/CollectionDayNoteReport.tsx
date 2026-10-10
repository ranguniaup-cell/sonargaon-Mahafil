import React from 'react';
import { Transaction, MahfilDetails } from '../types';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { exportElementToPdf } from '../utils/html2canvasSafe';
import {
  Coins,
  Receipt,
  Users,
  Award,
  TrendingUp,
  Download,
  Printer,
  Copy,
  Check,
  Search,
  Filter,
  ChevronDown,
  ChevronUp,
  Package,
  Calendar,
  Building2,
  Sparkles,
  RefreshCw,
  Eye,
  FileSpreadsheet,
  CheckCircle2,
  Share2
} from 'lucide-react';

// Helper for Bangla numbers
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '০';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
};

// Helper for Bangla date formatting (YYYY-MM-DD -> DD/MM/YYYY)
const toBanglaDate = (dateStr?: string): string => {
  if (!dateStr) return '-';
  const parts = dateStr.split('-');
  if (parts.length === 3) {
    const day = parseInt(parts[2], 10);
    const month = parseInt(parts[1], 10);
    const year = parts[0];
    return `${toBanglaNum(day)}/${toBanglaNum(month)}/${toBanglaNum(year)}`;
  }
  return toBanglaNum(dateStr);
};

// Today's Bangla date
const getTodayBanglaDate = (): string => {
  const d = new Date();
  const day = toBanglaNum(d.getDate().toString().padStart(2, '0'));
  const m = toBanglaNum((d.getMonth() + 1).toString().padStart(2, '0'));
  const y = toBanglaNum(d.getFullYear());
  return `${day}/${m}/${y}`;
};

export interface DenominationSlab {
  amount: number;
  count: number;
  totalAmount: number;
  percentage: number;
  donors: Transaction[];
}

interface CollectionDayNoteReportProps {
  transactions: Transaction[];
  mahfilDetails?: MahfilDetails;
  defaultYear?: string;
  isAdminLoggedIn?: boolean;
}

export default function CollectionDayNoteReport({
  transactions = [],
  mahfilDetails,
  defaultYear = '2026',
  isAdminLoggedIn = false
}: CollectionDayNoteReportProps) {
  // Year filter state - default to 2026 as explicitly requested
  const [selectedYear, setSelectedYear] = React.useState<string>(defaultYear);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [sortOrder, setSortOrder] = React.useState<'amount-desc' | 'amount-asc' | 'count-desc' | 'total-desc'>('amount-desc');
  const [activeTierFilter, setActiveTierFilter] = React.useState<'all' | 'high' | 'mid' | 'standard' | 'small'>('all');
  
  // Expanded slabs for viewing donor details
  const [expandedSlabs, setExpandedSlabs] = React.useState<Record<number, boolean>>({});
  
  // Export & Copy states
  const [isExportingPDF, setIsExportingPDF] = React.useState<boolean>(false);
  const [isCopied, setIsCopied] = React.useState<boolean>(false);
  const [selectedModalSlab, setSelectedModalSlab] = React.useState<DenominationSlab | null>(null);

  // Available years from transactions
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<string>();
    transactions.forEach((t) => {
      if (t.year) yearsSet.add(t.year.toString());
      else if (t.date) {
        const y = t.date.split('-')[0];
        if (y) yearsSet.add(y);
      }
    });
    // Ensure 2027, 2026, 2025, 2024 are present
    yearsSet.add('2027');
    yearsSet.add('2026');
    yearsSet.add('2025');
    yearsSet.add('2024');
    return Array.from(yearsSet).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Synchronize defaultYear if prop changes
  React.useEffect(() => {
    if (defaultYear) {
      setSelectedYear(defaultYear);
    }
  }, [defaultYear]);

  // Filter transactions for the selected year
  const yearIncomeTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'income') return false;
      if (selectedYear === 'all') return true;
      const yrMatch = t.year ? t.year.toString() === selectedYear : (t.date ? t.date.startsWith(selectedYear) : false);
      return yrMatch;
    });
  }, [transactions, selectedYear]);

  // Unique categories for filtering
  const availableCategories = React.useMemo(() => {
    const catSet = new Set<string>();
    yearIncomeTransactions.forEach((t) => {
      if (t.category) catSet.add(t.category);
    });
    return Array.from(catSet);
  }, [yearIncomeTransactions]);

  // Separate cash donations vs item/commodity donations
  const { cashTransactions, itemTransactions } = React.useMemo(() => {
    const cash: Transaction[] = [];
    const items: Transaction[] = [];

    yearIncomeTransactions.forEach((t) => {
      // Category or type filter
      if (selectedCategory !== 'all' && t.category !== selectedCategory) {
        return;
      }

      const amt = Number(t.amount) || 0;
      const isItem = t.donationType === 'item' || amt === 0 || Boolean(t.itemName);

      if (isItem && amt === 0) {
        items.push(t);
      } else {
        cash.push(t);
      }
    });

    return { cashTransactions: cash, itemTransactions: items };
  }, [yearIncomeTransactions, selectedCategory]);

  // Aggregate totals
  const totalCashAmount = React.useMemo(() => {
    return cashTransactions.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [cashTransactions]);

  const totalCashDonors = cashTransactions.length;

  // Build Denomination Slabs (ডে নোট তালিকা)
  const rawSlabs = React.useMemo<DenominationSlab[]>(() => {
    const map: Record<number, Transaction[]> = {};

    cashTransactions.forEach((t) => {
      const amt = Number(t.amount) || 0;
      if (amt > 0) {
        if (!map[amt]) {
          map[amt] = [];
        }
        map[amt].push(t);
      }
    });

    return Object.entries(map).map(([amtStr, list]) => {
      const amount = Number(amtStr);
      const count = list.length;
      const totalAmount = amount * count;
      const percentage = totalCashAmount > 0 ? (totalAmount / totalCashAmount) * 100 : 0;

      return {
        amount,
        count,
        totalAmount,
        percentage,
        donors: list
      };
    });
  }, [cashTransactions, totalCashAmount]);

  // Filter & Sort slabs
  const processedSlabs = React.useMemo(() => {
    let result = [...rawSlabs];

    // Search query filter (e.g. searching 20,000, or a donor name)
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const qNum = q.replace(/,/g, '');
      result = result.filter((slab) => {
        // match amount number
        if (slab.amount.toString().includes(qNum)) return true;
        // match Bangla digits
        const bnAmount = toBanglaNum(slab.amount);
        if (bnAmount.includes(q)) return true;
        // match donor name or house name inside this slab
        return slab.donors.some((d) => 
          (d.donorName && d.donorName.toLowerCase().includes(q)) ||
          (d.houseName && d.houseName.toLowerCase().includes(q)) ||
          (d.receiptNo && d.receiptNo.toLowerCase().includes(q))
        );
      });
    }

    // Tier filtering
    if (activeTierFilter === 'high') {
      result = result.filter((s) => s.amount >= 5000);
    } else if (activeTierFilter === 'mid') {
      result = result.filter((s) => s.amount >= 2000 && s.amount < 5000);
    } else if (activeTierFilter === 'standard') {
      result = result.filter((s) => s.amount >= 1000 && s.amount < 2000);
    } else if (activeTierFilter === 'small') {
      result = result.filter((s) => s.amount < 1000);
    }

    // Sorting
    switch (sortOrder) {
      case 'amount-desc':
        result.sort((a, b) => b.amount - a.amount);
        break;
      case 'amount-asc':
        result.sort((a, b) => a.amount - b.amount);
        break;
      case 'count-desc':
        result.sort((a, b) => b.count - a.count);
        break;
      case 'total-desc':
        result.sort((a, b) => b.totalAmount - a.totalAmount);
        break;
    }

    return result;
  }, [rawSlabs, searchQuery, activeTierFilter, sortOrder]);

  // Overall Statistics
  const highestSlab = React.useMemo(() => {
    if (rawSlabs.length === 0) return null;
    return [...rawSlabs].sort((a, b) => b.amount - a.amount)[0];
  }, [rawSlabs]);

  const mostPopularSlab = React.useMemo(() => {
    if (rawSlabs.length === 0) return null;
    return [...rawSlabs].sort((a, b) => b.count - a.count)[0];
  }, [rawSlabs]);

  const averageDonation = React.useMemo(() => {
    if (totalCashDonors === 0) return 0;
    return Math.round(totalCashAmount / totalCashDonors);
  }, [totalCashAmount, totalCashDonors]);

  // Toggle individual slab expand
  const toggleSlabExpand = (amount: number) => {
    setExpandedSlabs((prev) => ({
      ...prev,
      [amount]: !prev[amount]
    }));
  };

  // Expand / Collapse all slabs
  const handleToggleAllSlabs = (expand: boolean) => {
    const updated: Record<number, boolean> = {};
    if (expand) {
      processedSlabs.forEach((s) => {
        updated[s.amount] = true;
      });
    }
    setExpandedSlabs(updated);
  };

  // Copy structured Day Note to Clipboard for WhatsApp/SMS
  const handleCopyDayNoteText = () => {
    const hijriMap: Record<string, string> = {
      '2027': '২০২৭ (১৪৪৯ হিজরী)',
      '2026': '২০২৬ (১৪৪৮ হিজরী)',
      '2025': '২০২৫ (১৪৪৭ হিজরী)',
      '2024': '২০২৪ (১৪৪৬ হিজরী)'
    };
    const yrLabel = hijriMap[selectedYear] || `${toBanglaNum(selectedYear)} খ্রি.`;

    let text = `*পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ*\n`;
    text += `সোনারগাঁও, ধামাইর হাট, রাঙ্গুনিয়া, চট্টগ্রাম\n`;
    text += `*${yrLabel} মাহফিলের চাঁদা কালেকশন ডে নোট (ডিনোমিনেশন বিবরণী):*\n`;
    text += `তারিখ: ${getTodayBanglaDate()}\n`;
    text += `-------------------------------------------\n`;

    // Sort descending by amount for message copy
    const sorted = [...rawSlabs].sort((a, b) => b.amount - a.amount);
    sorted.forEach((slab, idx) => {
      text += `${toBanglaNum(idx + 1)}. ৳ ${toBanglaNum(slab.amount.toLocaleString('bn-BD'))}/- = ${toBanglaNum(slab.count)} জন (মোট ৳ ${toBanglaNum(slab.totalAmount.toLocaleString('bn-BD'))}/-)\n`;
    });

    text += `-------------------------------------------\n`;
    text += `*সর্বমোট নগদ চাঁদা আদায়:* ৳ ${toBanglaNum(totalCashAmount.toLocaleString('bn-BD'))}/-\n`;
    text += `*মোট নগদ দাতা / রশিদ সংখ্যা:* ${toBanglaNum(totalCashDonors)} জন\n`;
    text += `*মোট ডিনোমিনেশন সংখ্যা:* ${toBanglaNum(rawSlabs.length)} টি\n`;
    if (itemTransactions.length > 0) {
      text += `*পণ্য / দ্রব্য সামগ্রী দান:* ${toBanglaNum(itemTransactions.length)} জন (চাউল, ধান ইত্যাদি)\n`;
    }
    text += `\n(সোনারগাঁও উদযাপন পরিষদ ডিজিটাল অডিট সিস্টেম)`;

    navigator.clipboard.writeText(text).then(() => {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 3000);
    }).catch((err) => {
      console.error('Failed to copy text:', err);
    });
  };

  // Print Handler
  const handlePrint = () => {
    window.print();
  };

  // PDF Export Handler
  const handleDownloadPDF = async () => {
    const printArea = document.getElementById('collection-day-note-print-area');
    if (!printArea) return;

    setIsExportingPDF(true);
    try {
      await exportElementToPdf(printArea, {
        fileName: `কালেকশন-ডে-নোট-${selectedYear === 'all' ? 'সকল-বছর' : selectedYear}-সন.pdf`,
        format: 'a4',
        orientation: 'portrait',
        margin: 8,
        scale: 2.5
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('পিডিএফ তৈরিতে সমস্যা হয়েছে। সরাসরি প্রিন্ট অপশন ব্যবহার করতে পারেন।');
    } finally {
      setIsExportingPDF(false);
    }
  };

  return (
    <div id="collection-day-note-report-root" className="space-y-8 animate-fade-in text-[#3c3c3c]">
      {/* 1. Header & Controls Card (Hidden on Print) */}
      <div className="print:hidden bg-white border border-[#cbd5e1] rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 pb-6 border-b border-[#e2e8f0]">
          <div className="flex items-start space-x-4">
            <div className="p-3.5 bg-gradient-to-br from-[#064e3b] to-[#0f766e] text-white rounded-2xl shadow-md shrink-0">
              <Coins className="h-8 w-8 text-amber-300" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <span className="text-[11px] font-black uppercase tracking-wider text-white bg-[#064e3b] px-3 py-0.5 rounded-full shadow-xs">
                  কালেকশন ডিনোমিনেশন
                </span>
                <span className="text-[11px] font-extrabold text-[#d97706] bg-[#d97706]/15 border border-[#d97706]/30 px-2.5 py-0.5 rounded-full">
                  {selectedYear === '2026' ? '২০২৬ বিশেষ ডে নোট' : `${toBanglaNum(selectedYear)} খ্রি.`}
                </span>
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-[#064e3b]">
                মাহফিল চাঁদা কালেকশন ডে নোট (Denomination Report)
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 font-medium mt-0.5">
                কোন অংকের নোটে কতজন দাতা কত টাকা প্রদান করেছেন তার সুনির্দিষ্ট স্ল্যাব ভিত্তিক তথ্য ও বিশ্লেষণ।
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            <button
              id="copy-day-note-btn"
              type="button"
              onClick={handleCopyDayNoteText}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold border transition cursor-pointer flex items-center space-x-2 shadow-xs ${
                isCopied 
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-300' 
                  : 'bg-white hover:bg-slate-50 text-slate-700 border-[#cbd5e1]'
              }`}
              title="WhatsApp ও মেসেজে পাঠানোর জন্য টেক্সট কপি করুন"
            >
              {isCopied ? (
                <>
                  <Check className="h-4 w-4 text-emerald-600" />
                  <span>ডে নোট কপি হয়েছে!</span>
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4 text-[#0f766e]" />
                  <span>মেসেজ কপি করুন</span>
                </>
              )}
            </button>

            <button
              id="print-day-note-btn"
              type="button"
              onClick={handlePrint}
              className="px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-[#cbd5e1] rounded-xl text-xs font-bold transition cursor-pointer flex items-center space-x-2 shadow-xs"
            >
              <Printer className="h-4 w-4 text-[#0f766e]" />
              <span>প্রিন্ট ভিউ</span>
            </button>

            <button
              id="download-day-note-pdf-btn"
              type="button"
              onClick={handleDownloadPDF}
              disabled={isExportingPDF}
              className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#064e3b] disabled:bg-slate-300 text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition cursor-pointer flex items-center space-x-2"
            >
              {isExportingPDF ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>পিডিএফ প্রস্তুত হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-amber-300" />
                  <span>ডে নোট PDF ডাউনলোড</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Year Selector Bar */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-slate-50 border border-slate-200 rounded-2xl p-4">
          <div className="flex items-center space-x-2">
            <Calendar className="h-4 w-4 text-[#0f766e]" />
            <span className="text-xs sm:text-sm font-bold text-[#064e3b]">হিসাবের বছর নির্বাচন করুন:</span>
          </div>

          <div className="flex flex-wrap gap-2">
            {availableYears.map((yr) => (
              <button
                key={yr}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1.5 shadow-xs ${
                  selectedYear === yr
                    ? 'bg-[#064e3b] text-white shadow-sm'
                    : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
                }`}
              >
                <span>{yr === '2027' ? '২০২৭ (১৪৪৯ হিজরী)' : yr === '2026' ? '২০২৬ (১৪৪৮ হিজরী)' : yr === '2025' ? '২০২৫ (১৪৪৭ হিজরী)' : `${toBanglaNum(yr)} সন`}</span>
                {yr === '2027' && (
                  <span className="bg-amber-400 text-slate-950 text-[10px] px-1.5 py-0.2 rounded-full font-black ml-1">
                    চলতি
                  </span>
                )}
              </button>
            ))}

            <button
              type="button"
              onClick={() => setSelectedYear('all')}
              className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer flex items-center space-x-1 shadow-xs ${
                selectedYear === 'all'
                  ? 'bg-[#064e3b] text-white shadow-sm'
                  : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-300'
              }`}
            >
              <span>সকল বছর একত্রে</span>
            </button>
          </div>
        </div>

        {/* Search, Filter & Sorters */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 pt-2">
          {/* Search Box */}
          <div className="md:col-span-5 relative">
            <Search className="h-4 w-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="টাকার পরিমাণ (যেমন: ২০০০০, ১০০০) বা দাতার নাম খুঁজুন..."
              className="w-full pl-9 pr-4 py-2.5 bg-white border border-[#cbd5e1] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl text-xs sm:text-sm outline-hidden transition"
            />
          </div>

          {/* Category Filter */}
          <div className="md:col-span-4 relative">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl text-xs sm:text-sm outline-hidden transition cursor-pointer"
            >
              <option value="all">সকল চাঁদা ও অনুদানের খাত</option>
              {availableCategories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="md:col-span-3 relative">
            <select
              value={sortOrder}
              onChange={(e) => setSortOrder(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-white border border-[#cbd5e1] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl text-xs sm:text-sm outline-hidden transition cursor-pointer font-medium"
            >
              <option value="amount-desc">টাকার অংক (বড় থেকে ছোট)</option>
              <option value="amount-asc">টাকার অংক (ছোট থেকে বড়)</option>
              <option value="count-desc">দাতার সংখ্যা (বেশি থেকে কম)</option>
              <option value="total-desc">মোট আদায় (বেশি থেকে কম)</option>
            </select>
          </div>
        </div>

        {/* Slab Tier Quick Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-xs font-bold text-slate-500 flex items-center space-x-1">
            <Filter className="h-3.5 w-3.5" />
            <span>স্ল্যাব ফিল্টার:</span>
          </span>
          <button
            type="button"
            onClick={() => setActiveTierFilter('all')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTierFilter === 'all'
                ? 'bg-[#0f766e] text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            সব স্ল্যাব ({rawSlabs.length}টি)
          </button>
          <button
            type="button"
            onClick={() => setActiveTierFilter('high')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTierFilter === 'high'
                ? 'bg-[#064e3b] text-white'
                : 'bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-200'
            }`}
          >
            বড় অনুদান (৫,০০০+ টাকা)
          </button>
          <button
            type="button"
            onClick={() => setActiveTierFilter('mid')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTierFilter === 'mid'
                ? 'bg-[#0f766e] text-white'
                : 'bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200'
            }`}
          >
            মাঝারি চাঁদা (২,০০০ - ৪,০০০ টাকা)
          </button>
          <button
            type="button"
            onClick={() => setActiveTierFilter('standard')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTierFilter === 'standard'
                ? 'bg-amber-700 text-white'
                : 'bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200'
            }`}
          >
            সাধারণ চাঁদা (১,০০০ - ১,৫০০ টাকা)
          </button>
          <button
            type="button"
            onClick={() => setActiveTierFilter('small')}
            className={`px-3 py-1 rounded-full text-xs font-bold transition cursor-pointer ${
              activeTierFilter === 'small'
                ? 'bg-slate-700 text-white'
                : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
            }`}
          >
            খুচরা অনুদান (১০০ - ৬০০ টাকা)
          </button>
        </div>
      </div>

      {/* 2. Key Performance Indicators (KPI Cards) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Cash Collection */}
        <div className="bg-gradient-to-br from-emerald-900 to-[#064e3b] text-white rounded-3xl p-5 sm:p-6 shadow-md relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full blur-xl pointer-events-none"></div>
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-emerald-500/20 text-emerald-300 rounded-xl border border-emerald-400/30">
              <TrendingUp className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">সর্বমোট নগদ আদায়</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white mt-1">
            ৳ {toBanglaNum(totalCashAmount.toLocaleString('bn-BD'))}/-
          </div>
          <p className="text-[11px] text-emerald-200/80 font-light mt-1">
            {selectedYear === 'all' ? 'সকল বছরের সর্বমোট নগদ চাঁদা' : `${toBanglaNum(selectedYear)} সালের নগদ অর্থ সংগ্রহ`}
          </p>
        </div>

        {/* Total Donors Count */}
        <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-blue-50 text-blue-700 rounded-xl border border-blue-100">
              <Users className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">মোট দাতা / রশিদ</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#064e3b] mt-1">
            {toBanglaNum(totalCashDonors)} জন
          </div>
          <p className="text-[11px] text-slate-500 font-light mt-1">
            গড় অনুদান: ৳ {toBanglaNum(averageDonation.toLocaleString('bn-BD'))}/-
          </p>
        </div>

        {/* Distinct Denomination Slabs */}
        <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
              <Coins className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">মোট স্ল্যাব / নোট</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-[#d97706] mt-1">
            {toBanglaNum(rawSlabs.length)} টি
          </div>
          <p className="text-[11px] text-slate-500 font-light mt-1">
            সর্বোচ্চ দাতা: ৳ {toBanglaNum(mostPopularSlab?.amount.toLocaleString('bn-BD') || 0)} নোটে ({toBanglaNum(mostPopularSlab?.count || 0)} জন)
          </p>
        </div>

        {/* Max Donation & Commodity Donations */}
        <div className="bg-white border border-[#cbd5e1] rounded-3xl p-5 sm:p-6 shadow-sm">
          <div className="flex items-center space-x-3 mb-2">
            <div className="p-2 bg-purple-50 text-purple-700 rounded-xl border border-purple-100">
              <Award className="h-5 w-5" />
            </div>
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">সর্বোচ্চ একক অনুদান</span>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-purple-800 mt-1">
            ৳ {toBanglaNum(highestSlab?.amount.toLocaleString('bn-BD') || 0)}/-
          </div>
          <p className="text-[11px] text-slate-500 font-light mt-1">
            {toBanglaNum(highestSlab?.count || 0)} জন দাতা | পণ্য সামগ্রী দান: {toBanglaNum(itemTransactions.length)} জন
          </p>
        </div>
      </div>

      {/* 3. Printable Formal Day Note Area */}
      <div 
        id="collection-day-note-print-area" 
        className="bg-white border border-[#cbd5e1] rounded-3xl p-6 sm:p-10 shadow-sm space-y-8 print:border-none print:shadow-none print:p-0"
      >
        {/* Institutional Pad Header */}
        <div className="text-center pb-6 border-b-2 border-[#064e3b] space-y-2 relative">
          <div className="flex items-center justify-center space-x-3">
            <img 
              src={logo} 
              alt="Logo" 
              onError={handleLogoError}
              className="h-16 w-16 object-contain rounded-full border border-[#cbd5e1] shadow-xs" 
            />
            <div className="text-left">
              <div className="text-xs font-black text-[#d97706] tracking-widest uppercase">
                বিসমিল্লাহির রাহমানির রাহিম
              </div>
              <h1 className="text-xl sm:text-2xl font-black text-[#064e3b]">
                পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
              </h1>
              <p className="text-xs text-slate-600 font-medium">
                {mahfilDetails?.location || 'সোনারগাঁও, তুপ্পারপাড়, ধামাইর হাট, রাঙ্গুনিয়া, চট্টগ্রাম।'}
              </p>
            </div>
          </div>

          <div className="inline-block mt-3 px-6 py-1.5 bg-[#064e3b] text-white rounded-full text-xs sm:text-sm font-black shadow-xs tracking-wide">
            {selectedYear === 'all' 
              ? 'সর্বমোট চাঁদা কালেকশন ডে নোট (ডিনোমিনেশন রিপোর্ট)' 
              : `${selectedYear === '2026' ? '২০২৬ (১৪৪৮ হিজরী)' : `${toBanglaNum(selectedYear)} খ্রি.`} মাহফিলের চাঁদা কালেকশন ডে নোট`}
          </div>

          <div className="flex flex-wrap items-center justify-between text-xs text-slate-500 pt-2 font-medium">
            <span>রিপোর্ট প্রকাশের তারিখ: {getTodayBanglaDate()}</span>
            <span>নগদ আদায়: ৳ {toBanglaNum(totalCashAmount.toLocaleString('bn-BD'))}/- | মোট দাতা: {toBanglaNum(totalCashDonors)} জন</span>
          </div>
        </div>

        {/* Expand / Collapse Control Buttons (Hidden on Print) */}
        <div className="print:hidden flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-2 text-xs font-bold text-slate-700">
            <FileSpreadsheet className="h-4 w-4 text-[#0f766e]" />
            <span>টাকার পরিমাণ অনুযায়ী বিস্তারিত তালিকা ({toBanglaNum(processedSlabs.length)} টি স্ল্যাব প্রদর্শিত)</span>
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="button"
              onClick={() => handleToggleAllSlabs(true)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            >
              <ChevronDown className="h-3.5 w-3.5" />
              <span>সব দাতা উন্মোচন করুন</span>
            </button>
            <button
              type="button"
              onClick={() => handleToggleAllSlabs(false)}
              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1"
            >
              <ChevronUp className="h-3.5 w-3.5" />
              <span>সংকোচন করুন</span>
            </button>
          </div>
        </div>

        {/* The Core Denomination Table */}
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-xs sm:text-sm">
            <thead>
              <tr className="bg-[#064e3b] text-white border border-[#064e3b]">
                <th className="py-3 px-3 text-center w-12 font-bold">ক্রমিক</th>
                <th className="py-3 px-4 font-bold">টাকার পরিমাণ (স্ল্যাব / নোট)</th>
                <th className="py-3 px-4 text-center font-bold">দাতা / রশিদ সংখ্যা</th>
                <th className="py-3 px-4 text-right font-bold">মোট আদায়কৃত টাকা</th>
                <th className="py-3 px-4 text-center font-bold w-40">শতকরা হার (%)</th>
                <th className="py-3 px-3 text-center print:hidden font-bold w-28">অ্যাকশন</th>
              </tr>
            </thead>
            <tbody>
              {processedSlabs.length > 0 ? (
                processedSlabs.map((slab, index) => {
                  const isExpanded = Boolean(expandedSlabs[slab.amount]);
                  return (
                    <React.Fragment key={slab.amount}>
                      <tr 
                        onClick={() => toggleSlabExpand(slab.amount)}
                        className={`border-b border-slate-200 transition cursor-pointer ${
                          isExpanded 
                            ? 'bg-emerald-50/70' 
                            : index % 2 === 0 
                              ? 'bg-white hover:bg-slate-50' 
                              : 'bg-slate-50/60 hover:bg-slate-100/70'
                        }`}
                      >
                        <td className="py-3.5 px-3 text-center font-mono font-bold text-slate-600">
                          {toBanglaNum(index + 1)}
                        </td>
                        <td className="py-3.5 px-4 font-extrabold text-[#064e3b]">
                          <div className="flex items-center space-x-2">
                            <span className="h-2 w-2 rounded-full bg-[#d97706]"></span>
                            <span className="text-sm sm:text-base font-black">
                              ৳ {toBanglaNum(slab.amount.toLocaleString('bn-BD'))}/-
                            </span>
                            {slab.amount >= 10000 && (
                              <span className="text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 px-1.5 py-0.2 rounded-full print:hidden">
                                বিশেষ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="inline-flex items-center justify-center px-3 py-1 rounded-full text-xs font-black bg-[#0f766e]/10 text-[#0f766e] border border-[#0f766e]/20">
                            {toBanglaNum(slab.count)} জন
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm sm:text-base">
                          ৳ {toBanglaNum(slab.totalAmount.toLocaleString('bn-BD'))}/-
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <div className="space-y-1 max-w-[140px] mx-auto">
                            <div className="text-[11px] font-extrabold text-slate-700">
                              {toBanglaNum(slab.percentage.toFixed(2))}%
                            </div>
                            <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                              <div 
                                className="bg-[#0f766e] h-1.5 rounded-full" 
                                style={{ width: `${Math.min(100, Math.max(5, slab.percentage))}%` }}
                              ></div>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center print:hidden">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedModalSlab(slab);
                            }}
                            className="p-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] text-[#064e3b] rounded-lg text-xs font-bold transition shadow-2xs"
                            title="সম্পূর্ণ দাতা তালিকা পপআপে দেখুন"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>

                      {/* Inline Expanded Donors View */}
                      {isExpanded && (
                        <tr className="bg-emerald-50/40 border-b border-emerald-200">
                          <td colSpan={6} className="p-4 sm:p-6">
                            <div className="bg-white border border-emerald-200 rounded-2xl p-4 sm:p-5 shadow-inner space-y-3">
                              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                                <div className="text-xs sm:text-sm font-bold text-[#064e3b] flex items-center space-x-2">
                                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                                  <span>
                                    ৳ {toBanglaNum(slab.amount.toLocaleString('bn-BD'))}/- নোটের {toBanglaNum(slab.count)} জন দাতার তালিকা:
                                  </span>
                                </div>
                                <span className="text-xs font-bold text-slate-500">
                                  মোট: ৳ {toBanglaNum(slab.totalAmount.toLocaleString('bn-BD'))}/-
                                </span>
                              </div>

                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                                {slab.donors.map((donor, dIdx) => (
                                  <div 
                                    key={donor.id || dIdx} 
                                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-xs"
                                  >
                                    <div className="flex items-start justify-between">
                                      <span className="font-extrabold text-[#064e3b] text-sm">
                                        {toBanglaNum(dIdx + 1)}. {donor.donorName || 'বেনামী দাতা'}
                                      </span>
                                      {donor.receiptNo && (
                                        <span className="font-mono text-[10px] bg-slate-200 text-slate-700 px-1.5 py-0.2 rounded font-bold">
                                          রশিদ #{toBanglaNum(donor.receiptNo)}
                                        </span>
                                      )}
                                    </div>
                                    <div className="text-slate-600 flex items-center space-x-1">
                                      <Building2 className="h-3 w-3 text-slate-400 shrink-0" />
                                      <span className="truncate">{donor.houseName || donor.category || 'সাধারণ দান'}</span>
                                    </div>
                                    <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1 border-t border-slate-200/60">
                                      <span>{toBanglaDate(donor.date)}</span>
                                      <span className="font-bold text-emerald-700">৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}</span>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={6} className="py-10 text-center text-slate-400 font-medium">
                    কোনো মিল পাওয়া যায়নি। অনুসন্ধান শব্দ পরিবর্তন করে চেষ্টা করুন।
                  </td>
                </tr>
              )}
            </tbody>

            {/* Grand Total Footer */}
            <tfoot>
              <tr className="bg-[#064e3b] text-white font-black text-xs sm:text-sm border-t-2 border-[#064e3b]">
                <td className="py-3.5 px-3 text-center">✓</td>
                <td className="py-3.5 px-4 font-black">
                  সর্বমোট নগদ আদায় (Grand Total)
                </td>
                <td className="py-3.5 px-4 text-center font-black">
                  {toBanglaNum(totalCashDonors)} জন
                </td>
                <td className="py-3.5 px-4 text-right font-black text-amber-300 text-sm sm:text-base">
                  ৳ {toBanglaNum(totalCashAmount.toLocaleString('bn-BD'))}/-
                </td>
                <td className="py-3.5 px-4 text-center font-black">
                  ১০০.০০%
                </td>
                <td className="py-3.5 px-3 print:hidden text-center text-[10px] text-emerald-200">
                  সম্পূর্ণ হিসাব
                </td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* 4. Non-Cash / Commodity Donations (চাল, ধান ইত্যাদি) */}
        {itemTransactions.length > 0 && (
          <div className="pt-6 border-t-2 border-slate-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-extrabold text-[#064e3b]">
                  পণ্য ও দ্রব্য সামগ্রী অনুদান বিবরণী ({toBanglaNum(itemTransactions.length)} জন)
                </h3>
              </div>
              <span className="text-xs text-slate-500 font-medium">
                নগদ অর্থের অতিরিক্ত দানকৃত পণ্য তালিকা
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-left text-xs sm:text-sm">
                <thead>
                  <tr className="bg-slate-100 text-slate-800 border-b border-slate-300">
                    <th className="py-2.5 px-3 text-center w-12 font-bold">ক্রমিক</th>
                    <th className="py-2.5 px-4 font-bold">দাতার নাম</th>
                    <th className="py-2.5 px-4 font-bold">দানকৃত পণ্য ও পরিমাণ</th>
                    <th className="py-2.5 px-4 font-bold">বাড়ির নাম / এলাকা</th>
                    <th className="py-2.5 px-3 text-center font-bold">তারিখ</th>
                  </tr>
                </thead>
                <tbody>
                  {itemTransactions.map((item, idx) => (
                    <tr key={item.id || idx} className="border-b border-slate-200 hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-slate-500">
                        {toBanglaNum(idx + 1)}
                      </td>
                      <td className="py-2.5 px-4 font-extrabold text-[#064e3b]">
                        {item.donorName || 'বেনামী দাতা'}
                      </td>
                      <td className="py-2.5 px-4 font-black text-amber-800">
                        {item.itemName || item.description || 'পণ্য দান'}
                      </td>
                      <td className="py-2.5 px-4 text-slate-600">
                        {item.houseName || item.category || 'সাধারণ'}
                      </td>
                      <td className="py-2.5 px-3 text-center text-slate-500 font-mono">
                        {toBanglaDate(item.date)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* 5. Official Signatures Section for Printing & PDF */}
        <div className="pt-12 mt-8 border-t-2 border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-6 text-center text-xs">
          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-black text-[#064e3b]">
              সভাপতি
            </div>
            <p className="text-[10px] text-slate-500">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-black text-[#064e3b]">
              সাধারণ সম্পাদক
            </div>
            <p className="text-[10px] text-slate-500">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-black text-[#064e3b]">
              অর্থ সম্পাদক / ক্যাশিয়ার
            </div>
            <p className="text-[10px] text-slate-500">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</p>
          </div>
          <div className="space-y-1">
            <div className="border-t border-slate-400 pt-2 font-black text-[#064e3b]">
              হিসাব নিরীক্ষক (অডিটর)
            </div>
            <p className="text-[10px] text-slate-500">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</p>
          </div>
        </div>
      </div>

      {/* 6. Donor Details Modal Dialog */}
      {selectedModalSlab && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-fade-in print:hidden">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 sm:p-6 bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white flex items-center justify-between">
              <div>
                <span className="text-xs font-bold text-emerald-200 uppercase tracking-wider">
                  স্ল্যাব ভিত্তিক দাতা বিবরণী
                </span>
                <h3 className="text-lg sm:text-xl font-black text-white">
                  ৳ {toBanglaNum(selectedModalSlab.amount.toLocaleString('bn-BD'))}/- নোটের দাতা তালিকা ({toBanglaNum(selectedModalSlab.count)} জন)
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedModalSlab(null)}
                className="p-2 hover:bg-white/10 rounded-full text-white transition cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="p-5 sm:p-6 overflow-y-auto space-y-3 flex-1">
              <div className="flex items-center justify-between text-xs bg-slate-50 p-3 rounded-xl border border-slate-200">
                <span className="font-bold text-slate-700">মোট সংগৃহীত অর্থ:</span>
                <span className="font-black text-base text-[#064e3b]">
                  ৳ {toBanglaNum(selectedModalSlab.totalAmount.toLocaleString('bn-BD'))}/-
                </span>
              </div>

              <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                {selectedModalSlab.donors.map((donor, idx) => (
                  <div key={donor.id || idx} className="p-3.5 hover:bg-slate-50 transition flex items-center justify-between gap-3 text-xs sm:text-sm">
                    <div className="space-y-0.5">
                      <div className="font-extrabold text-[#064e3b] flex items-center space-x-1.5">
                        <span>{toBanglaNum(idx + 1)}.</span>
                        <span>{donor.donorName || 'বেনামী দাতা'}</span>
                      </div>
                      <div className="text-xs text-slate-500 flex items-center space-x-2">
                        <span>{donor.houseName || donor.category || 'সাধারণ চাঁদা'}</span>
                        {donor.receiptNo && (
                          <span className="text-[11px] font-mono bg-slate-100 text-slate-600 px-1 rounded">
                            রশিদ #{toBanglaNum(donor.receiptNo)}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-black text-slate-900">
                        ৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-
                      </div>
                      <div className="text-[11px] text-slate-400 font-mono">
                        {toBanglaDate(donor.date)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-slate-50 border-t border-slate-200 flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedModalSlab(null)}
                className="px-5 py-2 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-bold transition cursor-pointer"
              >
                বন্ধ করুন
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
