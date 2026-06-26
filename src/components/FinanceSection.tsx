import React from 'react';
import { Transaction } from '../types';
import { TrendingUp, TrendingDown, DollarSign, Calendar, Search, Filter, Printer, FileText, Download, X, Eye } from 'lucide-react';

interface FinanceSectionProps {
  transactions: Transaction[];
}

export default function FinanceSection({ transactions }: FinanceSectionProps) {
  const [filterType, setFilterType] = React.useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [selectedCategory, setSelectedCategory] = React.useState<string>('all');
  const [selectedTransaction, setSelectedTransaction] = React.useState<Transaction | null>(null);
  const [showReportModal, setShowReportModal] = React.useState(false);
  const [selectedYear, setSelectedYear] = React.useState<string>('2026');

  // Translate English digits to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Convert Gregorian date (YYYY-MM-DD) to Bengali formatted date (e.g., ১৫ই জুন, ২০২৬)
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

  // Helper to extract year from a transaction
  const getTransactionYear = (t: Transaction): number => {
    if (t.year) return t.year;
    if (t.date) {
      const y = parseInt(t.date.split('-')[0], 10);
      if (!isNaN(y)) return y;
    }
    return 2026; // fallback
  };

  // Filter transactions by selected year first
  const yearFilteredTransactions = transactions.filter((t) => {
    if (selectedYear === 'all') return true;
    return getTransactionYear(t).toString() === selectedYear;
  });

  // Financial calculations based on year-filtered transactions
  const totalIncome = yearFilteredTransactions
    .filter((t) => t.type === 'income')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = yearFilteredTransactions
    .filter((t) => t.type === 'expense')
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Categories list for filter dropdown based on year filtered transactions
  const uniqueCategories = Array.from(new Set(yearFilteredTransactions.map((t) => t.category)));

  // Filter and search transactions based on year-filtered transactions
  const filteredTransactions = yearFilteredTransactions.filter((t) => {
    const matchesType = filterType === 'all' || t.type === filterType;
    const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
    const matchesSearch =
      t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.donorName && t.donorName.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.receiptNo && t.receiptNo.includes(searchQuery));

    return matchesType && matchesCategory && matchesSearch;
  });

  // Export to CSV function
  const exportToCSV = () => {
    const headers = ['তারিখ,ধরন,খাত,দাতার নাম/বিবরণ,রশিদ নং,টাকা,এন্ট্রি কারী\n'];
    const rows = transactions.map((t) => {
      const typeLabel = t.type === 'income' ? 'আয়' : 'ব্যয়';
      const details = t.type === 'income' ? (t.donorName || '') : (t.description || '');
      return `"${t.date}","${typeLabel}","${t.category}","${details.replace(/"/g, '""')}","${t.receiptNo || ''}",${t.amount},"${t.recordedBy}"\n`;
    });

    const blob = new Blob(['\uFEFF' + headers.concat(rows).join('')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mahfil_Finance_Report_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Printable Report Layout trigger
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div id="finance-section" className="space-y-10 pb-16 animate-fade-in print:p-0 text-[#3c3c3c]">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2 print:hidden">
        <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#5d6d3e] uppercase bg-[#5d6d3e]/10 px-3 py-1 rounded-full border border-[#d4cfc0]">
          আয়-ব্যয় হিসাব (রিয়েল-টাইম লেজার)
        </span>
        <h2 className="text-3xl font-extrabold text-[#2d3a1d] tracking-tight">
          তহবিল বিবরণী ও রিপোর্ট কেন্দ্র
        </h2>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#bfa46f] to-transparent mx-auto mt-3"></div>
        <p className="text-[#3c3c3c]/80 text-xs sm:text-sm leading-relaxed font-light pt-2">
          সোনারগাঁও পবিত্র মিলাদুন্নবী (দঃ) উদযাপন পরিষদের স্বচ্ছ হিসাব ও বিস্তারিত আয়-ব্যয় রিপোর্ট সাধারণ মানুষের পরিদর্শনের জন্য উন্মুক্ত।
        </p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Total Income */}
        <div className="bg-[#f5f2eb] border border-[#d4cfc0] rounded-2xl p-6 shadow-sm relative overflow-hidden flex items-center justify-between group">
          <div className="space-y-2">
            <span className="text-[#5d6d3e] text-xs sm:text-sm font-semibold tracking-wide">সর্বমোট আয় (মোট সংগ্রহ)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2d3a1d] flex items-center">
              <span className="text-[#bfa46f] mr-1">৳</span>
              <span>{toBanglaNum(totalIncome.toLocaleString('bn-BD'))}</span>
            </div>
            <div className="text-[10px] text-[#3c3c3c]/60 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-[#5d6d3e] rounded-full"></span>
              <span>সকল সদস্য ও প্রবাসী অনুদান সহ</span>
            </div>
          </div>
          <div className="h-12 w-12 bg-white border border-[#d4cfc0] rounded-xl flex items-center justify-center text-[#5d6d3e] group-hover:scale-110 transition duration-300">
            <TrendingUp className="h-6 w-6" />
          </div>
        </div>

        {/* Total Expenses */}
        <div className="bg-[#f5f2eb] border-l-4 border-l-red-600 border border-[#d4cfc0] rounded-2xl p-6 shadow-sm relative overflow-hidden flex items-center justify-between group">
          <div className="space-y-2">
            <span className="text-red-700 text-xs sm:text-sm font-semibold tracking-wide">সর্বমোট ব্যয় (মোট খরচ)</span>
            <div className="text-2xl sm:text-3xl font-extrabold text-[#2d3a1d] flex items-center">
              <span className="text-[#bfa46f] mr-1">৳</span>
              <span>{toBanglaNum(totalExpense.toLocaleString('bn-BD'))}</span>
            </div>
            <div className="text-[10px] text-[#3c3c3c]/60 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-red-600 rounded-full"></span>
              <span>মঞ্চ, প্রচার ও অতিথি আপ্যায়ন সহ</span>
            </div>
          </div>
          <div className="h-12 w-12 bg-white border border-[#d4cfc0] rounded-xl flex items-center justify-center text-red-600 group-hover:scale-110 transition duration-300">
            <TrendingDown className="h-6 w-6" />
          </div>
        </div>

        {/* Net Balance */}
        <div className="bg-[#2d3a1d] text-[#fdfcf7] border-2 border-[#bfa46f] rounded-2xl p-6 shadow-md relative overflow-hidden flex items-center justify-between group sm:col-span-1">
          <div className="absolute top-0 right-0 w-16 h-16 bg-white/5 rounded-full blur-xl"></div>
          <div className="space-y-2">
            <span className="text-[#bfa46f] text-xs sm:text-sm font-bold tracking-wide">বর্তমান তহবিল (অবশিষ্টাংশ)</span>
            <div className={`text-2xl sm:text-3xl font-extrabold flex items-center ${balance >= 0 ? 'text-[#fdfcf7]' : 'text-red-300'}`}>
              <span className="text-[#bfa46f] mr-1">৳</span>
              <span>{toBanglaNum(balance.toLocaleString('bn-BD'))}</span>
            </div>
            <div className="text-[10px] text-[#fdfcf7]/80 flex items-center space-x-1">
              <span className="h-1.5 w-1.5 bg-[#bfa46f] rounded-full animate-pulse"></span>
              <span>আমানতকৃত নগদ টাকা</span>
            </div>
          </div>
          <div className="h-12 w-12 bg-white/10 border border-white/20 rounded-xl flex items-center justify-center text-[#bfa46f] group-hover:scale-110 transition duration-300">
            <DollarSign className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* Custom High-Quality SVG Visualizer/Charts */}
      <section className="bg-white/50 border border-[#d4cfc0] rounded-2xl p-6 print:hidden shadow-sm">
        <h3 className="text-lg font-bold text-[#2d3a1d] mb-6 flex items-center space-x-2">
          <FileText className="h-5 w-5 text-[#5d6d3e]" />
          <span>তহবিল प्रवाह ও বাজেট বন্টন গ্রাফ</span>
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
          {/* Visual 1: Budget Health Bar */}
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-xs text-[#5d6d3e] font-semibold mb-2">
                <span>তহবিল বন্টন স্বাস্থ্য (ব্যয় বনাম মোট সংগ্রহ)</span>
                <span>{toBanglaNum(totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0)}% ব্যবহৃত</span>
              </div>
              <div className="h-5 bg-[#f5f2eb] rounded-full overflow-hidden border border-[#d4cfc0] p-0.5 shadow-inner">
                <div
                  className="h-full bg-gradient-to-r from-[#5d6d3e] to-[#bfa46f] rounded-full transition-all duration-1000"
                  style={{ width: `${Math.min(totalIncome > 0 ? (totalExpense / totalIncome) * 100 : 0, 100)}%` }}
                ></div>
              </div>
              <div className="flex justify-between text-[10px] text-[#3c3c3c]/80 mt-2 font-medium">
                <span>মোট সংগ্রহ: ৳{toBanglaNum(totalIncome.toLocaleString('bn-BD'))}</span>
                <span>অবশিষ্ট তহবিল: ৳{toBanglaNum(balance.toLocaleString('bn-BD'))}</span>
              </div>
            </div>

            {/* Income and Expense Comparison Columns */}
            <div className="bg-[#f5f2eb] border border-[#d4cfc0] rounded-xl p-4 space-y-4">
              <h4 className="text-xs text-[#2d3a1d] font-bold tracking-wide">তহবিলের তুলনাচিত্র</h4>
              <div className="flex items-end h-32 justify-around pt-2">
                {/* Income bar */}
                <div className="flex flex-col items-center space-y-2 w-1/3">
                  <span className="text-[10px] text-[#5d6d3e] font-bold font-mono">৳{toBanglaNum(totalIncome)}</span>
                  <div 
                    className="w-12 bg-gradient-to-t from-[#2d3a1d] to-[#5d6d3e] rounded-t-lg transition-all duration-1000 shadow-sm"
                    style={{ height: `${totalIncome > 0 ? 100 : 5}px` }}
                  ></div>
                  <span className="text-xs font-semibold text-[#2d3a1d]">সংগৃহীত আয়</span>
                </div>

                {/* Expense bar */}
                <div className="flex flex-col items-center space-y-2 w-1/3">
                  <span className="text-[10px] text-red-700 font-bold font-mono">৳{toBanglaNum(totalExpense)}</span>
                  <div 
                    className="w-12 bg-gradient-to-t from-red-800 to-red-500 rounded-t-lg transition-all duration-1000 shadow-sm"
                    style={{ height: `${totalIncome > 0 ? (totalExpense / totalIncome) * 100 : (totalExpense > 0 ? 100 : 5)}px` }}
                  ></div>
                  <span className="text-xs font-semibold text-[#2d3a1d]">মোট ব্যয়</span>
                </div>
              </div>
            </div>
          </div>

          {/* Visual 2: Quick Information Panel */}
          <div className="bg-[#f5f2eb] border border-[#d4cfc0] rounded-2xl p-5 space-y-4">
            <h4 className="text-sm font-bold text-[#2d3a1d]">অর্থনৈতিক প্রতিবেদন সারসংক্ষেপ</h4>
            <p className="text-[#3c3c3c]/80 text-xs leading-relaxed font-light">
              পবিত্র মিলাদুন্নবী (দঃ) উদযাপন পরিষদের যাবতীয় সংগৃহীত অর্থ ও ব্যায়িত অর্থের হিসাব নিচে সারিবদ্ধ খাত অনুসারে উপস্থাপিত। প্রবাসী অনুদান বর্তমান বাজেটের একটি বড় অংশ যোগান দিয়েছে।
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs pt-2">
              <div className="p-3 bg-white rounded-xl border border-[#d4cfc0] shadow-sm">
                <span className="text-[#5d6d3e] font-semibold block mb-1">মোট লেনদেন সংখ্যা</span>
                <span className="text-lg font-bold text-[#2d3a1d] font-mono">{toBanglaNum(transactions.length)} টি</span>
              </div>
              <div className="p-3 bg-white rounded-xl border border-[#d4cfc0] shadow-sm">
                <span className="text-[#bfa46f] font-semibold block mb-1">সর্বশেষ আপডেট</span>
                <span className="text-xs font-bold text-[#2d3a1d]">আজকে, {toBanglaDate(new Date().toISOString().slice(0, 10))}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Main Ledger Table Panel */}
      <section className="bg-white border border-[#d4cfc0] rounded-2xl shadow-sm overflow-hidden print:border-none print:bg-transparent">
        {/* Table Controls (Hidden on Print) */}
        <div className="p-4 sm:p-6 bg-[#f5f2eb] border-b border-[#d4cfc0] space-y-4 print:hidden">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <h3 className="text-lg font-bold text-[#2d3a1d]">আয়-ব্যয় খতিয়ান (Ledger Book)</h3>
            <div className="flex flex-wrap gap-2 w-full sm:w-auto">
              <button
                id="export-csv-btn"
                onClick={exportToCSV}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-white hover:bg-[#fdfcf7] border border-[#d4cfc0] hover:border-[#bfa46f] text-[#5d6d3e] rounded-lg text-xs font-semibold transition cursor-pointer shadow-sm"
              >
                <Download className="h-4 w-4" />
                <span>CSV এক্সপোর্ট</span>
              </button>
              <button
                id="generate-report-btn"
                onClick={() => setShowReportModal(true)}
                className="flex items-center space-x-1.5 px-3.5 py-2 bg-[#5d6d3e] hover:bg-[#43522f] text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-sm"
              >
                <FileText className="h-4 w-4" />
                <span>রিপোর্ট প্রিন্ট করুন</span>
              </button>
            </div>
          </div>

          {/* Filters & Search */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 pt-2">
            {/* Search Bar */}
            <div className="sm:col-span-4 relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#5d6d3e]">
                <Search className="h-4 w-4" />
              </div>
              <input
                id="ledger-search"
                type="text"
                placeholder="রশিদ নং, দাতা বা খাত লিখে খুঁজুন..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="block w-full pl-9 pr-3 py-2 bg-white border border-[#d4cfc0] rounded-xl text-xs text-[#3c3c3c] placeholder-[#8a817c] focus:outline-none focus:border-[#bfa46f] focus:ring-1 focus:ring-[#bfa46f] transition"
              />
            </div>

            {/* Type Filter Buttons */}
            <div className="sm:col-span-3 flex rounded-xl bg-[#f5f2eb] border border-[#d4cfc0] p-0.5">
              <button
                id="filter-all"
                onClick={() => setFilterType('all')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === 'all'
                    ? 'bg-[#5d6d3e] text-white font-bold'
                    : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
                }`}
              >
                সকল
              </button>
              <button
                id="filter-income"
                onClick={() => setFilterType('income')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === 'income'
                    ? 'bg-[#2d3a1d] text-white font-bold'
                    : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
                }`}
              >
                আয়
              </button>
              <button
                id="filter-expense"
                onClick={() => setFilterType('expense')}
                className={`flex-1 text-center py-1.5 rounded-lg text-xs font-semibold transition ${
                  filterType === 'expense'
                    ? 'bg-red-600 text-white font-bold'
                    : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
                }`}
              >
                ব্যয়
              </button>
            </div>

            {/* Category Filter */}
            <div className="sm:col-span-3">
              <select
                id="category-filter"
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-xl text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] transition cursor-pointer"
              >
                <option value="all">সকল খাত (All)</option>
                {uniqueCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            {/* Year Filter */}
            <div className="sm:col-span-2">
              <select
                id="year-filter"
                value={selectedYear}
                onChange={(e) => {
                  setSelectedYear(e.target.value);
                  setSelectedCategory('all'); // reset category filter as list of categories changes
                }}
                className="block w-full px-3 py-2 bg-white border border-[#d4cfc0] rounded-xl text-xs text-[#3c3c3c] focus:outline-none focus:border-[#bfa46f] focus:ring-1 focus:ring-[#bfa46f] transition cursor-pointer"
              >
                <option value="all">সকল বছর</option>
                <option value="2026">২০২৬ খ্রি.</option>
                <option value="2025">২০২৫ খ্রি.</option>
                <option value="2024">২০২৪ খ্রি.</option>
              </select>
            </div>
          </div>
        </div>

        {/* Transaction Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-[#d4cfc0] text-xs sm:text-sm">
            <thead className="bg-[#f5f2eb]">
              <tr>
                <th scope="col" className="px-4 py-3 text-left font-bold text-[#2d3a1d] tracking-wider">তারিখ</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-[#2d3a1d] tracking-wider">রশিদ/ভাউচার</th>
                <th scope="col" className="px-4 py-3 text-left font-bold text-[#2d3a1d] tracking-wider">খাত (Category)</th>
                <th scope="col" className="px-4 py-3 text-left font-bold text-[#2d3a1d] tracking-wider">দাতার নাম / বিবরণ</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-[#2d3a1d] tracking-wider">ধরন</th>
                <th scope="col" className="px-4 py-3 text-right font-bold text-[#2d3a1d] tracking-wider">টাকা (টাকা)</th>
                <th scope="col" className="px-4 py-3 text-center font-bold text-[#2d3a1d] tracking-wider print:hidden">রশিদ</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#ece8de] bg-white">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((t) => (
                  <tr
                    id={`transaction-row-${t.id}`}
                    key={t.id}
                    className="hover:bg-[#f5f2eb]/50 transition cursor-pointer"
                    onClick={() => setSelectedTransaction(t)}
                  >
                    <td className="px-4 py-3.5 whitespace-nowrap text-[#3c3c3c]">{toBanglaDate(t.date)}</td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-center font-mono text-[#5d6d3e]">
                      {t.receiptNo ? toBanglaNum(t.receiptNo) : '—'}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap">
                      <span className="font-bold text-[#2d3a1d]">{t.category}</span>
                    </td>
                    <td className="px-4 py-3.5 max-w-xs truncate text-[#3c3c3c] font-light">
                      {t.type === 'income' ? t.donorName : t.description}
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          t.type === 'income'
                            ? 'bg-[#5d6d3e]/10 text-[#5d6d3e] border border-[#5d6d3e]/20'
                            : 'bg-red-500/10 text-red-700 border border-red-500/20'
                        }`}
                      >
                        {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                      </span>
                    </td>
                    <td className={`px-4 py-3.5 whitespace-nowrap text-right font-bold font-mono ${t.type === 'income' ? 'text-[#5d6d3e]' : 'text-red-700'}`}>
                      {t.type === 'income' ? '+' : '-'} {toBanglaNum(t.amount.toLocaleString('bn-BD'))} ৳
                    </td>
                    <td className="px-4 py-3.5 whitespace-nowrap text-center print:hidden" onClick={(e) => e.stopPropagation()}>
                      <button
                        id={`view-receipt-btn-${t.id}`}
                        onClick={() => setSelectedTransaction(t)}
                        className="p-1 hover:bg-[#f5f2eb] rounded text-[#5d6d3e] hover:text-[#2d3a1d] transition"
                        title="রশিদ দেখুন"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-[#8a817c] text-xs sm:text-sm">
                    কোন হিসাব পাওয়া যায়নি।
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Table Footer */}
        <div className="p-4 bg-[#f5f2eb] text-right text-xs sm:text-sm font-bold border-t border-[#d4cfc0] text-[#5d6d3e] flex justify-between items-center">
          <span>মোট প্রদর্শিত লেনদেন: {toBanglaNum(filteredTransactions.length)} টি</span>
          <span className="text-[#2d3a1d] text-sm">
            চলতি ব্যালেন্স: <span className={balance >= 0 ? 'text-[#5d6d3e]' : 'text-red-700'}>৳ {toBanglaNum(balance.toLocaleString('bn-BD'))}</span>
          </span>
        </div>
      </section>

      {/* MODAL 1: Receipt Voucher Modal */}
      {selectedTransaction && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white border-2 border-[#bfa46f] rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl animate-scale-in">
            {/* Close Button */}
            <button
              id="close-receipt-modal"
              onClick={() => setSelectedTransaction(null)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f5f2eb] hover:bg-[#ece8de] text-[#5d6d3e] hover:text-[#2d3a1d] transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Receipt Content for print/display */}
            <div id="receipt-print-area" className="space-y-6 pt-2">
              <div className="text-center pb-4 border-b border-[#d4cfc0] space-y-1">
                <span className="text-[10px] tracking-widest text-[#bfa46f] uppercase font-bold">রসিদ ভাউচার (Receipt Voucher)</span>
                <h4 className="text-lg font-extrabold text-[#2d3a1d]">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h4>
                <p className="text-xs text-[#5d6d3e] font-semibold">সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম</p>
              </div>

              {/* Grid detail entries */}
              <div className="grid grid-cols-2 gap-4 text-xs sm:text-sm pt-2">
                <div>
                  <span className="text-[#5d6d3e] block text-[10px] uppercase font-bold">ভাউচার নম্বর</span>
                  <span className="text-[#2d3a1d] font-bold font-mono">
                    {selectedTransaction.receiptNo ? toBanglaNum(selectedTransaction.receiptNo) : '—'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#5d6d3e] block text-[10px] uppercase font-bold">তারিখ</span>
                  <span className="text-[#2d3a1d] font-semibold">{toBanglaDate(selectedTransaction.date)}</span>
                </div>

                <div>
                  <span className="text-[#5d6d3e] block text-[10px] uppercase font-bold">হিসাবের ধরন</span>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold mt-1 ${
                    selectedTransaction.type === 'income' ? 'bg-[#5d6d3e]/10 text-[#5d6d3e]' : 'bg-red-500/10 text-red-700'
                  }`}>
                    {selectedTransaction.type === 'income' ? 'আয় (সংগ্রহ)' : 'ব্যয় (খরচ)'}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[#5d6d3e] block text-[10px] uppercase font-bold">খাত (Category)</span>
                  <span className="text-[#2d3a1d] font-bold">{selectedTransaction.category}</span>
                </div>

                <div className="col-span-2 pt-2 border-t border-[#ece8de]">
                  <span className="text-[#5d6d3e] block text-[10px] uppercase font-bold">
                    {selectedTransaction.type === 'income' ? 'দাতার নাম / উৎস' : 'ব্যয়ের বিবরণ'}
                  </span>
                  <span className="text-[#2d3a1d] font-medium block mt-1 bg-[#f5f2eb] p-2.5 rounded-lg border border-[#d4cfc0] text-sm">
                    {selectedTransaction.type === 'income' ? (selectedTransaction.donorName || '—') : selectedTransaction.description}
                  </span>
                </div>

                {selectedTransaction.type === 'income' && selectedTransaction.description && (
                  <div className="col-span-2">
                    <span className="text-[#5d6d3e] block text-[10px] uppercase font-bold">অতিরিক্ত মন্তব্য</span>
                    <span className="text-[#3c3c3c] text-xs block mt-1 italic">{selectedTransaction.description}</span>
                  </div>
                )}

                <div className="col-span-2 pt-4 pb-2 border-t border-dashed border-[#d4cfc0]">
                  <div className="flex justify-between items-center bg-[#f5f2eb] border border-[#bfa46f] p-3 rounded-xl">
                    <span className="text-[#5d6d3e] font-bold text-xs sm:text-sm">টাকার পরিমাণ (Amount):</span>
                    <span className="text-lg font-black text-[#2d3a1d] font-mono">৳ {toBanglaNum(selectedTransaction.amount.toLocaleString('bn-BD'))} /=</span>
                  </div>
                </div>

                <div className="col-span-2 pt-2 text-[10px] text-[#5d6d3e] flex justify-between">
                  <span>হিসাব রক্ষক: {selectedTransaction.recordedBy}</span>
                  <span>স্বাক্ষরিত ডিজিটাল কপি</span>
                </div>
              </div>

              {/* Print Receipt Trigger Button */}
              <div className="flex space-x-3 pt-6 border-t border-[#d4cfc0]">
                <button
                  id="print-receipt-action-btn"
                  onClick={() => window.print()}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-xl text-xs transition cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>রসিদ প্রিন্ট করুন</span>
                </button>
                <button
                  id="close-receipt-bottom"
                  onClick={() => setSelectedTransaction(null)}
                  className="flex-1 py-2.5 bg-[#f5f2eb] hover:bg-[#ece8de] text-[#3c3c3c] rounded-xl text-xs font-bold transition cursor-pointer border border-[#d4cfc0]"
                >
                  বন্ধ করুন
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Full Summary Print Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="relative bg-white border-2 border-[#bfa46f] rounded-2xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl animate-scale-in max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              id="close-report-modal"
              onClick={() => setShowReportModal(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-[#f5f2eb] hover:bg-[#ece8de] text-[#5d6d3e] hover:text-[#2d3a1d] transition"
            >
              <X className="h-5 w-5" />
            </button>

            {/* Formal Report Layout */}
            <div id="full-report-print-area" className="space-y-6 text-[#3c3c3c]">
              <div className="text-center pb-6 border-b border-[#d4cfc0] space-y-2">
                <h3 className="text-2xl font-black text-[#2d3a1d]">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h3>
                <p className="text-sm text-[#5d6d3e] font-bold">সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম।</p>
                <div className="inline-block px-4 py-1.5 bg-[#f5f2eb] border border-[#bfa46f] text-[#2d3a1d] rounded-full text-xs font-bold mt-1">
                  {selectedYear === 'all' ? 'সর্বকালীন' : toBanglaNum(selectedYear) + ' সালের'} পূর্ণাঙ্গ আর্থিক আয়-ব্যয় বিবরণী রিপোর্ট
                </div>
              </div>

              {/* Financial Quick Statistics */}
              <div className="grid grid-cols-3 gap-4 text-center">
                <div className="bg-[#f5f2eb] border border-[#d4cfc0] p-3 rounded-xl">
                  <span className="text-[10px] text-[#5d6d3e] block font-bold">সর্বমোট সংগৃহীত ফান্ড</span>
                  <span className="text-base sm:text-lg font-black text-[#2d3a1d] font-mono">৳ {toBanglaNum(totalIncome.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="bg-[#f5f2eb] border border-[#d4cfc0] p-3 rounded-xl">
                  <span className="text-[10px] text-red-700 block font-bold">সর্বমোট ব্যয়িত ফান্ড</span>
                  <span className="text-base sm:text-lg font-black text-red-700 font-mono">৳ {toBanglaNum(totalExpense.toLocaleString('bn-BD'))}</span>
                </div>
                <div className="bg-[#f5f2eb] border border-[#d4cfc0] p-3 rounded-xl">
                  <span className="text-[10px] text-[#2d3a1d] block font-bold">চলতি স্থিতি (অবশিষ্ট)</span>
                  <span className="text-base sm:text-lg font-black text-[#5d6d3e] font-mono">৳ {toBanglaNum(balance.toLocaleString('bn-BD'))}</span>
                </div>
              </div>

              {/* Category Breakdown list inside report */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-[#d4cfc0]">
                {/* Income Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-[#2d3a1d] border-b border-[#d4cfc0] pb-1 flex items-center justify-between">
                    <span>১. আয়ের খাত সমূহ</span>
                    <span className="text-xs font-bold">৳ {toBanglaNum(totalIncome.toLocaleString('bn-BD'))}</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {Array.from(new Set(yearFilteredTransactions.filter(t => t.type === 'income').map(t => t.category))).map(cat => {
                      const catTotal = yearFilteredTransactions.filter(t => t.type === 'income' && t.category === cat).reduce((sum, t) => sum + t.amount, 0);
                      return (
                        <div key={cat} className="flex justify-between items-center bg-[#f5f2eb] p-2 rounded border border-[#d4cfc0]">
                          <span className="text-[#3c3c3c] font-medium">{cat}</span>
                          <span className="font-bold font-mono text-[#5d6d3e]">৳ {toBanglaNum(catTotal.toLocaleString('bn-BD'))}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Expense Breakdown */}
                <div className="space-y-3">
                  <h4 className="text-sm font-bold text-red-700 border-b border-[#d4cfc0] pb-1 flex items-center justify-between">
                    <span>২. ব্যয়ের খাত সমূহ</span>
                    <span className="text-xs font-bold">৳ {toBanglaNum(totalExpense.toLocaleString('bn-BD'))}</span>
                  </h4>
                  <div className="space-y-2 text-xs">
                    {Array.from(new Set(yearFilteredTransactions.filter(t => t.type === 'expense').map(t => t.category))).map(cat => {
                      const catTotal = yearFilteredTransactions.filter(t => t.type === 'expense' && t.category === cat).reduce((sum, t) => sum + t.amount, 0);
                      return (
                        <div key={cat} className="flex justify-between items-center bg-[#f5f2eb] p-2 rounded border border-[#d4cfc0]">
                          <span className="text-[#3c3c3c] font-medium">{cat}</span>
                          <span className="font-bold font-mono text-red-700">৳ {toBanglaNum(catTotal.toLocaleString('bn-BD'))}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Signatures row at the bottom of the formal report */}
              <div className="grid grid-cols-3 gap-4 pt-16 text-center text-xs text-[#5d6d3e] border-t border-[#d4cfc0]">
                <div className="space-y-2">
                  <div className="h-0.5 bg-[#d4cfc0] w-3/4 mx-auto"></div>
                  <p className="font-bold text-[#2d3a1d]">মো: তারেক জামাল</p>
                  <p className="text-[10px]">অর্থ সম্পাদক</p>
                </div>
                <div className="space-y-2">
                  <div className="h-0.5 bg-[#d4cfc0] w-3/4 mx-auto"></div>
                  <p className="font-bold text-[#2d3a1d]">মোঃ লোকমান বৈদ্য</p>
                  <p className="text-[10px]">সাধারণ সম্পাদক</p>
                </div>
                <div className="space-y-2">
                  <div className="h-0.5 bg-[#d4cfc0] w-3/4 mx-auto"></div>
                  <p className="font-bold text-[#2d3a1d]">মাস্টার মো: আবদুস সত্তার</p>
                  <p className="text-[10px]">সভাপতি</p>
                </div>
              </div>
            </div>

            {/* Print trigger button inside Report Modal */}
            <div className="flex space-x-3 pt-6 border-t border-[#d4cfc0] mt-6 print:hidden">
              <button
                id="execute-print-full-report"
                onClick={handlePrintReport}
                className="flex-1 flex items-center justify-center space-x-2 py-3 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-xl text-sm transition cursor-pointer"
              >
                <Printer className="h-5 w-5" />
                <span>রিপোর্ট প্রিন্ট করুন (Print Report)</span>
              </button>
              <button
                id="close-report-bottom"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 bg-[#f5f2eb] hover:bg-[#ece8de] text-[#3c3c3c] rounded-xl text-sm font-semibold transition cursor-pointer border border-[#d4cfc0]"
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
