import React from 'react';
import { Transaction } from '../types';
import {
  X,
  Save,
  Trash2,
  TrendingUp,
  TrendingDown,
  Calendar,
  Layers,
  Sparkles,
  AlertTriangle,
  Receipt,
  Home,
  UserCheck
} from 'lucide-react';
import { cleanNumericInput, toEnglishDigits } from '../lib/numberUtils';
import {
  GENERAL_INCOME_CATEGORIES,
  GENERAL_EXPENSE_CATEGORIES,
  isAutoUploadedTransaction
} from '../lib/transactionUtils';

// Helper for Bangla digits
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
};

export interface EditTransactionModalProps {
  transaction: Transaction | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updated: Transaction) => Promise<void> | void;
  onDelete?: (id: string) => Promise<void> | void;
  availableHouses?: string[];
}

export default function EditTransactionModal({
  transaction,
  isOpen,
  onClose,
  onSave,
  onDelete,
  availableHouses = []
}: EditTransactionModalProps) {
  if (!isOpen || !transaction) return null;

  const isAuto = isAutoUploadedTransaction(transaction);

  // Form states
  const [type, setType] = React.useState<'income' | 'expense'>(transaction.type || 'income');
  const [amount, setAmount] = React.useState<string>(String(transaction.amount || ''));
  const [date, setDate] = React.useState<string>(transaction.date || new Date().toISOString().split('T')[0]);
  const [year, setYear] = React.useState<number>(
    transaction.year || (transaction.date ? parseInt(transaction.date.split('-')[0], 10) : 2025)
  );
  
  const currentCategories = type === 'income' ? GENERAL_INCOME_CATEGORIES : GENERAL_EXPENSE_CATEGORIES;
  const isKnownCat = currentCategories.includes(transaction.category || '');
  
  const [category, setCategory] = React.useState<string>(isKnownCat ? (transaction.category || currentCategories[0]) : 'custom');
  const [customCategory, setCustomCategory] = React.useState<string>(isKnownCat ? '' : (transaction.category || ''));
  const [donorName, setDonorName] = React.useState<string>(transaction.donorName || '');
  const [description, setDescription] = React.useState<string>(transaction.description || '');
  const [receiptNo, setReceiptNo] = React.useState<string>(transaction.receiptNo || '');
  const [recordedBy, setRecordedBy] = React.useState<string>(transaction.recordedBy || 'অ্যাডমিন');
  const [houseName, setHouseName] = React.useState<string>(transaction.houseName || '');

  const [isSaving, setIsSaving] = React.useState<boolean>(false);
  const [isDeleting, setIsDeleting] = React.useState<boolean>(false);
  const [errorMessage, setErrorMessage] = React.useState<string>('');

  // Handle Type switch
  const handleTypeChange = (newType: 'income' | 'expense') => {
    setType(newType);
    const newCatList = newType === 'income' ? GENERAL_INCOME_CATEGORIES : GENERAL_EXPENSE_CATEGORIES;
    setCategory(newCatList[0]);
    setCustomCategory('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const parsedAmount = parseInt(toEnglishDigits(cleanNumericInput(amount)), 10);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      setErrorMessage('অনুগ্রহ করে সঠিক টাকার পরিমাণ লিখুন।');
      return;
    }

    const finalCategory = category === 'custom' ? customCategory.trim() : category;
    if (!finalCategory) {
      setErrorMessage('অনুগ্রহ করে একটি খাত নির্বাচন করুন বা লিখুন।');
      return;
    }

    const updatedTx: Transaction = {
      ...transaction,
      type,
      amount: parsedAmount,
      date,
      year,
      category: finalCategory,
      donorName: type === 'income' ? donorName.trim() : undefined,
      description: type === 'expense' ? description.trim() : (description.trim() || undefined),
      receiptNo: receiptNo.trim() ? toEnglishDigits(receiptNo.trim()) : undefined,
      recordedBy: recordedBy.trim() || 'অ্যাডমিন',
      houseName: houseName.trim() ? houseName.trim() : undefined
    };

    setIsSaving(true);
    try {
      await onSave(updatedTx);
      onClose();
    } catch (err) {
      console.error('Failed to update transaction:', err);
      setErrorMessage('তথ্য সংরক্ষণ করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!onDelete) return;
    const confirmText = isAuto
      ? `আপনি কি নিশ্চিত যে পূর্বের এই অটো-আপলোডকৃত (${toBanglaNum(transaction.amount)} টাকা) হিসাবটি চিরতরে মুছে ফেলতে চান? এটি আর পুনরায় আসবে না।`
      : `আপনি কি নিশ্চিত যে এই ${type === 'income' ? 'আয়' : 'ব্যয়'} হিসাবটি মুছে ফেলতে চান?`;

    if (!window.confirm(confirmText)) return;

    setIsDeleting(true);
    try {
      await onDelete(transaction.id);
      onClose();
    } catch (err) {
      console.error('Failed to delete transaction:', err);
      setErrorMessage('মুছে ফেলতে সমস্যা হয়েছে।');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white w-full max-w-xl rounded-2xl sm:rounded-3xl shadow-2xl border border-slate-200 overflow-hidden my-6 transition-all transform scale-100"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white px-5 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/10 rounded-xl">
              <Layers className="h-5 w-5 text-emerald-200" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base sm:text-lg font-black tracking-tight">
                  লেনদেন সম্পাদনা ও সংশোধন
                </h3>
                {isAuto ? (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-200 text-purple-900 flex items-center gap-1 shadow-2xs">
                    <Sparkles className="h-3 w-3" />
                    <span>অটো আপলোডকৃত</span>
                  </span>
                ) : (
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-200 text-emerald-900 shadow-2xs">
                    ম্যানুয়াল এন্ট্রি
                  </span>
                )}
              </div>
              <p className="text-xs text-emerald-100">
                ভাউচার আইডি: <span className="font-mono">{transaction.id}</span>
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-emerald-200 hover:text-white hover:bg-white/10 transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4 text-xs sm:text-sm">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-red-700 font-bold flex items-center gap-2 text-xs">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Type Selector (Income vs Expense) */}
          <div>
            <label className="block text-slate-700 font-bold mb-1.5 text-xs">
              লেনদেনের ধরন (Transaction Type) *
            </label>
            <div className="grid grid-cols-2 gap-3 p-1 bg-slate-100 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => handleTypeChange('income')}
                className={`py-2 rounded-lg font-black text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'income'
                    ? 'bg-[#0f766e] text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingUp className="h-4 w-4" />
                <span>আয় (Income)</span>
              </button>
              <button
                type="button"
                onClick={() => handleTypeChange('expense')}
                className={`py-2 rounded-lg font-black text-center transition flex items-center justify-center gap-1.5 cursor-pointer ${
                  type === 'expense'
                    ? 'bg-red-600 text-white shadow-sm'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <TrendingDown className="h-4 w-4" />
                <span>ব্যয় (Expense)</span>
              </button>
            </div>
          </div>

          {/* Amount, Year & Date */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                টাকার পরিমাণ (৳) *
              </label>
              <div className="relative">
                <span className="absolute left-3 top-2 font-black text-slate-500">৳</span>
                <input
                  type="text"
                  inputMode="numeric"
                  required
                  value={amount}
                  onChange={(e) => setAmount(cleanNumericInput(e.target.value))}
                  className="w-full pl-8 pr-3 py-2 bg-white border border-slate-300 rounded-xl text-sm font-black text-slate-900 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e]"
                  placeholder="টাকা..."
                />
              </div>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                হিসাবের বছর *
              </label>
              <select
                value={year}
                onChange={(e) => setYear(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-bold text-slate-800 focus:outline-none focus:border-[#0f766e]"
              >
                <option value={2026}>২০২৬ খ্রি.</option>
                <option value={2025}>২০২৫ খ্রি.</option>
                <option value={2024}>২০২৪ খ্রি.</option>
                <option value={2023}>২০২৩ খ্রি.</option>
                <option value={2022}>২০২২ খ্রি.</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                ভাউচার তারিখ *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0f766e]"
              />
            </div>
          </div>

          {/* Category Dropdown */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              হিসাবের খাত (Category) *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:border-[#0f766e]"
              >
                {currentCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
                <option value="custom" className="text-[#0f766e] font-bold">
                  + অন্য খাত লিখুন...
                </option>
              </select>

              {category === 'custom' && (
                <input
                  type="text"
                  required
                  placeholder="খাতের নাম লিখুন..."
                  value={customCategory}
                  onChange={(e) => setCustomCategory(e.target.value)}
                  className="w-full px-3 py-2 bg-white border-2 border-amber-300 rounded-xl text-xs sm:text-sm text-slate-900 placeholder-slate-400 focus:outline-none focus:border-amber-500"
                />
              )}
            </div>
          </div>

          {/* Donor / Description field */}
          <div>
            <label className="block text-slate-700 font-bold mb-1 text-xs">
              {type === 'income' ? 'দাতার নাম / প্রাপ্তির উৎস *' : 'খরচের বিবরণ / কার্যাদেশ *'}
            </label>
            {type === 'income' ? (
              <input
                type="text"
                required
                placeholder="দাতার নাম লিখুন..."
                value={donorName}
                onChange={(e) => setDonorName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e]"
              />
            ) : (
              <textarea
                rows={2}
                required
                placeholder="খরচের বিস্তারিত বিবরণ..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e]"
              />
            )}
          </div>

          {/* Optional extra description for Income */}
          {type === 'income' && (
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                অতিরিক্ত বিবরণ / মন্তব্য (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="মন্তব্য..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e]"
              />
            </div>
          )}

          {/* Receipt No & Recorded By */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                রশিদ / ভাউচার রেফারেন্স (ঐচ্ছিক)
              </label>
              <input
                type="text"
                placeholder="উদা: V-101 বা রশিদ ০২"
                value={receiptNo}
                onChange={(e) => setReceiptNo(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e]"
              />
            </div>

            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                এন্ট্রি কারী কর্মকর্তা
              </label>
              <input
                type="text"
                required
                placeholder="নাম..."
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm text-slate-800 focus:outline-none focus:border-[#0f766e]"
              />
            </div>
          </div>

          {/* Optional House assignment if relevant */}
          {availableHouses && availableHouses.length > 0 && (
            <div>
              <label className="block text-slate-700 font-bold mb-1 text-xs">
                বাড়ি নির্ধারণ (ঐচ্ছিক - সাধারণ হিসাবের জন্য খালি রাখুন)
              </label>
              <select
                value={houseName}
                onChange={(e) => setHouseName(e.target.value)}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:border-[#0f766e]"
              >
                <option value="">-- সাধারণ হিসাব (কোনো নির্দিষ্ট বাড়ি নেই) --</option>
                {availableHouses.map((h) => (
                  <option key={h} value={h}>
                    🏠 {h}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Actions Footer */}
          <div className="pt-4 border-t border-slate-200 flex flex-col-reverse sm:flex-row items-center justify-between gap-3">
            {onDelete ? (
              <button
                type="button"
                disabled={isDeleting || isSaving}
                onClick={handleDelete}
                className="w-full sm:w-auto px-4 py-2.5 bg-red-50 hover:bg-red-600 text-red-700 hover:text-white rounded-xl text-xs sm:text-sm font-bold transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Trash2 className="h-4 w-4" />
                <span>{isDeleting ? 'মুছে ফেলা হচ্ছে...' : 'এই লেনদেনটি মুছুন'}</span>
              </button>
            ) : (
              <div />
            )}

            <div className="w-full sm:w-auto flex items-center justify-end gap-2">
              <button
                type="button"
                disabled={isSaving || isDeleting}
                onClick={onClose}
                className="w-1/2 sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs sm:text-sm font-bold transition cursor-pointer"
              >
                বাতিল
              </button>
              <button
                type="submit"
                disabled={isSaving || isDeleting}
                className="w-1/2 sm:w-auto px-6 py-2.5 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs sm:text-sm font-black shadow-md hover:shadow-lg transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
              >
                <Save className="h-4 w-4" />
                <span>{isSaving ? 'সংরক্ষণ হচ্ছে...' : 'পরিবর্তন সংরক্ষণ'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
