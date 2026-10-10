import React from 'react';
import { Transaction, MahfilDetails } from '../types';
import jsPDF from 'jspdf';
import { renderSafeCanvas, downloadCanvasAsImage } from '../utils/html2canvasSafe';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import DonationReceiptModal from './DonationReceiptModal';
import DuplicateAuditModal from './DuplicateAuditModal';
import {
  Building2,
  FileText,
  Printer,
  Download,
  Search,
  Users,
  Eye,
  CheckCircle2,
  Calendar,
  Image as ImageIcon,
  Share2,
  ChevronLeft,
  ChevronRight,
  ChevronUp,
  ChevronDown,
  ArrowUp,
  ArrowDown,
  Home,
  ListOrdered,
  Sparkles,
  Layers,
  ArrowUpDown,
  BookOpen,
  Filter,
  Check,
  X,
  FileSpreadsheet,
  Coins,
  Lock,
  Key,
  AlertCircle,
  AlertTriangle,
  Trash2,
  Copy
} from 'lucide-react';
import { toEnglishDigits } from '../lib/numberUtils';

interface HouseReportSectionProps {
  transactions: Transaction[];
  mahfilDetails?: MahfilDetails;
  activeHouses?: string[];
  deletedHouses?: string[];
  donorOrders?: Record<string, string[]>;
  onUpdateDonorOrder?: (key: string, orderedIds: string[]) => Promise<void> | void;
  onAddTransaction?: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (t: Transaction) => Promise<void> | void;
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  onUpdateHouses?: (active: string[], deleted: string[]) => Promise<void> | void;
  isAdminLoggedIn?: boolean;
  setIsAdminLoggedIn?: (status: boolean) => void;
  onNavigate?: (tab: string) => void;
}

export default function HouseReportSection({
  transactions,
  mahfilDetails,
  activeHouses: activeHousesProp,
  deletedHouses: deletedHousesProp,
  donorOrders: donorOrdersProp,
  onUpdateDonorOrder,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  onUpdateHouses,
  isAdminLoggedIn = false,
  setIsAdminLoggedIn,
  onNavigate
}: HouseReportSectionProps) {
  const defaultHouses = [
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

  const activeHouses = activeHousesProp && activeHousesProp.length > 0 ? activeHousesProp : defaultHouses;
  const deletedHouses = deletedHousesProp || [];

  // State Management
  const [selectedYear, setSelectedYear] = React.useState<string>('2026');
  const [selectedHouse, setSelectedHouse] = React.useState<string>('');
  const [secondHouseForDual, setSecondHouseForDual] = React.useState<string>('');
  const [sheetLayout, setSheetLayout] = React.useState<'single' | 'dual'>('single');
  const [searchQuery, setSearchQuery] = React.useState('');
  const [houseSortBy, setHouseSortBy] = React.useState<'order' | 'amount' | 'donors' | 'name'>('order');
  const [viewFormat, setViewFormat] = React.useState<'menu' | 'full'>('menu');

  // Modal / Receipt / Export states
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [selectedDonorForReceipt, setSelectedDonorForReceipt] = React.useState<Transaction | null>(null);
  const [isExportingPdf, setIsExportingPdf] = React.useState(false);
  const [isExportingJpg, setIsExportingJpg] = React.useState(false);
  const [isBatchGeneratingPdf, setIsBatchGeneratingPdf] = React.useState(false);
  const [batchProgress, setBatchProgress] = React.useState<{ current: number; total: number; houseName: string } | null>(null);
  const [feedbackMsg, setFeedbackMsg] = React.useState<string | null>(null);
  const [isPrintingAll, setIsPrintingAll] = React.useState(false);

  // Donor reordering states
  const [localDonorOrders, setLocalDonorOrders] = React.useState<Record<string, string[]>>({});
  const [showDonorReorderModal, setShowDonorReorderModal] = React.useState(false);
  const [donorReorderTargetHouse, setDonorReorderTargetHouse] = React.useState<string>('');

  // Unassigned donations resolution states
  const [selectedAssignHouse, setSelectedAssignHouse] = React.useState<Record<string, string>>({});
  const [showUnassignedDrawer, setShowUnassignedDrawer] = React.useState<boolean>(true);
  const [isProcessingUnassigned, setIsProcessingUnassigned] = React.useState<boolean>(false);

  // Duplicate Detection modal states
  const [showDuplicateModal, setShowDuplicateModal] = React.useState<boolean>(false);
  const [duplicateTab, setDuplicateTab] = React.useState<'sameHouse' | 'crossHouse'>('sameHouse');
  const [isDeletingDuplicate, setIsDeletingDuplicate] = React.useState<string | null>(null);

  // Sync donor orders from prop or localStorage
  React.useEffect(() => {
    if (donorOrdersProp && Object.keys(donorOrdersProp).length > 0) {
      setLocalDonorOrders(donorOrdersProp);
    } else {
      try {
        const saved = localStorage.getItem('mahfil_donor_orders');
        if (saved) {
          setLocalDonorOrders(JSON.parse(saved));
        }
      } catch (e) {
        console.error('Error loading donor orders from localStorage:', e);
      }
    }
  }, [donorOrdersProp]);

  // Sorting function that applies custom donor order
  const sortDonorsList = React.useCallback((donors: Transaction[], houseName: string): Transaction[] => {
    if (!donors || donors.length <= 1) return donors || [];
    const currentYear = selectedYear === 'all' ? '2026' : selectedYear;
    const orderKey = `${currentYear}_${houseName}`;
    const explicitOrder = localDonorOrders[orderKey];

    if (!explicitOrder || !Array.isArray(explicitOrder) || explicitOrder.length === 0) {
      return donors;
    }

    const orderMap = new Map<string, number>();
    explicitOrder.forEach((id, idx) => {
      orderMap.set(id, idx);
    });

    return [...donors].sort((a, b) => {
      const idxA = orderMap.has(a.id) ? orderMap.get(a.id)! : 99999;
      const idxB = orderMap.has(b.id) ? orderMap.get(b.id)! : 99999;
      return idxA - idxB;
    });
  }, [localDonorOrders, selectedYear]);

  // Handler to move donor up or down
  const handleMoveDonor = (donorId: string, direction: 'up' | 'down', houseName: string) => {
    const currentYear = selectedYear === 'all' ? '2026' : selectedYear;
    const orderKey = `${currentYear}_${houseName}`;
    const donorsOfHouse = yearFilteredTransactions.filter(
      (t) => t.type === 'income' && t.houseName === houseName
    );
    const sorted = sortDonorsList(donorsOfHouse, houseName);
    const donorIds = sorted.map((d) => d.id);
    const currentIndex = donorIds.indexOf(donorId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= donorIds.length) return;

    const newOrder = [...donorIds];
    const [moved] = newOrder.splice(currentIndex, 1);
    newOrder.splice(newIndex, 0, moved);

    const updated = { ...localDonorOrders, [orderKey]: newOrder };
    setLocalDonorOrders(updated);
    try {
      localStorage.setItem('mahfil_donor_orders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(orderKey, newOrder);
    }
  };

  // Handler to move donor to extreme top or bottom
  const handleMoveDonorToExtreme = (donorId: string, extreme: 'top' | 'bottom', houseName: string) => {
    const currentYear = selectedYear === 'all' ? '2026' : selectedYear;
    const orderKey = `${currentYear}_${houseName}`;
    const donorsOfHouse = yearFilteredTransactions.filter(
      (t) => t.type === 'income' && t.houseName === houseName
    );
    const sorted = sortDonorsList(donorsOfHouse, houseName);
    const donorIds = sorted.map((d) => d.id);
    const currentIndex = donorIds.indexOf(donorId);
    if (currentIndex === -1) return;

    const newOrder = [...donorIds];
    const [moved] = newOrder.splice(currentIndex, 1);
    if (extreme === 'top') {
      newOrder.unshift(moved);
    } else {
      newOrder.push(moved);
    }

    const updated = { ...localDonorOrders, [orderKey]: newOrder };
    setLocalDonorOrders(updated);
    try {
      localStorage.setItem('mahfil_donor_orders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(orderKey, newOrder);
    }
  };

  // Handler to reset donor order for a house
  const handleResetDonorOrder = (houseName: string) => {
    const currentYear = selectedYear === 'all' ? '2026' : selectedYear;
    const orderKey = `${currentYear}_${houseName}`;
    const updated = { ...localDonorOrders };
    delete updated[orderKey];
    setLocalDonorOrders(updated);
    try {
      localStorage.setItem('mahfil_donor_orders', JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }
    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(orderKey, []);
    }
  };

  // Translate numbers to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Convert English ISO date (YYYY-MM-DD) to Bengali formatted date
  const toEnglishDate = (dateStr: string): string => {
    if (!dateStr) return '';
    try {
      const parts = dateStr.split('-');
      if (parts.length === 3) {
        return `${toBanglaNum(parts[2])}/${toBanglaNum(parts[1])}/${toBanglaNum(parts[0])}`;
      }
      return toBanglaNum(dateStr);
    } catch {
      return toBanglaNum(dateStr);
    }
  };

  // Dynamic Houses list
  const dynamicHouses = React.useMemo(() => {
    const fromTx = transactions
      .filter((t) => t.type === 'income' && t.houseName)
      .map((t) => t.houseName as string);
    const combined = Array.from(new Set([...activeHouses, ...fromTx]));
    return combined.filter((h) => !deletedHouses.includes(h));
  }, [activeHouses, transactions, deletedHouses]);

  // Ensure default selections
  React.useEffect(() => {
    if (dynamicHouses.length > 0) {
      if (!selectedHouse || !dynamicHouses.includes(selectedHouse)) {
        setSelectedHouse(dynamicHouses[0]);
      }
      if (!secondHouseForDual || !dynamicHouses.includes(secondHouseForDual) || secondHouseForDual === dynamicHouses[0]) {
        if (dynamicHouses.length > 1) {
          setSecondHouseForDual(dynamicHouses[1]);
        }
      }
    }
  }, [dynamicHouses, selectedHouse, secondHouseForDual]);

  // Year filtered transactions
  const yearFilteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      if (selectedYear === 'all') return true;
      const tY = t.year ? t.year.toString() : (t.date ? t.date.split('-')[0] : '2026');
      return tY === selectedYear;
    });
  }, [transactions, selectedYear]);

  // Duplicate detection computation
  const duplicateGroups = React.useMemo(() => {
    const normalize = (name: string) => (name || '').replace(/[\s\u200B-\u200D\uFEFF\.\,\(\)\-\_]/g, '').trim().toLowerCase();
    const map = new Map<string, Transaction[]>();

    yearFilteredTransactions.forEach((t) => {
      if (t.type !== 'income') return;
      const key = normalize(t.donorName || '');
      if (!key) return;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(t);
    });

    const sameHouseGroups: { key: string; name: string; houseName: string; transactions: Transaction[] }[] = [];
    const crossHouseGroups: { key: string; name: string; transactions: Transaction[] }[] = [];

    map.forEach((list, key) => {
      if (list.length <= 1) return;

      // Group by house within this donor key
      const houseMap = new Map<string, Transaction[]>();
      list.forEach((t) => {
        const h = t.houseName || 'অনির্ধারিত বাড়ি';
        if (!houseMap.has(h)) houseMap.set(h, []);
        houseMap.get(h)!.push(t);
      });

      let hasSameHouse = false;
      houseMap.forEach((hList, houseName) => {
        if (hList.length > 1) {
          hasSameHouse = true;
          sameHouseGroups.push({
            key: `${key}_${houseName}`,
            name: hList[0].donorName || key,
            houseName,
            transactions: hList
          });
        }
      });

      if (!hasSameHouse && list.length > 1) {
        crossHouseGroups.push({
          key,
          name: list[0].donorName || key,
          transactions: list
        });
      }
    });

    let exactDuplicateCount = 0;
    map.forEach((list) => {
      if (list.length <= 1) return;
      const amtMap = new Map<number, number>();
      list.forEach((t) => {
        const amt = t.amount || 0;
        amtMap.set(amt, (amtMap.get(amt) || 0) + 1);
      });
      amtMap.forEach((c) => {
        if (c > 1) exactDuplicateCount++;
      });
    });

    return {
      sameHouseGroups,
      crossHouseGroups,
      exactDuplicateCount,
      totalSameHouseCount: sameHouseGroups.reduce((acc, g) => acc + g.transactions.length, 0),
      totalCrossHouseCount: crossHouseGroups.reduce((acc, g) => acc + g.transactions.length, 0)
    };
  }, [yearFilteredTransactions]);

  // House 1 Donors
  const selectedHouseDonors = React.useMemo(() => {
    const donors = yearFilteredTransactions.filter(
      (t) => t.type === 'income' && t.houseName === selectedHouse
    );
    return sortDonorsList(donors, selectedHouse);
  }, [yearFilteredTransactions, selectedHouse, sortDonorsList]);

  // House 2 Donors (for Dual sheet mode)
  const secondHouseDonors = React.useMemo(() => {
    const donors = yearFilteredTransactions.filter(
      (t) => t.type === 'income' && t.houseName === secondHouseForDual
    );
    return sortDonorsList(donors, secondHouseForDual);
  }, [yearFilteredTransactions, secondHouseForDual, sortDonorsList]);

  // Helper to get house serial number based on dynamicHouses list
  const getHouseSerialNum = (houseName: string): number => {
    const idx = dynamicHouses.indexOf(houseName);
    return idx >= 0 ? idx + 1 : 1;
  };

  // House Stats Lookup
  const houseStatsMap = React.useMemo(() => {
    const map = new Map<string, { donorsCount: number; cashTotal: number; itemsCount: number; donors: Transaction[] }>();
    dynamicHouses.forEach((h) => {
      const houseTxs = yearFilteredTransactions.filter((t) => t.type === 'income' && t.houseName === h);
      const cashTotal = houseTxs.reduce((sum, t) => sum + (t.amount || 0), 0);
      const itemsCount = houseTxs.filter((t) => t.donationType === 'item' || t.itemName).length;
      map.set(h, {
        donorsCount: houseTxs.length,
        cashTotal,
        itemsCount,
        donors: houseTxs
      });
    });
    return map;
  }, [dynamicHouses, yearFilteredTransactions]);

  // Total Aggregate Summary
  const grandTotalStats = React.useMemo(() => {
    let totalCash = 0;
    let totalDonors = 0;
    let totalItems = 0;
    houseStatsMap.forEach((stat) => {
      totalCash += stat.cashTotal;
      totalDonors += stat.donorsCount;
      totalItems += stat.itemsCount;
    });
    return {
      housesCount: dynamicHouses.length,
      totalDonors,
      totalCash,
      totalItems
    };
  }, [houseStatsMap, dynamicHouses]);

  // Unassigned donations (income transactions with no house or outside dynamicHouses)
  const unassignedDonations = React.useMemo(() => {
    return yearFilteredTransactions.filter(
      (t) => t.type === 'income' && (!t.houseName || !dynamicHouses.includes(t.houseName))
    );
  }, [yearFilteredTransactions, dynamicHouses]);

  const unassignedTotal = React.useMemo(() => {
    return unassignedDonations.reduce((sum, t) => sum + (t.amount || 0), 0);
  }, [unassignedDonations]);

  const handleAssignHouseToTx = async (tx: Transaction) => {
    const targetHouse = selectedAssignHouse[tx.id];
    if (!targetHouse) {
      alert('অনুগ্রহ করে একটি বাড়ির নাম নির্বাচন করুন।');
      return;
    }
    if (onUpdateTransaction) {
      setIsProcessingUnassigned(true);
      try {
        const updated: Transaction = {
          ...tx,
          houseName: targetHouse,
          category: 'বাড়ি ভিত্তিক চাঁদা'
        };
        await onUpdateTransaction(updated);
        setFeedbackMsg(`"${tx.donorName}" এর চাঁদা সফলভাবে "${targetHouse}" এ যুক্ত করা হয়েছে।`);
      } catch (err) {
        console.error('Error assigning house:', err);
      } finally {
        setIsProcessingUnassigned(false);
      }
    }
  };

  const handleDeleteUnassignedTx = async (tx: Transaction) => {
    if (window.confirm(`আপনি কি নিশ্চিত যে "${tx.donorName}" (৳ ${toBanglaNum(tx.amount)}) এর এন্ট্রিটি মুছে ফেলতে চান?`)) {
      if (onDeleteTransaction) {
        setIsProcessingUnassigned(true);
        try {
          await onDeleteTransaction(tx.id);
          setFeedbackMsg(`"${tx.donorName}" এর এন্ট্রিটি সফলভাবে মুছে ফেলা হয়েছে।`);
        } catch (err) {
          console.error('Error deleting transaction:', err);
        } finally {
          setIsProcessingUnassigned(false);
        }
      }
    }
  };

  // Filtered and Sorted Houses for the Menu
  const displayedHouses = React.useMemo(() => {
    let list = [...dynamicHouses];

    // Search filter
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      list = list.filter((h) => h.toLowerCase().includes(q));
    }

    // Sorting
    if (houseSortBy === 'amount') {
      list.sort((a, b) => {
        const cashA = houseStatsMap.get(a)?.cashTotal || 0;
        const cashB = houseStatsMap.get(b)?.cashTotal || 0;
        return cashB - cashA;
      });
    } else if (houseSortBy === 'donors') {
      list.sort((a, b) => {
        const donorsA = houseStatsMap.get(a)?.donorsCount || 0;
        const donorsB = houseStatsMap.get(b)?.donorsCount || 0;
        return donorsB - donorsA;
      });
    } else if (houseSortBy === 'name') {
      list.sort((a, b) => a.localeCompare(b, 'bn'));
    }
    // 'order' keeps the original dynamicHouses sequence

    return list;
  }, [dynamicHouses, searchQuery, houseSortBy, houseStatsMap]);

  // Convert Number to Bengali Words
  const numberToBanglaWords = (num: number): string => {
    if (!num || isNaN(num) || num <= 0) return 'শূন্য';

    const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়', 'দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
    const tens = ['', '', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];

    const convertTens = (n: number): string => {
      if (n < 20) return units[n];
      const digitTen = Math.floor(n / 10);
      const digitUnit = n % 10;
      return tens[digitTen] + (digitUnit ? ' ' + units[digitUnit] : '');
    };

    const convert = (nVal: number): string => {
      let n = Math.floor(nVal);
      let words = '';

      if (n >= 10000000) {
        const crore = Math.floor(n / 10000000);
        words += convert(crore) + ' কোটি ';
        n %= 10000000;
      }
      if (n >= 100000) {
        const lakh = Math.floor(n / 100000);
        words += convert(lakh) + ' লাখ ';
        n %= 100000;
      }
      if (n >= 1000) {
        const thousand = Math.floor(n / 1000);
        words += convert(thousand) + ' হাজার ';
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

    return convert(Math.floor(num)) + ' টাকা মাত্র';
  };

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
        <div className="shrink-0 border border-gray-900 rounded p-1 bg-white text-center flex flex-col justify-center min-w-[130px] max-w-[185px] leading-tight shadow-xs">
          <div className="text-[9px] font-black text-black border-b border-gray-400 pb-0.5 mb-0.5 bg-gray-100 px-1 rounded-xs flex items-center justify-between">
            <span>আদায় ফিগার বিবরণ</span>
            <span className="text-[8.5px] font-bold text-gray-700">({toBanglaNum(donors.length)}টি)</span>
          </div>
          {sortedAmounts.length > 0 || figureCounts['item'] ? (
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-0.5 text-[8.5px] font-bold text-black text-left">
              {sortedAmounts.map((amt) => (
                <div key={amt} className="flex justify-between items-center border-b border-dotted border-gray-300 pr-0.5">
                  <span className="text-gray-800">৳{toBanglaNum(amt.toLocaleString('bn-BD'))}:</span>
                  <span className="font-black text-black">{toBanglaNum(figureCounts[amt.toString()])}টি</span>
                </div>
              ))}
              {figureCounts['item'] && (
                <div className="flex justify-between items-center border-b border-dotted border-gray-300 pr-0.5 col-span-2">
                  <span className="text-gray-800">📦 পণ্য:</span>
                  <span className="font-black text-black">{toBanglaNum(figureCounts['item'])}টি</span>
                </div>
              )}
            </div>
          ) : (
            <div className="text-[8px] text-gray-400 italic py-0.5">কোনো ফিগার নেই</div>
          )}
        </div>
      );
    }

    return (
      <div className="shrink-0 border border-gray-900 rounded p-1.5 bg-white text-center flex flex-col justify-center min-w-[145px] max-w-[210px] shadow-xs">
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
          <div className="text-[9px] text-gray-400 italic py-0.5">কোনো ফিগার নেই</div>
        )}
      </div>
    );
  };

  // Export Sheet to PDF
  const handleDownloadSheetPDF = async () => {
    const printArea = document.getElementById('house-report-sheet-print-area');
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
          const clonedPrintArea = clonedDoc.getElementById('house-report-sheet-print-area') as HTMLElement | null;
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
        format: 'a4'
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

      setFeedbackMsg(`সফলভাবে "${selectedHouse}" এর PDF ডাউনলোড সম্পন্ন হয়েছে!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
    } catch (error) {
      console.error('Error generating Sheet PDF:', error);
      alert('পিডিএফ ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExportingPdf(false);
    }
  };

  // Export Sheet to JPG Image
  const handleDownloadSheetJPG = async () => {
    const printArea = document.getElementById('house-report-sheet-print-area');
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
      setFeedbackMsg(`সফলভাবে "${selectedHouse}" এর ছবি ডাউনলোড হয়েছে!`);
      setTimeout(() => setFeedbackMsg(null), 4000);
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

  // Select house and smooth scroll to sheet
  const handleSelectHouse = (houseName: string) => {
    setSelectedHouse(houseName);
    const element = document.getElementById('house-report-sheet-print-area');
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // =========================================================================
  // DOWNLOAD ALL HOUSES COMBINED MULTI-PAGE PDF
  // "সকল পিডিএফ ডাউনলোড"
  // =========================================================================
  const handleDownloadAllHousesCombinedPDF = async () => {
    if (dynamicHouses.length === 0) {
      alert('ডাউনলোড করার মতো কোনো বাড়ির তথ্য নেই।');
      return;
    }

    setIsBatchGeneratingPdf(true);
    const total = dynamicHouses.length;
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const imgWidth = 210;
    const pageHeight = 297;
    const margin = 8;
    const contentWidth = imgWidth - (margin * 2);

    try {
      // Save current selection to restore afterwards
      const previousSelectedHouse = selectedHouse;

      for (let i = 0; i < total; i++) {
        const currentHouseName = dynamicHouses[i];
        setBatchProgress({ current: i + 1, total, houseName: currentHouseName });
        setSelectedHouse(currentHouseName);

        // Wait for React to render the new house in DOM
        await new Promise((resolve) => setTimeout(resolve, 140));

        const printArea = document.getElementById('house-report-sheet-print-area');
        if (!printArea) continue;

        const canvas = await renderSafeCanvas(printArea, {
          scale: 2.2,
          useCORS: true,
          allowTaint: true,
          backgroundColor: '#ffffff',
          logging: false,
          scrollX: 0,
          scrollY: 0,
          windowWidth: 850
        });

        const imgData = canvas.toDataURL('image/jpeg', 0.95);
        const contentHeight = (canvas.height * contentWidth) / canvas.width;

        if (i > 0) {
          pdf.addPage();
        }

        if (contentHeight > (pageHeight - (margin * 2))) {
          pdf.addImage(imgData, 'JPEG', margin, margin, contentWidth, pageHeight - (margin * 2));
        } else {
          const yOffset = (pageHeight - contentHeight) / 2;
          pdf.addImage(imgData, 'JPEG', margin, yOffset, contentWidth, contentHeight);
        }
      }

      // Restore original selection
      setSelectedHouse(previousSelectedHouse);

      const fileName = `সোনারগাঁও_সকল_বাড়ির_কালেকশন_শিট_${selectedYear}.pdf`;
      pdf.save(fileName);

      setFeedbackMsg(`সফলভাবে সকল ${toBanglaNum(total)}টি বাড়ির পূর্ণাঙ্গ PDF বুকলেট ডাউনলোড সম্পন্ন হয়েছে!`);
      setTimeout(() => setFeedbackMsg(null), 5000);
    } catch (err) {
      console.error('Batch PDF Generation Error:', err);
      alert('সকল বাড়ির পিডিএফ তৈরিতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsBatchGeneratingPdf(false);
      setBatchProgress(null);
    }
  };

  // Quick download individual house PDF directly from menu card
  const handleQuickDownloadHousePDF = async (houseName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHouse(houseName);
    // Allow state to update then trigger download
    setTimeout(() => {
      handleDownloadSheetPDF();
    }, 150);
  };

  // Quick print individual house directly from menu card
  const handleQuickPrintHouse = (houseName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedHouse(houseName);
    setTimeout(() => {
      window.print();
    }, 150);
  };

  // Admin Authentication State for restricted access
  const [adminPasswordInput, setAdminPasswordInput] = React.useState('');
  const [adminAuthError, setAdminAuthError] = React.useState('');

  const handleAdminAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (adminPasswordInput === 'T@a546195') {
      sessionStorage.setItem('mahfil_admin_logged', 'true');
      if (setIsAdminLoggedIn) {
        setIsAdminLoggedIn(true);
      }
      setAdminAuthError('');
    } else {
      setAdminAuthError('ভুল পাসওয়ার্ড! সঠিক অ্যাডমিন পাসওয়ার্ড প্রদান করুন।');
    }
  };

  if (!isAdminLoggedIn) {
    return (
      <div id="house-report-admin-gate" className="min-h-[60vh] flex items-center justify-center p-4">
        <div className="bg-white border-2 border-[#cbd5e1] rounded-3xl p-8 max-w-md w-full shadow-xl text-center space-y-6 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-2.5 bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#d97706]"></div>
          <div className="w-16 h-16 bg-emerald-50 border-2 border-emerald-200 text-[#064e3b] rounded-2xl flex items-center justify-center mx-auto shadow-inner">
            <Lock className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <h3 className="text-xl font-black text-[#064e3b]">অ্যাডমিন সংরক্ষিত বাড়ি রিপোর্ট</h3>
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              বাড়ি রিপোর্ট ও চাঁদা বিবরণী মেনুটি শুধুমাত্র উদযাপন পরিষদের অনুমোদিত অ্যাডমিন ও অর্থ পরিচালকদের জন্য সংরক্ষিত। অনুগ্রহ করে পাসওয়ার্ড প্রদান করে প্রবেশ করুন।
            </p>
          </div>

          <form onSubmit={handleAdminAuthSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-[#0f766e] uppercase tracking-wider mb-1.5">
                অ্যাডমিন পাসওয়ার্ড (Admin Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#d97706]">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="house-report-password-input"
                  type="password"
                  required
                  placeholder="অ্যাডমিন পাসওয়ার্ড লিখুন..."
                  value={adminPasswordInput}
                  onChange={(e) => setAdminPasswordInput(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-[#cbd5e1] rounded-xl text-sm text-[#3c3c3c] placeholder-gray-400 focus:outline-none focus:border-[#0f766e] focus:bg-white focus:ring-1 focus:ring-[#0f766e] transition"
                />
              </div>
            </div>

            {adminAuthError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 shrink-0 text-red-500" />
                <span>{adminAuthError}</span>
              </div>
            )}

            <button
              id="house-report-login-submit"
              type="submit"
              className="w-full py-3 bg-[#064e3b] hover:bg-[#0f766e] text-white font-black rounded-xl text-xs transition-all shadow-md cursor-pointer"
            >
              লগইন করে বাড়ি রিপোর্ট দেখুন
            </button>
          </form>

          {onNavigate && (
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
              <button
                type="button"
                onClick={() => onNavigate('home')}
                className="font-bold text-slate-500 hover:text-slate-800 transition cursor-pointer"
              >
                ← মূল পাতা
              </button>
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="font-bold text-[#0f766e] hover:underline transition cursor-pointer"
              >
                সি-প্যানেল প্রবেশদ্বার →
              </button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="house-report-section" className="space-y-6 animate-fade-in text-[#3c3c3c]">
      {/* Top Banner & Overview Header */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#042f2e] rounded-2xl p-5 sm:p-6 text-white shadow-md relative overflow-hidden">
        <div className="absolute right-0 top-0 w-80 h-80 bg-amber-400/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center space-x-2.5">
              <span className="p-2.5 bg-emerald-500/20 border border-emerald-400/30 rounded-2xl text-amber-300 shadow-sm">
                <Building2 className="h-7 w-7" />
              </span>
              <div>
                <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
                  <span>বাড়ি রিপোর্ট ও কালেকশন শিট কেন্দ্র</span>
                  <span className="text-[10px] sm:text-xs font-black bg-amber-400 text-slate-950 px-2.5 py-0.5 rounded-full shadow-2xs flex items-center gap-1">
                    <Lock className="h-3 w-3" />
                    অ্যাডমিন সেকশন
                  </span>
                </h2>
                <p className="text-xs sm:text-sm text-emerald-100/90 font-medium">
                  সোনারগাঁও ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ | সকল বাড়ির চাঁদা আদায় বিবরণী, প্রিন্ট ও সম্পূর্ণ PDF ডাউনলোড
                </p>
              </div>
            </div>
          </div>

          {/* Action pill & Year filter */}
          <div className="flex flex-wrap items-center gap-2 self-start md:self-auto shrink-0">
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('admin')}
                className="px-3 py-1.5 bg-white/10 hover:bg-white/20 border border-white/20 rounded-xl text-xs font-bold text-white transition flex items-center gap-1.5 cursor-pointer"
              >
                <span>সি-প্যানেল</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </button>
            )}

            {/* Duplicate Posting Checker Button */}
            <button
              type="button"
              onClick={() => setShowDuplicateModal(true)}
              className="px-3 py-1.5 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40 rounded-xl text-xs font-bold text-amber-200 transition flex items-center gap-1.5 cursor-pointer shadow-xs"
              title="একই ব্যক্তির নামে কোন ডুপ্লিকেট পোস্টিং রয়েছে কি না নিরীক্ষা করুন"
            >
              <Copy className="h-3.5 w-3.5" />
              <span>ডুপ্লিকেট চেক</span>
              {duplicateGroups.exactDuplicateCount > 0 ? (
                <span className="bg-red-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                  {toBanglaNum(duplicateGroups.exactDuplicateCount)}
                </span>
              ) : duplicateGroups.sameHouseGroups.length > 0 ? (
                <span className="bg-amber-500 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                  {toBanglaNum(duplicateGroups.sameHouseGroups.length)}
                </span>
              ) : (
                <span className="bg-emerald-500/40 text-emerald-100 text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                  ০
                </span>
              )}
            </button>

            {/* Year Filter Pill */}
            <div className="flex items-center gap-2 bg-black/30 p-1.5 rounded-xl border border-emerald-400/30">
              <span className="text-xs font-bold text-amber-300 px-1 flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5" />
                <span>হিসাব বছর:</span>
              </span>
              <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-slate-900 text-white rounded-lg text-xs font-bold focus:outline-none border border-emerald-500/40 cursor-pointer"
            >
              <option value="2027">২০২৭ খ্রি.</option>
              <option value="2026">২০২৬ খ্রি.</option>
              <option value="2025">২০২৫ খ্রি.</option>
              <option value="2024">২০২৪ খ্রি.</option>
              <option value="all">সকল বছর</option>
            </select>
          </div>
        </div>
      </div>

        {/* Aggregate Stats Summary Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4 pt-4 border-t border-emerald-500/30">
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold uppercase block">মোট বাড়ি তালিকা</span>
            <span className="text-lg sm:text-xl font-black text-white">{toBanglaNum(grandTotalStats.housesCount)} টি</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold uppercase block">মোট চাঁদা দাতা</span>
            <span className="text-lg sm:text-xl font-black text-white">{toBanglaNum(grandTotalStats.totalDonors)} জন</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold uppercase block">সর্বমোট নগদ আদায়</span>
            <span className="text-lg sm:text-xl font-black text-amber-300">৳ {toBanglaNum(grandTotalStats.totalCash.toLocaleString('bn-BD'))}/-</span>
          </div>
          <div className="bg-white/10 backdrop-blur-xs rounded-xl p-3 border border-white/10">
            <span className="text-[10px] text-emerald-200 font-bold uppercase block">পণ্য সামগ্রী দান</span>
            <span className="text-lg sm:text-xl font-black text-purple-200">{toBanglaNum(grandTotalStats.totalItems)} টি</span>
          </div>
        </div>
      </div>

      {/* Discrepancy / Unassigned Donations Reconciliation Card */}
      {unassignedDonations.length > 0 && (
        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 sm:p-5 shadow-sm space-y-3 animate-fade-in">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-amber-200">
            <div className="flex items-start space-x-2.5">
              <div className="p-2 bg-amber-500 text-white rounded-xl shadow-xs mt-0.5">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center space-x-2">
                  <h4 className="text-sm sm:text-base font-black text-amber-950">
                    বাড়ি অনির্ধারিত চাঁদা: {toBanglaNum(unassignedDonations.length)} টি (মোট ৳ {toBanglaNum(unassignedTotal.toLocaleString('bn-BD'))}/-)
                  </h4>
                  <span className="px-2 py-0.5 bg-amber-200 text-amber-900 rounded-full text-[10px] font-bold">
                    হিসাব সমন্বয়
                  </span>
                </div>
                <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                  <strong>হিসাবের পার্থক্যের কারণ:</strong> বাড়ির রিপোর্টে বাড়ি নির্বাচিত আদায় <strong>৳ {toBanglaNum(grandTotalStats.totalCash.toLocaleString('bn-BD'))}/-</strong> দেখাচ্ছে, এবং রিপোর্ট মেনুতে সর্বমোট আয় <strong>৳ {toBanglaNum((grandTotalStats.totalCash + unassignedTotal).toLocaleString('bn-BD'))}/-</strong> দেখাচ্ছে। কারণ নিচে থাকা এই {toBanglaNum(unassignedDonations.length)}টি এন্ট্রিতে কোনো নির্দিষ্ট বাড়ির নাম উল্লেখ করা হয়নি।
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setShowUnassignedDrawer(!showUnassignedDrawer)}
              className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center space-x-1.5 self-start sm:self-center shrink-0 cursor-pointer shadow-xs"
            >
              <span>{showUnassignedDrawer ? 'লুকান' : 'তালিকা দেখুন ও ঠিক করুন'}</span>
              {showUnassignedDrawer ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>

          {showUnassignedDrawer && (
            <div className="space-y-2.5 pt-1">
              <div className="bg-white/80 rounded-xl p-3 border border-amber-200 text-[11.5px] text-amber-900 space-y-1">
                <p className="font-bold flex items-center space-x-1.5 text-amber-950">
                  <span>📌 সমাধান পদ্ধতি:</span>
                </p>
                <p>
                  ১. যে এন্ট্রির বাড়ি জানা আছে, তার ড্রপডাউন থেকে সঠিক <strong>বাড়ির নাম</strong> সিলেক্ট করে <strong>&quot;সেভ&quot;</strong> বাটনে ক্লিক করুন।
                </p>
                <p>
                  ২. কোনো এন্ট্রি যদি ভুলবশত দুবার করা হয়ে থাকে (ডুপ্লিকেট), তবে <strong>&quot;মুছে ফেলুন&quot;</strong> বাটনে ক্লিক করে অপ্রয়োজনীয় এন্ট্রিটি বাদ দিন।
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-2.5">
                {unassignedDonations.map((tx) => {
                  const isBangal = tx.donorName?.includes('বাঙ্গাল');
                  const isKechoye = tx.donorName?.includes('কেচচয়ে');
                  return (
                    <div
                      key={tx.id}
                      className="bg-white rounded-xl p-3 border border-amber-200 shadow-xs flex flex-col justify-between space-y-2"
                    >
                      <div className="space-y-1">
                        <div className="flex items-start justify-between">
                          <span className="font-black text-gray-900 text-xs sm:text-sm">
                            {tx.donorName}
                          </span>
                          <span className="font-black text-emerald-700 text-xs sm:text-sm bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                            ৳ {toBanglaNum(tx.amount.toLocaleString('bn-BD'))}/-
                          </span>
                        </div>
                        <div className="text-[10px] text-gray-600 space-y-0.5">
                          <div>তারিখ: {toBanglaNum(tx.date || '')} | ক্যাটাগরি: {tx.category || 'অন্যান্য'}</div>
                          {tx.recordedBy && <div>সংগ্রহকারী: <span className="font-semibold text-gray-800">{tx.recordedBy}</span></div>}
                        </div>
                        {isBangal && (
                          <div className="text-[10.5px] bg-red-50 text-red-700 p-1.5 rounded border border-red-200 font-medium">
                            ⚠️ &apos;উত্তর পাড়া+তালুকদার বাড়ী&apos;তে এই একই নামে ও সমপরিমাণ টাকায় আরেকটি এন্ট্রি বিদ্যমান রয়েছে।
                          </div>
                        )}
                        {isKechoye && (
                          <div className="text-[10.5px] bg-blue-50 text-blue-800 p-1.5 rounded border border-blue-200 font-medium">
                            💡 এটি &apos;হার্চি সদ্দারের বাড়ী&apos;র অন্যান্য এন্ট্রির সাথে সংগ্রহ করা হয়েছিল।
                          </div>
                        )}
                      </div>

                      <div className="pt-2 border-t border-gray-100 flex flex-col space-y-1.5">
                        <div className="flex items-center space-x-1.5">
                          <select
                            value={selectedAssignHouse[tx.id] || (isKechoye ? 'হার্চি সদ্দারের বাড়ী' : '')}
                            onChange={(e) => setSelectedAssignHouse({ ...selectedAssignHouse, [tx.id]: e.target.value })}
                            className="flex-1 text-[11px] p-1.5 border border-gray-300 rounded-lg bg-gray-50 focus:bg-white font-medium"
                          >
                            <option value="">-- বাড়ি নির্বাচন করুন --</option>
                            {dynamicHouses.map((h) => (
                              <option key={h} value={h}>{h}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            disabled={isProcessingUnassigned}
                            onClick={() => {
                              const chosen = selectedAssignHouse[tx.id] || (isKechoye ? 'হার্চি সদ্দারের বাড়ী' : '');
                              if (!chosen) {
                                alert('দয়া করে একটি বাড়ি নির্বাচন করুন।');
                                return;
                              }
                              handleAssignHouseToTx({ ...tx, houseName: chosen });
                            }}
                            className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10.5px] font-bold transition shrink-0 cursor-pointer disabled:opacity-50"
                            title="বাড়ি নির্ধারণ করুন"
                          >
                            সেভ
                          </button>
                        </div>
                        <div className="flex justify-end">
                          <button
                            type="button"
                            disabled={isProcessingUnassigned}
                            onClick={() => handleDeleteUnassignedTx(tx)}
                            className="text-[10.5px] text-red-600 hover:text-red-800 font-bold flex items-center space-x-1 py-0.5 px-1.5 rounded hover:bg-red-50 transition cursor-pointer"
                            title="যদি এটি ভুল বা ডুপ্লিকেট এন্ট্রি হয় তবে মুছে ফেলুন"
                          >
                            <Trash2 className="h-3 w-3" />
                            <span>মুছে ফেলুন</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Feedback Message Alert */}
      {feedbackMsg && (
        <div className="p-3.5 bg-emerald-50 border-2 border-emerald-400 text-[#064e3b] rounded-xl text-xs font-bold flex items-center justify-between animate-fade-in shadow-xs">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600 shrink-0" />
            <span>{feedbackMsg}</span>
          </div>
          <button onClick={() => setFeedbackMsg(null)} className="text-emerald-700 hover:text-black">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Batch PDF Generation Progress Modal */}
      {isBatchGeneratingPdf && batchProgress && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full text-center space-y-4 shadow-2xl border-2 border-[#0f766e]">
            <div className="w-16 h-16 rounded-full bg-emerald-100 text-[#0f766e] flex items-center justify-center mx-auto animate-pulse">
              <Download className="h-8 w-8 animate-bounce" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-black text-gray-900">সকল বাড়ির PDF তৈরি হচ্ছে...</h3>
              <p className="text-xs text-gray-600">
                প্রসেসিং: <span className="font-bold text-[#0f766e]">{batchProgress.houseName}</span> ({toBanglaNum(batchProgress.current)}/{toBanglaNum(batchProgress.total)})
              </p>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className="bg-[#0f766e] h-3 rounded-full transition-all duration-300"
                style={{ width: `${(batchProgress.current / batchProgress.total) * 100}%` }}
              ></div>
            </div>
            <p className="text-[11px] text-gray-500 italic">
              অনুগ্রহ করে অপেক্ষা করুন, সকল বাড়ির A4 কালেকশন শিট একত্রিত করে একটি পূর্ণাঙ্গ বুকলেটে রূপান্তর করা হচ্ছে।
            </p>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. HOUSE NAMES DIRECTORY & MENU (বাড়ির নামের মেনু ও তালিকা) */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-3 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 bg-[#0f766e]/10 text-[#0f766e] rounded-lg">
              <BookOpen className="h-5 w-5" />
            </span>
            <div>
              <h3 className="text-base font-black text-[#064e3b] leading-tight">
                বাড়ির নামের মেনু ও সরাসরি অ্যাকশন
              </h3>
              <p className="text-[11px] text-gray-600 font-medium">
                যেকোনো বাড়িতে ট্যাপ করে শিট দেখুন, অথবা সরাসরি ওই বাড়ির PDF ডাউনলোড ও প্রিন্ট করুন।
              </p>
            </div>
          </div>

          {/* Master Batch Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start md:self-auto">
            <button
              id="download-all-houses-pdf-btn"
              type="button"
              onClick={handleDownloadAllHousesCombinedPDF}
              disabled={isBatchGeneratingPdf}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-700 hover:to-amber-600 text-white text-xs font-extrabold rounded-xl shadow-sm transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              title="সকল বাড়ির কালেকশন শিট এক সাথে ১টি PDF ফাইলে ডাউনলোড করুন"
            >
              <Download className="h-4 w-4 shrink-0" />
              <span>সকল বাড়ির PDF এক সাথে ডাউনলোড</span>
            </button>

            <button
              type="button"
              onClick={() => {
                // Print active sheet directly
                window.print();
              }}
              className="px-3 py-2 bg-white hover:bg-gray-100 text-gray-800 text-xs font-bold rounded-xl border border-[#cbd5e1] shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
              title="বর্তমান শিট প্রিন্ট করুন"
            >
              <Printer className="h-4 w-4 text-[#0f766e]" />
              <span>শিট প্রিন্ট</span>
            </button>
          </div>
        </div>

        {/* Search & Sort Controls Bar */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
          {/* Search Box */}
          <div className="relative flex-grow max-w-md">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="বাড়ির নাম দিয়ে দ্রুত খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-[#f8fafc] border border-[#cbd5e1] focus:border-[#0f766e] rounded-xl text-xs font-bold text-gray-800 focus:outline-none transition"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-black cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Sorting Options */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-bold text-gray-600 flex items-center gap-1 shrink-0">
              <ArrowUpDown className="h-3 w-3 text-[#0f766e]" />
              <span>সাজান:</span>
            </span>
            <div className="inline-flex rounded-lg border border-gray-200 bg-gray-50 p-0.5 text-[11px]">
              <button
                type="button"
                onClick={() => setHouseSortBy('order')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  houseSortBy === 'order' ? 'bg-[#0f766e] text-white shadow-2xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                ক্রম
              </button>
              <button
                type="button"
                onClick={() => setHouseSortBy('amount')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  houseSortBy === 'amount' ? 'bg-[#0f766e] text-white shadow-2xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                সর্বোচ্চ আদায়
              </button>
              <button
                type="button"
                onClick={() => setHouseSortBy('donors')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  houseSortBy === 'donors' ? 'bg-[#0f766e] text-white shadow-2xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                বেশি দাতা
              </button>
              <button
                type="button"
                onClick={() => setHouseSortBy('name')}
                className={`px-2.5 py-1 rounded-md font-bold transition cursor-pointer ${
                  houseSortBy === 'name' ? 'bg-[#0f766e] text-white shadow-2xs' : 'text-gray-600 hover:text-black'
                }`}
              >
                নাম (ক-হ)
              </button>
            </div>
          </div>
        </div>

        {/* House Grid / Cards Menu */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2.5 max-h-[360px] overflow-y-auto p-1 border border-gray-100 rounded-xl bg-[#f8fafc]/50">
          {displayedHouses.map((houseName, idx) => {
            const isSelected = selectedHouse === houseName;
            const stats = houseStatsMap.get(houseName) || { donorsCount: 0, cashTotal: 0, itemsCount: 0 };
            const serialNumber = dynamicHouses.indexOf(houseName) + 1;

            return (
              <div
                key={houseName}
                onClick={() => handleSelectHouse(houseName)}
                className={`p-3 rounded-xl border-2 transition-all duration-200 cursor-pointer flex flex-col justify-between gap-2 shadow-2xs group ${
                  isSelected
                    ? 'bg-emerald-50/90 border-[#0f766e] shadow-md ring-1 ring-[#0f766e]/30'
                    : 'bg-white border-gray-200 hover:border-[#0f766e]/40 hover:bg-gray-50/80'
                }`}
              >
                {/* House Name & Badges */}
                <div className="flex items-start justify-between gap-1.5">
                  <div className="flex items-center space-x-2">
                    <span
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-black shrink-0 ${
                        isSelected ? 'bg-[#0f766e] text-white' : 'bg-gray-100 text-gray-700'
                      }`}
                    >
                      {toBanglaNum(serialNumber)}
                    </span>
                    <div>
                      <h4 className="text-xs sm:text-sm font-black text-gray-900 group-hover:text-[#0f766e] transition-colors leading-tight">
                        {houseName}
                      </h4>
                      <span className="text-[10px] text-gray-500 font-bold">
                        {toBanglaNum(stats.donorsCount)} জন দাতা
                      </span>
                    </div>
                  </div>

                  {isSelected && (
                    <span className="px-1.5 py-0.5 bg-[#0f766e] text-white text-[9px] font-black rounded flex items-center gap-0.5">
                      <Check className="h-2.5 w-2.5" />
                      <span>সক্রিয়</span>
                    </span>
                  )}
                </div>

                {/* Amount and Direct Actions */}
                <div className="flex items-center justify-between gap-1 pt-2 border-t border-gray-100 text-xs">
                  <span className="font-extrabold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200 text-[11px]">
                    ৳ {toBanglaNum(stats.cashTotal.toLocaleString('bn-BD'))}
                  </span>

                  <div className="flex items-center space-x-1">
                    <button
                      type="button"
                      onClick={(e) => handleQuickDownloadHousePDF(houseName, e)}
                      className="p-1.5 bg-[#0f766e]/10 hover:bg-[#0f766e] text-[#0f766e] hover:text-white rounded-lg transition"
                      title={`"${houseName}" এর PDF ডাউনলোড করুন`}
                    >
                      <Download className="h-3.5 w-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={(e) => handleQuickPrintHouse(houseName, e)}
                      className="p-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition"
                      title={`"${houseName}" সরাসরি প্রিন্ট করুন`}
                    >
                      <Printer className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 2. CONTROLS BAR: Selected House, Layout Switcher, Print & Export */}
      {/* ========================================================================= */}
      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3.5 items-center">
          {/* Main House Dropdown Selector with Previous / Next */}
          <div className="md:col-span-5">
            <label className="block text-[#0f766e] text-[11px] font-black uppercase tracking-wider mb-1">
              বর্তমানে নির্বাচিত বাড়ি:
            </label>
            <div className="flex items-center space-x-1">
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

              <div className="relative flex-grow">
                <select
                  id="house-report-main-select"
                  value={selectedHouse}
                  onChange={(e) => setSelectedHouse(e.target.value)}
                  className="w-full px-3 py-2 bg-[#f8fafc] border-2 border-[#cbd5e1] focus:border-[#0f766e] rounded-xl text-xs font-bold text-gray-800 focus:outline-none transition shadow-2xs"
                >
                  {dynamicHouses.map((h, i) => {
                    const stats = houseStatsMap.get(h) || { donorsCount: 0, cashTotal: 0 };
                    return (
                      <option key={h} value={h}>
                        {toBanglaNum(i + 1)}. {h} ({toBanglaNum(stats.donorsCount)} জন দাতা - ৳{toBanglaNum(stats.cashTotal.toLocaleString('bn-BD'))})
                      </option>
                    );
                  })}
                </select>
              </div>

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
            </div>
          </div>

          {/* Layout Format: Single House vs Dual Houses per Page */}
          <div className="md:col-span-3">
            <label className="block text-[#0f766e] text-[11px] font-black uppercase tracking-wider mb-1">
              শিট প্রিন্ট ফরম্যাট:
            </label>
            <div className="grid grid-cols-2 gap-1 bg-[#f1f5f9] p-1 rounded-xl border border-[#cbd5e1]">
              <button
                type="button"
                onClick={() => setSheetLayout('single')}
                className={`py-1.5 rounded-lg text-[10.5px] font-black transition cursor-pointer text-center ${
                  sheetLayout === 'single'
                    ? 'bg-[#0f766e] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#064e3b]'
                }`}
              >
                একক বাড়ি (২৪ রো)
              </button>
              <button
                type="button"
                onClick={() => setSheetLayout('dual')}
                className={`py-1.5 rounded-lg text-[10.5px] font-black transition cursor-pointer text-center ${
                  sheetLayout === 'dual'
                    ? 'bg-[#0f766e] text-white shadow-xs'
                    : 'text-gray-600 hover:text-[#064e3b]'
                }`}
              >
                ১ পাতায় ২ বাড়ি
              </button>
            </div>
          </div>

          {/* If dual mode: 2nd House selector */}
          {sheetLayout === 'dual' && (
            <div className="md:col-span-4">
              <label className="block text-[#0f766e] text-[11px] font-black uppercase tracking-wider mb-1">
                ২য় বাড়ি নির্বাচন (একই পৃষ্ঠায়):
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

        {/* Selected House Quick Metrics & Action Buttons Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-[#e2e8f0]">
          {/* Metrics */}
          <div className="flex items-center gap-2 text-xs font-bold text-gray-700 flex-wrap">
            <span className="bg-emerald-50 text-[#064e3b] border border-emerald-200 px-2.5 py-1 rounded-lg">
              নির্বাচিত বাড়ি: <span className="font-black text-[#0f766e]">{selectedHouse}</span>
            </span>
            <span className="bg-emerald-50 text-[#064e3b] border border-emerald-200 px-2.5 py-1 rounded-lg">
              দাতা: <span className="font-black text-[#0f766e]">{toBanglaNum(selectedHouseDonors.length)} জন</span>
            </span>
            <span className="bg-amber-50 text-amber-900 border border-amber-200 px-2.5 py-1 rounded-lg">
              আদায়: <span className="font-black text-amber-700">৳ {toBanglaNum(selectedHouseDonors.reduce((s, t) => s + (t.amount || 0), 0).toLocaleString('bn-BD'))}/-</span>
            </span>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-wrap">
            <button
              id="house-report-download-pdf-btn"
              type="button"
              onClick={handleDownloadSheetPDF}
              disabled={isExportingPdf}
              className="px-3.5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white text-xs font-bold rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <Download className={`h-4 w-4 ${isExportingPdf ? 'animate-bounce' : ''}`} />
              <span>{isExportingPdf ? 'PDF তৈরি হচ্ছে...' : 'এই বাড়ির A4 PDF'}</span>
            </button>

            <button
              id="house-report-download-jpg-btn"
              type="button"
              onClick={handleDownloadSheetJPG}
              disabled={isExportingJpg}
              className="px-3 py-2 bg-[#f8fafc] hover:bg-gray-100 text-gray-700 text-xs font-bold rounded-xl border border-[#cbd5e1] shadow-2xs transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
            >
              <ImageIcon className="h-4 w-4" />
              <span>{isExportingJpg ? 'JPG তৈরি হচ্ছে...' : 'JPG ছবি'}</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setDonorReorderTargetHouse(selectedHouse);
                setShowDonorReorderModal(true);
              }}
              className="px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white text-xs font-black rounded-xl shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
              title="প্রিন্টের আগে দাতার নামের ক্রম উপরে-নিচে পরিবর্তন করুন"
            >
              <ArrowUpDown className="h-4 w-4" />
              <span>দাতার ক্রম পরিবর্তন</span>
            </button>

            <button
              id="house-report-print-sheet-direct-btn"
              type="button"
              onClick={handleDirectPrint}
              className="px-3 py-2 bg-white hover:bg-[#f1f5f9] text-gray-800 text-xs font-bold rounded-xl border border-[#cbd5e1] shadow-2xs transition flex items-center space-x-1.5 cursor-pointer"
            >
              <Printer className="h-4 w-4 text-[#0f766e]" />
              <span>প্রিন্ট করুন</span>
            </button>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. LIVE A4 COLLECTION SHEET / HOUSE REPORT DOCUMENT PREVIEW */}
      {/* ========================================================================= */}
      <div className="bg-[#f1f5f9] p-2 sm:p-6 rounded-2xl border border-[#cbd5e1] shadow-inner flex justify-center overflow-x-auto">
        <div
          id="house-report-sheet-print-area"
          className={`text-black font-sans bg-white w-full max-w-[794px] ${sheetLayout === 'single' ? 'min-h-[1100px] justify-between p-3.5 sm:p-5' : 'min-h-0 justify-start p-4 sm:p-6'} border border-gray-900 shadow-xl rounded-sm flex flex-col`}
        >
          {sheetLayout === 'single' ? (
            /* ================= SINGLE HOUSE LAYOUT (24 ROWS) ================= */
            <div className="space-y-2 flex-grow flex flex-col justify-between">
              <div className="space-y-2">
                {/* Official Clean Islamic Header */}
                <div className="border-b-2 border-gray-900 pb-1.5">
                  <div className="text-center mb-0.5">
                    <span className="text-xs font-serif font-bold text-gray-800 tracking-wider block">
                      بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                    </span>
                    <span className="text-[10px] text-gray-600 font-medium tracking-widest uppercase">
                      বিসমিল্লাহির রাহমানির রাহিম
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-3 pt-0.5">
                    {/* Organization Logo */}
                    <div className="shrink-0">
                      <img
                        src={logo}
                        onError={handleLogoError}
                        alt="Logo"
                        className="w-13 h-13 sm:w-15 sm:h-15 object-contain rounded-full border border-gray-800 p-0.5 bg-white"
                        referrerPolicy="no-referrer"
                      />
                    </div>

                    {/* Headline and Address */}
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

                    {/* Denomination Box */}
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
                      <span className="text-gray-700 font-bold">হিসাব বছর:</span>
                      <span className="font-bold text-black">{toBanglaNum(selectedYear)} খ্রি.</span>
                    </div>
                  </div>
                </div>

                {/* 24 Rows Donors Table - Expanded Width & Height, All Text Centered */}
                <div className="w-full">
                  <table className="w-full border-collapse border border-gray-900 text-xs">
                    <thead>
                      <tr className="bg-gray-100 text-black border-b-2 border-gray-900 font-black">
                        <th className="border border-gray-900 px-1 py-1.5 text-center align-middle w-12 text-[11px]">ক্রমিক</th>
                        <th className="border border-gray-900 px-2 py-1.5 text-center align-middle text-[12px]">দাতার নাম ও পরিচয়</th>
                        <th className="border border-gray-900 px-2 py-1.5 text-center align-middle w-32 text-[12px]">আদায়কৃত টাকা</th>
                        <th className="border border-gray-900 px-1 py-1.5 text-center align-middle w-20 text-[11px]">রশিদ নং</th>
                        <th className="border border-gray-900 px-1 py-1.5 text-center align-middle w-24 text-[11px]">আদায়ের তারিখ</th>
                        <th className="border border-gray-900 px-2 py-1.5 text-center align-middle w-36 text-[11px]">মন্তব্য / বিবরণ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {Array.from({ length: Math.max(24, selectedHouseDonors.length) }).map((_, index) => {
                        const donor = selectedHouseDonors[index];
                        return (
                          <tr key={index} className="border-b border-gray-400 h-[34px] hover:bg-gray-50">
                            <td className="border border-gray-900 px-1 py-0.5 text-center align-middle font-bold text-gray-800 text-[11px]">
                              <span>{toBanglaNum(index + 1)}</span>
                            </td>
                            <td className="border border-gray-900 px-2 py-0.5 text-center align-middle font-bold text-black text-[12px] truncate max-w-[220px]">
                              {donor ? donor.donorName : ''}
                            </td>
                            <td className="border border-gray-900 px-2 py-0.5 text-center align-middle font-black text-black text-[12px]">
                              {donor ? (
                                donor.donationType === 'item' || (donor.itemName && (!donor.amount || donor.amount === 0)) ? (
                                  <span className="text-[11px] text-purple-900 font-black">
                                    📦 {donor.itemName || 'পণ্য'}
                                  </span>
                                ) : (
                                  `৳ ${toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-`
                                )
                              ) : (
                                ''
                              )}
                            </td>
                            <td className="border border-gray-900 px-1 py-0.5 text-center align-middle text-gray-800 font-medium text-[11px]">
                              {donor?.receiptNo ? toBanglaNum(donor.receiptNo) : ''}
                            </td>
                            <td className="border border-gray-900 px-1 py-0.5 text-center align-middle text-gray-700 font-medium text-[11px]">
                              {donor?.date ? toEnglishDate(donor.date) : ''}
                            </td>
                            <td className="border border-gray-900 px-2 py-0.5 text-center align-middle text-[11px] text-gray-700">
                              {donor?.notes || (donor?.itemName ? donor.itemName : '')}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                {/* Total Cash Summary Row */}
                <div className="border border-gray-900 bg-gray-100 p-1.5 rounded flex items-center justify-between text-xs font-bold">
                  <div>
                    <span className="text-gray-800">কথায়: </span>
                    <span className="text-black font-black">
                      {numberToBanglaWords(selectedHouseDonors.reduce((sum, d) => sum + (d.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-sm">
                    <span className="text-gray-900 font-black">সর্বমোট আদায়:</span>
                    <span className="text-black font-black text-base border-b-2 border-gray-900 px-1">
                      ৳ {toBanglaNum(selectedHouseDonors.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('bn-BD'))}/-
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* ================= DUAL HOUSE LAYOUT (1 PAGE = 2 HOUSES) ================= */
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

                {/* Organization Header */}
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
                      <span className="text-gray-700 font-bold">হিসাব বছর:</span>
                      <span className="font-bold text-black">{toBanglaNum(selectedYear)} খ্রি.</span>
                    </div>
                  </div>
                </div>

                {/* 10 Rows Table for House 1 */}
                <table className="w-full border-collapse border border-gray-900 text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 text-black border-b border-gray-900 font-black">
                      <th className="border border-gray-900 px-1 py-0.5 text-center w-8">ক্রমিক</th>
                      <th className="border border-gray-900 px-2 py-0.5 text-left">দাতার নাম ও পরিচয়</th>
                      <th className="border border-gray-900 px-2 py-0.5 text-right w-20">আদায়কৃত টাকা</th>
                      <th className="border border-gray-900 px-1 py-0.5 text-center w-16">রশিদ নং</th>
                      <th className="border border-gray-900 px-1 py-0.5 text-center w-20">আদায়ের তারিখ</th>
                      <th className="border border-gray-900 px-2 py-0.5 text-left w-24">মন্তব্য / বিবরণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, index) => {
                      const donor = selectedHouseDonors[index];
                      return (
                        <tr key={index} className="border-b border-gray-400 h-6">
                          <td className="border border-gray-900 px-1 py-0.5 text-center font-bold text-gray-800">
                            <span>{toBanglaNum(index + 1)}</span>
                          </td>
                          <td className="border border-gray-900 px-2 py-0.5 font-bold text-black truncate max-w-[180px]">
                            {donor?.donorName || ''}
                          </td>
                          <td className="border border-gray-900 px-2 py-0.5 text-right font-black text-black">
                            {donor ? (
                              donor.donationType === 'item' || (donor.itemName && (!donor.amount || donor.amount === 0)) ? (
                                <span className="text-[9px] text-purple-900 font-black">
                                  📦 {donor.itemName || 'পণ্য'}
                                </span>
                              ) : (
                                `৳ ${toBanglaNum(donor.amount.toLocaleString('bn-BD'))}`
                              )
                            ) : (
                              ''
                            )}
                          </td>
                          <td className="border border-gray-900 px-1 py-0.5 text-center text-gray-800 font-medium">
                            {donor?.receiptNo ? toBanglaNum(donor.receiptNo) : ''}
                          </td>
                          <td className="border border-gray-900 px-1 py-0.5 text-center text-gray-700 font-medium text-[9px]">
                            {donor?.date ? toEnglishDate(donor.date) : ''}
                          </td>
                          <td className="border border-gray-900 px-2 py-0.5 text-[9px] text-gray-700">
                            {donor?.notes || (donor?.itemName ? donor.itemName : '')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Total Cash Summary Row for House 1 */}
                <div className="border border-gray-900 bg-gray-100 p-1 px-2 rounded flex items-center justify-between text-[10px] font-bold">
                  <div>
                    <span className="text-gray-800">কথায়: </span>
                    <span className="text-black font-black">
                      {numberToBanglaWords(selectedHouseDonors.reduce((sum, d) => sum + (d.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-900 font-black">সর্বমোট আদায়:</span>
                    <span className="text-black font-black text-sm border-b border-gray-900 px-1">
                      ৳ {toBanglaNum(selectedHouseDonors.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('bn-BD'))}/-
                    </span>
                  </div>
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

                {/* Organization Header */}
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
                      <span className="text-gray-700 font-bold">হিসাব বছর:</span>
                      <span className="font-bold text-black">{toBanglaNum(selectedYear)} খ্রি.</span>
                    </div>
                  </div>
                </div>

                {/* 10 Rows Table for House 2 */}
                <table className="w-full border-collapse border border-gray-900 text-[10px]">
                  <thead>
                    <tr className="bg-gray-100 text-black border-b border-gray-900 font-black">
                      <th className="border border-gray-900 px-1 py-0.5 text-center w-8">ক্রমিক</th>
                      <th className="border border-gray-900 px-2 py-0.5 text-left">দাতার নাম ও পরিচয়</th>
                      <th className="border border-gray-900 px-2 py-0.5 text-right w-20">আদায়কৃত টাকা</th>
                      <th className="border border-gray-900 px-1 py-0.5 text-center w-16">রশিদ নং</th>
                      <th className="border border-gray-900 px-1 py-0.5 text-center w-20">আদায়ের তারিখ</th>
                      <th className="border border-gray-900 px-2 py-0.5 text-left w-24">মন্তব্য / বিবরণ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Array.from({ length: 10 }).map((_, index) => {
                      const donor = secondHouseDonors[index];
                      return (
                        <tr key={index} className="border-b border-gray-400 h-6">
                          <td className="border border-gray-900 px-1 py-0.5 text-center font-bold text-gray-800">
                            <span>{toBanglaNum(index + 1)}</span>
                          </td>
                          <td className="border border-gray-900 px-2 py-0.5 font-bold text-black truncate max-w-[180px]">
                            {donor?.donorName || ''}
                          </td>
                          <td className="border border-gray-900 px-2 py-0.5 text-right font-black text-black">
                            {donor ? (
                              donor.donationType === 'item' || (donor.itemName && (!donor.amount || donor.amount === 0)) ? (
                                <span className="text-[9px] text-purple-900 font-black">
                                  📦 {donor.itemName || 'পণ্য'}
                                </span>
                              ) : (
                                `৳ ${toBanglaNum(donor.amount.toLocaleString('bn-BD'))}`
                              )
                            ) : (
                              ''
                            )}
                          </td>
                          <td className="border border-gray-900 px-1 py-0.5 text-center text-gray-800 font-medium">
                            {donor?.receiptNo ? toBanglaNum(donor.receiptNo) : ''}
                          </td>
                          <td className="border border-gray-900 px-1 py-0.5 text-center text-gray-700 font-medium text-[9px]">
                            {donor?.date ? toEnglishDate(donor.date) : ''}
                          </td>
                          <td className="border border-gray-900 px-2 py-0.5 text-[9px] text-gray-700">
                            {donor?.notes || (donor?.itemName ? donor.itemName : '')}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>

                {/* Total Cash Summary Row for House 2 */}
                <div className="border border-gray-900 bg-gray-100 p-1 px-2 rounded flex items-center justify-between text-[10px] font-bold">
                  <div>
                    <span className="text-gray-800">কথায়: </span>
                    <span className="text-black font-black">
                      {numberToBanglaWords(secondHouseDonors.reduce((sum, d) => sum + (d.amount || 0), 0))}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-gray-900 font-black">সর্বমোট আদায়:</span>
                    <span className="text-black font-black text-sm border-b border-gray-900 px-1">
                      ৳ {toBanglaNum(secondHouseDonors.reduce((sum, d) => sum + (d.amount || 0), 0).toLocaleString('bn-BD'))}/-
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Donation Receipt Modal if required */}
      {showReceiptModal && (
        <DonationReceiptModal
          isOpen={showReceiptModal}
          initialData={selectedDonorForReceipt}
          existingTransactions={transactions}
          onClose={() => {
            setShowReceiptModal(false);
            setSelectedDonorForReceipt(null);
          }}
        />
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

      {/* Duplicate Posting Audit Modal */}
      <DuplicateAuditModal
        isOpen={showDuplicateModal}
        onClose={() => setShowDuplicateModal(false)}
        transactions={transactions}
        onDeleteTransaction={onDeleteTransaction}
        initialYear={selectedYear}
      />
    </div>
  );
}
