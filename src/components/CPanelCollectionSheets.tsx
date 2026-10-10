import React from 'react';
import { Transaction, MahfilDetails } from '../types';
import jsPDF from 'jspdf';
import { renderSafeCanvas, downloadCanvasAsImage } from '../utils/html2canvasSafe';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import DonationReceiptModal from './DonationReceiptModal';
import {
  Home,
  FileText,
  Printer,
  Download,
  Search,
  Filter,
  Users,
  Building2,
  Receipt,
  Eye,
  CheckCircle2,
  Calendar,
  Layers,
  Sparkles,
  RefreshCw,
  Image as ImageIcon,
  Share2,
  Plus,
  Coins,
  ChevronUp,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ListOrdered,
  ArrowUp,
  ArrowDown,
  ArrowUpDown,
  Check,
  X
} from 'lucide-react';
import { toEnglishDigits } from '../lib/numberUtils';

interface CPanelCollectionSheetsProps {
  transactions: Transaction[];
  mahfilDetails?: MahfilDetails;
  activeHouses?: string[];
  deletedHouses?: string[];
  donorOrders?: Record<string, string[]>;
  onUpdateDonorOrder?: (key: string, orderedIds: string[]) => Promise<void> | void;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
  onUpdateHouses?: (active: string[], deleted: string[]) => Promise<void> | void;
}

export default function CPanelCollectionSheets({
  transactions,
  mahfilDetails,
  activeHouses: activeHousesProp,
  deletedHouses: deletedHousesProp,
  donorOrders,
  onUpdateDonorOrder,
  onAddTransaction,
  onUpdateHouses
}: CPanelCollectionSheetsProps) {
  const defaultHouses = [
    'বৈদ্য বাড়ী',
    'সওদাগর বাড়ী',
    'চৌধুরী বাড়ী',
    'মিয়াজী বাড়ী',
    'শিকদার বাড়ী',
    'তালুকদার বাড়ী',
    'হাজী বাড়ী',
    'মুন্সী বাড়ী',
    'মাওলানা বাড়ী',
    'ডাক্তার বাড়ী',
    'খান বাড়ী',
    'মোল্লা বাড়ী',
    'মাস্টার বাড়ী',
    'দরবেশ বাড়ী'
  ];

  const activeHouses = activeHousesProp && activeHousesProp.length > 0 ? activeHousesProp : defaultHouses;
  const deletedHouses = deletedHousesProp || [];

  // Available unique houses from config & transactions
  const dynamicHouses = React.useMemo(() => {
    const fromTransactions = transactions
      .filter((t) => t.houseName && t.houseName.trim() !== '')
      .map((t) => t.houseName as string);
    const combined = [...activeHouses, ...fromTransactions];
    const unique = Array.from(new Set(combined));
    return unique.filter((h) => !deletedHouses.includes(h));
  }, [activeHouses, transactions, deletedHouses]);

  const [selectedYear, setSelectedYear] = React.useState<string>('2026');
  const [selectedHouse, setSelectedHouse] = React.useState<string>(dynamicHouses[0] || 'বৈদ্য বাড়ী');
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [activeViewMode, setActiveViewMode] = React.useState<'sheets' | 'receipts'>('sheets');
  const [sheetLayout, setSheetLayout] = React.useState<'single' | 'dual'>('single');
  const [secondHouseForDual, setSecondHouseForDual] = React.useState<string>(dynamicHouses[1] || 'সওদাগর বাড়ী');
  const [showReorderModal, setShowReorderModal] = React.useState<boolean>(false);
  const [showDonorReorderModal, setShowDonorReorderModal] = React.useState<boolean>(false);
  const [donorReorderTargetHouse, setDonorReorderTargetHouse] = React.useState<string>('');
  const [feedbackMsg, setFeedbackMsg] = React.useState<string>('');

  // Move house up or down in sequence
  const handleMoveHouse = (houseName: string, direction: 'up' | 'down') => {
    const currentList = [...dynamicHouses];
    const currentIndex = currentList.indexOf(houseName);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    
    const updatedList = [...currentList];
    const temp = updatedList[currentIndex];
    updatedList[currentIndex] = updatedList[targetIndex];
    updatedList[targetIndex] = temp;
    
    if (onUpdateHouses) {
      onUpdateHouses(updatedList, deletedHouses);
    }
    
    setFeedbackMsg(`"${houseName}" বাড়িটি ${direction === 'up' ? '১ ধাপ উপরে' : '১ ধাপ নিচে'} স্থানান্তর করা হয়েছে।`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Move house to top or bottom
  const handleMoveHouseToExtreme = (houseName: string, target: 'top' | 'bottom') => {
    const currentList = [...dynamicHouses];
    const currentIndex = currentList.indexOf(houseName);
    if (currentIndex === -1) return;

    currentList.splice(currentIndex, 1);
    if (target === 'top') {
      currentList.unshift(houseName);
    } else {
      currentList.push(houseName);
    }

    if (onUpdateHouses) {
      onUpdateHouses(currentList, deletedHouses);
    }
    
    setFeedbackMsg(`"${houseName}" বাড়িটি ${target === 'top' ? 'একদম শীর্ষে' : 'একদম নিচে'} স্থানান্তর করা হয়েছে।`);
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Reset order to default
  const handleResetHousesOrder = () => {
    const defaultList = [
      'বৈদ্ব্য বাড়ী',
      'বৈদ্য বাড়ী',
      'সওদাগর বাড়ী',
      'চৌধুরী বাড়ী',
      'মিয়াজী বাড়ী',
      'শিকদার বাড়ী',
      'তালুকদার বাড়ী',
      'হাজী বাড়ী',
      'মুন্সী বাড়ী',
      'মাওলানা বাড়ী',
      'ডাক্তার বাড়ী',
      'খান বাড়ী',
      'মোল্লা বাড়ী',
      'মাস্টার বাড়ী',
      'দরবেশ বাড়ী'
    ];
    const defaults = Array.from(new Set(defaultList));
    const others = dynamicHouses.filter((h) => !defaults.includes(h));
    const combined = [...defaults.filter(d => dynamicHouses.includes(d)), ...others].filter(
      (h) => !deletedHouses.includes(h)
    );

    if (onUpdateHouses) {
      onUpdateHouses(combined, deletedHouses);
    }
    setFeedbackMsg('বাড়ি সমূহের ক্রম ডিফল্ট আকারে সাজানো হয়েছে।');
    setTimeout(() => setFeedbackMsg(''), 3000);
  };

  // Receipt Modal State
  const [showReceiptModal, setShowReceiptModal] = React.useState<boolean>(false);
  const [selectedDonorForReceipt, setSelectedDonorForReceipt] = React.useState<Transaction | null>(null);

  // PDF & Image Export States
  const [isExportingPdf, setIsExportingPdf] = React.useState<boolean>(false);
  const [isExportingJpg, setIsExportingJpg] = React.useState<boolean>(false);

  // Keep selected houses valid
  React.useEffect(() => {
    if (dynamicHouses.length > 0 && !dynamicHouses.includes(selectedHouse)) {
      setSelectedHouse(dynamicHouses[0]);
    }
    if (dynamicHouses.length > 1 && (!secondHouseForDual || secondHouseForDual === selectedHouse)) {
      const other = dynamicHouses.find((h) => h !== selectedHouse);
      if (other) setSecondHouseForDual(other);
    }
  }, [dynamicHouses, selectedHouse]);

  // Translate numbers to Bengali digits
  const toBanglaNum = (num: number | string | undefined | null): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null || num === '') return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Helper to get house serial number based on dynamicHouses list
  const getHouseSerialNum = (houseName: string): number => {
    const idx = dynamicHouses.indexOf(houseName);
    return idx >= 0 ? idx + 1 : 1;
  };

  // Convert Gregorian date (YYYY-MM-DD) to readable English/Bangla standard format
  const toEnglishDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  };

  // Convert number to Bengali words
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

  // Year filtered transactions
  const yearFilteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      if (selectedYear === 'all') return true;
      const tY = t.year ? t.year.toString() : (t.date ? t.date.split('-')[0] : '2026');
      return tY === selectedYear;
    });
  }, [transactions, selectedYear]);

  // Helper to sort donors by custom order
  const sortDonorsList = React.useCallback((donorList: Transaction[], house: string) => {
    if (!house || donorList.length <= 1) return donorList;
    const key = `${selectedYear === 'all' ? '2026' : selectedYear}_${house}`;
    let customOrder: string[] | null = null;
    if (donorOrders && donorOrders[key] && Array.isArray(donorOrders[key])) {
      customOrder = donorOrders[key];
    } else {
      try {
        const saved = localStorage.getItem(`donor_order_${key}`);
        if (saved) customOrder = JSON.parse(saved);
      } catch {}
    }

    if (!customOrder || !Array.isArray(customOrder) || customOrder.length === 0) {
      return donorList;
    }

    return [...donorList].sort((a, b) => {
      const idxA = customOrder!.indexOf(a.id);
      const idxB = customOrder!.indexOf(b.id);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return 0;
    });
  }, [donorOrders, selectedYear]);

  // House 1 Donors
  const selectedHouseDonors = React.useMemo(() => {
    const list = yearFilteredTransactions.filter(
      (t) => t.type === 'income' && t.houseName === selectedHouse
    );
    return sortDonorsList(list, selectedHouse);
  }, [yearFilteredTransactions, selectedHouse, sortDonorsList]);

  // House 2 Donors (for Dual sheet mode)
  const secondHouseDonors = React.useMemo(() => {
    const list = yearFilteredTransactions.filter(
      (t) => t.type === 'income' && t.houseName === secondHouseForDual
    );
    return sortDonorsList(list, secondHouseForDual);
  }, [yearFilteredTransactions, secondHouseForDual, sortDonorsList]);

  // Donor reorder handlers
  const handleMoveDonor = (donorId: string, direction: 'up' | 'down', targetHouse: string = selectedHouse) => {
    const allDonorsOfHouse = yearFilteredTransactions.filter((t) => t.type === 'income' && t.houseName === targetHouse);
    const sorted = sortDonorsList(allDonorsOfHouse, targetHouse);
    const currentIndex = sorted.findIndex((d) => d.id === donorId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const updated = [...sorted];
    const [movedDonor] = updated.splice(currentIndex, 1);
    updated.splice(newIndex, 0, movedDonor);

    const newOrderedIds = updated.map((d) => d.id);
    const y = selectedYear === 'all' ? '2026' : selectedYear;
    const key = `${y}_${targetHouse}`;

    try {
      localStorage.setItem(`donor_order_${key}`, JSON.stringify(newOrderedIds));
    } catch {}

    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(key, newOrderedIds);
    }
  };

  const handleMoveDonorToExtreme = (donorId: string, position: 'top' | 'bottom', targetHouse: string = selectedHouse) => {
    const allDonorsOfHouse = yearFilteredTransactions.filter((t) => t.type === 'income' && t.houseName === targetHouse);
    const sorted = sortDonorsList(allDonorsOfHouse, targetHouse);
    const currentIndex = sorted.findIndex((d) => d.id === donorId);
    if (currentIndex === -1) return;

    const updated = [...sorted];
    const [movedDonor] = updated.splice(currentIndex, 1);
    if (position === 'top') {
      updated.unshift(movedDonor);
    } else {
      updated.push(movedDonor);
    }

    const newOrderedIds = updated.map((d) => d.id);
    const y = selectedYear === 'all' ? '2026' : selectedYear;
    const key = `${y}_${targetHouse}`;

    try {
      localStorage.setItem(`donor_order_${key}`, JSON.stringify(newOrderedIds));
    } catch {}

    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(key, newOrderedIds);
    }
  };

  const handleResetDonorOrder = (targetHouse: string = selectedHouse) => {
    const y = selectedYear === 'all' ? '2026' : selectedYear;
    const key = `${y}_${targetHouse}`;
    try {
      localStorage.removeItem(`donor_order_${key}`);
    } catch {}
    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(key, []);
    }
  };

  // All Income Transactions with Search query (for Receipts view)
  const filteredReceiptTransactions = React.useMemo(() => {
    return yearFilteredTransactions
      .filter((t) => t.type === 'income')
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        const q = searchQuery.toLowerCase().trim();
        const donorMatch = t.donorName?.toLowerCase().includes(q);
        const houseMatch = t.houseName?.toLowerCase().includes(q);
        const receiptMatch = t.receiptNo?.toString().toLowerCase().includes(q);
        const catMatch = t.category?.toLowerCase().includes(q);
        return donorMatch || houseMatch || receiptMatch || catMatch;
      });
  }, [yearFilteredTransactions, searchQuery]);

  // Statistics Summary
  const houseSummaryStats = React.useMemo(() => {
    const totalDonors = selectedHouseDonors.length;
    const totalCash = selectedHouseDonors.reduce((sum, t) => sum + (t.amount || 0), 0);
    const itemDonors = selectedHouseDonors.filter((t) => t.donationType === 'item' || t.itemName).length;
    return { totalDonors, totalCash, itemDonors };
  }, [selectedHouseDonors]);

  // Helper to render Denomination / Amount Figures Breakdown Box ("আদায় ফিগার বিবরণ" / ডেনোট)
  const renderDenominationBox = (donors: Transaction[], compact = false) => {
    const figureCounts = donors.reduce<{ [key: string]: number }>((acc, donor) => {
      if (donor.donationType === 'item' || (donor.itemName && (!donor.amount || donor.amount === 0))) {
        acc['item'] = (acc['item'] || 0) + 1;
      } else if (donor.amount > 0) {
        const key = donor.amount.toString();
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    }, {});

    const sortedAmounts = Object.keys(figureCounts)
      .filter((k) => k !== 'item')
      .map(Number)
      .sort((a, b) => b - a);

    if (compact) {
      return (
        <div className="shrink-0 border border-gray-900 rounded px-1.5 py-0.5 bg-white text-center flex flex-col justify-center min-w-[130px] max-w-[240px]">
          <div className="text-[9px] font-black text-black border-b border-gray-400 pb-0.5 mb-0.5 bg-gray-100 px-1 rounded-xs flex items-center justify-between">
            <span>আদায় ফিগার বিবরণ</span>
            <span className="text-[8.5px] font-bold text-gray-700">({toBanglaNum(donors.length)}টি)</span>
          </div>
          {sortedAmounts.length > 0 || figureCounts['item'] ? (
            <div className={`grid ${sortedAmounts.length > 1 ? 'grid-cols-2' : 'grid-cols-1'} gap-x-2 gap-y-0.5 text-[8.5px] font-bold text-black text-left`}>
              {sortedAmounts.map((amt) => (
                <div key={amt} className="flex justify-between items-center border-b border-dotted border-gray-300 pr-0.5 whitespace-nowrap">
                  <span className="text-gray-800">৳{toBanglaNum(amt.toLocaleString('bn-BD'))}:</span>
                  <span className="font-black text-black ml-1">{toBanglaNum(figureCounts[amt.toString()])}টি</span>
                </div>
              ))}
              {figureCounts['item'] && (
                <div className="flex justify-between items-center border-b border-dotted border-gray-300 pr-0.5 col-span-2 whitespace-nowrap">
                  <span className="text-gray-800">📦 পণ্য:</span>
                  <span className="font-black text-black ml-1">{toBanglaNum(figureCounts['item'])}টি</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[8.5px] text-gray-400 italic py-0.5">কোনো তথ্য নেই</div>
          )}
        </div>
      );
    }

    return (
      <div className="shrink-0 border border-gray-900 rounded p-1.5 bg-white text-center flex flex-col justify-center min-w-[140px] max-w-[210px]">
        <div className="text-[10px] font-black text-black border-b border-gray-400 pb-0.5 mb-1 bg-gray-100 px-1 rounded-xs flex items-center justify-between">
          <span>আদায় ফিগার বিবরণ</span>
          <span className="text-[9px] font-bold text-gray-700">({toBanglaNum(donors.length)}টি)</span>
        </div>
        {sortedAmounts.length > 0 || figureCounts['item'] ? (
          <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] font-bold text-black text-left">
            {sortedAmounts.map((amt) => (
              <div key={amt} className="flex justify-between items-center border-b border-dotted border-gray-300 pr-0.5">
                <span className="text-gray-800">৳{toBanglaNum(amt.toLocaleString('bn-BD'))}:</span>
                <span className="font-black text-black">{toBanglaNum(figureCounts[amt.toString()])}টি</span>
              </div>
            ))}
            {figureCounts['item'] && (
              <div className="flex justify-between items-center border-b border-dotted border-gray-300 pr-0.5 col-span-2 sm:col-span-1">
                <span className="text-gray-800">📦 পণ্য:</span>
                <span className="font-black text-black">{toBanglaNum(figureCounts['item'])}টি</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-[9px] text-gray-400 italic py-0.5">কোনো তথ্য নেই</div>
        )}
      </div>
    );
  };

  // Export Sheet to PDF
  const handleDownloadSheetPDF = async () => {
    const printArea = document.getElementById('admin-cpanel-sheet-print-area');
    if (!printArea) return;

    setIsExportingPdf(true);
    try {
      const originalWindowScrollY = window.scrollY;
      const originalWindowScrollX = window.scrollX;

      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 60));

      const canvas = await renderSafeCanvas(printArea, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 850,
        onclone: (clonedDoc: Document) => {
          const clonedPrintArea = clonedDoc.getElementById('admin-cpanel-sheet-print-area') as HTMLElement | null;
          if (clonedPrintArea) {
            clonedPrintArea.style.width = '794px';
            clonedPrintArea.style.padding = '18px 22px';
            clonedPrintArea.style.boxSizing = 'border-box';
            clonedPrintArea.style.backgroundColor = '#ffffff';
          }
        }
      });

      window.scrollTo(originalWindowScrollX, originalWindowScrollY);

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const imgWidth = 210;
      const pageHeight = 297;
      const margin = 5;
      const contentWidth = imgWidth - (margin * 2);
      const contentHeight = (canvas.height * contentWidth) / canvas.width;

      if (contentHeight > (pageHeight - (margin * 2))) {
        pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, pageHeight - (margin * 2));
      } else {
        const yOffset = (pageHeight - contentHeight) / 2;
        pdf.addImage(imgData, 'JPEG', margin, yOffset, contentWidth, contentHeight);
      }

      const fileName = sheetLayout === 'dual'
        ? `${selectedHouse || 'house1'}_ও_${secondHouseForDual || 'house2'}_আদায়_শিট_${selectedYear}.pdf`
        : `${selectedHouse || 'collection'}_আদায়_শিট_${selectedYear}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating Sheet PDF:', error);
      alert('পিডিএফ ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Sheet to JPG Image
  const handleDownloadSheetJPG = async () => {
    const printArea = document.getElementById('admin-cpanel-sheet-print-area');
    if (!printArea) return;

    setIsExportingJpg(true);
    try {
      const originalWindowScrollY = window.scrollY;
      const originalWindowScrollX = window.scrollX;

      window.scrollTo(0, 0);
      await new Promise((resolve) => setTimeout(resolve, 60));

      const canvas = await renderSafeCanvas(printArea, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 850
      });

      window.scrollTo(originalWindowScrollX, originalWindowScrollY);

      const fileName = sheetLayout === 'dual'
        ? `${selectedHouse || 'house1'}_ও_${secondHouseForDual || 'house2'}_আদায়_শিট_${selectedYear}.jpg`
        : `${selectedHouse || 'collection'}_আদায়_শিট_${selectedYear}.jpg`;

      downloadCanvasAsImage(canvas, fileName, 'image/jpeg');
    } catch (error) {
      console.error('Error exporting sheet image:', error);
      alert('ছবি তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExportingJpg(false);
    }
  };

  // Direct Print via Browser
  const handleDirectPrint = () => {
    window.print();
  };

  return (
    <div id="cpanel-collection-sheets-module" className="space-y-6 animate-fade-in text-[#3c3c3c]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#042f2e] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-400/10 rounded-full blur-2xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2">
              <span className="p-2 bg-emerald-500/20 border border-emerald-400/30 rounded-xl text-emerald-300">
                <Building2 className="h-6 w-6" />
              </span>
              <div>
                <h3 className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>কালেকশন শিট ও রসিদ ব্যবস্থাপনা</span>
                  <span className="text-[10px] font-extrabold bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full">
                    অফিসিয়াল কেন্দ্র
                  </span>
                </h3>
                <p className="text-xs text-emerald-100/90 font-light">
                  সকল ধরনের বাড়ি ভিত্তিক চাঁদা আদায় শিট, চাঁদার রশিদ, A4 সাইজ PDF ও JPG ইমেজ ডাউনলোড করুন।
                </p>
              </div>
            </div>
          </div>

          {/* View Mode Switcher Pills */}
          <div className="flex items-center gap-1.5 bg-black/30 p-1 rounded-xl border border-emerald-400/30 self-start md:self-auto shrink-0">
            <button
              id="cpanel-mode-sheets-btn"
              type="button"
              onClick={() => setActiveViewMode('sheets')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeViewMode === 'sheets'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <FileText className="h-4 w-4" />
              <span>বাড়ি ভিত্তিক কালেকশন শিট</span>
            </button>
            <button
              id="cpanel-mode-receipts-btn"
              type="button"
              onClick={() => setActiveViewMode('receipts')}
              className={`px-3.5 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center space-x-1.5 ${
                activeViewMode === 'receipts'
                  ? 'bg-amber-400 text-slate-950 shadow-md font-black'
                  : 'text-white/80 hover:text-white hover:bg-white/10'
              }`}
            >
              <Receipt className="h-4 w-4" />
              <span>চাঁদার রশিদ কেন্দ্র ({toBanglaNum(filteredReceiptTransactions.length)})</span>
            </button>
          </div>
        </div>
      </div>

      {/* ===================== VIEW 1: HOUSE COLLECTION SHEETS ===================== */}
      {activeViewMode === 'sheets' && (
        <div className="space-y-6">
          {/* Feedback Message Alert */}
          {feedbackMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-300 text-[#064e3b] rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-2xs">
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{feedbackMsg}</span>
              </div>
            </div>
          )}

          {/* Controls Bar: House Selector, Year, Layout Mode, Actions */}
          <div className="bg-white border border-[#cbd5e1] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
              {/* Primary House Selection with Navigation & Reordering */}
              <div className="md:col-span-5">
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[#0f766e] text-[11px] font-black uppercase tracking-wider">
                    মূল বাড়ি নির্বাচন করুন:
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowReorderModal(true)}
                    className="px-2 py-0.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded text-[10px] font-extrabold flex items-center space-x-1 cursor-pointer transition shadow-2xs"
                    title="প্রিন্টের সুবিধার্থে বাড়ির ক্রম সাজান ও মুভ করুন"
                  >
                    <ListOrdered className="h-3 w-3" />
                    <span>ক্রম সাজান</span>
                  </button>
                </div>
                
                <div className="flex items-center space-x-1">
                  {/* Previous House button */}
                  <button
                    type="button"
                    disabled={dynamicHouses.indexOf(selectedHouse) <= 0}
                    onClick={() => {
                      const curIdx = dynamicHouses.indexOf(selectedHouse);
                      if (curIdx > 0) {
                        setSelectedHouse(dynamicHouses[curIdx - 1]);
                      }
                    }}
                    className="p-2 bg-[#f8fafc] hover:bg-gray-100 border border-[#cbd5e1] rounded-xl text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="পূর্ববর্তী বাড়ি"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>

                  {/* Main House Dropdown */}
                  <div className="relative flex-grow">
                    <select
                      id="cpanel-house-select-main"
                      value={selectedHouse}
                      onChange={(e) => setSelectedHouse(e.target.value)}
                      className="w-full px-3 py-2 bg-[#f8fafc] border-2 border-[#cbd5e1] focus:border-[#0f766e] rounded-xl text-xs font-bold text-gray-800 focus:outline-none transition shadow-2xs"
                    >
                      {dynamicHouses.map((h, i) => {
                        const count = yearFilteredTransactions.filter(
                          (t) => t.type === 'income' && t.houseName === h
                        ).length;
                        return (
                          <option key={h} value={h}>
                            {toBanglaNum(i + 1)}. {h} ({toBanglaNum(count)} জন দাতা)
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Next House button */}
                  <button
                    type="button"
                    disabled={dynamicHouses.indexOf(selectedHouse) >= dynamicHouses.length - 1}
                    onClick={() => {
                      const curIdx = dynamicHouses.indexOf(selectedHouse);
                      if (curIdx !== -1 && curIdx < dynamicHouses.length - 1) {
                        setSelectedHouse(dynamicHouses[curIdx + 1]);
                      }
                    }}
                    className="p-2 bg-[#f8fafc] hover:bg-gray-100 border border-[#cbd5e1] rounded-xl text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                    title="পরবর্তী বাড়ি"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>

                  {/* Quick Move Up/Down Buttons for Selected House */}
                  <div className="flex items-center space-x-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200">
                    <button
                      type="button"
                      disabled={dynamicHouses.indexOf(selectedHouse) <= 0}
                      onClick={() => handleMoveHouse(selectedHouse, 'up')}
                      className="p-1 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="এই বাড়িটি ১ ধাপ উপরে তুলুন"
                    >
                      <ChevronUp className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={dynamicHouses.indexOf(selectedHouse) >= dynamicHouses.length - 1}
                      onClick={() => handleMoveHouse(selectedHouse, 'down')}
                      className="p-1 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-200 rounded disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="এই বাড়িটি ১ ধাপ নিচে নামান"
                    >
                      <ChevronDown className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Year Selector */}
              <div className="md:col-span-2">
                <label className="block text-[#0f766e] text-[11px] font-black uppercase tracking-wider mb-1">
                  হিসাব বছর:
                </label>
                <select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border-2 border-[#cbd5e1] focus:border-[#0f766e] rounded-xl text-xs font-bold text-gray-800 focus:outline-none transition"
                >
                  <option value="2027">২০২৭ খ্রি.</option>
                  <option value="2026">২০২৬ খ্রি.</option>
                  <option value="2025">২০২৫ খ্রি.</option>
                  <option value="2024">২০২৪ খ্রি.</option>
                  <option value="all">সকল বছর</option>
                </select>
              </div>

              {/* Format Layout Switcher (Single vs Dual) */}
              <div className="md:col-span-2">
                <label className="block text-[#0f766e] text-[11px] font-black uppercase tracking-wider mb-1">
                  শিট লেআউট:
                </label>
                <div className="grid grid-cols-2 gap-1 bg-[#f1f5f9] p-1 rounded-xl border border-[#cbd5e1]">
                  <button
                    type="button"
                    onClick={() => setSheetLayout('single')}
                    className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                      sheetLayout === 'single'
                        ? 'bg-[#0f766e] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#064e3b]'
                    }`}
                  >
                    একক বাড়ি
                  </button>
                  <button
                    type="button"
                    onClick={() => setSheetLayout('dual')}
                    className={`py-1.5 rounded-lg text-[10px] font-black transition cursor-pointer text-center ${
                      sheetLayout === 'dual'
                        ? 'bg-[#0f766e] text-white shadow-xs'
                        : 'text-gray-600 hover:text-[#064e3b]'
                    }`}
                  >
                    ২টি বাড়ি
                  </button>
                </div>
              </div>

              {/* Dual House Second Selection if dual mode is on */}
              {sheetLayout === 'dual' && (
                <div className="md:col-span-3">
                  <label className="block text-[#0f766e] text-[11px] font-black uppercase tracking-wider mb-1">
                    ২য় বাড়ি নির্বাচন:
                  </label>
                  <select
                    value={secondHouseForDual}
                    onChange={(e) => setSecondHouseForDual(e.target.value)}
                    className="w-full px-3 py-2 bg-[#f8fafc] border-2 border-[#cbd5e1] focus:border-[#0f766e] rounded-xl text-xs font-bold text-gray-800 focus:outline-none transition"
                  >
                    {dynamicHouses
                      .filter((h) => h !== selectedHouse)
                      .map((h, i) => (
                        <option key={h} value={h}>
                          {toBanglaNum(i + 1)}. {h}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Quick Export & Print Action Buttons Bar */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e2e8f0]">
              {/* Summary Stats on Left */}
              <div className="flex items-center gap-3 text-xs font-bold text-gray-700 flex-wrap">
                <span className="bg-emerald-50 text-[#064e3b] border border-emerald-200 px-2.5 py-1 rounded-lg">
                  মোট দাতা: <span className="font-black text-[#0f766e]">{toBanglaNum(houseSummaryStats.totalDonors)} জন</span>
                </span>
                <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
                  নগদ আদায়: <span className="font-black text-amber-700">৳ {toBanglaNum(houseSummaryStats.totalCash.toLocaleString('bn-BD'))}/-</span>
                </span>
                {houseSummaryStats.itemDonors > 0 && (
                  <span className="bg-purple-50 text-purple-900 border border-purple-200 px-2.5 py-1 rounded-lg">
                    পণ্য সামগ্রী: <span className="font-black text-purple-700">{toBanglaNum(houseSummaryStats.itemDonors)}টি</span>
                  </span>
                )}
              </div>

              {/* Download & Print Buttons on Right */}
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  id="cpanel-download-sheet-pdf-btn"
                  type="button"
                  onClick={handleDownloadSheetPDF}
                  disabled={isExportingPdf}
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <Download className={`h-4 w-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
                  <span>{isExportingPdf ? 'PDF তৈরি হচ্ছে...' : 'A4 PDF ডাউনলোড'}</span>
                </button>

                <button
                  id="cpanel-download-sheet-jpg-btn"
                  type="button"
                  onClick={handleDownloadSheetJPG}
                  disabled={isExportingJpg}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  <ImageIcon className="h-4 w-4" />
                  <span>{isExportingJpg ? 'JPG তৈরি হচ্ছে...' : 'JPG ইমেজ ডাউনলোড'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setDonorReorderTargetHouse(selectedHouse);
                    setShowDonorReorderModal(true);
                  }}
                  className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                  title="প্রিন্ট বা কালেকশন শিটের আগে দাতার নামের ক্রম উপরে-নিচে পরিবর্তন করুন"
                >
                  <ArrowUpDown className="h-4 w-4" />
                  <span>দাতার ক্রম পরিবর্তন</span>
                </button>

                <button
                  id="cpanel-print-sheet-direct-btn"
                  type="button"
                  onClick={handleDirectPrint}
                  className="px-3.5 py-2 bg-white hover:bg-[#f1f5f9] text-gray-800 text-xs font-bold rounded-xl border border-[#cbd5e1] shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4 text-[#0f766e]" />
                  <span>সরাসরি প্রিন্ট</span>
                </button>
              </div>
            </div>
          </div>

          {/* Live Document Preview Card */}
          <div className="bg-[#f1f5f9] p-3 sm:p-6 rounded-2xl border border-[#cbd5e1] shadow-inner flex justify-center overflow-x-auto">
            {/* Ink-Friendly Clean Official Sheet */}
            <div
              id="admin-cpanel-sheet-print-area"
              className={`text-black font-sans bg-white w-full max-w-[794px] ${sheetLayout === 'single' ? 'min-h-[1100px] justify-between p-3.5 sm:p-5' : 'min-h-0 justify-start p-4 sm:p-6'} border border-gray-900 shadow-xl rounded-sm flex flex-col`}
            >
              {sheetLayout === 'single' ? (
                /* ================= SINGLE HOUSE LAYOUT (24 ROWS, CLEAN & NO SIGNATURES) ================= */
                <div className="space-y-2 flex-grow flex flex-col justify-between">
                  <div className="space-y-2">
                    {/* Clean Islamic & Organization Header */}
                    <div className="border-b-2 border-gray-900 pb-1.5">
                      {/* Bismillah */}
                      <div className="text-center mb-0.5">
                        <span className="text-xs font-serif font-bold text-gray-800 tracking-wider block">
                          بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                        </span>
                        <span className="text-[10px] text-gray-600 font-medium tracking-widest uppercase">
                          বিসমিল্লাহির রাহমানির রাহিম
                        </span>
                      </div>

                      {/* Logo & Main Title Row */}
                      <div className="flex items-center justify-between gap-3 pt-0.5">
                        {/* Left: Organization Logo */}
                        <div className="shrink-0">
                          <img
                            src={logo}
                            onError={handleLogoError}
                            alt="Logo"
                            className="w-13 h-13 sm:w-15 sm:h-15 object-contain rounded-full border border-gray-800 p-0.5 bg-white"
                            referrerPolicy="no-referrer"
                          />
                        </div>

                        {/* Center: Headline and Address */}
                        <div className="text-center flex-grow space-y-0.5">
                          <h1 className="text-base sm:text-xl font-black text-black tracking-tight leading-tight">
                            পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
                          </h1>
                          <p className="text-xs sm:text-[12px] text-gray-800 font-bold">
                            সোনারগাঁও, তুপ্পারপাড়, রাঙ্গুনিয়া, চট্টগ্রাম।
                          </p>
                          <div className="pt-0.5">
                            <span className="inline-block text-black font-black text-xs sm:text-[12px] tracking-wide">
                              বাড়ি ভিত্তিক চাঁদা আদায় খাতা / কালেকশন শিট ({toBanglaNum(selectedYear)} খ্রি.)
                            </span>
                          </div>
                        </div>

                        {/* Right: Denomination / Amount Figures Breakdown Box */}
                        {renderDenominationBox(selectedHouseDonors, false)}
                      </div>
                    </div>

                    {/* Metadata Row */}
                    <div className="grid grid-cols-2 gap-3 text-xs border border-gray-800 rounded p-1.5 bg-white">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-gray-700 font-bold">বাড়ির নাম:</span>
                          <span className="text-sm font-black text-black">
                            {toBanglaNum(getHouseSerialNum(selectedHouse))}. {selectedHouse}
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-gray-700 font-bold">মোট দাতা সংখ্যা:</span>
                          <span className="font-extrabold text-black">{toBanglaNum(selectedHouseDonors.length)} জন</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <div className="flex items-baseline justify-end space-x-1.5">
                          <span className="text-gray-700 font-bold">মুদ্রণের তারিখ:</span>
                          <span className="font-bold text-black">{toEnglishDate(new Date().toISOString().slice(0, 10))}</span>
                        </div>
                        <div className="flex items-baseline justify-end space-x-1.5">
                          <span className="text-gray-700 font-bold">আদায়কারী:</span>
                          <span className="font-bold text-black underline">.......................................</span>
                        </div>
                      </div>
                    </div>

                    {/* Official Table with Full 24 Rows */}
                    <div className="border border-gray-900 w-full">
                      <table className="w-full border-collapse border border-gray-900 text-xs text-center">
                        <thead>
                          <tr className="bg-gray-100 text-black border-b border-gray-900 font-black">
                            <th className="border border-gray-900 px-1 py-1.5 w-12 text-[11px] align-middle text-center">
                              ক্র.
                            </th>
                            <th className="border border-gray-900 px-3 py-1.5 text-[12px] align-middle text-center">
                              চাঁদাদাতার নাম
                            </th>
                            <th className="border border-gray-900 px-2 py-1.5 w-32 text-[12px] align-middle text-center">
                              পরিমাণ (টাকা / পণ্য)
                            </th>
                            <th className="border border-gray-900 px-1.5 py-1.5 w-20 text-[11px] align-middle text-center">
                              রশিদ নং
                            </th>
                            <th className="border border-gray-900 px-1.5 py-1.5 w-24 text-[11px] align-middle text-center">
                              তারিখ
                            </th>
                            <th className="border border-gray-900 px-1.5 py-1.5 w-36 text-[11px] align-middle text-center">
                              মন্তব্য
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedHouseDonors.slice(0, 24).map((donor, idx) => (
                            <tr key={donor.id} className="bg-white border-b border-gray-400 h-[34px] hover:bg-gray-50">
                              <td className="border border-gray-900 px-1 py-0.5 text-center font-bold text-gray-900 align-middle text-[11px]">
                                <span>{toBanglaNum(idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-3 py-0.5 text-center font-bold text-black align-middle text-[12px] truncate max-w-[220px]">
                                <span>{donor.donorName}</span>
                              </td>
                              <td className="border border-gray-900 px-2 py-0.5 text-center font-black text-black align-middle text-[12px]">
                                {donor.donationType === 'item' || donor.itemName ? (
                                  <span className="text-[11px] text-purple-900 font-black">📦 {donor.itemName}</span>
                                ) : (
                                  <span>৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-</span>
                                )}
                              </td>
                              <td className="border border-gray-900 px-1.5 py-0.5 text-center font-semibold text-gray-800 align-middle text-[11px]">
                                <span>{donor.receiptNo ? toBanglaNum(donor.receiptNo) : '—'}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 py-0.5 text-center font-semibold text-gray-800 align-middle text-[11px]">
                                <span>{toEnglishDate(donor.date)}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 py-0.5 text-center text-gray-700 align-middle text-[11px]">
                                <span>{donor.notes || (donor.itemName ? donor.itemName : '')}</span>
                              </td>
                            </tr>
                          ))}

                          {/* Empty Filling Rows up to 24 Rows */}
                          {Array.from({ length: Math.max(0, 24 - Math.min(24, selectedHouseDonors.length)) }).map((_, idx) => (
                            <tr key={`empty-${idx}`} className="h-[34px] bg-white border-b border-gray-400">
                              <td className="border border-gray-900 px-1 py-0.5 text-center font-medium text-gray-400 align-middle text-[11px]">
                                <span>{toBanglaNum(Math.min(24, selectedHouseDonors.length) + idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-3 py-0.5 align-middle"></td>
                              <td className="border border-gray-900 px-2 py-0.5 align-middle"></td>
                              <td className="border border-gray-900 px-1.5 py-0.5 align-middle"></td>
                              <td className="border border-gray-900 px-1.5 py-0.5 align-middle"></td>
                              <td className="border border-gray-900 px-1.5 py-0.5 align-middle"></td>
                            </tr>
                          ))}

                          {/* Total Calculation Row */}
                          {(() => {
                            const totalCash = selectedHouseDonors.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const totalItems = selectedHouseDonors.filter((t) => t.donationType === 'item' || t.itemName).length;
                            return (
                              <tr className="bg-gray-100 font-black text-black border-t border-gray-900">
                                <td colSpan={2} className="border border-gray-900 px-3 pt-1.5 pb-2 text-right text-[11px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">সর্বমোট আদায়:</span>
                                </td>
                                <td className="border border-gray-900 px-2 pt-1.5 pb-2 text-center text-[11px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">
                                    ৳ {toBanglaNum(totalCash.toLocaleString('bn-BD'))}/-
                                    {totalItems > 0 && <span className="block text-[9px]">(+{toBanglaNum(totalItems)} পণ্য)</span>}
                                  </span>
                                </td>
                                <td colSpan={3} className="border border-gray-900 px-2 pt-1.5 pb-2 text-left text-[10px] text-gray-700 italic align-middle leading-snug pl-2">
                                  <span className="inline-block relative -top-0.5">{totalCash > 0 ? `কথায়: ${toBanglaWords(totalCash)}` : 'পণ্য সামগ্রী'}</span>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Clean Footer Note */}
                  <div className="pt-2 border-t border-gray-400 flex justify-between items-center text-[9.5px] text-gray-600 font-medium">
                    <span>* রশিদ ছাড়া কোন প্রকার চাঁদা বা অনুদান গ্রহণযোগ্য নয়।</span>
                    <span>মুদ্রণ প্রস্তুত: সোনারগাঁও ঈদে মিলাদুন্নবী (দঃ) পরিষদ সফটওয়্যার</span>
                  </div>
                </div>
              ) : (
                /* ================= DUAL HOUSE LAYOUT (2 HOUSES IN ONE A4 PAGE) ================= */
                <div className="space-y-3 w-full">
                  {/* House 1 Portion */}
                  <div className="space-y-2">
                    {/* Islamic Bismillah */}
                    <div className="text-center mb-0.5">
                      <span className="text-[10px] font-serif font-bold text-gray-800 tracking-wider block">
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </span>
                      <span className="text-[8px] text-gray-600 font-medium tracking-widest uppercase">
                        বিসমিল্লাহির রাহমানির রাহিম
                      </span>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-900 pb-1 gap-2">
                      <div className="flex items-center space-x-2 shrink-0">
                        <img
                          src={logo}
                          onError={handleLogoError}
                          alt="Logo"
                          className="w-10 h-10 rounded-full border border-gray-800 object-contain p-0.5 bg-white shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h2 className="text-xs sm:text-[13px] font-black text-black leading-tight">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h2>
                          <p className="text-[9px] sm:text-[9.5px] text-gray-700 font-bold leading-tight">সোনারগাঁও, তুপ্পারপাড়, রাঙ্গুনিয়া, চট্টগ্রাম।</p>
                          <p className="text-[9px] text-black font-extrabold leading-tight">কালেকশন শিট ({toBanglaNum(selectedYear)} খ্রি.)</p>
                        </div>
                      </div>

                      {/* Denomination Box */}
                      {renderDenominationBox(selectedHouseDonors, true)}
                    </div>

                    {/* Metadata Row (Identical to Single House Layout) */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] border border-gray-800 rounded p-1.5 bg-white">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-gray-700 font-bold">বাড়ির নাম:</span>
                          <span className="text-xs font-black text-black">
                            {toBanglaNum(getHouseSerialNum(selectedHouse))}. {selectedHouse}
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-gray-700 font-bold">মোট দাতা সংখ্যা:</span>
                          <span className="font-extrabold text-black">{toBanglaNum(selectedHouseDonors.length)} জন</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <div className="flex items-baseline justify-end space-x-1.5">
                          <span className="text-gray-700 font-bold">মুদ্রণের তারিখ:</span>
                          <span className="font-bold text-black">{toEnglishDate(new Date().toISOString().slice(0, 10))}</span>
                        </div>
                        <div className="flex items-baseline justify-end space-x-1.5">
                          <span className="text-gray-700 font-bold">আদায়কারী:</span>
                          <span className="font-bold text-black underline">.......................................</span>
                        </div>
                      </div>
                    </div>

                    {/* 10 Rows Table for House 1 */}
                    <div className="border border-gray-900">
                      <table className="w-full border-collapse border border-gray-900 text-[10.5px] text-center">
                        <thead>
                          <tr className="bg-gray-100 text-black border-b border-gray-900">
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-8 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">ক্র.</span>
                            </th>
                            <th className="border border-gray-900 px-2 pt-1 pb-1.5 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">চাঁদাদাতার নাম</span>
                            </th>
                            <th className="border border-gray-900 px-1.5 pt-1 pb-1.5 w-28 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">পরিমাণ (টাকা / পণ্য)</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-14 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">রশিদ নং</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-16 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">তারিখ</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-20 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">মন্তব্য</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedHouseDonors.slice(0, 10).map((donor, idx) => (
                            <tr key={donor.id} className="bg-white">
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-bold text-gray-900 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-0.5 pb-1.5 text-center font-bold text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">{donor.donorName}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 pt-0.5 pb-1.5 text-center font-black text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">
                                  {donor.donationType === 'item' || donor.itemName ? (
                                    <span>📦 {donor.itemName}</span>
                                  ) : (
                                    <span>৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-</span>
                                  )}
                                </span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{donor.receiptNo ? toBanglaNum(donor.receiptNo) : '—'}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toEnglishDate(donor.date)}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-gray-400 align-middle"></td>
                            </tr>
                          ))}

                          {Array.from({ length: Math.max(0, 10 - Math.min(10, selectedHouseDonors.length)) }).map((_, idx) => (
                            <tr key={`empty-h1-${idx}`} className="h-6 bg-white">
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-medium text-gray-400 align-middle leading-snug text-[9px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(Math.min(10, selectedHouseDonors.length) + idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1.5 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 align-middle"></td>
                            </tr>
                          ))}

                          {(() => {
                            const totalCash = selectedHouseDonors.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const totalItems = selectedHouseDonors.filter((t) => t.donationType === 'item' || t.itemName).length;
                            return (
                              <tr className="bg-gray-100 font-black text-black border-t border-gray-900">
                                <td colSpan={2} className="border border-gray-900 px-2 pt-1 pb-1.5 text-right text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">মোট আদায়:</span>
                                </td>
                                <td className="border border-gray-900 px-1.5 pt-1 pb-1.5 text-center text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">
                                    ৳ {toBanglaNum(totalCash.toLocaleString('bn-BD'))}/-
                                    {totalItems > 0 && <span className="block text-[8.5px]">(+{toBanglaNum(totalItems)} পণ্য)</span>}
                                  </span>
                                </td>
                                <td colSpan={3} className="border border-gray-900 px-2 pt-1 pb-1.5 text-left text-[9px] text-gray-700 italic align-middle leading-snug pl-2">
                                  <span className="inline-block relative -top-0.5">{totalCash > 0 ? `কথায়: ${toBanglaWords(totalCash)}` : 'পণ্য সামগ্রী'}</span>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Scissor Cut Line Divider (কাটিং অংশ / কাটার দাগ) */}
                  <div className="my-2 border-t-2 border-dashed border-gray-600 relative flex items-center justify-center">
                    <span className="bg-white px-3 text-[9.5px] font-bold text-gray-700 flex items-center gap-1.5 border border-dashed border-gray-400 rounded-full py-0.5 shadow-2xs">
                      <span>✂</span>
                      <span>এখান থেকে কেটে আলাদা করুন (কাটার দাগ)</span>
                      <span>✂</span>
                    </span>
                  </div>

                  {/* House 2 Portion (Starts directly after cut line) */}
                  <div className="space-y-2">
                    {/* Islamic Bismillah */}
                    <div className="text-center mb-0.5">
                      <span className="text-[10px] font-serif font-bold text-gray-800 tracking-wider block">
                        بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                      </span>
                      <span className="text-[8px] text-gray-600 font-medium tracking-widest uppercase">
                        বিসমিল্লাহির রাহমানির রাহিম
                      </span>
                    </div>

                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-gray-900 pb-1 gap-2">
                      <div className="flex items-center space-x-2 shrink-0">
                        <img
                          src={logo}
                          onError={handleLogoError}
                          alt="Logo"
                          className="w-10 h-10 rounded-full border border-gray-800 object-contain p-0.5 bg-white shrink-0"
                          referrerPolicy="no-referrer"
                        />
                        <div>
                          <h2 className="text-xs sm:text-[13px] font-black text-black leading-tight">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h2>
                          <p className="text-[9px] sm:text-[9.5px] text-gray-700 font-bold leading-tight">সোনারগাঁও, তুপ্পারপাড়, রাঙ্গুনিয়া, চট্টগ্রাম।</p>
                          <p className="text-[9px] text-black font-extrabold leading-tight">কালেকশন শিট ({toBanglaNum(selectedYear)} খ্রি.)</p>
                        </div>
                      </div>

                      {/* Denomination Box */}
                      {renderDenominationBox(secondHouseDonors, true)}
                    </div>

                    {/* Metadata Row (Identical to Single House Layout) */}
                    <div className="grid grid-cols-2 gap-2 text-[10px] border border-gray-800 rounded p-1.5 bg-white">
                      <div className="space-y-0.5">
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-gray-700 font-bold">বাড়ির নাম:</span>
                          <span className="text-xs font-black text-black">
                            {toBanglaNum(getHouseSerialNum(secondHouseForDual))}. {secondHouseForDual}
                          </span>
                        </div>
                        <div className="flex items-baseline space-x-1.5">
                          <span className="text-gray-700 font-bold">মোট দাতা সংখ্যা:</span>
                          <span className="font-extrabold text-black">{toBanglaNum(secondHouseDonors.length)} জন</span>
                        </div>
                      </div>
                      <div className="space-y-0.5 text-right">
                        <div className="flex items-baseline justify-end space-x-1.5">
                          <span className="text-gray-700 font-bold">মুদ্রণের তারিখ:</span>
                          <span className="font-bold text-black">{toEnglishDate(new Date().toISOString().slice(0, 10))}</span>
                        </div>
                        <div className="flex items-baseline justify-end space-x-1.5">
                          <span className="text-gray-700 font-bold">আদায়কারী:</span>
                          <span className="font-bold text-black underline">.......................................</span>
                        </div>
                      </div>
                    </div>

                    {/* 10 Rows Table for House 2 */}
                    <div className="border border-gray-900">
                      <table className="w-full border-collapse border border-gray-900 text-[10.5px] text-center">
                        <thead>
                          <tr className="bg-gray-100 text-black border-b border-gray-900">
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-8 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">ক্র.</span>
                            </th>
                            <th className="border border-gray-900 px-2 pt-1 pb-1.5 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">চাঁদাদাতার নাম</span>
                            </th>
                            <th className="border border-gray-900 px-1.5 pt-1 pb-1.5 w-28 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">পরিমাণ (টাকা / পণ্য)</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-14 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">রশিদ নং</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-16 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">তারিখ</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1 pb-1.5 w-20 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">মন্তব্য</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {secondHouseDonors.slice(0, 10).map((donor, idx) => (
                            <tr key={donor.id} className="bg-white">
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-bold text-gray-900 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-0.5 pb-1.5 text-center font-bold text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">{donor.donorName}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 pt-0.5 pb-1.5 text-center font-black text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">
                                  {donor.donationType === 'item' || donor.itemName ? (
                                    <span>📦 {donor.itemName}</span>
                                  ) : (
                                    <span>৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-</span>
                                  )}
                                </span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{donor.receiptNo ? toBanglaNum(donor.receiptNo) : '—'}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toEnglishDate(donor.date)}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-gray-400 align-middle"></td>
                            </tr>
                          ))}

                          {Array.from({ length: Math.max(0, 10 - Math.min(10, secondHouseDonors.length)) }).map((_, idx) => (
                            <tr key={`empty-h2-${idx}`} className="h-6 bg-white">
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 text-center font-medium text-gray-400 align-middle leading-snug text-[9px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(Math.min(10, secondHouseDonors.length) + idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1.5 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-0.5 pb-1.5 align-middle"></td>
                            </tr>
                          ))}

                          {(() => {
                            const totalCash = secondHouseDonors.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const totalItems = secondHouseDonors.filter((t) => t.donationType === 'item' || t.itemName).length;
                            return (
                              <tr className="bg-gray-100 font-black text-black border-t border-gray-900">
                                <td colSpan={2} className="border border-gray-900 px-2 pt-1 pb-1.5 text-right text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">মোট আদায়:</span>
                                </td>
                                <td className="border border-gray-900 px-1.5 pt-1 pb-1.5 text-center text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">
                                    ৳ {toBanglaNum(totalCash.toLocaleString('bn-BD'))}/-
                                    {totalItems > 0 && <span className="block text-[8.5px]">(+{toBanglaNum(totalItems)} পণ্য)</span>}
                                  </span>
                                </td>
                                <td colSpan={3} className="border border-gray-900 px-2 pt-1 pb-1.5 text-left text-[9px] text-gray-700 italic align-middle leading-snug pl-2">
                                  <span className="inline-block relative -top-0.5">{totalCash > 0 ? `কথায়: ${toBanglaWords(totalCash)}` : 'পণ্য সামগ্রী'}</span>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ===================== VIEW 2: DONATION RECEIPTS REPOSITORY ===================== */}
      {activeViewMode === 'receipts' && (
        <div className="space-y-4">
          {/* Search & Filter Bar */}
          <div className="bg-white border border-[#cbd5e1] rounded-2xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  id="cpanel-receipts-search-input"
                  type="text"
                  placeholder="দাতার নাম, বাড়ি বা রশিদ নং দিয়ে খুঁজুন..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-xs text-gray-800 focus:outline-none focus:border-[#0f766e] transition"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end">
                <span className="text-xs font-bold text-[#064e3b] bg-emerald-50 px-3 py-1.5 rounded-xl border border-emerald-200">
                  মোট রশিদ: {toBanglaNum(filteredReceiptTransactions.length)}টি
                </span>
              </div>
            </div>
          </div>

          {/* Receipts Table Grid */}
          <div className="bg-white border border-[#cbd5e1] rounded-2xl shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-[#f1f5f9] text-[#064e3b] font-black border-b border-[#cbd5e1]">
                    <th className="py-3 px-3 w-12 text-center">ক্র.</th>
                    <th className="py-3 px-3">রশিদ নং</th>
                    <th className="py-3 px-3">চাঁদাদাতার নাম</th>
                    <th className="py-3 px-3">বাড়ি / ঠিকানা</th>
                    <th className="py-3 px-3 text-right">টাকার পরিমাণ</th>
                    <th className="py-3 px-3 text-center">তারিখ</th>
                    <th className="py-3 px-3 text-center w-36">রশিদ অ্যাকশন</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e2e8f0]">
                  {filteredReceiptTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-gray-400 italic">
                        কোনো রসিদ বা চাঁদা আদায়ে রেকর্ড পাওয়া যায়নি।
                      </td>
                    </tr>
                  ) : (
                    filteredReceiptTransactions.map((t, idx) => (
                      <tr key={t.id} className="hover:bg-[#f8fafc] transition">
                        <td className="py-3 px-3 text-center font-bold text-gray-500">
                          {toBanglaNum(idx + 1)}
                        </td>
                        <td className="py-3 px-3 font-black text-[#0f766e]">
                          {t.receiptNo ? `#${toBanglaNum(t.receiptNo)}` : 'স্বয়ংক্রিয়'}
                        </td>
                        <td className="py-3 px-3 font-bold text-gray-900">
                          {t.donorName || 'সাধারণ দাতা'}
                        </td>
                        <td className="py-3 px-3">
                          <span className="font-semibold text-gray-700">{t.houseName || 'সরাসরি জমা'}</span>
                        </td>
                        <td className="py-3 px-3 text-right font-black text-emerald-800">
                          {t.donationType === 'item' || t.itemName ? (
                            <span className="text-purple-700 font-bold">📦 {t.itemName}</span>
                          ) : (
                            <span>৳ {toBanglaNum(t.amount.toLocaleString('bn-BD'))}/-</span>
                          )}
                        </td>
                        <td className="py-3 px-3 text-center font-medium text-gray-600 text-[11px]">
                          {toEnglishDate(t.date)}
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDonorForReceipt(t);
                              setShowReceiptModal(true);
                            }}
                            className="px-3 py-1.5 bg-[#0f766e] hover:bg-[#0d9488] text-white text-[11px] font-bold rounded-lg shadow-xs transition flex items-center justify-center space-x-1 w-full cursor-pointer"
                          >
                            <Receipt className="h-3.5 w-3.5" />
                            <span>রশিদ ভিউ ও প্রিন্ট</span>
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ================= HOUSE REORDER & MOVE MANAGER MODAL ================= */}
      {showReorderModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full p-5 sm:p-6 space-y-4 relative border border-[#cbd5e1]">
            {/* Header */}
            <div className="flex justify-between items-start border-b border-gray-100 pb-3">
              <div className="flex items-center space-x-2.5">
                <div className="p-2.5 bg-[#0f766e]/10 text-[#0f766e] rounded-xl">
                  <ListOrdered className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#064e3b]">
                    বাড়ির ক্রম সাজান ও মুভ ম্যানেজার
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">
                    প্রিন্ট ও খাতা তৈরির সুবিধার্থে বাড়িগুলোকে উপরে বা নিচে মুভ করুন
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowReorderModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Instruction Banner */}
            <div className="p-3 bg-[#f0fdf4] border border-[#bbf7d0] rounded-xl text-xs text-[#166534] flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <span className="font-bold">💡 টিপস:</span>
                <span>তীর চিহ্নে (⬆/⬇) ক্লিক করে যেকোনো বাড়ির অবস্থান পরিবর্তন করুন। পরিবর্তন সাথে সাথে কালেকশন শিটে প্রয়োগ হবে।</span>
              </div>
            </div>

            {/* Reorderable House List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100">
              {dynamicHouses.map((house, index) => {
                const isFirst = index === 0;
                const isLast = index === dynamicHouses.length - 1;
                const donorsCount = yearFilteredTransactions.filter(
                  (t) => t.type === 'income' && t.houseName === house
                ).length;

                return (
                  <div
                    key={house}
                    className="flex items-center justify-between p-2.5 bg-gray-50/70 hover:bg-emerald-50/40 rounded-xl border border-gray-200/80 transition"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0f766e] text-white text-xs font-black shrink-0 shadow-2xs">
                        {toBanglaNum(index + 1)}
                      </span>
                      <div className="min-w-0">
                        <span className="font-black text-sm text-gray-900 block truncate">
                          {house}
                        </span>
                        <span className="text-[10px] text-gray-500">
                          {toBanglaNum(donorsCount)} জন দাতা নথিবদ্ধ
                        </span>
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Move to Top */}
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveHouseToExtreme(house, 'top')}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-gray-600 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center space-x-0.5"
                        title="একদম শীর্ষে নিয়ে যান"
                      >
                        <ArrowUp className="h-3 w-3" />
                        <span className="hidden sm:inline">শীর্ষে</span>
                      </button>

                      {/* Move 1 step Up */}
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={() => handleMoveHouse(house, 'up')}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="১ ধাপ উপরে তুলুন"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>

                      {/* Move 1 step Down */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveHouse(house, 'down')}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="১ ধাপ নিচে নামান"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {/* Move to Bottom */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={() => handleMoveHouseToExtreme(house, 'bottom')}
                        className="px-2 py-1 bg-white hover:bg-emerald-50 text-gray-600 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg text-[10px] font-bold disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer flex items-center space-x-0.5"
                        title="একদম নিচে নিয়ে যান"
                      >
                        <ArrowDown className="h-3 w-3" />
                        <span className="hidden sm:inline">নিচে</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Buttons */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-gray-100">
              <button
                type="button"
                onClick={handleResetHousesOrder}
                className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition cursor-pointer"
                title="ডিফল্ট বাড়ি সমূহের ক্রমে ফিরিয়ে নিন"
              >
                ডিফল্ট ক্রমে রিসেট করুন
              </button>

              <button
                type="button"
                onClick={() => setShowReorderModal(false)}
                className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="h-4 w-4" />
                <span>সম্পন্ন / বন্ধ করুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= DONOR REORDER & MOVE MODAL ================= */}
      {showDonorReorderModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full overflow-hidden border border-amber-200 flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#064e3b] text-white px-5 py-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/15 backdrop-blur-xs rounded-xl border border-white/20">
                  <ArrowUpDown className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">
                    চাঁদাদাতার ক্রম পরিবর্তন (উপরে / নিচে মুভ)
                  </h3>
                  <p className="text-[11px] text-emerald-100 font-light mt-0.5">
                    প্রিন্ট ও কালেকশন শিটের আগে দাতার নামের ক্রম সাজান
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDonorReorderModal(false)}
                className="p-1.5 hover:bg-white/20 text-white rounded-lg transition duration-150 cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Target House Switcher */}
            <div className="p-3 bg-gray-50 border-b border-gray-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-2">
                <Home className="h-4 w-4 text-[#0f766e]" />
                <span className="text-xs font-bold text-gray-700">বাড়ি নির্বাচন:</span>
                <select
                  value={donorReorderTargetHouse || selectedHouse}
                  onChange={(e) => setDonorReorderTargetHouse(e.target.value)}
                  className="bg-white border border-gray-300 rounded-lg px-2.5 py-1 text-xs font-black text-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                >
                  {dynamicHouses.map((h) => (
                    <option key={h} value={h}>
                      {h}
                    </option>
                  ))}
                </select>
              </div>

              <span className="text-[11px] font-bold text-gray-500">
                মোট দাতা: {toBanglaNum(
                  yearFilteredTransactions.filter(
                    (t) => t.type === 'income' && t.houseName === (donorReorderTargetHouse || selectedHouse)
                  ).length
                )} জন
              </span>
            </div>

            {/* Instruction Tip */}
            <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold">💡 টিপস:</span>
                <span>⬆ বা ⬇ বাটনে ক্লিক করে দাতার নাম উপরে বা নিচে নামান। এই ক্রমেই কালেকশন শিট প্রিন্ট ও ডাউনলোড হবে।</span>
              </div>
            </div>

            {/* Donor List */}
            <div className="p-4 space-y-2 overflow-y-auto flex-grow max-h-[55vh] divide-y divide-gray-100">
              {(() => {
                const currentHouse = donorReorderTargetHouse || selectedHouse;
                const donorsOfThisHouse = yearFilteredTransactions.filter(
                  (t) => t.type === 'income' && t.houseName === currentHouse
                );
                const sorted = sortDonorsList(donorsOfThisHouse, currentHouse);

                if (sorted.length === 0) {
                  return (
                    <div className="py-8 text-center text-gray-400 font-bold text-xs">
                      এই বাড়িতে এখনো কোনো চাঁদাদাতা নেই।
                    </div>
                  );
                }

                return sorted.map((donor, index) => {
                  const isFirst = index === 0;
                  const isLast = index === sorted.length - 1;

                  return (
                    <div
                      key={donor.id}
                      className="pt-2 pb-2 first:pt-0 flex items-center justify-between gap-2 hover:bg-emerald-50/30 px-2 rounded-xl transition"
                    >
                      <div className="flex items-center space-x-2.5 min-w-0">
                        <span className="w-7 h-7 flex items-center justify-center rounded-lg bg-[#0f766e] text-white text-xs font-black shrink-0 shadow-2xs">
                          {toBanglaNum(index + 1)}
                        </span>
                        <div className="min-w-0">
                          <span className="font-black text-xs sm:text-sm text-gray-900 block truncate">
                            {donor.donorName}
                          </span>
                          <div className="flex items-center space-x-2 text-[10px] text-gray-500 font-medium">
                            {donor.donationType === 'item' || donor.itemName ? (
                              <span className="text-amber-800 font-bold bg-amber-50 px-1 rounded">
                                📦 {donor.itemName}
                              </span>
                            ) : (
                              <span className="text-[#0f766e] font-black">
                                ৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}
                              </span>
                            )}
                            {donor.receiptNo && (
                              <span>• রসিদ: {toBanglaNum(donor.receiptNo)}</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Reorder Buttons */}
                      <div className="flex items-center space-x-1 shrink-0">
                        {/* Top */}
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveDonorToExtreme(donor.id, 'top', currentHouse)}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-gray-600 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg text-[10px] font-bold disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer flex items-center space-x-0.5"
                          title="একদম শীর্ষে নিয়ে যান"
                        >
                          <ArrowUp className="h-3 w-3" />
                          <span className="hidden sm:inline">শীর্ষে</span>
                        </button>

                        {/* Move Up */}
                        <button
                          type="button"
                          disabled={isFirst}
                          onClick={() => handleMoveDonor(donor.id, 'up', currentHouse)}
                          className="p-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                          title="১ ধাপ উপরে তুলুন"
                        >
                          <ChevronUp className="h-4 w-4" />
                        </button>

                        {/* Move Down */}
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveDonor(donor.id, 'down', currentHouse)}
                          className="p-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer"
                          title="১ ধাপ নিচে নামান"
                        >
                          <ChevronDown className="h-4 w-4" />
                        </button>

                        {/* Bottom */}
                        <button
                          type="button"
                          disabled={isLast}
                          onClick={() => handleMoveDonorToExtreme(donor.id, 'bottom', currentHouse)}
                          className="px-2 py-1 bg-white hover:bg-emerald-50 text-gray-600 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg text-[10px] font-bold disabled:opacity-25 disabled:cursor-not-allowed transition cursor-pointer flex items-center space-x-0.5"
                          title="একদম নিচে নিয়ে যান"
                        >
                          <ArrowDown className="h-3 w-3" />
                          <span className="hidden sm:inline">নিচে</span>
                        </button>
                      </div>
                    </div>
                  );
                });
              })()}
            </div>

            {/* Footer */}
            <div className="p-3 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
              <button
                type="button"
                onClick={() => handleResetDonorOrder(donorReorderTargetHouse || selectedHouse)}
                className="px-3 py-1.5 bg-white hover:bg-red-50 text-red-600 border border-gray-300 hover:border-red-300 rounded-xl text-xs font-bold transition cursor-pointer"
                title="ডিফল্ট এন্ট্রি ক্রমে রিসেট করুন"
              >
                ডিফল্ট ক্রমে রিসেট
              </button>

              <button
                type="button"
                onClick={() => setShowDonorReorderModal(false)}
                className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                <Check className="h-4 w-4" />
                <span>সম্পন্ন / শিট দেখুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Official Receipt Modal Component */}
      <DonationReceiptModal
        isOpen={showReceiptModal}
        onClose={() => {
          setShowReceiptModal(false);
          setSelectedDonorForReceipt(null);
        }}
        initialData={selectedDonorForReceipt}
        existingTransactions={transactions}
      />
    </div>
  );
}
