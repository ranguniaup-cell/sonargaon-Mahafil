import React from 'react';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { Transaction } from '../types';
import { Printer, Download, Image as ImageIcon, Calendar, Filter, Search, Eye, Sparkles, RefreshCw, FileText, CheckCircle, Lock, KeyRound, AlertCircle, CheckCircle2, X, PlusCircle } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { renderSafeCanvas, exportElementToPdf, downloadCanvasAsImage } from '../utils/html2canvasSafe';
import { isHouseCollection, getTransactionYear, sortTransactionsFIFO } from '../lib/transactionUtils';

// Helper for Bangla numbers
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
};

// Helper for Bangla Date (YYYY-MM-DD -> DD/MM/YYYY in Bangla)
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

// Current formatted Bangla date (e.g. ২৪/৮/২০২৬)
const getCurrentBanglaDate = (): string => {
  const now = new Date();
  const day = now.getDate();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  return `${toBanglaNum(day)}/${toBanglaNum(month)}/${toBanglaNum(year)}`;
};

// Helper to convert OKLCH/OKLAB colors for html2canvas compatibility
function cleanColorsForCanvas(text: string): string {
  return text
    .replace(/oklch\([^)]+\)/g, 'rgb(15, 118, 110)')
    .replace(/oklab\([^)]+\)/g, 'rgb(15, 118, 110)');
}

interface AnnualLedgerReportProps {
  transactions: Transaction[];
  initialFundBalance?: number;
  hideControls?: boolean; // When rendered inside another view or modal
  onClose?: () => void;
  defaultYear?: string;
  isAdminLoggedIn?: boolean;
  isFinancePublic?: boolean;
  onToggleFinancePublic?: (status: boolean) => void;
  onOpenManualPosting?: (year?: string) => void;
}

export default function AnnualLedgerReport({
  transactions = [],
  hideControls = false,
  onClose,
  defaultYear = 'all',
  isAdminLoggedIn = false,
  isFinancePublic = false,
  onToggleFinancePublic,
  onOpenManualPosting
}: AnnualLedgerReportProps) {
  const [selectedYear, setSelectedYear] = React.useState<string>(defaultYear);
  const [reportMode, setReportMode] = React.useState<'detailed' | 'category'>('detailed');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [excludeHouseCollections, setExcludeHouseCollections] = React.useState<boolean>(true);
  const [isExportingPDF, setIsExportingPDF] = React.useState<boolean>(false);

  React.useEffect(() => {
    if (defaultYear) {
      setSelectedYear(defaultYear);
    }
  }, [defaultYear]);
  const [isExportingImage, setIsExportingImage] = React.useState<boolean>(false);
  const [orgTitle, setOrgTitle] = React.useState<string>('পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ');
  const [orgSubtitle, setOrgSubtitle] = React.useState<string>('সোনারগাঁও, ধামাইর হাট, রাঙ্গুনিয়া, চট্টগ্রাম।');
  const [isEditingOrgInfo, setIsEditingOrgInfo] = React.useState<boolean>(false);

  // Admin password verification for downloading/printing
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
      setShowAdminAuthModal(false);
      setAdminPasswordInput('');
      setAdminAuthError('');
      if (pendingAuthAction) {
        pendingAuthAction();
        setPendingAuthAction(null);
      }
    } else {
      setAdminAuthError('পাসওয়ার্ড সঠিক নয়! শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিন রিপোর্ট ডাউনলোড করতে পারবেন।');
    }
  };

  // Extract unique years from transactions
  const availableYears = React.useMemo(() => {
    const years = new Set<string>(['2026', '2025', '2024', '2023']);
    transactions.forEach((t) => {
      const yr = getTransactionYear(t);
      if (yr) years.add(yr.toString());
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Filter transactions based on selected year & search query
  const filteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      // Exclude house-based individual collections from the financial ledger report by default
      if (excludeHouseCollections && isHouseCollection(t)) {
        return false;
      }

      const txYear = getTransactionYear(t).toString();
      const matchYear = selectedYear === 'all' || txYear === selectedYear;

      if (!matchYear) return false;

      if (!searchQuery.trim()) return true;

      const q = searchQuery.toLowerCase();
      const matchCategory = t.category?.toLowerCase().includes(q);
      const matchDonor = t.donorName?.toLowerCase().includes(q);
      const matchDesc = t.description?.toLowerCase().includes(q);
      const matchReceipt = t.receiptNo?.toLowerCase().includes(q);

      return matchCategory || matchDonor || matchDesc || matchReceipt;
    });
  }, [transactions, selectedYear, searchQuery, excludeHouseCollections]);

  // Separate incomes and expenses in FIFO order (প্রথমের পোস্টিং প্রথমে)
  const incomes = React.useMemo(() => {
    const list = filteredTransactions.filter((t) => t.type === 'income');
    return sortTransactionsFIFO(list);
  }, [filteredTransactions]);

  const expenses = React.useMemo(() => {
    const list = filteredTransactions.filter((t) => t.type === 'expense');
    return sortTransactionsFIFO(list);
  }, [filteredTransactions]);

  // Calculations
  const totalIncome = React.useMemo(() => {
    return incomes.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [incomes]);

  const totalExpense = React.useMemo(() => {
    return expenses.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [expenses]);

  // Prior Year Calculation (if a specific year is selected or past transactions exist)
  const autoPrior = React.useMemo(() => {
    if (selectedYear === 'all') {
      return { amount: 0, yearLabel: 'বিগত', hasPrior: false };
    }

    const currentYearNum = parseInt(selectedYear, 10);
    if (isNaN(currentYearNum)) {
      return { amount: 0, yearLabel: 'বিগত', hasPrior: false };
    }

    // Transactions before selected year
    const priorTransactions = transactions.filter((t) => {
      if (excludeHouseCollections && isHouseCollection(t)) {
        return false;
      }
      let tYear: number | null = null;
      if (t.year) {
        tYear = Number(t.year);
      } else if (t.date) {
        const y = parseInt(t.date.split('-')[0], 10);
        if (!isNaN(y)) tYear = y;
      }
      return tYear !== null && tYear < currentYearNum;
    });

    const priorIncomes = priorTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const priorExpenses = priorTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

    const netPrior = priorIncomes - priorExpenses;
    const prevYearNum = currentYearNum - 1;

    return {
      amount: netPrior,
      yearLabel: `${prevYearNum}`,
      hasPrior: netPrior !== 0 || priorTransactions.length > 0
    };
  }, [transactions, selectedYear]);

  // States for Previous Year Cash / Balance Customization
  const [includePriorBalance, setIncludePriorBalance] = React.useState<boolean>(false);
  const [priorBalanceAmount, setPriorBalanceAmount] = React.useState<number>(0);
  const [priorYearLabel, setPriorYearLabel] = React.useState<string>('');
  const [isEditingPriorBalance, setIsEditingPriorBalance] = React.useState<boolean>(false);

  // Sync auto prior calculation when selectedYear changes
  React.useEffect(() => {
    if (autoPrior.hasPrior && autoPrior.amount !== 0) {
      setIncludePriorBalance(true);
      setPriorBalanceAmount(autoPrior.amount);
      setPriorYearLabel(autoPrior.yearLabel);
    } else if (selectedYear !== 'all') {
      setPriorYearLabel(autoPrior.yearLabel || `${Number(selectedYear) - 1}`);
    }
  }, [autoPrior, selectedYear]);

  // Net Difference (আয় - ব্যয়)
  const netProfitOrSurplus = totalIncome - totalExpense;

  // Current Net Cash in Hand (বর্তমান নিট হাতে নগদ) = বিগত বছরের হাতে নগদ + চলতি উদ্বৃত্ত/ঘাটতি
  const currentNetCashInHand = includePriorBalance
    ? priorBalanceAmount + netProfitOrSurplus
    : netProfitOrSurplus;

  // Grouped by Category (for Category view mode)
  const categoryIncomes = React.useMemo(() => {
    const map: Record<string, { category: string; amount: number; count: number; latestDate: string }> = {};
    incomes.forEach((t) => {
      const cat = t.category || 'সাধারণ অনুদান';
      if (!map[cat]) {
        map[cat] = { category: cat, amount: 0, count: 0, latestDate: t.date || '' };
      }
      map[cat].amount += Number(t.amount) || 0;
      map[cat].count += 1;
      if (t.date && t.date > map[cat].latestDate) {
        map[cat].latestDate = t.date;
      }
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [incomes]);

  const categoryExpenses = React.useMemo(() => {
    const map: Record<string, { category: string; amount: number; count: number; latestDate: string }> = {};
    expenses.forEach((t) => {
      const cat = t.category || 'সাধারণ খরচ';
      if (!map[cat]) {
        map[cat] = { category: cat, amount: 0, count: 0, latestDate: t.date || '' };
      }
      map[cat].amount += Number(t.amount) || 0;
      map[cat].count += 1;
      if (t.date && t.date > map[cat].latestDate) {
        map[cat].latestDate = t.date;
      }
    });
    return Object.values(map).sort((a, b) => b.amount - a.amount);
  }, [expenses]);

  // Print Action
  const handlePrint = () => {
    window.print();
  };

  // PDF Export
  const handleExportPDF = async () => {
    const reportElement = document.getElementById('mahfil-annual-ledger-sheet');
    if (!reportElement) return;

    setIsExportingPDF(true);

    try {
      const yearText = selectedYear === 'all' ? 'সকল-হিসাব-কাল' : `${selectedYear}-সন`;
      await exportElementToPdf(reportElement, {
        fileName: `বার্ষিক-আয়-ব্যয়-বিবরণী-${yearText}.pdf`,
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        scale: 2.5
      });
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('পিডিএফ তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে প্রিন্ট অপশনটি ব্যবহার করুন।');
    } finally {
      setIsExportingPDF(false);
    }
  };

  // Image Export
  const handleExportImage = async () => {
    const reportElement = document.getElementById('mahfil-annual-ledger-sheet');
    if (!reportElement) return;

    setIsExportingImage(true);
    try {
      const canvas = await renderSafeCanvas(reportElement, {
        scale: 2.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
      });

      const yearText = selectedYear === 'all' ? 'সকল-হিসাব-কাল' : `${selectedYear}-সন`;
      downloadCanvasAsImage(canvas, `বার্ষিক-আয়-ব্যয়-বিবরণী-${yearText}.png`, 'image/png');
    } catch (err) {
      console.error('Image export failed:', err);
      alert('ছবি সংরক্ষণে সমস্যা হয়েছে।');
    } finally {
      setIsExportingImage(false);
    }
  };

  // Starting serial counter
  let slCounter = 1;

  return (
    <div className="w-full space-y-6">
      {/* Top Filter & Toolbar (Hidden during print) */}
      {!hideControls && (
        <div className="bg-white border-2 border-[#cbd5e1] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 print:hidden">
          {/* Admin Approval & Public Status Banner */}
          {isAdminLoggedIn && (
            <div className="bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white p-3.5 sm:p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs border border-emerald-700">
              <div className="flex items-center space-x-2.5">
                <div className={`p-2 rounded-lg ${isFinancePublic ? 'bg-emerald-400/20 text-emerald-300' : 'bg-amber-400/20 text-amber-300'}`}>
                  {isFinancePublic ? <CheckCircle2 className="h-5 w-5" /> : <Lock className="h-5 w-5" />}
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-emerald-100">হিসাব ও খতিয়ান পাবলিক স্ট্যাটাস:</span>
                    <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${isFinancePublic ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-slate-900'}`}>
                      {isFinancePublic ? '🟢 উন্মুক্ত ও অনুমোদিত' : '🔒 অ্যাডমিন সংরক্ষিত'}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-200 font-light mt-0.5">
                    {isFinancePublic ? 'সর্বসাধারণ যেকোনো সময় এই খতিয়ান দেখতে ও ডাউনলোড করতে পারছে।' : 'সাধারণ দর্শকরা দেখতে পারছে না। অনুমোদন দিলে উন্মুক্ত হবে।'}
                  </p>
                </div>
              </div>
              {onToggleFinancePublic && (
                <button
                  type="button"
                  onClick={() => onToggleFinancePublic(!isFinancePublic)}
                  className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer shrink-0 shadow-xs ${
                    isFinancePublic ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
                  }`}
                >
                  {isFinancePublic ? 'লক / অপ্রকাশিত করুন' : 'অনুমোদন দিন ও পাবলিক করুন'}
                </button>
              )}
            </div>
          )}

          {!isAdminLoggedIn && isFinancePublic && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 flex items-center justify-between gap-2 text-emerald-950">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span className="text-xs font-semibold">
                  অ্যাডমিন অনুমোদিত: পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদের প্রাতিষ্ঠানিক প্রকাশ্য খতিয়ান
                </span>
              </div>
              <span className="text-[10px] font-bold bg-emerald-600 text-white px-2 py-0.5 rounded">
                পাবলিক অনুমোদিত
              </span>
            </div>
          )}

          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
            <div>
              <div className="flex items-center space-x-2">
                <span className="p-2 bg-[#0f766e]/10 text-[#0f766e] rounded-xl">
                  <FileText className="h-5 w-5" />
                </span>
                <h2 className="text-lg sm:text-xl font-extrabold text-[#064e3b]">
                  বার্ষিক আয়-ব্যয় বিবরণী রিপোর্ট
                </h2>
              </div>
              <p className="text-xs text-[#0f766e] font-semibold mt-1">
                ছবি অনুযায়ী হুবহু প্রাতিষ্ঠানিক খতিয়ান শিট (সাল ভিত্তিক ও সমগ্র হিসাব কাল অনুযায়ী পিডিএফ ডাউনলোড)
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center gap-2">
              {onOpenManualPosting && (
                <button
                  type="button"
                  id="btn-open-manual-posting"
                  onClick={() => onOpenManualPosting(selectedYear !== 'all' ? selectedYear : undefined)}
                  className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#0f766e] hover:bg-[#064e3b] text-white rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                  title="বিগত ও বর্তমান বছরের সাধারণ আয়-ব্যয় ম্যানুয়ালি পোস্টিং করুন"
                >
                  <PlusCircle className="h-4 w-4" />
                  <span>ম্যানুয়াল পোস্টিং</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setExcludeHouseCollections(!excludeHouseCollections)}
                className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl text-xs font-bold transition border cursor-pointer ${
                  excludeHouseCollections
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
                title="বাড়ি ভিত্তিক ব্যক্তিদের চাঁদা আলাদা রাখা হয়েছে যাতে আয়-ব্যয় রিপোর্ট নিরপেক্ষ থাকে"
              >
                <span className={`w-2 h-2 rounded-full ${excludeHouseCollections ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                <span>{excludeHouseCollections ? 'বাড়ি চাঁদা বাদ দেওয়া' : 'বাড়ি চাঁদা সহ'}</span>
              </button>

              <button
                id="btn-print-statement"
                onClick={() => {
                  executeWithAdminAuth(() => {
                    handlePrint();
                  });
                }}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-[#cbd5e1] text-[#064e3b] rounded-xl text-xs font-bold transition shadow-sm cursor-pointer"
                title="সরাসরি প্রিন্ট করুন"
              >
                <Printer className="h-4 w-4 text-[#0f766e]" />
                <span>প্রিন্ট করুন</span>
              </button>

              <button
                id="btn-pdf-statement"
                onClick={() => {
                  executeWithAdminAuth(() => {
                    handleExportPDF();
                  });
                }}
                disabled={isExportingPDF}
                className="flex items-center space-x-1.5 px-4 py-2 bg-[#d97706] hover:bg-[#b45309] text-white rounded-xl text-xs font-extrabold transition shadow-md hover:shadow-lg cursor-pointer disabled:opacity-50"
                title="পিডিএফ ফাইল ডাউনলোড"
              >
                <Download className="h-4 w-4" />
                <span>{isExportingPDF ? 'পিডিএফ তৈরি হচ্ছে...' : 'PDF ডাউনলোড'}</span>
              </button>

              <button
                id="btn-img-statement"
                onClick={() => {
                  executeWithAdminAuth(() => {
                    handleExportImage();
                  });
                }}
                disabled={isExportingImage}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-slate-100 border border-[#cbd5e1] text-[#064e3b] rounded-xl text-xs font-bold transition shadow-sm cursor-pointer disabled:opacity-50"
                title="ছবি হিসেবে সেভ করুন"
              >
                <ImageIcon className="h-4 w-4 text-[#0f766e]" />
                <span>{isExportingImage ? 'সংরক্ষণ হচ্ছে...' : 'ছবি ডাউনলোড'}</span>
              </button>
            </div>
          </div>

          {/* Filters row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-[#e2e8f0]">
            {/* Year Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#064e3b] mb-1">
                হিসাব কাল (বছর নির্বাচন করুন)
              </label>
              <div className="relative">
                <select
                  id="select-statement-year"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs font-bold text-[#064e3b] focus:ring-2 focus:ring-[#0f766e] focus:outline-none cursor-pointer"
                >
                  <option value="all">সকল হিসাব কাল (সমগ্র হিসাব)</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {toBanglaNum(yr)} সন
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Mode Selector */}
            <div>
              <label className="block text-[11px] font-bold text-[#064e3b] mb-1">
                রিপোর্টের ফরম্যাট
              </label>
              <div className="flex bg-[#f8fafc] p-1 rounded-xl border border-[#cbd5e1]">
                <button
                  onClick={() => setReportMode('detailed')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    reportMode === 'detailed'
                      ? 'bg-[#0f766e] text-white shadow-sm'
                      : 'text-[#0f766e] hover:bg-white/60'
                  }`}
                >
                  বিস্তারিত লেজার (ছবির মতো)
                </button>
                <button
                  onClick={() => setReportMode('category')}
                  className={`flex-1 py-1.5 text-xs font-bold rounded-lg transition ${
                    reportMode === 'category'
                      ? 'bg-[#0f766e] text-white shadow-sm'
                      : 'text-[#0f766e] hover:bg-white/60'
                  }`}
                >
                  খাতভিত্তিক সংক্ষেপ
                </button>
              </div>
            </div>

            {/* Search Input */}
            <div>
              <label className="block text-[11px] font-bold text-[#064e3b] mb-1">
                বিবরণ বা দাতার নাম দিয়ে ফিল্টার
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-[#0f766e]" />
                <input
                  type="text"
                  placeholder="যেমন: জমি বিক্রয়, লভ্যাংশ, ইফতারী..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-[#f8fafc] border border-[#cbd5e1] rounded-xl pl-9 pr-3 py-2 text-xs font-medium text-[#064e3b] focus:ring-2 focus:ring-[#0f766e] focus:outline-none placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Quick Year Download Pills Bar */}
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-dashed border-[#e2e8f0]">
            <span className="text-[11px] font-extrabold text-[#064e3b] flex items-center space-x-1">
              <Download className="h-3.5 w-3.5 text-[#0f766e]" />
              <span>প্রতিটি বছরের বার্ষিক রিপোর্ট ডাউনলোড:</span>
            </span>
            <div className="flex flex-wrap gap-1.5">
              <button
                onClick={() => {
                  executeWithAdminAuth(() => {
                    setSelectedYear('all');
                    setTimeout(() => {
                      handleExportPDF();
                    }, 120);
                  });
                }}
                title="সকল বছরের সমন্বিত লেজার রিপোর্ট PDF ডাউনলোড করুন"
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                  selectedYear === 'all'
                    ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-xs'
                    : 'bg-[#f8fafc] text-[#064e3b] border-[#cbd5e1] hover:bg-emerald-50 hover:border-[#0f766e]'
                }`}
              >
                <span>সকল বছর</span>
                <Download className="h-3 w-3 opacity-80" />
              </button>
              {availableYears.map((yr) => (
                <button
                  key={yr}
                  onClick={() => {
                    executeWithAdminAuth(() => {
                      setSelectedYear(yr);
                      setTimeout(() => {
                        handleExportPDF();
                      }, 120);
                    });
                  }}
                  title={`${toBanglaNum(yr)} সনের বার্ষিক লেজার রিপোর্ট PDF ডাউনলোড করুন`}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                    selectedYear === yr
                      ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-xs'
                      : 'bg-[#f8fafc] text-[#064e3b] border-[#cbd5e1] hover:bg-emerald-50 hover:border-[#0f766e]'
                  }`}
                >
                  <Calendar className="h-3 w-3 opacity-60" />
                  <span>{toBanglaNum(yr)} সন</span>
                  <Download className="h-3 w-3 text-amber-600 group-hover:text-amber-800" />
                </button>
              ))}
            </div>
          </div>

          {/* Configuration Settings: Previous Year Balance & Org Header */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Prior Year Balance Toggle & Input */}
            <div className="bg-[#f0fdf4] border border-[#bbf7d0] p-2.5 rounded-xl text-xs text-[#064e3b] space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="flex items-center space-x-2 font-bold cursor-pointer">
                  <input
                    type="checkbox"
                    checked={includePriorBalance}
                    onChange={(e) => setIncludePriorBalance(e.target.checked)}
                    className="rounded text-[#0f766e] focus:ring-[#0f766e]"
                  />
                  <span>বিগত বছরের হাতে নগদ যুক্ত করুন</span>
                </label>
                {includePriorBalance && (
                  <button
                    onClick={() => setIsEditingPriorBalance(!isEditingPriorBalance)}
                    className="text-[11px] font-bold text-[#0f766e] hover:underline cursor-pointer"
                  >
                    {isEditingPriorBalance ? 'সম্পন্ন' : 'এডিট'}
                  </button>
                )}
              </div>

              {includePriorBalance && (
                isEditingPriorBalance ? (
                  <div className="flex items-center space-x-2 pt-1">
                    <div className="flex-1">
                      <span className="text-[10px] text-gray-600 block">টাকার পরিমাণ:</span>
                      <input
                        type="number"
                        value={priorBalanceAmount}
                        onChange={(e) => setPriorBalanceAmount(Number(e.target.value) || 0)}
                        className="w-full px-2 py-1 bg-white border border-[#0f766e] rounded text-xs font-mono font-bold"
                        placeholder="টাকা"
                      />
                    </div>
                    <div className="w-24">
                      <span className="text-[10px] text-gray-600 block">সাল/সন:</span>
                      <input
                        type="text"
                        value={priorYearLabel}
                        onChange={(e) => setPriorYearLabel(e.target.value)}
                        className="w-full px-2 py-1 bg-white border border-[#0f766e] rounded text-xs font-bold"
                        placeholder="যেমন: ২০২৫"
                      />
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-between text-[11px] pt-0.5">
                    <span className="text-gray-700">
                      বিগত বছরের আয়/হাতে নগদ ({toBanglaNum(priorYearLabel || 'বিগত')} সন):
                    </span>
                    <span className="font-mono font-bold text-[#0f766e]">
                      {toBanglaNum(priorBalanceAmount.toLocaleString('bn-BD'))}
                    </span>
                  </div>
                )
              )}
            </div>

            {/* Org Info Customizer */}
            <div className="flex items-center justify-between bg-[#f8fafc] border border-[#cbd5e1] p-2.5 rounded-xl text-xs text-[#064e3b]">
              <div className="truncate pr-2">
                <span className="font-semibold text-gray-700">সংস্থার নাম: </span>
                <span className="font-bold text-[#064e3b]">{orgTitle}</span>
              </div>
              <button
                onClick={() => setIsEditingOrgInfo(!isEditingOrgInfo)}
                className="text-[11px] font-bold text-[#0f766e] hover:underline cursor-pointer shrink-0"
              >
                {isEditingOrgInfo ? 'সম্পন্ন' : 'এডিট'}
              </button>
            </div>
          </div>

          {isEditingOrgInfo && (
            <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
              <div>
                <label className="block text-gray-700 font-bold mb-1">সংস্থার নাম (শীর্ষ শিরোনাম):</label>
                <input
                  type="text"
                  value={orgTitle}
                  onChange={(e) => setOrgTitle(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg font-bold"
                />
              </div>
              <div>
                <label className="block text-gray-700 font-bold mb-1">ঠিকানা / সাব-টাইটেল:</label>
                <input
                  type="text"
                  value={orgSubtitle}
                  onChange={(e) => setOrgSubtitle(e.target.value)}
                  className="w-full p-2 bg-white border border-gray-300 rounded-lg"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* =========================================================================
          THE MAIN STATEMENT CANVAS (Exact Replica of the Provided Image Model)
          ========================================================================= */}
      <div className="bg-white border border-gray-300 rounded-2xl p-3 sm:p-8 shadow-md print:shadow-none print:border-none print:p-0">
        <div
          id="mahfil-annual-ledger-sheet"
          className="bg-white text-black p-4 sm:p-8 max-w-4xl mx-auto font-sans space-y-4 print:p-0 print:max-w-full"
        >
          {/* Header Section (Logo on Left of Heading) */}
          <div className="flex items-center justify-center space-x-3 sm:space-x-4 pb-2">
            <div className="shrink-0">
              <img
                src={logo}
                onError={handleLogoError}
                alt="Logo"
                className="h-14 w-14 sm:h-18 sm:w-18 object-contain rounded-full shadow-sm bg-white border border-emerald-100 p-0.5"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="text-left space-y-0.5">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-[#04433b] tracking-tight leading-tight">
                {orgTitle}
              </h1>
              <p className="text-xs sm:text-sm font-bold text-gray-700">
                {orgSubtitle}
              </p>
            </div>
          </div>

          {/* Statement Metadata Bar */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center text-xs font-bold text-gray-800 pt-3 pb-2 border-t border-gray-300">
            <div className="flex items-center space-x-1">
              <span className="text-black font-extrabold">বিবরণী:</span>
              <span className="text-black font-bold">
                বার্ষিক আয়-ব্যয় বিবরণী
              </span>
              <span className="text-gray-600 font-normal">
                (হিসাব কাল:{' '}
                {selectedYear === 'all'
                  ? 'সকল হিসাব কাল'
                  : `${toBanglaNum(selectedYear)} সন`}
                )
              </span>
            </div>
            <div className="text-gray-700 mt-1 sm:mt-0">
              <span>মুদ্রণ তারিখ: {getCurrentBanglaDate()}</span>
            </div>
          </div>

          {/* Helpful Guidance when no general records for selected year */}
          {incomes.length === 0 && expenses.length === 0 && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-amber-900 text-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 print:hidden shadow-xs">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-5 w-5 text-amber-600 shrink-0" />
                <div>
                  <div className="font-bold text-sm text-amber-950">
                    {selectedYear === 'all' ? 'কোনো সাধারণ আয়-ব্যয় পাওয়া যায়নি' : `${toBanglaNum(selectedYear)} সনের সাধারণ আয়-ব্যয় পাওয়া যায়নি`}
                  </div>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    বাড়ি ভিত্তিক ব্যক্তিদের চাঁদা সাধারণ রিপোর্ট থেকে পৃথক রাখা হয়েছে। এই হিসাব কালের সাধারণ আয়-ব্যয় ম্যানুয়ালি পোস্টিং করতে নিচের বাটনটি ব্যবহার করুন।
                  </p>
                </div>
              </div>
              {onOpenManualPosting && (
                <button
                  type="button"
                  onClick={() => onOpenManualPosting(selectedYear !== 'all' ? selectedYear : undefined)}
                  className="px-3.5 py-1.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs shrink-0 cursor-pointer shadow-xs transition"
                >
                  + ম্যানুয়াল পোস্টিং করুন
                </button>
              )}
            </div>
          )}

          {/* THE OFFICIAL ACCOUNTING LEDGER TABLE (Dark Teal / Forest Green Outer Frame) */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse border-2 border-[#0f766e] text-xs sm:text-sm text-left">
              {/* Header Row */}
              <thead>
                <tr className="bg-[#e6f4ea] border-b-2 border-[#0f766e] font-extrabold text-[#064e3b] text-center">
                  <th className="py-2.5 px-2 border-r border-[#0f766e] w-12 sm:w-16">
                    ক্রমিক
                  </th>
                  <th className="py-2.5 px-2 border-r border-[#0f766e] w-24 sm:w-28">
                    তারিখ
                  </th>
                  <th className="py-2.5 px-3 border-r border-[#0f766e] text-left">
                    বিবরণ
                  </th>
                  <th className="py-2.5 px-2 border-r border-[#0f766e] text-right w-24 sm:w-32">
                    টাকা
                  </th>
                  <th className="py-2.5 px-2 border-r border-[#0f766e] text-center w-24 sm:w-32">
                    উপ-মোট
                  </th>
                  <th className="py-2.5 px-3 text-right w-28 sm:w-36">
                    মোট টাকা
                  </th>
                </tr>
              </thead>

              <tbody>
                {/* 1. SECTION (ক): আয় সমূহ: */}
                <tr className="border-b border-[#0f766e]">
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center"></td>
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center"></td>
                  <td
                    className="py-2 px-3 border-r border-[#0f766e] font-black text-[#04433b] text-sm tracking-wide"
                  >
                    (ক) আয় সমূহ:
                  </td>
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400"></td>
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400"></td>
                  <td className="py-2 px-3 text-right text-gray-400"></td>
                </tr>

                {/* Income List (Detailed or Category) */}
                {reportMode === 'detailed' ? (
                  incomes.length > 0 ? (
                    incomes.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-[#0f766e] hover:bg-emerald-50/20"
                      >
                        <td className="py-2 px-2 border-r border-[#0f766e] text-center font-semibold text-gray-800">
                          {toBanglaNum(slCounter++)}
                        </td>
                        <td className="py-2 px-2 border-r border-[#0f766e] text-center font-mono text-gray-800 text-xs">
                          {toBanglaDate(t.date)}
                        </td>
                        <td className="py-2 px-3 border-r border-[#0f766e] text-gray-900">
                          <div className="font-bold text-gray-950">
                            {t.category}
                            {t.donorName && !t.category.includes(t.donorName) && (
                              <span className="font-semibold text-gray-800 ml-1">
                                {t.donorName}
                              </span>
                            )}
                          </div>
                          {t.description && (
                            <div className="text-[11px] text-gray-600 font-light mt-0.5">
                              {t.description}
                              {t.receiptNo && (
                                <span className="ml-1 text-[10px] text-gray-400">
                                  [রশিদ নং: {toBanglaNum(t.receiptNo)}]
                                </span>
                              )}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 border-r border-[#0f766e] text-right font-bold font-mono text-gray-950">
                          {toBanglaNum(t.amount.toLocaleString('bn-BD'))}
                        </td>
                        <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400">
                          -
                        </td>
                        <td className="py-2 px-3 text-center text-gray-400">-</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-[#0f766e]">
                      <td
                        colSpan={6}
                        className="py-3 text-center text-gray-500 italic"
                      >
                        কোনো আয়ের রেকর্ড পাওয়া যায়নি
                      </td>
                    </tr>
                  )
                ) : (
                  categoryIncomes.map((cat) => (
                    <tr
                      key={cat.category}
                      className="border-b border-[#0f766e] hover:bg-emerald-50/20"
                    >
                      <td className="py-2 px-2 border-r border-[#0f766e] text-center font-semibold text-gray-800">
                        {toBanglaNum(slCounter++)}
                      </td>
                      <td className="py-2 px-2 border-r border-[#0f766e] text-center font-mono text-gray-800 text-xs">
                        {toBanglaDate(cat.latestDate)}
                      </td>
                      <td className="py-2 px-3 border-r border-[#0f766e] text-gray-900">
                        <span className="font-bold text-gray-950">
                          {cat.category} বাবদ সংগ্রহ
                        </span>
                        <span className="text-[11px] text-gray-500 ml-2">
                          ({toBanglaNum(cat.count)} টি ভাউচার)
                        </span>
                      </td>
                      <td className="py-2 px-2 border-r border-[#0f766e] text-right font-bold font-mono text-gray-950">
                        {toBanglaNum(cat.amount.toLocaleString('bn-BD'))}
                      </td>
                      <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400">
                        -
                      </td>
                      <td className="py-2 px-3 text-center text-gray-400">-</td>
                    </tr>
                  ))
                )}

                {/* Sub-total Income Row */}
                <tr className="border-b-2 border-[#0f766e] font-black text-gray-950">
                  <td className="py-2.5 px-2 border-r border-[#0f766e]"></td>
                  <td className="py-2.5 px-2 border-r border-[#0f766e]"></td>
                  <td className="py-2.5 px-3 border-r border-[#0f766e]"></td>
                  <td className="py-2.5 px-2 border-r border-[#0f766e] text-right font-black text-[#04433b]">
                    মোট আয়
                  </td>
                  <td className="py-2.5 px-2 border-r border-[#0f766e] text-right font-black font-mono text-[#04433b] bg-emerald-50/50">
                    {toBanglaNum(totalIncome.toLocaleString('bn-BD'))}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-400">-</td>
                </tr>

                {/* 2. SECTION (খ): ব্যয় সমূহ: */}
                <tr className="border-b border-[#0f766e]">
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center"></td>
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center"></td>
                  <td
                    className="py-2 px-3 border-r border-[#0f766e] font-black text-red-800 text-sm tracking-wide"
                  >
                    (খ) ব্যয় সমূহ:
                  </td>
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400"></td>
                  <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400"></td>
                  <td className="py-2 px-3 text-right text-gray-400"></td>
                </tr>

                {/* Expense List (Detailed or Category) */}
                {reportMode === 'detailed' ? (
                  expenses.length > 0 ? (
                    expenses.map((t) => (
                      <tr
                        key={t.id}
                        className="border-b border-[#0f766e] hover:bg-rose-50/20"
                      >
                        <td className="py-2 px-2 border-r border-[#0f766e] text-center font-semibold text-gray-800">
                          {toBanglaNum(slCounter++)}
                        </td>
                        <td className="py-2 px-2 border-r border-[#0f766e] text-center font-mono text-gray-800 text-xs">
                          {toBanglaDate(t.date)}
                        </td>
                        <td className="py-2 px-3 border-r border-[#0f766e] text-gray-900">
                          <div className="font-bold text-gray-950">
                            {t.category}
                          </div>
                          {t.description && (
                            <div className="text-[11px] text-gray-600 font-light mt-0.5">
                              {t.description}
                            </div>
                          )}
                        </td>
                        <td className="py-2 px-2 border-r border-[#0f766e] text-right font-bold font-mono text-gray-950">
                          {toBanglaNum(t.amount.toLocaleString('bn-BD'))}
                        </td>
                        <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400">
                          -
                        </td>
                        <td className="py-2 px-3 text-center text-gray-400">-</td>
                      </tr>
                    ))
                  ) : (
                    <tr className="border-b border-[#0f766e]">
                      <td
                        colSpan={6}
                        className="py-3 text-center text-gray-500 italic"
                      >
                        কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি
                      </td>
                    </tr>
                  )
                ) : (
                  categoryExpenses.map((cat) => (
                    <tr
                      key={cat.category}
                      className="border-b border-[#0f766e] hover:bg-rose-50/20"
                    >
                      <td className="py-2 px-2 border-r border-[#0f766e] text-center font-semibold text-gray-800">
                        {toBanglaNum(slCounter++)}
                      </td>
                      <td className="py-2 px-2 border-r border-[#0f766e] text-center font-mono text-gray-800 text-xs">
                        {toBanglaDate(cat.latestDate)}
                      </td>
                      <td className="py-2 px-3 border-r border-[#0f766e] text-gray-900">
                        <span className="font-bold text-gray-950">
                          {cat.category} বাবদ খরচ
                        </span>
                        <span className="text-[11px] text-gray-500 ml-2">
                          ({toBanglaNum(cat.count)} টি এন্ট্রি)
                        </span>
                      </td>
                      <td className="py-2 px-2 border-r border-[#0f766e] text-right font-bold font-mono text-gray-950">
                        {toBanglaNum(cat.amount.toLocaleString('bn-BD'))}
                      </td>
                      <td className="py-2 px-2 border-r border-[#0f766e] text-center text-gray-400">
                        -
                      </td>
                      <td className="py-2 px-3 text-center text-gray-400">-</td>
                    </tr>
                  ))
                )}

                {/* Sub-total Expense Row */}
                <tr className="border-b-2 border-[#0f766e] font-black text-gray-950">
                  <td className="py-2.5 px-2 border-r border-[#0f766e]"></td>
                  <td className="py-2.5 px-2 border-r border-[#0f766e]"></td>
                  <td className="py-2.5 px-3 border-r border-[#0f766e]"></td>
                  <td className="py-2.5 px-2 border-r border-[#0f766e] text-right font-black text-[#04433b]">
                    মোট ব্যয়
                  </td>
                  <td className="py-2.5 px-2 border-r border-[#0f766e] text-right font-black font-mono text-red-800 bg-rose-50/50">
                    {toBanglaNum(totalExpense.toLocaleString('bn-BD'))}
                  </td>
                  <td className="py-2.5 px-3 text-center text-gray-400">-</td>
                </tr>

                {/* 3. DYNAMIC SURPLUS OR DEFICIT ROW (মোট আয়/উদ্ধিত অথবা মোট ঘাটতি/ব্যয়) */}
                <tr className="border-b-2 border-[#0f766e] font-black text-gray-950">
                  <td className="py-3 px-2 border-r border-[#0f766e]"></td>
                  <td className="py-3 px-2 border-r border-[#0f766e]"></td>
                  <td
                    colSpan={3}
                    className="py-3 px-3 border-r border-[#0f766e] font-extrabold text-[#04433b] text-sm"
                  >
                    {netProfitOrSurplus >= 0 ? 'মোট আয়/উদ্ধিত' : 'মোট ঘাটতি/ব্যয়'}
                  </td>
                  <td className={`py-3 px-3 text-right font-black font-mono text-base ${netProfitOrSurplus >= 0 ? 'text-[#0f766e]' : 'text-red-700'}`}>
                    <span className="pb-0.5 inline-block">
                      {toBanglaNum(Math.abs(netProfitOrSurplus).toLocaleString('bn-BD'))}
                    </span>
                  </td>
                </tr>

                {/* 4. PREVIOUS YEAR BALANCE ROW (বিগত বছরের আয়/হাতে নগদ (সাল সন)) - If exists */}
                {includePriorBalance && priorBalanceAmount !== 0 && (
                  <tr className="border-b-2 border-[#0f766e] font-black text-gray-950">
                    <td className="py-3 px-2 border-r border-[#0f766e]"></td>
                    <td className="py-3 px-2 border-r border-[#0f766e]"></td>
                    <td
                      colSpan={3}
                      className="py-3 px-3 border-r border-[#0f766e] font-extrabold text-[#04433b] text-sm"
                    >
                      বিগত বছরের আয়/হাতে নগদ ({toBanglaNum(priorYearLabel || 'বিগত')} সন)
                    </td>
                    <td className="py-3 px-3 text-right font-black font-mono text-base text-gray-950">
                      <span className="pb-0.5 inline-block">
                        {toBanglaNum(priorBalanceAmount.toLocaleString('bn-BD'))}
                      </span>
                    </td>
                  </tr>
                )}

                {/* 5. FINAL NET SUMMARY ROW (বর্তমান নিট হাতে নগদ / নীট আয়/ব্যয়) with Double Underline */}
                <tr className="font-black text-gray-950 bg-emerald-50/40">
                  <td className="py-3.5 px-2 border-r border-[#0f766e]"></td>
                  <td className="py-3.5 px-2 border-r border-[#0f766e]"></td>
                  <td
                    colSpan={3}
                    className="py-3.5 px-3 border-r border-[#0f766e] font-extrabold text-[#04433b] text-base"
                  >
                    {includePriorBalance && priorBalanceAmount !== 0
                      ? 'বর্তমান নিট হাতে নগদ'
                      : 'নীট আয়/ব্যয়'}
                  </td>
                  <td className={`py-3.5 px-3 text-right font-black font-mono text-lg ${currentNetCashInHand >= 0 ? 'text-[#0f766e]' : 'text-red-700'}`}>
                    <span className="border-b-4 border-double border-[#0f766e] pb-0.5 inline-block">
                      {currentNetCashInHand >= 0 ? (
                        `${toBanglaNum(currentNetCashInHand.toLocaleString('bn-BD'))}`
                      ) : (
                        `-${toBanglaNum(Math.abs(currentNetCashInHand).toLocaleString('bn-BD'))}`
                      )}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* SIGNATURES FOOTER (Exact Match with Image Bottom) */}
          <div className="grid grid-cols-2 gap-8 pt-16 sm:pt-20 text-center text-xs font-bold text-gray-900">
            {/* Left: Cashier Signature */}
            <div className="space-y-1">
              <div className="w-48 sm:w-56 mx-auto border-t-2 border-gray-400 mb-2"></div>
              <p className="font-black text-sm text-gray-950">ক্যাশিয়ার স্বাক্ষর</p>
            </div>

            {/* Right: General Secretary */}
            <div className="space-y-1">
              <div className="w-48 sm:w-56 mx-auto border-t-2 border-gray-400 mb-2"></div>
              <p className="font-black text-sm text-gray-950">সাধারণ সম্পাদক</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Password Verification Modal */}
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
                  <p className="text-xs text-gray-500 font-medium">রিপোর্ট ডাউনলোড বা প্রিন্ট করতে অ্যাডমিন অনুমোদন প্রয়োজন</p>
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
              নিরাপত্তা স্বার্থে পূর্ণাঙ্গ বার্ষিক আয়-ব্যয় খতিয়ান রিপোর্ট পিডিএফ/ছবি আকারে ডাউনলোড ও প্রিন্ট করতে অ্যাডমিন পাসওয়ার্ড প্রদান করুন।
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
