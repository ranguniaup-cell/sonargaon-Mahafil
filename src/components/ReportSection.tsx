import React from 'react';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { FileText, TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Award, PieChart, BarChart2, Download, Printer, RefreshCw, BookOpen, Table, Sparkles, FileSpreadsheet, CheckCircle2, ShieldCheck, Lock, KeyRound, AlertCircle, Globe, CheckCircle, Coins, PlusCircle } from 'lucide-react';
import { Transaction, MahfilDetails } from '../types';
import AnnualLedgerReport from './AnnualLedgerReport';
import ReportPdfExportModal from './ReportPdfExportModal';
import FinancialSummaryPoster from './FinancialSummaryPoster';
import CollectionDayNoteReport from './CollectionDayNoteReport';
import ManualFinancialPostingModal from './ManualFinancialPostingModal';
import {
  isHouseCollection,
  filterGeneralFinancialTransactions,
  getTransactionYear,
  sortTransactionsFIFO
} from '../lib/transactionUtils';
import { jsPDF } from 'jspdf';
import { renderSafeCanvas, exportElementToPdf } from '../utils/html2canvasSafe';

// Translate English digits to Bengali digits
const toBanglaNum = (num: number | string): string => {
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
};

interface ReportSectionProps {
  transactions: Transaction[];
  mahfilDetails?: MahfilDetails;
  isAdminLoggedIn?: boolean;
  isReportPublic?: boolean;
  isFinancePublic?: boolean;
  onToggleReportPublic?: (val: boolean) => void;
  onToggleFinancePublic?: (val: boolean) => void;
  setIsAdminLoggedIn?: (status: boolean) => void;
  onAddTransaction?: (newT: Omit<Transaction, 'id'>) => Promise<void> | void;
  onBatchAddTransactions?: (items: Omit<Transaction, 'id'>[]) => Promise<void> | void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  onUpdateTransaction?: (id: string, updated: Partial<Transaction>) => Promise<void> | void;
}

interface ReportData {
  year: string;
  key: string;
  totalIncome: number;
  totalExpense: number;
  surplus: number;
  openingBalance?: number;
  totalFund?: number;
  cumulative?: number;
  attendance: string;
  majorDonors: { name: string; amount: number; location: string }[];
  breakdown: { category: string; amount: number; percentage: number }[];
}

// Helper to convert OKLCH color strings to standard RGB/RGBA values
// This prevents html2canvas from crashing when parsing modern OKLCH styles
function oklchToRgb(oklchStr: string): string {
  try {
    const cleaned = oklchStr.replace(/oklch\(([^)]+)\)/i, '$1').trim();
    const parts = cleaned.split(/[\s/]+/);
    if (parts.length < 3) return 'rgb(0,0,0)';

    let L = parseFloat(parts[0]);
    if (parts[0].includes('%')) {
      L = parseFloat(parts[0]) / 100;
    }
    const C = parseFloat(parts[1]);
    let H = parseFloat(parts[2]);
    if (parts[2].includes('deg')) {
      H = parseFloat(parts[2]);
    } else if (parts[2].includes('rad')) {
      H = parseFloat(parts[2]) * (180 / Math.PI);
    } else if (parts[2].includes('grad')) {
      H = parseFloat(parts[2]) * 0.9;
    } else if (parts[2].includes('turn')) {
      H = parseFloat(parts[2]) * 360;
    }

    const alpha = parts[3] ? parseFloat(parts[3]) : 1;

    const hRad = (H * Math.PI) / 180;
    const a = C * Math.cos(hRad);
    const b = C * Math.sin(hRad);

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855414 * b;

    const l_cube = l_ * l_ * l_;
    const m_cube = m_ * m_ * m_;
    const s_cube = s_ * s_ * s_;

    let r = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    let g = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    let b_val = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

    const getSrgb = (c: number) => {
      if (c > 0.0031308) {
        return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      }
      return 12.92 * c;
    };

    r = Math.max(0, Math.min(1, getSrgb(r)));
    g = Math.max(0, Math.min(1, getSrgb(g)));
    b_val = Math.max(0, Math.min(1, getSrgb(b_val)));

    const r255 = Math.round(r * 255);
    const g255 = Math.round(g * 255);
    const b255 = Math.round(b_val * 255);

    if (parts[3] !== undefined) {
      return `rgba(${r255}, ${g255}, ${b255}, ${alpha})`;
    }
    return `rgb(${r255}, ${g255}, ${b255})`;
  } catch (err) {
    return 'rgb(120,120,120)';
  }
}

// Helper to convert OKLAB color strings to standard RGB/RGBA values
// This prevents html2canvas from crashing when parsing modern OKLAB styles
function oklabToRgb(oklabStr: string): string {
  try {
    const cleaned = oklabStr.replace(/oklab\(([^)]+)\)/i, '$1').trim();
    const parts = cleaned.split(/[\s/]+/);
    if (parts.length < 3) return 'rgb(0,0,0)';

    let L = parseFloat(parts[0]);
    if (parts[0].includes('%')) {
      L = parseFloat(parts[0]) / 100;
    }
    const a = parseFloat(parts[1]);
    const b = parseFloat(parts[2]);

    const alpha = parts[3] ? parseFloat(parts[3]) : 1;

    const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
    const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
    const s_ = L - 0.0894841775 * a - 1.2914855414 * b;

    const l_cube = l_ * l_ * l_;
    const m_cube = m_ * m_ * m_;
    const s_cube = s_ * s_ * s_;

    let r = +4.0767416621 * l_cube - 3.3077115913 * m_cube + 0.2309699292 * s_cube;
    let g = -1.2684380046 * l_cube + 2.6097574011 * m_cube - 0.3413193965 * s_cube;
    let b_val = -0.0041960863 * l_cube - 0.7034186147 * m_cube + 1.7076147010 * s_cube;

    const getSrgb = (c: number) => {
      if (c > 0.0031308) {
        return 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
      }
      return 12.92 * c;
    };

    r = Math.max(0, Math.min(1, getSrgb(r)));
    g = Math.max(0, Math.min(1, getSrgb(g)));
    b_val = Math.max(0, Math.min(1, getSrgb(b_val)));

    const r255 = Math.round(r * 255);
    const g255 = Math.round(g * 255);
    const b255 = Math.round(b_val * 255);

    if (parts[3] !== undefined) {
      return `rgba(${r255}, ${g255}, ${b255}, ${alpha})`;
    }
    return `rgb(${r255}, ${g255}, ${b255})`;
  } catch (err) {
    return 'rgb(120,120,120)';
  }
}

export default function ReportSection({
  transactions = [],
  mahfilDetails,
  isAdminLoggedIn = false,
  isReportPublic = false,
  isFinancePublic = false,
  onToggleReportPublic,
  onToggleFinancePublic,
  setIsAdminLoggedIn,
  onAddTransaction,
  onBatchAddTransactions,
  onDeleteTransaction,
  onUpdateTransaction
}: ReportSectionProps) {
  const [selectedYear, setSelectedYear] = React.useState<string>('all');
  const [isDownloading, setIsDownloading] = React.useState(false);
  const [activeTab, setActiveTab] = React.useState<'summary-poster' | 'statement' | 'day-note' | 'annual' | 'monthly' | 'export-center'>('day-note');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [isMonthlyDownloading, setIsMonthlyDownloading] = React.useState(false);
  const [showPdfExportModal, setShowPdfExportModal] = React.useState<boolean>(false);
  const [modalInitialYear, setModalInitialYear] = React.useState<string>('all');
  const [modalInitialReportType, setModalInitialReportType] = React.useState<'statement' | 'monthly' | 'annual' | 'transactions'>('statement');

  // Manual financial posting state and house collection exclusion filter
  const [excludeHouseCollections, setExcludeHouseCollections] = React.useState<boolean>(true);
  const [showManualPostingModal, setShowManualPostingModal] = React.useState<boolean>(false);
  const [manualPostingInitialYear, setManualPostingInitialYear] = React.useState<string>('2026');

  // Filter out house collections from general accounting reports by default
  const generalTransactions = React.useMemo(() => {
    return excludeHouseCollections ? filterGeneralFinancialTransactions(transactions) : transactions;
  }, [transactions, excludeHouseCollections]);

  // Admin password unlock for restricted view
  const [adminPasswordInput, setAdminPasswordInput] = React.useState('');
  const [adminAuthError, setAdminAuthError] = React.useState('');

  const isApprovedPublic = Boolean(isReportPublic);
  const isAuthorized = isAdminLoggedIn || isApprovedPublic;

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'T@a546195') {
      sessionStorage.setItem('mahfil_admin_logged', 'true');
      if (setIsAdminLoggedIn) {
        setIsAdminLoggedIn(true);
      }
      setAdminPasswordInput('');
      setAdminAuthError('');
    } else {
      setAdminAuthError('পাসওয়ার্ড সঠিক নয়! শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিন রিপোর্ট দেখতে বা অনুমোদন করতে পারবেন।');
    }
  };

  const handleOpenYearExportModal = (yearKey: string, reportType: 'statement' | 'monthly' | 'annual' | 'transactions' = 'statement') => {
    setSelectedYear(yearKey);
    setModalInitialYear(yearKey);
    setModalInitialReportType(reportType);
    setShowPdfExportModal(true);
  };

  // Dynamic list of unique year-months from transactions
  const uniqueMonths = React.useMemo(() => {
    const monthsSet = new Set<string>();
    generalTransactions.forEach(t => {
      if (t.date) {
        const parts = t.date.split('-');
        if (parts.length >= 2) {
          monthsSet.add(`${parts[0]}-${parts[1]}`);
        }
      }
    });
    return Array.from(monthsSet).sort((a, b) => b.localeCompare(a)); // Newest first
  }, [generalTransactions]);

  React.useEffect(() => {
    if (uniqueMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(uniqueMonths[0]);
    }
  }, [uniqueMonths, selectedMonth]);

  const formatBanglaMonthYear = (ymStr: string): string => {
    const parts = ymStr.split('-');
    if (parts.length < 2) return ymStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1]) - 1;
    const bengaliMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${bengaliMonths[monthIdx]} ${toBanglaNum(year)}`;
  };

  const selectedMonthData = React.useMemo(() => {
    if (!selectedMonth) return null;
    const [targetYear, targetMonth] = selectedMonth.split('-');
    
    const monthTransactions = generalTransactions.filter(t => {
      if (!t.date) return false;
      const parts = t.date.split('-');
      return parts[0] === targetYear && parts[1] === targetMonth;
    });

    const incomes = monthTransactions.filter(t => t.type === 'income');
    const expenses = monthTransactions.filter(t => t.type === 'expense');

    const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
    const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
    const surplus = totalIncome - totalExpense;

    const incomeGroups: Record<string, number> = {};
    incomes.forEach(t => {
      const cat = t.category || 'অন্যান্য';
      incomeGroups[cat] = (incomeGroups[cat] || 0) + t.amount;
    });

    const expenseGroups: Record<string, number> = {};
    expenses.forEach(t => {
      const cat = t.category || 'অন্যান্য';
      expenseGroups[cat] = (expenseGroups[cat] || 0) + t.amount;
    });

    const incomeBreakdown = Object.entries(incomeGroups).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);

    const expenseBreakdown = Object.entries(expenseGroups).map(([category, amount]) => ({
      category,
      amount
    })).sort((a, b) => b.amount - a.amount);

    return {
      monthYearLabel: formatBanglaMonthYear(selectedMonth),
      totalIncome,
      totalExpense,
      surplus,
      incomeBreakdown,
      expenseBreakdown,
      transactions: sortTransactionsFIFO(monthTransactions)
    };
  }, [selectedMonth, generalTransactions]);

  const handleDownloadMonthlyPDF = async () => {
    const printArea = document.getElementById('monthly-report-print-area');
    if (!printArea) return;

    setIsMonthlyDownloading(true);
    try {
      await exportElementToPdf(printArea, {
        fileName: `monthly-financial-report-${selectedMonth || 'all'}.pdf`,
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        scale: 2.5
      });
    } catch (error) {
      console.error('Error exporting Monthly PDF:', error);
      alert('পিডিএফ ফাইল তৈরিতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsMonthlyDownloading(false);
    }
  };

  // Dynamic reports generator based on current live general transactions (excluding house collections)
  const historicalReports: ReportData[] = React.useMemo(() => {
    const validYears = generalTransactions.map((t) => getTransactionYear(t));
    const years = Array.from(new Set<number>(validYears)).sort((a: number, b: number) => b - a);
    
    const attendanceMap: Record<number, string> = {
      2025: '৮,০০০+ জন',
      2024: '৬,৫০০+ জন',
      2023: '৫,০০০+ জন'
    };

    const hijriYears: Record<number, string> = {
      2023: '২০২৩ (১৪৪৫ হিজরী)',
      2024: '২০২৪ (১৪৪৬ হিজরী)',
      2025: '২০২৫ (১৪৪৭ হিজরী)',
      2026: '২০২৬ (১৪৪৮ হিজরী)',
      2027: '২০২৭ (১৪৪৯ হিজরী)'
    };

    // Calculate cumulative opening balance starting from 2023
    const sortedYearsAsc = [...years].sort((a, b) => a - b);
    const openingMap: Record<number, number> = {};
    const cumulativeMap: Record<number, number> = {};
    let runningCumulative = 0;
    sortedYearsAsc.forEach((yr) => {
      openingMap[yr] = runningCumulative;
      const yrTrans = generalTransactions.filter((t) => getTransactionYear(t) === yr);
      const inc = yrTrans.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
      const exp = yrTrans.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
      runningCumulative += (inc - exp);
      cumulativeMap[yr] = runningCumulative;
    });

    return years.map(yr => {
      const yrTrans = sortTransactionsFIFO(generalTransactions.filter(t => getTransactionYear(t) === yr));
      
      const incomes = yrTrans.filter(t => t.type === 'income');
      const expenses = yrTrans.filter(t => t.type === 'expense');
      
      const totalIncome = incomes.reduce((sum, t) => sum + t.amount, 0);
      const totalExpense = expenses.reduce((sum, t) => sum + t.amount, 0);
      const surplus = totalIncome - totalExpense;
      const openingBalance = openingMap[yr] || 0;
      const totalFund = openingBalance + totalIncome;
      const cumulative = cumulativeMap[yr] || surplus;
      
      // Group expenses by category
      const expenseGroups: Record<string, number> = {};
      expenses.forEach(t => {
        const cat = t.category || 'অন্যান্য';
        expenseGroups[cat] = (expenseGroups[cat] || 0) + t.amount;
      });
      
      const breakdown = Object.entries(expenseGroups)
        .map(([category, amount]) => {
          const percentage = totalExpense > 0 ? Math.round((amount / totalExpense) * 1000) / 10 : 0;
          return { category, amount, percentage };
        })
        .sort((a, b) => b.amount - a.amount);
        
      // Top 3 donors by income amount
      const majorDonors = incomes
        .filter(t => t.amount > 0)
        .sort((a, b) => b.amount - a.amount)
        .slice(0, 3)
        .map(t => ({
          name: t.donorName || t.category || 'বেনামী দাতা',
          amount: t.amount,
          location: t.category === 'সদস্য চাঁদা' ? 'সদস্য সংগ্রহ' : 'অনূদান'
        }));
        
      return {
        year: hijriYears[yr] || `${toBanglaNum(yr)} খ্রি.`,
        key: yr.toString(),
        totalIncome,
        totalExpense,
        surplus,
        openingBalance,
        totalFund,
        cumulative,
        attendance: attendanceMap[yr] || '--- জন',
        majorDonors,
        breakdown
      };
    });
  }, [generalTransactions]);

  // Filtering reports based on selected year
  const displayedReports = selectedYear === 'all' 
    ? historicalReports 
    : historicalReports.filter(r => r.key === selectedYear);

  // Aggregated Values for Summary
  const overallIncome = historicalReports.reduce((sum, r) => sum + r.totalIncome, 0);
  const overallExpense = historicalReports.reduce((sum, r) => sum + r.totalExpense, 0);
  const overallSurplus = historicalReports.reduce((sum, r) => sum + r.surplus, 0);

  // Printed Statistics for Print Copy
  const printedIncome = selectedYear === 'all' ? overallIncome : (displayedReports[0]?.totalIncome || 0);
  const printedExpense = selectedYear === 'all' ? overallExpense : (displayedReports[0]?.totalExpense || 0);
  const printedSurplus = selectedYear === 'all' ? overallSurplus : (displayedReports[0]?.surplus || 0);

  // Printable Area handler
  const handlePrintReport = () => {
    window.print();
  };

  // High-Quality PDF Downloader
  const handleDownloadPDF = async () => {
    const printArea = document.getElementById('report-print-area');
    if (!printArea) return;

    setIsDownloading(true);
    try {
      await exportElementToPdf(printArea, {
        fileName: `financial-report-${selectedYear}.pdf`,
        format: 'a4',
        orientation: 'portrait',
        margin: 6,
        scale: 2.5
      });
    } catch (error) {
      console.error('Error exporting PDF:', error);
      alert('পিডিএফ ফাইল তৈরিতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!isAuthorized) {
    return (
      <div id="report-locked-view" className="space-y-8 animate-fade-in text-[#3c3c3c] py-6 max-w-3xl mx-auto">
        <div className="bg-white border-2 border-amber-300 rounded-3xl p-6 sm:p-10 text-center shadow-lg space-y-6">
          <div className="mx-auto w-16 h-16 bg-amber-100 text-amber-800 rounded-2xl flex items-center justify-center border border-amber-300 shadow-inner">
            <Lock className="h-8 w-8" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-100/80 text-amber-900 border border-amber-300 rounded-full text-xs font-bold">
              <Lock className="h-3.5 w-3.5 text-amber-700" />
              <span>অ্যাডমিন অনুমোদন সাপেক্ষে উন্মুক্ত</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-[#064e3b]">
              রিপোর্ট ও অডিট বিবরণী মেনু
            </h2>
            <p className="text-sm text-slate-600 max-w-lg mx-auto leading-relaxed">
              পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদের বাৎসরিক অডিট রিপোর্ট, খতিয়ান শিট এবং পিডিএফ ডাউনলোড কেন্দ্রটি বর্তমানে অ্যাডমিন অনুমোদনের অপেক্ষায় রয়েছে।
            </p>
          </div>

          <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl max-w-md mx-auto text-left space-y-2 text-xs text-slate-600">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>অ্যাডমিন অনুমোদন দিলেই সর্বসাধারণের জন্য রিপোর্ট উন্মুক্ত হবে</span>
            </div>
            <div className="flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>লেজার শিট, মাসিক প্রতিবেদন ও পিডিএফ ডাউনলোড সরাসরি চালু হবে</span>
            </div>
          </div>

          {/* Quick Admin Login Box */}
          <div className="bg-[#f8fafc] border border-[#cbd5e1] rounded-2xl p-5 max-w-md mx-auto space-y-4">
            <div className="flex items-center justify-center space-x-2 text-xs font-bold text-[#064e3b]">
              <KeyRound className="h-4 w-4 text-[#0f766e]" />
              <span>অ্যাডমিন লগইন ও অনুমোদন প্রদান</span>
            </div>

            <form onSubmit={handleAdminAuthSubmit} className="space-y-3">
              <div>
                <input
                  id="admin-report-unlock-password"
                  type="password"
                  value={adminPasswordInput}
                  onChange={(e) => {
                    setAdminPasswordInput(e.target.value);
                    if (adminAuthError) setAdminAuthError('');
                  }}
                  placeholder="অ্যাডমিন সিকিউরিটি পাসওয়ার্ড লিখুন"
                  className="w-full px-4 py-2.5 bg-white border border-[#cbd5e1] focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl text-xs sm:text-sm outline-hidden transition text-center font-mono"
                  autoFocus
                />
              </div>

              {adminAuthError && (
                <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200 justify-center">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{adminAuthError}</span>
                </div>
              )}

              <button
                id="submit-report-admin-unlock-btn"
                type="submit"
                className="w-full py-2.5 bg-[#0f766e] hover:bg-[#064e3b] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer flex items-center justify-center space-x-2"
              >
                <KeyRound className="h-4 w-4 text-[#f59e0b]" />
                <span>লগইন করে রিপোর্ট দেখুন ও অনুমোদন দিন</span>
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="report-section" className="space-y-10 animate-fade-in text-[#3c3c3c]">
      {/* 1. Screen-Only Layout */}
      <div className="print:hidden space-y-8">
        {/* Admin Public Approval Status & Switch */}
        {isAdminLoggedIn && (
          <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
            isReportPublic 
              ? 'bg-gradient-to-r from-emerald-900 to-[#064e3b] text-white border-emerald-700' 
              : 'bg-gradient-to-r from-amber-950/90 to-slate-900 text-white border-amber-800/80'
          }`}>
            <div className="flex items-center space-x-3.5">
              <div className={`p-2.5 rounded-xl shrink-0 ${
                isReportPublic 
                  ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' 
                  : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
              }`}>
                {isReportPublic ? <Globe className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
              </div>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">রিপোর্ট মেনু পাবলিক অনুমোদন স্ট্যাটাস</span>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full ${
                    isReportPublic ? 'bg-emerald-500 text-white shadow-xs' : 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                  }`}>
                    {isReportPublic ? '🟢 সবার জন্য উন্মুক্ত (Public Approved)' : '🔒 সাধারণের জন্য অপ্রকাশিত (Admin Only)'}
                  </span>
                </div>
                <p className="text-xs text-slate-200 font-light mt-0.5">
                  {isReportPublic 
                    ? 'বর্তমানে সাধারণ দর্শকগণ এই রিপোর্ট মেনু থেকে সমস্ত লেজার শিট ও পিডিএফ ডাউনলোড করতে পারছেন।' 
                    : 'সাধারণ দর্শকরা রিপোর্ট দেখতে পারছেন না। আপনি অনুমোদন দিলে ওয়েবসাইট ভিজিটররা দেখতে ও ডাউনলোড করতে পারবে।'}
                </p>
              </div>
            </div>

            <button
              id="toggle-public-report-menu-btn"
              type="button"
              onClick={() => {
                if (onToggleReportPublic) {
                  onToggleReportPublic(!isReportPublic);
                } else if (onToggleFinancePublic) {
                  onToggleFinancePublic(!isFinancePublic);
                }
              }}
              className={`px-5 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all transform hover:scale-102 cursor-pointer flex items-center space-x-2 shrink-0 ${
                isReportPublic 
                  ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' 
                  : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
              }`}
            >
              {isReportPublic ? (
                <>
                  <Lock className="h-4 w-4" />
                  <span>রিপোর্ট লক করুন</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>পাবলিক অনুমোদন দিন</span>
                </>
              )}
            </button>
          </div>
        )}

        {/* Visual Banner */}
        <div className="relative overflow-hidden bg-gradient-to-br from-[#064e3b] to-[#0d9488] rounded-3xl p-8 sm:p-10 text-white shadow-xl">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#d97706]/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#0f766e]/20 rounded-full blur-2xl pointer-events-none"></div>
          
          <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold tracking-wider text-[#d97706] bg-[#d97706]/10 border border-[#d97706]/30 px-3 py-1 rounded-full uppercase inline-block">
                  আর্কাইভ ও আর্থিক পরিসংখ্যান
                </span>
                {isApprovedPublic && (
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 px-2.5 py-0.5 rounded-full">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>অ্যাডমিন অনুমোদিত প্রকাশ্য অডিট</span>
                  </span>
                )}
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                {activeTab === 'day-note'
                  ? 'মাহফিল চাঁদা কালেকশন ডে নোট (ডিনোমিনেশন)'
                  : activeTab === 'summary-poster'
                    ? 'হিসাবের সার সংক্ষেপ (পোস্টার / জেপিজি ছবি)'
                    : activeTab === 'statement' 
                      ? 'বার্ষিক আয়-ব্যয় বিবরণী রিপোর্ট' 
                      : activeTab === 'annual' 
                        ? 'বিগত বছরসমূহের পরিসংখ্যান ও চার্ট' 
                        : activeTab === 'monthly'
                          ? 'মাসিক আয়-ব্যয় রিপোর্ট জেনারেটর'
                          : 'রিপোর্ট ডাউনলোড কেন্দ্র'
                }
              </h1>
              <p className="text-[#e2e8f0]/80 text-xs sm:text-sm font-light max-w-xl leading-relaxed">
                {activeTab === 'day-note'
                  ? '২০২৬ সালের মাহফিল সহ প্রতিটি বছরের সংগৃহীত চাঁদার টাকার পরিমাণ ভিত্তিক স্ল্যাব (যেমনঃ ২০,০০০ টাকা কতজন, ১০,০০০ টাকা কতজন) বিশ্লেষণ ও সম্পূর্ণ ডে নোট।'
                  : activeTab === 'summary-poster'
                    ? 'পবিত্র ঈদ-এ মিলাদুন্নবী (সা.)-এর সুবিন্যস্ত ব্যয়ের হিসাব, আয়ের হিসাব (স্ল্যাবভিত্তিক), সারসংক্ষেপ ও জমার হিসাব সম্বলিত অফিসিয়াল ব্যানার। এক ক্লিকে এইচডি জেপিজি (JPG) ছবি ডাউনলোড করুন।'
                    : activeTab === 'statement'
                      ? 'পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদের প্রাতিষ্ঠানিক খতিয়ান শিট। প্রতিটি খাতের আয়-ব্যয়, নীট উদ্বৃত্ত ও তহবিল স্থিতির নির্ভুল ও সুবিন্যস্ত বিবরণী।'
                      : activeTab === 'annual' 
                        ? 'বিগত বছরগুলোর আজিমুশশান মাহফিলের সামগ্রিক বাজেট, তাবাররুক ব্যয় এবং সম্মানিত দাতাদের অবদানের চিত্র।'
                        : 'সংগঠনের মাসিক ভিত্তিক আয়-ব্যয়ের হিসাব, খাতের বিবরণী এবং বিস্তারিত লেনদেন বিবরণী স্বয়ংক্রিয়ভাবে পিডিএফ ফাইলে ডাউনলোড করুন।'
                }
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-3 self-start md:self-center">
              <button
                id="open-manual-financial-posting-btn"
                type="button"
                onClick={() => {
                  setManualPostingInitialYear(selectedYear !== 'all' ? selectedYear : '2026');
                  setShowManualPostingModal(true);
                }}
                className="px-4 py-2.5 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-1.5"
                title="বিগত ও বর্তমান বছরের আয় ও ব্যয় সরাসরি পোস্টিং করুন"
              >
                <PlusCircle className="h-4 w-4" />
                <span>আয়-ব্যয় পোস্টিং</span>
              </button>

              <button
                id="open-pdf-modal-banner-btn"
                onClick={() => setShowPdfExportModal(true)}
                className="px-5 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-white rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-2"
              >
                <Download className="h-4 w-4" />
                <span>রিপোর্ট PDF ডাউনলোড অপশন</span>
              </button>

              {activeTab === 'day-note' ? (
                <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                  <Coins className="h-4 w-4 text-amber-300" />
                  <span>স্ল্যাব ও ডিনোমিনেশন ডে নোট সক্রিয়</span>
                </div>
              ) : activeTab === 'summary-poster' ? (
                <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>এইচডি জেপিজি ছবি প্রস্তুত</span>
                </div>
              ) : activeTab === 'statement' ? (
                <div className="flex items-center space-x-2 text-xs bg-white/10 px-3 py-2 rounded-xl backdrop-blur-sm border border-white/20">
                  <Sparkles className="h-4 w-4 text-amber-300" />
                  <span>অফিসিয়াল লেজার শিট ফরম্যাট</span>
                </div>
              ) : activeTab === 'annual' ? (
                <button
                  onClick={handlePrintReport}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs sm:text-sm font-bold border border-white/30 transition-all cursor-pointer flex items-center space-x-2 shadow-sm"
                >
                  <Printer className="h-4 w-4" />
                  <span>প্রিন্ট প্রিভিউ</span>
                </button>
              ) : activeTab === 'monthly' ? (
                <button
                  onClick={handleDownloadMonthlyPDF}
                  disabled={isMonthlyDownloading || !selectedMonth}
                  className="px-5 py-2.5 bg-white/10 hover:bg-white/20 disabled:bg-white/5 text-white rounded-xl text-xs sm:text-sm font-bold border border-white/30 transition-all cursor-pointer flex items-center space-x-2"
                >
                  {isMonthlyDownloading ? (
                    <>
                      <RefreshCw className="h-4 w-4 animate-spin" />
                      <span>পিডিএফ তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>মাসিক PDF ডাউনলোড</span>
                    </>
                  )}
                </button>
              ) : null}
            </div>
          </div>
        </div>

        {/* Report Level Tabs */}
        <div className="flex flex-wrap border-b-2 border-[#e2e8f0] gap-3 sm:gap-6">
          <button
            id="tab-day-note"
            onClick={() => setActiveTab('day-note')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'day-note'
                ? 'border-[#064e3b] text-[#064e3b] scale-102 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-[#064e3b]'
            }`}
          >
            <Coins className="h-4.5 w-4.5 text-amber-500" />
            <span>চাঁদা কালেকশন ডে নোট (ডিনোমিনেশন)</span>
            <span className="bg-amber-100 text-amber-900 text-[10px] px-2 py-0.5 rounded-full font-black border border-amber-300">
              ২০২৬ বিশেষ নোট
            </span>
          </button>
          <button
            id="tab-summary-poster"
            onClick={() => setActiveTab('summary-poster')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'summary-poster'
                ? 'border-[#064e3b] text-[#064e3b] scale-102 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-[#064e3b]'
            }`}
          >
            <Sparkles className="h-4.5 w-4.5 text-amber-500" />
            <span>হিসাবের সার সংক্ষেপ (জেপিজি ছবি)</span>
            <span className="bg-emerald-100 text-[#064e3b] text-[10px] px-2 py-0.5 rounded-full font-black border border-emerald-300">
              ছবি / ব্যানার
            </span>
          </button>
          <button
            id="tab-statement"
            onClick={() => setActiveTab('statement')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'statement'
                ? 'border-[#0f766e] text-[#0f766e] scale-102 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-[#064e3b]'
            }`}
          >
            <BookOpen className="h-4.5 w-4.5" />
            <span>বার্ষিক আয়-ব্যয় বিবরণী (লেজার শিট)</span>
          </button>
          <button
            id="tab-annual-stats"
            onClick={() => setActiveTab('annual')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'annual'
                ? 'border-[#0f766e] text-[#0f766e] scale-102 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-[#064e3b]'
            }`}
          >
            <Calendar className="h-4.5 w-4.5" />
            <span>পরিসংখ্যান ও চার্ট আর্কাইভ</span>
          </button>
          <button
            id="tab-monthly"
            onClick={() => setActiveTab('monthly')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'monthly'
                ? 'border-[#0f766e] text-[#0f766e] scale-102 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-[#064e3b]'
            }`}
          >
            <FileText className="h-4.5 w-4.5" />
            <span>মাসিক প্রতিবেদন জেনারেটর (পিডিএফ)</span>
          </button>
          <button
            id="tab-export-center"
            onClick={() => setActiveTab('export-center')}
            className={`pb-3 text-xs sm:text-sm font-bold transition-all flex items-center space-x-2 border-b-2 cursor-pointer ${
              activeTab === 'export-center'
                ? 'border-[#d97706] text-[#d97706] scale-102 font-extrabold'
                : 'border-transparent text-gray-500 hover:text-[#d97706]'
            }`}
          >
            <Download className="h-4.5 w-4.5" />
            <span>রিপোর্ট PDF ডাউনলোড কেন্দ্র</span>
            <span className="bg-[#d97706]/15 text-[#d97706] text-[10px] px-2 py-0.5 rounded-full font-black">
              সব রিপোর্ট
            </span>
          </button>
        </div>

        {activeTab === 'day-note' ? (
          <CollectionDayNoteReport
            transactions={transactions}
            mahfilDetails={mahfilDetails}
            defaultYear={selectedYear !== 'all' ? selectedYear : '2026'}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        ) : activeTab === 'summary-poster' ? (
          <FinancialSummaryPoster
            transactions={transactions}
            mahfilDetails={mahfilDetails}
            selectedYear={selectedYear !== 'all' ? selectedYear : '2026'}
            onYearChange={(yr) => setSelectedYear(yr)}
          />
        ) : activeTab === 'statement' ? (
          <AnnualLedgerReport 
            transactions={transactions} 
            isAdminLoggedIn={isAdminLoggedIn}
            isFinancePublic={isApprovedPublic}
            onToggleFinancePublic={onToggleReportPublic || onToggleFinancePublic}
            onOpenManualPosting={(yr) => {
              setManualPostingInitialYear(yr || '2026');
              setShowManualPostingModal(true);
            }}
          />
        ) : activeTab === 'annual' ? (
          <>
            {/* Aggregate Stats Bar */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                <div className="p-3.5 bg-green-50 text-green-700 rounded-xl border border-green-100">
                  <TrendingUp className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#8a817c]">সর্বমোট বিগত বছরের আয়</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#064e3b] mt-1">
                    ৳ {toBanglaNum(overallIncome.toLocaleString('bn-BD'))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                <div className="p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-100">
                  <DollarSign className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#8a817c]">সর্বমোট বিগত বছরের ব্যয়</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#064e3b] mt-1">
                    ৳ {toBanglaNum(overallExpense.toLocaleString('bn-BD'))}
                  </div>
                </div>
              </div>

              <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm flex items-center space-x-4">
                <div className="p-3.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
                  <Award className="h-6 w-6" />
                </div>
                <div>
                  <div className="text-xs font-semibold text-[#8a817c]">সর্বমোট উদবৃত্ত অবশিষ্টাংশ</div>
                  <div className="text-xl sm:text-2xl font-extrabold text-[#064e3b] mt-1">
                    ৳ {toBanglaNum(overallSurplus.toLocaleString('bn-BD'))}
                  </div>
                </div>
              </div>
            </div>

            {/* Year Filter Tab Bar with Download Icons */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#0f766e]" />
                <span className="text-sm font-bold text-[#064e3b]">বছর নির্বাচন ও বার্ষিক রিপোর্ট:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {/* All years combined tab */}
                <div className="inline-flex rounded-xl shadow-xs overflow-hidden border border-[#cbd5e1]">
                  <button
                    onClick={() => setSelectedYear('all')}
                    className={`px-3.5 py-2 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                      selectedYear === 'all' 
                        ? 'bg-[#0f766e] text-white font-extrabold' 
                        : 'bg-white text-[#3c3c3c] hover:bg-slate-50'
                    }`}
                  >
                    <span>সকল বছর একত্রে</span>
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleOpenYearExportModal('all', 'statement');
                    }}
                    title="সকল বছরের সমন্বিত রিপোর্ট PDF ডাউনলোড করুন"
                    className={`px-2.5 py-2 text-xs font-bold transition border-l cursor-pointer flex items-center justify-center ${
                      selectedYear === 'all'
                        ? 'bg-[#0b5c55] text-amber-300 border-[#0b5c55] hover:bg-[#094742]'
                        : 'bg-slate-100 text-[#0f766e] border-[#cbd5e1] hover:bg-[#0f766e] hover:text-white'
                    }`}
                  >
                    <Download className="h-3.5 w-3.5" />
                  </button>
                </div>

                {historicalReports.map((r) => (
                  <div key={r.key} className="inline-flex rounded-xl shadow-xs overflow-hidden border border-[#cbd5e1]">
                    <button
                      onClick={() => setSelectedYear(r.key)}
                      className={`px-3.5 py-2 text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                        selectedYear === r.key 
                          ? 'bg-[#0f766e] text-white font-extrabold' 
                          : 'bg-white text-[#3c3c3c] hover:bg-slate-50'
                      }`}
                    >
                      <Calendar className="h-3 w-3 opacity-75" />
                      <span>{r.year}</span>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenYearExportModal(r.key, 'statement');
                      }}
                      title={`${r.year} সনের বার্ষিক রিপোর্ট PDF ডাউনলোড করুন`}
                      className={`px-2.5 py-2 text-xs font-bold transition border-l cursor-pointer flex items-center justify-center ${
                        selectedYear === r.key
                          ? 'bg-[#0b5c55] text-amber-300 border-[#0b5c55] hover:bg-[#094742]'
                          : 'bg-slate-100 text-[#0f766e] border-[#cbd5e1] hover:bg-[#0f766e] hover:text-white'
                      }`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Report View Card Block */}
            <div className="space-y-12">
              {displayedReports.map((report) => (
                <div key={report.key} className="bg-white border border-[#cbd5e1] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 relative overflow-hidden">
                  {/* Islamic subtle corner decoration */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#d97706]/5 to-transparent rounded-bl-full pointer-events-none"></div>

                  {/* Header of Year Card */}
                  <div className="border-b border-[#e2e8f0] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold text-[#064e3b] flex items-center space-x-2">
                        <span className="h-2.5 w-2.5 bg-[#d97706] rounded-full"></span>
                        <span>আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিল — {report.year}</span>
                      </h3>
                      <p className="text-[#8a817c] text-xs font-medium">সোনারগাঁও, তুপ্পারপাড়, রাঙ্গুনিয়া, চট্টগ্রাম।</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2.5">
                      <div className="text-xs font-bold text-[#0f766e] bg-[#0f766e]/10 border border-[#cbd5e1] px-3.5 py-1.5 rounded-full inline-block">
                        মোট উপস্থিতি: {report.attendance}
                      </div>
                      <button
                        onClick={() => handleOpenYearExportModal(report.key, 'statement')}
                        className="px-3.5 py-1.5 bg-[#0f766e] hover:bg-[#064e3b] text-white rounded-full text-xs font-bold shadow-sm transition flex items-center space-x-1.5 cursor-pointer"
                        title={`${report.year} এর বার্ষিক রিপোর্ট PDF ডাউনলোড`}
                      >
                        <Download className="h-3.5 w-3.5" />
                        <span>{report.year} রিপোর্ট ডাউনলোড</span>
                      </button>
                    </div>
                  </div>

                  {/* Financial Overview Cards of Specific Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                    <div className="bg-[#fcfbf9] border border-[#e2e8f0] rounded-2xl p-4 text-center space-y-1">
                      <span className="text-[11px] font-bold text-[#0f766e] uppercase block">
                        {(report.openingBalance ?? 0) > 0 ? 'চলতি বছরের সংগ্রহ (আয়)' : 'মোট সংগৃহীত বাজেট (আয়)'}
                      </span>
                      <div className="text-xl font-extrabold text-green-700">
                        ৳ {toBanglaNum(report.totalIncome.toLocaleString('bn-BD'))}
                      </div>
                      {(report.openingBalance ?? 0) > 0 && (
                        <div className="text-[11px] text-[#064e3b] font-medium pt-1 border-t border-dashed border-[#e2e8f0]">
                          <span className="text-[#d97706]">বিগত বছরের হাতে নগদ: ৳ {toBanglaNum((report.openingBalance ?? 0).toLocaleString('bn-BD'))}</span>
                          <div className="font-bold text-[#0f766e]">হাতে নগদ সহ মোট তহবিল: ৳ {toBanglaNum((report.totalFund || ((report.openingBalance ?? 0) + report.totalIncome)).toLocaleString('bn-BD'))}</div>
                        </div>
                      )}
                    </div>
                    <div className="bg-[#fcfbf9] border border-[#e2e8f0] rounded-2xl p-4 text-center space-y-1">
                      <span className="text-[11px] font-bold text-[#0f766e] uppercase block">মোট ব্যয়িত বাজেট</span>
                      <div className="text-xl font-extrabold text-red-600">
                        ৳ {toBanglaNum(report.totalExpense.toLocaleString('bn-BD'))}
                      </div>
                    </div>
                    <div className="bg-[#fcfbf9] border border-[#e2e8f0] rounded-2xl p-4 text-center space-y-1">
                      <span className="text-[11px] font-bold text-[#0f766e] uppercase block">বছর শেষে সমাপনী হাতে নগদ</span>
                      <div className="text-xl font-extrabold text-amber-700">
                        ৳ {toBanglaNum((report.cumulative ?? report.surplus).toLocaleString('bn-BD'))}
                      </div>
                      <div className="text-[11px] text-gray-500">
                        বছরের নিট স্থিতি: {report.surplus >= 0 ? '+' : ''}৳ {toBanglaNum(report.surplus.toLocaleString('bn-BD'))}
                      </div>
                    </div>
                  </div>

                  {/* Expenses Breakdown List & Graph */}
                  <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                    {/* Detailed Table */}
                    <div className="lg:col-span-7 space-y-4">
                      <h4 className="text-sm font-bold text-[#064e3b] flex items-center space-x-2 pb-2 border-b border-[#e2e8f0]">
                        <PieChart className="h-4 w-4 text-[#0f766e]" />
                        <span>ব্যয়ের খাতভিত্তিক বিবরণী</span>
                      </h4>
                      <div className="overflow-x-auto">
                        <table className="w-full border-collapse text-left text-xs sm:text-sm">
                          <thead>
                            <tr className="border-b border-[#e2e8f0] text-[#0f766e] font-bold">
                              <th className="py-2.5 px-1">খাতের নাম</th>
                              <th className="py-2.5 px-3 text-right">ব্যয়ের পরিমাণ</th>
                              <th className="py-2.5 px-3 text-center">শতকরা হার</th>
                            </tr>
                          </thead>
                          <tbody>
                            {report.breakdown.map((item, idx) => (
                              <tr key={idx} className="border-b border-[#e2e8f0]/50 hover:bg-[#f8fafc]/60 transition">
                                <td className="py-3 px-1 text-[#064e3b] font-semibold">{item.category}</td>
                                <td className="py-3 px-3 text-right font-bold text-[#3c3c3c]">
                                  ৳ {toBanglaNum(item.amount.toLocaleString('bn-BD'))}
                                </td>
                                <td className="py-3 px-3 text-center">
                                  <span className="px-2.5 py-0.5 bg-[#f1f5f9] rounded-full text-[10px] font-bold text-[#0f766e]">
                                    {toBanglaNum(item.percentage)}%
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Graphical Visualizer (Clean Tailwind Progress representation) */}
                    <div className="lg:col-span-5 bg-[#f8fafc] border border-[#e2e8f0] rounded-2xl p-5 space-y-5 shadow-inner">
                      <h4 className="text-sm font-bold text-[#064e3b] flex items-center space-x-2 border-b border-[#e2e8f0] pb-2">
                        <BarChart2 className="h-4 w-4 text-[#0f766e]" />
                        <span>ব্যয় বিশ্লেষণ গ্রাফ</span>
                      </h4>
                      <div className="space-y-4 pt-1">
                        {report.breakdown.map((item, idx) => (
                          <div key={idx} className="space-y-1">
                            <div className="flex justify-between text-[11px] font-bold text-[#3c3c3c]">
                              <span className="truncate max-w-[200px]">{item.category}</span>
                              <span>{toBanglaNum(item.percentage)}%</span>
                            </div>
                            <div className="w-full bg-[#e2e8f0] h-2.5 rounded-full overflow-hidden">
                              <div 
                                className="bg-[#0f766e] h-2.5 rounded-full" 
                                style={{ width: `${item.percentage}%` }}
                              ></div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Major Donors and Contributors */}
                  <div className="pt-4 border-t border-[#e2e8f0]/70 space-y-4">
                    <h4 className="text-sm font-bold text-[#064e3b] flex items-center space-x-2">
                      <Award className="h-4 w-4 text-[#d97706]" />
                      <span>প্রধান ডোনার ও পৃষ্ঠপোষকবৃন্দ</span>
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      {report.majorDonors.map((donor, idx) => (
                        <div key={idx} className="bg-white border border-[#e2e8f0] rounded-xl p-4 flex items-center justify-between shadow-sm">
                          <div className="min-w-0">
                            <div className="font-bold text-xs text-[#064e3b] truncate">{donor.name}</div>
                            <div className="text-[10px] text-[#8a817c] font-semibold mt-0.5">{donor.location}</div>
                          </div>
                          <div className="text-xs font-bold text-[#0f766e] bg-[#0f766e]/5 border border-[#0f766e]/20 px-2.5 py-1 rounded-lg">
                            ৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : activeTab === 'monthly' ? (
          <>
            {/* Monthly Report Selector Bar */}
            <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-4">
              <div className="flex items-center space-x-2">
                <Calendar className="h-5 w-5 text-[#0f766e]" />
                <span className="text-sm font-bold text-[#064e3b]">মাস ও বছর নির্বাচন করুন:</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {uniqueMonths.map((ym) => (
                  <button
                    key={ym}
                    onClick={() => setSelectedMonth(ym)}
                    className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                      selectedMonth === ym 
                        ? 'bg-[#0f766e] text-white shadow-sm' 
                        : 'bg-white text-[#3c3c3c] border border-[#cbd5e1] hover:bg-white/80'
                    }`}
                  >
                    {formatBanglaMonthYear(ym)}
                  </button>
                ))}
                {uniqueMonths.length === 0 && (
                  <span className="text-xs text-gray-500 font-medium">কোনো মাসিক ডেটা পাওয়া যায়নি</span>
                )}
              </div>
            </div>

            {/* Selected Month Summary */}
            {selectedMonthData ? (
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 relative overflow-hidden">
                {/* Decoration */}
                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#d97706]/5 to-transparent rounded-bl-full pointer-events-none"></div>

                {/* Header card with Action button */}
                <div className="border-b border-[#e2e8f0] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-xl font-bold text-[#064e3b] flex items-center space-x-2">
                      <span className="h-2.5 w-2.5 bg-[#d97706] rounded-full"></span>
                      <span>মাসিক আয়-ব্যয় সারাংশ — {selectedMonthData.monthYearLabel}</span>
                    </h3>
                    <p className="text-[#8a817c] text-xs font-medium">সোনারগাঁও ঈদে মিলাদুন্নবী (দঃ) মাহফিল উদযাপন পরিষদ</p>
                  </div>
                  <div>
                    <button
                      onClick={handleDownloadMonthlyPDF}
                      disabled={isMonthlyDownloading}
                      className="px-5 py-2.5 bg-[#0f766e] hover:bg-[#4d5c31] disabled:bg-[#cbd5e1] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center space-x-2"
                    >
                      {isMonthlyDownloading ? (
                        <>
                          <RefreshCw className="h-4 w-4 animate-spin" />
                          <span>পিডিএফ তৈরি হচ্ছে...</span>
                        </>
                      ) : (
                        <>
                          <Download className="h-4 w-4" />
                          <span>পিডিএফ ডাউনলোড করুন</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Monthly Summary Statistics Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                  <div className="bg-green-50/50 border border-green-100 rounded-2xl p-5 text-center">
                    <span className="text-xs font-bold text-green-800 block mb-1">মোট মাসিক আয়</span>
                    <div className="text-2xl font-black text-green-700">
                      ৳ {toBanglaNum(selectedMonthData.totalIncome.toLocaleString('bn-BD'))}
                    </div>
                  </div>
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 text-center">
                    <span className="text-xs font-bold text-red-800 block mb-1">মোট মাসিক ব্যয়</span>
                    <div className="text-2xl font-black text-red-700">
                      ৳ {toBanglaNum(selectedMonthData.totalExpense.toLocaleString('bn-BD'))}
                    </div>
                  </div>
                  <div className="bg-amber-50/50 border border-amber-100 rounded-2xl p-5 text-center">
                    <span className="text-xs font-bold text-amber-800 block mb-1">মাসিক উদ্বৃত্ত অবশিষ্টাংশ</span>
                    <div className="text-2xl font-black text-amber-700">
                      ৳ {toBanglaNum(selectedMonthData.surplus.toLocaleString('bn-BD'))}
                    </div>
                  </div>
                </div>

                {/* Categorized breakdown of the month */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
                  {/* Income breakdown table */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#064e3b] flex items-center space-x-2 pb-2 border-b border-[#e2e8f0]">
                      <span className="h-2 w-2 bg-green-500 rounded-full"></span>
                      <span>আয়ের খাতভিত্তিক বিবরণী</span>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-[#e2e8f0] text-[#0f766e] font-bold">
                            <th className="py-2.5 px-1">খাতের নাম</th>
                            <th className="py-2.5 px-3 text-right">আয়ের পরিমাণ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMonthData.incomeBreakdown.length > 0 ? (
                            selectedMonthData.incomeBreakdown.map((item, idx) => (
                              <tr key={idx} className="border-b border-[#e2e8f0]/50 hover:bg-[#f8fafc]/60 transition">
                                <td className="py-3 px-1 text-[#064e3b] font-semibold">{item.category}</td>
                                <td className="py-3 px-3 text-right font-bold text-[#3c3c3c]">
                                  ৳ {toBanglaNum(item.amount.toLocaleString('bn-BD'))}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-6 text-center text-gray-400 font-medium">কোনো আয়ের রেকর্ড পাওয়া যায়নি</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Expense breakdown table */}
                  <div className="space-y-4">
                    <h4 className="text-sm font-bold text-[#064e3b] flex items-center space-x-2 pb-2 border-b border-[#e2e8f0]">
                      <span className="h-2 w-2 bg-red-500 rounded-full"></span>
                      <span>ব্যয়ের খাতভিত্তিক বিবরণী</span>
                    </h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-left text-xs sm:text-sm">
                        <thead>
                          <tr className="border-b border-[#e2e8f0] text-[#0f766e] font-bold">
                            <th className="py-2.5 px-1">খাতের নাম</th>
                            <th className="py-2.5 px-3 text-right">ব্যয়ের পরিমাণ</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMonthData.expenseBreakdown.length > 0 ? (
                            selectedMonthData.expenseBreakdown.map((item, idx) => (
                              <tr key={idx} className="border-b border-[#e2e8f0]/50 hover:bg-[#f8fafc]/60 transition">
                                <td className="py-3 px-1 text-[#064e3b] font-semibold">{item.category}</td>
                                <td className="py-3 px-3 text-right font-bold text-[#3c3c3c]">
                                  ৳ {toBanglaNum(item.amount.toLocaleString('bn-BD'))}
                                </td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="py-6 text-center text-gray-400 font-medium">কোনো ব্যয়ের রেকর্ড পাওয়া যায়নি</td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Detailed transactions list for screen check */}
                {selectedMonthData.transactions.length > 0 && (
                  <div className="pt-6 border-t border-[#e2e8f0] space-y-4">
                    <h4 className="text-sm font-bold text-[#064e3b]">মাসিক বিস্তারিত লেনদেন তালিকা</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full border-collapse text-xs text-left">
                        <thead>
                          <tr className="bg-[#fcfbf9] border-b border-[#e2e8f0] text-[#0f766e] font-bold">
                            <th className="py-2.5 px-3 text-center">তারিখ</th>
                            <th className="py-2.5 px-3 text-center">ধরণ</th>
                            <th className="py-2.5 px-3">খাত / বিবরণ</th>
                            <th className="py-2.5 px-3">দাতা / রিসিভার</th>
                            <th className="py-2.5 px-3 text-right">টাকা</th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedMonthData.transactions.map((t, idx) => (
                            <tr key={idx} className="border-b border-[#e2e8f0]/50 hover:bg-gray-50/50 transition">
                              <td className="py-3 px-3 text-center font-mono text-gray-600">{toBanglaNum(t.date || '')}</td>
                              <td className="py-3 px-3 text-center">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                  t.type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                  {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                                </span>
                              </td>
                              <td className="py-3 px-3">
                                <div className="font-semibold text-[#064e3b]">
                                  {t.category && t.category !== 'সাধারণ রশিদ কালেকশন' && t.category !== 'চাঁদা ও অনুদান' ? t.category : (t.type === 'income' ? '—' : 'ব্যয়')}
                                </div>
                                {t.description && <div className="text-[10px] text-gray-500 mt-0.5 font-light">{t.description}</div>}
                              </td>
                              <td className="py-3 px-3 text-gray-700 font-medium">{t.donorName || '---'}</td>
                              <td className="py-3 px-3 text-right font-bold text-[#064e3b]">
                                ৳ {toBanglaNum(t.amount.toLocaleString('bn-BD'))}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="bg-white border border-[#cbd5e1] rounded-3xl p-8 text-center text-gray-500 font-medium shadow-sm">
                কোনো মাসিক লেনদেনের রেকর্ড পাওয়া যায়নি।
              </div>
            )}
          </>
        ) : (
          /* activeTab === 'export-center' */
          <div className="space-y-8 animate-fade-in">
            {/* Header Banner */}
            <div className="bg-white border border-[#cbd5e1] rounded-3xl p-6 sm:p-8 shadow-sm relative overflow-hidden">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#cbd5e1] pb-6">
                <div>
                  <div className="flex items-center space-x-2">
                    <span className="p-2 bg-[#0f766e]/10 text-[#0f766e] rounded-xl">
                      <Download className="h-6 w-6" />
                    </span>
                    <h2 className="text-xl sm:text-2xl font-black text-[#064e3b]">
                      প্রতিবেদন ও অডিট PDF ডাউনলোড কেন্দ্র
                    </h2>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-600 font-light mt-1">
                    পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদের প্রাতিষ্ঠানিক প্রতিবেদনগুলো সরাসরি ১-ক্লিকে হাই-রেজ্যুলেশন PDF হিসেবে সংরক্ষণ করুন।
                  </p>
                </div>
                <button
                  id="direct-modal-trigger-btn"
                  onClick={() => setShowPdfExportModal(true)}
                  className="px-6 py-3 bg-[#d97706] hover:bg-[#b45309] text-white rounded-2xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition cursor-pointer flex items-center space-x-2 shrink-0 self-start sm:self-auto"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>কাস্টম PDF ডাউনলোড উইন্ডো</span>
                </button>
              </div>

              {/* Report Cards Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
                {/* Card 0: Collection Day Note (Denomination) */}
                <div className="md:col-span-2 border-2 border-emerald-300 hover:border-emerald-500 bg-gradient-to-r from-emerald-50/80 to-teal-50/50 rounded-2xl p-5 space-y-4 transition duration-200 hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-2 bg-[#064e3b] text-amber-300 rounded-xl">
                          <Coins className="h-5 w-5" />
                        </span>
                        <h3 className="text-base sm:text-lg font-black text-[#064e3b]">
                          মাহফিল চাঁদা কালেকশন ডে নোট (Denomination Report)
                        </h3>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-extrabold px-2.5 py-0.5 rounded-full">
                        ২০২৬ বিশেষ ডিনোমিনেশন
                      </span>
                    </div>
                    <p className="text-xs text-slate-700 font-medium leading-relaxed">
                      কোন অংকের চাঁদা কতজন দিয়েছেন (যেমন ২০,০০০ টাকা কতজন, ১০,০০০ টাকা কতজন, ৫,০০০ টাকা কতজন ইত্যাদি) তার সুনির্দিষ্ট ডে নোট ও স্ল্যাব ভিত্তিক আনুষ্ঠানিক রিপোর্ট।
                    </p>
                  </div>
                  <div className="pt-3 border-t border-emerald-200 flex flex-wrap items-center justify-between gap-3">
                    <button
                      onClick={() => setActiveTab('day-note')}
                      className="text-xs font-black text-[#064e3b] hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>ডে নোট প্রতিবেদন দেখুন</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setActiveTab('day-note')}
                      className="px-4 py-2 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5 text-amber-300" />
                      <span>ডে নোট দেখুন ও ডাউনলোড করুন</span>
                    </button>
                  </div>
                </div>

                {/* Card 1: Official Ledger Statement */}
                <div className="border border-[#cbd5e1] hover:border-[#0f766e] bg-[#f8fafc] rounded-2xl p-5 space-y-4 transition duration-200 hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-2 bg-[#0f766e] text-white rounded-xl">
                          <BookOpen className="h-5 w-5" />
                        </span>
                        <h3 className="text-base font-bold text-[#064e3b]">
                          বার্ষিক আয়-ব্যয় বিবরণী (লেজার শিট)
                        </h3>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        ৬-কলাম ফরম্যাট
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-light leading-relaxed">
                      পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদের অফিসিয়াল সিল ও স্বাক্ষরিত খতিয়ান শিট। বিগত বছরের স্থিতি, সর্বমোট আয়, ব্যয়, নিট স্থিতি ও খাতেওয়ারি তালিকা সংবলিত।
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#cbd5e1] flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('statement')}
                      className="text-xs font-bold text-[#0f766e] hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>লেজার শিট দেখুন</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowPdfExportModal(true)}
                      className="px-4 py-2 bg-[#0f766e] hover:bg-[#064e3b] text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF ডাউনলোড</span>
                    </button>
                  </div>
                </div>

                {/* Card 2: Monthly Audit Report */}
                <div className="border border-[#cbd5e1] hover:border-[#0f766e] bg-[#f8fafc] rounded-2xl p-5 space-y-4 transition duration-200 hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-2 bg-[#d97706] text-white rounded-xl">
                          <FileText className="h-5 w-5" />
                        </span>
                        <h3 className="text-base font-bold text-[#064e3b]">
                          মাসিক অডিট ও আয়-ব্যয় বিবরণী
                        </h3>
                      </div>
                      <span className="text-[10px] bg-amber-100 text-amber-800 font-bold px-2 py-0.5 rounded-full">
                        মাসভিত্তিক
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-light leading-relaxed">
                      নির্দিষ্ট মাসের সংগৃহীত অনুদান, তাবাররুক, মাইক, প্যান্ডেল ও ডেকোরেশন ব্যয়ের বিস্তারিত বিবরণী এবং নীট উদ্বৃত্তের প্রাতিষ্ঠানিক অডিট শিট।
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#cbd5e1] flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('monthly')}
                      className="text-xs font-bold text-[#0f766e] hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>মাসিক হিসাব দেখুন</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowPdfExportModal(true)}
                      className="px-4 py-2 bg-[#d97706] hover:bg-[#b45309] text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF ডাউনলোড</span>
                    </button>
                  </div>
                </div>

                {/* Card 3: Annual Statistics & Analytics */}
                <div className="border border-[#cbd5e1] hover:border-[#0f766e] bg-[#f8fafc] rounded-2xl p-5 space-y-4 transition duration-200 hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-2 bg-emerald-700 text-white rounded-xl">
                          <BarChart2 className="h-5 w-5" />
                        </span>
                        <h3 className="text-base font-bold text-[#064e3b]">
                          সার্বিক বার্ষিক পরিসংখ্যান ও বাজেট চার্ট
                        </h3>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-2 py-0.5 rounded-full">
                        বহুবর্ষীয়
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-light leading-relaxed">
                      ২০২৩ হতে বর্তমান পর্যন্ত বিগত বছরসমূহের মোট বাজেট, প্রবাসী অনুদানের সংক্ষেপ এবং ব্যয়ের খাতভিত্তিক শতকরা গ্রাফের পূর্ণাঙ্গ রিপোর্ট।
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#cbd5e1] flex items-center justify-between">
                    <button
                      onClick={() => setActiveTab('annual')}
                      className="text-xs font-bold text-[#0f766e] hover:underline cursor-pointer flex items-center space-x-1"
                    >
                      <span>পরিসংখ্যান দেখুন</span>
                      <ArrowUpRight className="h-3.5 w-3.5" />
                    </button>
                    <button
                      onClick={() => setShowPdfExportModal(true)}
                      className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF ডাউনলোড</span>
                    </button>
                  </div>
                </div>

                {/* Card 4: Full Transactions Statement */}
                <div className="border border-[#cbd5e1] hover:border-[#0f766e] bg-[#f8fafc] rounded-2xl p-5 space-y-4 transition duration-200 hover:shadow-md flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="p-2 bg-slate-800 text-white rounded-xl">
                          <FileSpreadsheet className="h-5 w-5" />
                        </span>
                        <h3 className="text-base font-bold text-[#064e3b]">
                          পূর্ণাঙ্গ লেনদেন তালিকা ও ক্যাশ রেজিস্টার
                        </h3>
                      </div>
                      <span className="text-[10px] bg-slate-200 text-slate-800 font-bold px-2 py-0.5 rounded-full">
                        রশিদ রেজিস্টার
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 font-light leading-relaxed">
                      সকল সংগৃহীত অনুদানের রশিদ নম্বর, দাতার নাম, ভাউচার এন্ট্রি ও ব্যয়ের সুনির্দিষ্ট তারিখসংবলিত সমন্বিত রসিদ বহি রিপোর্ট।
                    </p>
                  </div>
                  <div className="pt-3 border-t border-[#cbd5e1] flex items-center justify-between">
                    <span className="text-xs text-gray-500 font-bold">মোট {toBanglaNum(transactions.length)} টি এন্ট্রি</span>
                    <button
                      onClick={() => setShowPdfExportModal(true)}
                      className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white rounded-xl text-xs font-bold shadow-sm flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF ডাউনলোড</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Year-by-Year Annual Report Quick Download Grid */}
            <div className="bg-[#fcfbf9] border-2 border-[#cbd5e1] rounded-3xl p-6 sm:p-8 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#cbd5e1] pb-4">
                <div className="flex items-center space-x-2">
                  <span className="p-2 bg-[#0f766e]/10 text-[#0f766e] rounded-xl">
                    <Calendar className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-lg font-extrabold text-[#064e3b]">
                      প্রতিটি বছরের বার্ষিক অডিট ও আর্থিক রিপোর্ট ডাউনলোড
                    </h3>
                    <p className="text-xs text-gray-500 font-light">
                      নির্দিষ্ট বছরের ওপর ক্লিক করে ১-ক্লিকে অফিশিয়াল A4 প্রিন্ট উপযোগী পিডিএফ ডাউনলোড করুন
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* All Years Combined Card */}
                <div className="bg-white border-2 border-[#0f766e] rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between">
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-[#0f766e] bg-[#0f766e]/10 px-2 py-0.5 rounded-md">
                        সকল বছর একত্রে
                      </span>
                      <span className="text-[10px] text-gray-400 font-bold">২০২৩-২০২৬</span>
                    </div>
                    <div className="text-sm font-bold text-[#064e3b]">
                      সার্বিক সমন্বিত বার্ষিক রিপোর্ট
                    </div>
                    <div className="text-xs text-gray-600 space-y-0.5 pt-1 border-t border-dashed border-gray-200">
                      <div className="flex justify-between">
                        <span>সর্বমোট সংগ্রহ:</span>
                        <span className="font-bold text-[#0f766e]">৳ {toBanglaNum(overallIncome.toLocaleString('bn-BD'))}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>সর্বমোট ব্যয়:</span>
                        <span className="font-bold text-red-600">৳ {toBanglaNum(overallExpense.toLocaleString('bn-BD'))}</span>
                      </div>
                      <div className="flex justify-between font-bold text-[#064e3b]">
                        <span>উদ্বৃত্ত স্থিতি:</span>
                        <span>৳ {toBanglaNum(overallSurplus.toLocaleString('bn-BD'))}</span>
                      </div>
                    </div>
                  </div>
                  <button
                    onClick={() => handleOpenYearExportModal('all', 'statement')}
                    className="w-full py-2 bg-[#0f766e] hover:bg-[#064e3b] text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer transition"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>সকল বছরের রিপোর্ট ডাউনলোড</span>
                  </button>
                </div>

                {historicalReports.map((hr) => (
                  <div key={hr.key} className="bg-white border border-[#cbd5e1] hover:border-[#0f766e] rounded-2xl p-4 shadow-sm hover:shadow-md transition space-y-3 flex flex-col justify-between">
                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-black text-[#064e3b] bg-slate-100 px-2 py-0.5 rounded-md">
                          {hr.year} অর্থবছর
                        </span>
                        <span className="text-[10px] text-[#0f766e] font-semibold">উপস্থিতি: {hr.attendance}</span>
                      </div>
                      <div className="text-sm font-bold text-[#064e3b]">
                        {hr.year} মাহফিল আর্থিক বিবরণী
                      </div>
                      <div className="text-xs text-gray-600 space-y-0.5 pt-1 border-t border-dashed border-gray-200">
                        <div className="flex justify-between">
                          <span>মোট বাজেট আয়:</span>
                          <span className="font-bold text-green-700">৳ {toBanglaNum(hr.totalIncome.toLocaleString('bn-BD'))}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>মোট খরচ:</span>
                          <span className="font-bold text-red-600">৳ {toBanglaNum(hr.totalExpense.toLocaleString('bn-BD'))}</span>
                        </div>
                        <div className="flex justify-between font-bold text-[#064e3b]">
                          <span>সমাপনী উদ্বৃত্ত:</span>
                          <span className="text-amber-700">৳ {toBanglaNum(hr.surplus.toLocaleString('bn-BD'))}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleOpenYearExportModal(hr.key, 'statement')}
                      className="w-full py-2 bg-[#d97706] hover:bg-[#b45309] text-white rounded-xl text-xs font-extrabold shadow-sm flex items-center justify-center space-x-1.5 cursor-pointer transition"
                    >
                      <Download className="h-3.5 w-3.5" />
                      <span>{hr.year} রিপোর্ট ডাউনলোড</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Quality Assurance Banner */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center space-x-3 text-emerald-900">
              <ShieldCheck className="h-6 w-6 text-emerald-700 shrink-0" />
              <div className="text-xs leading-relaxed">
                <span className="font-black">অফিসিয়াল নিশ্চয়তা:</span> আমাদের সকল পিডিএফ ফাইল বাংলা যুক্তাক্ষর ও ফন্ট নির্ভুল রেখে প্রস্তুত করা হয়। যেকোনো A4 প্রিন্টারে বা মোবাইলে এটি অবিকল দেখা ও প্রিন্ট করা যায়।
              </div>
            </div>
          </div>
        )}
      </div>

      {/* PDF Export Modal */}
      <ReportPdfExportModal
        isOpen={showPdfExportModal}
        onClose={() => setShowPdfExportModal(false)}
        transactions={transactions}
        onNavigateToTab={(t) => setActiveTab(t)}
        initialYear={modalInitialYear}
        initialReportType={modalInitialReportType}
      />

      {/* Manual Financial Posting Modal for previous and current year transactions */}
      <ManualFinancialPostingModal
        isOpen={showManualPostingModal}
        onClose={() => setShowManualPostingModal(false)}
        transactions={transactions}
        onAddTransaction={onAddTransaction || (async () => {})}
        onBatchAddTransactions={onBatchAddTransactions}
        onDeleteTransaction={onDeleteTransaction}
        initialYear={manualPostingInitialYear}
        onViewReport={(yr) => {
          setSelectedYear(yr);
          setActiveTab('statement');
          setShowManualPostingModal(false);
        }}
      />

      {/* 2. Print-Only Beautiful Official Document Layout - Visible ONLY during window.print() */}
      <div className="hidden print:block text-black bg-white p-6 max-w-4xl mx-auto font-sans" id="report-print-area">
        {/* Document Header with Double Decorative Lines */}
        <div className="text-center space-y-2 border-b-4 border-double border-gray-800 pb-4 mb-6 relative">
          <div className="flex items-center justify-center gap-3">
            <img 
              src={logo} 
              onError={handleLogoError}
              alt="Logo" 
              className="h-16 w-16 object-contain rounded-full border border-gray-300 bg-white"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-xs font-bold text-gray-900 leading-tight">বিসমিল্লাহির রাহমানির রাহিম</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h1>
              <p className="text-sm font-bold text-gray-700">সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম, বাংলাদেশ।</p>
            </div>
          </div>
          <p className="text-xs font-bold text-gray-600 bg-gray-100 py-1.5 px-4 rounded border border-gray-300 mt-2 inline-block">
            {selectedYear === 'all' 
              ? 'বিগত বছরসমূহের আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিলের আর্থিক বিবরণী ও প্রতিবেদন' 
              : `আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিল — ${displayedReports[0]?.year} এর আর্থিক প্রতিবেদন`
            }
          </p>
        </div>

        {/* Financial Summary Box */}
        <div className="grid grid-cols-3 gap-4 text-center mb-8 border border-gray-400 p-4 rounded bg-gray-50/50">
          <div className="border-r border-gray-300">
            <span className="text-[10px] text-gray-700 block font-bold">সর্বমোট সংগৃহীত বাজেট (আয়)</span>
            <span className="text-lg font-black text-gray-950">৳ {toBanglaNum(printedIncome.toLocaleString('bn-BD'))}</span>
          </div>
          <div className="border-r border-gray-300">
            <span className="text-[10px] text-gray-700 block font-bold">সর্বমোট ব্যয়িত বাজেট (ব্যয়)</span>
            <span className="text-lg font-black text-gray-950">৳ {toBanglaNum(printedExpense.toLocaleString('bn-BD'))}</span>
          </div>
          <div>
            <span className="text-[10px] text-gray-700 block font-bold">সমাপনী উদ্বৃত্ত অবশিষ্টাংশ</span>
            <span className="text-lg font-black text-gray-950">৳ {toBanglaNum(printedSurplus.toLocaleString('bn-BD'))}</span>
          </div>
        </div>

        {/* Detailed Reports Loop */}
        <div className="space-y-10">
          {displayedReports.map((report) => (
            <div key={report.key} className="space-y-6 avoid-break border-b border-gray-300 pb-8 last:border-none last:pb-0">
              {/* Year Heading */}
              <div className="flex justify-between items-center bg-gray-100 py-2 px-3 border border-gray-400 rounded">
                <h3 className="text-xs sm:text-sm font-bold text-gray-900">
                  আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিল — {report.year}
                </h3>
                <span className="text-xs font-bold text-gray-700">উপস্থিতি: {report.attendance}</span>
              </div>

              {/* Stats for this specific report if multi-report */}
              {selectedYear === 'all' && (
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="bg-gray-50/50 border border-gray-300 py-1.5 rounded">
                    <span className="text-[10px] text-gray-600 block">মোট সংগ্রহ (আয়):</span>
                    <span className="font-bold text-gray-950">৳ {toBanglaNum(report.totalIncome.toLocaleString('bn-BD'))}</span>
                  </div>
                  <div className="bg-gray-50/50 border border-gray-300 py-1.5 rounded">
                    <span className="text-[10px] text-gray-600 block">মোট ব্যয়:</span>
                    <span className="font-bold text-gray-950">৳ {toBanglaNum(report.totalExpense.toLocaleString('bn-BD'))}</span>
                  </div>
                  <div className="bg-gray-50/50 border border-gray-300 py-1.5 rounded">
                    <span className="text-[10px] text-gray-600 block">উদ্বৃত্ত:</span>
                    <span className="font-bold text-gray-950">৳ {toBanglaNum(report.surplus.toLocaleString('bn-BD'))}</span>
                  </div>
                </div>
              )}

              {/* Table of Breakdown */}
              <div className="space-y-2">
                <h4 className="text-[11px] font-bold text-gray-900 border-b border-gray-400 pb-1">ব্যয়ের খাতভিত্তিক বিবরণী</h4>
                <table className="w-full border-collapse border border-gray-400 text-xs text-left">
                  <thead>
                    <tr className="bg-gray-100 border-b border-gray-400 font-bold text-gray-900 text-center">
                      <th className="py-2 px-3 border-r border-gray-400 text-left">খাতের নাম</th>
                      <th className="py-2 px-3 border-r border-gray-400 text-right w-36">ব্যয়ের পরিমাণ</th>
                      <th className="py-2 px-3 text-center w-24">শতকরা হার</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.breakdown.map((item, idx) => (
                      <tr key={idx} className="border-b border-gray-300 hover:bg-gray-50">
                        <td className="py-2 px-3 border-r border-gray-400 text-gray-950 font-medium">{item.category}</td>
                        <td className="py-2 px-3 border-r border-gray-400 text-right font-bold font-mono">৳ {toBanglaNum(item.amount.toLocaleString('bn-BD'))}</td>
                        <td className="py-2 px-3 text-center font-semibold">{toBanglaNum(item.percentage)}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Donors List */}
              {report.majorDonors && report.majorDonors.length > 0 && (
                <div className="space-y-2 pt-2">
                  <h4 className="text-[11px] font-bold text-gray-900 border-b border-gray-400 pb-1">প্রধান ডোনার ও পৃষ্ঠপোষকবৃন্দ</h4>
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    {report.majorDonors.map((donor, idx) => (
                      <div key={idx} className="border border-gray-300 p-2.5 rounded bg-gray-50/30 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-gray-950 text-[11px]">{donor.name}</p>
                          <p className="text-[9px] text-gray-600 mt-0.5">{donor.location}</p>
                        </div>
                        <span className="font-bold text-gray-900 text-[11px] shrink-0 ml-2">৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Signature Verification Block at the bottom of printed page */}
        <div className="mt-16 pt-8 border-t-2 border-gray-300 grid grid-cols-3 gap-4 text-center text-xs font-bold text-gray-800 avoid-break">
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">সভাপতি</p>
          </div>
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">সাধারণ সম্পাদক</p>
          </div>
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">অর্থ-সম্পাদক</p>
          </div>
        </div>
      </div>

      {/* 3. Monthly Report Print-Only Layout */}
      <div className="hidden print:block text-black bg-white p-6 max-w-4xl mx-auto font-sans" id="monthly-report-print-area">
        {/* Document Header with Logo and Double Decorative Lines */}
        <div className="flex items-center justify-between border-b-4 border-double border-gray-800 pb-4 mb-6">
          <div className="flex items-center space-x-4">
            <img 
              src={logo} 
              onError={handleLogoError}
              alt="Logo" 
              className="h-16 w-16 object-contain rounded-full border border-gray-300 bg-white"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <p className="text-[10px] font-bold text-gray-700">বিসমিল্লাহির রাহমানির রাহিম</p>
              <h1 className="text-lg sm:text-xl font-black text-gray-950 tracking-tight">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h1>
              <p className="text-[11px] font-bold text-gray-700">সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম, বাংলাদেশ।</p>
            </div>
          </div>
          <div className="text-right border border-gray-400 p-2 rounded bg-gray-50">
            <p className="text-[9px] font-bold text-gray-600">প্রতিবেদন ধরণ</p>
            <p className="text-xs font-black text-gray-950">মাসিক হিসাব সারাংশ</p>
            <p className="text-[9px] font-bold text-gray-800 mt-0.5">মাস: {selectedMonthData?.monthYearLabel}</p>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-6">
          <h2 className="text-base font-bold text-gray-950 border-b border-gray-300 pb-1.5 inline-block px-6">
            মাসিক আয় ও ব্যয়ের আর্থিক বিবরণী প্রতিবেদন
          </h2>
        </div>

        {/* Financial Summary Box */}
        <div className="grid grid-cols-3 gap-4 text-center mb-8 border border-gray-400 p-3 rounded bg-gray-50/50">
          <div className="border-r border-gray-300">
            <span className="text-[9px] text-gray-700 block font-bold">আয় (সংগৃহীত বাজেট)</span>
            <span className="text-base font-black text-green-700">৳ {toBanglaNum((selectedMonthData?.totalIncome || 0).toLocaleString('bn-BD'))}</span>
          </div>
          <div className="border-r border-gray-300">
            <span className="text-[9px] text-gray-700 block font-bold">ব্যয় (ব্যয়িত বাজেট)</span>
            <span className="text-base font-black text-red-700">৳ {toBanglaNum((selectedMonthData?.totalExpense || 0).toLocaleString('bn-BD'))}</span>
          </div>
          <div>
            <span className="text-[9px] text-gray-700 block font-bold">মাসিক উদ্বৃত্ত অবশিষ্টাংশ</span>
            <span className="text-base font-black text-amber-700">৳ {toBanglaNum((selectedMonthData?.surplus || 0).toLocaleString('bn-BD'))}</span>
          </div>
        </div>

        {/* Two Columns for Income and Expense breakdowns */}
        <div className="grid grid-cols-2 gap-6 items-start">
          {/* Income Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 border-b border-gray-400 pb-1 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-green-600 rounded-full"></span>
              <span>মাসিক আয়ের খাতসমূহ</span>
            </h3>
            <table className="w-full border-collapse border border-gray-400 text-xs text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-400 font-bold text-gray-900 text-center">
                  <th className="py-1.5 px-2 border-r border-gray-400 text-left">আয়ের খাত</th>
                  <th className="py-1.5 px-2 text-right w-28">পরিমাণ</th>
                </tr>
              </thead>
              <tbody>
                {selectedMonthData?.incomeBreakdown && selectedMonthData.incomeBreakdown.length > 0 ? (
                  selectedMonthData.incomeBreakdown.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="py-1.5 px-2 border-r border-gray-400 font-medium">{item.category}</td>
                      <td className="py-1.5 px-2 text-right font-bold font-mono">৳ {toBanglaNum(item.amount.toLocaleString('bn-BD'))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500">কোনো আয়ের রেকর্ড নেই</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Expense Breakdown */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-gray-900 border-b border-gray-400 pb-1 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-red-600 rounded-full"></span>
              <span>মাসিক ব্যয়ের খাতসমূহ</span>
            </h3>
            <table className="w-full border-collapse border border-gray-400 text-xs text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-400 font-bold text-gray-900 text-center">
                  <th className="py-1.5 px-2 border-r border-gray-400 text-left">ব্যয়ের খাত</th>
                  <th className="py-1.5 px-2 text-right w-28">পরিমাণ</th>
                </tr>
              </thead>
              <tbody>
                {selectedMonthData?.expenseBreakdown && selectedMonthData.expenseBreakdown.length > 0 ? (
                  selectedMonthData.expenseBreakdown.map((item, idx) => (
                    <tr key={idx} className="border-b border-gray-300">
                      <td className="py-1.5 px-2 border-r border-gray-400 font-medium">{item.category}</td>
                      <td className="py-1.5 px-2 text-right font-bold font-mono">৳ {toBanglaNum(item.amount.toLocaleString('bn-BD'))}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={2} className="py-4 text-center text-gray-500">কোনো ব্যয়ের রেকর্ড নেই</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Detailed Transactions List */}
        {selectedMonthData?.transactions && selectedMonthData.transactions.length > 0 && (
          <div className="space-y-2 mt-8 avoid-break">
            <h3 className="text-xs font-bold text-gray-900 border-b border-gray-400 pb-1">
              বিস্তারিত লেনদেন বিবরণী ({toBanglaNum(selectedMonthData.transactions.length)} টি লেনদেন)
            </h3>
            <table className="w-full border-collapse border border-gray-400 text-[10px] text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-400 font-bold text-gray-900 text-center">
                  <th className="py-1 px-1.5 border-r border-gray-400 text-center w-20">তারিখ</th>
                  <th className="py-1 px-1.5 border-r border-gray-400 text-center w-12">ধরণ</th>
                  <th className="py-1 px-1.5 border-r border-gray-400 text-left">খাত / বিবরণ</th>
                  <th className="py-1 px-1.5 border-r border-gray-400 text-left w-36">দাতা / রিসিভার</th>
                  <th className="py-1 px-1.5 text-right w-24">টাকা</th>
                </tr>
              </thead>
              <tbody>
                {selectedMonthData.transactions.map((t, idx) => (
                  <tr key={idx} className="border-b border-gray-300">
                    <td className="py-1 px-1.5 border-r border-gray-400 text-center font-mono">{toBanglaNum(t.date || '')}</td>
                    <td className={`py-1 px-1.5 border-r border-gray-400 text-center font-bold ${t.type === 'income' ? 'text-green-800' : 'text-red-800'}`}>
                      {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                    </td>
                    <td className="py-1 px-1.5 border-r border-gray-400">
                      <span className="font-semibold">
                        {t.category === 'সাধারণ রশিদ কালেকশন' ? (t.houseName ? `বাড়ি: ${t.houseName}` : 'চাঁদা ও অনুদান') : t.category}
                      </span>
                      {t.description && <span className="text-gray-500 block text-[8px] font-normal">{t.description}</span>}
                    </td>
                    <td className="py-1 px-1.5 border-r border-gray-400 truncate max-w-[140px]">
                      {t.donorName || '---'}
                    </td>
                    <td className="py-1 px-1.5 text-right font-bold font-mono">
                      ৳ {toBanglaNum(t.amount.toLocaleString('bn-BD'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Signature Verification Block */}
        <div className="mt-16 pt-8 border-t-2 border-gray-300 grid grid-cols-3 gap-4 text-center text-xs font-bold text-gray-800 avoid-break">
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">সভাপতি</p>
          </div>
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">সাধারণ সম্পাদক</p>
          </div>
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">অর্থ-সম্পাদক</p>
          </div>
        </div>
      </div>
    </div>
  );
}
