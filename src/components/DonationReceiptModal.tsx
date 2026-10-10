import React from 'react';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { Printer, Download, X, Check, Copy, Share2, Sparkles, RefreshCw, FileText, CheckCircle2, ShieldCheck, Phone, Calendar, User, Home, DollarSign, Tag, Edit3, Package, Image as ImageIcon } from 'lucide-react';
import { jsPDF } from 'jspdf';
import { Transaction } from '../types';
import { renderSafeCanvas, downloadCanvasAsImage } from '../utils/html2canvasSafe';

export interface DonationReceiptData {
  id?: string;
  receiptNo: string;
  date: string;
  donorName: string;
  houseName?: string;
  phone?: string;
  amount: number | string;
  category: string;
  paymentMethod?: string;
  recordedBy?: string;
  note?: string;
  year?: number | string;
  donationType?: 'cash' | 'item';
  itemName?: string;
}

interface DonationReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Partial<DonationReceiptData> | Transaction | null;
  existingTransactions?: Transaction[];
}

export default function DonationReceiptModal({
  isOpen,
  onClose,
  initialData,
  existingTransactions = []
}: DonationReceiptModalProps) {
  // Translate English digits to Bengali digits
  const toBanglaNum = (num: number | string | undefined | null): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null || num === '') return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Convert Gregorian date (YYYY-MM-DD) to Bengali formatted date
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

  // Convert number to Bengali words for receipt
  const toBanglaWords = (num: number | string): string => {
    const nVal = typeof num === 'string' ? parseFloat(num) : num;
    if (isNaN(nVal) || nVal <= 0) return 'শূণ্য টাকা মাত্র';

    const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
    const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
    const specials: Record<number, string> = {
      21: 'একুশ', 22: 'বাইশ', 23: 'তেইশ', 24: 'চব্বিশ', 25: 'পঁচিশ', 26: 'ছাব্বিশ', 27: 'সাতাশ', 28: 'আঠাশ', 29: 'উনত্রিশ',
      31: 'একত্রিশ', 32: 'বত্রিশ', 33: 'তেত্রিশ', 34: 'চৌত্রিশ', 35: 'পঁয়ত্রিশ', 36: 'ছত্রিশ', 37: 'সাঁইত্রিশ', 38: 'আটত্রিশ', 39: 'উনচল্লিশ',
      41: 'একচল্লিশ', 42: 'বিয়াল্লিশ', 43: 'তেতাল্লিশ', 44: 'চুয়াল্লিশ', 45: 'পঁয়তাল্লিশ', 46: 'ছেচল্লিশ', 47: 'সাতচল্লিশ', 48: 'আটচল্লিশ', 49: 'উনপঞ্চাশ',
      51: 'একান্ন', 52: 'বায়ান্ন', 53: 'তিপ্পান্ন', 54: 'চুয়ান্ন', 55: 'পঞ্চান্ন', 56: 'ছাপ্পান্ন', 57: 'সাতান্ন', 58: 'আটান্ন', 59: 'উনষাট',
      61: 'একষট্টি', 62: 'বাষট্টি', 63: 'তেষট্টি', 64: 'চৌষট্টি', 65: 'পঁয়ষট্টি', 66: 'ছেষট্টি', 67: 'সাতষট্টি', 68: 'আটষট্টি', 69: 'উনসত্তর',
      71: 'একাত্তর', 72: 'বাহাত্তর', 73: 'তিয়াত্তর', 74: 'চুয়াত্তর', 75: 'পঁচাত্তর', 76: 'ছিয়াত্তর', 77: 'সাতাত্তর', 78: 'আটাত্তর', 79: 'উনাশি',
      81: 'একাশি', 82: 'বিরাশি', 83: 'তিরাশি', 84: 'চৌরাশি', 85: 'পঁচাশি', 86: 'ছিয়াশি', 87: 'সাতাশি', 88: 'অষ্টআশি', 89: 'উননব্বই',
      91: 'একানব্বই', 92: 'বিরানব্বই', 93: 'তিরানব্বই', 94: 'চুরানব্বই', 95: 'পঁচানব্বই', 96: 'ছিয়ানব্বই', 97: 'সাতানব্বই', 98: 'আটানব্বই', 99: 'নিরানব্বই'
    };

    const convertTens = (n: number): string => {
      if (n < 10) return units[n];
      if (n >= 10 && n < 20) return teens[n - 10];
      if (specials[n]) return specials[n];
      const ten = Math.floor(n / 10);
      const rem = n % 10;
      return tens[ten] + (rem > 0 ? ' ' + units[rem] : '');
    };

    const convert = (n: number): string => {
      let words = '';
      if (n >= 10000000) {
        const crores = Math.floor(n / 10000000);
        words += convert(crores) + ' কোটি ';
        n %= 10000000;
      }
      if (n >= 100000) {
        const lakhs = Math.floor(n / 100000);
        words += convertTens(lakhs) + ' লাখ ';
        n %= 100000;
      }
      if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        words += convertTens(thousands) + ' হাজার ';
        n %= 1000;
      }
      if (n >= 100) {
        const hundreds = Math.floor(n / 100);
        words += units[hundreds] + ' শত ';
        n %= 100;
      }
      if (n > 0) {
        words += convertTens(n);
      }
      return words.trim();
    };

    return convert(Math.floor(nVal)) + ' টাকা মাত্র';
  };

  // Form states
  const [formData, setFormData] = React.useState<DonationReceiptData>({
    receiptNo: '',
    date: new Date().toISOString().split('T')[0],
    donorName: 'মোঃ আব্দুল করিম',
    houseName: 'সোনারগাঁও তুপ্পারপাড়',
    phone: '',
    amount: 1000,
    category: 'পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল চাঁদা',
    paymentMethod: 'নগদ ক্যাশ (Cash)',
    recordedBy: 'মো: তারেক জামাল (অর্থ সম্পাদক)',
    note: 'পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল ও জশনে জুলুস সফল করতে আন্তরিক অনুদান।',
    year: '২০২৬'
  });

  const [isEditing, setIsEditing] = React.useState(false);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isDownloadingPng, setIsDownloadingPng] = React.useState(false);
  const [copied, setCopied] = React.useState(false);

  // Sync initialData when modal opens
  React.useEffect(() => {
    if (initialData) {
      const trans = initialData as any;
      const recNo = trans.receiptNo || trans.id || `${Math.floor(1000 + Math.random() * 9000)}`;
      setFormData({
        id: trans.id,
        receiptNo: recNo.toString(),
        date: trans.date || new Date().toISOString().split('T')[0],
        donorName: trans.donorName || trans.description || 'সম্মানিত চাঁদাদাতা',
        houseName: trans.houseName || 'সোনারগাঁও (তুপ্পারপাড়), রাঙ্গুনিয়া',
        phone: trans.phone || '',
        amount: trans.amount !== undefined ? trans.amount : 1000,
        category: trans.category || 'পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল চাঁদা',
        paymentMethod: trans.paymentMethod || 'নগদ ক্যাশ (Cash)',
        recordedBy: trans.recordedBy || 'মো: তারেক জামাল (অর্থ সম্পাদক)',
        note: trans.description && trans.description !== trans.donorName ? trans.description : 'পবিত্র মাহফিল ও জশনে জুলুস উদযাপন উপলক্ষে আর্থিক অনুদান।',
        year: trans.year ? trans.year.toString() : '২০২৬',
        donationType: trans.donationType || (trans.itemName ? 'item' : 'cash'),
        itemName: trans.itemName || ''
      });
    } else {
      // Default new receipt
      const randomNo = Math.floor(100 + Math.random() * 900);
      setFormData({
        receiptNo: `${randomNo}`,
        date: new Date().toISOString().split('T')[0],
        donorName: '',
        houseName: 'সোনারগাঁও তুপ্পারপাড়',
        phone: '',
        amount: '',
        category: 'পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল চাঁদা',
        paymentMethod: 'নগদ ক্যাশ (Cash)',
        recordedBy: 'মো: তারেক জামাল (অর্থ সম্পাদক)',
        note: 'পবিত্র মাহফিল ও জশনে জুলুস সফল করতে বাড়িভিত্তিক ও ব্যক্তিগত দান।',
        year: '২০২৬'
      });
      setIsEditing(true); // Open in edit mode if fresh
    }
  }, [initialData, isOpen]);

  if (!isOpen) return null;

  // Helper to convert CSS colors (oklch/oklab) to rgb/rgba for html2canvas compatibility
  const convertCssColors = (val: string): string => {
    if (typeof val !== 'string') return val;
    if (!val.includes('oklch') && !val.includes('oklab')) return val;
    return val.replace(/oklch\s*\(([^)]+)\)/gi, (match, inner) => {
      try {
        const parts = inner.trim().split(/[\s,/]+/);
        const cleanParts = parts.filter((p: string) => p !== '');
        if (cleanParts.length < 3) return match;
        let L = parseFloat(cleanParts[0]);
        if (cleanParts[0].includes('%')) L /= 100;
        let C = parseFloat(cleanParts[1]);
        if (cleanParts[1].includes('%')) C /= 100;
        let H = parseFloat(cleanParts[2]);
        if (cleanParts[2].includes('deg')) H = parseFloat(cleanParts[2].replace('deg', ''));
        let A = 1;
        if (cleanParts[3]) {
          A = parseFloat(cleanParts[3]);
          if (cleanParts[3].includes('%')) A /= 100;
        }
        const a = C * Math.cos(H * Math.PI / 180);
        const b = C * Math.sin(H * Math.PI / 180);
        const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
        const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
        const s_ = L - 0.0894841775 * a - 1.2914855480 * b;
        const l = l_ * l_ * l_;
        const m = m_ * m_ * m_;
        const s = s_ * s_ * s_;
        let r = +4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
        let g = -1.2684380046 * l + 2.6097574011 * m - 0.3413190965 * s;
        let b_val = -0.0041960863 * l - 0.7034186147 * m + 1.7076147010 * s;
        const f = (x: number) => x <= 0.0031308 ? 12.92 * x : 1.055 * Math.pow(x, 1 / 2.4) - 0.055;
        const r_clamped = Math.round(Math.max(0, Math.min(1, f(r))) * 255);
        const g_clamped = Math.round(Math.max(0, Math.min(1, f(g))) * 255);
        const b_clamped = Math.round(Math.max(0, Math.min(1, f(b_val))) * 255);
        return `rgba(${r_clamped}, ${g_clamped}, ${b_clamped}, ${A})`;
      } catch (e) {
        return 'rgb(15, 118, 110)';
      }
    });
  };

  const patchGetComputedStyle = (win: any) => {
    const originalGetComputedStyle = win.getComputedStyle;
    if (!originalGetComputedStyle) return;
    win.getComputedStyle = function (el: Element, pseudoElt?: string) {
      const style = originalGetComputedStyle.call(this, el, pseudoElt);
      if (!style) return style;
      return new Proxy(style, {
        get(target: any, prop: string | symbol) {
          const val = target[prop];
          if (typeof val === 'string' && (val.includes('oklch') || val.includes('oklab'))) {
            return convertCssColors(val);
          }
          if (typeof val === 'function' && prop === 'getPropertyValue') {
            return function (propertyName: string) {
              const originalVal = target.getPropertyValue(propertyName);
              if (typeof originalVal === 'string' && (originalVal.includes('oklch') || originalVal.includes('oklab'))) {
                return convertCssColors(originalVal);
              }
              return originalVal;
            };
          }
          return typeof val === 'function' ? val.bind(target) : val;
        }
      });
    };
  };

  // Generate and Download PDF
  const handleDownloadPDF = async () => {
    const receiptElement = document.getElementById('donation-receipt-render-card');
    if (!receiptElement) return;

    setIsDownloadingPdf(true);

    try {
      const canvas = await renderSafeCanvas(receiptElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
      });

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      });

      const imgWidth = 210;
      const pageHeight = 148;
      const margin = 6;
      const maxWidth = imgWidth - (margin * 2);
      const maxHeight = pageHeight - (margin * 2);

      let rectWidth = maxWidth;
      let rectHeight = (canvas.height * rectWidth) / canvas.width;

      if (rectHeight > maxHeight) {
        rectHeight = maxHeight;
        rectWidth = (canvas.width * rectHeight) / canvas.height;
      }

      const xOffset = margin + (maxWidth - rectWidth) / 2;
      const yOffset = margin + (maxHeight - rectHeight) / 2;

      pdf.addImage(imgData, 'JPEG', xOffset, yOffset, rectWidth, rectHeight);
      const safeDonorName = (formData.donorName || 'donor').replace(/[\s/]/g, '_');
      pdf.save(`Donation_Receipt_${safeDonorName}_${formData.receiptNo || 'voucher'}.pdf`);
    } catch (err) {
      console.error('Error generating PDF:', err);
      alert('পিডিএফ তৈরিতে সামান্য ত্রুটি হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  // Download high-resolution PNG image
  const handleDownloadPNG = async () => {
    const receiptElement = document.getElementById('donation-receipt-render-card');
    if (!receiptElement) return;

    setIsDownloadingPng(true);

    try {
      const canvas = await renderSafeCanvas(receiptElement, {
        scale: 3,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false
      });

      const safeDonorName = (formData.donorName || 'donor').replace(/[\s/]/g, '_');
      downloadCanvasAsImage(canvas, `Donation_Receipt_${safeDonorName}.png`, 'image/png');
    } catch (err) {
      console.error('Error downloading PNG:', err);
    } finally {
      setIsDownloadingPng(false);
    }
  };

  // Copy receipt summary to clipboard
  const handleCopySummary = () => {
    const displayCat = formData.category === 'সাধারণ রশিদ কালেকশন' ? 'চাঁদা ও অনুদান' : (formData.category || 'চাঁদা ও অনুদান');
    const text = `📜 পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ\nসোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম\n\n✨ চাঁদা আদায়ের অফিসিয়াল রশিদ ✨\n━━━━━━━━━━━━━━━━━━━━━\nরশিদ নং: #${toBanglaNum(formData.receiptNo)}\nতারিখ: ${toBanglaDate(formData.date)}\nচাঁদাদাতা: ${formData.donorName || '—'}\nবাড়ি / ঠিকানা: ${formData.houseName || 'সোনারগাঁও'}\nখাত: ${displayCat}\nটাকার পরিমাণ: ৳ ${toBanglaNum(formData.amount)}/-\nকথায়: ${toBanglaWords(formData.amount)}\nমাধ্যম: ${formData.paymentMethod}\n━━━━━━━━━━━━━━━━━━━━━\nআল্লাহ্ পাক আপনার দান কবুল ও বরকত দান করুন। আমিন!`;
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    });
  };

  // Native Print
  const handlePrint = () => {
    window.print();
  };

  const numAmount = typeof formData.amount === 'string' ? parseFloat(formData.amount) || 0 : formData.amount;

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-2 sm:p-4 bg-black/75 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white print:static">
      <div className="bg-white rounded-3xl shadow-2xl max-w-4xl w-full my-auto overflow-hidden border-2 border-[#d97706]/40 flex flex-col max-h-[96vh] print:border-none print:shadow-none print:max-w-none print:max-h-none">
        
        {/* Modal Top Control Bar */}
        <div className="bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#064e3b] px-4 sm:px-6 py-3.5 text-white flex items-center justify-between shadow-md print:hidden">
          <div className="flex items-center space-x-2.5">
            <div className="p-1.5 bg-amber-400/20 rounded-xl border border-amber-300/40 text-amber-300">
              <Sparkles className="h-5 w-5" />
            </div>
            <div>
              <h3 className="font-extrabold text-sm sm:text-base leading-tight tracking-tight flex items-center gap-1.5">
                <span>চাঁদা আদায়ের অফিসিয়াল রশিদ</span>
                <span className="bg-amber-400 text-[#064e3b] text-[10px] font-black px-2 py-0.5 rounded-full">ডিজিটাল ভাউচার</span>
              </h3>
              <p className="text-[11px] text-emerald-100/90 font-light">চাঁদাদাতার নামে নান্দনিক ইসলামিক ডিজাইনের পূর্ণাঙ্গ রশিদ</p>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer border ${
                isEditing
                  ? 'bg-amber-400 text-[#064e3b] border-amber-300 shadow-sm'
                  : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
              }`}
              title="তথ্য পরিবর্তন বা নতুন নাম লিখুন"
            >
              <Edit3 className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{isEditing ? 'প্রিভিউ দেখুন' : 'তথ্য পরিবর্তন'}</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              title="বন্ধ করুন"
            >
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        {/* Modal Main Content (Split view: Editor & Live Receipt Preview) */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-5 space-y-4 bg-slate-100/70 print:p-0 print:bg-white">
          
          {/* Collapsible Easy Data Input Form */}
          {isEditing && (
            <div className="bg-white p-4 sm:p-5 rounded-2xl border-2 border-emerald-600/30 shadow-sm space-y-4 print:hidden animate-fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                <span className="text-xs font-black text-[#064e3b] flex items-center gap-1.5">
                  <User className="h-4 w-4 text-[#0f766e]" />
                  <span>চাঁদাদাতার তথ্য ইনপুট ফরম (সহজেই পূরণ করুন):</span>
                </span>
                <span className="text-[11px] text-slate-500 font-medium">যেকোনো নাম লিখলে সাথে সাথে রশিদে আপডেট হবে</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 text-xs">
                {/* Donor Name */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">চাঁদাদাতার নাম *</label>
                  <input
                    type="text"
                    value={formData.donorName}
                    onChange={(e) => setFormData({ ...formData, donorName: e.target.value })}
                    placeholder="যেমন: হাজী মোঃ আবুল বশর"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-slate-900 bg-emerald-50/40"
                  />
                </div>

                {/* House Name / Address */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">বাড়ি / ঠিকানা</label>
                  <input
                    type="text"
                    value={formData.houseName || ''}
                    onChange={(e) => setFormData({ ...formData, houseName: e.target.value })}
                    placeholder="যেমন: মৌলভী বাড়ি / সোনারগাঁও"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none text-slate-900"
                  />
                </div>

                {/* Amount */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">টাকার পরিমাণ (৳) *</label>
                  <input
                    type="number"
                    value={formData.amount}
                    onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                    placeholder="যেমন: ৫০০০"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-black text-[#064e3b] bg-amber-50/50"
                  />
                </div>

                {/* Receipt Number */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">রশিদ নম্বর</label>
                  <div className="flex space-x-1.5">
                    <input
                      type="text"
                      value={formData.receiptNo}
                      onChange={(e) => setFormData({ ...formData, receiptNo: e.target.value })}
                      placeholder="যেমন: ১২৪"
                      className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-bold text-red-700"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, receiptNo: `${Math.floor(100 + Math.random() * 900)}` })}
                      className="px-2 py-1 bg-slate-200 hover:bg-slate-300 rounded-xl text-slate-700 transition"
                      title="অটো নম্বর"
                    >
                      <RefreshCw className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                {/* Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">তারিখ</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none text-slate-900"
                  />
                </div>

                {/* Category */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">আদায়ের খাত</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none font-semibold text-slate-900 bg-white"
                  >
                    <option value="পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল চাঁদা">পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল চাঁদা</option>
                    <option value="বাড়ি ভিত্তিক বার্ষিক সাধারণ চাঁদা">বাড়ি ভিত্তিক বার্ষিক সাধারণ চাঁদা</option>
                    <option value="জশনে জুলুস ও তোরণ নির্মাণ ফান্ড">জশনে জুলুস ও তোরণ নির্মাণ ফান্ড</option>
                    <option value="তবাররুক ও আপ্যায়ন অনুদান">তবাররুক ও আপ্যায়ন অনুদান</option>
                    <option value="মাইক ও ডেকোরেশন ফান্ড">মাইক ও ডেকোরেশন ফান্ড</option>
                    <option value="প্রবাসী ও বিশিষ্ট ব্যক্তিবর্গের বিশেষ অনুদান">প্রবাসী ও বিশিষ্ট ব্যক্তিবর্গের বিশেষ অনুদান</option>
                    <option value="এককালীন সাধারণ দান">এককালীন সাধারণ দান</option>
                  </select>
                </div>

                {/* Payment Mode */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">পরিশোধের মাধ্যম</label>
                  <select
                    value={formData.paymentMethod || 'নগদ ক্যাশ (Cash)'}
                    onChange={(e) => setFormData({ ...formData, paymentMethod: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none text-slate-900 bg-white"
                  >
                    <option value="নগদ ক্যাশ (Cash)">নগদ ক্যাশ (Cash)</option>
                    <option value="বিকাশ (bKash)">বিকাশ (bKash)</option>
                    <option value="নগদ (Nagad)">নগদ (Nagad)</option>
                    <option value="ব্যাংক একাউন্ট">ব্যাংক একাউন্ট</option>
                    <option value="অনলাইন পেমেন্ট">অনলাইন পেমেন্ট</option>
                  </select>
                </div>

                {/* Collector / Recorded By */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">আদায়কারী / হিসাবরক্ষক</label>
                  <input
                    type="text"
                    value={formData.recordedBy || ''}
                    onChange={(e) => setFormData({ ...formData, recordedBy: e.target.value })}
                    placeholder="যেমন: মো: তারেক জামাল"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none text-slate-900"
                  />
                </div>

                {/* Year */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700 block">অর্থবছর / সন</label>
                  <input
                    type="text"
                    value={formData.year || '২০২৬'}
                    onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                    placeholder="২০২৬"
                    className="w-full px-3 py-2 border border-slate-300 rounded-xl focus:ring-2 focus:ring-[#0f766e] focus:outline-none text-slate-900"
                  />
                </div>
              </div>
            </div>
          )}

          {/* ================= GORGEOUS ISLAMIC MONEY RECEIPT RENDER CARD ================= */}
          <div className="flex justify-center">
            <div
              id="donation-receipt-render-card"
              className="bg-white border-[3px] border-[#064e3b] rounded-2xl p-5 sm:p-7 max-w-2xl w-full shadow-xl relative text-[#1e293b] select-none overflow-hidden print:border-[2px] print:p-4 print:shadow-none print:max-w-none"
              style={{
                boxShadow: '0 10px 25px -5px rgba(6, 78, 59, 0.1), 0 8px 10px -6px rgba(6, 78, 59, 0.1)'
              }}
            >
              {/* Inner Decorative Golden Islamic Border */}
              <div className="absolute inset-1.5 border border-dashed border-[#d97706]/70 rounded-xl pointer-events-none"></div>
              
              {/* Subtle Corner Ornaments */}
              <div className="absolute top-2 left-2 w-4 h-4 border-t-2 border-l-2 border-[#d97706] rounded-tl-sm pointer-events-none"></div>
              <div className="absolute top-2 right-2 w-4 h-4 border-t-2 border-r-2 border-[#d97706] rounded-tr-sm pointer-events-none"></div>
              <div className="absolute bottom-2 left-2 w-4 h-4 border-b-2 border-l-2 border-[#d97706] rounded-bl-sm pointer-events-none"></div>
              <div className="absolute bottom-2 right-2 w-4 h-4 border-b-2 border-r-2 border-[#d97706] rounded-br-sm pointer-events-none"></div>

              {/* Watermark of Official Logo in the center */}
              <div className="absolute inset-0 flex items-center justify-center opacity-[0.055] pointer-events-none">
                <img
                  src={logo}
                  onError={handleLogoError}
                  alt="Watermark"
                  className="w-72 h-72 object-contain rounded-full"
                  referrerPolicy="no-referrer"
                />
              </div>

              {/* 1. RECEIPT TOP HEADER */}
              <div className="relative text-center pb-3 border-b-2 border-double border-[#0f766e]/30">
                {/* Top Logo */}
                <div className="absolute left-0 top-1/2 -translate-y-1/2 flex items-center">
                  <div className="p-0.5 bg-gradient-to-tr from-[#d97706] to-[#0f766e] rounded-full shadow-sm">
                    <img
                      src={logo}
                      onError={handleLogoError}
                      alt="Logo"
                      className="w-10 h-10 sm:w-14 sm:h-14 object-cover rounded-full bg-white border border-white"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                </div>

                {/* Right Verified Seal Pill */}
                <div className="absolute right-0 top-1/2 -translate-y-1/2 flex flex-col items-center">
                  <div className="w-10 h-10 sm:w-13 sm:h-13 rounded-full border-2 border-dashed border-[#d97706] bg-amber-50/70 p-0.5 sm:p-1 flex flex-col items-center justify-center text-center shadow-xs">
                    <ShieldCheck className="h-3.5 w-3.5 sm:h-5 sm:w-5 text-[#064e3b]" />
                    <span className="text-[6px] sm:text-[7px] font-black text-[#064e3b] uppercase leading-tight tracking-tighter mt-0.5">যাচাইকৃত</span>
                  </div>
                </div>

                {/* Arabic Bismillah */}
                <div className="font-serif text-sm sm:text-base font-bold text-[#064e3b] tracking-wider mb-1">
                  بِسْمِ ٱللَّهِ ٱلرَّحْمَٰنِ ٱلرَّحِيمِ
                </div>
                
                {/* Organization Title */}
                <h1 className="text-lg sm:text-2xl font-black text-[#064e3b] tracking-tight sm:px-16 leading-tight">
                  পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
                </h1>
                <p className="text-xs sm:text-sm font-bold text-[#0f766e] mt-0.5">
                  সোনারগাঁও (তুপ্পারপাড়), রাঙ্গুনিয়া, চট্টগ্রাম।
                </p>

                {/* Receipt Badge Header */}
                <div className="inline-flex items-center justify-center mt-2 px-5 py-1 bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#064e3b] text-amber-200 text-xs sm:text-sm font-black rounded-full border border-amber-300 shadow-sm">
                  <span>চাঁদা ও অনুদান আদায়ের রশিদ</span>
                </div>
              </div>

              {/* 2. META DATA ROW (Receipt No, Date, Fiscal Year) */}
              <div className="relative grid grid-cols-2 sm:grid-cols-3 gap-2 py-3 border-b border-slate-200 text-xs font-bold text-slate-800">
                <div className="flex items-center space-x-1.5">
                  <span className="text-slate-500 font-semibold">রশিদ নম্বর:</span>
                  <span className="px-2.5 py-0.5 bg-red-50 text-red-700 font-black font-mono border border-red-200 rounded-md">
                    #{toBanglaNum(formData.receiptNo || '০০১')}
                  </span>
                </div>

                <div className="flex items-center justify-start sm:justify-center space-x-1.5">
                  <span className="text-slate-500 font-semibold">তারিখ:</span>
                  <span className="text-[#064e3b] font-extrabold">{toBanglaDate(formData.date)}</span>
                </div>

                <div className="col-span-2 sm:col-span-1 flex items-center justify-end space-x-1.5">
                  <span className="text-slate-500 font-semibold">অর্থ সন:</span>
                  <span className="text-emerald-800 font-black">{toBanglaNum(formData.year || 2026)} খ্রি. / ১৪৪৭-৪৮ হিজরী</span>
                </div>
              </div>

              {/* 3. MAIN DONOR DETAILS IN STRUCTURED ROWS */}
              <div className="relative py-4 space-y-3.5 text-xs sm:text-sm text-slate-900 leading-relaxed">
                {/* Donor Name Row */}
                <div className="flex items-baseline bg-emerald-50/50 p-2.5 rounded-xl border border-emerald-600/20">
                  <span className="w-28 sm:w-32 shrink-0 font-extrabold text-[#064e3b] flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-[#0f766e]" />
                    <span>চাঁদাদাতার নাম:</span>
                  </span>
                  <span className="flex-1 font-black text-sm sm:text-base text-[#064e3b] tracking-wide">
                    {formData.donorName || 'সম্মানিত চাঁদাদাতা'}
                  </span>
                </div>

                {/* House / Village & Address */}
                <div className="flex items-baseline px-2">
                  <span className="w-28 sm:w-32 shrink-0 font-bold text-slate-600 flex items-center gap-1">
                    <Home className="h-3.5 w-3.5 text-[#0f766e]" />
                    <span>বাড়ি / ঠিকানা:</span>
                  </span>
                  <span className="flex-1 font-bold text-slate-800 border-b border-dashed border-slate-400 pb-0.5">
                    {formData.houseName || 'সোনারগাঁও (তুপ্পারপাড়), রাঙ্গুনিয়া, চট্টগ্রাম'}
                  </span>
                </div>

                {/* Category & Payment Method */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 px-2">
                  <div className="flex items-baseline">
                    <span className="w-24 shrink-0 font-bold text-slate-600 flex items-center gap-1">
                      <Tag className="h-3.5 w-3.5 text-[#0f766e]" />
                      <span>আদায়ের খাত:</span>
                    </span>
                    <span className="flex-1 font-extrabold text-[#064e3b] border-b border-dashed border-slate-400 pb-0.5">
                      {formData.category === 'সাধারণ রশিদ কালেকশন' ? 'চাঁদা ও অনুদান' : (formData.category || 'চাঁদা ও অনুদান')}
                    </span>
                  </div>

                  <div className="flex items-baseline">
                    <span className="w-24 shrink-0 font-bold text-slate-600">মাধ্যম:</span>
                    <span className="flex-1 font-bold text-slate-800 border-b border-dashed border-slate-400 pb-0.5">
                      {formData.paymentMethod || 'নগদ ক্যাশ (Cash)'}
                    </span>
                  </div>
                </div>

                {/* Amount / In-Kind Box - High Contrast & Prestigious */}
                <div className="pt-2">
                  {formData.donationType === 'item' || formData.itemName ? (
                    <div className="bg-gradient-to-r from-amber-500/15 via-amber-50 to-amber-500/15 border-2 border-[#d97706] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-black text-[#064e3b] uppercase flex items-center gap-1">
                          <Package className="h-4 w-4 text-[#d97706]" />
                          <span>দানকৃত পণ্য (Item):</span>
                        </span>
                        <span className="text-base sm:text-lg font-black text-[#064e3b] bg-white px-3 py-1 rounded-xl border border-amber-400 shadow-xs">
                          {formData.itemName}
                        </span>
                      </div>

                      <div className="text-xs font-bold text-emerald-950 italic text-center sm:text-right">
                        {numAmount > 0 ? (
                          <>
                            <span className="text-slate-500 not-italic mr-1">আনুমানিক মূল্য:</span>
                            <span className="font-extrabold text-[#064e3b]">৳ {toBanglaNum(numAmount.toLocaleString('bn-BD'))}/= ({toBanglaWords(numAmount)})</span>
                          </>
                        ) : (
                          <span className="font-extrabold text-[#064e3b]">পণ্য ও খাদ্যসামগ্রী অনুদান</span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-gradient-to-r from-[#064e3b]/10 via-amber-50 to-[#064e3b]/10 border-2 border-[#d97706] rounded-2xl p-3 sm:p-4 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-xs">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs sm:text-sm font-black text-[#064e3b] uppercase">টাকার পরিমাণ (Amount):</span>
                        <span className="text-xl sm:text-2xl font-black text-[#064e3b] font-mono bg-white px-3 py-1 rounded-xl border border-emerald-600/30 shadow-xs">
                          ৳ {toBanglaNum(numAmount.toLocaleString('bn-BD'))}/=
                        </span>
                      </div>

                      <div className="text-xs font-bold text-emerald-950 italic text-center sm:text-right">
                        <span className="text-slate-500 not-italic mr-1">কথায়:</span>
                        <span className="font-extrabold text-[#064e3b]">{toBanglaWords(numAmount)}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Dua / Islamic Blessings Message */}
                <div className="bg-[#0f766e]/5 border border-[#0f766e]/15 rounded-xl p-2.5 text-center text-[11px] sm:text-xs text-[#064e3b] font-bold leading-relaxed italic">
                  "আল্লাহ্ সুবহানাহু ওয়া তা'আলা আপনার এই নেক দান ও আর্থিক সহযোগিতাকে কবুল করুন এবং পরিবারে অফুরন্ত বরকত ও শান্তি দান করুন। আমিন।"
                </div>
              </div>

              {/* 4. OFFICIAL SIGNATURES & STAMP AREA */}
              <div className="relative pt-8 pb-2 grid grid-cols-3 gap-2 text-center text-[11px] sm:text-xs text-[#064e3b]">
                {/* 1. Collector Signature */}
                <div className="space-y-1">
                  <div className="h-6 flex items-end justify-center text-[10px] text-slate-500 font-semibold italic">
                    {formData.recordedBy || 'অনলাইন এন্ট্রি'}
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-black">
                    আদায়কারী / হিসাবরক্ষক
                  </div>
                  <p className="text-[9px] text-slate-500">স্বাক্ষর ও সিল</p>
                </div>

                {/* 2. Treasurer / Finance Secretary */}
                <div className="space-y-1">
                  <div className="h-6 flex items-end justify-center text-[10px] text-[#064e3b] font-bold">
                    মো: তারেক জামাল
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-black">
                    অর্থ সম্পাদক / কোষাধ্যক্ষ
                  </div>
                  <p className="text-[9px] text-slate-500">অনুমোদিত কপি</p>
                </div>

                {/* 3. President / Convener */}
                <div className="space-y-1">
                  <div className="h-6 flex items-end justify-center text-[10px] text-[#064e3b] font-bold">
                    মাস্টার মো: আবদুস সত্তার
                  </div>
                  <div className="border-t border-slate-400 pt-1 font-black">
                    সভাপতি / আহ্বায়ক
                  </div>
                  <p className="text-[9px] text-slate-500">উদযাপন পরিষদ</p>
                </div>
              </div>

              {/* Bottom Micro Footer */}
              <div className="relative pt-2 mt-2 border-t border-slate-200 flex justify-between items-center text-[9px] text-slate-400 font-medium">
                <span>সোনারগাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ ম্যানেজমেন্ট সিস্টেম</span>
                <span>স্বাক্ষরিত অফিসিয়াল ভাউচার</span>
              </div>
            </div>
          </div>
        </div>

        {/* Modal Bottom Action Toolbar */}
        <div className="bg-white border-t border-slate-200 px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-2.5 print:hidden">
          <div className="flex items-center space-x-2">
            <button
              onClick={handleCopySummary}
              className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center space-x-1.5 cursor-pointer border ${
                copied
                  ? 'bg-emerald-600 text-white border-emerald-600'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-300'
              }`}
              title="রশিদের বিবরণ টেক্সট কপি করুন"
            >
              {copied ? <CheckCircle2 className="h-4 w-4 text-white" /> : <Copy className="h-4 w-4 text-slate-500" />}
              <span>{copied ? 'কপি হয়েছে!' : 'বিবরণ কপি'}</span>
            </button>
          </div>

          <div className="flex items-center space-x-2">
            {/* Download PNG Image */}
            <button
              onClick={handleDownloadPNG}
              disabled={isDownloadingPng}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold rounded-xl text-xs transition flex items-center space-x-1.5 border border-slate-300 cursor-pointer disabled:opacity-50"
              title="ছবি হিসেবে সংরক্ষণ করুন"
            >
              <ImageIcon className="h-4 w-4 text-[#0f766e]" />
              <span>{isDownloadingPng ? 'প্রসেসিং...' : 'ছবি (PNG)'}</span>
            </button>

            {/* Download PDF */}
            <button
              onClick={handleDownloadPDF}
              disabled={isDownloadingPdf}
              className="px-4 py-2 bg-gradient-to-r from-[#d97706] to-[#b45309] hover:from-[#b45309] hover:to-[#92400e] text-white font-bold rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="পিডিএফ ফাইল ডাউনলোড"
            >
              {isDownloadingPdf ? (
                <>
                  <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                  <span>ডাউনলোড হচ্ছে...</span>
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 text-amber-200" />
                  <span>PDF ডাউনলোড</span>
                </>
              )}
            </button>

            {/* Print Button */}
            <button
              onClick={handlePrint}
              className="px-4 py-2 bg-gradient-to-r from-[#064e3b] to-[#0f766e] hover:from-[#0f766e] hover:to-[#047857] text-white font-black rounded-xl text-xs shadow-md transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-amber-300" />
              <span>প্রিন্ট করুন</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}
