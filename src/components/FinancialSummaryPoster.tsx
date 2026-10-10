import React from 'react';
import { Transaction, MahfilDetails } from '../types';
import QRCode from 'qrcode';
import { APP_LOGO_BASE64, handleLogoError } from '../lib/logoConstants';
import { 
  Download, 
  Printer, 
  Calendar, 
  MapPin, 
  Building2, 
  Edit3, 
  Sparkles, 
  CheckCircle2, 
  ChevronDown, 
  ChevronUp, 
  RefreshCw, 
  Layers, 
  Sliders, 
  Plus, 
  Trash2,
  AlertCircle,
  FileSpreadsheet,
  QrCode,
  Image as ImageIcon
} from 'lucide-react';
import { exportElementToJpg } from '../utils/html2canvasSafe';
import { isHouseCollection, sortTransactionsFIFO } from '../lib/transactionUtils';

// Translate English digits to Bengali digits
const toBanglaNum = (num: number | string): string => {
  if (num === undefined || num === null) return '০';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
};

// Helper to get today's date dynamically in Bengali digits (DD/MM/YYYY)
const getTodayBanglaDate = (): string => {
  const d = new Date();
  const day = toBanglaNum(d.getDate().toString().padStart(2, '0'));
  const m = toBanglaNum((d.getMonth() + 1).toString().padStart(2, '0'));
  const y = toBanglaNum(d.getFullYear());
  return `${day}/${m}/${y}`;
};

interface FinancialSummaryPosterProps {
  transactions: Transaction[];
  mahfilDetails?: MahfilDetails;
  selectedYear?: string;
  onYearChange?: (year: string) => void;
}

interface IncomeSlab {
  amount: number;
  count: number;
  total: number;
  label?: string;
}

interface OtherIncomeItem {
  id: string;
  title: string;
  amount: number;
}

interface ExpenseDisplayItem {
  id?: string;
  name: string;
  amount: number;
  category?: string;
  isEmpty?: boolean;
}

interface IncomeDisplayItem {
  id?: string;
  name: string;
  subLabel?: string;
  amount: number;
  category?: string;
}

export default function FinancialSummaryPoster({
  transactions = [],
  mahfilDetails,
  selectedYear,
  onYearChange
}: FinancialSummaryPosterProps) {
  const posterRef = React.useRef<HTMLDivElement>(null);

  // Available years from transactions
  const availableYears = React.useMemo(() => {
    const yearsSet = new Set<number>();
    transactions.forEach((t) => {
      if (t.year) yearsSet.add(t.year);
    });
    // Ensure 2026, 2025, 2024 are present
    yearsSet.add(2026);
    yearsSet.add(2025);
    yearsSet.add(2024);
    return Array.from(yearsSet).sort((a, b) => b - a);
  }, [transactions]);

  // Determine intelligent default year: if 2026 has transactions, use 2026; else 2025 (where data exists)
  const initialYear = React.useMemo(() => {
    if (selectedYear) return selectedYear;
    const has2026 = transactions.some(t => t.year === 2026);
    if (has2026) return '2026';
    const has2025 = transactions.some(t => t.year === 2025);
    if (has2025) return '2025';
    return '2026';
  }, [transactions, selectedYear]);

  const [currentYear, setCurrentYear] = React.useState<string>(initialYear);

  // Synchronize year when props change
  React.useEffect(() => {
    if (selectedYear && selectedYear !== currentYear) {
      setCurrentYear(selectedYear);
    }
  }, [selectedYear]);

  // Handle year selection
  const handleYearSelect = (yr: string) => {
    setCurrentYear(yr);
    if (onYearChange) onYearChange(yr);
  };

  // Configurable fields according to user instructions:
  // "ডেটিং দিবেন এ অ্যাপের ভিতরের নাম ঠিকানা ব্যবহার করবেন"
  const defaultLocation = mahfilDetails?.location || 'সোনারগাঁও, তুপ্পারপাড়, রাঙ্গুনিয়া, চট্টগ্রাম।';
  const defaultOrganization = 'সোনারগাঁও আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ পরিচালনা কমিটির ব্যবস্থাপনায়';
  const defaultTitle = 'পবিত্র ঈদ-এ মিলাদুন্নবী (সা.)-এর আয়-ব্যয়ের হিসাব';

  // Dynamic default date: automatically reflects the current date when viewing the report
  const [posterDate, setPosterDate] = React.useState<string>(getTodayBanglaDate);

  // Automatically sync to today's date whenever the report is mounted or viewed
  React.useEffect(() => {
    setPosterDate(getTodayBanglaDate());
  }, []);
  const [organizationName, setOrganizationName] = React.useState<string>(defaultOrganization);
  const [posterTitle, setPosterTitle] = React.useState<string>(defaultTitle);
  const [posterLocation, setPosterLocation] = React.useState<string>(defaultLocation);

  // Settings drawer state
  const [showConfigPanel, setShowConfigPanel] = React.useState<boolean>(false);
  const [isExportingJpg, setIsExportingJpg] = React.useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = React.useState<string>('');

  // View modes
  // Expense display mode: 'itemized' (actual expense items from transactions) or 'category' (grouped by category)
  const [expenseDisplayMode, setExpenseDisplayMode] = React.useState<'itemized' | 'category'>('itemized');
  // Sort order: 'fifo' (first entered transaction appears at #1: ১নং গরু ক্রয় থেকে শুরু) vs 'lifo' (reverse)
  const [expenseOrder, setExpenseOrder] = React.useState<'fifo' | 'lifo'>('fifo');
  // Pad expenses to 15 items if fewer than 15, starting from serial 1 to 15 as requested
  const [padExpensesTo15, setPadExpensesTo15] = React.useState<boolean>(true);
  
  // Income display mode: 'items' (every manual posting item/দফা shown individually), 'receipt' (single consolidated row 'রশিদ মূলে চাঁদা আদায়'), 'category' (by category), or 'slabs' (by donation amount slabs)
  const [incomeDisplayMode, setIncomeDisplayMode] = React.useState<'items' | 'receipt' | 'category' | 'slabs'>('items');
  const [incomeOrder, setIncomeOrder] = React.useState<'fifo' | 'lifo'>('fifo');
  const [receiptDonationLabel, setReceiptDonationLabel] = React.useState<string>('রশিদ মূলে চাঁদা আদায়');
  const [showDenotation, setShowDenotation] = React.useState<boolean>(true);
  const [customDenoteNote, setCustomDenoteNote] = React.useState<string>('');

  // 4 Account Preparers with signature space
  const [showPreparers, setShowPreparers] = React.useState<boolean>(true);
  const [preparerNames, setPreparerNames] = React.useState<string[]>([
    'মোঃ আব্দুস সত্তার',
    'মোঃ তারেক',
    'মোঃ লোকমান হোসেন',
    'মোঃ হেলাল হোসেন',
  ]);

  // Header Branding: Logo and App QR Code
  const defaultAppUrl = 'https://sonargaon-celebration-council-435217603340.asia-southeast1.run.app';
  const [showLogoInPoster, setShowLogoInPoster] = React.useState<boolean>(true);
  const [showQrInPoster, setShowQrInPoster] = React.useState<boolean>(true);
  const [qrCodeLink, setQrCodeLink] = React.useState<string>(defaultAppUrl);
  const [qrCodeDataUrl, setQrCodeDataUrl] = React.useState<string>('');

  // Generate high-resolution base64 QR code for offline rendering & safe JPG export
  React.useEffect(() => {
    let isCancelled = false;
    const targetUrl = (qrCodeLink && qrCodeLink.trim()) || defaultAppUrl;
    QRCode.toDataURL(targetUrl, {
      width: 256,
      margin: 1,
      color: {
        dark: '#064e3b',
        light: '#ffffff'
      }
    })
      .then((url) => {
        if (!isCancelled) {
          setQrCodeDataUrl(url);
        }
      })
      .catch((err) => {
        console.error('Error generating QR code:', err);
      });

    return () => {
      isCancelled = true;
    };
  }, [qrCodeLink]);

  const [excludeHouseCollections, setExcludeHouseCollections] = React.useState<boolean>(true);

  // Filter transactions by selected year (excluding house collections from the public poster by default)
  const yearTransactions = React.useMemo(() => {
    const list = excludeHouseCollections ? transactions.filter(t => !isHouseCollection(t)) : transactions;
    if (currentYear === 'all') return list;
    const yrNum = parseInt(currentYear, 10);
    return list.filter((t) => (t.year ? t.year === yrNum : true));
  }, [transactions, currentYear, excludeHouseCollections]);

  // Separate incomes & expenses for the selected year directly from app
  const rawIncomes = React.useMemo(() => yearTransactions.filter((t) => t.type === 'income'), [yearTransactions]);
  const rawExpenses = React.useMemo(() => yearTransactions.filter((t) => t.type === 'expense'), [yearTransactions]);

  // Calculate previous year opening balance from actual transactions prior to currentYear
  const autoPreviousBalance = React.useMemo(() => {
    if (currentYear === 'all') return 0;
    const yrNum = parseInt(currentYear, 10);
    const priorTransactions = transactions.filter(t => t.year && t.year < yrNum && (!excludeHouseCollections || !isHouseCollection(t)));
    const priorIncome = priorTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const priorExpense = priorTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return priorIncome - priorExpense;
  }, [transactions, currentYear, excludeHouseCollections]);

  const [previousYearLabel, setPreviousYearLabel] = React.useState<string>('বিগত বছর ২০২৫ সালের হাতে নগদ');
  const [previousYearBalance, setPreviousYearBalance] = React.useState<number>(123415);

  // When currentYear changes, update default previousYearLabel and balance
  React.useEffect(() => {
    if (currentYear !== 'all') {
      const yrNum = parseInt(currentYear, 10);
      const prevYr = yrNum - 1;
      setPreviousYearLabel(`বিগত বছর ${toBanglaNum(prevYr)} সালের হাতে নগদ`);
      if (yrNum === 2026) {
        // User's reference value from verified accounts sheet
        setPreviousYearBalance(autoPreviousBalance > 0 ? autoPreviousBalance : 123415);
      } else if (autoPreviousBalance !== 0) {
        setPreviousYearBalance(autoPreviousBalance);
      }
    } else {
      setPreviousYearLabel('বিগত বছর ২০২৫ সালের হাতে নগদ');
      setPreviousYearBalance(0);
    }
  }, [currentYear, autoPreviousBalance]);

  // 1. Process Expenses 100% from actual app transactions
  // Ensured starting from serial 1 (FIFO order: ১ম এন্ট্রি 'গরু ক্রয় একটি' থেকে শুরু)
  const displayExpenses = React.useMemo<ExpenseDisplayItem[]>(() => {
    if (rawExpenses.length === 0) return [];

    if (expenseDisplayMode === 'category') {
      // Group by category
      const map: Record<string, number> = {};
      rawExpenses.forEach(t => {
        const cat = t.category || 'বিবিধ খরচ';
        map[cat] = (map[cat] || 0) + t.amount;
      });
      return Object.entries(map).map(([name, amount], idx) => ({
        id: `cat_${idx}`,
        name,
        amount
      })).sort((a, b) => b.amount - a.amount);
    }

    // Itemized list directly from transactions
    // Sort transactions so that the first entered expense (e.g. 'গরু ক্রয় একটি') appears at index 0 (১ নম্বর)
    let ordered = sortTransactionsFIFO(rawExpenses);
    
    // Safety check: If the raw list starts with 'বিবিধ' and ends with 'গরু', and wasn't reversed yet:
    const firstTitle = (ordered[0]?.description || ordered[0]?.category || '').toLowerCase();
    const lastTitle = (ordered[ordered.length - 1]?.description || ordered[ordered.length - 1]?.category || '').toLowerCase();
    if (expenseOrder === 'fifo' && firstTitle.includes('বিবিধ') && (lastTitle.includes('গরু') || lastTitle.includes('মাংস'))) {
      ordered = [...ordered].reverse();
    } else if (expenseOrder === 'lifo') {
      ordered = [...ordered].reverse();
    }

    const mapped: ExpenseDisplayItem[] = ordered.map((t, idx) => ({
      id: t.id || `exp_${idx}`,
      name: t.description || t.category || `ব্যয় #${toBanglaNum(idx + 1)}`,
      amount: t.amount,
      category: t.category
    }));

    // Pad with empty rows up to 15 if requested, starting from serial 1 through 15
    if (padExpensesTo15 && mapped.length > 0 && mapped.length < 15) {
      const remaining = 15 - mapped.length;
      for (let i = 0; i < remaining; i++) {
        mapped.push({
          id: `exp_empty_${mapped.length + i}`,
          name: '',
          amount: 0,
          isEmpty: true
        });
      }
    }

    return mapped;
  }, [rawExpenses, expenseDisplayMode, expenseOrder, padExpensesTo15]);

  // Total expense from real transactions
  const totalExpenseAmount = React.useMemo(() => {
    return rawExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [rawExpenses]);

  // Custom other income state
  const [customOtherIncomes, setCustomOtherIncomes] = React.useState<OtherIncomeItem[]>([]);
  const [useCustomOtherIncome, setUseCustomOtherIncome] = React.useState<boolean>(false);

  // Total Income Calculation
  const totalIncomeAmount = React.useMemo(() => {
    const rawTotal = rawIncomes.reduce((sum, t) => sum + t.amount, 0);
    const extraTotal = (useCustomOtherIncome && customOtherIncomes.length > 0)
      ? customOtherIncomes.reduce((sum, item) => sum + item.amount, 0)
      : 0;
    return rawTotal + extraTotal;
  }, [rawIncomes, useCustomOtherIncome, customOtherIncomes]);

  const totalPrimaryIncome = React.useMemo(() => {
    return rawIncomes.reduce((sum, t) => sum + t.amount, 0);
  }, [rawIncomes]);

  // 2. Process Incomes 100% from actual app transactions
  // Default 'items' mode displays EVERY single manual posting item/দফা row by row starting from 1
  const displayIncomes = React.useMemo<IncomeDisplayItem[]>(() => {
    if (rawIncomes.length === 0) return [];

    if (incomeDisplayMode === 'category') {
      const map: Record<string, number> = {};
      rawIncomes.forEach((t) => {
        const cat = t.category || 'সাধারণ অনুদান';
        map[cat] = (map[cat] || 0) + t.amount;
      });
      return Object.entries(map)
        .map(([name, amount], idx) => ({
          id: `inc_cat_${idx}`,
          name,
          amount
        }))
        .sort((a, b) => b.amount - a.amount);
    }

    if (incomeDisplayMode === 'receipt') {
      return [
        {
          id: 'inc_receipt_single',
          name: receiptDonationLabel,
          subLabel:
            rawIncomes.length > 0
              ? `(সর্বমোট ${toBanglaNum(rawIncomes.length)}টি বই/উৎস মারফত সংগৃহীত চাঁদা)`
              : undefined,
          amount: totalIncomeAmount
        }
      ];
    }

    // Default: 'items' - display every manual posting entry/দফা individually
    let ordered = sortTransactionsFIFO(rawIncomes);
    if (incomeOrder === 'lifo') {
      ordered = [...ordered].reverse();
    }

    const items: IncomeDisplayItem[] = ordered.map((t, idx) => {
      const title =
        t.description?.trim() ||
        t.donorName?.trim() ||
        t.category ||
        `আয়ের দফা #${toBanglaNum(idx + 1)}`;
      let sub = '';
      if (t.receiptNo && !title.includes(t.receiptNo)) {
        sub = `রশিদ নং: ${t.receiptNo}`;
      } else if (t.category && t.category !== title && t.category !== 'অন্যান্য') {
        sub = t.category;
      }
      return {
        id: t.id || `inc_${idx}`,
        name: title,
        subLabel: sub || undefined,
        amount: t.amount,
        category: t.category
      };
    });

    if (useCustomOtherIncome && customOtherIncomes.length > 0) {
      customOtherIncomes.forEach((item) => {
        items.push({
          id: item.id,
          name: item.title,
          amount: item.amount
        });
      });
    }

    return items;
  }, [
    rawIncomes,
    incomeDisplayMode,
    incomeOrder,
    receiptDonationLabel,
    totalIncomeAmount,
    useCustomOtherIncome,
    customOtherIncomes
  ]);

  // Primary Incomes & Other Incomes separation for legacy slabs mode if needed
  const { primaryIncomes, autoOtherIncomes } = React.useMemo(() => {
    const primary: Transaction[] = [];
    const other: Transaction[] = [];

    rawIncomes.forEach(t => {
      if (t.category === 'অন্যান্য') {
        other.push(t);
      } else {
        primary.push(t);
      }
    });

    return { primaryIncomes: primary, autoOtherIncomes: other };
  }, [rawIncomes]);

  // Effective Other Incomes list
  const effectiveOtherIncomes = React.useMemo<OtherIncomeItem[]>(() => {
    if (useCustomOtherIncome && customOtherIncomes.length > 0) {
      return customOtherIncomes;
    }
    if (autoOtherIncomes.length > 0) {
      return autoOtherIncomes.map((t, idx) => ({
        id: t.id || `other_${idx}`,
        title: t.donorName || t.description || t.category || `অন্যান্য আয় #${idx + 1}`,
        amount: t.amount
      }));
    }
    return [];
  }, [useCustomOtherIncome, customOtherIncomes, autoOtherIncomes]);

  const totalOtherIncomeAmount = React.useMemo(() => {
    return effectiveOtherIncomes.reduce((sum, item) => sum + item.amount, 0);
  }, [effectiveOtherIncomes]);

  // Process Primary Incomes (either by collection sources/books or by amount slabs)
  const incomeSlabs = React.useMemo<IncomeSlab[]>(() => {
    if (primaryIncomes.length === 0) return [];

    if (incomeDisplayMode === 'slabs') {
      const slabMap: Record<number, number> = {};
      primaryIncomes.forEach((t) => {
        const amt = Number(t.amount) || 0;
        if (amt > 0) {
          slabMap[amt] = (slabMap[amt] || 0) + 1;
        }
      });
      return Object.entries(slabMap)
        .map(([amtStr, count]) => {
          const amt = Number(amtStr);
          return {
            amount: amt,
            count,
            total: amt * count,
            label: `${toBanglaNum(amt.toLocaleString('bn-BD'))} টাকা`
          };
        })
        .sort((a, b) => a.amount - b.amount);
    }

    return primaryIncomes.map((t, idx) => {
      const label = t.donorName || t.description || `${toBanglaNum(idx + 1)}নং চাঁদা সংগ্রহ`;
      return {
        amount: t.amount,
        count: 1,
        total: t.amount,
        label
      };
    });
  }, [primaryIncomes, incomeDisplayMode]);

  const totalDonorCount = React.useMemo(() => {
    if (incomeDisplayMode === 'slabs') {
      return incomeSlabs.reduce((sum, slab) => sum + slab.count, 0);
    }
    return rawIncomes.length;
  }, [incomeSlabs, incomeDisplayMode, rawIncomes]);

  // Surplus / Deficit calculation from actual figures
  const mainDifference = totalIncomeAmount - totalExpenseAmount;
  const isDeficit = mainDifference < 0;
  const deficitOrSurplusAmount = Math.abs(mainDifference);

  // Net overall calculation
  const netSurplusOrDeficit = mainDifference;
  const closingBalance = previousYearBalance + netSurplusOrDeficit;

  // Handle Export to JPG
  const handleDownloadJpg = async () => {
    if (!posterRef.current) return;
    setIsExportingJpg(true);
    setExportSuccessMsg('');
    try {
      const cleanDate = posterDate.replace(/[\/\\]/g, '-').trim();
      const fileName = `Hisab-Sar-Sangkhep-${currentYear}-${cleanDate}.jpg`;
      await exportElementToJpg(posterRef.current, {
        fileName,
        quality: 0.98,
        scale: 3, // Ultra-sharp 300dpi-equivalent resolution
        backgroundColor: '#ffffff'
      });
      setExportSuccessMsg('জেপিজি ছবি সফলভাবে ডাউনলোড হয়েছে!');
      setTimeout(() => setExportSuccessMsg(''), 4000);
    } catch (error) {
      console.error('Error downloading JPG:', error);
      alert('ছবি তৈরিতে একটি সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Handle Print
  const handlePrint = () => {
    window.print();
  };

  // Add new other income
  const handleAddOtherIncome = () => {
    setUseCustomOtherIncome(true);
    setCustomOtherIncomes(prev => [
      ...prev,
      { id: Date.now().toString(), title: 'নতুন আয় খাত', amount: 0 }
    ]);
  };

  return (
    <div className="space-y-6">
      {/* Top Action & Control Header */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 sm:p-5 shadow-xs">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div>
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-100 text-[#064e3b] rounded-xl">
                <FileSpreadsheet className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900">
                  হিসাবের সার সংক্ষেপ (পোস্টার ডিজাইন ও জেপিজি ছবি)
                </h2>
                <p className="text-xs sm:text-sm text-slate-600">
                  আদর্শ পোস্টার ডিজাইনে এই অ্যাপের বাস্তব হিসাবসমূহ প্রস্তুত ও ডাউনলোড করুন
                </p>
              </div>
            </div>

            {/* Year Selector Pills */}
            <div className="flex flex-wrap items-center gap-2 mt-3 pt-3 border-t border-slate-100">
              <span className="text-xs font-bold text-slate-700 mr-1 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-emerald-700" />
                হিসাবের বছর:
              </span>
              {availableYears.map((yr) => {
                const count = transactions.filter((t) => t.year === yr).length;
                const isSelected = currentYear === yr.toString();
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => handleYearSelect(yr.toString())}
                    className={`px-3 py-1 text-xs font-bold rounded-lg transition-all flex items-center space-x-1.5 ${
                      isSelected
                        ? 'bg-[#064e3b] text-white shadow-xs scale-102'
                        : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    }`}
                  >
                    <span>{toBanglaNum(yr)} সাল</span>
                    {count > 0 && (
                      <span
                        className={`text-[10px] px-1.5 py-0.2 rounded-full ${
                          isSelected ? 'bg-emerald-800 text-emerald-100' : 'bg-slate-200 text-slate-600'
                        }`}
                      >
                        {toBanglaNum(count)} টি
                      </span>
                    )}
                  </button>
                );
              })}
              <button
                type="button"
                onClick={() => handleYearSelect('all')}
                className={`px-3 py-1 text-xs font-bold rounded-lg transition-all ${
                  currentYear === 'all'
                    ? 'bg-[#064e3b] text-white shadow-xs'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                সব বছর
              </button>

              <button
                type="button"
                onClick={() => setExcludeHouseCollections(!excludeHouseCollections)}
                className={`px-2.5 py-1 text-xs font-bold rounded-lg transition-all border flex items-center space-x-1.5 cursor-pointer ${
                  excludeHouseCollections
                    ? 'bg-emerald-50 text-emerald-900 border-emerald-300'
                    : 'bg-amber-50 text-amber-900 border-amber-300'
                }`}
                title="বাড়ি ভিত্তিক ব্যক্তিদের চাঁদা পোস্টারে অন্তর্ভুক্ত বা বাদ দিন"
              >
                <span className={`w-2 h-2 rounded-full ${excludeHouseCollections ? 'bg-emerald-600' : 'bg-amber-500'}`}></span>
                <span>{excludeHouseCollections ? 'বাড়ি চাঁদা বাদ দেওয়া' : 'বাড়ি চাঁদা সহ'}</span>
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setShowConfigPanel(!showConfigPanel)}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Sliders className="w-4 h-4 text-slate-600" />
              <span>{showConfigPanel ? 'সেটিংস বন্ধ করুন' : 'তথ্য ও অপশন পরিবর্তন'}</span>
              {showConfigPanel ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center space-x-1.5 transition-colors"
            >
              <Printer className="w-4 h-4 text-slate-600" />
              <span>প্রিন্ট</span>
            </button>

            <button
              type="button"
              onClick={handleDownloadJpg}
              disabled={isExportingJpg}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black shadow-xs flex items-center space-x-2 transition-all disabled:opacity-50"
            >
              {isExportingJpg ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>ছবি তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  <span>জেপিজি ছবি ডাউনলোড (JPG)</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Success Alert Message */}
        {exportSuccessMsg && (
          <div className="mt-3 p-3 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center space-x-2 text-xs font-bold text-emerald-800">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Informational banner if selected year has 0 transactions */}
        {yearTransactions.length === 0 && (
          <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs font-bold text-amber-900">
            <div className="flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
              <span>
                চলতি {toBanglaNum(currentYear)} সালে এখনও কোনো লেনদেন রেকর্ড করা হয়নি। (আয় ও ব্যয় ০ টাকা দেখাচ্ছে)
              </span>
            </div>
            <button
              type="button"
              onClick={() => handleYearSelect('2025')}
              className="px-2.5 py-1 bg-amber-600 text-white hover:bg-amber-700 rounded-md text-[11px] font-bold"
            >
              ২০২৫ সালের হিসাব দেখুন
            </button>
          </div>
        )}

        {/* Config / Customization Panel */}
        {showConfigPanel && (
          <div className="mt-4 pt-4 border-t border-slate-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 bg-slate-50/80 p-4 rounded-xl">
            {/* Poster Date */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                📅 পোস্টারের তারিখ (ডাইনামিক):
              </label>
              <div className="flex items-center space-x-1.5">
                <input
                  type="text"
                  value={posterDate}
                  onChange={(e) => setPosterDate(e.target.value)}
                  placeholder={getTodayBanglaDate()}
                  className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                />
                <button
                  type="button"
                  onClick={() => setPosterDate(getTodayBanglaDate())}
                  className="text-[10px] text-emerald-800 hover:underline font-bold whitespace-nowrap px-2 py-1.5 bg-white border border-slate-300 rounded-lg"
                  title="বর্তমান দিনের তারিখ সেট করুন"
                >
                  আজকের তারিখ
                </button>
              </div>
              <p className="text-[10px] text-slate-500 mt-0.5">
                * স্বয়ংক্রিয়ভাবে প্রতিদিনের বর্তমান তারিখ দেখানো হয়।
              </p>
            </div>

            {/* Committee / Org Name */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                🏛️ পরিচালনা কমিটি / প্রতিষ্ঠানের নাম:
              </label>
              <input
                type="text"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                📍 ঠিকানা (অ্যাপের অভ্যন্তরীণ):
              </label>
              <input
                type="text"
                value={posterLocation}
                onChange={(e) => setPosterLocation(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
              />
            </div>

            {/* Header Branding (Logo & QR) */}
            <div className="p-2.5 bg-emerald-50/60 rounded-xl border border-emerald-200">
              <label className="block text-[11px] font-bold text-emerald-950 mb-1.5">
                🏷️ হেডিংয়ের দুই পাশের উপাদান (লোগো ও কিউআর কোড):
              </label>
              <div className="grid grid-cols-2 gap-2 mb-2">
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showLogoInPoster}
                    onChange={(e) => setShowLogoInPoster(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>বাম পাশে লোগো</span>
                </label>
                <label className="flex items-center space-x-1.5 text-xs font-semibold text-slate-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showQrInPoster}
                    onChange={(e) => setShowQrInPoster(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-700 focus:ring-emerald-600"
                  />
                  <span>ডান পাশে কিউআর</span>
                </label>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-600 mb-0.5">
                  কিউআর কোডের লিংক (URL):
                </label>
                <div className="flex items-center space-x-1">
                  <input
                    type="text"
                    value={qrCodeLink}
                    onChange={(e) => setQrCodeLink(e.target.value)}
                    placeholder="https://..."
                    className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-[11px] font-mono text-slate-800 focus:outline-none focus:ring-1 focus:ring-emerald-700"
                  />
                  <button
                    type="button"
                    onClick={() => setQrCodeLink(defaultAppUrl)}
                    className="px-2 py-1 text-[10px] font-bold bg-white hover:bg-slate-100 text-emerald-800 border border-slate-300 rounded whitespace-nowrap"
                  >
                    ডিফল্ট
                  </button>
                </div>
              </div>
            </div>

            {/* Previous Year Balance */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                💰 বিগত সালের জমা (হাতে নগদ):
              </label>
              <div className="flex items-center space-x-1.5 mb-1.5">
                <input
                  type="text"
                  value={previousYearLabel}
                  onChange={(e) => setPreviousYearLabel(e.target.value)}
                  placeholder="বিগত বছর ২০২৫ সালের হাতে নগদ"
                  className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold"
                />
                <input
                  type="number"
                  value={previousYearBalance}
                  onChange={(e) => setPreviousYearBalance(Number(e.target.value) || 0)}
                  className="w-1/2 px-2 py-1.5 bg-white border border-slate-300 rounded-lg text-xs font-bold text-[#064e3b]"
                />
              </div>
              {/* Quick shortcut chips */}
              <div className="flex flex-wrap items-center gap-1 text-[10px]">
                <span className="text-slate-500 font-bold">দ্রুত নির্বাচন:</span>
                <button
                  type="button"
                  onClick={() => setPreviousYearLabel('বিগত বছর ২০২৫ সালের হাতে নগদ')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-semibold"
                >
                  ২০২৫ সালের হাতে নগদ
                </button>
                <button
                  type="button"
                  onClick={() => setPreviousYearLabel('বিগত বছর ১০১৫ সালের হাতে নগদ')}
                  className="px-1.5 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-800 rounded border border-amber-300 font-semibold"
                  title="ব্যবহারকারীর চাহিদা অনুযায়ী ১০১৫ সালের হাতে নগদ"
                >
                  ১০১৫ সালের হাতে নগদ
                </button>
                <button
                  type="button"
                  onClick={() => setPreviousYearLabel('বিগত সালের অবশিষ্ট জমা')}
                  className="px-1.5 py-0.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded border border-slate-300 font-semibold"
                >
                  বিগত সালের অবশিষ্ট জমা
                </button>
              </div>
            </div>

            {/* Expense Display Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                📋 ব্যয়ের টেবিল প্রদর্শন পদ্ধতি:
              </label>
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setExpenseDisplayMode('itemized')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    expenseDisplayMode === 'itemized'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  আইটেমভিত্তিক ({toBanglaNum(rawExpenses.length)}টি)
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseDisplayMode('category')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    expenseDisplayMode === 'category'
                      ? 'bg-red-700 text-white border-red-700'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  খাতভিত্তিক সারসংক্ষেপ
                </button>
                <button
                  type="button"
                  onClick={() => setExpenseOrder(expenseOrder === 'fifo' ? 'lifo' : 'fifo')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center space-x-1"
                  title="ব্যয়ের ক্রম পরিবর্তন করুন"
                >
                  <RefreshCw className="w-3 h-3 text-red-600" />
                  <span>ক্রম: {expenseOrder === 'fifo' ? '১নং থেকে শুরু (ডিফল্ট)' : 'বিপরীত'}</span>
                </button>
              </div>
              <label className="flex items-center space-x-1.5 text-xs font-bold text-slate-700 mt-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={padExpensesTo15}
                  onChange={(e) => setPadExpensesTo15(e.target.checked)}
                  className="rounded text-red-700 focus:ring-red-700 w-3.5 h-3.5"
                />
                <span>ছবির মতো ব্যয়ের তালিকায় ন্যূনতম ১৫টি সারি প্রদর্শন (১নং হতে ১৫নং)</span>
              </label>
            </div>

            {/* Income Display Mode */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                💰 আয়ের টেবিল প্রদর্শন পদ্ধতি:
              </label>
              <div className="flex flex-wrap items-center gap-1.5 mb-1.5">
                <button
                  type="button"
                  onClick={() => setIncomeDisplayMode('items')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    incomeDisplayMode === 'items'
                      ? 'bg-[#064e3b] text-white border-[#064e3b]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  সকল দফা ({toBanglaNum(rawIncomes.length)}টি - ডিফল্ট)
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeDisplayMode('receipt')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    incomeDisplayMode === 'receipt'
                      ? 'bg-[#064e3b] text-white border-[#064e3b]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  রশিদ মূলে একীভূত
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeDisplayMode('category')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    incomeDisplayMode === 'category'
                      ? 'bg-[#064e3b] text-white border-[#064e3b]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  খাতভিত্তিক
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeDisplayMode('slabs')}
                  className={`px-2.5 py-1.5 text-xs font-bold rounded-lg border transition-all ${
                    incomeDisplayMode === 'slabs'
                      ? 'bg-[#064e3b] text-white border-[#064e3b]'
                      : 'bg-white text-slate-700 border-slate-300'
                  }`}
                >
                  স্ল্যাবভিত্তিক
                </button>
                <button
                  type="button"
                  onClick={() => setIncomeOrder(incomeOrder === 'fifo' ? 'lifo' : 'fifo')}
                  className="px-2.5 py-1 text-xs font-bold rounded-lg border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 flex items-center space-x-1"
                  title="আয়ের ক্রম পরিবর্তন করুন"
                >
                  <RefreshCw className="w-3 h-3 text-emerald-700" />
                  <span>ক্রম: {incomeOrder === 'fifo' ? '১নং থেকে শুরু' : 'বিপরীত'}</span>
                </button>
              </div>
              {incomeDisplayMode === 'receipt' && (
                <div className="pt-1">
                  <input
                    type="text"
                    value={receiptDonationLabel}
                    onChange={(e) => setReceiptDonationLabel(e.target.value)}
                    placeholder="রশিদ মূলে চাঁদা আদায়"
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs font-bold text-[#064e3b]"
                  />
                </div>
              )}
            </div>

            {/* Denotation Settings */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                📌 হিসাবের ডেনোটেশন (বিশেষ দ্রষ্টব্য):
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={showDenotation}
                    onChange={(e) => setShowDenotation(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-700 w-4 h-4"
                  />
                  <span>পোস্টারে ডেনোটেশন বক্স প্রদর্শন করুন</span>
                </label>
                {showDenotation && (
                  <input
                    type="text"
                    value={customDenoteNote}
                    onChange={(e) => setCustomDenoteNote(e.target.value)}
                    placeholder="অতিরিক্ত বিশেষ নোট (ঐচ্ছিক, যেমন কোনো মন্তব্য)..."
                    className="w-full px-2 py-1 bg-white border border-slate-300 rounded text-xs"
                  />
                )}
              </div>
            </div>

            {/* Account Preparers Signature Settings */}
            <div className="md:col-span-2">
              <label className="block text-[11px] font-bold text-slate-700 mb-1">
                ✍️ হিসাব প্রস্তুতকারীগণের নাম ও স্বাক্ষর:
              </label>
              <div className="space-y-1.5">
                <label className="flex items-center space-x-2 text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={showPreparers}
                    onChange={(e) => setShowPreparers(e.target.checked)}
                    className="rounded text-emerald-700 focus:ring-emerald-700 w-4 h-4"
                  />
                  <span>হিসাব প্রস্তুতকারীগণের স্বাক্ষর ব্লক প্রদর্শন করুন</span>
                </label>
                {showPreparers && (
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2 pt-1">
                    {preparerNames.map((pName, idx) => (
                      <div key={idx} className="flex items-center space-x-1">
                        <span className="text-xs font-bold text-slate-500 w-5">{toBanglaNum(idx + 1)}।</span>
                        <input
                          type="text"
                          value={pName}
                          onChange={(e) => {
                            const newNames = [...preparerNames];
                            newNames[idx] = e.target.value;
                            setPreparerNames(newNames);
                          }}
                          placeholder={`প্রস্তুতকারী #${idx + 1}`}
                          className="flex-1 px-2 py-1 bg-white border border-slate-300 rounded text-xs font-semibold"
                        />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ========================================================
          POSTER PREVIEW CONTAINER
          Strictly styled to replicate the reference design poster:
          - Deep forest green outer border with golden inner frame
          - Crisp clean white tables with sharp borders
          - High-contrast typography and authentic Islamic silhouettes
         ======================================================== */}
      <div className="flex justify-center overflow-x-auto pb-6">
        <div
          ref={posterRef}
          id="financial-summary-poster-element"
          className="bg-white text-slate-900 w-full max-w-[850px] shadow-2xl rounded-none p-3.5 sm:p-5 relative select-none font-sans"
          style={{
            fontFamily: "'Hind Siliguri', 'Noto Sans Bengali', system-ui, sans-serif",
            backgroundColor: '#ffffff',
            border: '6px solid #064e3b'
          }}
        >
          {/* Inner Golden Line Border */}
          <div 
            className="p-3 sm:p-4 relative"
            style={{
              border: '1.5px solid #b45309',
              backgroundColor: '#ffffff'
            }}
          >
            {/* Top Header Area with Logo on Left, Heading Info in Center, App QR on Right */}
            <div 
              className="relative pb-3 mb-3"
              style={{ borderBottom: '2px solid #064e3b' }}
            >
              <div className="flex items-center justify-between gap-2 sm:gap-4">
                
                {/* Left Side: App Organization Logo */}
                {showLogoInPoster ? (
                  <div className="shrink-0 flex flex-col items-center justify-center w-20 sm:w-28 text-center">
                    <div 
                      className="p-1 sm:p-1.5 rounded-full bg-white shadow-xs"
                      style={{ border: '2px solid #064e3b' }}
                    >
                      <img
                        src={APP_LOGO_BASE64}
                        onError={handleLogoError}
                        alt="পরিষদ লোগো"
                        className="w-14 h-14 sm:w-20 sm:h-20 object-contain rounded-full bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <span 
                      className="text-[11px] sm:text-xs font-black mt-1.5 leading-normal whitespace-nowrap block text-center"
                      style={{ color: '#064e3b', letterSpacing: '0px' }}
                    >
                      পরিষদ লোগো
                    </span>
                  </div>
                ) : (
                  <div className="w-12 sm:w-20 shrink-0" />
                )}

                {/* Center: Main Heading Details */}
                <div className="flex-1 text-center min-w-0 px-1 sm:px-2">
                  {/* Bismillah in Arabic calligraphy */}
                  <div 
                    className="text-center text-base sm:text-xl font-bold tracking-wide mb-1"
                    style={{ fontFamily: "'Amiri', 'Traditional Arabic', serif", color: '#0f172a' }}
                  >
                    بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                  </div>

                  {/* Organization line */}
                  <div 
                    className="text-center text-xs sm:text-sm font-black tracking-tight"
                    style={{ color: '#064e3b' }}
                  >
                    {organizationName}
                  </div>

                  {/* Main Title */}
                  <h1 
                    className="text-center text-lg sm:text-2xl font-black tracking-tight mt-0.5 sm:mt-1 leading-tight"
                    style={{ color: '#0f172a' }}
                  >
                    {posterTitle}
                  </h1>

                  {/* Address / Location from App */}
                  <div 
                    className="flex items-center justify-center space-x-1.5 text-[11px] sm:text-xs font-bold mt-1"
                    style={{ color: '#334155' }}
                  >
                    <span>📍</span>
                    <span>{posterLocation}</span>
                  </div>

                  {/* Date Badge ("ডেটিং") */}
                  <div className="flex justify-center mt-1.5 sm:mt-2">
                    <span 
                      className="px-4 sm:px-6 py-0.5 sm:py-1 text-[11px] sm:text-xs font-black rounded-full tracking-wide text-white shadow-xs"
                      style={{ backgroundColor: '#064e3b' }}
                    >
                      তারিখ: {posterDate}
                    </span>
                  </div>
                </div>

                {/* Right Side: App QR Code */}
                {showQrInPoster ? (
                  <div className="shrink-0 flex flex-col items-center justify-center w-28 sm:w-32 min-w-[105px] text-center">
                    <div 
                      className="p-1.5 rounded-xl bg-white shadow-xs"
                      style={{ border: '2px solid #064e3b' }}
                    >
                      {qrCodeDataUrl ? (
                        <img
                          src={qrCodeDataUrl}
                          alt="অ্যাপ কিউআর কোড"
                          className="w-16 h-16 sm:w-20 sm:h-20 object-contain rounded-md"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="w-16 h-16 sm:w-20 sm:h-20 flex items-center justify-center bg-slate-50 rounded-md">
                          <QrCode className="w-8 h-8 text-[#064e3b]" />
                        </div>
                      )}
                    </div>
                    <span 
                      className="text-xs sm:text-[13px] font-black mt-1.5 leading-snug whitespace-nowrap block text-center"
                      style={{ color: '#064e3b', whiteSpace: 'nowrap', wordBreak: 'keep-all', letterSpacing: '0px' }}
                    >
                      অ্যাপ কিউআর
                    </span>
                  </div>
                ) : (
                  <div className="w-16 sm:w-24 shrink-0" />
                )}

              </div>
            </div>

            {/* Main Content Grid: Left (ব্যয়) and Right (আয়) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
              
              {/* ========================================================
                  LEFT COLUMN: ব্যয়ের হিসাব, উপ-অনুষ্ঠান ও সারসংক্ষেপ
                 ======================================================== */}
              <div className="space-y-3">
                {/* ব্যয়ের হিসাব Table */}
                <div 
                  className="rounded-none overflow-hidden"
                  style={{ border: '2px solid #991b1b', backgroundColor: '#ffffff' }}
                >
                  {/* Crimson Banner Header */}
                    <div 
                    className="text-white px-3 py-1.5 flex items-center justify-center space-x-2 font-black text-sm tracking-wide"
                    style={{ backgroundColor: '#991b1b' }}
                  >
                    <span>📋</span>
                    <span>ব্যয়ের হিসাব</span>
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr 
                        className="font-black text-slate-800"
                        style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #94a3b8' }}
                      >
                        <th 
                          className="py-2.5 px-2 text-center w-11 font-black align-middle"
                          style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle' }}
                        >
                          ক্রম
                        </th>
                        <th 
                          className="py-2.5 px-3 text-left font-black align-middle"
                          style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle' }}
                        >
                          ব্যয় বিবরণ
                        </th>
                        <th 
                          className="py-2.5 px-3 text-right w-24 sm:w-28 font-black align-middle"
                          style={{ color: '#0f172a', verticalAlign: 'middle' }}
                        >
                          টাকা
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {displayExpenses.length === 0 ? (
                        <tr>
                          <td 
                            colSpan={3} 
                            className="py-3 px-2 text-center text-slate-500 font-bold italic align-middle"
                            style={{ backgroundColor: '#ffffff', verticalAlign: 'middle' }}
                          >
                            এ বছরের কোনো ব্যয়ের রেকর্ড নেই (০ টাকা)
                          </td>
                        </tr>
                      ) : (
                        displayExpenses.map((item, idx) => (
                          <tr 
                            key={item.id || idx} 
                            style={{ 
                              backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                              borderBottom: '1px solid #cbd5e1'
                            }}
                          >
                            <td 
                              className="py-2 px-2 text-center font-bold align-middle"
                              style={{ 
                                borderRight: '1px solid #cbd5e1', 
                                color: item.isEmpty ? '#94a3b8' : '#334155',
                                verticalAlign: 'middle',
                                lineHeight: '1.45'
                              }}
                            >
                              {toBanglaNum(idx + 1)}
                            </td>
                            <td 
                              className="py-2 px-3 font-bold text-left align-middle"
                              style={{ 
                                borderRight: '1px solid #cbd5e1', 
                                color: item.isEmpty ? '#94a3b8' : '#0f172a',
                                verticalAlign: 'middle',
                                lineHeight: '1.45'
                              }}
                            >
                              {item.isEmpty ? <span className="text-slate-300 font-normal">-</span> : item.name}
                            </td>
                            <td 
                              className="py-2 px-3 text-right font-black whitespace-nowrap align-middle"
                              style={{ 
                                color: item.isEmpty ? '#94a3b8' : '#0f172a',
                                verticalAlign: 'middle',
                                lineHeight: '1.45'
                              }}
                            >
                              {item.isEmpty ? <span className="text-slate-300 font-normal">-</span> : toBanglaNum(item.amount.toLocaleString('bn-BD'))}
                            </td>
                          </tr>
                        ))
                      )}

                      {/* মোট ব্যয় Footer */}
                      <tr 
                        className="text-white font-black text-xs sm:text-sm"
                        style={{ backgroundColor: '#991b1b' }}
                      >
                        <td 
                          colSpan={2} 
                          className="py-2.5 px-3 text-center align-middle"
                          style={{ borderRight: '1px solid #7f1d1d', verticalAlign: 'middle', lineHeight: '1.4' }}
                        >
                          মোট ব্যয়
                        </td>
                        <td 
                          className="py-2.5 px-3 text-right whitespace-nowrap font-black align-middle"
                          style={{ verticalAlign: 'middle', lineHeight: '1.4' }}
                        >
                          {toBanglaNum(totalExpenseAmount.toLocaleString('bn-BD'))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* সারসংক্ষেপ Table */}
                <div 
                  className="rounded-none overflow-hidden"
                  style={{ border: '2px solid #064e3b', backgroundColor: '#ffffff' }}
                >
                  <div 
                    className="text-white px-3 py-1.5 text-center font-black text-xs tracking-wide"
                    style={{ backgroundColor: '#064e3b' }}
                  >
                    সারসংক্ষেপ
                  </div>
                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr 
                        className="font-black text-slate-800"
                        style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #94a3b8' }}
                      >
                        <th 
                          className="py-2 px-3 text-left font-black align-middle"
                          style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle' }}
                        >
                          বিষয়
                        </th>
                        <th 
                          className="py-2 px-3 text-right w-24 sm:w-28 font-black align-middle"
                          style={{ color: '#0f172a', verticalAlign: 'middle' }}
                        >
                          টাকা
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
                        <td 
                          className="py-2 px-3 font-bold text-slate-800 align-middle"
                          style={{ borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', lineHeight: '1.45' }}
                        >
                          মোট আয়
                        </td>
                        <td 
                          className="py-2 px-3 text-right font-black text-emerald-800 align-middle"
                          style={{ verticalAlign: 'middle', lineHeight: '1.45' }}
                        >
                          {toBanglaNum(totalIncomeAmount.toLocaleString('bn-BD'))}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                        <td 
                          className="py-2 px-3 font-bold text-slate-800 align-middle"
                          style={{ borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', lineHeight: '1.45' }}
                        >
                          মোট ব্যয়
                        </td>
                        <td 
                          className="py-2 px-3 text-right font-black text-red-700 align-middle"
                          style={{ verticalAlign: 'middle', lineHeight: '1.45' }}
                        >
                          {toBanglaNum(totalExpenseAmount.toLocaleString('bn-BD'))}
                        </td>
                      </tr>
                      <tr style={{ backgroundColor: isDeficit ? '#fef2f2' : '#f0fdf4' }}>
                        <td 
                          className="py-2.5 px-3 font-black align-middle"
                          style={{ 
                            borderRight: '1px solid #cbd5e1',
                            color: isDeficit ? '#991b1b' : '#064e3b',
                            verticalAlign: 'middle',
                            lineHeight: '1.45'
                          }}
                        >
                          {isDeficit ? 'ঘাটতি' : 'উদ্বৃত্ত'}
                        </td>
                        <td 
                          className="py-2.5 px-3 text-right font-black whitespace-nowrap align-middle"
                          style={{ 
                            color: isDeficit ? '#991b1b' : '#064e3b',
                            verticalAlign: 'middle',
                            lineHeight: '1.45'
                          }}
                        >
                          {toBanglaNum(deficitOrSurplusAmount.toLocaleString('bn-BD'))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* গুরুত্বপূর্ণ তথ্য Box */}
                <div 
                  className="p-2.5 rounded-none space-y-1 text-[11px] leading-relaxed"
                  style={{ 
                    border: '2px solid #dc2626', 
                    backgroundColor: '#fffbeb' 
                  }}
                >
                  <div 
                    className="flex items-center space-x-1.5 font-black text-xs pb-1"
                    style={{ color: '#b91c1c', borderBottom: '1px solid #fecaca' }}
                  >
                    <span>📌</span>
                    <span>গুরুত্বপূর্ণ তথ্য:</span>
                  </div>
                  <ul className="list-disc list-inside space-y-1 text-slate-900 font-bold pt-1">
                    <li>
                      ব্যয়ের তালিকায় মোট খরচ আইটেম{' '}
                      <span className="font-black" style={{ color: '#b91c1c' }}>
                        {toBanglaNum(displayExpenses.length)}টি
                      </span>
                      , যার মোট যোগফল{' '}
                      <span className="font-black" style={{ color: '#b91c1c' }}>
                        {toBanglaNum(totalExpenseAmount.toLocaleString('bn-BD'))} টাকা
                      </span>।
                    </li>
                    <li>
                      {incomeDisplayMode === 'receipt' ? (
                        <>
                          <span className="font-black" style={{ color: '#064e3b' }}>
                            {receiptDonationLabel}:
                          </span>{' '}
                          <span className="font-black" style={{ color: '#064e3b' }}>
                            {toBanglaNum(totalPrimaryIncome.toLocaleString('bn-BD'))} টাকা
                          </span>{' '}
                          ({toBanglaNum(primaryIncomes.length)}টি বই/উৎস হতে আদায়)।
                        </>
                      ) : (
                        <>
                          আয়ের তালিকায় অন্তর্ভুক্ত মোট দাতা / উৎস সংখ্যা{' '}
                          <span className="font-black" style={{ color: '#064e3b' }}>
                            {toBanglaNum(totalDonorCount)} টি
                          </span>।
                        </>
                      )}
                    </li>
                    <li>
                      সর্বমোট আয়{' '}
                      <span className="font-black" style={{ color: '#064e3b' }}>
                        {toBanglaNum(totalIncomeAmount.toLocaleString('bn-BD'))} টাকা
                      </span>{' '}
                      এবং সর্বমোট ব্যয়{' '}
                      <span className="font-black" style={{ color: '#b91c1c' }}>
                        {toBanglaNum(totalExpenseAmount.toLocaleString('bn-BD'))} টাকা
                      </span>।
                    </li>
                    <li>
                      অতএব, চলতি বছরের সার্বিক হিসাব অনুযায়ী{' '}
                      <span 
                        className="font-black" 
                        style={{ color: isDeficit ? '#b91c1c' : '#064e3b' }}
                      >
                        {isDeficit ? 'ঘাটতি' : 'উদ্বৃত্ত'} {toBanglaNum(deficitOrSurplusAmount.toLocaleString('bn-BD'))} টাকা
                      </span>।
                    </li>
                  </ul>
                </div>
              </div>

              {/* ========================================================
                  RIGHT COLUMN: আয়ের হিসাব, অন্যান্য আয় ও জমার হিসাব
                 ======================================================== */}
              <div className="space-y-3">
                {/* আয়ের হিসাব Table */}
                <div 
                  className="rounded-none overflow-hidden"
                  style={{ border: '2px solid #064e3b', backgroundColor: '#ffffff' }}
                >
                  {/* Dark Green Banner Header */}
                  <div 
                    className="text-white px-3 py-1.5 flex items-center justify-center space-x-2 font-black text-sm tracking-wide"
                    style={{ backgroundColor: '#064e3b' }}
                  >
                    <span>💰</span>
                    <span>আয়ের হিসাব</span>
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr 
                        className="font-black text-slate-800"
                        style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #94a3b8' }}
                      >
                        <th 
                          className="py-2.5 px-2 text-center w-8 font-black align-middle"
                          style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          ক্রম
                        </th>
                        <th 
                          className="py-2.5 px-3 text-left font-black align-middle"
                          style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          {incomeDisplayMode === 'slabs' ? 'টাকা প্রদান' : 'আয়ের বিবরণ / খাত'}
                        </th>
                        {incomeDisplayMode === 'slabs' && (
                          <th 
                            className="py-2.5 px-2 text-center font-black align-middle"
                            style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                          >
                            জনসংখ্যা
                          </th>
                        )}
                        <th 
                          className="py-2.5 px-3 text-right font-black align-middle"
                          style={{ color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          মোট টাকা
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {incomeDisplayMode !== 'slabs' ? (
                        <>
                          {displayIncomes.length === 0 ? (
                            <tr>
                              <td 
                                colSpan={3} 
                                className="py-3 px-2 text-center text-slate-500 font-bold italic align-middle"
                                style={{ backgroundColor: '#ffffff', verticalAlign: 'middle', paddingTop: '8px', paddingBottom: '8px', lineHeight: '1.4' }}
                              >
                                এ বছরের কোনো আয়ের রেকর্ড নেই (০ টাকা)
                              </td>
                            </tr>
                          ) : (
                            displayIncomes.map((item, idx) => (
                              <tr 
                                key={item.id || idx} 
                                style={{ 
                                  backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                                  borderBottom: '1px solid #cbd5e1'
                                }}
                              >
                                <td 
                                  className="py-2.5 px-2 text-center font-bold align-middle"
                                  style={{ borderRight: '1px solid #cbd5e1', color: '#334155', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                                >
                                  {toBanglaNum(idx + 1)}
                                </td>
                                <td 
                                  className="py-2.5 px-3 font-bold text-left align-middle"
                                  style={{ borderRight: '1px solid #cbd5e1', color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                                >
                                  <div className="font-bold text-slate-900 leading-snug">
                                    {item.name}
                                  </div>
                                  {item.subLabel && (
                                    <div className="text-[10px] text-slate-500 font-semibold pt-0.5">
                                      {item.subLabel}
                                    </div>
                                  )}
                                </td>
                                <td 
                                  className="py-2.5 px-3 text-right font-black whitespace-nowrap align-middle"
                                  style={{ color: '#064e3b', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                                >
                                  {toBanglaNum(item.amount.toLocaleString('bn-BD'))}
                                </td>
                              </tr>
                            ))
                          )}

                          {/* মোট আয় Footer */}
                          <tr 
                            className="text-white font-black text-xs sm:text-sm"
                            style={{ backgroundColor: '#064e3b' }}
                          >
                            <td 
                              colSpan={2} 
                              className="py-2.5 px-3 text-center align-middle"
                              style={{ borderRight: '1px solid #043226', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                            >
                              সর্বমোট আয়
                            </td>
                            <td 
                              className="py-2.5 px-3 text-right whitespace-nowrap font-black align-middle"
                              style={{ verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                            >
                              {toBanglaNum(totalIncomeAmount.toLocaleString('bn-BD'))}
                            </td>
                          </tr>
                        </>
                      ) : (
                        <>
                          {incomeSlabs.length === 0 ? (
                            <tr>
                              <td 
                                colSpan={4} 
                                className="py-3 px-2 text-center text-slate-500 font-bold italic align-middle"
                                style={{ backgroundColor: '#ffffff', verticalAlign: 'middle', paddingTop: '8px', paddingBottom: '8px', lineHeight: '1.4' }}
                              >
                                এ বছরের কোনো চাঁদা আয়ের রেকর্ড নেই (০ টাকা)
                              </td>
                            </tr>
                          ) : (
                            incomeSlabs.map((slab, idx) => (
                              <tr 
                                key={idx} 
                                style={{ 
                                  backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                                  borderBottom: '1px solid #cbd5e1'
                                }}
                              >
                                <td 
                                  className="py-2.5 px-2 text-center font-bold align-middle"
                                  style={{ borderRight: '1px solid #cbd5e1', color: '#334155', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                                >
                                  {toBanglaNum(idx + 1)}
                                </td>
                                <td 
                                  className="py-2.5 px-3 text-left font-bold align-middle"
                                  style={{ borderRight: '1px solid #cbd5e1', color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                                >
                                  {slab.label || `${toBanglaNum(slab.amount.toLocaleString('bn-BD'))} টাকা`}
                                </td>
                                <td 
                                  className="py-2.5 px-2 text-center font-bold align-middle"
                                  style={{ borderRight: '1px solid #cbd5e1', color: '#334155', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                                >
                                  {incomeDisplayMode === 'slabs'
                                    ? `${toBanglaNum(slab.count)} জন`
                                    : `${toBanglaNum(slab.count)} টি বই/রসিদ`}
                                </td>
                                <td 
                                  className="py-2.5 px-3 text-right font-black whitespace-nowrap align-middle"
                                  style={{ color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                                >
                                  {toBanglaNum(slab.total.toLocaleString('bn-BD'))}
                                </td>
                              </tr>
                            ))
                          )}

                          {/* মোট জনসংখ্যা ও মোট চাঁদা Footer */}
                          <tr 
                            className="text-white font-black text-xs sm:text-sm"
                            style={{ backgroundColor: '#064e3b' }}
                          >
                            <td 
                              colSpan={2} 
                              className="py-2.5 px-3 text-center align-middle"
                              style={{ borderRight: '1px solid #043226', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                            >
                              {incomeDisplayMode === 'slabs' ? 'মোট জনসংখ্যা' : 'মোট সদস্য চাঁদা আয়'}
                            </td>
                            <td 
                              className="py-2.5 px-2 text-center whitespace-nowrap align-middle"
                              style={{ borderRight: '1px solid #043226', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                            >
                              {toBanglaNum(totalDonorCount)} {incomeDisplayMode === 'slabs' ? 'জন' : 'টি'}
                            </td>
                            <td 
                              className="py-2.5 px-3 text-right whitespace-nowrap font-black align-middle"
                              style={{ verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                            >
                              {toBanglaNum(totalPrimaryIncome.toLocaleString('bn-BD'))}
                            </td>
                          </tr>
                        </>
                      )}
                    </tbody>
                  </table>
                </div>

                {/* অন্যান্য আয় Table (Only shown when in slabs mode and extra incomes exist) */}
                {incomeDisplayMode === 'slabs' && effectiveOtherIncomes.length > 0 && (
                  <div 
                    className="rounded-none overflow-hidden"
                    style={{ border: '2px solid #0f766e', backgroundColor: '#ffffff' }}
                  >
                    <div 
                      className="text-white px-3 py-1 flex items-center justify-center space-x-1.5 font-black text-xs tracking-wide"
                      style={{ backgroundColor: '#0f766e' }}
                    >
                      <span>🪙</span>
                      <span>অন্যান্য আয়</span>
                    </div>

                    <table className="w-full border-collapse text-xs">
                      <thead>
                        <tr 
                          className="font-black text-slate-800"
                          style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #94a3b8' }}
                        >
                          <th 
                            className="py-2.5 px-3 text-left font-black align-middle"
                            style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                          >
                            বিষয়
                          </th>
                          <th 
                            className="py-2.5 px-3 text-right w-24 font-black align-middle"
                            style={{ color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                          >
                            টাকা
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {effectiveOtherIncomes.length === 0 ? (
                          <tr>
                            <td 
                              colSpan={2} 
                              className="py-2.5 px-3 text-center text-slate-500 font-bold italic align-middle"
                              style={{ backgroundColor: '#ffffff', verticalAlign: 'middle', paddingTop: '8px', paddingBottom: '8px', lineHeight: '1.4' }}
                            >
                              অন্যান্য আয়ের কোনো এন্ট্রি নেই (০ টাকা)
                            </td>
                          </tr>
                        ) : (
                          effectiveOtherIncomes.map((item, idx) => (
                            <tr 
                              key={item.id || idx}
                              style={{ 
                                backgroundColor: idx % 2 === 1 ? '#f8fafc' : '#ffffff',
                                borderBottom: '1px solid #cbd5e1'
                              }}
                            >
                              <td 
                                className="py-2.5 px-3 font-bold text-slate-800 text-left align-middle"
                                style={{ borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                              >
                                {item.title}
                              </td>
                              <td 
                                className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap align-middle"
                                style={{ verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                              >
                                {toBanglaNum(item.amount.toLocaleString('bn-BD'))}
                              </td>
                            </tr>
                          ))
                        )}
                        <tr 
                          className="text-white font-black text-xs"
                          style={{ backgroundColor: '#064e3b' }}
                        >
                          <td 
                            className="py-2.5 px-3 text-center align-middle"
                            style={{ borderRight: '1px solid #043226', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                          >
                            সর্বমোট আয় (চাঁদা + অন্যান্য)
                          </td>
                          <td 
                            className="py-2.5 px-3 text-right whitespace-nowrap font-black align-middle"
                            style={{ verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                          >
                            {toBanglaNum(totalIncomeAmount.toLocaleString('bn-BD'))}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* জমার হিসাব Table */}
                <div 
                  className="rounded-none overflow-hidden"
                  style={{ border: '2px solid #334155', backgroundColor: '#ffffff' }}
                >
                  <div 
                    className="text-white px-3 py-1 flex items-center justify-center space-x-1.5 font-black text-xs tracking-wide"
                    style={{ backgroundColor: '#334155' }}
                  >
                    <span>🏛️</span>
                    <span>জমার হিসাব</span>
                  </div>

                  <table className="w-full border-collapse text-xs">
                    <thead>
                      <tr 
                        className="font-black text-slate-800"
                        style={{ backgroundColor: '#f1f5f9', borderBottom: '1px solid #94a3b8' }}
                      >
                        <th 
                          className="py-2.5 px-3 text-left font-black align-middle"
                          style={{ borderRight: '1px solid #94a3b8', color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          বিষয়
                        </th>
                        <th 
                          className="py-2.5 px-3 text-right w-24 font-black align-middle"
                          style={{ color: '#0f172a', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          টাকা
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#ffffff' }}>
                        <td 
                          className="py-2.5 px-3 font-bold text-slate-800 text-left align-middle"
                          style={{ borderRight: '1px solid #cbd5e1', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          {previousYearLabel}
                        </td>
                        <td 
                          className="py-2.5 px-3 text-right font-black text-slate-900 align-middle"
                          style={{ verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          {toBanglaNum(previousYearBalance.toLocaleString('bn-BD'))}
                        </td>
                      </tr>
                      <tr style={{ borderBottom: '1px solid #cbd5e1', backgroundColor: '#f8fafc' }}>
                        <td 
                          className="py-2.5 px-3 font-bold text-left align-middle"
                          style={{ 
                            borderRight: '1px solid #cbd5e1',
                            color: isDeficit ? '#991b1b' : '#064e3b',
                            verticalAlign: 'middle',
                            paddingTop: '7px',
                            paddingBottom: '7px',
                            lineHeight: '1.4'
                          }}
                        >
                          {toBanglaNum(currentYear === 'all' ? 'সকল' : currentYear)} সালে {isDeficit ? 'ঘাটতি' : 'উদ্বৃত্ত'}
                        </td>
                        <td 
                          className="py-2.5 px-3 text-right font-black align-middle"
                          style={{ 
                            color: isDeficit ? '#991b1b' : '#064e3b',
                            verticalAlign: 'middle',
                            paddingTop: '7px',
                            paddingBottom: '7px',
                            lineHeight: '1.4'
                          }}
                        >
                          {toBanglaNum(deficitOrSurplusAmount.toLocaleString('bn-BD'))}
                        </td>
                      </tr>
                      <tr 
                        className="text-white font-black text-xs sm:text-sm"
                        style={{ backgroundColor: '#78350f' }}
                      >
                        <td 
                          className="py-2.5 px-3 text-center align-middle"
                          style={{ borderRight: '1px solid #451a03', verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          বর্তমানে তহবিলে জমা (হাতে নগদ)
                        </td>
                        <td 
                          className="py-2.5 px-3 text-right whitespace-nowrap font-black align-middle"
                          style={{ verticalAlign: 'middle', paddingTop: '7px', paddingBottom: '7px', lineHeight: '1.4' }}
                        >
                          {toBanglaNum(closingBalance.toLocaleString('bn-BD'))}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* ডেনোটেশন (বিশেষ দ্রষ্টব্য) Box */}
                {showDenotation && (
                  <div 
                    className="rounded-none p-2.5 text-xs leading-relaxed space-y-1"
                    style={{ 
                      border: '2px solid #064e3b',
                      backgroundColor: '#f0fdf4'
                    }}
                  >
                    <div 
                      className="flex items-center justify-between font-black text-xs pb-1"
                      style={{ color: '#064e3b', borderBottom: '1.5px solid #86efac' }}
                    >
                      <div className="flex items-center space-x-1.5">
                        <span>📌</span>
                        <span>হিসাবের ডেনোট (বিশেষ দ্রষ্টব্য):</span>
                      </div>
                      <span className="text-[10px] bg-emerald-100 text-emerald-900 px-2 py-0.5 rounded font-black">
                        সারসংক্ষেপ নোট
                      </span>
                    </div>

                    <div className="text-slate-800 text-[11px] font-bold space-y-1.5 pt-1">
                      <div className="flex items-start space-x-1.5">
                        <span className="text-[#064e3b] font-black text-xs leading-none mt-0.5">•</span>
                        <p>
                          <span className="font-black text-[#064e3b]">{receiptDonationLabel}:</span> রসিদ বহিসমূহের মাধ্যমে আদায়কৃত সর্বমোট সাধারণ ও সদস্য চাঁদা একীভূতভাবে <span className="font-black text-[#064e3b]">{toBanglaNum(totalPrimaryIncome.toLocaleString('bn-BD'))} টাকা</span> হিসাবভুক্ত করা হয়েছে।
                        </p>
                      </div>
                      <div className="flex items-start space-x-1.5">
                        <span className="text-[#78350f] font-black text-xs leading-none mt-0.5">•</span>
                        <p>
                          <span className="font-black text-[#78350f]">{previousYearLabel}:</span> বিগত সালের উদ্বৃত্ত হতে হাতে নগদ <span className="font-black text-[#78350f]">{toBanglaNum(previousYearBalance.toLocaleString('bn-BD'))} টাকা</span> নতুন অর্থবছর/মাহফিলের তহবিলে যুক্ত ও সমন্বয় করা হয়েছে।
                        </p>
                      </div>
                      {customDenoteNote && (
                        <div className="flex items-start space-x-1.5">
                          <span className="text-slate-700 font-black text-xs leading-none mt-0.5">•</span>
                          <p className="text-slate-700">
                            {customDenoteNote}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* হিসাব প্রস্তুতকারীগণের নাম ও স্বাক্ষর প্রদানের স্থান (চিহ্ন তুলে দিয়ে ৪ জন হিসাব প্রস্তুতকারী) */}
                {showPreparers && (
                  <div 
                    className="p-2.5 sm:p-3 rounded-none text-center mt-2.5"
                    style={{ 
                      border: '1.5px solid #064e3b',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <div 
                      className="font-black text-xs pb-1.5 mb-2.5 flex items-center justify-center space-x-1.5"
                      style={{ color: '#064e3b', borderBottom: '1px dashed #cbd5e1' }}
                    >
                      <span>✍️</span>
                      <span>হিসাব প্রস্তুতকারীগণের স্বাক্ষর:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-x-4 sm:gap-x-6 gap-y-4 pt-1 pb-1">
                      {preparerNames.map((name, idx) => (
                        <div key={idx} className="flex flex-col items-center justify-end">
                          {/* Clean Signature Space Above Name (চিহ্ন তুলে দিয়ে প্রতিটি ব্যক্তির স্বাক্ষরের জন্য খালি জায়গা) */}
                          <div className="h-11 sm:h-14 w-full flex items-end justify-center pb-1" />
                          {/* Signature Line */}
                          <div 
                            className="w-full max-w-[170px]"
                            style={{ borderTop: '1.5px dashed #475569' }}
                          />
                          {/* Name & Title */}
                          <div className="pt-1.5 text-center">
                            <p className="font-black text-xs sm:text-[13px] text-slate-900 leading-snug">
                              {toBanglaNum(idx + 1)}। {name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-600 leading-none pt-0.5">
                              হিসাব প্রস্তুতকারী
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Bottom Footer Calligraphic Dua Banner */}
            <div 
              className="mt-4 pt-2.5 text-white py-2 px-3 text-center rounded-none shadow-xs"
              style={{
                borderTop: '2px solid #064e3b',
                backgroundColor: '#064e3b'
              }}
            >
              <p 
                className="text-xs sm:text-sm font-black tracking-wide"
                style={{ color: '#fef08a' }}
              >
                ۞ আল্লাহ আমাদের সবাইকে নেক আমল করার তাওফিক দান করুন। আমিন। ۞
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
