import React from 'react';
import { Transaction } from '../types';
import {
  X,
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
  HelpCircle,
  BookOpen,
  ArrowRight,
  Lock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { cleanNumericInput, toEnglishDigits } from '../lib/numberUtils';
import {
  isHouseCollection,
  getTransactionYear,
  sortTransactionsFIFO,
  GENERAL_INCOME_CATEGORIES,
  GENERAL_EXPENSE_CATEGORIES
} from '../lib/transactionUtils';

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

interface ManualFinancialPostingModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onAddTransaction: (newT: Omit<Transaction, 'id'>) => Promise<void> | void;
  onBatchAddTransactions?: (items: Omit<Transaction, 'id'>[]) => Promise<void> | void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  initialYear?: string;
  onViewReport?: (year: string) => void;
  isAdminLoggedIn?: boolean;
  setIsAdminLoggedIn?: (val: boolean) => void;
}

export default function ManualFinancialPostingModal({
  isOpen,
  onClose,
  transactions = [],
  onAddTransaction,
  onBatchAddTransactions,
  onDeleteTransaction,
  initialYear = '2026',
  onViewReport,
  isAdminLoggedIn = false,
  setIsAdminLoggedIn
}: ManualFinancialPostingModalProps) {
  const [selectedYear, setSelectedYear] = React.useState<string>(initialYear || '2026');
  const [activeTab, setActiveTab] = React.useState<'single' | 'bulk'>('single');

  // Admin authorization inside modal
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

  // Single form states
  const [type, setType] = React.useState<'income' | 'expense'>('income');
  const [amount, setAmount] = React.useState<string>('');
  const [category, setCategory] = React.useState<string>('সাধারণ অনুদান ও কালেকশন');
  const [customCategory, setCustomCategory] = React.useState<string>('');
  const [description, setDescription] = React.useState<string>('');
  const [date, setDate] = React.useState<string>(() => new Date().toISOString().split('T')[0]);
  const [receiptNo, setReceiptNo] = React.useState<string>('');
  const [isSubmitting, setIsSubmitting] = React.useState<boolean>(false);
  const [successMessage, setSuccessMessage] = React.useState<string>('');

  // Bulk form states
  const [bulkIncomes, setBulkIncomes] = React.useState<Record<string, string>>({});
  const [bulkExpenses, setBulkExpenses] = React.useState<Record<string, string>>({});
  const [bulkDate, setBulkDate] = React.useState<string>(() => `${initialYear}-09-15`);
  const [isBulkSubmitting, setIsBulkSubmitting] = React.useState<boolean>(false);

  // Deleting item tracking
  const [isDeletingId, setIsDeletingId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (initialYear) {
      setSelectedYear(initialYear);
      setBulkDate(`${initialYear}-09-15`);
    }
  }, [initialYear]);

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
        // Notice: houseName is NOT set, which guarantees it is a general ledger entry!
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

  if (!isOpen) return null;

  if (!isAdminLoggedIn) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-4 animate-fade-in">
        <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-200 p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2 text-[#064e3b] font-black text-base">
              <ShieldCheck className="h-5 w-5 text-[#0f766e]" />
              <span>প্রশাসনিক অনুমোদন আবশ্যক</span>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-700 rounded-xl hover:bg-slate-100 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="text-center space-y-2">
            <div className="mx-auto w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-[#0f766e]">
              <Lock className="h-7 w-7 text-[#0f766e]" />
            </div>
            <h4 className="text-lg font-bold text-[#064e3b]">পোস্টিং অ্যাডমিন দ্বারা সুরক্ষিত</h4>
            <p className="text-xs text-slate-600 leading-relaxed">
              ম্যানুয়ালি কোনো প্রকার আয় বা ব্যয়ের ভাউচার পোস্ট করতে অ্যাডমিন পাসওয়ার্ড দিয়ে অনুমোদন করুন।
            </p>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-[#064e3b] mb-1.5 flex items-center gap-1">
                <KeyRound className="h-3.5 w-3.5 text-[#0f766e]" />
                <span>অ্যাডমিন পাসওয়ার্ড লিখুন:</span>
              </label>
              <input
                type="password"
                value={adminPasswordInput}
                onChange={(e) => {
                  setAdminPasswordInput(e.target.value);
                  if (adminAuthError) setAdminAuthError('');
                }}
                placeholder="অ্যাডমিন সিকিউরিটি পাসওয়ার্ড"
                className="w-full px-4 py-2.5 bg-slate-50 border border-[#cbd5e1] focus:bg-white focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl text-xs sm:text-sm outline-hidden transition font-mono"
                autoFocus
              />
            </div>

            {adminAuthError && (
              <div className="flex items-center gap-2 text-xs text-red-700 bg-red-50 p-2.5 rounded-xl border border-red-200">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <div className="flex items-center gap-2.5 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs sm:text-sm transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                className="flex-1 py-2.5 bg-[#0f766e] hover:bg-[#064e3b] text-white font-bold rounded-xl text-xs sm:text-sm shadow-md transition cursor-pointer flex items-center justify-center gap-1.5"
              >
                <KeyRound className="h-4 w-4 text-amber-300" />
                <span>লগইন করুন</span>
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-xs p-3 sm:p-5 animate-fade-in overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[92vh] border border-gray-200">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-amber-400/20 text-amber-300 rounded-2xl border border-amber-400/30">
              <Sparkles className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  ম্যানুয়াল আয়-ব্যয় পোস্টিং ও রিপোর্ট প্রস্তুতকরণ
                </h3>
                <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-xs">
                  {toBanglaNum(selectedYear)} খ্রি.
                </span>
              </div>
              <p className="text-xs text-emerald-100 font-normal mt-0.5">
                বিগত ও বর্তমান বছরের সাধারণ আয় ও ব্যয়ের খাতভিত্তিক হিসাব পোস্টিং (বাড়ি ভিত্তিক চাঁদা ব্যতীত)
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-white/80 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Year Selector & Scope Guarantee Banner */}
        <div className="bg-slate-50 border-b border-slate-200 p-3 sm:p-4 shrink-0 space-y-2.5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            {/* Year Selector Buttons */}
            <div className="flex items-center gap-1.5 flex-wrap">
              <span className="text-xs font-bold text-slate-600 flex items-center gap-1 mr-1">
                <Calendar className="h-3.5 w-3.5 text-slate-500" />
                <span>হিসাবের বছর:</span>
              </span>
              {['2026', '2025', '2024', '2023'].map((yr) => {
                const isSelected = selectedYear === yr;
                return (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => setSelectedYear(yr)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-extrabold transition cursor-pointer flex items-center gap-1 ${
                      isSelected
                        ? 'bg-[#064e3b] text-white shadow-sm ring-2 ring-[#0f766e]/30'
                        : 'bg-white text-slate-700 border border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <span>{toBanglaNum(yr)}</span>
                    {yr === '2026' && (
                      <span className="text-[9px] bg-amber-400 text-slate-950 px-1.5 py-0.2 rounded-full font-black">
                        বর্তমান
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* View Generated Report Button */}
            {onViewReport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewReport(selectedYear);
                }}
                className="px-3.5 py-1.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer shadow-xs"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>{toBanglaNum(selectedYear)} সালের রিপোর্ট দেখুন</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Golden Rules / Notice Banner */}
          <div className="bg-emerald-50/90 border border-emerald-200 rounded-xl p-2.5 text-[11.5px] text-emerald-900 flex items-start gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
            <div>
              <span className="font-bold">নিয়মাবলী ও নিরাপত্তা: </span>
              এখানে পোস্টিংকৃত আয় ও ব্যয়গুলো সরাসরি <strong>আয়-ব্যয় রিপোর্ট, বার্ষিক লেজার ও পোস্টারে</strong> প্রদর্শিত হবে।
              ব্যবহারকারীর অনুরোধ অনুযায়ী <strong>বাড়ি ভিত্তিক ব্যক্তির খুচরা চাঁদা আদায়গুলো এখানে মিশ্রিত হবে না</strong>, যাতে মূল আয়-ব্যয় রিপোর্ট পরিচ্ছন্ন থাকে।
            </div>
          </div>
        </div>

        {/* Year Financial Metric Ribbon */}
        <div className="bg-white border-b border-slate-200 px-4 py-2.5 grid grid-cols-3 gap-2 sm:gap-4 shrink-0 text-center">
          <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-200">
            <span className="text-[10px] sm:text-xs font-bold text-emerald-800 block">
              {toBanglaNum(selectedYear)} মোট আয়
            </span>
            <span className="text-sm sm:text-base font-black text-emerald-950">
              ৳ {toBanglaNum(yearTotalIncome.toLocaleString('bn-BD'))}/-
            </span>
          </div>
          <div className="p-2 rounded-xl bg-red-50/70 border border-red-200">
            <span className="text-[10px] sm:text-xs font-bold text-red-800 block">
              {toBanglaNum(selectedYear)} মোট ব্যয়
            </span>
            <span className="text-sm sm:text-base font-black text-red-950">
              ৳ {toBanglaNum(yearTotalExpense.toLocaleString('bn-BD'))}/-
            </span>
          </div>
          <div className={`p-2 rounded-xl border ${yearSurplus >= 0 ? 'bg-blue-50/70 border-blue-200 text-blue-950' : 'bg-amber-50/70 border-amber-200 text-amber-950'}`}>
            <span className="text-[10px] sm:text-xs font-bold block">
              {yearSurplus >= 0 ? 'নীট উদ্বৃত্ত (Surplus)' : 'ঘাটতি (Deficit)'}
            </span>
            <span className="text-sm sm:text-base font-black">
              ৳ {toBanglaNum(Math.abs(yearSurplus).toLocaleString('bn-BD'))}/-
            </span>
          </div>
        </div>

        {/* Mode Tabs (Single vs Bulk) */}
        <div className="flex border-b border-slate-200 bg-slate-100/70 px-4 pt-2 gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setActiveTab('single')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'single'
                ? 'border-[#064e3b] text-[#064e3b] bg-white shadow-xs'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Plus className="h-3.5 w-3.5" />
            <span>একক আয়/ব্যয় পোস্টিং</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('bulk')}
            className={`px-3.5 py-2 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-1.5 border-b-2 ${
              activeTab === 'bulk'
                ? 'border-[#064e3b] text-[#064e3b] bg-white shadow-xs'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-white/50'
            }`}
          >
            <Layers className="h-3.5 w-3.5" />
            <span>এককালীন / দ্রুত খাতভিত্তিক পোস্টিং</span>
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {successMessage && (
            <div className="p-3 bg-emerald-100 border border-emerald-300 text-emerald-900 rounded-xl text-xs font-bold flex items-center gap-2 animate-fade-in shadow-2xs">
              <CheckCircle2 className="h-4 w-4 text-emerald-700 shrink-0" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* TAB 1: Single Transaction Form */}
          {activeTab === 'single' && (
            <form onSubmit={handleSingleSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <h4 className="text-sm font-black text-[#064e3b] flex items-center gap-2 border-b border-slate-200 pb-2">
                <span>নতুন আয় বা ব্যয় এন্ট্রি ফরম ({toBanglaNum(selectedYear)} সাল)</span>
              </h4>

              {/* Type Switcher */}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1.5">লেনদেনের ধরন (Transaction Type) *</label>
                <div className="grid grid-cols-2 gap-3 max-w-md">
                  <button
                    type="button"
                    onClick={() => setType('income')}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 border ${
                      type === 'income'
                        ? 'bg-emerald-600 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-500/20'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>আয় (টাকা প্রাপ্তি / জমা)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setType('expense')}
                    className={`py-2 px-3 rounded-xl font-black text-xs transition cursor-pointer flex items-center justify-center gap-2 border ${
                      type === 'expense'
                        ? 'bg-red-600 text-white border-red-700 shadow-xs ring-2 ring-red-500/20'
                        : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span>ব্যয় (টাকা খরচ)</span>
                  </button>
                </div>
              </div>

              {/* Amount & Date Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    টাকার পরিমাণ (৳) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-base font-black text-slate-500">৳</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      placeholder="টাকার পরিমাণ লিখুন..."
                      value={amount}
                      onChange={(e) => setAmount(cleanNumericInput(e.target.value))}
                      className="block w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-base font-black text-slate-900 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    ভাউচার / লেনদেনের তারিখ *
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>
              </div>

              {/* Category Dropdown */}
              <div>
                <label className="block text-slate-700 text-xs font-bold mb-1">
                  হিসাবের খাত (Category) *
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-[#0f766e]"
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
                      type="text"
                      required
                      placeholder="নির্দিষ্ট খাতের নাম লিখুন..."
                      value={customCategory}
                      onChange={(e) => setCustomCategory(e.target.value)}
                      className="block w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                    />
                  )}
                </div>
              </div>

              {/* Description & Receipt No */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    {type === 'income' ? 'দাতার নাম / বিবরণ / উৎস' : 'খরচের বিবরণ / প্রাপ্তি রসিদ'}
                  </label>
                  <input
                    type="text"
                    placeholder={type === 'income' ? 'উদা: মো: আলমগীর (প্রবাসী ভাইদের অনুদান)' : 'উদা: সাউন্ড সিস্টেম বিল পরিশোধ ও পরিবহন'}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>

                <div>
                  <label className="block text-slate-700 text-xs font-bold mb-1">
                    রশিদ নং / ভাউচার নং (ঐচ্ছিক)
                  </label>
                  <input
                    type="text"
                    placeholder="উদা: V-101"
                    value={receiptNo}
                    onChange={(e) => setReceiptNo(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 focus:outline-none focus:border-[#0f766e]"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex justify-end">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2.5 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isSubmitting ? 'পোস্টিং হচ্ছে...' : 'ভাউচার এন্ট্রি সংরক্ষণ করুন'}</span>
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Bulk / Fast Category Posting Form */}
          {activeTab === 'bulk' && (
            <form onSubmit={handleBulkSubmit} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 sm:p-5 space-y-4 shadow-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div>
                  <h4 className="text-sm font-black text-[#064e3b] flex items-center gap-1.5">
                    <Layers className="h-4 w-4 text-[#0f766e]" />
                    <span>এককালীন / দ্রুত খাতভিত্তিক পোস্টিং ({toBanglaNum(selectedYear)} সাল)</span>
                  </h4>
                  <p className="text-xs text-slate-600 font-normal">
                    একসাথে একাধিক খাতের মোট টাকা এন্ট্রি করে এক ক্লিকে সম্পূর্ণ বছরের লেজার রেডি করুন।
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <label className="text-xs font-bold text-slate-600">ভাউচার তারিখ:</label>
                  <input
                    type="date"
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="px-2 py-1 bg-white border border-slate-300 rounded-lg text-xs font-semibold"
                  />
                </div>
              </div>

              {/* Two columns: Incomes and Expenses */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* Income Heads */}
                <div className="space-y-2.5">
                  <div className="bg-emerald-100/80 text-emerald-900 px-3 py-1.5 rounded-xl font-black text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span>আয়ের খাতসমূহ (Incomes)</span>
                    </span>
                    <span className="text-[10px] font-bold">টাকার অংক লিখুন</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {GENERAL_INCOME_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-800 font-medium truncate">{cat}</span>
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">৳</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={bulkIncomes[cat] || ''}
                            onChange={(e) => {
                              const val = cleanNumericInput(e.target.value);
                              setBulkIncomes((prev) => ({ ...prev, [cat]: val }));
                            }}
                            className="w-full pl-6 pr-2 py-1 text-right bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-emerald-600"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Expense Heads */}
                <div className="space-y-2.5">
                  <div className="bg-red-100/80 text-red-900 px-3 py-1.5 rounded-xl font-black text-xs flex items-center justify-between">
                    <span className="flex items-center gap-1.5">
                      <TrendingDown className="h-3.5 w-3.5" />
                      <span>ব্যয়ের খাতসমূহ (Expenses)</span>
                    </span>
                    <span className="text-[10px] font-bold">টাকার অংক লিখুন</span>
                  </div>
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
                    {GENERAL_EXPENSE_CATEGORIES.map((cat) => (
                      <div key={cat} className="flex items-center justify-between gap-2 bg-white p-2 rounded-xl border border-slate-200">
                        <span className="text-xs text-slate-800 font-medium truncate">{cat}</span>
                        <div className="relative w-32 shrink-0">
                          <span className="absolute left-2 top-1.5 text-xs font-bold text-slate-400">৳</span>
                          <input
                            type="text"
                            inputMode="numeric"
                            placeholder="0"
                            value={bulkExpenses[cat] || ''}
                            onChange={(e) => {
                              const val = cleanNumericInput(e.target.value);
                              setBulkExpenses((prev) => ({ ...prev, [cat]: val }));
                            }}
                            className="w-full pl-6 pr-2 py-1 text-right bg-slate-50 border border-slate-300 rounded-lg text-xs font-black text-slate-900 focus:bg-white focus:outline-none focus:border-red-600"
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
                  type="submit"
                  disabled={isBulkSubmitting}
                  className="px-6 py-2.5 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-black shadow-md transition cursor-pointer flex items-center gap-2 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  <span>{isBulkSubmitting ? 'সংরক্ষণ হচ্ছে...' : 'সবগুলো খাত একসাথে সেভ করুন'}</span>
                </button>
              </div>
            </form>
          )}

          {/* Table of Posted General Transactions for the selected year */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-slate-200 pb-2">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0f766e]" />
                <h4 className="text-sm font-black text-slate-900">
                  {toBanglaNum(selectedYear)} সালের সাধারণ আয়-ব্যয় লেনদেন তালিকা
                </h4>
                <span className="text-[10px] bg-slate-200 text-slate-800 px-2 py-0.5 rounded-full font-bold">
                  {toBanglaNum(yearGeneralTransactions.length)} টি এন্ট্রি
                </span>
                <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 rounded-full font-bold">
                  📌 প্রথমের পোস্টিং প্রথমে (FIFO)
                </span>
              </div>

              <span className="text-[11px] text-slate-500 font-medium">
                (বাড়ি ভিত্তিক ব্যক্তিদের চাঁদা ব্যতীত)
              </span>
            </div>

            {yearGeneralTransactions.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <p className="text-xs text-slate-600 font-medium">
                  {toBanglaNum(selectedYear)} সালের কোনো সাধারণ আয় বা ব্যয় এখনও পোস্টিং করা হয়নি।
                </p>
                <p className="text-[11px] text-slate-500">
                  উপরের ফর্ম থেকে আয় ও ব্যয়ের খাতভিত্তিক টাকা পোস্টিং করুন। পোস্টিং করলেই সাথে সাথে আয়-ব্যয় রিপোর্ট তৈরি হয়ে যাবে।
                </p>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-2xs divide-y divide-slate-100 max-h-80 overflow-y-auto">
                {yearGeneralTransactions.map((tx, idx) => (
                  <div key={tx.id} className="p-3 flex items-center justify-between gap-3 hover:bg-slate-50/80 transition text-xs">
                    <div className="flex items-start gap-2.5 min-w-0">
                      <span className={`p-1.5 rounded-lg shrink-0 mt-0.5 ${
                        tx.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {tx.type === 'income' ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                      </span>

                      <div className="min-w-0 space-y-0.5">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-slate-900 truncate">
                            {tx.category || (tx.type === 'income' ? 'সাধারণ আয়' : 'সাধারণ ব্যয়')}
                          </span>
                          <span className={`text-[10px] px-1.5 py-0.2 rounded font-black ${
                            tx.type === 'income' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                          }`}>
                            {tx.type === 'income' ? 'আয়' : 'ব্যয়'}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-600 truncate">
                          {tx.description || tx.donorName || 'বিবরণ নেই'}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          তারিখ: {toBanglaDate(tx.date)} {tx.receiptNo && `| ভাউচার: ${tx.receiptNo}`}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span className={`text-sm font-black ${
                        tx.type === 'income' ? 'text-emerald-700' : 'text-red-700'
                      }`}>
                        ৳ {toBanglaNum(tx.amount.toLocaleString('bn-BD'))}/-
                      </span>

                      {onDeleteTransaction && (
                        <button
                          type="button"
                          disabled={isDeletingId === tx.id}
                          onClick={async () => {
                            if (window.confirm(`আপনি কি নিশ্চিত যে "${tx.category}" এর ৳ ${toBanglaNum(tx.amount)}/- টাকার এই এন্ট্রিটি মুছে ফেলতে চান?`)) {
                              setIsDeletingId(tx.id);
                              try {
                                await onDeleteTransaction(tx.id);
                              } finally {
                                setIsDeletingId(null);
                              }
                            }
                          }}
                          className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between shrink-0">
          <span className="text-xs text-slate-600 font-medium">
            মোট সাধারণ লেনদেন: {toBanglaNum(yearGeneralTransactions.length)} টি
          </span>

          <div className="flex items-center gap-2">
            {onViewReport && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onViewReport(selectedYear);
                }}
                className="px-4 py-2 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-black transition cursor-pointer flex items-center gap-1.5 shadow-sm"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span>রিপোর্ট তৈরি ও প্রিভিউ দেখুন</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বন্ধ করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
