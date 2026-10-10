import React from 'react';
import { Transaction } from '../types';
import { X, Download, FileText, Calendar, BookOpen, BarChart3, CheckCircle2, Sparkles, RefreshCw, Printer, FileSpreadsheet, Coins } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { renderSafeCanvas, exportElementToPdf } from '../utils/html2canvasSafe';
import AnnualLedgerReport from './AnnualLedgerReport';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { isHouseCollection } from '../lib/transactionUtils';

// Helper for Bangla numbers
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
};

interface ReportPdfExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onNavigateToTab?: (tab: 'statement' | 'annual' | 'monthly' | 'day-note') => void;
  initialYear?: string;
  initialReportType?: 'statement' | 'monthly' | 'annual' | 'transactions' | 'day-note';
}

export default function ReportPdfExportModal({
  isOpen,
  onClose,
  transactions,
  onNavigateToTab,
  initialYear,
  initialReportType,
}: ReportPdfExportModalProps) {
  const [selectedReportType, setSelectedReportType] = React.useState<'statement' | 'monthly' | 'annual' | 'transactions' | 'day-note'>(initialReportType || 'statement');
  const [selectedYear, setSelectedYear] = React.useState<string>(initialYear || 'all');
  const [selectedMonth, setSelectedMonth] = React.useState<string>('');
  const [isExporting, setIsExporting] = React.useState<boolean>(false);
  const [exportSuccessMsg, setExportSuccessMsg] = React.useState<string>('');

  React.useEffect(() => {
    if (isOpen) {
      if (initialYear !== undefined) {
        setSelectedYear(initialYear);
      }
      if (initialReportType !== undefined) {
        setSelectedReportType(initialReportType);
      }
    }
  }, [isOpen, initialYear, initialReportType]);

  // Extract available years
  const availableYears = React.useMemo(() => {
    const years = new Set<string>();
    transactions.forEach((t) => {
      if (t.year) years.add(t.year.toString());
      else if (t.date) {
        const y = t.date.split('-')[0];
        if (y) years.add(y);
      }
    });
    return Array.from(years).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  // Extract available months
  const availableMonths = React.useMemo(() => {
    const months = new Set<string>();
    transactions.forEach((t) => {
      if (t.date) {
        const parts = t.date.split('-');
        if (parts.length >= 2) months.add(`${parts[0]}-${parts[1]}`);
      }
    });
    return Array.from(months).sort((a, b) => b.localeCompare(a));
  }, [transactions]);

  React.useEffect(() => {
    if (availableMonths.length > 0 && !selectedMonth) {
      setSelectedMonth(availableMonths[0]);
    }
  }, [availableMonths, selectedMonth]);

  const formatBanglaMonthYear = (ymStr: string): string => {
    const parts = ymStr.split('-');
    if (parts.length < 2) return ymStr;
    const year = parts[0];
    const monthIdx = parseInt(parts[1]) - 1;
    const bengaliMonths = [
      'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
      'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
    ];
    return `${bengaliMonths[monthIdx] || ''} ${toBanglaNum(year)}`;
  };

  // Filtered transactions for selected year/month (excluding house collections from official general reports)
  const currentFilteredTransactions = React.useMemo(() => {
    const generalTransactions = transactions.filter(t => !isHouseCollection(t));
    if (selectedReportType === 'monthly' && selectedMonth) {
      const [y, m] = selectedMonth.split('-');
      return generalTransactions.filter(t => t.date && t.date.startsWith(`${y}-${m}`));
    }
    if (selectedYear === 'all') return generalTransactions;
    return generalTransactions.filter(t => (t.year && t.year.toString() === selectedYear) || (t.date && t.date.startsWith(selectedYear)));
  }, [transactions, selectedReportType, selectedYear, selectedMonth]);

  const totalIncome = React.useMemo(() => {
    return currentFilteredTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [currentFilteredTransactions]);

  const totalExpense = React.useMemo(() => {
    return currentFilteredTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  }, [currentFilteredTransactions]);

  const netSurplus = totalIncome - totalExpense;

  // Trigger PDF download based on report type
  const handleDownloadPDF = async () => {
    setIsExporting(true);
    setExportSuccessMsg('');

    try {
      if (selectedReportType === 'statement') {
        const reportElement = document.getElementById('mahfil-annual-ledger-sheet') || document.getElementById('modal-hidden-ledger-report');
        if (reportElement) {
          const yr = selectedYear === 'all' ? 'সকল-হিসাব-কাল' : `${selectedYear}-সন`;
          await exportElementToPdf(reportElement, {
            fileName: `বার্ষিক-আয়-ব্যয়-বিবরণী-${yr}.pdf`,
            format: 'a4',
            orientation: 'portrait',
            margin: 6,
            scale: 2.5
          });
          setExportSuccessMsg('বার্ষিক বিবরণী PDF সফলভাবে ডাউনলোড হয়েছে!');
        } else {
          window.print();
        }
      } else if (selectedReportType === 'monthly') {
        const printArea = document.getElementById('monthly-report-print-area') || document.getElementById('modal-hidden-monthly-report');
        if (printArea) {
          await exportElementToPdf(printArea, {
            fileName: `মাসিক-আয়-ব্যয়-রিপোর্ট-${selectedMonth || 'সাম্প্রতিক'}.pdf`,
            format: 'a4',
            orientation: 'portrait',
            margin: 6,
            scale: 2.5
          });
          setExportSuccessMsg('মাসিক অডিট রিপোর্ট PDF সফলভাবে ডাউনলোড হয়েছে!');
        } else {
          window.print();
        }
      } else if (selectedReportType === 'day-note') {
        const dayNoteElement = document.getElementById('collection-day-note-print-area');
        if (dayNoteElement) {
          const yr = selectedYear === 'all' ? 'সকল-বছর' : `${selectedYear}-সন`;
          await exportElementToPdf(dayNoteElement, {
            fileName: `কালেকশন-ডে-নোট-${yr}.pdf`,
            format: 'a4',
            orientation: 'portrait',
            margin: 8,
            scale: 2.5
          });
          setExportSuccessMsg('কালেকশন ডে নোট PDF সফলভাবে ডাউনলোড হয়েছে!');
        } else if (onNavigateToTab) {
          onNavigateToTab('day-note');
          onClose();
        } else {
          window.print();
        }
      } else {
        // Fallback generic PDF generator
        const printableElement = document.getElementById('modal-hidden-custom-summary');
        if (printableElement) {
          await exportElementToPdf(printableElement, {
            fileName: `আর্থিক-প্রতিবেদন-${selectedYear === 'all' ? 'সকল-হিসাব' : selectedYear}.pdf`,
            format: 'a4',
            orientation: 'portrait',
            margin: 6,
            scale: 2.5
          });
          setExportSuccessMsg('প্রতিবেদন PDF সফলভাবে ডাউনলোড হয়েছে!');
        }
      }
    } catch (err) {
      console.error('Error in PDF download modal:', err);
      alert('পিডিএফ ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে প্রিন্ট অপশনটি ব্যবহার করুন।');
    } finally {
      setIsExporting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div id="report-pdf-download-modal" className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="relative bg-[#f8fafc] border-2 border-[#0f766e] rounded-3xl max-w-3xl w-full p-4 sm:p-6 shadow-2xl animate-scale-in max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center pb-4 border-b border-[#cbd5e1]">
          <div className="flex items-center space-x-3">
            <div className="p-2.5 bg-[#0f766e] text-[#f59e0b] rounded-2xl shadow-sm">
              <Download className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-extrabold text-[#064e3b] text-lg sm:text-xl">
                  রিপোর্ট পিডিএফ (PDF) ডাউনলোড কেন্দ্র
                </h3>
                <span className="bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/30 text-[10px] font-bold px-2 py-0.5 rounded-full">
                  HD প্রিন্ট কোয়ালিটি
                </span>
              </div>
              <p className="text-xs text-[#3c3c3c]/70 font-light mt-0.5">
                যেকোনো ধরনের প্রাতিষ্ঠানিক হিসাব বিবরণী ও অডিট শিট সরাসরি পিডিএফ আকারে ডাউনলোড করুন
              </p>
            </div>
          </div>
          <button
            id="close-pdf-modal-btn"
            onClick={onClose}
            className="p-2 rounded-full bg-[#f1f5f9] hover:bg-[#e2e8f0] text-gray-500 hover:text-gray-800 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success message banner */}
        {exportSuccessMsg && (
          <div className="mt-4 p-3 bg-emerald-50 border border-emerald-300 rounded-2xl flex items-center space-x-2 text-emerald-800 text-xs font-bold animate-fade-in">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{exportSuccessMsg}</span>
          </div>
        )}

        {/* Step 1: Select Report Type */}
        <div className="mt-5 space-y-4">
          <label className="block text-xs font-black text-[#064e3b] uppercase tracking-wider">
            ১. কোন ধরনের রিপোর্ট ডাউনলোড করতে চান নির্বাচন করুন:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Option 1: Official Ledger Statement */}
            <div
              onClick={() => setSelectedReportType('statement')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition duration-200 relative ${
                selectedReportType === 'statement'
                  ? 'border-[#0f766e] bg-[#0f766e]/10 shadow-sm'
                  : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl ${selectedReportType === 'statement' ? 'bg-[#0f766e] text-white' : 'bg-slate-100 text-[#0f766e]'}`}>
                  <BookOpen className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#064e3b]">বার্ষিক আয়-ব্যয় বিবরণী (লেজার শিট)</h4>
                  <p className="text-[11px] text-gray-500 font-light mt-1 leading-snug">
                    ৬-কলামের অফিসিয়াল খতিয়ান শিট (আমানত, আয়, ব্যয়, নিট মুনাফা ও ক্যাশিয়ার/সম্পাদক স্বাক্ষরসহ)।
                  </p>
                </div>
              </div>
              {selectedReportType === 'statement' && (
                <div className="absolute top-3 right-3 text-[#0f766e]">
                  <CheckCircle2 className="h-4 w-4 fill-[#0f766e] text-white" />
                </div>
              )}
            </div>

            {/* Option 2: Monthly Audit Report */}
            <div
              onClick={() => setSelectedReportType('monthly')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition duration-200 relative ${
                selectedReportType === 'monthly'
                  ? 'border-[#0f766e] bg-[#0f766e]/10 shadow-sm'
                  : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl ${selectedReportType === 'monthly' ? 'bg-[#0f766e] text-white' : 'bg-slate-100 text-[#0f766e]'}`}>
                  <FileText className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#064e3b]">মাসিক অডিট ও হিসাব বিবরণী</h4>
                  <p className="text-[11px] text-gray-500 font-light mt-1 leading-snug">
                    নির্দিষ্ট মাসের আয়-ব্যয়ের পুঙ্খানুপুঙ্খ বিবরণী, খাতভিত্তিক সামারি ও নিট উদ্বৃত্তের A4 শিট।
                  </p>
                </div>
              </div>
              {selectedReportType === 'monthly' && (
                <div className="absolute top-3 right-3 text-[#0f766e]">
                  <CheckCircle2 className="h-4 w-4 fill-[#0f766e] text-white" />
                </div>
              )}
            </div>

            {/* Option 3: Annual Statistics & Analytics */}
            <div
              onClick={() => setSelectedReportType('annual')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition duration-200 relative ${
                selectedReportType === 'annual'
                  ? 'border-[#0f766e] bg-[#0f766e]/10 shadow-sm'
                  : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl ${selectedReportType === 'annual' ? 'bg-[#0f766e] text-white' : 'bg-slate-100 text-[#0f766e]'}`}>
                  <BarChart3 className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#064e3b]">সার্বিক পরিসংখ্যান ও চার্ট রিপোর্ট</h4>
                  <p className="text-[11px] text-gray-500 font-light mt-1 leading-snug">
                    বিগত বছরগুলোর মোট বাজেট, তাবাররুক ও ডেকোরেশন ব্যয় এবং প্রবাসীদের আর্থিক অবদান সংক্ষেপ।
                  </p>
                </div>
              </div>
              {selectedReportType === 'annual' && (
                <div className="absolute top-3 right-3 text-[#0f766e]">
                  <CheckCircle2 className="h-4 w-4 fill-[#0f766e] text-white" />
                </div>
              )}
            </div>

            {/* Option 4: Full Transactions Statement */}
            <div
              onClick={() => setSelectedReportType('transactions')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition duration-200 relative ${
                selectedReportType === 'transactions'
                  ? 'border-[#0f766e] bg-[#0f766e]/10 shadow-sm'
                  : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl ${selectedReportType === 'transactions' ? 'bg-[#0f766e] text-white' : 'bg-slate-100 text-[#0f766e]'}`}>
                  <FileSpreadsheet className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-extrabold text-[#064e3b]">পূর্ণাঙ্গ লেনদেন তালিকা ও রসিদ রিপোর্ট</h4>
                  <p className="text-[11px] text-gray-500 font-light mt-1 leading-snug">
                    সকল আয় ও ব্যয় এন্ট্রির ক্রমিক তালিকা, রসিদ নম্বর ও অর্থ এন্ট্রি প্রদানকারীর নামসহ প্রতিবেদন।
                  </p>
                </div>
              </div>
              {selectedReportType === 'transactions' && (
                <div className="absolute top-3 right-3 text-[#0f766e]">
                  <CheckCircle2 className="h-4 w-4 fill-[#0f766e] text-white" />
                </div>
              )}
            </div>

            {/* Option 5: Collection Day Note (Denomination) */}
            <div
              onClick={() => setSelectedReportType('day-note')}
              className={`p-4 rounded-2xl border-2 cursor-pointer transition duration-200 relative sm:col-span-2 ${
                selectedReportType === 'day-note'
                  ? 'border-[#064e3b] bg-emerald-50/80 shadow-sm'
                  : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
              }`}
            >
              <div className="flex items-start space-x-3">
                <div className={`p-2 rounded-xl ${selectedReportType === 'day-note' ? 'bg-[#064e3b] text-amber-300' : 'bg-slate-100 text-[#064e3b]'}`}>
                  <Coins className="h-5 w-5" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h4 className="text-sm font-extrabold text-[#064e3b]">চাঁদা কালেকশন ডে নোট (ডিনোমিনেশন রিপোর্ট)</h4>
                    <span className="text-[10px] bg-amber-100 text-amber-900 border border-amber-300 font-bold px-2 py-0.5 rounded-full">
                      ২০২৬ বিশেষ
                    </span>
                  </div>
                  <p className="text-[11px] text-gray-600 font-light mt-1 leading-snug">
                    টাকার অংক ভিত্তিক স্ল্যাব বিশ্লেষণ (যেমন ২০,০০০ টাকা কতজন, ১০,০০০ টাকা কতজন, ৫,০০০ টাকা কতজন ইত্যাদি) ও প্রিন্ট ফরম্যাট।
                  </p>
                </div>
              </div>
              {selectedReportType === 'day-note' && (
                <div className="absolute top-3 right-3 text-[#064e3b]">
                  <CheckCircle2 className="h-4 w-4 fill-[#064e3b] text-white" />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Step 2: Select Period (Year or Month) */}
        <div className="mt-6 bg-[#f1f5f9] p-4 rounded-2xl border border-[#cbd5e1]">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <span className="block text-xs font-black text-[#064e3b] uppercase tracking-wider">
                ২. হিসাব কাল / সময়সীমা নির্বাচন করুন:
              </span>
              <span className="text-[11px] text-gray-500">
                {selectedReportType === 'monthly' ? 'যে মাসের রিপোর্ট ডাউনলোড করবেন তা নির্বাচন করুন' : 'নির্দিষ্ট বছর বা সামগ্রিক হিসাব নির্বাচন করুন'}
              </span>
            </div>

            {selectedReportType === 'monthly' ? (
              <div className="sm:w-64">
                <select
                  id="pdf-modal-month-select"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs font-bold text-[#064e3b] focus:ring-2 focus:ring-[#0f766e] focus:outline-none cursor-pointer"
                >
                  {availableMonths.map((ym) => (
                    <option key={ym} value={ym}>
                      {formatBanglaMonthYear(ym)}
                    </option>
                  ))}
                </select>
              </div>
            ) : (
              <div className="sm:w-64">
                <select
                  id="pdf-modal-year-select"
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full bg-white border border-[#cbd5e1] rounded-xl px-3 py-2 text-xs font-bold text-[#064e3b] focus:ring-2 focus:ring-[#0f766e] focus:outline-none cursor-pointer"
                >
                  <option value="all">সকল হিসাব কাল (সমগ্র হিসাব)</option>
                  {availableYears.map((yr) => (
                    <option key={yr} value={yr}>
                      {toBanglaNum(yr)} সন
                    </option>
                  ))}
                </select>
              </div>
            )}
          </div>

          {/* Quick Summary of Selected Period */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-[#cbd5e1]/80 text-center">
            <div className="bg-white p-2 rounded-xl border border-[#cbd5e1]">
              <span className="text-[10px] text-gray-500 block">মোট আয়</span>
              <span className="text-xs sm:text-sm font-black text-[#064e3b]">৳ {toBanglaNum(totalIncome.toLocaleString('bn-BD'))}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-[#cbd5e1]">
              <span className="text-[10px] text-gray-500 block">মোট ব্যয়</span>
              <span className="text-xs sm:text-sm font-black text-red-700">৳ {toBanglaNum(totalExpense.toLocaleString('bn-BD'))}</span>
            </div>
            <div className="bg-white p-2 rounded-xl border border-[#cbd5e1]">
              <span className="text-[10px] text-gray-500 block">নীট স্থিতি/উদ্বৃত্ত</span>
              <span className="text-xs sm:text-sm font-black text-[#0f766e]">৳ {toBanglaNum(netSurplus.toLocaleString('bn-BD'))}</span>
            </div>
          </div>
        </div>

        {/* Step 3: Action Buttons */}
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 pt-4 border-t border-[#cbd5e1]">
          <div className="flex items-center space-x-2 text-xs text-gray-500">
            <Sparkles className="h-4 w-4 text-[#d97706]" />
            <span>A4 প্রিন্ট উপযোগী কাস্টমাইজড লেআউট তৈরি হবে</span>
          </div>

          <div className="flex items-center space-x-3 w-full sm:w-auto">
            <button
              id="pdf-modal-cancel-btn"
              onClick={onClose}
              className="flex-1 sm:flex-initial px-4 py-2.5 bg-white border border-[#cbd5e1] text-gray-700 hover:bg-slate-50 rounded-xl text-xs font-bold transition cursor-pointer"
            >
              বাতিল
            </button>

            <button
              id="pdf-modal-download-btn"
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex-1 sm:flex-initial px-6 py-2.5 bg-[#d97706] hover:bg-[#b45309] disabled:bg-gray-300 text-white rounded-xl text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center space-x-2 cursor-pointer"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="h-4 w-4 animate-spin" />
                  <span>পিডিএফ তৈরি হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4" />
                  <span>সরাসরি PDF ডাউনলোড করুন</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Hidden Render Targets for Modal PDF Generation */}
        <div className="hidden">
          <div id="modal-hidden-ledger-report">
            <AnnualLedgerReport transactions={transactions} defaultYear={selectedYear} hideControls={true} />
          </div>

          <div id="modal-hidden-custom-summary" className="p-8 bg-white text-black font-sans w-[800px]">
            <div className="pb-4 border-b-2 border-emerald-800">
              <div className="flex items-center justify-center space-x-3 pb-2">
                <img
                  src={logo}
                  onError={handleLogoError}
                  alt="Logo"
                  className="h-14 w-14 object-contain rounded-full shadow-sm bg-white border border-emerald-100 p-0.5"
                  referrerPolicy="no-referrer"
                />
                <div className="text-left">
                  <h2 className="text-xl font-bold text-emerald-900 leading-tight">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h2>
                  <p className="text-xs text-gray-600">সোনারগাঁও, ধামাইর হাট, রাঙ্গুনিয়া, চট্টগ্রাম।</p>
                </div>
              </div>
              <div className="text-center mt-1">
                <h3 className="text-sm font-bold text-emerald-800">
                  {selectedReportType === 'annual' ? 'সার্বিক বার্ষিক আর্থিক পরিসংখ্যান ও বাজেট প্রতিবেদন' : 'লেনদেন বিবরণী রিপোর্ট'}
                </h3>
                <p className="text-xs text-gray-500">
                  হিসাব কাল: {selectedYear === 'all' ? 'সকল হিসাব কাল' : `${toBanglaNum(selectedYear)} সন`}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 my-6 p-4 bg-emerald-50/50 rounded-xl border border-emerald-200 text-center">
              <div>
                <span className="text-xs text-gray-600 block">সর্বমোট আদায়কৃত আয়</span>
                <span className="text-base font-bold text-emerald-900">৳ {toBanglaNum(totalIncome.toLocaleString('bn-BD'))}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block">সর্বমোট ব্যয়</span>
                <span className="text-base font-bold text-red-700">৳ {toBanglaNum(totalExpense.toLocaleString('bn-BD'))}</span>
              </div>
              <div>
                <span className="text-xs text-gray-600 block">নীট উদ্বৃত্ত/স্থিতি</span>
                <span className="text-base font-bold text-emerald-800">৳ {toBanglaNum(netSurplus.toLocaleString('bn-BD'))}</span>
              </div>
            </div>

            <table className="w-full text-xs border-collapse border border-gray-400 mt-4">
              <thead>
                <tr className="bg-emerald-800 text-white">
                  <th className="border border-gray-400 p-1.5 text-center">ক্রমিক</th>
                  <th className="border border-gray-400 p-1.5 text-center">তারিখ</th>
                  <th className="border border-gray-400 p-1.5 text-left">বিবরণ / খাত</th>
                  <th className="border border-gray-400 p-1.5 text-center">ধরন</th>
                  <th className="border border-gray-400 p-1.5 text-right">টাকা</th>
                </tr>
              </thead>
              <tbody>
                {currentFilteredTransactions.slice(0, 50).map((t, idx) => (
                  <tr key={t.id || idx} className="border-b border-gray-200">
                    <td className="border border-gray-400 p-1.5 text-center">{toBanglaNum(idx + 1)}</td>
                    <td className="border border-gray-400 p-1.5 text-center">{toBanglaNum(t.date || '-')}</td>
                    <td className="border border-gray-400 p-1.5 text-left">
                      {(t.category && t.category !== 'সাধারণ রশিদ কালেকশন') ? `${t.category} ` : ''}{t.donorName ? `(${t.donorName})` : ''} {t.description ? `- ${t.description}` : ''}
                    </td>
                    <td className="border border-gray-400 p-1.5 text-center">
                      {t.type === 'income' ? 'আয়' : 'ব্যয়'}
                    </td>
                    <td className="border border-gray-400 p-1.5 text-right font-mono font-bold">
                      ৳ {toBanglaNum(t.amount.toLocaleString('bn-BD'))}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="flex justify-between items-end mt-16 pt-6 text-xs font-bold text-gray-700">
              <div className="text-center w-36 border-t border-gray-500 pt-1">ক্যাশিয়ার স্বাক্ষর</div>
              <div className="text-center w-36 border-t border-gray-500 pt-1">সাধারণ সম্পাদক স্বাক্ষর</div>
              <div className="text-center w-36 border-t border-gray-500 pt-1">সভাপতি স্বাক্ষর</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
