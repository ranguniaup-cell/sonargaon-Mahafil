import React from 'react';
import { Transaction } from '../types';
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Search,
  Filter,
  Printer,
  FileText,
  Download,
  X,
  Eye,
  Sparkles,
  BookOpen,
  Lock,
  KeyRound,
  AlertCircle,
  CheckCircle2,
  Building2,
  Coins,
  PlusCircle,
  ArrowUpRight,
  ArrowDownRight,
  Users,
  Layers,
  ShieldCheck,
  Check,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  Pencil,
  Trash2,
  FileSpreadsheet,
  Zap,
  Info,
  Home,
  ArrowRight
} from 'lucide-react';
import DonationReceiptModal from './DonationReceiptModal';
import AnnualLedgerReport from './AnnualLedgerReport';
import EditTransactionModal from './EditTransactionModal';
import ManualFinancialPostingModal from './ManualFinancialPostingModal';
import {
  isHouseCollection,
  getTransactionYear,
  sortTransactionsFIFO,
  isAutoUploadedTransaction,
  filterGeneralFinancialTransactions,
  GENERAL_INCOME_CATEGORIES,
  GENERAL_EXPENSE_CATEGORIES
} from '../lib/transactionUtils';

interface FinanceSectionProps {
  transactions: Transaction[];
  isAdminLoggedIn?: boolean;
  isFinancePublic?: boolean;
  onToggleFinancePublic?: (val: boolean) => void;
  setIsAdminLoggedIn?: (status: boolean) => void;
  onAddTransaction?: (newT: Omit<Transaction, 'id'>) => Promise<void> | void;
  onBatchAddTransactions?: (items: Omit<Transaction, 'id'>[]) => Promise<void> | void;
  onUpdateTransaction?: (updatedT: Transaction) => Promise<void> | void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  onNavigate?: (tab: string) => void;
}

type AccountingDivision = 'manual-ledger' | 'house-accounting' | 'audit-comparison';

// Helper for Bangla digits
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
};

// Helper for Gregorian date to Bangla string (১৫ই জুন, ২০২৬ইং)
const toBanglaDate = (dateStr: string): string => {
  if (!dateStr) return '';
  const months = [
    'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
    'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
  ];
  const parts = dateStr.split('-');
  if (parts.length !== 3) return dateStr;
  const year = toBanglaNum(parts[0]);
  const month = months[parseInt(parts[1], 10) - 1];
  const day = toBanglaNum(parseInt(parts[2], 10));
  return `${day}ই ${month}, ${year}ইং`;
};

export default function FinanceSection({
  transactions = [],
  isAdminLoggedIn = false,
  isFinancePublic = false,
  onToggleFinancePublic,
  setIsAdminLoggedIn,
  onAddTransaction,
  onBatchAddTransactions,
  onUpdateTransaction,
  onDeleteTransaction,
  onNavigate
}: FinanceSectionProps) {
  // Top-Level Division State
  const [activeDivision, setActiveDivision] = React.useState<AccountingDivision>('manual-ledger');
  const [selectedYear, setSelectedYear] = React.useState<string>('2026');

  // Manual Ledger filtering states
  const [manualSearchQuery, setManualSearchQuery] = React.useState('');
  const [manualFilterType, setManualFilterType] = React.useState<'all' | 'income' | 'expense' | 'auto' | 'manual'>('all');
  const [manualSelectedCategory, setManualSelectedCategory] = React.useState<string>('all');

  // House Accounting filtering & expand states
  const [houseSearchQuery, setHouseSearchQuery] = React.useState('');
  const [expandedHouse, setExpandedHouse] = React.useState<string | null>(null);

  // Modals state
  const [showDonationReceiptModal, setShowDonationReceiptModal] = React.useState(false);
  const [receiptModalData, setReceiptModalData] = React.useState<any>(null);

  const [showReportModal, setShowReportModal] = React.useState(false);
  const [reportModalYear, setReportModalYear] = React.useState<string>('2026');

  const [showManualPostingModal, setShowManualPostingModal] = React.useState(false);
  const [editingTransaction, setEditingTransaction] = React.useState<Transaction | null>(null);
  const [showEditModal, setShowEditModal] = React.useState(false);

  // Admin password gate for restricted report downloads
  const [showAdminAuthModal, setShowAdminAuthModal] = React.useState(false);
  const [adminPasswordInput, setAdminPasswordInput] = React.useState('');
  const [adminAuthError, setAdminAuthError] = React.useState('');
  const [pendingAuthAction, setPendingAuthAction] = React.useState<(() => void) | null>(null);

  const executeWithAdminAuth = (action: () => void) => {
    const isLogged = isAdminLoggedIn || sessionStorage.getItem('mahfil_admin_logged') === 'true';
    if (isLogged || isFinancePublic) {
      action();
    } else {
      setPendingAuthAction(() => action);
      setAdminPasswordInput('');
      setAdminAuthError('');
      setShowAdminAuthModal(true);
    }
  };

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'T@a546195') {
      sessionStorage.setItem('mahfil_admin_logged', 'true');
      if (setIsAdminLoggedIn) {
        setIsAdminLoggedIn(true);
      }
      setShowAdminAuthModal(false);
      setAdminPasswordInput('');
      setAdminAuthError('');
      if (pendingAuthAction) {
        pendingAuthAction();
        setPendingAuthAction(null);
      }
    } else {
      setAdminAuthError('পাসওয়ার্ড সঠিক নয়! শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিন হিসাব দেখতে বা অনুমোদন করতে পারবেন।');
    }
  };

  // ==========================================
  // DATA SEGREGATION (সম্পূর্ণ আলাদা দুইটি বিভাগ)
  // ==========================================

  // ১. ম্যানুয়াল আয়-ব্যয় লেনদেন (Strictly Central Vouchers / Manual Posting)
  const allManualTransactions = React.useMemo(() => {
    return transactions.filter((t) => !isHouseCollection(t));
  }, [transactions]);

  // ২. বাড়ি ভিত্তিক আয় ও চাঁদা লেনদেন (Strictly House-based Collections)
  const allHouseTransactions = React.useMemo(() => {
    return transactions.filter((t) => isHouseCollection(t));
  }, [transactions]);

  // Filter by selected year
  const yearManualTransactions = React.useMemo(() => {
    return allManualTransactions.filter((t) => {
      if (selectedYear === 'all') return true;
      return getTransactionYear(t).toString() === selectedYear;
    });
  }, [allManualTransactions, selectedYear]);

  const yearHouseTransactions = React.useMemo(() => {
    return allHouseTransactions.filter((t) => {
      if (selectedYear === 'all') return true;
      return getTransactionYear(t).toString() === selectedYear;
    });
  }, [allHouseTransactions, selectedYear]);

  // ==========================================
  // DIVISION 1: MANUAL FINANCIAL POSTING MATH
  // ==========================================
  const manualTotalIncome = React.useMemo(() => {
    return yearManualTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [yearManualTransactions]);

  const manualTotalExpense = React.useMemo(() => {
    return yearManualTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [yearManualTransactions]);

  const manualNetBalance = manualTotalIncome - manualTotalExpense;

  // Opening & Ending Carryover for Manual Central Fund
  const getManualCarryover = () => {
    if (selectedYear === 'all') {
      const allEnding = allManualTransactions.reduce((sum, t) => {
        if (getTransactionYear(t) >= 2023) {
          return sum + (t.type === 'income' ? t.amount : -t.amount);
        }
        return sum;
      }, 0);
      return { opening: 0, ending: allEnding };
    }

    const targetY = parseInt(selectedYear, 10);
    let opening = 0;
    allManualTransactions.forEach((t) => {
      const y = getTransactionYear(t);
      if (y < targetY && y >= 2023) {
        if (t.type === 'income') {
          opening += t.amount;
        } else {
          opening -= t.amount;
        }
      }
    });

    return {
      opening,
      ending: opening + manualNetBalance
    };
  };

  const { opening: manualOpeningBalance, ending: manualEndingBalance } = getManualCarryover();

  // Manual Expense Categories Grouping
  const manualExpenseBreakdown = React.useMemo(() => {
    const expenses = yearManualTransactions.filter((t) => t.type === 'expense');
    const groups: Record<string, number> = {};
    expenses.forEach((t) => {
      const cat = t.category || 'অন্যান্য খরচ';
      groups[cat] = (groups[cat] || 0) + t.amount;
    });
    return Object.entries(groups)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: manualTotalExpense > 0 ? Math.round((amount / manualTotalExpense) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [yearManualTransactions, manualTotalExpense]);

  // Manual Income Categories Grouping
  const manualIncomeBreakdown = React.useMemo(() => {
    const incomes = yearManualTransactions.filter((t) => t.type === 'income');
    const groups: Record<string, number> = {};
    incomes.forEach((t) => {
      const cat = t.category || 'সাধারণ অনুদান';
      groups[cat] = (groups[cat] || 0) + t.amount;
    });
    return Object.entries(groups)
      .map(([category, amount]) => ({
        category,
        amount,
        percentage: manualTotalIncome > 0 ? Math.round((amount / manualTotalIncome) * 1000) / 10 : 0
      }))
      .sort((a, b) => b.amount - a.amount);
  }, [yearManualTransactions, manualTotalIncome]);

  // Detailed Income Categories & Breakdown for selected year (specifically 2026 data visibility)
  const detailedIncomeCategoriesForYear = React.useMemo(() => {
    const incList = yearManualTransactions.filter((t) => t.type === 'income');
    const map: Record<string, { category: string; total: number; count: number; transactions: Transaction[] }> = {};

    incList.forEach((t) => {
      const cat = t.category?.trim() || 'অন্যান্য আয়';
      if (!map[cat]) {
        map[cat] = { category: cat, total: 0, count: 0, transactions: [] };
      }
      map[cat].total += t.amount;
      map[cat].count += 1;
      map[cat].transactions.push(t);
    });

    return Object.values(map)
      .map((item) => ({
        ...item,
        percentage: manualTotalIncome > 0 ? Math.round((item.total / manualTotalIncome) * 1000) / 10 : 0,
        transactions: sortTransactionsFIFO(item.transactions)
      }))
      .sort((a, b) => b.total - a.total);
  }, [yearManualTransactions, manualTotalIncome]);

  // Filtered Manual Transactions for table view - strictly sorted FIFO (প্রথমের পোস্টিং প্রথমে)
  const filteredManualTransactions = React.useMemo(() => {
    const list = yearManualTransactions.filter((t) => {
      if (manualFilterType === 'income' && t.type !== 'income') return false;
      if (manualFilterType === 'expense' && t.type !== 'expense') return false;
      if (manualFilterType === 'auto' && !isAutoUploadedTransaction(t)) return false;
      if (manualFilterType === 'manual' && isAutoUploadedTransaction(t)) return false;
      if (manualSelectedCategory !== 'all' && t.category !== manualSelectedCategory) return false;

      if (manualSearchQuery.trim()) {
        const q = manualSearchQuery.toLowerCase();
        const catMatch = (t.category || '').toLowerCase().includes(q);
        const donorMatch = (t.donorName || '').toLowerCase().includes(q);
        const descMatch = (t.description || '').toLowerCase().includes(q);
        const receiptMatch = (t.receiptNo || '').toLowerCase().includes(q);
        const byMatch = (t.recordedBy || '').toLowerCase().includes(q);
        if (!catMatch && !donorMatch && !descMatch && !receiptMatch && !byMatch) {
          return false;
        }
      }
      return true;
    });
    return sortTransactionsFIFO(list);
  }, [yearManualTransactions, manualFilterType, manualSelectedCategory, manualSearchQuery]);

  // Yearly summary list for manual central fund
  const manualYearlySummaryList = React.useMemo(() => {
    const years = [2023, 2024, 2025, 2026, 2027];
    let cumulative = 0;
    return years.map((y) => {
      const yrTrans = allManualTransactions.filter((t) => getTransactionYear(t) === y);
      const inc = yrTrans.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const exp = yrTrans.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = inc - exp;
      const opening = cumulative;
      const totalAvailable = opening + inc;
      cumulative += net;
      return {
        year: y,
        opening,
        income: inc,
        totalAvailable,
        expense: exp,
        net,
        cumulative
      };
    });
  }, [allManualTransactions]);

  // ==========================================
  // DIVISION 2: HOUSE ACCOUNTING MATH
  // ==========================================
  const houseTotalIncome = React.useMemo(() => {
    return yearHouseTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);
  }, [yearHouseTransactions]);

  // Group house transactions by house name
  const houseSummaryList = React.useMemo(() => {
    const map = new Map<
      string,
      {
        houseName: string;
        total: number;
        count: number;
        maxDonation: number;
        donors: Transaction[];
      }
    >();

    yearHouseTransactions.forEach((t) => {
      const h = (t.houseName && t.houseName.trim()) || 'অন্যান্য / সাধারণ কালেকশন';
      if (!map.has(h)) {
        map.set(h, {
          houseName: h,
          total: 0,
          count: 0,
          maxDonation: 0,
          donors: []
        });
      }
      const item = map.get(h)!;
      if (t.type === 'income') {
        item.total += t.amount;
        item.count += 1;
        if (t.amount > item.maxDonation) item.maxDonation = t.amount;
        item.donors.push(t);
      }
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [yearHouseTransactions]);

  const activeHousesCount = houseSummaryList.filter((h) => h.total > 0).length;
  const totalHouseDonorsCount = houseSummaryList.reduce((sum, h) => sum + h.count, 0);
  const topHouse = houseSummaryList[0] || null;

  // Filtered houses list for search
  const filteredHouseList = React.useMemo(() => {
    if (!houseSearchQuery.trim()) return houseSummaryList;
    const q = houseSearchQuery.toLowerCase();
    return houseSummaryList.filter((h) => {
      const nameMatch = h.houseName.toLowerCase().includes(q);
      const donorMatch = h.donors.some(
        (d) =>
          (d.donorName || '').toLowerCase().includes(q) ||
          (d.receiptNo || '').toLowerCase().includes(q)
      );
      return nameMatch || donorMatch;
    });
  }, [houseSummaryList, houseSearchQuery]);

  // Export functions
  const exportManualToCSV = () => {
    const headers = ['তারিখ,ধরন,খাত,দাতার নাম/বিবরণ,ভাউচার/রশিদ নং,টাকা,উৎস,এন্ট্রি কারী\n'];
    const rows = filteredManualTransactions.map((t) => {
      const typeLabel = t.type === 'income' ? 'আয়' : 'ব্যয়';
      const details = t.type === 'income' ? t.donorName || '' : t.description || '';
      const sourceLabel = isAutoUploadedTransaction(t) ? 'অটো আপলোড' : 'ম্যানুয়াল';
      return `"${t.date}","${typeLabel}","${t.category}","${details.replace(/"/g, '""')}","${t.receiptNo || ''}",${t.amount},"${sourceLabel}","${t.recordedBy}"\n`;
    });

    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('')], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Manual_Finance_Ledger_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportHouseToCSV = () => {
    const headers = ['বাড়ির নাম,দাতার নাম,রশিদ নং,তারিখ,টাকা,এন্ট্রি কারী\n'];
    const rows: string[] = [];
    houseSummaryList.forEach((h) => {
      h.donors.forEach((d) => {
        rows.push(`"${h.houseName}","${(d.donorName || '').replace(/"/g, '""')}","${d.receiptNo || ''}","${d.date}",${d.amount},"${d.recordedBy}"\n`);
      });
    });

    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('')], {
      type: 'text/csv;charset=utf-8;'
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `House_Collections_${selectedYear}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div id="finance-section" className="space-y-8 pb-16 animate-fade-in print:p-0 text-[#3c3c3c]">
      {/* Title & Organization Header */}
      <div className="text-center max-w-3xl mx-auto space-y-2 print:hidden">
        <span className="text-xs sm:text-sm font-bold tracking-wider text-[#0f766e] uppercase bg-[#0f766e]/10 px-3.5 py-1 rounded-full border border-[#cbd5e1]">
          আর্থিক ব্যবস্থাপনা ও রিয়েল-টাইম খতিয়ান কেন্দ্র
        </span>
        <h2 className="text-2xl sm:text-3xl font-black text-[#064e3b] tracking-tight">
          তহবিল ও আয়-ব্যয় অডিট বিভাগ
        </h2>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#d97706] to-transparent mx-auto mt-2"></div>
        <p className="text-[#3c3c3c]/80 text-xs sm:text-sm leading-relaxed font-light pt-1">
          হিসাবের শতভাগ স্বচ্ছতা বজায় রাখতে পরিষদের <b>কেন্দ্রীয় ম্যানুয়াল আয়-ব্যয় পোস্টিং</b> এবং <b>পাড়া/বাড়ি ভিত্তিক চাঁদা কালেকশন</b> সম্পূর্ণ আলাদা দুইটি স্বতন্ত্র বিভাগে হিসাবায়ন করা হয়েছে।
        </p>
      </div>

      {/* Admin Quick Visibility Control Banner */}
      {isAdminLoggedIn && (
        <div className="bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white p-4 sm:p-5 rounded-2xl shadow-md flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border border-emerald-700 print:hidden">
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${isFinancePublic ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'}`}>
              {isFinancePublic ? <CheckCircle2 className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">পাবলিক ভিজিবিলিটি স্ট্যাটাস</span>
                <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${isFinancePublic ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-950 font-extrabold'}`}>
                  {isFinancePublic ? '🟢 সবার জন্য উন্মুক্ত (Public Approved)' : '🔒 অ্যাডমিন সংরক্ষিত (Restricted)'}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-light mt-0.5">
                {isFinancePublic
                  ? 'বর্তমানে সর্বসাধারণ যেকোনো সময় এই হিসাব ও খতিয়ান দেখতে ও ডাউনলোড করতে পারছে।'
                  : 'সাধারণ দর্শকরা এই হিসাব দেখতে পাচ্ছে না। অনুমোদন দিলে সবার জন্য উন্মুক্ত হবে।'}
              </p>
            </div>
          </div>
          {onToggleFinancePublic && (
            <button
              id="admin-toggle-finance-public-btn"
              type="button"
              onClick={() => onToggleFinancePublic(!isFinancePublic)}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-sm transition cursor-pointer flex items-center space-x-2 shrink-0 ${
                isFinancePublic
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
              }`}
            >
              {isFinancePublic ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>অপ্রকাশিত / প্রাইভেট করুন</span>
                </>
              ) : (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  <span>অনুমোদন দিন ও পাবলিক করুন</span>
                </>
              )}
            </button>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* 🌟 CRITICAL USER DIRECTIVE: দুইটা হিসাব পদ্ধতি আলাদা বিভাগে হিসাবে দেখাবেন 🌟 */}
      {/* ========================================================================= */}
      <div className="bg-white border-2 border-[#cbd5e1] rounded-3xl p-3 sm:p-4 shadow-sm space-y-3 print:hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center space-x-2">
            <span className="p-2 bg-[#0f766e]/10 text-[#0f766e] rounded-xl">
              <Layers className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#064e3b]">
                হিসাব পদ্ধতি ও বিভাগ নির্বাচন (Accounting Divisions)
              </h3>
              <p className="text-[11px] text-gray-500 font-medium">
                হিসাবের নির্ভুলতা নিশ্চিত করতে কেন্দ্রীয় লেজার ও বাড়ি কালেকশন সম্পূর্ণ আলাদাভাবে পরিচালিত হচ্ছে
              </p>
            </div>
          </div>

          {/* Year Filter Dropdown */}
          <div className="flex items-center space-x-2 w-full md:w-auto">
            <span className="text-xs font-bold text-gray-600 whitespace-nowrap">অর্থবছর:</span>
            <select
              id="global-finance-year-filter"
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="flex-1 md:flex-none px-3.5 py-2 bg-[#f8fafc] border-2 border-[#0f766e]/30 rounded-xl text-xs sm:text-sm font-bold text-[#064e3b] focus:outline-none focus:border-[#0f766e] cursor-pointer"
            >
              <option value="2027">২০২৭ খ্রি. অর্থবছর</option>
              <option value="2026">২০২৬ খ্রি. অর্থবছর</option>
              <option value="2025">২০২৫ খ্রি. অর্থবছর</option>
              <option value="2024">২০২৪ খ্রি. অর্থবছর</option>
              <option value="2023">২০২৩ খ্রি. অর্থবছর</option>
              <option value="all">সর্বকালীন হিসাব (২০২৩-বর্তমান)</option>
            </select>
          </div>
        </div>

        {/* Division Selector Tabs */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
          {/* Division 1: Manual Central Ledger */}
          <button
            type="button"
            id="division-tab-manual-ledger"
            onClick={() => setActiveDivision('manual-ledger')}
            className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative ${
              activeDivision === 'manual-ledger'
                ? 'bg-[#0f766e] text-white border-[#064e3b] shadow-md scale-[1.01]'
                : 'bg-[#f8fafc] hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center space-x-1.5 font-black text-xs sm:text-sm">
                <FileSpreadsheet className={`h-4 w-4 ${activeDivision === 'manual-ledger' ? 'text-amber-300' : 'text-[#0f766e]'}`} />
                <span>বিভাগ ১: ম্যানুয়াল আয়-ব্যয় পোস্টিং</span>
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeDivision === 'manual-ledger' ? 'bg-white/20 text-white' : 'bg-emerald-100 text-emerald-900'
              }`}>
                কেন্দ্রীয় লেজার
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed font-light ${activeDivision === 'manual-ledger' ? 'text-emerald-50' : 'text-gray-500'}`}>
              কেন্দ্রীয় সাধারণ আয়, দান এবং মাহফিলের কেন্দ্রীয় খরচ (মঞ্চ, মাইক, অতিথি হাদিয়া, তাবাররুক ইত্যাদি ভাউচার)।
            </p>
          </button>

          {/* Division 2: House-based Accounting */}
          <button
            type="button"
            id="division-tab-house-accounting"
            onClick={() => setActiveDivision('house-accounting')}
            className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative ${
              activeDivision === 'house-accounting'
                ? 'bg-[#064e3b] text-white border-[#064e3b] shadow-md scale-[1.01]'
                : 'bg-[#f8fafc] hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center space-x-1.5 font-black text-xs sm:text-sm">
                <Building2 className={`h-4 w-4 ${activeDivision === 'house-accounting' ? 'text-amber-300' : 'text-[#064e3b]'}`} />
                <span>বিভাগ ২: বাড়ি ভিত্তিক আয়-ব্যয়ের হিসাব</span>
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeDivision === 'house-accounting' ? 'bg-white/20 text-white' : 'bg-amber-100 text-amber-900'
              }`}>
                পাড়া চাঁদা কালেকশন
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed font-light ${activeDivision === 'house-accounting' ? 'text-emerald-50' : 'text-gray-500'}`}>
              গ্রামের প্রতিটি বাড়ি (যেমন বৈদ্য বাড়ী, সওদাগর বাড়ী) ও পরিবারসমূহের নিকট থেকে উত্তোলিত চাঁদা ও দাতার তালিকা।
            </p>
          </button>

          {/* Division 3: Comparative Overview */}
          <button
            type="button"
            id="division-tab-audit-comparison"
            onClick={() => setActiveDivision('audit-comparison')}
            className={`p-3.5 rounded-2xl text-left transition-all border cursor-pointer relative ${
              activeDivision === 'audit-comparison'
                ? 'bg-[#d97706] text-white border-[#b45309] shadow-md scale-[1.01]'
                : 'bg-[#f8fafc] hover:bg-slate-100 text-slate-800 border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className="inline-flex items-center space-x-1.5 font-black text-xs sm:text-sm">
                <ShieldCheck className={`h-4 w-4 ${activeDivision === 'audit-comparison' ? 'text-white' : 'text-[#d97706]'}`} />
                <span>বিভাগ ৩: তুলনামূলক ও অডিট সারসংক্ষেপ</span>
              </span>
              <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded-full ${
                activeDivision === 'audit-comparison' ? 'bg-white/20 text-white' : 'bg-blue-100 text-blue-900'
              }`}>
                স্বচ্ছতা চিত্র
              </span>
            </div>
            <p className={`text-[11px] leading-relaxed font-light ${activeDivision === 'audit-comparison' ? 'text-amber-50' : 'text-gray-500'}`}>
              উভয় হিসাব পদ্ধতির পৃথক কলাম ও চার্ট পাশাপাশি পরিদর্শন এবং হিসাবনীতির আনুষ্ঠানিক নিরীক্ষা নোট।
            </p>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* RENDER DIVISION 1: MANUAL CENTRAL LEDGER & FINANCIAL POSTINGS            */}
      {/* ========================================================================= */}
      {activeDivision === 'manual-ledger' && (
        <div className="space-y-6 animate-fade-in">
          {/* Informational Division Banner */}
          <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3">
              <span className="p-2 bg-emerald-100 text-[#0f766e] rounded-xl shrink-0 mt-0.5">
                <FileSpreadsheet className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-[#064e3b]">
                  বিভাগ ১: কেন্দ্রীয় ম্যানুয়াল আয়-ব্যয় লেজার ও ভাউচার বিল
                </h4>
                <p className="text-[11px] text-gray-600 font-light leading-relaxed">
                  এই বিভাগে শুধুমাত্র কেন্দ্রীয় পরিচালন আয় ও ব্যয় প্রদর্শিত হচ্ছে। কোনো বাড়ি ভিত্তিক ব্যক্তি চাঁদা এই হিসাবে অন্তর্ভুক্ত করা হয়নি, যাতে কেন্দ্রীয় তহবিলের সঠিক হিসাব অক্ষুণ্ণ থাকে।
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              <button
                type="button"
                id="open-manual-posting-modal-btn"
                onClick={() => setShowManualPostingModal(true)}
                className="px-3.5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              >
                <PlusCircle className="h-4 w-4 text-amber-300" />
                <span>+ নতুন ভাউচার পোস্টিং</span>
              </button>

              {onNavigate && (
                <button
                  type="button"
                  onClick={() => onNavigate('posting')}
                  className="px-3 py-2 bg-white hover:bg-slate-100 text-[#064e3b] border border-[#cbd5e1] rounded-xl text-xs font-bold shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <span>পোস্টিং পেজ</span>
                  <ExternalLink className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Division 1 Summary Cards (Manual Central Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total Manual Income */}
            <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between group">
              <div className="space-y-1.5 flex-1 mr-2">
                <span className="text-[#0f766e] text-xs font-semibold tracking-wide flex items-center gap-1">
                  <TrendingUp className="h-3.5 w-3.5 text-[#0f766e]" />
                  <span>{selectedYear === 'all' ? 'কেন্দ্রীয় সর্বমোট সংগৃহীত আয়' : `${toBanglaNum(selectedYear)} খ্রি. কেন্দ্রীয় মোট আয়`}</span>
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#064e3b] flex items-center">
                  <span className="text-[#d97706] mr-1">৳</span>
                  <span>{toBanglaNum(manualTotalIncome.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  সাধারণ অনুদান, সদস্য চাঁদা, রশিদ বই ও কেন্দ্রীয় প্রাপ্তি
                </div>
              </div>
              <div className="h-11 w-11 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-[#0f766e] group-hover:scale-105 transition shrink-0">
                <TrendingUp className="h-5 w-5" />
              </div>
            </div>

            {/* Total Manual Expense */}
            <div className="bg-white border-l-4 border-l-red-600 border border-[#cbd5e1] rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between group">
              <div className="space-y-1.5 flex-1 mr-2">
                <span className="text-red-700 text-xs font-semibold tracking-wide flex items-center gap-1">
                  <TrendingDown className="h-3.5 w-3.5 text-red-600" />
                  <span>{selectedYear === 'all' ? 'কেন্দ্রীয় সর্বমোট ব্যয়' : `${toBanglaNum(selectedYear)} খ্রি. কেন্দ্রীয় মোট ব্যয়`}</span>
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#064e3b] flex items-center">
                  <span className="text-[#d97706] mr-1">৳</span>
                  <span>{toBanglaNum(manualTotalExpense.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  মঞ্চ, তাবাররুক, মাইক, বক্তা হাদিয়া ও ডেকোরেশন খরচ
                </div>
              </div>
              <div className="h-11 w-11 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center text-red-600 group-hover:scale-105 transition shrink-0">
                <TrendingDown className="h-5 w-5" />
              </div>
            </div>

            {/* Net Balance (Closing Cash in Hand for Central Manual Fund) */}
            <div className="bg-[#064e3b] text-[#f8fafc] border-2 border-[#d97706] rounded-2xl p-5 shadow-md relative overflow-hidden flex items-center justify-between group sm:col-span-1">
              <div className="space-y-1.5 flex-1 mr-2">
                <span className="text-amber-300 text-xs font-bold tracking-wide flex items-center gap-1">
                  <DollarSign className="h-3.5 w-3.5 text-amber-300" />
                  <span>{selectedYear === 'all' ? 'কেন্দ্রীয় উদ্বৃত্ত তহবিল' : `${toBanglaNum(selectedYear)} খ্রি. কেন্দ্রীয় সমাপনী হাতে নগদ`}</span>
                </span>
                <div className={`text-2xl sm:text-3xl font-black flex items-center ${manualEndingBalance >= 0 ? 'text-[#f8fafc]' : 'text-red-300'}`}>
                  <span className="text-[#d97706] mr-1">৳</span>
                  <span>{toBanglaNum(manualEndingBalance.toLocaleString('bn-BD'))}</span>
                </div>
                {selectedYear !== 'all' ? (
                  <div className="text-[10px] text-slate-200 space-y-0.5 bg-black/20 p-1.5 rounded-lg border border-white/10">
                    <div className="flex justify-between">
                      <span>প্রারম্ভিক উদ্বৃত্ত:</span>
                      <span className="font-mono font-bold">৳ {toBanglaNum(manualOpeningBalance.toLocaleString('bn-BD'))}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>চলতি নিট স্থিতি:</span>
                      <span className="font-mono font-bold">
                        {manualNetBalance >= 0 ? '+' : '-'} ৳ {toBanglaNum(Math.abs(manualNetBalance).toLocaleString('bn-BD'))}
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="text-[10px] text-amber-200/90 flex items-center space-x-1">
                    <span className="h-1.5 w-1.5 bg-[#d97706] rounded-full animate-pulse"></span>
                    <span>২০২৩ হতে বর্তমান কেন্দ্রীয় তহবিল স্থিতি</span>
                  </div>
                )}
              </div>
              <div className="h-11 w-11 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-amber-300 shrink-0">
                <Coins className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* Central Expense & Income Categories Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Expense Breakdown */}
            <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-[#064e3b] flex items-center gap-1.5">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span>কেন্দ্রীয় ব্যয়ের খাতভিত্তিক হিসাব ({toBanglaNum(selectedYear === 'all' ? 'সর্বকালীন' : selectedYear)})</span>
                </h4>
                <span className="text-[11px] font-mono font-bold text-red-700">
                  মোট: ৳{toBanglaNum(manualTotalExpense.toLocaleString('bn-BD'))}
                </span>
              </div>

              {manualExpenseBreakdown.length > 0 ? (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {manualExpenseBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-700">
                        <span className="font-semibold">{item.category}</span>
                        <div className="space-x-1.5 font-mono">
                          <span className="font-bold text-red-700">৳{toBanglaNum(item.amount.toLocaleString('bn-BD'))}</span>
                          <span className="text-gray-400 text-[10px]">({toBanglaNum(item.percentage)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-red-600 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">কোনো কেন্দ্রীয় ব্যয়ের রেকর্ড পাওয়া যায়নি।</p>
              )}
            </div>

            {/* Income Breakdown */}
            <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-200 pb-2.5">
                <h4 className="text-xs sm:text-sm font-extrabold text-[#064e3b] flex items-center gap-1.5">
                  <TrendingUp className="h-4 w-4 text-[#0f766e]" />
                  <span>কেন্দ্রীয় আয়ের খাতভিত্তিক হিসাব ({toBanglaNum(selectedYear === 'all' ? 'সর্বকালীন' : selectedYear)})</span>
                </h4>
                <span className="text-[11px] font-mono font-bold text-[#0f766e]">
                  মোট: ৳{toBanglaNum(manualTotalIncome.toLocaleString('bn-BD'))}
                </span>
              </div>

              {manualIncomeBreakdown.length > 0 ? (
                <div className="space-y-2.5 max-h-96 overflow-y-auto pr-1">
                  {manualIncomeBreakdown.map((item) => (
                    <div key={item.category} className="space-y-1">
                      <div className="flex justify-between text-xs text-gray-700">
                        <span className="font-semibold">{item.category}</span>
                        <div className="space-x-1.5 font-mono">
                          <span className="font-bold text-[#0f766e]">৳{toBanglaNum(item.amount.toLocaleString('bn-BD'))}</span>
                          <span className="text-gray-400 text-[10px]">({toBanglaNum(item.percentage)}%)</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-[#0f766e] rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(item.percentage, 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-gray-500 py-6 text-center">কোনো কেন্দ্রীয় আয়ের রেকর্ড পাওয়া যায়নি।</p>
              )}
            </div>
          </div>

          {/* Dedicated Section: আয়ের সকল খাতের পূর্ণাঙ্গ চিত্র ও পোস্টিং */}
          {(selectedYear === '2027' || selectedYear === '2026' || selectedYear === 'all') && (
            <div className="bg-white border-2 border-[#0f766e]/30 rounded-2xl p-5 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-3">
                <div className="flex items-center gap-2">
                  <span className="p-2 bg-emerald-100 text-[#0f766e] rounded-xl shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm sm:text-base font-black text-[#064e3b]">
                        {selectedYear === 'all' ? 'সর্বকালীন' : `${toBanglaNum(selectedYear)}`} সালের সকল আয়ের খাতের বিস্তারিত পোস্ট তালিকা
                      </h4>
                      <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 rounded-full">
                        📌 মোট {toBanglaNum(detailedIncomeCategoriesForYear.length)}টি খাতের পোস্টিং
                      </span>
                    </div>
                    <p className="text-[11px] text-gray-500 font-light mt-0.5">
                      পোস্টকৃত সকল আয়ের খাত নিচে আলাদা কার্ডে প্রদর্শিত হচ্ছে। কোনো খাত বাদ পড়েনি।
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      setManualFilterType('income');
                      setManualSelectedCategory('all');
                    }}
                    className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-200 rounded-xl text-xs font-bold transition cursor-pointer"
                  >
                    সকল আয়ের ভাউচার দেখুন
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowManualPostingModal(true)}
                    className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-amber-300" />
                    <span>+ নতুন খাত পোস্ট</span>
                  </button>
                </div>
              </div>

              {detailedIncomeCategoriesForYear.length > 0 ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {detailedIncomeCategoriesForYear.map((catItem) => {
                    const isFiltered = manualSelectedCategory === catItem.category;
                    return (
                      <div
                        key={catItem.category}
                        className={`rounded-xl p-3.5 border transition-all ${
                          isFiltered
                            ? 'bg-emerald-50 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                            : 'bg-slate-50 hover:bg-slate-100/80 border-slate-200'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-xs font-extrabold text-[#064e3b] leading-snug">
                            {catItem.category}
                          </span>
                          <span className="text-[10px] bg-white border border-slate-200 text-gray-600 font-mono font-bold px-1.5 py-0.5 rounded shrink-0">
                            {toBanglaNum(catItem.count)}টি পোস্টিং
                          </span>
                        </div>

                        <div className="flex items-baseline justify-between pt-1 border-t border-slate-200/60">
                          <span className="text-sm sm:text-base font-black text-[#0f766e] font-mono">
                            ৳{toBanglaNum(catItem.total.toLocaleString('bn-BD'))}
                          </span>
                          <span className="text-[10px] text-gray-500 font-bold">
                            {toBanglaNum(catItem.percentage)}%
                          </span>
                        </div>

                        <div className="mt-2.5 pt-2 border-t border-slate-200/80 flex items-center justify-between">
                          <button
                            type="button"
                            onClick={() => {
                              if (isFiltered) {
                                setManualSelectedCategory('all');
                              } else {
                                setManualSelectedCategory(catItem.category);
                                setManualFilterType('income');
                              }
                            }}
                            className={`text-[11px] font-bold px-2 py-1 rounded-lg transition cursor-pointer flex items-center gap-1 ${
                              isFiltered
                                ? 'bg-emerald-700 text-white'
                                : 'bg-white hover:bg-emerald-50 text-[#0f766e] border border-emerald-200'
                            }`}
                          >
                            <span>{isFiltered ? 'ফিল্টার বাতিল' : 'ভাউচারগুলো ফিল্টার করুন'}</span>
                            <ArrowRight className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="py-8 text-center bg-slate-50 rounded-xl border border-dashed border-slate-300">
                  <p className="text-xs text-gray-500 font-medium">
                    {toBanglaNum(selectedYear === 'all' ? 'সর্বকালীন' : '২০২৬')} সালের জন্য এখনও কোনো আয়ের খাত পোস্টিং করা হয়নি।
                  </p>
                  <button
                    type="button"
                    onClick={() => setShowManualPostingModal(true)}
                    className="mt-3 px-4 py-2 bg-[#0f766e] text-white text-xs font-bold rounded-xl hover:bg-[#0d9488] transition inline-flex items-center gap-1.5 shadow-sm cursor-pointer"
                  >
                    <PlusCircle className="h-4 w-4 text-amber-300" />
                    <span>২০২৬ সালের আয়ের খাত পোস্টিং শুরু করুন</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Central Timeline Summary (২০২৩-বর্তমান) */}
          <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div>
                <h4 className="text-xs sm:text-sm font-black text-[#064e3b] flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#0f766e]" />
                  <span>কেন্দ্রীয় তহবিল প্রবাহ টাইমলাইন (২০২৩ হতে বর্তমান)</span>
                </h4>
                <p className="text-[11px] text-gray-500 font-light">
                  শুধুমাত্র কেন্দ্রীয় আয়-ব্যয় ভাউচারের বছরভিত্তিক স্থিতি স্থানান্তর
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {manualYearlySummaryList.map((summary) => (
                <div key={summary.year} className="bg-[#f8fafc] border border-slate-200 rounded-xl p-3 space-y-2">
                  <div className="flex justify-between items-center border-b border-slate-200 pb-1">
                    <span className="text-xs font-bold text-[#064e3b]">{toBanglaNum(summary.year)} অর্থবছর</span>
                    <span className="text-[10px] bg-emerald-100 text-emerald-900 font-bold px-1.5 py-0.5 rounded-md">
                      ভাউচার হিসাব
                    </span>
                  </div>
                  <div className="text-[11px] space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>প্রারম্ভিক:</span>
                      <span className="font-mono font-bold">৳{toBanglaNum(summary.opening.toLocaleString('bn-BD'))}</span>
                    </div>
                    <div className="flex justify-between text-[#0f766e]">
                      <span>আয়:</span>
                      <span className="font-mono font-bold">+৳{toBanglaNum(summary.income.toLocaleString('bn-BD'))}</span>
                    </div>
                    <div className="flex justify-between text-red-600">
                      <span>ব্যয়:</span>
                      <span className="font-mono font-bold">-৳{toBanglaNum(summary.expense.toLocaleString('bn-BD'))}</span>
                    </div>
                    <div className="flex justify-between pt-1 border-t border-dashed border-slate-200 font-bold text-[#064e3b]">
                      <span>সমাপনী স্থিতি:</span>
                      <span className="font-mono text-[#0f766e]">৳{toBanglaNum(summary.cumulative.toLocaleString('bn-BD'))}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Central Ledger Table with Search & Filter */}
          <section className="bg-white border border-[#cbd5e1] rounded-2xl shadow-xs overflow-hidden">
            <div className="p-4 sm:p-5 bg-[#f8fafc] border-b border-[#cbd5e1] space-y-3">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2.5">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm sm:text-base font-extrabold text-[#064e3b]">
                      কেন্দ্রীয় ম্যানুয়াল ভাউচার ও আয়-ব্যয় তালিকা
                    </h3>
                    <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-800 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                      📌 প্রথমের পোস্টিং প্রথমে (FIFO ক্রম)
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-500 font-medium">
                    মোট প্রদর্শিত ভাউচার: {toBanglaNum(filteredManualTransactions.length)} টি (বাড়ি ভিত্তিক চাঁদা আলাদা)
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={exportManualToCSV}
                    className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] rounded-lg text-xs font-bold text-[#064e3b] shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Download className="h-3.5 w-3.5 text-[#0f766e]" />
                    <span>CSV ডাউনলোড</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      executeWithAdminAuth(() => {
                        setReportModalYear(selectedYear);
                        setShowReportModal(true);
                      });
                    }}
                    className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-lg text-xs font-bold shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5" />
                    <span>PDF ও প্রিন্ট ভিউ</span>
                  </button>
                </div>
              </div>

              {/* Filters row */}
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 pt-1">
                {/* Search */}
                <div className="sm:col-span-4 relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="খাত, বিবরণ, দাতা বা ভাউচার নং..."
                    value={manualSearchQuery}
                    onChange={(e) => setManualSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                {/* Type buttons */}
                <div className="sm:col-span-5 flex rounded-xl bg-slate-200/70 p-0.5">
                  <button
                    type="button"
                    onClick={() => setManualFilterType('all')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                      manualFilterType === 'all' ? 'bg-[#0f766e] text-white shadow-2xs' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    সকল
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualFilterType('income')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                      manualFilterType === 'income' ? 'bg-[#064e3b] text-white shadow-2xs' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    আয়
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualFilterType('expense')}
                    className={`flex-1 py-1 rounded-lg text-xs font-bold transition ${
                      manualFilterType === 'expense' ? 'bg-red-600 text-white shadow-2xs' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    ব্যয়
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualFilterType('manual')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                      manualFilterType === 'manual' ? 'bg-amber-600 text-white shadow-2xs' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    ✏️ ম্যানুয়াল
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualFilterType('auto')}
                    className={`flex-1 py-1 rounded-lg text-[11px] font-bold transition ${
                      manualFilterType === 'auto' ? 'bg-indigo-600 text-white shadow-2xs' : 'text-gray-700 hover:text-black'
                    }`}
                  >
                    ⚡ অটো
                  </button>
                </div>

                {/* Category select */}
                <div className="sm:col-span-3">
                  <select
                    value={manualSelectedCategory}
                    onChange={(e) => setManualSelectedCategory(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#0f766e] cursor-pointer"
                  >
                    <option value="all">সকল খাত (All)</option>
                    {Array.from(new Set(yearManualTransactions.map((t) => t.category).filter(Boolean))).map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-[#cbd5e1] text-xs">
                <thead className="bg-[#f1f5f9]">
                  <tr>
                    <th scope="col" className="px-2.5 py-2.5 text-center font-bold text-[#064e3b] w-12">ক্রম</th>
                    <th scope="col" className="px-3.5 py-2.5 text-left font-bold text-[#064e3b]">তারিখ</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-bold text-[#064e3b]">ভাউচার/রশিদ</th>
                    <th scope="col" className="px-3.5 py-2.5 text-left font-bold text-[#064e3b]">খাত</th>
                    <th scope="col" className="px-3.5 py-2.5 text-left font-bold text-[#064e3b]">বিবরণ / দাতার নাম</th>
                    <th scope="col" className="px-2.5 py-2.5 text-center font-bold text-[#064e3b]">উৎস</th>
                    <th scope="col" className="px-2.5 py-2.5 text-center font-bold text-[#064e3b]">ধরন</th>
                    <th scope="col" className="px-3.5 py-2.5 text-right font-bold text-[#064e3b]">টাকা</th>
                    <th scope="col" className="px-3 py-2.5 text-center font-bold text-[#064e3b] print:hidden">অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0] bg-white">
                  {filteredManualTransactions.length > 0 ? (
                    filteredManualTransactions.map((t, idx) => {
                      const isAuto = isAutoUploadedTransaction(t);
                      return (
                        <tr key={t.id} className="hover:bg-[#f1f5f9]/60 transition">
                          <td className="px-2.5 py-2.5 whitespace-nowrap text-center font-mono font-bold text-gray-500">
                            {toBanglaNum(idx + 1)}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap text-gray-700">{toBanglaDate(t.date)}</td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center font-mono font-bold text-[#0f766e]">
                            {t.receiptNo ? toBanglaNum(t.receiptNo) : '—'}
                          </td>
                          <td className="px-3.5 py-2.5 whitespace-nowrap">
                            <span className="font-bold text-[#064e3b]">{t.category || 'অন্যান্য'}</span>
                          </td>
                          <td className="px-3.5 py-2.5 max-w-xs truncate text-gray-800">
                            {t.type === 'income' ? t.donorName || '-' : t.description || '-'}
                          </td>
                          <td className="px-2.5 py-2.5 whitespace-nowrap text-center">
                            {isAuto ? (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                                <Zap className="h-2.5 w-2.5" />
                                <span>অটো</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                                <Pencil className="h-2.5 w-2.5" />
                                <span>ম্যানুয়াল</span>
                              </span>
                            )}
                          </td>
                          <td className="px-2.5 py-2.5 whitespace-nowrap text-center">
                            <span
                              className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-extrabold ${
                                t.type === 'income'
                                  ? 'bg-[#0f766e]/10 text-[#0f766e]'
                                  : 'bg-red-100 text-red-700'
                              }`}
                            >
                              {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                            </span>
                          </td>
                          <td
                            className={`px-3.5 py-2.5 whitespace-nowrap text-right font-black font-mono ${
                              t.type === 'income' ? 'text-[#0f766e]' : 'text-red-700'
                            }`}
                          >
                            {t.type === 'income' ? '+' : '-'} {toBanglaNum(t.amount.toLocaleString('bn-BD'))} ৳
                          </td>
                          <td className="px-3 py-2.5 whitespace-nowrap text-center print:hidden">
                            <div className="flex items-center justify-center space-x-1">
                              <button
                                type="button"
                                onClick={() => {
                                  setReceiptModalData(t);
                                  setShowDonationReceiptModal(true);
                                }}
                                className="p-1 hover:bg-slate-100 rounded text-[#0f766e] transition cursor-pointer"
                                title="রশিদ প্রিভিউ"
                              >
                                <Eye className="h-3.5 w-3.5" />
                              </button>

                              {isAdminLoggedIn && (
                                <>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      setEditingTransaction(t);
                                      setShowEditModal(true);
                                    }}
                                    className="p-1 hover:bg-amber-50 rounded text-amber-700 transition cursor-pointer"
                                    title="এডিট করুন"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>

                                  {onDeleteTransaction && (
                                    <button
                                      type="button"
                                      onClick={async () => {
                                        if (confirm(`আপনি কি এই লেনদেনটি (${t.category} - ৳${t.amount}) মুছে ফেলতে চান?`)) {
                                          await onDeleteTransaction(t.id);
                                        }
                                      }}
                                      className="p-1 hover:bg-red-50 rounded text-red-600 transition cursor-pointer"
                                      title="ডিলিট করুন"
                                    >
                                      <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td colSpan={8} className="px-4 py-8 text-center text-gray-400 text-xs">
                        কোনো ম্যানুয়াল ভাউচার বা লেনদেন পাওয়া যায়নি।
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Footer Total */}
            <div className="p-3.5 bg-[#f8fafc] text-xs font-bold border-t border-[#cbd5e1] flex justify-between items-center text-gray-700">
              <span>প্রদর্শিত রেকর্ড: {toBanglaNum(filteredManualTransactions.length)} টি</span>
              <span className="text-[#064e3b]">
                নিট চলতি ব্যালেন্স: <span className={manualNetBalance >= 0 ? 'text-[#0f766e]' : 'text-red-700 font-bold'}>৳ {toBanglaNum(manualNetBalance.toLocaleString('bn-BD'))}</span>
              </span>
            </div>
          </section>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RENDER DIVISION 2: HOUSE-WISE INCOME & COLLECTION ACCOUNTS               */}
      {/* ========================================================================= */}
      {activeDivision === 'house-accounting' && (
        <div className="space-y-6 animate-fade-in">
          {/* Informational Division Banner */}
          <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-start space-x-3">
              <span className="p-2 bg-amber-100 text-amber-900 rounded-xl shrink-0 mt-0.5">
                <Building2 className="h-5 w-5" />
              </span>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-amber-950">
                  বিভাগ ২: বাড়ি ভিত্তিক আয় ও চাঁদা কালেকশন হিসাব
                </h4>
                <p className="text-[11px] text-amber-900/80 font-light leading-relaxed">
                  গ্রামের প্রতিটি বাড়ি ও পরিবারের ব্যক্তিকেন্দ্রিক চাঁদা আদায়ের বিস্তারিত খতিয়ান। কেন্দ্রীয় মঞ্চ, প্রচার বা অতিথি খরচের হিসাব এই বিভাগে অন্তর্ভুক্ত নয়—তা সম্পূর্ণ আলাদাভাবে বিভাগ ১-এ সংরক্ষিত।
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onNavigate && (
                <>
                  <button
                    type="button"
                    onClick={() => onNavigate('house-report')}
                    className="px-3 py-2 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-bold shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <Printer className="h-3.5 w-3.5 text-amber-300" />
                    <span>বাড়ি রিপোর্ট ও কালেকশন শিট</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onNavigate('house-donations')}
                    className="px-3 py-2 bg-white hover:bg-slate-100 text-amber-950 border border-amber-300 rounded-xl text-xs font-bold shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                  >
                    <PlusCircle className="h-3.5 w-3.5 text-amber-700" />
                    <span>বাড়ি চাঁদা এন্ট্রি</span>
                  </button>
                </>
              )}
            </div>
          </div>

          {/* Division 2 Summary Cards (House Collections Only) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {/* Total House Collection */}
            <div className="bg-white border-2 border-emerald-600/30 rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between group">
              <div className="space-y-1.5 flex-1 mr-2">
                <span className="text-[#064e3b] text-xs font-bold tracking-wide flex items-center gap-1">
                  <Building2 className="h-3.5 w-3.5 text-[#0f766e]" />
                  <span>{selectedYear === 'all' ? 'সর্বমোট সংগৃহীত বাড়ি চাঁদা' : `${toBanglaNum(selectedYear)} খ্রি. সর্বমোট বাড়ি চাঁদা`}</span>
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#064e3b] flex items-center">
                  <span className="text-[#d97706] mr-1">৳</span>
                  <span>{toBanglaNum(houseTotalIncome.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  গ্রামের সকল বাড়ি হতে সংগৃহীত মোট চাঁদা
                </div>
              </div>
              <div className="h-11 w-11 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-center text-[#064e3b] group-hover:scale-105 transition shrink-0">
                <Coins className="h-5 w-5" />
              </div>
            </div>

            {/* Total Active Houses */}
            <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between group">
              <div className="space-y-1.5 flex-1 mr-2">
                <span className="text-amber-800 text-xs font-bold tracking-wide flex items-center gap-1">
                  <Home className="h-3.5 w-3.5 text-amber-700" />
                  <span>সক্রিয় সংগ্রাহক বাড়ির সংখ্যা</span>
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#064e3b] flex items-center">
                  <span>{toBanglaNum(activeHousesCount)}</span>
                  <span className="text-xs font-semibold text-gray-500 ml-1.5">টি বাড়ি</span>
                </div>
                <div className="text-[10px] text-gray-500 font-medium">
                  যেসব বাড়ি হতে চাঁদা জমা হয়েছে
                </div>
              </div>
              <div className="h-11 w-11 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-center text-amber-700 group-hover:scale-105 transition shrink-0">
                <Building2 className="h-5 w-5" />
              </div>
            </div>

            {/* Total Donors Count */}
            <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-xs relative overflow-hidden flex items-center justify-between group">
              <div className="space-y-1.5 flex-1 mr-2">
                <span className="text-[#0f766e] text-xs font-bold tracking-wide flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-[#0f766e]" />
                  <span>মোট চাঁতাদাতা পরিবার/সদস্য</span>
                </span>
                <div className="text-2xl sm:text-3xl font-black text-[#064e3b] flex items-center">
                  <span>{toBanglaNum(totalHouseDonorsCount)}</span>
                  <span className="text-xs font-semibold text-gray-500 ml-1.5">জন সম্মানিত দাতা</span>
                </div>
                {topHouse && (
                  <div className="text-[10px] text-emerald-800 font-semibold truncate">
                    শীর্ষ বাড়ি: {topHouse.houseName} (৳{toBanglaNum(topHouse.total.toLocaleString('bn-BD'))})
                  </div>
                )}
              </div>
              <div className="h-11 w-11 bg-teal-50 border border-teal-200 rounded-xl flex items-center justify-center text-[#0f766e] group-hover:scale-105 transition shrink-0">
                <Users className="h-5 w-5" />
              </div>
            </div>
          </div>

          {/* House-by-House Collection Cards & Grid */}
          <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-slate-200 pb-3">
              <div>
                <h3 className="text-sm sm:text-base font-black text-[#064e3b] flex items-center gap-1.5">
                  <Building2 className="h-4 w-4 text-[#0f766e]" />
                  <span>বাড়ি ভিত্তিক চাঁদা কালেকশন তালিকা ({toBanglaNum(selectedYear === 'all' ? 'সর্বকালীন' : selectedYear)})</span>
                </h3>
                <p className="text-[11px] text-gray-500 font-medium">
                  প্রতিটি বাড়ির কার্ডে ক্লিক করে ওই বাড়ির সকল দাতার নাম ও রশিদ নম্বর দেখুন
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                <div className="relative flex-1 sm:w-64">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
                    <Search className="h-3.5 w-3.5" />
                  </div>
                  <input
                    type="text"
                    placeholder="বাড়ির নাম বা দাতার নাম..."
                    value={houseSearchQuery}
                    onChange={(e) => setHouseSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <button
                  type="button"
                  onClick={exportHouseToCSV}
                  className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-[#cbd5e1] rounded-xl text-xs font-bold text-[#064e3b] shadow-2xs transition flex items-center space-x-1 cursor-pointer"
                >
                  <Download className="h-3.5 w-3.5 text-[#0f766e]" />
                  <span>CSV এক্সপোর্ট</span>
                </button>
              </div>
            </div>

            {/* Houses Grid */}
            {filteredHouseList.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredHouseList.map((house, idx) => {
                  const isExpanded = expandedHouse === house.houseName;
                  const avgDonation = house.count > 0 ? Math.round(house.total / house.count) : 0;
                  return (
                    <div
                      key={house.houseName}
                      className="border border-slate-200 rounded-2xl bg-[#f8fafc] hover:bg-white transition duration-200 shadow-2xs overflow-hidden"
                    >
                      {/* House Card Header */}
                      <div className="p-4 space-y-2.5">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <span className="h-6 w-6 rounded-full bg-emerald-100 text-[#064e3b] font-black text-xs flex items-center justify-center font-mono">
                              {toBanglaNum(idx + 1)}
                            </span>
                            <h4 className="text-sm font-black text-[#064e3b]">{house.houseName}</h4>
                          </div>

                          <div className="text-right font-mono">
                            <span className="text-base font-black text-[#0f766e]">
                              ৳ {toBanglaNum(house.total.toLocaleString('bn-BD'))}
                            </span>
                          </div>
                        </div>

                        {/* House Quick Metrics */}
                        <div className="grid grid-cols-3 gap-2 text-center text-[10px] bg-white p-2 rounded-xl border border-slate-200">
                          <div>
                            <span className="text-gray-400 block">মোট দাতা</span>
                            <span className="font-bold text-gray-800">{toBanglaNum(house.count)} জন</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">গড় দান</span>
                            <span className="font-bold text-gray-800">৳{toBanglaNum(avgDonation.toLocaleString('bn-BD'))}</span>
                          </div>
                          <div>
                            <span className="text-gray-400 block">সর্বোচ্চ দান</span>
                            <span className="font-bold text-[#064e3b]">৳{toBanglaNum(house.maxDonation.toLocaleString('bn-BD'))}</span>
                          </div>
                        </div>

                        {/* Expand / Collapse Button */}
                        <button
                          type="button"
                          onClick={() => setExpandedHouse(isExpanded ? null : house.houseName)}
                          className="w-full py-1.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 cursor-pointer"
                        >
                          <span>{isExpanded ? 'তালিকা লুকান' : 'বিস্তারিত দাতা তালিকা দেখুন'}</span>
                          {isExpanded ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                        </button>
                      </div>

                      {/* Expandable Donor List Table */}
                      {isExpanded && (
                        <div className="border-t border-slate-200 bg-white p-3 space-y-2 max-h-60 overflow-y-auto">
                          <table className="min-w-full divide-y divide-slate-100 text-xs">
                            <thead>
                              <tr className="text-gray-500 text-[10px]">
                                <th className="text-left py-1 font-semibold">ক্রমিক</th>
                                <th className="text-left py-1 font-semibold">দাতার নাম</th>
                                <th className="text-center py-1 font-semibold">রশিদ নং</th>
                                <th className="text-right py-1 font-semibold">টাকা</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {house.donors.map((d, dIdx) => (
                                <tr key={d.id} className="hover:bg-slate-50">
                                  <td className="py-1 text-gray-400 font-mono">{toBanglaNum(dIdx + 1)}</td>
                                  <td className="py-1 font-medium text-gray-800">{d.donorName || 'নাম প্রকাশে অনিচ্ছুক'}</td>
                                  <td className="py-1 text-center font-mono text-gray-500">
                                    {d.receiptNo ? toBanglaNum(d.receiptNo) : '-'}
                                  </td>
                                  <td className="py-1 text-right font-black font-mono text-[#0f766e]">
                                    ৳ {toBanglaNum(d.amount.toLocaleString('bn-BD'))}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-xs text-gray-400 text-center py-8">
                {houseSearchQuery ? 'অনুসন্ধান অনুযায়ী কোনো বাড়ির হিসাব পাওয়া যায়নি।' : 'কোনো বাড়ি ভিত্তিক চাঁদা পাওয়া যায়নি।'}
              </p>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RENDER DIVISION 3: COMPARATIVE & AUDIT OVERVIEW                           */}
      {/* ========================================================================= */}
      {activeDivision === 'audit-comparison' && (
        <div className="space-y-6 animate-fade-in">
          {/* Audit Declaration Banner */}
          <div className="bg-gradient-to-r from-amber-500/10 via-emerald-500/10 to-teal-500/10 border-2 border-amber-300 rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <span className="p-2 bg-amber-500 text-white rounded-2xl shadow-xs">
                <ShieldCheck className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-base sm:text-lg font-black text-[#064e3b]">
                  হিসাবের স্বচ্ছতা ও সঠিকতার প্রাতিষ্ঠানিক নিরীক্ষা নীতি
                </h3>
                <span className="text-xs font-bold text-[#d97706]">
                  সোনারগাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
                </span>
              </div>
            </div>

            <p className="text-xs sm:text-sm text-gray-700 leading-relaxed font-light bg-white p-4 rounded-2xl border border-amber-200">
              <b>কেন দুইটা হিসাব পদ্ধতি আলাদা বিভাগে রাখা হয়েছে?</b>
              <br />
              ১. <b>ম্যানুয়াল আয়-ব্যয় পোস্টিং (বিভাগ ১):</b> মাহফিলের কেন্দ্রীয় তহবিল ও সার্বিক খরচাদি—যেমন তাবাররুক, সাউন্ড সিস্টেম, স্টেজ ডেকোরেশন, মেহমান ও বক্তা হাদিয়া এবং কেন্দ্রীয় সাধারণ অনুদানের খতিয়ান।
              <br />
              ২. <b>বাড়ি ভিত্তিক হিসাব (বিভাগ ২):</b> পাড়ার প্রতিটি পরিবার ও বাড়ির সদস্যদের ব্যক্তিগত চাঁদার সুনির্দিষ্ট তালিকা।
              <br />
              ৩. <b>হিসাবের বিশুদ্ধতা:</b> এই দুইটি ক্ষেত্রকে একসাথে মিশ্রিত করলে কেন্দ্রীয় ভাউচার খরচের সাথে ব্যক্তিকেন্দ্রিক পাড়া চাঁদা মিলে হিসেবে বিভ্রান্তি তৈরি হয়। তাই উভয় হিসাবকে আলাদা বিভাগে সংরক্ষণ করা হয়েছে যাতে আয়-ব্যয়ের হিসাবের শতভাগ নির্ভুলতা বজায় থাকে।
            </p>
          </div>

          {/* Side-by-Side Comparison Columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Column 1: Manual Central Ledger Summary */}
            <div className="bg-white border-2 border-[#0f766e]/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-2 bg-emerald-100 text-[#0f766e] rounded-xl">
                    <FileSpreadsheet className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-[#064e3b]">কেন্দ্রীয় ম্যানুয়াল আয়-ব্যয় লেজার</h4>
                    <span className="text-[11px] text-gray-500">বিভাগ ১ এর নির্যাস</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-emerald-100 text-emerald-900 rounded-full font-mono">
                  {toBanglaNum(selectedYear === 'all' ? 'সব বছর' : `${selectedYear} খ্রি.`)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-gray-600">বিগত বছরের প্রারম্ভিক উদ্বৃত্ত:</span>
                  <span className="font-mono font-bold text-gray-800">৳ {toBanglaNum(manualOpeningBalance.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 text-[#0f766e]">
                  <span className="font-semibold">কেন্দ্রীয় মোট আয় (প্রাপ্তি):</span>
                  <span className="font-mono font-black">+ ৳ {toBanglaNum(manualTotalIncome.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 text-red-600">
                  <span className="font-semibold">কেন্দ্রীয় মোট ব্যয় (খরচ):</span>
                  <span className="font-mono font-black">- ৳ {toBanglaNum(manualTotalExpense.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200 text-gray-700">
                  <span>চলতি বছরের নিট স্থিতি:</span>
                  <span className={`font-mono font-bold ${manualNetBalance >= 0 ? 'text-[#0f766e]' : 'text-red-600'}`}>
                    {manualNetBalance >= 0 ? '+' : '-'} ৳ {toBanglaNum(Math.abs(manualNetBalance).toLocaleString('bn-BD'))}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black text-[#064e3b] bg-emerald-50 p-2.5 rounded-xl border border-emerald-200">
                  <span>সমাপনী হাতে নগদ (তহবিল):</span>
                  <span className="font-mono text-[#0f766e]">৳ {toBanglaNum(manualEndingBalance.toLocaleString('bn-BD'))}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDivision('manual-ledger')}
                className="w-full py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>ম্যানুয়াল লেজারের বিস্তারিত দেখুন</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {/* Column 2: House Collections Summary */}
            <div className="bg-white border-2 border-[#d97706]/30 rounded-3xl p-5 sm:p-6 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div className="flex items-center space-x-2">
                  <span className="p-2 bg-amber-100 text-amber-800 rounded-xl">
                    <Building2 className="h-5 w-5" />
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-amber-950">পাড়া ও বাড়ি ভিত্তিক চাঁদা আদায়</h4>
                    <span className="text-[11px] text-gray-500">বিভাগ ২ এর নির্যাস</span>
                  </div>
                </div>
                <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-900 rounded-full font-mono">
                  {toBanglaNum(selectedYear === 'all' ? 'সব বছর' : `${selectedYear} খ্রি.`)}
                </span>
              </div>

              <div className="space-y-2.5 text-xs">
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-gray-600">মোট সক্রিয় বাড়ির সংখ্যা:</span>
                  <span className="font-mono font-bold text-gray-800">{toBanglaNum(activeHousesCount)} টি বাড়ি</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-gray-600">মোট চাঁতাদাতার সংখ্যা:</span>
                  <span className="font-mono font-bold text-gray-800">{toBanglaNum(totalHouseDonorsCount)} জন দাতা</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-gray-600">শীর্ষ সংগ্রহকারী বাড়ি:</span>
                  <span className="font-bold text-[#064e3b]">{topHouse ? topHouse.houseName : '—'}</span>
                </div>
                <div className="flex justify-between py-1 border-b border-dashed border-slate-200">
                  <span className="text-gray-600">শীর্ষ বাড়ির আদায়:</span>
                  <span className="font-mono font-bold text-amber-800">
                    ৳ {toBanglaNum((topHouse?.total || 0).toLocaleString('bn-BD'))}
                  </span>
                </div>
                <div className="flex justify-between pt-2 text-sm font-black text-[#064e3b] bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  <span>সর্বমোট বাড়ি চাঁদা আদায়:</span>
                  <span className="font-mono text-amber-800">৳ {toBanglaNum(houseTotalIncome.toLocaleString('bn-BD'))}</span>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDivision('house-accounting')}
                className="w-full py-2 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1 cursor-pointer"
              >
                <span>বাড়ি ভিত্তিক বিস্তারিত দেখুন</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SHARED MODALS                                                             */}
      {/* ========================================================================= */}

      {/* MODAL 1: Upgraded Donation Receipt Modal */}
      <DonationReceiptModal
        isOpen={showDonationReceiptModal}
        onClose={() => {
          setShowDonationReceiptModal(false);
          setReceiptModalData(null);
        }}
        initialData={receiptModalData}
        existingTransactions={transactions}
      />

      {/* MODAL 2: Full Summary Print Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-[#f8fafc] border-2 border-[#0f766e] rounded-3xl max-w-5xl w-full p-4 sm:p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
            <div className="flex justify-between items-center pb-3 mb-3 border-b border-[#cbd5e1] print:hidden">
              <div className="flex items-center space-x-2">
                <span className="p-1.5 bg-[#0f766e]/10 text-[#0f766e] rounded-lg">
                  <BookOpen className="h-5 w-5" />
                </span>
                <span className="font-bold text-[#064e3b] text-base">বার্ষিক আয়-ব্যয় বিবরণী রিপোর্ট</span>
              </div>
              <button
                id="close-report-modal"
                onClick={() => setShowReportModal(false)}
                className="p-1.5 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#0f766e] hover:text-[#064e3b] transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <AnnualLedgerReport
              transactions={transactions}
              onClose={() => setShowReportModal(false)}
              defaultYear={reportModalYear}
              isAdminLoggedIn={isAdminLoggedIn}
              isFinancePublic={isFinancePublic}
              onToggleFinancePublic={onToggleFinancePublic}
            />
          </div>
        </div>
      )}

      {/* MODAL 3: Manual Financial Posting Modal */}
      {showManualPostingModal && onAddTransaction && (
        <ManualFinancialPostingModal
          isOpen={showManualPostingModal}
          onClose={() => setShowManualPostingModal(false)}
          onAddTransaction={onAddTransaction}
          onBatchAddTransactions={onBatchAddTransactions}
          onDeleteTransaction={onDeleteTransaction}
          initialYear={selectedYear !== 'all' ? selectedYear : '2026'}
          transactions={transactions}
          isAdminLoggedIn={isAdminLoggedIn}
          setIsAdminLoggedIn={setIsAdminLoggedIn}
        />
      )}

      {/* MODAL 4: Global Edit Transaction Modal */}
      {showEditModal && editingTransaction && onUpdateTransaction && (
        <EditTransactionModal
          transaction={editingTransaction}
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onSave={async (updated) => {
            await onUpdateTransaction(updated);
            setShowEditModal(false);
            setEditingTransaction(null);
          }}
          onDelete={
            onDeleteTransaction
              ? async (id) => {
                  await onDeleteTransaction(id);
                  setShowEditModal(false);
                  setEditingTransaction(null);
                }
              : undefined
          }
        />
      )}

      {/* MODAL 5: Admin Password Verification for Report Download */}
      {showAdminAuthModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
          <div className="relative bg-white border border-[#cbd5e1] rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scale-in space-y-4">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-3">
                <div className="p-2.5 bg-amber-50 text-[#d97706] rounded-xl border border-amber-200/60 shadow-xs">
                  <Lock className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-extrabold text-[#064e3b]">অ্যাডমিন পাসওয়ার্ড আবশ্যক</h3>
                  <p className="text-xs text-gray-500 font-medium">রিপোর্ট ডাউনলোড বা দেখতে অ্যাডমিন অনুমোদন প্রয়োজন</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setShowAdminAuthModal(false);
                  setPendingAuthAction(null);
                  setAdminAuthError('');
                }}
                className="p-1.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#3c3c3c]/80 leading-relaxed bg-slate-50 p-3 rounded-xl border border-slate-200">
              নিরাপত্তা স্বার্থে পূর্ণাঙ্গ বার্ষিক আয়-ব্যয় রিপোর্ট, হিসাব খতিয়ান শিট ও এক্সপোর্ট ফাইল ডাউনলোডের জন্য নির্ধারিত অ্যাডমিন পাসওয়ার্ড প্রদান করুন।
            </p>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-4 pt-1">
              <div>
                <label className="block text-xs font-bold text-[#064e3b] mb-1.5 flex items-center justify-between">
                  <span>অ্যাডমিন পাসওয়ার্ড</span>
                  <KeyRound className="h-3.5 w-3.5 text-[#0f766e]" />
                </label>
                <input
                  type="password"
                  autoFocus
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminAuthError) setAdminAuthError('');
                  }}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3.5 py-2.5 text-sm font-semibold text-gray-900 focus:ring-2 focus:ring-[#0f766e] focus:outline-none placeholder:text-gray-400"
                />
                {adminAuthError && (
                  <p className="text-xs text-red-600 font-bold mt-1.5 flex items-center space-x-1">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                    <span>{adminAuthError}</span>
                  </p>
                )}
              </div>

              <div className="flex items-center space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAdminAuthModal(false);
                    setPendingAuthAction(null);
                    setAdminAuthError('');
                  }}
                  className="flex-1 py-2.5 px-3 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-xl text-xs font-bold transition cursor-pointer"
                >
                  বাতিল
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-3 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold transition shadow-md cursor-pointer flex items-center justify-center space-x-1.5"
                >
                  <CheckCircle2 className="h-4 w-4" />
                  <span>যাচাই ও ডাউনলোড</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
