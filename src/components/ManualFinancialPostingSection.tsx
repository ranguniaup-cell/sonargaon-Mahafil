import React from 'react';
import { Transaction } from '../types';
import {
  Plus,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Save,
  CheckCircle2,
  Sparkles,
  Layers,
  FileText,
  AlertCircle,
  BookOpen,
  ArrowRight,
  Search,
  Receipt,
  FileSpreadsheet,
  Coins,
  ShieldCheck,
  RefreshCw,
  Wallet,
  Pencil,
  CheckSquare,
  Square,
  Lock,
  KeyRound,
  ArrowLeft
} from 'lucide-react';
import { cleanNumericInput, toEnglishDigits } from '../lib/numberUtils';
import {
  isHouseCollection,
  getTransactionYear,
  sortTransactionsFIFO,
  GENERAL_INCOME_CATEGORIES,
  GENERAL_EXPENSE_CATEGORIES,
  isAutoUploadedTransaction
} from '../lib/transactionUtils';
import EditTransactionModal from './EditTransactionModal';


// Helper for Bangla digits
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
};

// Helper for Bangla date
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

export interface ManualFinancialPostingSectionProps {
  transactions: Transaction[];
  onAddTransaction: (newT: Omit<Transaction, 'id'>) => Promise<void> | void;
  onBatchAddTransactions?: (items: Omit<Transaction, 'id'>[]) => Promise<void> | void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  onUpdateTransaction?: (id: string, updated: Partial<Transaction>) => Promise<void> | void;
  isAdminLoggedIn?: boolean;
  setIsAdminLoggedIn?: (val: boolean) => void;
  onNavigate?: (tab: string) => void;
  initialYear?: string;
  isEmbedded?: boolean;
}

export default function ManualFinancialPostingSection({
  transactions = [],
  onAddTransaction,
  onBatchAddTransactions,
  onDeleteTransaction,
  onUpdateTransaction,
  isAdminLoggedIn = false,
  setIsAdminLoggedIn,
  onNavigate,
  initialYear = '2026',
  isEmbedded = false
}: ManualFinancialPostingSectionProps) {
  const [selectedYear, setSelectedYear] = React.useState<string>(initialYear || '2026');
  const [customYearInput, setCustomYearInput] = React.useState<string>('');
  const [showCustomYearInput, setShowCustomYearInput] = React.useState<boolean>(false);
  const [activeTab, setActiveTab] = React.useState<'single' | 'bulk'>('single');

  // Admin authorization state when opened by public or logged out
  const [adminPasswordInput, setAdminPasswordInput] = React.useState<string>('');
  const [adminAuthError, setAdminAuthError] = React.useState<string>('');

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
      setAdminAuthError('পাসওয়ার্ড সঠিক নয়! শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিন পোস্টিং করতে পারবেন।');
    }
  };

  // Filter text for transaction list
  const [searchTerm, setSearchTerm] = React.useState<string>('');
  const [filterType, setFilterType] = React.useState<'all' | 'income' | 'expense' | 'auto' | 'manual'>('all');

  // Editing & Selection State
  const [editingTx, setEditingTx] = React.useState<Transaction | null>(null);
  const [selectedTxIds, setSelectedTxIds] = React.useState<Set<string>>(new Set());
  const [isBatchDeleting, setIsBatchDeleting] = React.useState<boolean>(false);

  // Single form states
  const [type, setType] = React.useState<'income' | 'expense'>('income');
  const [amount, setAmount] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>(GENERAL_INCOME_CATEGORIES[0]);
  const [customCategory, setCustomCategory] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string>('');

  // Bulk form states
  const [bulkIncomes, setBulkIncomes] = React.useState<Record<string, string>>({});
  const [bulkExpenses, setBulkExpenses] = React.useState<Record<string, string>>({});
  const [bulkDate, setBulkDate] = React.useState<string>(() => `${initialYear || '2026'}-09-15`);
  const [isBulkSubmitting, setIsBulkSubmitting] = React.useState<boolean>(false);

  // Deleting item tracking
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);

  // Sync year change to bulk date
  React.useEffect(() => {
    setBulkDate(`${selectedYear}-09-15`);
    setSelectedTxIds(new Set());
  }, [selectedYear]);

  // Update default category when type changes
  React.useEffect(() => {
    if (type === 'income') {
      setCategory(GENERAL_INCOME_CATEGORIES[0]);
    } else {
      setCategory(GENERAL_EXPENSE_CATEGORIES[0]);
    }
    setCustomCategory('');
  }, [type]);

  // Filter general transactions for the selected year (STRICTLY excluding house collections)
  // Sorted FIFO (First In First Out) so earliest posting appears first
  const currentYearNum = parseInt(selectedYear, 10);
  const yearGeneralTransactions = React.useMemo(() => {
    const list = transactions.filter((t) => {
      const isYrMatch = getTransactionYear(t) === currentYearNum;
      return isYrMatch && !isHouseCollection(t);
    });
    return sortTransactionsFIFO(list);
  }, [transactions, currentYearNum]);

  // Auto-uploaded vs manual transactions for this year
  const yearAutoTransactions = React.useMemo(() => {
    return yearGeneralTransactions.filter(isAutoUploadedTransaction);
  }, [yearGeneralTransactions]);

  const yearManualTransactions = React.useMemo(() => {
    return yearGeneralTransactions.filter((t) => !isAutoUploadedTransaction(t));
  }, [yearGeneralTransactions]);

  // Calculate prior year balance (excluding house collections)
  const previousYearClosingBalance = React.useMemo(() => {
    const priorTransactions = transactions.filter((t) => {
      const tYear = getTransactionYear(t);
      return tYear < currentYearNum && !isHouseCollection(t);
    });
    const priorIncome = priorTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    const priorExpense = priorTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
    return priorIncome - priorExpense;
  }, [transactions, currentYearNum]);

  // Summary figures for this year's general ledger
  const yearTotalIncome = React.useMemo(() => {
    return yearGeneralTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [yearGeneralTransactions]);

  const yearTotalExpense = React.useMemo(() => {
    return yearGeneralTransactions
      .filter((t) => t.type === 'expense')
      .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [yearGeneralTransactions]);

  const yearSurplus = yearTotalIncome - yearTotalExpense;
  const netTotalBalance = previousYearClosingBalance + yearSurplus;

  // Filtered list based on search term & type (maintains FIFO order)
  const displayedTransactions = React.useMemo(() => {
    const filtered = yearGeneralTransactions.filter((t) => {
      if (filterType === 'income' && t.type !== 'income') return false;
      if (filterType === 'expense' && t.type !== 'expense') return false;
      if (filterType === 'auto' && !isAutoUploadedTransaction(t)) return false;
      if (filterType === 'manual' && isAutoUploadedTransaction(t)) return false;
      if (!searchTerm.trim()) return true;
      const term = searchTerm.toLowerCase().trim();
      const catMatch = (t.category || '').toLowerCase().includes(term);
      const descMatch = (t.description || '').toLowerCase().includes(term);
      const donorMatch = (t.donorName || '').toLowerCase().includes(term);
      const receiptMatch = (t.receiptNo || '').toLowerCase().includes(term);
      const amtMatch = t.amount.toString().includes(toEnglishDigits(term));
      return catMatch || descMatch || donorMatch || receiptMatch || amtMatch;
    });
    return sortTransactionsFIFO(filtered);
  }, [yearGeneralTransactions, filterType, searchTerm]);

  // Single transaction submit handler
  const handleSingleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn) {
      alert('অননুমোদিত চেষ্টা! পোস্টিং শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিনের জন্য সুরক্ষিত।');
      return;
    }
    const parsedAmount = parseInt(toEnglishDigits(cleanNumericInput(amount)), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    const finalCategory = category === 'custom' || category === 'অন্যান্য'
      ? (customCategory.trim() || 'অন্যান্য')
      : category;

    setIsSubmitting(true);
    try {
      const newTransaction: Omit<Transaction, 'id'> = {
        date: date || new Date().toISOString().split('T')[0],
        type,
        category: finalCategory,
        amount: parsedAmount,
        description: description.trim() || undefined,
        donorName: type === 'income' ? (description.trim() || finalCategory) : undefined,
        receiptNo: receiptNo.trim() || undefined,
        recordedBy: 'অ্যাডমিন',
        year: currentYearNum
        // Notice: houseName is NOT set, guaranteeing this is a general ledger entry!
      };

      await onAddTransaction(newTransaction);

      // Reset form
      setAmount('');
      setDescription('');
      setReceiptNo('');
      setCustomCategory('');
      setSuccessMessage(`৳ ${toBanglaNum(parsedAmount.toLocaleString('bn-BD'))}/- টাকার ${type === 'income' ? 'আয়' : 'ব্যয়'} সফলভাবে পোস্টিং হয়েছে!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error posting manual transaction:', err);
      alert('পোস্টিং করতে একটি সমস্যা হয়েছে।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Bulk transaction submit handler
  const handleBulkSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAdminLoggedIn) {
      alert('অননুমোদিত চেষ্টা! পোস্টিং শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিনের জন্য সুরক্ষিত।');
      return;
    }
    const entriesToSave: Omit<Transaction, 'id'>[] = [];

    // Collect incomes
    Object.entries(bulkIncomes).forEach(([cat, val]) => {
      const amt = parseInt(toEnglishDigits(cleanNumericInput(String(val || ''))), 10);
      if (!isNaN(amt) && amt > 0) {
        entriesToSave.push({
          date: bulkDate || `${selectedYear}-09-15`,
          type: 'income',
          category: cat,
          amount: amt,
          description: `${selectedYear} সালের ${cat}`,
          donorName: `${cat} হতে প্রাপ্তি`,
          recordedBy: 'অ্যাডমিন',
          year: currentYearNum
        });
      }
    });

    // Collect expenses
    Object.entries(bulkExpenses).forEach(([cat, val]) => {
      const amt = parseInt(toEnglishDigits(cleanNumericInput(String(val || ''))), 10);
      if (!isNaN(amt) && amt > 0) {
        entriesToSave.push({
          date: bulkDate || `${selectedYear}-09-15`,
          type: 'expense',
          category: cat,
          amount: amt,
          description: `${selectedYear} সালের ${cat} খরচ`,
          recordedBy: 'অ্যাডমিন',
          year: currentYearNum
        });
      }
    });

    if (entriesToSave.length === 0) {
      alert('অনুগ্রহ করে অন্তত একটি খাতের টাকার পরিমাণ লিখুন।');
      return;
    }

    setIsBulkSubmitting(true);
    try {
      if (onBatchAddTransactions) {
        await onBatchAddTransactions(entriesToSave);
      } else {
        for (const item of entriesToSave) {
          await onAddTransaction(item);
        }
      }
      setBulkIncomes({});
      setBulkExpenses({});
      setSuccessMessage(`${toBanglaNum(entriesToSave.length)}টি খাতের টাকা সফলভাবে পোস্টিং হয়েছে!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error in bulk posting:', err);
      alert('বাল্ক পোস্টিং করতে সমস্যা হয়েছে।');
    } finally {
      setIsBulkSubmitting(false);
    }
  };

  // Delete transaction handler
  const handleDelete = async (id: string) => {
    if (!isAdminLoggedIn) {
      alert('অননুমোদিত চেষ্টা! লেনদেন মুছে ফেলা শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিনের জন্য সুরক্ষিত।');
      return;
    }
    if (!onDeleteTransaction) return;
    if (!window.confirm('আপনি কি নিশ্চিত যে এই লেনদেনটি মুছে ফেলতে চান?')) return;

    setIsDeletingId(id);
    try {
      await onDeleteTransaction(id);
      setSelectedTxIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      setSuccessMessage('লেনদেনটি সফলভাবে মুছে ফেলা হয়েছে।');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      console.error('Error deleting transaction:', err);
      alert('মুছে ফেলতে সমস্যা হয়েছে।');
    } finally {
      setIsDeletingId(null);
    }
  };

  // Save edit handler
  const handleSaveEdit = async (updated: Transaction) => {
    if (!isAdminLoggedIn) {
      alert('অননুমোদিত চেষ্টা! লেনদেন সংশোধন শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিনের জন্য সুরক্ষিত।');
      return;
    }
    if (onUpdateTransaction) {
      await onUpdateTransaction(updated.id, updated);
      setSuccessMessage('লেনদেনের তথ্য সফলভাবে আপডেট হয়েছে!');
      setTimeout(() => setSuccessMessage(''), 3500);
    }
  };

  // Toggle selection
  const handleToggleSelect = (id: string) => {
    setSelectedTxIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedTxIds.size === displayedTransactions.length && displayedTransactions.length > 0) {
      setSelectedTxIds(new Set());
    } else {
      setSelectedTxIds(new Set(displayedTransactions.map((t) => t.id)));
    }
  };

  // Batch delete selected transactions
  const handleBatchDeleteSelected = async () => {
    if (!isAdminLoggedIn) {
      alert('অননুমোদিত চেষ্টা! লেনদেন মুছে ফেলা শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিনের জন্য সুরক্ষিত।');
      return;
    }
    if (selectedTxIds.size === 0) return;
    const ids: string[] = Array.from(selectedTxIds);
    if (!window.confirm(`⚠️ সতর্কতা!\n\nআপনি কি নিশ্চিত যে নির্বাচিত ${toBanglaNum(ids.length)}টি লেনদেন মুছে ফেলতে চান?`)) {
      return;
    }

    setIsBatchDeleting(true);
    try {
      if (onDeleteTransaction) {
        for (const id of ids) {
          await onDeleteTransaction(id);
        }
      }
      setSelectedTxIds(new Set());
      setSuccessMessage(`${toBanglaNum(ids.length)}টি লেনদেন সফলভাবে মুছে ফেলা হয়েছে!`);
      setTimeout(() => setSuccessMessage(''), 3500);
    } catch (err) {
      console.error('Error in batch delete:', err);
      alert('মুছে ফেলতে সমস্যা হয়েছে।');
    } finally {
      setIsBatchDeleting(false);
    }
  };

  // Clear all auto-uploaded entries for selected year
  const handleClearAllAutoForYear = async () => {
    if (!isAdminLoggedIn) {
      alert('অননুমোদিত চেষ্টা! লেনদেন মুছে ফেলা শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিনের জন্য সুরক্ষিত।');
      return;
    }
    const autoIds = yearAutoTransactions.map((t) => t.id);
    if (autoIds.length === 0) return;
    if (
      !window.confirm(
        `⚠️ সতর্কতা!\n\nআপনি কি নিশ্চিত যে ${toBanglaNum(selectedYear)} সালের পূর্বের সমস্ত (${toBanglaNum(autoIds.length)}টি) অটো-আপলোডকৃত আয়-ব্যয় মুছে ফেলতে চান?\n\nমুছে ফেলার পর এটি স্থায়ীভাবে বিলুপ্ত হবে এবং আপনি নিজের মতো নতুন ম্যানুয়াল ভাউচার পোস্টিং করতে পারবেন।`
      )
    ) {
      return;
    }

    setIsBatchDeleting(true);
    try {
      if (onDeleteTransaction) {
        for (const id of autoIds) {
          await onDeleteTransaction(id);
        }
      }
      setSelectedTxIds(new Set());
      setSuccessMessage(`${toBanglaNum(selectedYear)} সালের সমস্ত অটো-আপলোডকৃত এন্ট্রি স্থায়ীভাবে মুছে ফেলা হয়েছে!`);
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      console.error('Error clearing auto entries for year:', err);
      alert('অটো এন্ট্রি মুছে ফেলতে সমস্যা হয়েছে।');
    } finally {
      setIsBatchDeleting(false);
    }
  };


  const handleApplyCustomYear = () => {
    const cleanYr = toEnglishDigits(customYearInput).trim();
    const yrNum = parseInt(cleanYr, 10);
    if (!isNaN(yrNum) && yrNum >= 1990 && yrNum <= 2050) {
      setSelectedYear(yrNum.toString());
      setShowCustomYearInput(false);
      setCustomYearInput('');
    } else {
      alert('সঠিক ৪ সংখ্যার বছর লিখুন (যেমন: ২০২৬, ২০২৫)');
    }
  };

  // ----------------------------------------------------
  // ADMIN ACCESS GUARD VIEW
  // ----------------------------------------------------
  if (!isAdminLoggedIn) {
    return (
      <div id="manual-posting-admin-guard" className="max-w-xl mx-auto py-12 px-4 sm:px-6 animate-fade-in text-[#3c3c3c]">
        <div className="bg-white border-2 border-[#cbd5e1] hover:border-[#0f766e] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6 text-center transition duration-300">
          <div className="mx-auto w-16 h-16 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-[#0f766e] shadow-xs">
            <Lock className="h-8 w-8 text-[#0f766e]" />
          </div>

          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-xs font-bold">
              <ShieldCheck className="h-3.5 w-3.5 text-amber-600" />
              <span>অ্যাডমিন দ্বারা সুরক্ষিত এলাকা</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-[#064e3b]">
              ম্যানুয়াল পোস্টিং প্রশাসনিক এক্সেস
            </h2>
            <p className="text-xs sm:text-sm text-slate-600 max-w-md mx-auto leading-relaxed">
              ম্যানুয়ালি পোস্টিং, ভাউচার এন্ট্রি ও যাবতীয় কেন্দ্রীয় আর্থিক লেনদেন শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য সুরক্ষিত। সাধারণ দর্শকদের পোস্টিংয়ের অনুমতি নেই।
            </p>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4 max-w-sm mx-auto text-left">
            <div>
              <label className="block text-xs font-bold text-[#064e3b] mb-1.5 flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5 text-[#0f766e]" />
                <span>অ্যাডমিন পাসওয়ার্ড দিন:</span>
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
                  if (adminAuthError) setAdminAuthError('');
                }}
                placeholder="অ্যাডমিন সিকিউরিটি পাসওয়ার্ড"
                className="w-full px-4 py-3 bg-slate-50 border border-[#cbd5e1] focus:bg-white focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl text-sm outline-hidden transition font-mono"
                autoFocus
              />
            </div>

            {adminAuthError && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0f766e] hover:bg-[#064e3b] text-white rounded-xl text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-2"
            >
              <KeyRound className="h-4 w-4 text-amber-300" />
              <span>লগইন করে পোস্টিং শুরু করুন</span>
            </button>
          </form>

          {onNavigate && (
            <div className="pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                <span>মূল পাতায় ফিরে যান</span>
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-6 ${isEmbedded ? '' : 'max-w-7xl mx-auto px-2 sm:px-4 py-4 sm:py-6'}`}>
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#047857] rounded-3xl p-5 sm:p-7 text-white shadow-xl relative overflow-hidden border border-emerald-700/40">
        <div className="absolute right-0 top-0 translate-x-8 -translate-y-8 w-64 h-64 bg-white/5 rounded-full blur-2xl pointer-events-none" />
        
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-5 relative z-10">
          <div className="space-y-2">
            <div className="flex items-center gap-2.5 flex-wrap">
              <span className="p-2 bg-amber-400 text-slate-950 rounded-2xl shadow-md">
                <FileSpreadsheet className="h-6 w-6" />
              </span>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                বছর ভিত্তিক ম্যানুয়াল আয়-ব্যয় পোস্টিং
              </h1>
              <span className="text-xs font-black bg-amber-400 text-slate-950 px-3 py-1 rounded-full shadow-xs">
                {toBanglaNum(selectedYear)} খ্রি. হিসাব
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl font-normal leading-relaxed">
              বিগত বছরসমূহ ও বর্তমান বছরের সাধারণ আয় ও ব্যয়ের খাতভিত্তিক হিসাব এক ক্লিকে বা এককভাবে পোস্টিং করুন। 
              বাড়ি ভিত্তিক সাধারণ সদস্যদের চাঁদা আদায় ব্যতিরেকে সাধারণ আয়-ব্যয় রিপোর্ট নিরপেক্ষ ও পরিচ্ছন্ন রাখুন।
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 self-start lg:self-center">
            {onNavigate && (
              <>
                <button
                  id="view-finance-divisions-btn"
                  type="button"
                  onClick={() => onNavigate('finance')}
                  className="px-4 py-2.5 bg-white/15 hover:bg-white/25 text-white border border-white/30 rounded-xl text-xs sm:text-sm font-bold shadow-md transition cursor-pointer flex items-center gap-1.5"
                  title="আয়-ব্যয় হিসাবের পৃথক বিভাগসমূহ দেখুন"
                >
                  <Layers className="h-4 w-4 text-amber-300" />
                  <span>আয়-ব্যয় বিভাগসমূহ</span>
                </button>
                <button
                  id="view-annual-report-btn"
                  type="button"
                  onClick={() => onNavigate('report')}
                  className="px-4 py-2.5 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-xl text-xs sm:text-sm font-extrabold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer flex items-center gap-2"
                >
                  <BookOpen className="h-4 w-4" />
                  <span>রিপোর্ট ও লেজার শিট দেখুন</span>
                  <ArrowRight className="h-4 w-4" />
                </button>
              </>
            )}
          </div>
        </div>

        {/* Year Selector Pills */}
        <div className="mt-5 pt-4 border-t border-white/20 flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold text-emerald-200 flex items-center gap-1 mr-1">
            <Calendar className="h-4 w-4 text-amber-300" />
            <span>হিসাবের বছর নির্বাচন করুন:</span>
          </span>

          {['2026', '2025', '2024', '2023', '2022'].map((yr) => {
            const isSelected = selectedYear === yr;
            return (
              <button
                key={yr}
                id={`year-btn-${yr}`}
                type="button"
                onClick={() => setSelectedYear(yr)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-xs ${
                  isSelected
                    ? 'bg-amber-400 text-slate-950 shadow-md ring-2 ring-white/50 scale-105'
                    : 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
                }`}
              >
                <span>{toBanglaNum(yr)}</span>
                {yr === '2026' && (
                  <span className={`text-[9px] px-1.5 py-0.2 rounded-full font-black ${
                    isSelected ? 'bg-slate-950 text-white' : 'bg-amber-400 text-slate-950'
                  }`}>
                    চলতি
                  </span>
                )}
              </button>
            );
          })}

          {showCustomYearInput ? (
            <div className="flex items-center gap-1 bg-white/20 p-1 rounded-xl border border-white/30">
              <input
                type="text"
                placeholder="সাল লিখুন (যেমন ২০২১)"
                value={customYearInput}
                onChange={(e) => setCustomYearInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === 'Enter') handleApplyCustomYear(); }}
                className="w-28 px-2 py-1 bg-white text-slate-900 rounded-lg text-xs font-bold focus:outline-none"
              />
              <button
                type="button"
                onClick={handleApplyCustomYear}
                className="px-2 py-1 bg-amber-400 text-slate-950 rounded-lg text-xs font-black cursor-pointer"
              >
                ঠিক আছে
              </button>
              <button
                type="button"
                onClick={() => setShowCustomYearInput(false)}
                className="px-1.5 py-1 text-white hover:text-red-200 text-xs cursor-pointer"
              >
                ✕
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setShowCustomYearInput(true)}
              className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition border border-dashed border-white/30 cursor-pointer"
            >
              + অন্য বছর
            </button>
          )}
        </div>
      </div>

      {/* Guarantee & Neutrality Banner */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 sm:p-4 text-xs text-emerald-950 flex items-start gap-3 shadow-xs">
        <ShieldCheck className="h-5 w-5 text-emerald-600 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-emerald-900">
            স্বচ্ছতা ও হিসাবের নিরপেক্ষতা নিশ্চয়তা:
          </p>
          <p className="text-[12px] text-emerald-800 leading-relaxed">
            এখানে পোস্টিংকৃত প্রতিটি সাধারণ আয় ও ব্যয় স্বয়ংক্রিয়ভাবে মূল <strong>আয়-ব্যয় বিবরণী, বার্ষিক খতিয়ান শিট ও পোস্টারে</strong> যুক্ত হবে।
            বাড়ি ভিত্তিক ব্যক্তিগণের চাঁদা আদায় সম্পূর্ণ পৃথকভাবে সংরক্ষিত থাকে এবং সাধারণ আয়-ব্যয় রিপোর্টে তা মিশ্রিত হবে না।
          </p>
        </div>
      </div>

      {/* Financial Metrics Summary Cards for Selected Year */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Income Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {toBanglaNum(selectedYear)} মোট আয়
            </span>
            <span className="p-1.5 bg-emerald-100 text-emerald-700 rounded-xl">
              <TrendingUp className="h-4 w-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-black text-emerald-950 mt-2">
            ৳ {toBanglaNum(yearTotalIncome.toLocaleString('bn-BD'))}/-
          </p>
          <span className="text-[10px] text-emerald-600 font-bold block mt-1">
            মোট সাধারণ তহবিল প্রাপ্তি
          </span>
        </div>

        {/* Expense Card */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {toBanglaNum(selectedYear)} মোট ব্যয়
            </span>
            <span className="p-1.5 bg-red-100 text-red-700 rounded-xl">
              <TrendingDown className="h-4 w-4" />
            </span>
          </div>
          <p className="text-lg sm:text-xl font-black text-red-950 mt-2">
            ৳ {toBanglaNum(yearTotalExpense.toLocaleString('bn-BD'))}/-
          </p>
          <span className="text-[10px] text-red-600 font-bold block mt-1">
            মোট সার্বিক খরচ
          </span>
        </div>

        {/* Current Year Net Surplus / Deficit */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              {toBanglaNum(selectedYear)} সালের নীট স্থিতি
            </span>
            <span className={`p-1.5 rounded-xl ${yearSurplus >= 0 ? 'bg-blue-100 text-blue-700' : 'bg-amber-100 text-amber-700'}`}>
              <Coins className="h-4 w-4" />
            </span>
          </div>
          <p className={`text-lg sm:text-xl font-black mt-2 ${yearSurplus >= 0 ? 'text-blue-950' : 'text-amber-950'}`}>
            ৳ {toBanglaNum(Math.abs(yearSurplus).toLocaleString('bn-BD'))}/-
          </p>
          <span className={`text-[10px] font-bold block mt-1 ${yearSurplus >= 0 ? 'text-blue-600' : 'text-amber-600'}`}>
            {yearSurplus >= 0 ? 'চলতি বছরের নীট উদ্বৃত্ত' : 'চলতি বছরের ঘাটতি'}
          </span>
        </div>

        {/* Previous Cash + Current = Net Cumulative Balance */}
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-500 uppercase">
              সর্বমোট চূড়ান্ত তহবিল
            </span>
            <span className="p-1.5 bg-purple-100 text-purple-700 rounded-xl">
              <Wallet className="h-4 w-4" />
            </span>
          </div>
          <p className={`text-lg sm:text-xl font-black mt-2 ${netTotalBalance >= 0 ? 'text-purple-950' : 'text-rose-950'}`}>
            ৳ {toBanglaNum(Math.abs(netTotalBalance).toLocaleString('bn-BD'))}/-
          </p>
          <span className="text-[10px] text-slate-500 font-semibold block mt-1">
            পূর্ব জের: ৳ {toBanglaNum(previousYearClosingBalance.toLocaleString('bn-BD'))}/- সহ
          </span>
        </div>
      </div>

      {/* Main Forms & Actions Section */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm overflow-hidden">
        {/* Mode Selector Tabs */}
        <div className="border-b border-slate-200 bg-slate-50/80 px-4 pt-3 flex gap-2">
          <button
            id="tab-single-posting"
            type="button"
            onClick={() => setActiveTab('single')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-2xl transition cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'single'
                ? 'border-[#064e3b] text-[#064e3b] bg-white shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Plus className="h-4 w-4" />
            <span>একক আয়/ব্যয় পোস্টিং</span>
          </button>
          <button
            id="tab-bulk-posting"
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`px-4 py-2.5 text-xs sm:text-sm font-bold rounded-t-2xl transition cursor-pointer flex items-center gap-2 border-b-2 ${
              activeTab === 'bulk'
                ? 'border-[#064e3b] text-[#064e3b] bg-white shadow-xs font-black'
                : 'border-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
          >
            <Layers className="h-4 w-4" />
            <span>এককালীন / খাতভিত্তিক দ্রুত পোস্টিং</span>
          </button>
        </div>

        <div className="p-4 sm:p-6 space-y-6">
          {successMessage && (
            <div className="p-3.5 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-2xl text-xs sm:text-sm font-bold flex items-center gap-2.5 animate-fade-in shadow-xs">
              <CheckCircle2 className="h-5 w-5 text-emerald-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Single Transaction Form */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="space-y-4">
              <div className="flex items-center justify-between border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <Receipt className="h-5 w-5 text-[#0f766e]" />
                    <span>নতুন আয় বা ব্যয় পোস্টিং ({toBanglaNum(selectedYear)} সাল)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    সঠিক বিবরণ ও রসিদ সহ যেকোনো একটি একক আয় বা ব্যয়ের এন্ট্রি যুক্ত করুন।
                  </p>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200">
                  {toBanglaNum(selectedYear)} সালের খতিয়ান
                </span>
              </div>

              {/* Type Switcher */}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5">
                  লেনদেনের ধরন (Transaction Type) *
                </label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    id="single-type-income"
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 border ${
                      type === 'income'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-md ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>আয় (টাকা প্রাপ্তি / জমা)</span>
                  </button>
                  <button
                    id="single-type-expense"
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2.5 px-3 rounded-xl font-black text-xs sm:text-sm transition cursor-pointer flex items-center justify-center gap-2 border ${
                      type === 'expense'
                        ? 'bg-red-600 text-white border-red-700 shadow-md ring-2 ring-red-500/20'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span>ব্যয় (টাকা খরচ)</span>
                  </button>
                </div>
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    টাকার পরিমাণ (৳) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-base font-black text-slate-500">৳</span>
                    <input
                      id="single-amount-input"
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="টাকার পরিমাণ লিখুন..."
                      value={amount}
                      onChange={(e) => setAmount(cleanNumericInput(e.target.value))}
                      className="block w-full pl-9 pr-3 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    ভাউচার / লেনদেনের তারিখ *
                  </label>
                  <input
                    id="single-date-input"
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e] transition"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">
                  হিসাবের খাত (Category) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <select
                    id="single-category-select"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0f766e] transition cursor-pointer"
                  >
                    {(type === 'income' ? GENERAL_INCOME_CATEGORIES : GENERAL_EXPENSE_CATEGORIES).map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                    <option value="custom" className="text-[#0f766e] font-bold">
                      + নতুন খাতের নাম লিখুন...
                    </option>
                  </select>

                  {(category === 'custom' || category === 'অন্যান্য' || category === 'অন্যান্য খরচ') && (
                    <input
                      id="single-custom-category-input"
                      type="text"
                      required
                      placeholder="নির্দিষ্ট খাতের নাম লিখুন..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="block w-full px-3 py-2.5 bg-white border-2 border-amber-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500 transition"
                    />
                  )}
                </div>
              </div>

              {/* Description & Receipt No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    {type === 'income' ? 'দাতার নাম / বিবরণ / প্রাপ্তি উৎস' : 'খরচের বিবরণ / কার্যাদেশ / উদ্দেশ্য'}
                  </label>
                  <input
                    id="single-description-input"
                    type="text"
                    placeholder={type === 'income' ? 'উদা: হাজী শামসুল হক (বিশেষ অনুদান)' : 'উদা: স্টেজ ও সামিয়ানা ভাড়া বাবদ'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e] transition"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    রশিদ নং / ভাউচার নং (ঐচ্ছিক)
                  </label>
                  <input
                    id="single-receipt-input"
                    type="text"
                    placeholder="উদা: V-101"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e] transition"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  id="single-submit-btn"
                  type="submit"
                  disabled={isSubmitting}
                  className="px-6 py-2.5 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'পোস্টিং হচ্ছে...' : 'ভাউচার এন্ট্রি সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Bulk Category Form */}
          {activeTab === 'bulk' && (
            <form onSubmit={handleBulkSubmit} className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
                <div>
                  <h3 className="text-sm sm:text-base font-black text-slate-900 flex items-center gap-2">
                    <Layers className="h-5 w-5 text-[#0f766e]" />
                    <span>এককালীন / খাতভিত্তিক দ্রুত পোস্টিং ({toBanglaNum(selectedYear)} সাল)</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    একসাথে একাধিক খাতের মোট টাকা বসিয়ে এক ক্লিকে সম্পূর্ণ বছরের লেজার বা হিসাব প্রস্তুত করুন।
                  </p>
                </div>
                <div className="flex items-center gap-2 self-start sm:self-auto">
                  <label className="text-xs font-bold text-slate-600">ভাউচার তারিখ:</label>
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="px-2.5 py-1.5 bg-white border border-slate-300 rounded-xl text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Two columns: Incomes and Expenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Income Heads */}
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="bg-emerald-100/90 text-emerald-950 px-3 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-4 w-4 text-emerald-700" />
                      <span>আয়ের খাতসমূহ (Incomes)</span>
                    </span>
                    <span className="text-[11px] font-bold text-emerald-800">টাকার অংক লিখুন</span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {GENERAL_INCOME_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs text-slate-800 font-bold truncate">{cat}</span>
                        <div className="relative w-36 shrink-0">
                          <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-400">৳</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={bulkIncomes[cat] || ''}
                            onChange={(e) => {
                              const val = cleanNumericInput(e.target.value);
                              setBulkIncomes((prev) => ({ ...prev, [cat]: val }));
                            }}
                            className="w-full pl-7 pr-2.5 py-1.5 text-right bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600 transition"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Heads */}
                <div className="space-y-2.5 bg-slate-50 p-4 rounded-2xl border border-slate-200">
                  <div className="bg-red-100/90 text-red-950 px-3 py-2 rounded-xl font-black text-xs sm:text-sm flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="h-4 w-4 text-red-700" />
                      <span>ব্যয়ের খাতসমূহ (Expenses)</span>
                    </span>
                    <span className="text-[11px] font-bold text-red-800">টাকার অংক লিখুন</span>
                  </div>
                  <div className="space-y-2 max-h-96 overflow-y-auto pr-1">
                    {GENERAL_EXPENSE_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center justify-between gap-2 bg-white p-2.5 rounded-xl border border-slate-200 shadow-2xs">
                        <span className="text-xs text-slate-800 font-bold truncate">{cat}</span>
                        <div className="relative w-36 shrink-0">
                          <span className="absolute left-2.5 top-1.5 text-xs font-black text-slate-400">৳</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={bulkExpenses[cat] || ''}
                            onChange={(e) => {
                              const val = cleanNumericInput(e.target.value);
                              setBulkExpenses((prev) => ({ ...prev, [cat]: val }));
                            }}
                            className="w-full pl-7 pr-2.5 py-1.5 text-right bg-slate-50 border border-slate-300 rounded-lg text-xs sm:text-sm font-black text-slate-900 focus:bg-white focus:outline-none focus:border-red-600 transition"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Bulk Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  id="bulk-submit-btn"
                  type="submit"
                  disabled={isBulkSubmitting}
                  className="px-7 py-3 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isBulkSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সবগুলো খাত একসাথে সেভ করুন'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* Posted Transactions Table Section */}
      <div className="bg-white border border-slate-200 rounded-3xl shadow-sm p-4 sm:p-6 space-y-4">
        {/* Banner if there are auto-uploaded transactions for this year */}
        {yearAutoTransactions.length > 0 && (
          <div className="p-3.5 sm:p-4 bg-purple-50 border border-purple-200 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-purple-100 rounded-xl text-purple-700 shrink-0">
                <Sparkles className="h-4 w-4" />
              </div>
              <div>
                <p className="font-black text-purple-900">
                  {toBanglaNum(selectedYear)} সালের {toBanglaNum(yearAutoTransactions.length)}টি পূর্বের অটো-সংরক্ষিত এন্ট্রি পাওয়া গেছে
                </p>
                <p className="text-purple-700">
                  আপনি চাইলে প্রতিটি এন্ট্রি আলাদাভাবে এডিট/মুছে ফেলতে পারেন অথবা এক ক্লিকে সব অটো এন্ট্রি মুছে ফেলে নতুন ম্যানুয়াল ভাউচার এন্ট্রি করতে পারেন।
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setFilterType('auto')}
                className={`px-3 py-1.5 rounded-xl font-bold transition cursor-pointer border ${
                  filterType === 'auto'
                    ? 'bg-purple-700 text-white border-purple-700'
                    : 'bg-white text-purple-800 border-purple-200 hover:bg-purple-100'
                }`}
              >
                শুধুমাত্র অটো দেখুন
              </button>
              {onDeleteTransaction && (
                <button
                  type="button"
                  disabled={isBatchDeleting}
                  onClick={handleClearAllAutoForYear}
                  className="px-3 py-1.5 bg-red-100 hover:bg-red-600 text-red-700 hover:text-white border border-red-200 rounded-xl font-black transition cursor-pointer flex items-center gap-1.5 disabled:opacity-50"
                  title="এই বছরের সকল অটো-আপলোডকৃত হিসাব মুছে ফেলুন"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>{isBatchDeleting ? 'মুছে ফেলা হচ্ছে...' : 'সব অটো এন্ট্রি মুছুন'}</span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Header & Controls */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 border-b border-slate-200 pb-3">
          <div className="flex items-center gap-2.5">
            <FileText className="h-5 w-5 text-[#0f766e]" />
            <div>
              <h3 className="text-sm sm:text-base font-black text-slate-900">
                {toBanglaNum(selectedYear)} সালের সাধারণ আয়-ব্যয় লেনদেন তালিকা
              </h3>
              <div className="flex items-center gap-2 flex-wrap text-xs text-slate-500 mt-0.5">
                <span>মোট {toBanglaNum(displayedTransactions.length)}টি এন্ট্রি (বাড়ি ভিত্তিক চাঁদা আলাদা)</span>
                <span className="inline-flex items-center gap-1 text-[11px] bg-emerald-50 text-emerald-700 font-bold px-2 py-0.5 rounded-full border border-emerald-200">
                  📌 প্রথমের পোস্টিং প্রথমে (FIFO ক্রম)
                </span>
              </div>
            </div>
          </div>

          {/* Search & Filter Controls */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="relative">
              <Search className="h-3.5 w-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              <input
                type="text"
                placeholder="খাত বা বিবরণ খুঁজুন..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:bg-white focus:outline-none focus:border-[#0f766e]"
              />
            </div>

            <div className="flex flex-wrap rounded-xl bg-slate-100 p-0.5 border border-slate-200 text-xs font-bold">
              <button
                type="button"
                onClick={() => setFilterType('all')}
                className={`px-2.5 py-1 rounded-lg transition ${filterType === 'all' ? 'bg-white text-slate-900 shadow-2xs font-black' : 'text-slate-600'}`}
              >
                সব ({toBanglaNum(yearGeneralTransactions.length)})
              </button>
              <button
                type="button"
                onClick={() => setFilterType('income')}
                className={`px-2.5 py-1 rounded-lg transition ${filterType === 'income' ? 'bg-emerald-600 text-white shadow-2xs font-black' : 'text-slate-600'}`}
              >
                আয়
              </button>
              <button
                type="button"
                onClick={() => setFilterType('expense')}
                className={`px-2.5 py-1 rounded-lg transition ${filterType === 'expense' ? 'bg-red-600 text-white shadow-2xs font-black' : 'text-slate-600'}`}
              >
                ব্যয়
              </button>
              <button
                type="button"
                onClick={() => setFilterType('auto')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${filterType === 'auto' ? 'bg-purple-700 text-white shadow-2xs font-black' : 'text-purple-700'}`}
              >
                <span>⚡ অটো</span>
                <span>({toBanglaNum(yearAutoTransactions.length)})</span>
              </button>
              <button
                type="button"
                onClick={() => setFilterType('manual')}
                className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${filterType === 'manual' ? 'bg-emerald-700 text-white shadow-2xs font-black' : 'text-slate-600'}`}
              >
                <span>✏️ ম্যানুয়াল</span>
                <span>({toBanglaNum(yearManualTransactions.length)})</span>
              </button>
            </div>
          </div>
        </div>

        {/* Selected Batch Action Bar */}
        {selectedTxIds.size > 0 && (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between text-xs animate-fade-in">
            <span className="font-bold text-amber-900">
              নির্বাচিত {toBanglaNum(selectedTxIds.size)}টি লেনদেন
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedTxIds(new Set())}
                className="px-2.5 py-1 bg-white border border-amber-300 rounded-lg text-amber-800 hover:bg-amber-100 transition cursor-pointer font-medium"
              >
                নির্বাচন বাতিল
              </button>
              <button
                type="button"
                disabled={isBatchDeleting}
                onClick={handleBatchDeleteSelected}
                className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg font-bold transition cursor-pointer flex items-center gap-1 disabled:opacity-50"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>{isBatchDeleting ? 'মুছে ফেলা হচ্ছে...' : 'নির্বাচিতগুলো মুছুন'}</span>
              </button>
            </div>
          </div>
        )}

        {displayedTransactions.length === 0 ? (
          <div className="py-12 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
            <p className="text-sm text-slate-700 font-bold">
              {toBanglaNum(selectedYear)} সালের কোনো সাধারণ আয়-ব্যয় লেনদেন পাওয়া যায়নি।
            </p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              উপরের ফর্ম থেকে নতুন আয় বা ব্যয়ের টাকা পোস্টিং করুন। পোস্টিং করা মাত্রই তা লাইভ রিপোর্ট ও চার্টে যুক্ত হয়ে যাবে।
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-100/80 text-slate-700 border-b border-slate-200">
                  <th className="py-2.5 px-2 text-center w-10">
                    <input
                      type="checkbox"
                      checked={
                        displayedTransactions.length > 0 &&
                        displayedTransactions.every((t) => selectedTxIds.has(t.id))
                      }
                      onChange={handleSelectAll}
                      className="rounded border-slate-300 text-[#0f766e] focus:ring-[#0f766e] cursor-pointer"
                      title="সবগুলো নির্বাচন করুন"
                    />
                  </th>
                  <th className="py-2.5 px-2 font-black text-center w-10">ক্র.</th>
                  <th className="py-2.5 px-3 font-black w-24">তারিখ</th>
                  <th className="py-2.5 px-3 font-black w-44">খাত ও ধরন</th>
                  <th className="py-2.5 px-3 font-black">বিবরণ / উৎস / ভাউচার</th>
                  <th className="py-2.5 px-3 font-black text-center w-20">ধরন</th>
                  <th className="py-2.5 px-3 font-black text-right w-28">পরিমাণ</th>
                  <th className="py-2.5 px-3 font-black text-center w-24">অ্যাকশন</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayedTransactions.map((tx, idx) => {
                  const isAuto = isAutoUploadedTransaction(tx);
                  const isSelected = selectedTxIds.has(tx.id);

                  return (
                    <tr
                      key={tx.id}
                      className={`hover:bg-slate-50/80 transition ${
                        isSelected ? 'bg-amber-50/50' : ''
                      }`}
                    >
                      <td className="py-2.5 px-2 text-center">
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(tx.id)}
                          className="rounded border-slate-300 text-[#0f766e] focus:ring-[#0f766e] cursor-pointer"
                        />
                      </td>
                      <td className="py-2.5 px-2 text-center text-slate-500 font-bold">
                        {toBanglaNum(idx + 1)}
                      </td>
                      <td className="py-2.5 px-3 text-slate-700 font-medium whitespace-nowrap">
                        {toBanglaDate(tx.date)}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-slate-900">
                            {tx.category || (tx.type === 'income' ? 'সাধারণ আয়' : 'সাধারণ ব্যয়')}
                          </span>
                          {isAuto ? (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-black bg-purple-100 text-purple-800 border border-purple-200"
                              title="পূর্বের অটো আপলোডকৃত এন্ট্রি"
                            >
                              ⚡ অটো
                            </span>
                          ) : (
                            <span
                              className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[9px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200"
                              title="ম্যানুয়াল ভাউচার এন্ট্রি"
                            >
                              ✏️ ম্যানুয়াল
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">
                        <div className="truncate max-w-xs sm:max-w-md font-medium">
                          {tx.description || tx.donorName || '-'}
                        </div>
                        {tx.receiptNo && (
                          <span className="text-[10px] text-slate-400 block">
                            রশিদ/ভাউচার নং: {toBanglaNum(tx.receiptNo)}
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black ${
                            tx.type === 'income'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-red-100 text-red-800'
                          }`}
                        >
                          {tx.type === 'income' ? (
                            <>
                              <TrendingUp className="h-3 w-3" />
                              <span>আয়</span>
                            </>
                          ) : (
                            <>
                              <TrendingDown className="h-3 w-3" />
                              <span>ব্যয়</span>
                            </>
                          )}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right font-black text-slate-900 whitespace-nowrap">
                        <span className={tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'}>
                          {tx.type === 'income' ? '+' : '-'} ৳ {toBanglaNum(tx.amount.toLocaleString('bn-BD'))}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => setEditingTx(tx)}
                            className="p-1.5 text-slate-500 hover:text-[#0f766e] rounded-lg hover:bg-emerald-50 transition cursor-pointer"
                            title="সম্পাদনা / এডিট করুন"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>

                          {/* Delete Button */}
                          {onDeleteTransaction && (
                            <button
                              type="button"
                              disabled={isDeletingId === tx.id || isBatchDeleting}
                              onClick={() => handleDelete(tx.id)}
                              className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-red-50 transition cursor-pointer disabled:opacity-50"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Edit Transaction Modal */}
      {editingTx && (
        <EditTransactionModal
          transaction={editingTx}
          isOpen={Boolean(editingTx)}
          onClose={() => setEditingTx(null)}
          onSave={handleSaveEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}

