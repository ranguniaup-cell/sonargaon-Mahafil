import React from 'react';
import { Transaction, MahfilDetails } from '../types';
import jsPDF from 'jspdf';
import { renderSafeCanvas, exportElementToPdf, downloadCanvasAsImage } from '../utils/html2canvasSafe';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { 
  Home, 
  User, 
  Coins, 
  Plus, 
  Trash2, 
  Search, 
  Filter, 
  Calendar, 
  Check, 
  AlertCircle, 
  Building2, 
  ArrowUpRight, 
  Users, 
  BookOpen,
  ClipboardList,
  Printer,
  Download,
  X,
  FileText,
  Edit,
  Save,
  Package,
  Image as ImageIcon,
  ChevronUp,
  ChevronDown,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ListOrdered,
  SlidersHorizontal,
  ChevronLeft,
  ChevronRight,
  MoveUp,
  MoveDown,
  ArrowRightLeft,
  Lock,
  KeyRound,
  ShieldCheck
} from 'lucide-react';
import { toEnglishDigits, cleanNumericInput } from '../lib/numberUtils';

interface HouseDonationsSectionProps {
  transactions: Transaction[];
  onAddTransaction: (newT: Omit<Transaction, 'id'>) => Promise<void>;
  onDeleteTransaction: (id: string) => Promise<void>;
  onUpdateTransaction?: (updatedT: Transaction) => Promise<void>;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn?: (val: boolean) => void;
  mahfilDetails?: MahfilDetails;
  activeHouses?: string[];
  deletedHouses?: string[];
  donorOrders?: Record<string, string[]>;
  onUpdateDonorOrder?: (key: string, orderedIds: string[]) => Promise<void> | void;
  onUpdateHouses?: (active: string[], deleted: string[]) => Promise<void> | void;
}

export default function HouseDonationsSection({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  onUpdateTransaction,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  mahfilDetails,
  activeHouses: activeHousesProp,
  deletedHouses: deletedHousesProp,
  donorOrders,
  onUpdateDonorOrder,
  onUpdateHouses
}: HouseDonationsSectionProps) {
  const [selectedYear, setSelectedYear] = React.useState<string>('2026');
  const [selectedHouse, setSelectedHouse] = React.useState<string>('');
  const [searchQuery, setSearchQuery] = React.useState('');

  // Admin authorization for posting form
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

  // House Rename State
  const [editingHouseName, setEditingHouseName] = React.useState<string | null>(null);
  const [renameValue, setRenameValue] = React.useState('');

  // Donor Editing State
  const [editingDonorId, setEditingDonorId] = React.useState<string | null>(null);
  const [editDonorName, setEditDonorName] = React.useState('');
  const [editDonorHouseName, setEditDonorHouseName] = React.useState('');
  const [isCustomEditHouse, setIsCustomEditHouse] = React.useState(false);
  const [customEditHouseName, setCustomEditHouseName] = React.useState('');
  const [editDonationType, setEditDonationType] = React.useState<'cash' | 'item'>('cash');
  const [editDonorItemName, setEditDonorItemName] = React.useState('');
  const [editDonorAmount, setEditDonorAmount] = React.useState('');
  const [editDonorReceipt, setEditDonorReceipt] = React.useState('');
  const [editDonorDate, setEditDonorDate] = React.useState('');

  // Quick House Transfer States (সহজে বাড়ি পরিবর্তন)
  const [quickTransferDonor, setQuickTransferDonor] = React.useState<Transaction | null>(null);
  const [targetHouseForTransfer, setTargetHouseForTransfer] = React.useState<string>('');
  const [isCustomTargetHouse, setIsCustomTargetHouse] = React.useState<boolean>(false);
  const [customTargetHouseName, setCustomTargetHouseName] = React.useState<string>('');
  const [houseSearchFilter, setHouseSearchFilter] = React.useState<string>('');
  const [navigateAfterTransfer, setNavigateAfterTransfer] = React.useState<boolean>(true);
  const [isTransferring, setIsTransferring] = React.useState<boolean>(false);

  // Custom House Addition State
  const [showNewHouseInput, setShowNewHouseInput] = React.useState(false);
  const [newHouseName, setNewHouseName] = React.useState('');
  const [directNewHouseName, setDirectNewHouseName] = React.useState('');

  // Form State for Adding Donor
  const [donorName, setDonorName] = React.useState('');
  const [donationType, setDonationType] = React.useState<'cash' | 'item'>('cash');
  const [itemName, setItemName] = React.useState('');
  const [amount, setAmount] = React.useState('');
  const [receiptNo, setReceiptNo] = React.useState('');
  const [date, setDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [recordedBy, setRecordedBy] = React.useState('মো: তারেক জামাল');
  
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [successMsg, setSuccessMsg] = React.useState('');
  const [errorMsg, setErrorMsg] = React.useState('');

  // Print & Receipt States
  const [showCollectionSheetModal, setShowCollectionSheetModal] = React.useState(false);
  const [collectionSheetLayout, setCollectionSheetLayout] = React.useState<'single' | 'dual'>('single');
  const [secondHouseForDual, setSecondHouseForDual] = React.useState<string>('');
  const [showReceiptModal, setShowReceiptModal] = React.useState(false);
  const [selectedDonorForReceipt, setSelectedDonorForReceipt] = React.useState<Transaction | null>(null);
  const [isDownloadingPdf, setIsDownloadingPdf] = React.useState(false);
  const [isDownloadingReceiptPdf, setIsDownloadingReceiptPdf] = React.useState(false);
  const [isDownloadingReceiptImage, setIsDownloadingReceiptImage] = React.useState(false);
  const [triggerAutoReceiptDownload, setTriggerAutoReceiptDownload] = React.useState(false);

  // House Reordering & Print Sequence States
  const [houseSortMode, setHouseSortMode] = React.useState<'custom' | 'amount'>('custom');
  const [showReorderModal, setShowReorderModal] = React.useState(false);

  // Donor Reordering States
  const [showDonorReorderModal, setShowDonorReorderModal] = React.useState(false);
  const [donorReorderTargetHouse, setDonorReorderTargetHouse] = React.useState<string>('');

  const handleDownloadPDF = async () => {
    const printArea = document.getElementById('print-area');
    if (!printArea) return;

    setIsDownloadingPdf(true);

    try {
      // Save original scroll positions of both window and the parent modal scroll container
      const originalWindowScrollY = window.scrollY;
      const originalWindowScrollX = window.scrollX;
      
      const modalScrollContainer = printArea.closest('.overflow-y-auto') as HTMLElement;
      const originalModalScrollTop = modalScrollContainer ? modalScrollContainer.scrollTop : 0;
      const originalModalScrollLeft = modalScrollContainer ? modalScrollContainer.scrollLeft : 0;

      // Reset scroll positions temporarily to (0,0) to prevent offset bugs
      window.scrollTo(0, 0);
      if (modalScrollContainer) {
        modalScrollContainer.scrollTop = 0;
        modalScrollContainer.scrollLeft = 0;
      }

      await new Promise((resolve) => setTimeout(resolve, 50));

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
          const clonedPrintArea = clonedDoc.getElementById('print-area') as HTMLElement | null;
          if (clonedPrintArea) {
            let parent = clonedPrintArea.parentElement as HTMLElement | null;
            while (parent && parent !== clonedDoc.body) {
              parent.style.width = 'auto';
              parent.style.maxWidth = 'none';
              parent.style.minWidth = '0';
              parent.style.padding = '0';
              parent.style.margin = '0';
              parent.style.overflow = 'visible';
              parent = parent.parentElement as HTMLElement | null;
            }

            clonedPrintArea.style.width = '794px';
            clonedPrintArea.style.padding = '18px 22px';
            clonedPrintArea.style.boxSizing = 'border-box';
            clonedPrintArea.style.backgroundColor = '#ffffff';
          }
        }
      });

      // Restore original scroll positions
      window.scrollTo(originalWindowScrollX, originalWindowScrollY);
      if (modalScrollContainer) {
        modalScrollContainer.scrollTop = originalModalScrollTop;
        modalScrollContainer.scrollLeft = originalModalScrollLeft;
      }

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

      const fileName = collectionSheetLayout === 'dual'
        ? `${selectedHouse || 'house1'}_ও_${secondHouseForDual || 'house2'}_sheet_${selectedYear}.pdf`
        : `${selectedHouse || 'collection'}_sheet_${selectedYear}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('পিডিএফ ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsDownloadingPdf(false);
    }
  };

  const handleDownloadReceiptPDF = async () => {
    const receiptArea = document.getElementById('receipt-print-wrapper') || document.getElementById('receipt-print-area');
    if (!receiptArea) return;

    setIsDownloadingReceiptPdf(true);

    try {
      const originalWindowScrollY = window.scrollY;
      const originalWindowScrollX = window.scrollX;
      
      const modalScrollContainer = receiptArea.closest('.overflow-y-auto') as HTMLElement;
      const originalModalScrollTop = modalScrollContainer ? modalScrollContainer.scrollTop : 0;
      const originalModalScrollLeft = modalScrollContainer ? modalScrollContainer.scrollLeft : 0;

      window.scrollTo(0, 0);
      if (modalScrollContainer) {
        modalScrollContainer.scrollTop = 0;
        modalScrollContainer.scrollLeft = 0;
      }

      await new Promise((resolve) => setTimeout(resolve, 80));

      const canvas = await renderSafeCanvas(receiptArea, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        logging: false,
        scrollX: 0,
        scrollY: 0,
        windowWidth: 600,
        onclone: (clonedDoc: Document) => {
          const clonedWrapper = clonedDoc.getElementById('receipt-print-wrapper') as HTMLElement | null;
          const clonedReceiptArea = clonedDoc.getElementById('receipt-print-area') as HTMLElement | null;

          if (clonedWrapper) {
            let parent = clonedWrapper.parentElement as HTMLElement | null;
            while (parent && parent !== clonedDoc.body) {
              parent.style.width = 'auto';
              parent.style.height = 'auto';
              parent.style.maxHeight = 'none';
              parent.style.maxWidth = 'none';
              parent.style.minWidth = '0';
              parent.style.padding = '0';
              parent.style.margin = '0';
              parent.style.overflow = 'visible';
              parent = parent.parentElement as HTMLElement | null;
            }

            clonedWrapper.style.width = '550px';
            clonedWrapper.style.height = 'auto';
            clonedWrapper.style.padding = '12px';
            clonedWrapper.style.boxSizing = 'border-box';
            clonedWrapper.style.backgroundColor = '#f8fafc';
          }

          if (clonedReceiptArea) {
            clonedReceiptArea.style.width = '100%';
            clonedReceiptArea.style.height = 'auto';
            clonedReceiptArea.style.maxHeight = 'none';
            clonedReceiptArea.style.padding = '25px';
            clonedReceiptArea.style.boxSizing = 'border-box';
            clonedReceiptArea.style.backgroundColor = '#f8fafc';
          }
        }
      });

      window.scrollTo(originalWindowScrollX, originalWindowScrollY);
      if (modalScrollContainer) {
        modalScrollContainer.scrollTop = originalModalScrollTop;
        modalScrollContainer.scrollLeft = originalModalScrollLeft;
      }

      const imgData = canvas.toDataURL('image/jpeg', 1.0);
      
      const pdf = new jsPDF({
        orientation: 'landscape',
        unit: 'mm',
        format: 'a5',
      });

      const imgWidth = 210;
      const pageHeight = 148;
      const margin = 8;
      
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

      const fileName = `Donation_Receipt_${selectedDonorForReceipt?.donorName || 'donation'}.pdf`;
      pdf.save(fileName);
    } catch (error) {
      console.error('Error generating receipt PDF:', error);
    } finally {
      setIsDownloadingReceiptPdf(false);
    }
  };

  const handleDownloadReceiptImage = async () => {
    const receiptArea = document.getElementById('receipt-print-wrapper') || document.getElementById('receipt-print-area');
    if (!receiptArea) return;

    setIsDownloadingReceiptImage(true);

    try {
      const canvas = await renderSafeCanvas(receiptArea, {
        scale: 2.5,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#f8fafc',
        logging: false,
      });

      const safeName = (selectedDonorForReceipt?.donorName || 'donation').replace(/[\s/]/g, '_');
      downloadCanvasAsImage(canvas, `Donation_Receipt_${safeName}.png`, 'image/png');
    } catch (error) {
      console.error('Error generating receipt image:', error);
      alert('ছবি ডাউনলোড করতে সমস্যা হয়েছে।');
    } finally {
      setIsDownloadingReceiptImage(false);
    }
  };

  React.useEffect(() => {
    if (triggerAutoReceiptDownload && selectedDonorForReceipt && showReceiptModal) {
      const timer = setTimeout(() => {
        handleDownloadReceiptPDF().then(() => {
          setTriggerAutoReceiptDownload(false);
          setShowReceiptModal(false);
          setSelectedDonorForReceipt(null);
        }).catch((err) => {
          console.error(err);
          setTriggerAutoReceiptDownload(false);
          setShowReceiptModal(false);
          setSelectedDonorForReceipt(null);
        });
      }, 400); // 400ms is perfect for rendering the double-border receipt
      return () => clearTimeout(timer);
    }
  }, [triggerAutoReceiptDownload, selectedDonorForReceipt, showReceiptModal]);

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

  // Convert Gregorian date (YYYY-MM-DD) to English formatted date (e.g., 05/09/2026)
  const toEnglishDate = (dateStr: string): string => {
    if (!dateStr) return '';
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const [year, month, day] = parts;
    return `${day}/${month}/${year}`;
  };

  // Convert number to Bengali words for receipt
  const toBanglaWords = (num: number): string => {
    const units = ['', 'এক', 'দুই', 'তিন', 'চার', 'পাঁচ', 'ছয়', 'সাত', 'আট', 'নয়'];
    const tens = ['', 'দশ', 'বিশ', 'ত্রিশ', 'চল্লিশ', 'পঞ্চাশ', 'ষাট', 'সত্তর', 'আশি', 'নব্বই'];
    
    if (num === 0) return 'শূণ্য';
    
    const convert = (n: number): string => {
      let words = '';
      
      if (n >= 100000) {
        const lakhs = Math.floor(n / 100000);
        words += convert(lakhs) + ' লাখ ';
        n %= 100000;
      }
      
      if (n >= 1000) {
        const thousands = Math.floor(n / 1000);
        words += convert(thousands) + ' হাজার ';
        n %= 1000;
      }
      
      if (n >= 100) {
        const hundreds = Math.floor(n / 100);
        words += units[hundreds] + ' শত ';
        n %= 100;
      }
      
      if (n > 0) {
        if (words !== '') words += ' ';
        if (n < 10) {
          words += units[n];
        } else if (n < 20) {
          const teens = ['দশ', 'এগারো', 'বারো', 'তেরো', 'চৌদ্দ', 'পনেরো', 'ষোলো', 'সতেরো', 'আঠারো', 'উনিশ'];
          words += teens[n - 10];
        } else {
          const ten = Math.floor(n / 10);
          const unit = n % 10;
          words += tens[ten] + (unit > 0 ? ' ' + units[unit] : '');
        }
      }
      return words.trim();
    };
    
    return convert(num) + ' টাকা মাত্র';
  };

  // Extract unique house names from all transactions and merge with active houses
  const dynamicHouses = React.useMemo(() => {
    const housesInDb = transactions
      .filter((t) => t.houseName)
      .map((t) => t.houseName as string);
    
    const combined = [...activeHouses, ...housesInDb];
    return Array.from(new Set(combined))
      .filter(Boolean)
      .filter((house) => !deletedHouses.includes(house));
  }, [transactions, activeHouses, deletedHouses]);

  // Helper to get house serial number based on dynamicHouses list
  const getHouseSerialNum = (houseName: string): number => {
    const idx = dynamicHouses.indexOf(houseName);
    return idx >= 0 ? idx + 1 : 1;
  };

  // Filter house-specific transactions for the chosen year
  const houseTransactionsForYear = React.useMemo(() => {
    return transactions.filter((t) => {
      const isHouseDonation = t.houseName || t.category === 'বাড়ি ভিত্তিক চাঁদা';
      const matchesYear = (t.year?.toString() || t.date?.split('-')[0]) === selectedYear;
      const isNotDeleted = !t.houseName || !deletedHouses.includes(t.houseName);
      return isHouseDonation && matchesYear && isNotDeleted;
    });
  }, [transactions, selectedYear, deletedHouses]);

  // Calculations for Stats Card
  const totalCollected = React.useMemo(() => {
    return houseTransactionsForYear.reduce((sum, t) => sum + t.amount, 0);
  }, [houseTransactionsForYear]);

  const uniqueHousesWithDonations = React.useMemo(() => {
    const houses = houseTransactionsForYear.map((t) => t.houseName).filter(Boolean);
    return Array.from(new Set(houses)).length;
  }, [houseTransactionsForYear]);

  const totalDonors = houseTransactionsForYear.length;

  // Group donations by House Name for the selected year
  const houseDonationStats = React.useMemo(() => {
    const stats: Record<string, { total: number; donorsCount: number }> = {};
    
    // Initialize all dynamic houses with 0 values
    dynamicHouses.forEach((house) => {
      stats[house] = { total: 0, donorsCount: 0 };
    });

    // Populate actual donations
    houseTransactionsForYear.forEach((t) => {
      const hName = t.houseName || 'অন্যান্য';
      if (!stats[hName]) {
        stats[hName] = { total: 0, donorsCount: 0 };
      }
      stats[hName].total += t.amount;
      stats[hName].donorsCount += 1;
    });

    // Convert to list
    const list = Object.entries(stats).map(([name, data]) => ({
      name,
      total: data.total,
      donorsCount: data.donorsCount
    }));

    if (houseSortMode === 'amount') {
      return list.sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
    }

    // Default: Sort strictly by dynamicHouses order (Custom Sequential Print Order)
    return list.sort((a, b) => {
      const idxA = dynamicHouses.indexOf(a.name);
      const idxB = dynamicHouses.indexOf(b.name);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.name.localeCompare(b.name);
    });
  }, [dynamicHouses, houseTransactionsForYear, houseSortMode]);

  // Find highest donating house
  const highestDonatingHouse = React.useMemo(() => {
    if (houseDonationStats.length === 0) return { name: 'নাই', amount: 0 };
    const maxStat = houseDonationStats.reduce((max, s) => s.total > max.total ? s : max, { name: 'নাই', total: 0 });
    return { name: maxStat.name, amount: maxStat.total };
  }, [houseDonationStats]);

  // Set default selected house if none chosen yet or if house was deleted
  React.useEffect(() => {
    if (!selectedHouse && houseDonationStats.length > 0) {
      setSelectedHouse(houseDonationStats[0].name);
    }
  }, [houseDonationStats, selectedHouse]);

  // Handle donation save
  const handleSaveDonation = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');

    if (!isAdminLoggedIn) {
      setErrorMsg('অননুমোদিত চেষ্টা! চাঁদা পোস্টিং শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিনের জন্য সুরক্ষিত।');
      return;
    }

    const targetHouse = showNewHouseInput ? newHouseName.trim() : selectedHouse;

    if (!targetHouse) {
      setErrorMsg('অনুগ্রহ করে একটি বাড়ির নাম নির্বাচন করুন বা নতুন বাড়ি লিখুন।');
      return;
    }
    if (!donorName.trim()) {
      setErrorMsg('অনুগ্রহ করে চাঁদাদাতার নাম লিখুন।');
      return;
    }

    let finalAmount = 0;
    if (donationType === 'item') {
      if (!itemName.trim()) {
        setErrorMsg('অনুগ্রহ করে দানকৃত পণ্যের নাম ও বিবরণ লিখুন (যেমন: ১ বস্তা চাল, ৫ কেজি তেল, ১টি ছাগল)।');
        return;
      }
      finalAmount = amount ? (parseFloat(amount) || 0) : 0;
    } else {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setErrorMsg('অনুগ্রহ করে সঠিক চাঁদার পরিমাণ (টাকা) লিখুন।');
        return;
      }
      finalAmount = parseFloat(amount);
    }

    setIsSubmitting(true);
    try {
      const yearNum = parseInt(selectedYear, 10);
      const donationData: Omit<Transaction, 'id'> = {
        date,
        type: 'income',
        category: 'বাড়ি ভিত্তিক চাঁদা',
        amount: finalAmount,
        donorName: donorName.trim(),
        receiptNo: receiptNo.trim() || undefined,
        recordedBy: recordedBy.trim() || 'মো: তারেক জামাল',
        year: yearNum,
        houseName: targetHouse,
        donationType,
        itemName: donationType === 'item' ? itemName.trim() : undefined,
        description: donationType === 'item' ? itemName.trim() : undefined
      };

      await onAddTransaction(donationData);
      
      // Reset form on success
      setDonorName('');
      setAmount('');
      setItemName('');
      setDonationType('cash');
      setReceiptNo('');
      if (showNewHouseInput) {
        const hName = newHouseName.trim();
        if (hName && !activeHouses.includes(hName)) {
          const updatedActive = [...activeHouses, hName];
          const updatedDeleted = deletedHouses.filter((h) => h !== hName);
          if (onUpdateHouses) {
            onUpdateHouses(updatedActive, updatedDeleted);
          }
        }
        setSelectedHouse(hName);
        setNewHouseName('');
        setShowNewHouseInput(false);
      }
      setSuccessMsg(donationType === 'item' 
        ? 'বাড়ি ভিত্তিক পণ্য দান সফলভাবে এন্ট্রি হয়েছে!' 
        : 'বাড়ি ভিত্তিক চাঁদা সফলভাবে যুক্ত হয়েছে এবং আয় বিবরণীতে যোগ হয়েছে!');
      
      // Auto-dismiss success message
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      console.error(err);
      setErrorMsg('ডাটাবেজে চাঁদা যুক্ত করার সময় ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle deleting a house name from activeHouses
  const handleDeleteHouse = (houseToDelete: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent choosing this house on click
    
    // Check if there are any recorded donations for this house in the chosen year
    const hasTransactions = houseTransactionsForYear.some((t) => t.houseName === houseToDelete);
    
    let confirmMsg = `আপনি কি নিশ্চিতভাবে "${houseToDelete}" বাড়িটি তালিকা থেকে ডিলিট করতে চান?`;
    if (hasTransactions) {
      confirmMsg += `\n\nসতর্কতা: এই বাড়ির অধীনে ইতিমধ্যে চাঁদা আদায়ের এন্ট্রি রয়েছে। বাড়িটি ডিলিট করলেও পূর্বের এন্ট্রিগুলো বহাল থাকবে।`;
    }
    
    if (window.confirm(confirmMsg)) {
      const updatedDeleted = [...deletedHouses, houseToDelete];
      const updatedActive = activeHouses.filter((h) => h !== houseToDelete);
      if (onUpdateHouses) {
        onUpdateHouses(updatedActive, updatedDeleted);
      }
      
      // If the deleted house was selected, select the first remaining one
      if (selectedHouse === houseToDelete) {
        const remaining = updatedActive.length > 0 ? updatedActive[0] : '';
        setSelectedHouse(remaining);
      }
      
      setSuccessMsg(`"${houseToDelete}" বাড়িটি সফলভাবে ডিলিট করা হয়েছে।`);
      setTimeout(() => setSuccessMsg(''), 4000);
    }
  };

  // Start house rename flow
  const handleStartRenameHouse = (houseName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingHouseName(houseName);
    setRenameValue(houseName);
  };

  // Save renamed house name
  const handleSaveRenameHouse = async (oldName: string) => {
    const newName = renameValue.trim();
    if (!newName) {
      setErrorMsg('বাড়ির নাম খালি হতে পারবে না।');
      return;
    }
    if (newName === oldName) {
      setEditingHouseName(null);
      return;
    }

    // Update active houses
    let updatedActive = [...activeHouses];
    const idx = updatedActive.indexOf(oldName);
    if (idx !== -1) {
      updatedActive[idx] = newName;
    } else {
      updatedActive.push(newName);
    }
    if (onUpdateHouses) {
      onUpdateHouses(updatedActive, deletedHouses);
    }

    // Update transactions with the old house name in the DB
    const affectedTransactions = transactions.filter((t) => t.houseName === oldName);
    if (affectedTransactions.length > 0) {
      setIsSubmitting(true);
      try {
        for (const t of affectedTransactions) {
          const updatedT = { ...t, houseName: newName };
          if (onUpdateTransaction) {
            await onUpdateTransaction(updatedT);
          }
        }
      } catch (err) {
        console.error('Error updating house name in transactions:', err);
      } finally {
        setIsSubmitting(false);
      }
    }

    // Update selectedHouse if it was renamed
    if (selectedHouse === oldName) {
      setSelectedHouse(newName);
    }

    setEditingHouseName(null);
    setSuccessMsg(`"${oldName}" নাম পরিবর্তন করে "${newName}" করা হয়েছে।`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Direct Add House to active list
  const handleDirectAddHouse = () => {
    const hName = directNewHouseName.trim();
    if (!hName) {
      setErrorMsg('দয়া করে বাড়ির নাম লিখুন।');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    if (activeHouses.includes(hName)) {
      setErrorMsg('এই বাড়ির নাম ইতিমধ্যে তালিকায় রয়েছে!');
      setTimeout(() => setErrorMsg(''), 4000);
      return;
    }
    
    // Check if it was previously deleted, remove from deleted list if so
    const updatedDeleted = deletedHouses.filter((h) => h !== hName);
    const updatedActive = [...activeHouses, hName];
    if (onUpdateHouses) {
      onUpdateHouses(updatedActive, updatedDeleted);
    }
    setSelectedHouse(hName);
    setDirectNewHouseName('');
    setSuccessMsg(`"${hName}" বাড়িটি সফলভাবে তালিকায় যুক্ত করা হয়েছে।`);
    setTimeout(() => setSuccessMsg(''), 4000);
  };

  // Move house up or down in print/display sequence
  const handleMoveHouse = (houseName: string, direction: 'up' | 'down', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    // Use dynamicHouses to ensure full list sequence is preserved
    const currentList = [...dynamicHouses];
    const currentIndex = currentList.indexOf(houseName);
    if (currentIndex === -1) return;
    
    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= currentList.length) return;
    
    // Swap positions
    const updatedList = [...currentList];
    const temp = updatedList[currentIndex];
    updatedList[currentIndex] = updatedList[targetIndex];
    updatedList[targetIndex] = temp;
    
    if (onUpdateHouses) {
      onUpdateHouses(updatedList, deletedHouses);
    }
    
    // Switch to custom sort mode so the reordering is immediately visible
    setHouseSortMode('custom');
    
    setSuccessMsg(`"${houseName}" বাড়িটি ${direction === 'up' ? '১ ধাপ উপরে' : '১ ধাপ নিচে'} স্থানান্তর করা হয়েছে।`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Move house to top or bottom
  const handleMoveHouseToExtreme = (houseName: string, target: 'top' | 'bottom', e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
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
    
    setHouseSortMode('custom');
    setSuccessMsg(`"${houseName}" বাড়িটি ${target === 'top' ? 'একদম শীর্ষে (১ম স্থান)' : 'একদম নিচে (শেষ স্থান)'} নেওয়া হয়েছে।`);
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Reset houses order to default
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
    // Keep unique default list
    const defaults = Array.from(new Set(defaultList));
    const others = dynamicHouses.filter((h) => !defaults.includes(h));
    const combined = [...defaults.filter(d => dynamicHouses.includes(d)), ...others].filter(
      (h) => !deletedHouses.includes(h)
    );

    if (onUpdateHouses) {
      onUpdateHouses(combined, deletedHouses);
    }
    setHouseSortMode('custom');
    setSuccessMsg('বাড়ি সমূহের ক্রম ডিফল্ট আকারে সাজানো হয়েছে।');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  // Start donor editing flow
  const handleStartEditDonor = (donor: Transaction) => {
    setEditingDonorId(donor.id);
    setEditDonorName(donor.donorName || '');
    setEditDonorHouseName(donor.houseName || selectedHouse || '');
    setIsCustomEditHouse(false);
    setCustomEditHouseName('');
    setEditDonationType(donor.donationType || (donor.itemName ? 'item' : 'cash'));
    setEditDonorItemName(donor.itemName || '');
    setEditDonorAmount(donor.amount ? donor.amount.toString() : '');
    setEditDonorReceipt(donor.receiptNo || '');
    setEditDonorDate(donor.date);
  };

  // Save edited donor details
  const handleSaveEditDonor = async (originalDonor: Transaction) => {
    let amt = parseFloat(editDonorAmount);
    if (editDonationType === 'item') {
      if (!editDonorItemName.trim()) {
        alert('অনুগ্রহ করে দানকৃত পণ্যের নাম ও বিবরণ লিখুন।');
        return;
      }
      if (isNaN(amt) || amt < 0) {
        amt = 0;
      }
    } else {
      if (isNaN(amt) || amt <= 0) {
        alert('সঠিক টাকার পরিমাণ দিন।');
        return;
      }
    }

    const finalTargetHouse = isCustomEditHouse 
      ? customEditHouseName.trim() 
      : (editDonorHouseName.trim() || selectedHouse);

    if (!finalTargetHouse) {
      alert('অনুগ্রহ করে চাঁদাদাতার বাড়ির নাম নির্বাচন করুন বা লিখুন।');
      return;
    }

    // If new custom house was entered and doesn't exist yet, auto register house
    if (isCustomEditHouse && finalTargetHouse && !dynamicHouses.includes(finalTargetHouse)) {
      const updatedDeleted = deletedHouses.filter((h) => h !== finalTargetHouse);
      const updatedActive = [...activeHouses, finalTargetHouse];
      if (onUpdateHouses) {
        onUpdateHouses(updatedActive, updatedDeleted);
      }
    }

    const updated: Transaction = {
      ...originalDonor,
      donorName: editDonorName.trim(),
      houseName: finalTargetHouse,
      amount: amt,
      donationType: editDonationType,
      itemName: editDonationType === 'item' ? editDonorItemName.trim() : undefined,
      description: editDonationType === 'item' ? editDonorItemName.trim() : originalDonor.description,
      receiptNo: editDonorReceipt.trim() || undefined,
      date: editDonorDate,
    };

    try {
      if (onUpdateTransaction) {
        await onUpdateTransaction(updated);
        const houseChanged = originalDonor.houseName !== finalTargetHouse;
        if (houseChanged) {
          setSuccessMsg(`চাঁদাদাতা "${editDonorName.trim()}"-এর বাড়ি পরিবর্তন করে সফলভাবে "${finalTargetHouse}" করা হয়েছে।`);
        } else {
          setSuccessMsg('চাঁদাদাতার তথ্য সফলভাবে আপডেট করা হয়েছে।');
        }
        setTimeout(() => setSuccessMsg(''), 4000);
      } else {
        alert('আপডেট ফাংশনটি পাওয়া যায়নি।');
      }
    } catch (err) {
      console.error(err);
      alert('আপডেট করার সময় ত্রুটি ঘটেছে।');
    } finally {
      setEditingDonorId(null);
    }
  };

  // Open quick house transfer modal
  const handleOpenQuickTransfer = (donor: Transaction) => {
    setQuickTransferDonor(donor);
    const current = donor.houseName || selectedHouse;
    const others = dynamicHouses.filter((h) => h !== current);
    setTargetHouseForTransfer(others[0] || '');
    setIsCustomTargetHouse(false);
    setCustomTargetHouseName('');
    setHouseSearchFilter('');
    setNavigateAfterTransfer(true);
  };

  // Execute quick house transfer
  const handleExecuteQuickTransfer = async () => {
    if (!quickTransferDonor) return;
    const current = quickTransferDonor.houseName || selectedHouse;
    const finalTarget = isCustomTargetHouse 
      ? customTargetHouseName.trim() 
      : targetHouseForTransfer.trim();

    if (!finalTarget) {
      alert('অনুগ্রহ করে লক্ষ্য বাড়ি নির্বাচন করুন বা নতুন বাড়ির নাম লিখুন।');
      return;
    }

    if (finalTarget === current) {
      alert('দাতার বর্তমান বাড়ি এবং নতুন বাড়ি একই। অনুগ্রহ করে ভিন্ন বাড়ি নির্বাচন করুন।');
      return;
    }

    setIsTransferring(true);
    try {
      // If it's a new custom house, register it
      if (isCustomTargetHouse && !dynamicHouses.includes(finalTarget)) {
        const updatedDeleted = deletedHouses.filter((h) => h !== finalTarget);
        const updatedActive = [...activeHouses, finalTarget];
        if (onUpdateHouses) {
          onUpdateHouses(updatedActive, updatedDeleted);
        }
      }

      const updatedDonor: Transaction = {
        ...quickTransferDonor,
        houseName: finalTarget
      };

      if (onUpdateTransaction) {
        await onUpdateTransaction(updatedDonor);
      }

      setSuccessMsg(`"${quickTransferDonor.donorName}"-কে সফলভাবে "${current}" থেকে "${finalTarget}" বাড়িতে স্থানান্তর করা হয়েছে।`);
      setTimeout(() => setSuccessMsg(''), 4500);

      if (navigateAfterTransfer) {
        setSelectedHouse(finalTarget);
      }

      setQuickTransferDonor(null);
    } catch (err) {
      console.error('Error transferring donor house:', err);
      alert('বাড়ি স্থানান্তর করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    } finally {
      setIsTransferring(false);
    }
  };

  // Helper to sort donors by custom order
  const sortDonorsList = React.useCallback((donorList: Transaction[], house: string) => {
    if (!house || donorList.length <= 1) return donorList;
    const key = `${selectedYear}_${house}`;
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

  // Get donor details of currently selected house
  const selectedHouseDonors = React.useMemo(() => {
    if (!selectedHouse) return [];
    const filtered = houseTransactionsForYear
      .filter((t) => t.houseName === selectedHouse)
      .filter((t) => {
        if (!searchQuery.trim()) return true;
        return (
          t.donorName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.receiptNo?.includes(searchQuery)
        );
      });
    return sortDonorsList(filtered, selectedHouse);
  }, [houseTransactionsForYear, selectedHouse, searchQuery, sortDonorsList]);

  // Set default second house for dual-house print mode
  React.useEffect(() => {
    if (dynamicHouses.length > 1) {
      const others = dynamicHouses.filter((h) => h !== selectedHouse);
      if (!secondHouseForDual || secondHouseForDual === selectedHouse) {
        setSecondHouseForDual(others[0] || '');
      }
    }
  }, [dynamicHouses, selectedHouse, secondHouseForDual]);

  // Get donor details of second house (for dual-house print mode)
  const secondHouseDonors = React.useMemo(() => {
    if (!secondHouseForDual) return [];
    const filtered = houseTransactionsForYear.filter((t) => t.houseName === secondHouseForDual);
    return sortDonorsList(filtered, secondHouseForDual);
  }, [houseTransactionsForYear, secondHouseForDual, sortDonorsList]);

  // Handle Moving Donors Up/Down
  const handleMoveDonor = (donorId: string, direction: 'up' | 'down', targetHouse: string = selectedHouse) => {
    const allDonorsOfHouse = houseTransactionsForYear.filter((t) => t.houseName === targetHouse);
    const sorted = sortDonorsList(allDonorsOfHouse, targetHouse);
    const currentIndex = sorted.findIndex((d) => d.id === donorId);
    if (currentIndex === -1) return;

    const newIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (newIndex < 0 || newIndex >= sorted.length) return;

    const updated = [...sorted];
    const [movedDonor] = updated.splice(currentIndex, 1);
    updated.splice(newIndex, 0, movedDonor);

    const newOrderedIds = updated.map((d) => d.id);
    const key = `${selectedYear}_${targetHouse}`;

    try {
      localStorage.setItem(`donor_order_${key}`, JSON.stringify(newOrderedIds));
    } catch {}

    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(key, newOrderedIds);
    }
  };

  const handleMoveDonorToExtreme = (donorId: string, position: 'top' | 'bottom', targetHouse: string = selectedHouse) => {
    const allDonorsOfHouse = houseTransactionsForYear.filter((t) => t.houseName === targetHouse);
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
    const key = `${selectedYear}_${targetHouse}`;

    try {
      localStorage.setItem(`donor_order_${key}`, JSON.stringify(newOrderedIds));
    } catch {}

    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(key, newOrderedIds);
    }
  };

  const handleResetDonorOrder = (targetHouse: string = selectedHouse) => {
    const key = `${selectedYear}_${targetHouse}`;
    try {
      localStorage.removeItem(`donor_order_${key}`);
    } catch {}
    if (onUpdateDonorOrder) {
      onUpdateDonorOrder(key, []);
    }
  };

  return (
    <div id="house-donations-section" className="space-y-10 pb-16 animate-fade-in text-[#3c3c3c]">
      
      {/* Title */}
      <div className="text-center max-w-3xl mx-auto space-y-2">
        <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0f766e] uppercase bg-[#0f766e]/10 px-3 py-1 rounded-full border border-[#cbd5e1]">
          বাড়ি ভিত্তিক চাঁদা ব্যবস্থাপনা
        </span>
        <h2 className="text-3xl font-extrabold text-[#064e3b] tracking-tight">
          বাড়ি ভিত্তিক চাঁদা ও আদায় খাতা
        </h2>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#d97706] to-transparent mx-auto mt-3"></div>
        <p className="text-[#3c3c3c]/80 text-xs sm:text-sm leading-relaxed font-light pt-2">
          সোনারগাঁও এলাকার বাড়ি ভিত্তিক চাঁদাদাতাদের নাম ও চাঁদা আদায়ের হিসাব এখানে এন্ট্রি করা হয়। প্রতিটি এন্ট্রি সরাসরি মূল আর্থিক তহবিলে (আয় বিবরণীতে) অটো যুক্ত হয়ে যায়।
        </p>
      </div>

      {/* Year Filter & Action Header */}
      <div className="flex flex-col sm:flex-row justify-between items-center bg-[#f1f5f9]/60 border border-[#cbd5e1] rounded-2xl p-4 sm:px-6 gap-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-[#0f766e]" />
          <span className="text-sm font-semibold text-[#064e3b]">হিসাবের বছর নির্বাচন করুন:</span>
        </div>
        
        <div className="flex space-x-2 w-full sm:w-auto">
          {['2027', '2026', '2025'].map((year) => (
            <button
              key={year}
              onClick={() => {
                setSelectedYear(year);
                setSearchQuery('');
              }}
              className={`flex-1 sm:flex-initial px-5 py-2 text-xs sm:text-sm font-black rounded-xl transition duration-200 cursor-pointer ${
                selectedYear === year
                  ? 'bg-[#0f766e] text-white shadow-md'
                  : 'bg-white hover:bg-[#e2e8f0] text-[#064e3b] border border-[#cbd5e1]'
              }`}
            >
              {toBanglaNum(year)} সাল
            </button>
          ))}
        </div>
      </div>

      {/* Stats Cards Dashboard */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Total Collected */}
        <div className="bg-white border-2 border-[#d97706]/30 rounded-2xl p-5 shadow-sm flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[#0f766e] text-xs font-bold tracking-wide block">বাড়ি ভিত্তিক মোট আদায় ({toBanglaNum(selectedYear)})</span>
            <div className="text-2xl font-black text-[#064e3b] flex items-center">
              <span className="text-[#d97706] mr-1">৳</span>
              <span>{toBanglaNum(totalCollected.toLocaleString('bn-BD'))}</span>
            </div>
            <p className="text-[10px] text-gray-400">সরাসরি আয়ে অটো যুক্ত হয়েছে</p>
          </div>
          <div className="h-10 w-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-center text-[#0f766e] group-hover:scale-110 transition duration-200">
            <Coins className="h-5 w-5" />
          </div>
        </div>

        {/* Unique Participating Houses */}
        <div className="bg-white border-2 border-[#d97706]/30 rounded-2xl p-5 shadow-sm flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[#0f766e] text-xs font-bold tracking-wide block">সংগ্রহকারী বাড়ি সংখ্যা</span>
            <div className="text-2xl font-black text-[#064e3b]">
              <span>{toBanglaNum(uniqueHousesWithDonations)}</span>
              <span className="text-sm font-light text-gray-500 ml-1">টি বাড়ি</span>
            </div>
            <p className="text-[10px] text-gray-400">এলাকার মোট সক্রিয় বাড়ি</p>
          </div>
          <div className="h-10 w-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-center text-[#0f766e] group-hover:scale-110 transition duration-200">
            <Building2 className="h-5 w-5" />
          </div>
        </div>

        {/* Total Families Contributing */}
        <div className="bg-white border-2 border-[#d97706]/30 rounded-2xl p-5 shadow-sm flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[#0f766e] text-xs font-bold tracking-wide block">মোট দাতা পরিবার</span>
            <div className="text-2xl font-black text-[#064e3b]">
              <span>{toBanglaNum(totalDonors)}</span>
              <span className="text-sm font-light text-gray-500 ml-1">জন</span>
            </div>
            <p className="text-[10px] text-gray-400">মোট রসিদ ও চাঁদা প্রদানকারী</p>
          </div>
          <div className="h-10 w-10 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl flex items-center justify-center text-[#0f766e] group-hover:scale-110 transition duration-200">
            <Users className="h-5 w-5" />
          </div>
        </div>

        {/* Highest Contributing House */}
        <div className="bg-white border-2 border-[#d97706]/30 rounded-2xl p-5 shadow-sm flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[#0f766e] text-xs font-bold tracking-wide block">সর্বোচ্চ চাঁদা দেওয়া বাড়ি</span>
            <div className="text-lg font-black text-emerald-800 truncate max-w-[150px]">
              {highestDonatingHouse.name}
            </div>
            <div className="text-xs font-bold text-[#064e3b]">
              ৳ {toBanglaNum(highestDonatingHouse.amount.toLocaleString('bn-BD'))}
            </div>
          </div>
          <div className="h-10 w-10 bg-emerald-50 border border-emerald-100 rounded-xl flex items-center justify-center text-emerald-600 group-hover:scale-110 transition duration-200">
            <ArrowUpRight className="h-5 w-5" />
          </div>
        </div>

      </div>

      {/* Main Form and Listing Content */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Column: Form to add new donor (Admin Protected) */}
        <div className="lg:col-span-4 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-6">
          {!isAdminLoggedIn ? (
            <div className="space-y-4 py-3 text-center">
              <div className="mx-auto w-14 h-14 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center justify-center text-[#0f766e]">
                <Lock className="h-7 w-7 text-[#0f766e]" />
              </div>
              <div className="space-y-1">
                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-full text-[11px] font-bold">
                  <ShieldCheck className="h-3 w-3 text-amber-600" />
                  <span>অ্যাডমিন দ্বারা সুরক্ষিত</span>
                </span>
                <h3 className="text-[#064e3b] text-base font-black">
                  চাঁদা এন্ট্রি ও পোস্টিং সুরক্ষিত
                </h3>
                <p className="text-xs text-gray-500 leading-relaxed">
                  বাড়ি ভিত্তিক নতুন চাঁদা ও পণ্য দান পোস্টিং শুধুমাত্র অনুমোদিত অ্যাডমিনের জন্য সুরক্ষিত। সাধারণ দর্শকরা তালিকা ও বিবরণী দেখতে পারবেন।
                </p>
              </div>

              <form onSubmit={handleAdminAuthSubmit} className="space-y-3 pt-2 text-left">
                <div>
                  <label className="block text-xs font-bold text-[#064e3b] mb-1 flex items-center gap-1">
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
                    placeholder="পাসওয়ার্ড লিখুন"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] focus:bg-white focus:border-[#0f766e] focus:ring-2 focus:ring-[#0f766e]/20 rounded-xl text-xs sm:text-sm font-mono outline-hidden"
                  />
                </div>

                {adminAuthError && (
                  <div className="flex items-center gap-1.5 text-xs text-red-700 bg-red-50 p-2 rounded-lg border border-red-200">
                    <AlertCircle className="h-3.5 w-3.5 shrink-0 text-red-600" />
                    <span>{adminAuthError}</span>
                  </div>
                )}

                <button
                  type="submit"
                  className="w-full py-2.5 bg-[#0f766e] hover:bg-[#064e3b] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="h-4 w-4 text-amber-300" />
                  <span>লগইন করে পোস্টিং করুন</span>
                </button>
              </form>
            </div>
          ) : (
            <>
              <div>
                <h3 className="text-[#064e3b] text-lg font-black flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-[#0f766e]" />
                  <span>নতুন চাঁদা যুক্ত করুন</span>
                </h3>
                <p className="text-xs text-gray-500 mt-1">খতিয়ান অনুযায়ী দাতার চাঁদা এন্ট্রি করুন।</p>
              </div>

              <form onSubmit={handleSaveDonation} className="space-y-4">
            
            {/* House Selector */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-[#064e3b] flex justify-between">
                <span>১. বাড়ির নাম নির্বাচন করুন *</span>
                <button
                  type="button"
                  onClick={() => {
                    setShowNewHouseInput(!showNewHouseInput);
                    setNewHouseName('');
                  }}
                  className="text-xs text-[#0f766e] hover:underline font-bold"
                >
                  {showNewHouseInput ? 'তালিকা থেকে বাছুন' : '+ নতুন বাড়ি যোগ করুন'}
                </button>
              </label>

              {showNewHouseInput ? (
                <div className="animate-fade-in">
                  <input
                    type="text"
                    required
                    value={newHouseName}
                    onChange={(e) => setNewHouseName(e.target.value)}
                    placeholder="উদা: মিয়াজী বাড়ী, সওদাগর বাড়ী"
                    className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                  />
                  <span className="text-[10px] text-gray-400 mt-1 block">নতুন এই বাড়িটি পরবর্তীতে তালিকায় সংরক্ষিত হয়ে যাবে।</span>
                </div>
              ) : (
                <select
                  value={selectedHouse}
                  onChange={(e) => {
                    setSelectedHouse(e.target.value);
                  }}
                  required
                  className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                >
                  <option value="">-- বাড়ি সিলেক্ট করুন --</option>
                  {dynamicHouses.map((house) => (
                    <option key={house} value={house}>
                      {house}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Donor Name */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-black text-[#064e3b]">
                ২. চাঁদা দাতার নাম *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-3 h-4 w-4 text-[#d97706]" />
                <input
                  type="text"
                  required
                  value={donorName}
                  onChange={(e) => setDonorName(e.target.value)}
                  placeholder="উদা: আলহাজ্ব আবুল কালাম"
                  className="w-full pl-9 pr-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                />
              </div>
            </div>

            {/* Donation Type & Amount / Item Input */}
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <label className="text-xs sm:text-sm font-black text-[#064e3b]">
                  ৩. চাঁদার ধরণ ও পরিমাণ / পণ্য *
                </label>
                <div className="flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => {
                      setDonationType('cash');
                      setItemName('');
                    }}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
                      donationType === 'cash'
                        ? 'bg-[#0f766e] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Coins className="h-3 w-3" />
                    <span>নগদ টাকা</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setDonationType('item');
                      setAmount('');
                    }}
                    className={`px-2.5 py-1 rounded-md transition cursor-pointer flex items-center space-x-1 ${
                      donationType === 'item'
                        ? 'bg-[#d97706] text-white shadow-xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Package className="h-3 w-3" />
                    <span>পণ্য / দ্রব্য দান</span>
                  </button>
                </div>
              </div>

              {donationType === 'cash' ? (
                <div className="space-y-1 animate-fade-in">
                  <div className="relative">
                    <span className="absolute left-3 top-2.5 text-[#d97706] font-bold text-sm">৳</span>
                    <input
                      type="text"
                      inputMode="numeric"
                      required={donationType === 'cash'}
                      value={amount}
                      onChange={(e) => setAmount(cleanNumericInput(e.target.value))}
                      placeholder="টাকার পরিমাণ লিখুন (উদা: ১০০০, ৫০০০)"
                      className="w-full pl-7 pr-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    />
                  </div>
                  <span className="text-[10px] text-gray-500 block">টাকা প্রদানকারী দাতার নগদ টাকার অংক লিখুন।</span>
                </div>
              ) : (
                <div className="space-y-2 animate-fade-in">
                  <div className="relative">
                    <Package className="absolute left-3 top-3 h-4 w-4 text-[#d97706]" />
                    <input
                      type="text"
                      required={donationType === 'item'}
                      value={itemName}
                      onChange={(e) => setItemName(e.target.value)}
                      placeholder="পণ্যের নাম ও বিবরণ লিখুন (উদা: ১ বস্তা চাল, ৫ কেজি তেল, ১টি ছাগল, ১ মণ চিনি)"
                      className="w-full pl-9 pr-3.5 py-2.5 bg-amber-50/50 border border-amber-300 rounded-xl text-sm font-black text-[#064e3b] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#d97706]"
                    />
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-[11px] font-semibold text-gray-600 shrink-0">আনুমানিক মূল্য (ঐচ্ছিক):</span>
                    <div className="relative flex-grow">
                      <span className="absolute left-2.5 top-1.5 text-gray-400 font-bold text-xs">৳</span>
                      <input
                        type="text"
                        inputMode="numeric"
                        value={amount}
                        onChange={(e) => setAmount(cleanNumericInput(e.target.value))}
                        placeholder="মূল্য না থাকলে খালি রাখুন (৳ ০)"
                        className="w-full pl-6 pr-2.5 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      />
                    </div>
                  </div>
                  <div className="p-2 bg-amber-50 border border-amber-200/80 rounded-lg text-[10px] text-amber-900 flex items-start space-x-1.5 font-medium">
                    <AlertCircle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                    <span>টাকা না দিয়ে চাল, তেল, চিনি, গরু বা অন্য সামগ্রী দান করলে এখানে পণ্যের নাম লিখুন।</span>
                  </div>
                </div>
              )}
            </div>

            {/* Receipt No */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-[#064e3b]">
                ৪. রশিদ নং (যদি থাকে)
              </label>
              <input
                type="text"
                value={receiptNo}
                onChange={(e) => setReceiptNo(toEnglishDigits(e.target.value))}
                placeholder="উদা: ৪৫২, রসিদ-১৩"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              />
            </div>

            {/* Entry Date */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-[#064e3b]">
                ৫. চাঁদা আদায়ের তারিখ
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              />
            </div>

            {/* Recorded By */}
            <div className="space-y-1.5">
              <label className="text-xs sm:text-sm font-bold text-[#064e3b]">
                ৬. এন্ট্রি কারীর নাম
              </label>
              <input
                type="text"
                required
                value={recordedBy}
                onChange={(e) => setRecordedBy(e.target.value)}
                placeholder="এন্ট্রি কারীর নাম"
                className="w-full px-3.5 py-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
              />
            </div>

            {/* Feedback messages */}
            {successMsg && (
              <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs flex items-start space-x-2 animate-fade-in">
                <Check className="h-4 w-4 text-emerald-600 mt-0.5 shrink-0" />
                <span>{successMsg}</span>
              </div>
            )}
            {errorMsg && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs flex items-start space-x-2 animate-fade-in">
                <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-xl shadow-md hover:shadow-lg transition duration-200 text-xs sm:text-sm flex items-center justify-center space-x-2 cursor-pointer disabled:opacity-50"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Plus className="h-4 w-4" />
              )}
              <span>সংরক্ষণ করুন (অটো লেজারে যুক্ত করুন)</span>
            </button>
          </form>
            </>
          )}
        </div>

        {/* Middle & Right Column: Houses list & selected house details */}
        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-12 gap-6">
          
          {/* Houses list column */}
          <div className="md:col-span-5 bg-white border border-[#cbd5e1] rounded-2xl p-4 sm:p-5 shadow-sm space-y-4 max-h-[660px] overflow-y-auto">
            <div className="space-y-2 pb-2 border-b border-[#e2e8f0]">
              <div className="flex justify-between items-center">
                <h4 className="text-sm font-black text-[#064e3b] flex items-center space-x-1.5">
                  <Building2 className="h-4 w-4 text-[#0f766e]" />
                  <span>বাড়ি সমূহের তালিকা ({toBanglaNum(selectedYear)})</span>
                </h4>
                <button
                  type="button"
                  onClick={() => setShowReorderModal(true)}
                  className="px-2.5 py-1 bg-[#0f766e]/10 hover:bg-[#0f766e]/20 text-[#064e3b] border border-[#0f766e]/20 rounded-lg text-[11px] font-black flex items-center space-x-1 transition cursor-pointer shadow-2xs"
                  title="প্রিন্টের সুবিধার্থে বাড়ির ক্রম উপরে-নিচে সাজান"
                >
                  <ListOrdered className="h-3.5 w-3.5 text-[#0f766e]" />
                  <span>ক্রম সাজান</span>
                </button>
              </div>

              {/* View / Sort Mode Switcher */}
              <div className="flex items-center justify-between text-[11px] pt-1">
                <span className="text-gray-500 font-semibold">তালিকা ক্রম:</span>
                <div className="inline-flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-[10px] font-bold">
                  <button
                    type="button"
                    onClick={() => setHouseSortMode('custom')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center space-x-1 ${
                      houseSortMode === 'custom'
                        ? 'bg-[#0f766e] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="প্রিন্ট করার ধারাবাহিক কাস্টম ক্রম"
                  >
                    <ListOrdered className="h-3 w-3" />
                    <span>প্রিন্ট ক্রম</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setHouseSortMode('amount')}
                    className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center space-x-1 ${
                      houseSortMode === 'amount'
                        ? 'bg-[#0f766e] text-white shadow-2xs'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                    title="সর্বোচ্চ চাঁদা আদায় অনুসারে"
                  >
                    <Coins className="h-3 w-3" />
                    <span>সর্বোচ্চ চাঁদা</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Add House Form */}
            <div className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl space-y-2">
              <span className="text-[10px] font-black text-[#0f766e] block">নতুন বাড়ি যুক্ত করুন:</span>
              <div className="flex space-x-1">
                <input
                  type="text"
                  placeholder="বাড়ির নাম..."
                  value={directNewHouseName}
                  onChange={(e) => setDirectNewHouseName(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleDirectAddHouse();
                    }
                  }}
                  className="flex-grow px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-gray-800 placeholder-gray-400"
                />
                <button
                  type="button"
                  onClick={handleDirectAddHouse}
                  className="px-2.5 py-1.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-lg text-xs font-bold cursor-pointer flex items-center space-x-1 shrink-0 transition"
                  title="নতুন বাড়ি যুক্ত করুন"
                >
                  <Plus className="h-3.5 w-3.5" />
                  <span>যোগ করুন</span>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              {houseDonationStats.map((stat, idx) => {
                const isSelected = selectedHouse === stat.name;
                const isEditing = editingHouseName === stat.name;
                const isFirst = idx === 0;
                const isLast = idx === houseDonationStats.length - 1;

                return (
                  <div
                    key={stat.name}
                    onClick={() => {
                      if (!isEditing) {
                        setSelectedHouse(stat.name);
                        setSearchQuery('');
                      }
                    }}
                    className={`w-full p-2.5 sm:p-3 rounded-xl border text-left transition duration-200 flex flex-col space-y-1.5 cursor-pointer group relative ${
                      isSelected
                        ? 'bg-[#0f766e] text-white border-[#0f766e] shadow-md scale-[1.01]'
                        : 'bg-[#f8fafc]/70 hover:bg-[#f1f5f9] border-[#e2e8f0] text-[#3c3c3c]'
                    }`}
                  >
                    <div className="flex justify-between items-center w-full gap-1.5">
                      {isEditing ? (
                        <div className="flex items-center space-x-1.5 w-full mr-1" onClick={(e) => e.stopPropagation()}>
                          <input
                            type="text"
                            value={renameValue}
                            onChange={(e) => setRenameValue(e.target.value)}
                            className="flex-grow px-2 py-1 text-xs bg-white text-gray-800 border border-[#d97706] rounded focus:outline-none focus:ring-1 focus:ring-[#0f766e] font-semibold"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') {
                                handleSaveRenameHouse(stat.name);
                              } else if (e.key === 'Escape') {
                                setEditingHouseName(null);
                              }
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRenameHouse(stat.name)}
                            className="p-1 text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50 rounded cursor-pointer shrink-0"
                            title="সংরক্ষণ"
                          >
                            <Check className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingHouseName(null)}
                            className="p-1 text-red-500 hover:text-red-700 hover:bg-red-50 rounded cursor-pointer shrink-0"
                            title="বাতিল"
                          >
                            <X className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-1.5 min-w-0 flex-grow">
                          {/* Serial Number Badge */}
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-black shrink-0 ${
                              isSelected
                                ? 'bg-white/20 text-white'
                                : 'bg-emerald-100/70 text-[#064e3b]'
                            }`}
                            title={`প্রিন্ট ক্রমিক নং: ${toBanglaNum(idx + 1)}`}
                          >
                            {toBanglaNum(idx + 1)}.
                          </span>

                          <span className="font-black text-xs sm:text-sm truncate">{stat.name}</span>
                          
                          {/* Edit House Button */}
                          <button
                            type="button"
                            onClick={(e) => handleStartRenameHouse(stat.name, e)}
                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer shrink-0 ${
                              isSelected
                                ? 'text-white/70 hover:text-white hover:bg-white/10 opacity-70'
                                : 'text-gray-400 hover:text-[#0f766e] hover:bg-emerald-50/50'
                            }`}
                            title="নাম পরিবর্তন করুন"
                          >
                            <Edit className="h-3 w-3" />
                          </button>

                          {/* Delete House Button */}
                          <button
                            type="button"
                            onClick={(e) => handleDeleteHouse(stat.name, e)}
                            className={`p-1 rounded-md opacity-0 group-hover:opacity-100 transition-all duration-150 cursor-pointer shrink-0 ${
                              isSelected
                                ? 'text-white/70 hover:text-white hover:bg-white/10 opacity-70'
                                : 'text-gray-400 hover:text-red-600 hover:bg-red-50'
                            }`}
                            title="বাড়িটি তালিকা থেকে ডিলিট করুন"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                      
                      {!isEditing && (
                        <div className="flex items-center space-x-1 shrink-0">
                          {/* Move Up & Move Down Quick Buttons */}
                          <div className="flex items-center space-x-0.5 bg-black/5 dark:bg-white/10 rounded-md p-0.5" onClick={(e) => e.stopPropagation()}>
                            <button
                              type="button"
                              disabled={isFirst}
                              onClick={(e) => handleMoveHouse(stat.name, 'up', e)}
                              className={`p-0.5 rounded transition cursor-pointer ${
                                isFirst
                                  ? 'opacity-20 cursor-not-allowed'
                                  : isSelected
                                    ? 'hover:bg-white/20 text-white'
                                    : 'hover:bg-emerald-100 text-gray-700 hover:text-[#0f766e]'
                              }`}
                              title="এই বাড়িটি ১ ধাপ উপরে তুলুন (প্রিন্ট ক্রম)"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              disabled={isLast}
                              onClick={(e) => handleMoveHouse(stat.name, 'down', e)}
                              className={`p-0.5 rounded transition cursor-pointer ${
                                isLast
                                  ? 'opacity-20 cursor-not-allowed'
                                  : isSelected
                                    ? 'hover:bg-white/20 text-white'
                                    : 'hover:bg-emerald-100 text-gray-700 hover:text-[#0f766e]'
                              }`}
                              title="এই বাড়িটি ১ ধাপ নিচে নামান (প্রিন্ট ক্রম)"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          <span className={`text-xs font-black shrink-0 ${isSelected ? 'text-[#f1f5f9]' : 'text-[#0f766e]'}`}>
                            ৳ {toBanglaNum(stat.total.toLocaleString('bn-BD'))}
                          </span>
                        </div>
                      )}
                    </div>
                    <div className="flex justify-between items-center w-full text-[10px] opacity-85 pt-0.5">
                      <span>{stat.donorsCount > 0 ? `মোট দাতা: ${toBanglaNum(stat.donorsCount)} জন` : 'কোনো চাঁদা সংগৃহীত হয়নি'}</span>
                      {stat.total > 0 && (
                        <span className="font-semibold">
                          গড়: ৳ {toBanglaNum(Math.round(stat.total / stat.donorsCount).toLocaleString('bn-BD'))}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
              
              {houseDonationStats.length === 0 && (
                <div className="text-center py-8 text-gray-400 text-xs">
                  এই বছরের জন্য কোনো বাড়ির চাঁদা পাওয়া যায়নি।
                </div>
              )}
            </div>
          </div>

          {/* Selected house details column */}
          <div className="md:col-span-7 bg-white border border-[#cbd5e1] rounded-2xl p-4 sm:p-5 shadow-sm space-y-5 flex flex-col h-full min-h-[500px]">
            
            {/* Header with selected house title and count */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-3 border-b border-[#e2e8f0] gap-3">
              <div>
                <h4 className="text-base font-black text-[#064e3b] flex items-center space-x-1.5">
                  <ClipboardList className="h-5 w-5 text-[#d97706]" />
                  <span>{selectedHouse ? `${selectedHouse} এর চাঁদা খাতা` : 'চাঁদা খাতা'}</span>
                </h4>
                <p className="text-[11px] text-[#0f766e] font-semibold">
                  মোট সংগৃহীত চাঁদা: ৳ {toBanglaNum((selectedHouseDonors.reduce((sum, t) => sum + t.amount, 0)).toLocaleString('bn-BD'))}
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
                {selectedHouse && (
                  <button
                    onClick={() => setShowCollectionSheetModal(true)}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-[#0f766e]/10 hover:bg-[#0f766e]/20 text-[#064e3b] rounded-lg text-xs font-bold transition duration-150 border border-[#0f766e]/20 cursor-pointer"
                    title="কালেকশন শিট / রসিদ বই প্রিন্ট করুন"
                  >
                    <Printer className="h-3.5 w-3.5 text-[#0f766e]" />
                    <span>কালেকশন শিট</span>
                  </button>
                )}

                {selectedHouse && selectedHouseDonors.length > 1 && (
                  <button
                    type="button"
                    onClick={() => {
                      setDonorReorderTargetHouse(selectedHouse);
                      setShowDonorReorderModal(true);
                    }}
                    className="flex items-center space-x-1 px-2.5 py-1.5 bg-amber-50 hover:bg-amber-100 text-amber-900 rounded-lg text-xs font-bold transition duration-150 border border-amber-300 cursor-pointer shadow-2xs"
                    title="প্রিন্টের আগে বা খাতায় চাঁদা দাতার নামের ক্রম উপরে-নিচে মুভ করুন"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 text-amber-700" />
                    <span>দাতার ক্রম সাজান</span>
                  </button>
                )}

                {/* Search bar inside details card */}
                <div className="relative flex-grow sm:flex-grow-0 sm:w-44">
                  <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="দাতা বা রসিদ নং খুজুন..."
                    className="w-full pl-8 pr-3 py-1.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  />
                </div>
              </div>
            </div>

            {/* List of donors */}
            <div className="flex-grow overflow-y-auto space-y-3 max-h-[460px] pr-1">
              
              {selectedHouseDonors.map((donor, idx) => {
                const isEditingDonor = editingDonorId === donor.id;
                return (
                  <div 
                    key={donor.id}
                    className="p-3 bg-[#f8fafc] border border-[#e2e8f0] rounded-xl hover:shadow-sm transition duration-150 flex flex-col sm:flex-row justify-between items-start sm:items-center relative group gap-3"
                  >
                    {isEditingDonor ? (
                      <form 
                        onSubmit={(e) => {
                          e.preventDefault();
                          handleSaveEditDonor(donor);
                        }}
                        className="w-full space-y-3 bg-white p-3 rounded-xl border border-[#0f766e]/30 shadow-xs"
                      >
                        {/* Donation Type Switcher in Edit */}
                        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                          <span className="text-[11px] font-black text-[#064e3b]">চাঁদার ধরণ:</span>
                          <div className="flex rounded-lg bg-gray-100 p-0.5 border border-gray-200 text-[10px] font-bold">
                            <button
                              type="button"
                              onClick={() => {
                                setEditDonationType('cash');
                                setEditDonorItemName('');
                              }}
                              className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center space-x-1 ${
                                editDonationType === 'cash'
                                  ? 'bg-[#0f766e] text-white'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <Coins className="h-3 w-3" />
                              <span>নগদ টাকা</span>
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditDonationType('item')}
                              className={`px-2 py-0.5 rounded transition cursor-pointer flex items-center space-x-1 ${
                                editDonationType === 'item'
                                  ? 'bg-[#d97706] text-white'
                                  : 'text-gray-600 hover:text-gray-900'
                              }`}
                            >
                              <Package className="h-3 w-3" />
                              <span>পণ্য দান</span>
                            </button>
                          </div>
                        </div>

                        {/* House Selection / Reassignment in Edit Form */}
                        <div className="bg-emerald-50/70 p-2.5 rounded-xl border border-emerald-200">
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[11px] font-black text-[#064e3b] flex items-center space-x-1.5">
                              <Building2 className="h-3.5 w-3.5 text-[#0f766e]" />
                              <span>চাঁদাদাতার বাড়ি (পরিবর্তন/স্থানান্তর):</span>
                            </label>
                            <button
                              type="button"
                              onClick={() => {
                                setIsCustomEditHouse(!isCustomEditHouse);
                                if (!isCustomEditHouse) {
                                  setCustomEditHouseName('');
                                }
                              }}
                              className="text-[10px] font-extrabold text-[#0f766e] hover:text-[#0d9488] hover:underline cursor-pointer flex items-center space-x-1"
                            >
                              <span>{isCustomEditHouse ? 'তালিকা থেকে বাছাই করুন' : '+ নতুন বাড়ির নাম লিখুন'}</span>
                            </button>
                          </div>

                          {!isCustomEditHouse ? (
                            <select
                              value={editDonorHouseName}
                              onChange={(e) => setEditDonorHouseName(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] focus:border-[#0f766e] rounded-lg text-xs font-bold text-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                            >
                              {dynamicHouses.map((h, i) => (
                                <option key={h} value={h}>
                                  {toBanglaNum(i + 1)}. {h} {h === donor.houseName ? '(বর্তমান বাড়ি)' : ''}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <input
                              type="text"
                              value={customEditHouseName}
                              onChange={(e) => setCustomEditHouseName(e.target.value)}
                              placeholder="নতুন বাড়ির নাম লিখুন..."
                              className="w-full px-3 py-1.5 bg-white border-2 border-emerald-400 rounded-lg text-xs font-bold text-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                              required
                            />
                          )}

                          {((!isCustomEditHouse && editDonorHouseName && editDonorHouseName !== donor.houseName) || (isCustomEditHouse && customEditHouseName.trim())) && (
                            <div className="mt-1.5 px-2 py-1 bg-amber-50 border border-amber-200 rounded-md text-[10px] text-amber-800 font-bold flex items-center space-x-1">
                              <span>⚠️ তথ্য সংরক্ষণ করলে এই চাঁদাদাতা <strong>"{isCustomEditHouse ? customEditHouseName : editDonorHouseName}"</strong>-তে স্থানান্তরিত হবেন।</span>
                            </div>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                          <div>
                            <label className="block text-[10px] font-black text-[#0f766e] mb-1">চাঁদাদাতার নাম:</label>
                            <input
                              type="text"
                              value={editDonorName}
                              onChange={(e) => setEditDonorName(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-gray-800"
                              required
                            />
                          </div>

                          {editDonationType === 'cash' ? (
                            <div>
                              <label className="block text-[10px] font-black text-[#0f766e] mb-1">টাকার পরিমাণ (৳):</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editDonorAmount}
                                onChange={(e) => setEditDonorAmount(cleanNumericInput(e.target.value))}
                                className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-black focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-gray-800"
                                required
                              />
                            </div>
                          ) : (
                            <div>
                              <label className="block text-[10px] font-black text-[#d97706] mb-1">দানকৃত পণ্যের নাম ও বিবরণ:</label>
                              <input
                                type="text"
                                value={editDonorItemName}
                                onChange={(e) => setEditDonorItemName(e.target.value)}
                                placeholder="উদা: ১ বস্তা চাল, ৫ কেজি তেল"
                                className="w-full px-3 py-1.5 bg-amber-50/50 border border-amber-300 rounded-lg text-xs font-black focus:outline-none focus:ring-1 focus:ring-[#d97706] text-[#064e3b]"
                                required
                              />
                            </div>
                          )}

                          {editDonationType === 'item' && (
                            <div>
                              <label className="block text-[10px] font-black text-[#0f766e] mb-1">আনুমানিক মূল্য (ঐচ্ছিক ৳):</label>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editDonorAmount}
                                onChange={(e) => setEditDonorAmount(cleanNumericInput(e.target.value))}
                                placeholder="ঐচ্ছিক মূল্য"
                                className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-gray-800"
                              />
                            </div>
                          )}

                          <div>
                            <label className="block text-[10px] font-black text-[#0f766e] mb-1">রসিদ নম্বর:</label>
                            <input
                              type="text"
                              value={editDonorReceipt}
                              onChange={(e) => setEditDonorReceipt(toEnglishDigits(e.target.value))}
                              className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-gray-800"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-black text-[#0f766e] mb-1">তারিখ:</label>
                            <input
                              type="date"
                              value={editDonorDate}
                              onChange={(e) => setEditDonorDate(e.target.value)}
                              className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0f766e] text-gray-800"
                              required
                            />
                          </div>
                        </div>

                        <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                          <button
                            type="button"
                            onClick={() => setEditingDonorId(null)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-lg text-xs cursor-pointer"
                          >
                            বাতিল
                          </button>
                          <button
                            type="submit"
                            className="px-4 py-1.5 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg text-xs cursor-pointer flex items-center space-x-1"
                          >
                            <Save className="h-3.5 w-3.5" />
                            <span>সংরক্ষণ করুন</span>
                          </button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="space-y-1 flex-grow">
                          <div className="flex items-center flex-wrap gap-1.5">
                            <span className="font-black text-xs sm:text-sm text-[#064e3b]">{donor.donorName}</span>
                            {donor.houseName && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-emerald-50 text-[#0f766e] rounded font-bold border border-emerald-200 flex items-center space-x-0.5">
                                <Building2 className="h-2.5 w-2.5 text-[#0f766e]" />
                                <span>{donor.houseName}</span>
                              </span>
                            )}
                            {donor.receiptNo && (
                              <span className="text-[9px] px-1.5 py-0.5 bg-[#d97706]/10 text-[#967d4b] rounded font-semibold border border-[#d97706]/20">
                                রসিদ নং: {toBanglaNum(donor.receiptNo)}
                              </span>
                            )}
                            {(donor.donationType === 'item' || donor.itemName) && (
                              <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 bg-amber-100 text-amber-900 rounded-full font-extrabold border border-amber-300 shadow-2xs">
                                <Package className="h-3 w-3 text-amber-700" />
                                <span>পণ্য দান: {donor.itemName}</span>
                              </span>
                            )}
                          </div>
                          <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-[10px] text-gray-500 font-light">
                            <span className="flex items-center space-x-1">
                              <Calendar className="h-3 w-3 text-gray-400" />
                              <span>{toBanglaDate(donor.date)}</span>
                            </span>
                            <span>এন্ট্রি: {donor.recordedBy}</span>
                          </div>
                        </div>

                        <div className="flex items-center space-x-1.5 sm:space-x-2 shrink-0 self-end sm:self-center">
                          {donor.donationType === 'item' || donor.itemName ? (
                            <div className="text-right mr-1">
                              <span className="inline-block text-xs sm:text-sm font-black text-amber-900 bg-amber-50 px-2 py-0.5 rounded-lg border border-amber-200">
                                📦 {donor.itemName}
                              </span>
                              {donor.amount > 0 && (
                                <span className="block text-[10px] text-gray-500 font-semibold">
                                  (মূল্য: ৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))})
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-xs sm:text-sm font-black text-[#0f766e] mr-1">
                              ৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}
                            </span>
                          )}

                          {/* Up / Down Reorder buttons */}
                          <div className="flex items-center space-x-0.5 bg-gray-100 p-0.5 rounded-lg border border-gray-200 shrink-0" title="দাতার অবস্থান উপরে-নিচে সরান">
                            <button
                              type="button"
                              onClick={() => handleMoveDonor(donor.id, 'up')}
                              disabled={idx === 0}
                              className="p-1 hover:bg-white text-gray-600 hover:text-[#0f766e] rounded disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                              title="১ ধাপ উপরে তুলুন"
                            >
                              <ChevronUp className="h-3.5 w-3.5" />
                            </button>
                            <button
                              type="button"
                              onClick={() => handleMoveDonor(donor.id, 'down')}
                              disabled={idx === selectedHouseDonors.length - 1}
                              className="p-1 hover:bg-white text-gray-600 hover:text-[#0f766e] rounded disabled:opacity-20 disabled:cursor-not-allowed transition cursor-pointer"
                              title="১ ধাপ নিচে নামান"
                            >
                              <ChevronDown className="h-3.5 w-3.5" />
                            </button>
                          </div>

                          {/* Quick House Transfer (বাড়ি বদল) button */}
                          <button
                            onClick={() => handleOpenQuickTransfer(donor)}
                            className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-[#064e3b] border border-amber-300 rounded-lg text-xs font-bold transition duration-150 cursor-pointer flex items-center space-x-1 shrink-0 shadow-2xs group/transfer"
                            title="চাঁদাদাতার বাড়ি পরিবর্তন বা অন্য বাড়িতে স্থানান্তর করুন"
                          >
                            <ArrowRightLeft className="h-3.5 w-3.5 text-[#0f766e] group-hover/transfer:rotate-180 transition duration-300" />
                            <span className="font-black text-[11px] hidden sm:inline">বাড়ি বদল</span>
                          </button>

                          {/* Print Receipt button */}
                          <button
                            onClick={() => {
                              setSelectedDonorForReceipt(donor);
                              setShowReceiptModal(true);
                              setTriggerAutoReceiptDownload(true);
                            }}
                            className="p-1.5 hover:bg-[#d97706]/10 text-gray-400 hover:text-[#064e3b] rounded-lg transition duration-150 cursor-pointer shrink-0"
                            title="চাঁদা আদায়ের রশিদ ডাউনলোড করুন"
                          >
                            <Printer className="h-4 w-4 text-[#0f766e]" />
                          </button>
                          
                          {/* Edit button */}
                          <button
                            onClick={() => handleStartEditDonor(donor)}
                            className="p-1.5 hover:bg-emerald-50 hover:text-emerald-700 text-gray-400 rounded-lg transition duration-150 cursor-pointer shrink-0"
                            title="এডিট করুন"
                          >
                            <Edit className="h-4 w-4 text-emerald-600" />
                          </button>
                          
                          {/* Delete button */}
                          <button
                            onClick={async () => {
                              const itemPrompt = (donor.donationType === 'item' || donor.itemName)
                                ? `${donor.donorName} এর পণ্য দান ("${donor.itemName || 'পণ্য'}") এন্ট্রিটি কি সত্যিই মুছে ফেলতে চান?`
                                : `${donor.donorName} এর ৳ ${donor.amount} টাকার চাঁদা এন্ট্রিটি কি সত্যিই মুছে ফেলতে চান? এটি আয় বিবরণী থেকেও মুছে যাবে।`;
                              if (window.confirm(itemPrompt)) {
                                try {
                                  await onDeleteTransaction(donor.id);
                                } catch (err) {
                                  console.error(err);
                                  alert('মুছে ফেলার সময় ত্রুটি ঘটেছে। পুনরায় চেষ্টা করুন।');
                                }
                              }
                            }}
                            className="p-1.5 hover:bg-red-50 hover:text-red-600 text-gray-400 rounded-lg transition duration-150 cursor-pointer shrink-0"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                );
              })}

              {selectedHouseDonors.length === 0 && (
                <div className="text-center py-12 text-gray-400 text-xs">
                  {searchQuery ? 'অনুসন্ধানের সাথে মিল পাওয়া যায়নি!' : 'এই বাড়ির অধীনে কোনো চাঁদা এখনো এন্ট্রি করা হয়নি।'}
                </div>
              )}

            </div>

            {/* Hint message for non-logged-in users */}
            {!isAdminLoggedIn && (
              <div className="p-3 bg-[#f8fafc] border border-dashed border-[#cbd5e1] rounded-xl text-[10px] sm:text-xs text-[#064e3b] flex items-center space-x-1.5">
                <AlertCircle className="h-4 w-4 text-[#d97706] shrink-0" />
                <span>যেকোনো চাঁদা এন্ট্রি সংশোধন বা ডিলিট করার জন্য সি-প্যানেলে এডমিন পাসওয়ার্ড দিয়ে লগইন করুন।</span>
              </div>
            )}

          </div>

        </div>

      </div>

      {/* ================= COLLECTION SHEET PRINT MODAL ================= */}
      {showCollectionSheetModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs overflow-y-auto print:p-0 print:bg-white print:absolute print:inset-0">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full p-5 sm:p-6 space-y-5 relative border border-[#cbd5e1] print:border-none print:shadow-none print:p-0">
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-3 print:hidden">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-[#0f766e]/10 text-[#0f766e] rounded-xl">
                  <Printer className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-[#064e3b]">
                    বাড়ি ভিত্তিক চাঁদা কালেকশন শিট (অফিসিয়াল A4 ফরম্যাট)
                  </h3>
                  <p className="text-[11px] text-gray-500 font-medium">প্রিন্ট ও এ৪ পিডিএফ ডাউনলোডের জন্য প্রস্তুত</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCollectionSheetModal(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-xl transition cursor-pointer"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Modal Sub-Controls (House Selection, Navigation & Mode Switch) */}
            <div className="space-y-2.5 bg-[#f8fafc] border border-[#cbd5e1] rounded-xl p-3 print:hidden">
              <div className="flex flex-wrap items-center justify-between gap-3">
                {/* House Selector with Serial & Navigation */}
                <div className="flex items-center flex-wrap gap-2">
                  <span className="text-xs font-black text-[#064e3b] flex items-center space-x-1">
                    <Building2 className="h-3.5 w-3.5 text-[#0f766e]" />
                    <span>বর্তমান বাড়ি:</span>
                  </span>
                  
                  <div className="flex items-center space-x-1">
                    {/* Previous House Button */}
                    <button
                      type="button"
                      disabled={dynamicHouses.indexOf(selectedHouse) <= 0}
                      onClick={() => {
                        const curIdx = dynamicHouses.indexOf(selectedHouse);
                        if (curIdx > 0) {
                          setSelectedHouse(dynamicHouses[curIdx - 1]);
                        }
                      }}
                      className="p-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="পূর্ববর্তী বাড়ির শিট দেখুন"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>

                    <select
                      value={selectedHouse}
                      onChange={(e) => setSelectedHouse(e.target.value)}
                      className="text-xs font-black border border-[#0f766e] rounded-lg px-2.5 py-1.5 bg-white text-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#0f766e] shadow-2xs"
                    >
                      {dynamicHouses.map((h, i) => (
                        <option key={h} value={h}>
                          {toBanglaNum(i + 1)}. {h}
                        </option>
                      ))}
                    </select>

                    {/* Next House Button */}
                    <button
                      type="button"
                      disabled={dynamicHouses.indexOf(selectedHouse) >= dynamicHouses.length - 1}
                      onClick={() => {
                        const curIdx = dynamicHouses.indexOf(selectedHouse);
                        if (curIdx !== -1 && curIdx < dynamicHouses.length - 1) {
                          setSelectedHouse(dynamicHouses[curIdx + 1]);
                        }
                      }}
                      className="p-1 rounded-lg border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                      title="পরবর্তী বাড়ির শিট দেখুন"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>

                  <span className="text-[11px] font-bold text-gray-500">
                    ({toBanglaNum(dynamicHouses.indexOf(selectedHouse) + 1)} / {toBanglaNum(dynamicHouses.length)} তম বাড়ি)
                  </span>

                  {/* Reorder Houses Button */}
                  <button
                    type="button"
                    onClick={() => setShowReorderModal(true)}
                    className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-md text-[10px] font-extrabold flex items-center space-x-1 transition cursor-pointer"
                    title="প্রিন্টের সুবিধার জন্য বাড়ির ক্রম সাজান"
                  >
                    <ListOrdered className="h-3 w-3" />
                    <span>বাড়ির ক্রম</span>
                  </button>

                  {/* Reorder Donors Button */}
                  <button
                    type="button"
                    onClick={() => {
                      setDonorReorderTargetHouse(selectedHouse);
                      setShowDonorReorderModal(true);
                    }}
                    className="px-2.5 py-1 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white rounded-md text-[10.5px] font-black flex items-center space-x-1.5 transition cursor-pointer shadow-xs"
                    title="প্রিন্ট বা এ৪ ডাউনলোডের আগে চাঁদাদাতাদের নামের ক্রম উপরে-নিচে পরিবর্তন করুন"
                  >
                    <ArrowUpDown className="h-3.5 w-3.5" />
                    <span>দাতার নাম উপরে/নিচে সরান</span>
                  </button>
                </div>

                {/* Print Format Selector */}
                <div className="flex items-center space-x-2">
                  <span className="text-xs font-bold text-[#064e3b]">প্রিন্ট ফরম্যাট:</span>
                  <div className="inline-flex rounded-lg border border-gray-300 p-0.5 bg-white shadow-xs">
                    <button
                      type="button"
                      onClick={() => setCollectionSheetLayout('single')}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                        collectionSheetLayout === 'single'
                          ? 'bg-[#0f766e] text-white shadow-xs'
                          : 'text-gray-600 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      একক বাড়ি (২৪ জনের তালিকা)
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setCollectionSheetLayout('dual');
                        // Auto select next house if secondHouseForDual is empty
                        const curIdx = dynamicHouses.indexOf(selectedHouse);
                        if (!secondHouseForDual || secondHouseForDual === selectedHouse) {
                          const nextH = curIdx !== -1 && curIdx < dynamicHouses.length - 1 ? dynamicHouses[curIdx + 1] : dynamicHouses[0];
                          if (nextH && nextH !== selectedHouse) {
                            setSecondHouseForDual(nextH);
                          }
                        }
                      }}
                      className={`px-3 py-1 text-xs font-bold rounded-md transition cursor-pointer ${
                        collectionSheetLayout === 'dual'
                          ? 'bg-[#0f766e] text-white shadow-xs'
                          : 'text-gray-600 hover:text-black hover:bg-gray-50'
                      }`}
                    >
                      এক পাতায় ২টি বাড়ি (ছোট বাড়ির জন্য)
                    </button>
                  </div>
                </div>
              </div>

              {collectionSheetLayout === 'dual' && (
                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-gray-200">
                  <div className="flex items-center space-x-2">
                    <span className="text-xs font-bold text-gray-700">২য় বাড়ি নির্বাচন করুন:</span>
                    <select
                      value={secondHouseForDual}
                      onChange={(e) => setSecondHouseForDual(e.target.value)}
                      className="text-xs font-bold border border-gray-300 rounded-lg px-2.5 py-1 bg-white text-black focus:outline-none focus:border-[#0f766e]"
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

                  <button
                    type="button"
                    onClick={() => {
                      const curIdx = dynamicHouses.indexOf(selectedHouse);
                      if (curIdx !== -1 && curIdx < dynamicHouses.length - 1) {
                        setSecondHouseForDual(dynamicHouses[curIdx + 1]);
                      }
                    }}
                    className="px-2 py-1 bg-emerald-50 hover:bg-emerald-100 text-[#064e3b] border border-emerald-300 rounded-md text-[10px] font-bold transition cursor-pointer"
                  >
                    👉 পরবর্তী বাড়ি স্বয়ংক্রিয়ভাবে জোড়া লাগান
                  </button>
                </div>
              )}
            </div>

            {/* Scrollable Container with Page Shadow */}
            <div className="bg-[#f1f5f9] p-3 sm:p-6 rounded-xl max-h-[68vh] overflow-y-auto flex justify-center print:bg-white print:p-0 print:overflow-visible print:max-h-none shadow-inner">
              {/* Clean, Simple, Ink-Friendly Official A4 Print Area */}
              <div 
                id="print-area" 
                className={`text-black font-sans bg-white w-full max-w-[794px] ${collectionSheetLayout === 'single' ? 'min-h-[1100px] justify-between p-3.5 sm:p-5' : 'min-h-0 justify-start p-4 sm:p-6'} border border-gray-900 shadow-lg rounded-sm print:border-none print:shadow-none print:p-4 print:rounded-none flex flex-col`}
              >
                {collectionSheetLayout === 'single' ? (
                  /* ================= SINGLE HOUSE LAYOUT (24 ROWS, NO SIGNATURES) ================= */
                  <div className="space-y-2.5 print:space-y-1.5 flex-grow flex flex-col justify-between">
                    <div className="space-y-2 print:space-y-1.5">
                      {/* Clean Islamic & Organization Header */}
                      <div className="border-b-2 border-gray-900 pb-1.5 print:pb-1">
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
                          {(() => {
                            const figureCounts = selectedHouseDonors.reduce<{ [key: string]: number }>((acc, donor) => {
                              if (donor.donationType === 'item' || (donor.itemName && (!donor.amount || donor.amount === 0))) {
                                acc['item'] = (acc['item'] || 0) + 1;
                              } else if (donor.amount > 0) {
                                const key = donor.amount.toString();
                                acc[key] = (acc[key] || 0) + 1;
                              }
                              return acc;
                            }, {});

                            const sortedAmounts = Object.keys(figureCounts)
                              .filter(k => k !== 'item')
                              .map(Number)
                              .sort((a, b) => b - a);

                            return (
                              <div className="shrink-0 border border-gray-900 rounded p-1.5 bg-white text-center flex flex-col justify-center min-w-[140px] max-w-[210px]">
                                <div className="text-[10px] font-black text-black border-b border-gray-400 pb-0.5 mb-1 bg-gray-100 px-1 rounded-xs flex items-center justify-between">
                                  <span>আদায় ফিগার বিবরণ</span>
                                  <span className="text-[9px] font-bold text-gray-700">({toBanglaNum(selectedHouseDonors.length)}টি)</span>
                                </div>
                                {sortedAmounts.length > 0 || figureCounts['item'] ? (
                                  <div className="grid grid-cols-2 gap-x-2 gap-y-0.5 text-[9.5px] font-bold text-black text-left">
                                    {sortedAmounts.map(amt => (
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
                          })()}
                        </div>
                      </div>

                      {/* Metadata Row */}
                      <div className="grid grid-cols-2 gap-3 text-xs border border-gray-800 rounded p-1.5 print:p-1 bg-white">
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
                            <span className="text-gray-700 font-bold">সংগ্রহের তারিখ:</span>
                            <span className="font-black text-black">
                              {mahfilDetails ? toEnglishDate(mahfilDetails.targetDate) : '...................................'}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-end space-x-1.5">
                            <span className="text-gray-700 font-bold">সংগ্রহকারী সদস্য:</span>
                            <span className="text-gray-800 font-medium">...................................................</span>
                          </div>
                        </div>
                      </div>

                      {/* Clean 24-Row Ledger Table */}
                      <table className="w-full border-collapse border border-gray-900 text-xs text-center">
                        <thead>
                          <tr className="bg-gray-100 text-black print:bg-gray-100 border-b border-gray-900 font-black">
                            <th className="border border-gray-900 px-1 py-1.5 text-center w-12 text-[11px] align-middle">
                              ক্রমিক
                            </th>
                            <th className="border border-gray-900 px-3 py-1.5 text-center text-[12px] align-middle">
                              চাঁদাদাতার নাম
                            </th>
                            <th className="border border-gray-900 px-2 py-1.5 text-center w-36 text-[12px] align-middle">
                              পরিমাণ (টাকা / পণ্য)
                            </th>
                            <th className="border border-gray-900 px-1.5 py-1.5 text-center w-20 text-[11px] align-middle">
                              রশিদ নং
                            </th>
                            <th className="border border-gray-900 px-1.5 py-1.5 text-center w-24 text-[11px] align-middle">
                              তারিখ
                            </th>
                            <th className="border border-gray-900 px-1.5 py-1.5 text-center w-32 text-[11px] align-middle">
                              দাতার স্বাক্ষর / মন্তব্য
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
                                  <span className="font-bold inline-block text-[11px] text-purple-900">
                                    📦 {donor.itemName}
                                    {donor.amount > 0 && <span className="text-gray-800 text-[10px]"> (৳{toBanglaNum(donor.amount)})</span>}
                                  </span>
                                ) : (
                                  <span>৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-</span>
                                )}
                              </td>
                              <td className="border border-gray-900 px-1.5 py-0.5 text-center font-semibold text-gray-900 align-middle text-[11px]">
                                <span>{donor.receiptNo ? toBanglaNum(donor.receiptNo) : '—'}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 py-0.5 text-center font-semibold text-gray-900 align-middle text-[11px]">
                                <span>{toEnglishDate(donor.date)}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 py-0.5 text-center text-gray-700 align-middle text-[11px]">
                                <span>{donor.notes || ''}</span>
                              </td>
                            </tr>
                          ))}

                          {/* Blank rows to complete 24 entries per page */}
                          {Array.from({ length: Math.max(0, 24 - Math.min(24, selectedHouseDonors.length)) }).map((_, idx) => {
                            const rowNum = Math.min(24, selectedHouseDonors.length) + idx + 1;
                            return (
                              <tr key={`empty-${idx}`} className="h-[34px] bg-white border-b border-gray-400">
                                <td className="border border-gray-900 px-1 py-0.5 text-center font-medium text-gray-500 align-middle text-[11px]">
                                  <span>{toBanglaNum(rowNum)}</span>
                                </td>
                                <td className="border border-gray-900 px-3 py-0.5 align-middle"></td>
                                <td className="border border-gray-900 px-2 py-0.5 align-middle"></td>
                                <td className="border border-gray-900 px-1.5 py-0.5 align-middle"></td>
                                <td className="border border-gray-900 px-1.5 py-0.5 align-middle"></td>
                                <td className="border border-gray-900 px-1.5 py-0.5 align-middle"></td>
                              </tr>
                            );
                          })}

                          {/* Clean Summary / Total Row */}
                          {(() => {
                            const totalCash = selectedHouseDonors.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const totalItems = selectedHouseDonors.filter(t => t.donationType === 'item' || t.itemName).length;
                            return (
                              <tr className="bg-gray-100 font-black text-black border-t-2 border-gray-900">
                                <td colSpan={2} className="border border-gray-900 px-2 pt-1.5 pb-2 text-right font-black text-xs align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">সর্বমোট আদায়:</span>
                                </td>
                                <td className="border border-gray-900 px-2 pt-1.5 pb-2 text-center font-black text-xs text-black align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">
                                    ৳ {toBanglaNum(totalCash.toLocaleString('bn-BD'))}/-
                                    {totalItems > 0 && (
                                      <span className="block text-[9px] text-gray-800 font-bold">
                                        + {toBanglaNum(totalItems)} টি পণ্য দান
                                      </span>
                                    )}
                                  </span>
                                </td>
                                <td colSpan={3} className="border border-gray-900 px-2 pt-1.5 pb-2 text-left text-[10px] text-gray-800 italic align-middle leading-snug pl-2">
                                  <span className="inline-block relative -top-0.5">{totalCash > 0 ? `কথায়: ${toBanglaWords(totalCash)}` : 'পণ্য ও উপহার সামগ্রী'}</span>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Slogan & Footer Note */}
                    <div className="border-t border-gray-400 pt-1 mt-1 flex justify-between items-center text-[9px] text-gray-700">
                      <span className="font-semibold">
                        ★ সবার আন্তরিক সহযোগিতায় পবিত্র মাহফিল সফল ও সার্থক হোক ★
                      </span>
                      <span>
                        কম্পিউটার জেনারেটেড কালেকশন শিট | পৃষ্ঠা নং: ১
                      </span>
                    </div>
                  </div>
                ) : (
                  /* ================= DUAL HOUSES LAYOUT (2 HOUSES ON 1 PAGE) ================= */
                  <div className="space-y-3 print:space-y-2 w-full text-black">
                    {/* --- HOUSE 1 (TOP HALF) --- */}
                    <div className="space-y-2">
                      {/* Compact Header House 1 */}
                      <div className="border-b border-gray-900 pb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={logo} 
                            onError={handleLogoError}
                            alt="Logo" 
                            className="w-10 h-10 object-contain rounded-full border border-gray-800 p-0.5 bg-white shrink-0" 
                            referrerPolicy="no-referrer" 
                          />
                          <div>
                            <span className="text-[9px] font-serif font-bold text-gray-800 block leading-tight">
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </span>
                            <h2 className="text-sm font-black text-black leading-tight">
                              পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
                            </h2>
                            <p className="text-[9.5px] font-bold text-gray-800 leading-tight">
                              বাড়ি ভিত্তিক চাঁদা কালেকশন শিট ({toBanglaNum(selectedYear)} খ্রি.)
                            </p>
                          </div>
                        </div>

                        {/* Figures Breakdown House 1 */}
                        {(() => {
                          const figureCounts = selectedHouseDonors.reduce<{ [key: string]: number }>((acc, donor) => {
                            if (donor.donationType === 'item' || (donor.itemName && (!donor.amount || donor.amount === 0))) {
                              acc['item'] = (acc['item'] || 0) + 1;
                            } else if (donor.amount > 0) {
                              const key = donor.amount.toString();
                              acc[key] = (acc[key] || 0) + 1;
                            }
                            return acc;
                          }, {});

                          const sortedAmounts = Object.keys(figureCounts)
                            .filter(k => k !== 'item')
                            .map(Number)
                            .sort((a, b) => b - a);

                          return (
                            <div className="shrink-0 border border-gray-800 rounded p-1 bg-white text-[8.5px] font-bold text-black min-w-[125px]">
                              <div className="font-black border-b border-gray-300 pb-0.5 mb-0.5 flex justify-between">
                                <span>আদায় ফিগার</span>
                                <span>({toBanglaNum(selectedHouseDonors.length)}টি)</span>
                              </div>
                              <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                                {sortedAmounts.map(amt => (
                                  <span key={amt} className="text-gray-800">
                                    ৳{toBanglaNum(amt)}: <b className="text-black">{toBanglaNum(figureCounts[amt.toString()])}</b>
                                  </span>
                                ))}
                                {figureCounts['item'] && (
                                  <span className="text-gray-800">
                                    📦 পণ্য: <b className="text-black">{toBanglaNum(figureCounts['item'])}</b>
                                  </span>
                                )}
                                {sortedAmounts.length === 0 && !figureCounts['item'] && (
                                  <span className="text-gray-400 italic">তথ্য নেই</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* House 1 Metadata (Identical to Single House Layout) */}
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
                            <span className="text-gray-700 font-bold">সংগ্রহের তারিখ:</span>
                            <span className="font-bold text-black">{mahfilDetails ? toEnglishDate(mahfilDetails.targetDate) : '...................'}</span>
                          </div>
                          <div className="flex items-baseline justify-end space-x-1.5">
                            <span className="text-gray-700 font-bold">সংগ্রহকারী সদস্য:</span>
                            <span className="font-medium text-gray-800 underline">........................</span>
                          </div>
                        </div>
                      </div>

                      {/* House 1 Table (up to 10 rows) */}
                      <table className="w-full border-collapse border border-gray-900 text-[10.5px] text-center">
                        <thead>
                          <tr className="bg-gray-100 text-black border-b border-gray-900">
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-8 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">ক্র.</span>
                            </th>
                            <th className="border border-gray-900 px-2 pt-1.5 pb-2 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">চাঁদাদাতার নাম</span>
                            </th>
                            <th className="border border-gray-900 px-1.5 pt-1.5 pb-2 w-28 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">পরিমাণ (টাকা / পণ্য)</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-14 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">রশিদ নং</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-16 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">তারিখ</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-20 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">মন্তব্য</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {selectedHouseDonors.slice(0, 10).map((donor, idx) => (
                            <tr key={donor.id} className="bg-white">
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-bold text-gray-900 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-1 pb-2 text-center font-bold text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">{donor.donorName}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 pt-1 pb-2 text-center font-black text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">
                                  {donor.donationType === 'item' || donor.itemName ? (
                                    <span>📦 {donor.itemName}</span>
                                  ) : (
                                    <span>৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-</span>
                                  )}
                                </span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{donor.receiptNo ? toBanglaNum(donor.receiptNo) : '—'}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toEnglishDate(donor.date)}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-gray-400 align-middle"></td>
                            </tr>
                          ))}

                          {Array.from({ length: Math.max(0, 10 - Math.min(10, selectedHouseDonors.length)) }).map((_, idx) => (
                            <tr key={`empty-h1-${idx}`} className="h-6.5 bg-white">
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-medium text-gray-400 align-middle leading-snug text-[9px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(Math.min(10, selectedHouseDonors.length) + idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1.5 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 align-middle"></td>
                            </tr>
                          ))}

                          {(() => {
                            const totalCash = selectedHouseDonors.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const totalItems = selectedHouseDonors.filter(t => t.donationType === 'item' || t.itemName).length;
                            return (
                              <tr className="bg-gray-100 font-black text-black border-t border-gray-900">
                                <td colSpan={2} className="border border-gray-900 px-2 pt-1.5 pb-2 text-right text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">মোট আদায়:</span>
                                </td>
                                <td className="border border-gray-900 px-1.5 pt-1.5 pb-2 text-center text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">
                                    ৳ {toBanglaNum(totalCash.toLocaleString('bn-BD'))}/-
                                    {totalItems > 0 && <span className="block text-[8.5px]">(+{toBanglaNum(totalItems)} পণ্য)</span>}
                                  </span>
                                </td>
                                <td colSpan={3} className="border border-gray-900 px-2 pt-1.5 pb-2 text-left text-[9px] text-gray-700 italic align-middle leading-snug pl-2">
                                  <span className="inline-block relative -top-0.5">{totalCash > 0 ? `কথায়: ${toBanglaWords(totalCash)}` : 'পণ্য সামগ্রী'}</span>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* --- DOTTED CUTTING DIVIDER (কাটিং অংশ / কাটার দাগ) --- */}
                    <div className="my-2 border-t-2 border-dashed border-gray-600 relative flex items-center justify-center">
                      <span className="bg-white px-3 text-[9.5px] font-bold text-gray-700 flex items-center gap-1.5 border border-dashed border-gray-400 rounded-full py-0.5 shadow-2xs">
                        <span>✂</span>
                        <span>এখান থেকে কেটে আলাদা করুন (কাটার দাগ)</span>
                        <span>✂</span>
                      </span>
                    </div>

                    {/* --- HOUSE 2 (BOTTOM HALF) --- */}
                    <div className="space-y-2">
                      {/* Compact Header House 2 */}
                      <div className="border-b border-gray-900 pb-1 flex items-center justify-between gap-2">
                        <div className="flex items-center space-x-2">
                          <img 
                            src={logo} 
                            onError={handleLogoError}
                            alt="Logo" 
                            className="w-10 h-10 object-contain rounded-full border border-gray-800 p-0.5 bg-white shrink-0" 
                            referrerPolicy="no-referrer" 
                          />
                          <div>
                            <span className="text-[9px] font-serif font-bold text-gray-800 block leading-tight">
                              بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
                            </span>
                            <h2 className="text-sm font-black text-black leading-tight">
                              পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
                            </h2>
                            <p className="text-[9.5px] font-bold text-gray-800 leading-tight">
                              বাড়ি ভিত্তিক চাঁদা কালেকশন শিট ({toBanglaNum(selectedYear)} খ্রি.)
                            </p>
                          </div>
                        </div>

                        {/* Figures Breakdown House 2 */}
                        {(() => {
                          const figureCounts = secondHouseDonors.reduce<{ [key: string]: number }>((acc, donor) => {
                            if (donor.donationType === 'item' || (donor.itemName && (!donor.amount || donor.amount === 0))) {
                              acc['item'] = (acc['item'] || 0) + 1;
                            } else if (donor.amount > 0) {
                              const key = donor.amount.toString();
                              acc[key] = (acc[key] || 0) + 1;
                            }
                            return acc;
                          }, {});

                          const sortedAmounts = Object.keys(figureCounts)
                            .filter(k => k !== 'item')
                            .map(Number)
                            .sort((a, b) => b - a);

                          return (
                            <div className="shrink-0 border border-gray-800 rounded p-1 bg-white text-[8.5px] font-bold text-black min-w-[125px]">
                              <div className="font-black border-b border-gray-300 pb-0.5 mb-0.5 flex justify-between">
                                <span>আদায় ফিগার</span>
                                <span>({toBanglaNum(secondHouseDonors.length)}টি)</span>
                              </div>
                              <div className="flex flex-wrap gap-x-1.5 gap-y-0.5">
                                {sortedAmounts.map(amt => (
                                  <span key={amt} className="text-gray-800">
                                    ৳{toBanglaNum(amt)}: <b className="text-black">{toBanglaNum(figureCounts[amt.toString()])}</b>
                                  </span>
                                ))}
                                {figureCounts['item'] && (
                                  <span className="text-gray-800">
                                    📦 পণ্য: <b className="text-black">{toBanglaNum(figureCounts['item'])}</b>
                                  </span>
                                )}
                                {sortedAmounts.length === 0 && !figureCounts['item'] && (
                                  <span className="text-gray-400 italic">তথ্য নেই</span>
                                )}
                              </div>
                            </div>
                          );
                        })()}
                      </div>

                      {/* House 2 Metadata (Identical to Single House Layout) */}
                      <div className="grid grid-cols-2 gap-2 text-[10px] border border-gray-800 rounded p-1.5 bg-white">
                        <div className="space-y-0.5">
                          <div className="flex items-baseline space-x-1.5">
                            <span className="text-gray-700 font-bold">বাড়ির নাম:</span>
                            <span className="text-xs font-black text-black">
                              {toBanglaNum(getHouseSerialNum(secondHouseForDual || ''))}. {secondHouseForDual || '২য় বাড়ি'}
                            </span>
                          </div>
                          <div className="flex items-baseline space-x-1.5">
                            <span className="text-gray-700 font-bold">মোট দাতা সংখ্যা:</span>
                            <span className="font-extrabold text-black">{toBanglaNum(secondHouseDonors.length)} জন</span>
                          </div>
                        </div>
                        <div className="space-y-0.5 text-right">
                          <div className="flex items-baseline justify-end space-x-1.5">
                            <span className="text-gray-700 font-bold">সংগ্রহের তারিখ:</span>
                            <span className="font-bold text-black">{mahfilDetails ? toEnglishDate(mahfilDetails.targetDate) : '...................'}</span>
                          </div>
                          <div className="flex items-baseline justify-end space-x-1.5">
                            <span className="text-gray-700 font-bold">সংগ্রহকারী সদস্য:</span>
                            <span className="font-medium text-gray-800 underline">........................</span>
                          </div>
                        </div>
                      </div>

                      {/* House 2 Table (up to 10 rows) */}
                      <table className="w-full border-collapse border border-gray-900 text-[10.5px] text-center">
                        <thead>
                          <tr className="bg-gray-100 text-black border-b border-gray-900">
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-8 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">ক্র.</span>
                            </th>
                            <th className="border border-gray-900 px-2 pt-1.5 pb-2 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">চাঁদাদাতার নাম</span>
                            </th>
                            <th className="border border-gray-900 px-1.5 pt-1.5 pb-2 w-28 font-black text-[10.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">পরিমাণ (টাকা / পণ্য)</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-14 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">রশিদ নং</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-16 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">তারিখ</span>
                            </th>
                            <th className="border border-gray-900 px-1 pt-1.5 pb-2 w-20 font-black text-[9.5px] align-middle leading-snug">
                              <span className="inline-block relative -top-0.5">মন্তব্য</span>
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {secondHouseDonors.slice(0, 10).map((donor, idx) => (
                            <tr key={donor.id} className="bg-white">
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-bold text-gray-900 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-1 pb-2 text-center font-bold text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">{donor.donorName}</span>
                              </td>
                              <td className="border border-gray-900 px-1.5 pt-1 pb-2 text-center font-black text-black align-middle leading-snug text-[10.5px]">
                                <span className="inline-block relative -top-0.5">
                                  {donor.donationType === 'item' || donor.itemName ? (
                                    <span>📦 {donor.itemName}</span>
                                  ) : (
                                    <span>৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}/-</span>
                                  )}
                                </span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{donor.receiptNo ? toBanglaNum(donor.receiptNo) : '—'}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-semibold text-gray-800 align-middle leading-snug text-[9.5px]">
                                <span className="inline-block relative -top-0.5">{toEnglishDate(donor.date)}</span>
                              </td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-gray-400 align-middle"></td>
                            </tr>
                          ))}

                          {Array.from({ length: Math.max(0, 10 - Math.min(10, secondHouseDonors.length)) }).map((_, idx) => (
                            <tr key={`empty-h2-${idx}`} className="h-6.5 bg-white">
                              <td className="border border-gray-900 px-1 pt-1 pb-2 text-center font-medium text-gray-400 align-middle leading-snug text-[9px]">
                                <span className="inline-block relative -top-0.5">{toBanglaNum(Math.min(10, secondHouseDonors.length) + idx + 1)}</span>
                              </td>
                              <td className="border border-gray-900 px-2 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1.5 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 align-middle"></td>
                              <td className="border border-gray-900 px-1 pt-1 pb-2 align-middle"></td>
                            </tr>
                          ))}

                          {(() => {
                            const totalCash = secondHouseDonors.reduce((sum, t) => sum + (t.amount || 0), 0);
                            const totalItems = secondHouseDonors.filter(t => t.donationType === 'item' || t.itemName).length;
                            return (
                              <tr className="bg-gray-100 font-black text-black border-t border-gray-900">
                                <td colSpan={2} className="border border-gray-900 px-2 pt-1.5 pb-2 text-right text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">মোট আদায়:</span>
                                </td>
                                <td className="border border-gray-900 px-1.5 pt-1.5 pb-2 text-center text-[10px] align-middle leading-snug">
                                  <span className="inline-block relative -top-0.5">
                                    ৳ {toBanglaNum(totalCash.toLocaleString('bn-BD'))}/-
                                    {totalItems > 0 && <span className="block text-[8.5px]">(+{toBanglaNum(totalItems)} পণ্য)</span>}
                                  </span>
                                </td>
                                <td colSpan={3} className="border border-gray-900 px-2 pt-1.5 pb-2 text-left text-[9px] text-gray-700 italic align-middle leading-snug pl-2">
                                  <span className="inline-block relative -top-0.5">{totalCash > 0 ? `কথায়: ${toBanglaWords(totalCash)}` : 'পণ্য সামগ্রী'}</span>
                                </td>
                              </tr>
                            );
                          })()}
                        </tbody>
                      </table>
                    </div>

                    {/* Bottom Slogan & Footer Note */}
                    <div className="border-t border-gray-400 pt-1 flex justify-between items-center text-[8.5px] text-gray-600">
                      <span className="font-semibold">
                        ★ সবার আন্তরিক সহযোগিতায় পবিত্র মাহফিল সফল হোক ★
                      </span>
                      <span>
                        কম্পিউটার জেনারেটেড ডুয়াল কালেকশন শিট
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Helper Hint & Modal Actions */}
            <div className="space-y-3 print:hidden">
              <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-xl text-xs text-amber-950 flex items-start space-x-2">
                <AlertCircle className="h-4 w-4 text-[#d97706] mt-0.5 shrink-0" />
                <p className="leading-relaxed">
                  নিচের <strong>"PDF ডাউনলোড করুন"</strong> বাটনে ক্লিক করলে সম্পূর্ণ A4 সাইজের দৃষ্টিনন্দন অফিসিয়াল কালেকশন শিটটি সরাসরি ডাউনলোড হবে। প্রয়োজনে <strong>"প্রিন্ট করুন"</strong> বাটনে চাপ দিয়ে সরাসরি প্রিন্ট করতে পারেন।
                </p>
              </div>

              <div className="flex flex-wrap justify-end gap-2.5 border-t border-gray-100 pt-3">
                <button
                  onClick={() => setShowCollectionSheetModal(false)}
                  className="px-4 py-2 border border-[#cbd5e1] hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer transition"
                >
                  বন্ধ করুন
                </button>
                <button
                  onClick={handleDownloadPDF}
                  disabled={isDownloadingPdf}
                  className="px-5 py-2.5 bg-[#d97706] hover:bg-[#b45309] text-white font-black rounded-xl text-xs shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="PDF ডাউনলোড করুন"
                >
                  {isDownloadingPdf ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>PDF তৈরি হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-4 w-4" />
                      <span>A4 PDF ডাউনলোড করুন</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2.5 bg-[#064e3b] hover:bg-[#043327] text-white font-black rounded-xl text-xs shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ================= DONATION RECEIPT PRINT MODAL ================= */}
      {showReceiptModal && selectedDonorForReceipt && (
        triggerAutoReceiptDownload ? (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
            <div className="bg-white rounded-2xl p-8 space-y-4 max-w-sm w-full text-center shadow-2xl border border-[#cbd5e1] flex flex-col items-center">
              <div className="relative flex items-center justify-center w-16 h-16">
                <span className="absolute animate-ping inline-flex h-full w-full rounded-full bg-[#0f766e]/20 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-12 w-12 bg-[#0f766e]/10 items-center justify-center">
                  <Printer className="h-6 w-6 text-[#0f766e] animate-bounce" />
                </span>
              </div>
              <div className="space-y-1.5">
                <h4 className="font-black text-[#064e3b] text-base">রশিদ ডাউনলোড হচ্ছে</h4>
                <p className="text-xs text-gray-500 font-bold leading-relaxed">অনুগ্রহ করে কিছুক্ষণ অপেক্ষা করুন, পিডিএফ ফাইলটি প্রস্তুত হচ্ছে...</p>
              </div>

              {/* Invisible/off-screen rendering area for html2canvas to capture */}
              <div className="absolute left-[-9999px] top-[-9999px]">
                <div id="receipt-print-wrapper" className="bg-[#f8fafc] p-3 w-[550px] overflow-hidden">
                  <div id="receipt-print-area" className="p-4 bg-[#f8fafc] border-4 border-double border-[#d97706] rounded-2xl space-y-5 text-[#1a1a1a] relative shadow-inner overflow-hidden">
                    {/* Logo Watermark */}
                    <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center scale-110">
                      <img src={logo} onError={handleLogoError} alt="Watermark" className="w-56 h-56 object-contain rounded-full" referrerPolicy="no-referrer" />
                    </div>

                    {/* Receipt Header */}
                    <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-[#d97706]/50 relative">
                      {/* Small top-left logo */}
                      <div className="absolute left-1 top-1/2 -translate-y-1/2 flex items-center justify-center">
                        <img 
                          src={logo} 
                          onError={handleLogoError}
                          alt="Logo" 
                          className="w-10 h-10 object-contain rounded-full border border-[#d97706]/20 p-0.5 bg-white shadow-sm" 
                          referrerPolicy="no-referrer" 
                        />
                      </div>
                      <div className="text-[10px] font-bold text-[#0f766e] uppercase">বিসমিল্লাহির রাহমানির রাহিম</div>
                      <h2 className="text-lg font-black text-[#064e3b] pl-10">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h2>
                      <p className="text-xs text-[#0f766e] font-bold pl-10">সোনারগাঁও(তুপ্পারপাড়), রাঙ্গুনিয়া, চট্টগ্রাম।</p>
                      <div className="inline-flex items-center justify-center text-center px-4 py-1.5 bg-[#d97706]/15 text-[#064e3b] text-xs font-black rounded border border-[#d97706]/40 mt-1 leading-none min-h-[28px] ml-10">
                        চাঁদা আদায়ের রশিদ
                      </div>
                    </div>

                    {/* Receipt Body */}
                    <div className="space-y-4 text-xs">
                      {/* Sl No & Date */}
                      <div className="flex justify-between items-center font-bold text-[#064e3b]">
                        <div className="flex items-center space-x-1.5">
                          <span>রসিদ নম্বর:</span>
                          <span className="inline-flex items-center justify-center text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded leading-none min-h-[26px]">
                            {selectedDonorForReceipt.receiptNo ? toBanglaNum(selectedDonorForReceipt.receiptNo) : 'অনলাইন-এন্ট্রি'}
                          </span>
                        </div>
                        <div className="flex items-center space-x-1.5">
                          <span>তারিখ:</span>
                          <span className="underline decoration-dotted font-bold text-gray-800">{toEnglishDate(selectedDonorForReceipt.date)}</span>
                        </div>
                      </div>

                      {/* Main Text Block with dashed underlines */}
                      <div className="space-y-4 pt-2 text-[#064e3b] font-semibold leading-relaxed">
                        <div className="flex items-baseline">
                          <span className="w-28 shrink-0 text-[#0f766e] font-bold">বাড়ির নাম:</span>
                          <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-[#064e3b]">{selectedDonorForReceipt.houseName}</span>
                        </div>

                        <div className="flex items-baseline">
                          <span className="w-28 shrink-0 text-[#0f766e] font-bold">চাঁদাদাতার নাম:</span>
                          <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-sm text-emerald-800">{selectedDonorForReceipt.donorName}</span>
                        </div>

                        {selectedDonorForReceipt.donationType === 'item' || selectedDonorForReceipt.itemName ? (
                          <>
                            <div className="flex items-baseline">
                              <span className="w-28 shrink-0 text-[#d97706] font-bold">দানকৃত পণ্য / সামগ্রী:</span>
                              <span className="flex-grow border-b border-dashed border-amber-500 font-black pl-2 pb-1 text-sm text-[#064e3b]">
                                📦 {selectedDonorForReceipt.itemName}
                                {selectedDonorForReceipt.amount > 0 ? ` (আনুমানিক মূল্য: ৳ ${toBanglaNum(selectedDonorForReceipt.amount.toLocaleString('bn-BD'))}/-)` : ''}
                              </span>
                            </div>

                            <div className="flex items-baseline">
                              <span className="w-28 shrink-0 text-[#0f766e] font-bold">দানের বিবরণ:</span>
                              <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-[#064e3b] italic">
                                {selectedDonorForReceipt.amount > 0 
                                  ? `পণ্য সামগ্রী অনুদান (মূল্য: ${toBanglaWords(selectedDonorForReceipt.amount)})` 
                                  : 'পণ্য ও খাদ্যসামগ্রী অনুদান'}
                              </span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex items-baseline">
                              <span className="w-28 shrink-0 text-[#0f766e] font-bold">টাকার পরিমাণ:</span>
                              <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-sm text-[#064e3b]">৳ {toBanglaNum(selectedDonorForReceipt.amount.toLocaleString('bn-BD'))} /-</span>
                            </div>

                            <div className="flex items-baseline">
                              <span className="w-28 shrink-0 text-[#0f766e] font-bold">কথায়:</span>
                              <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-[#064e3b] italic">{toBanglaWords(selectedDonorForReceipt.amount)}</span>
                            </div>
                          </>
                        )}
                      </div>

                      {/* Blessing message */}
                      <div className="p-2.5 bg-[#0f766e]/5 border border-[#0f766e]/10 rounded-xl text-center text-[10px] sm:text-xs text-[#064e3b] font-bold leading-normal italic mt-4">
                        "সোনারগাঁও এলাকায় পবিত্র জশনে জুলুস ও আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিল সুন্দর ও সফলভাবে উদযাপনে আপনার বাড়ি ভিত্তিক আন্তরিক আর্থিক সহযোগিতার জন্য আমরা কৃতজ্ঞ। আল্লাহ্ পাক আপনার ও আপনার পরিবারের এই মহৎ অবদান এবং দান কবুল করুন। আমিন।"
                      </div>
                    </div>

                    {/* Receipt Footer Signatures */}
                    <div className="pt-10 grid grid-cols-3 gap-3 text-center text-[10px] font-bold text-[#064e3b]">
                      <div>
                        <div className="h-6 flex items-end justify-center text-gray-400 font-normal italic mb-1 text-[9px]">
                          {selectedDonorForReceipt.recordedBy || 'অনলাইন এন্ট্রি'}
                        </div>
                        <div className="border-t border-gray-300 pt-1 mx-2">আদায়কারী সদস্য</div>
                      </div>
                      <div>
                        <div className="h-6"></div>
                        <div className="border-t border-gray-300 pt-1 mx-2">কোষাধ্যক্ষ</div>
                      </div>
                      <div>
                        <div className="h-6"></div>
                        <div className="border-t border-gray-300 pt-1 mx-2">আহ্বায়ক / সভাপতি</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 overflow-y-auto print:p-0 print:bg-white print:absolute print:inset-0 animate-fade-in">
            <div className="bg-white rounded-2xl shadow-xl max-w-xl w-full p-6 space-y-6 relative border border-[#cbd5e1] print:border-none print:shadow-none print:p-0">
              {/* Modal Header */}
              <div className="flex justify-between items-center border-b border-gray-100 pb-3 print:hidden">
                <h3 className="text-sm font-black text-[#064e3b] flex items-center space-x-2">
                  <Printer className="h-4 w-4 text-[#0f766e]" />
                  <span>চাঁদা আদায়ের রশিদ (মুদ্রণ ও ডাউনলোড)</span>
                </h3>
                <button 
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedDonorForReceipt(null);
                  }}
                  className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Print Area */}
              <div id="receipt-print-wrapper" className="bg-[#f8fafc] p-1 overflow-hidden">
                <div id="receipt-print-area" className="p-4 bg-[#f8fafc] border-4 border-double border-[#d97706] rounded-2xl space-y-5 text-[#1a1a1a] relative shadow-inner overflow-hidden">
                  
                  {/* Logo Watermark */}
                  <div className="absolute inset-0 opacity-[0.06] pointer-events-none flex items-center justify-center scale-110">
                    <img src={logo} onError={handleLogoError} alt="Watermark" className="w-56 h-56 object-contain rounded-full" referrerPolicy="no-referrer" />
                  </div>

                  {/* Receipt Header */}
                  <div className="text-center space-y-1 pb-3 border-b-2 border-dashed border-[#d97706]/50">
                    <div className="text-[10px] font-bold text-[#0f766e] uppercase">বিসমিল্লাহির রাহমানির রাহিম</div>
                    <h2 className="text-lg font-black text-[#064e3b]">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h2>
                    <p className="text-xs text-[#0f766e] font-bold">সোনারগাঁও(তুপ্পারপাড়), রাঙ্গুনিয়া, চট্টগ্রাম।</p>
                    <div className="inline-flex items-center justify-center text-center px-4 py-1.5 bg-[#d97706]/15 text-[#064e3b] text-xs font-black rounded border border-[#d97706]/40 mt-1 leading-none min-h-[28px]">
                      চাঁদা আদায়ের রশিদ
                    </div>
                  </div>

                  {/* Receipt Body */}
                  <div className="space-y-4 text-xs">
                    
                    {/* Sl No & Date */}
                    <div className="flex justify-between items-center font-bold text-[#064e3b]">
                      <div className="flex items-center space-x-1.5">
                        <span>রসিদ নম্বর:</span>
                        <span className="inline-flex items-center justify-center text-xs font-black text-red-700 bg-red-50 border border-red-200 px-2.5 py-1 rounded leading-none min-h-[26px]">
                          {selectedDonorForReceipt.receiptNo ? toBanglaNum(selectedDonorForReceipt.receiptNo) : 'অনলাইন-এন্ট্রি'}
                        </span>
                      </div>
                      <div className="flex items-center space-x-1.5">
                        <span>তারিখ:</span>
                        <span className="underline decoration-dotted">{toBanglaDate(selectedDonorForReceipt.date)}</span>
                      </div>
                    </div>

                    {/* Main Text Block with dashed underlines */}
                    <div className="space-y-4 pt-2 text-[#064e3b] font-semibold leading-relaxed">
                      <div className="flex items-baseline">
                        <span className="w-28 shrink-0 text-[#0f766e] font-bold">বাড়ির নাম:</span>
                        <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-[#064e3b]">{selectedDonorForReceipt.houseName}</span>
                      </div>

                      <div className="flex items-baseline">
                        <span className="w-28 shrink-0 text-[#0f766e] font-bold">চাঁদাদাতার নাম:</span>
                        <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-sm text-emerald-800">{selectedDonorForReceipt.donorName}</span>
                      </div>

                      {selectedDonorForReceipt.donationType === 'item' || selectedDonorForReceipt.itemName ? (
                        <>
                          <div className="flex items-baseline">
                            <span className="w-28 shrink-0 text-[#d97706] font-bold">দানকৃত পণ্য / সামগ্রী:</span>
                            <span className="flex-grow border-b border-dashed border-amber-500 font-black pl-2 pb-1 text-sm text-[#064e3b]">
                              📦 {selectedDonorForReceipt.itemName}
                              {selectedDonorForReceipt.amount > 0 ? ` (আনুমানিক মূল্য: ৳ ${toBanglaNum(selectedDonorForReceipt.amount.toLocaleString('bn-BD'))}/-)` : ''}
                            </span>
                          </div>

                          <div className="flex items-baseline">
                            <span className="w-28 shrink-0 text-[#0f766e] font-bold">দানের বিবরণ:</span>
                            <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-[#064e3b] italic">
                              {selectedDonorForReceipt.amount > 0 
                                ? `পণ্য সামগ্রী অনুদান (মূল্য: ${toBanglaWords(selectedDonorForReceipt.amount)})` 
                                : 'পণ্য ও খাদ্যসামগ্রী অনুদান'}
                            </span>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="flex items-baseline">
                            <span className="w-28 shrink-0 text-[#0f766e] font-bold">টাকার পরিমাণ:</span>
                            <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-sm text-[#064e3b]">৳ {toBanglaNum(selectedDonorForReceipt.amount.toLocaleString('bn-BD'))} /-</span>
                          </div>

                          <div className="flex items-baseline">
                            <span className="w-28 shrink-0 text-[#0f766e] font-bold">কথায়:</span>
                            <span className="flex-grow border-b border-dashed border-gray-400 font-black pl-2 pb-1 text-[#064e3b] italic">{toBanglaWords(selectedDonorForReceipt.amount)}</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Blessing message */}
                    <div className="p-2.5 bg-[#0f766e]/5 border border-[#0f766e]/10 rounded-xl text-center text-[10px] sm:text-xs text-[#064e3b] font-bold leading-normal italic mt-4">
                      "সোনারগাঁও এলাকায় পবিত্র জশনে জুলুস ও আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিল সুন্দর ও সফলভাবে উদযাপনে আপনার বাড়ি ভিত্তিক আন্তরিক আর্থিক সহযোগিতার জন্য আমরা কৃতজ্ঞ। আল্লাহ্ পাক আপনার ও আপনার পরিবারের এই মহৎ অবদান এবং দান কবুল করুন। আমিন।"
                    </div>
                  </div>

                  {/* Receipt Footer Signatures */}
                  <div className="pt-10 grid grid-cols-3 gap-3 text-center text-[10px] font-bold text-[#064e3b]">
                    <div>
                      <div className="h-6 flex items-end justify-center text-gray-400 font-normal italic mb-1 text-[9px]">
                        {selectedDonorForReceipt.recordedBy || 'অনলাইন এন্ট্রি'}
                      </div>
                      <div className="border-t border-gray-300 pt-1 mx-2">আদায়কারী সদস্য</div>
                    </div>
                    <div>
                      <div className="h-6"></div>
                      <div className="border-t border-gray-300 pt-1 mx-2">কোষাধ্যক্ষ</div>
                    </div>
                    <div>
                      <div className="h-6"></div>
                      <div className="border-t border-gray-300 pt-1 mx-2">আহ্বায়ক / সভাপতি</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Actions */}
              <div className="flex justify-end space-x-3 border-t border-gray-100 pt-4 print:hidden">
                <button
                  onClick={() => {
                    setShowReceiptModal(false);
                    setSelectedDonorForReceipt(null);
                  }}
                  className="px-4 py-2 border border-[#cbd5e1] hover:bg-gray-50 text-gray-700 font-semibold rounded-xl text-xs cursor-pointer"
                >
                  বন্ধ করুন
                </button>
                <button
                  onClick={handleDownloadReceiptPDF}
                  disabled={isDownloadingReceiptPdf}
                  className="px-4 py-2 bg-[#d97706] hover:bg-[#a38c5d] text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="PDF ডাউনলোড করুন"
                >
                  {isDownloadingReceiptPdf ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>ডাউনলোড হচ্ছে...</span>
                    </>
                  ) : (
                    <>
                      <Download className="h-3.5 w-3.5" />
                      <span>PDF</span>
                    </>
                  )}
                </button>
                <button
                  onClick={handleDownloadReceiptImage}
                  disabled={isDownloadingReceiptImage}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  title="JPG/PNG ছবি ডাউনলোড করুন"
                >
                  {isDownloadingReceiptImage ? (
                    <>
                      <span className="animate-spin h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full"></span>
                      <span>ছবি...</span>
                    </>
                  ) : (
                    <>
                      <ImageIcon className="h-3.5 w-3.5" />
                      <span>ছবি (JPG/PNG)</span>
                    </>
                  )}
                </button>
                <button
                  onClick={() => window.print()}
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-xl text-xs shadow-md hover:shadow-lg transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Printer className="h-4 w-4" />
                  <span>রশিদ প্রিন্ট করুন</span>
                </button>
              </div>
            </div>
          </div>
        )
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
                <span>তীর চিহ্নে (⬆/⬇) ক্লিক করে যেকোনো বাড়ির অবস্থান পরিবর্তন করুন। পরিবর্তন সাথে সাথে সংরক্ষিত হয়।</span>
              </div>
            </div>

            {/* Reorderable House List */}
            <div className="max-h-[50vh] overflow-y-auto space-y-2 pr-1 divide-y divide-gray-100">
              {dynamicHouses.map((house, index) => {
                const isFirst = index === 0;
                const isLast = index === dynamicHouses.length - 1;
                const stats = houseDonationStats.find(s => s.name === house);

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
                        {stats && (
                          <span className="text-[10px] text-gray-500">
                            আদায়: ৳ {toBanglaNum(stats.total.toLocaleString('bn-BD'))} ({toBanglaNum(stats.donorsCount)} জন দাতা)
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Action Controls */}
                    <div className="flex items-center space-x-1 shrink-0">
                      {/* Move to Top */}
                      <button
                        type="button"
                        disabled={isFirst}
                        onClick={(e) => handleMoveHouseToExtreme(house, 'top', e)}
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
                        onClick={(e) => handleMoveHouse(house, 'up', e)}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="১ ধাপ উপরে তুলুন"
                      >
                        <ChevronUp className="h-4 w-4" />
                      </button>

                      {/* Move 1 step Down */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={(e) => handleMoveHouse(house, 'down', e)}
                        className="p-1.5 bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#0f766e] border border-gray-300 hover:border-emerald-300 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition cursor-pointer"
                        title="১ ধাপ নিচে নামান"
                      >
                        <ChevronDown className="h-4 w-4" />
                      </button>

                      {/* Move to Bottom */}
                      <button
                        type="button"
                        disabled={isLast}
                        onClick={(e) => handleMoveHouseToExtreme(house, 'bottom', e)}
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

      {/* Donor Reorder Modal (চাঁদাদাতার নামের ক্রম উপরে-নিচে মুভ করার মডাল) */}
      {showDonorReorderModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div
            className="bg-white w-full max-w-xl rounded-2xl shadow-2xl border border-amber-200 overflow-hidden animate-in fade-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]"
            onClick={(e) => e.stopPropagation()}
          >
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
                  houseTransactionsForYear.filter(
                    (t) => t.houseName === (donorReorderTargetHouse || selectedHouse)
                  ).length
                )} জন
              </span>
            </div>

            {/* Instruction Tip */}
            <div className="px-4 py-2 bg-amber-50/80 border-b border-amber-200 text-xs text-amber-900 flex items-center justify-between">
              <div className="flex items-center space-x-1.5">
                <span className="font-bold">💡 টিপস:</span>
                <span>⬆ বা ⬇ বাটনে ক্লিক করে দাতার নাম উপরে বা নিচে নামান। এই ক্রমেই প্রিন্ট হবে।</span>
              </div>
            </div>

            {/* Donor List */}
            <div className="p-4 space-y-2 overflow-y-auto flex-grow max-h-[55vh] divide-y divide-gray-100">
              {(() => {
                const currentHouse = donorReorderTargetHouse || selectedHouse;
                const donorsOfThisHouse = houseTransactionsForYear.filter(
                  (t) => t.houseName === currentHouse
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
                <span>সম্পন্ন / প্রিভিউ দেখুন</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick House Transfer Modal (সহজে চাঁদাদাতার বাড়ি পরিবর্তন / স্থানান্তর মডাল) */}
      {quickTransferDonor && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
          <div 
            className="bg-white w-full max-w-lg rounded-2xl shadow-2xl border border-emerald-100 overflow-hidden animate-in fade-in zoom-in-95 duration-200"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="bg-gradient-to-r from-[#064e3b] to-[#0f766e] text-white px-5 py-4 flex items-center justify-between shadow-xs">
              <div className="flex items-center space-x-2.5">
                <div className="p-2 bg-white/15 backdrop-blur-xs rounded-xl border border-white/20">
                  <ArrowRightLeft className="h-5 w-5 text-amber-300" />
                </div>
                <div>
                  <h3 className="text-base font-black leading-tight">চাঁদাদাতার বাড়ি পরিবর্তন / স্থানান্তর</h3>
                  <p className="text-[11px] text-emerald-100 font-light mt-0.5">ভুল বাড়ি থেকে সহজে সঠিক বাড়িতে স্থানান্তর করুন</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setQuickTransferDonor(null)}
                className="p-1.5 hover:bg-white/20 text-white rounded-lg transition duration-150 cursor-pointer"
                title="বন্ধ করুন"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-4 sm:p-5 space-y-4 max-h-[82vh] overflow-y-auto">
              {/* Donor Summary Info Card */}
              <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl space-y-2">
                <div className="flex items-center justify-between flex-wrap gap-2">
                  <div>
                    <span className="text-[10px] text-gray-500 font-bold block">চাঁদাদাতার নাম:</span>
                    <span className="text-sm sm:text-base font-black text-[#064e3b]">{quickTransferDonor.donorName}</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-gray-500 font-bold block">চাঁদার পরিমাণ:</span>
                    {quickTransferDonor.donationType === 'item' || quickTransferDonor.itemName ? (
                      <span className="text-xs sm:text-sm font-black text-amber-900 bg-amber-100/80 px-2 py-0.5 rounded-md border border-amber-300">
                        📦 {quickTransferDonor.itemName} {quickTransferDonor.amount > 0 && `(৳ ${toBanglaNum(quickTransferDonor.amount.toLocaleString('bn-BD'))})`}
                      </span>
                    ) : (
                      <span className="text-sm sm:text-base font-black text-[#0f766e]">
                        ৳ {toBanglaNum(quickTransferDonor.amount.toLocaleString('bn-BD'))}
                      </span>
                    )}
                  </div>
                </div>

                <div className="pt-2 border-t border-emerald-200/60 flex items-center justify-between flex-wrap gap-2 text-xs">
                  <div className="flex items-center space-x-1.5">
                    <span className="text-gray-600 font-bold">বর্তমান বাড়ি:</span>
                    <span className="px-2 py-0.5 bg-red-100/90 text-red-800 font-black rounded-md border border-red-200 flex items-center space-x-1">
                      <Home className="h-3 w-3 text-red-600" />
                      <span>{quickTransferDonor.houseName || selectedHouse}</span>
                    </span>
                  </div>
                  {quickTransferDonor.receiptNo && (
                    <span className="text-[11px] text-[#064e3b] font-mono bg-white px-2 py-0.5 rounded border border-emerald-200 font-bold">
                      রসিদ নং: {toBanglaNum(quickTransferDonor.receiptNo)}
                    </span>
                  )}
                </div>
              </div>

              {/* Destination Mode Selector */}
              <div>
                <label className="block text-xs font-black text-[#064e3b] mb-2">
                  নতুন লক্ষ্য বাড়ি নির্ধারণ করুন:
                </label>
                <div className="grid grid-cols-2 gap-2 p-1 bg-gray-100 rounded-xl border border-gray-200 text-xs font-bold">
                  <button
                    type="button"
                    onClick={() => setIsCustomTargetHouse(false)}
                    className={`py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      !isCustomTargetHouse
                        ? 'bg-white text-[#0f766e] shadow-xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Building2 className="h-3.5 w-3.5" />
                    <span>বিদ্যমান বাড়ি থেকে বাছুন</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsCustomTargetHouse(true)}
                    className={`py-2 px-3 rounded-lg transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      isCustomTargetHouse
                        ? 'bg-white text-[#0f766e] shadow-xs font-black'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    <span>নতুন বাড়ির নাম লিখুন</span>
                  </button>
                </div>
              </div>

              {/* Mode 1: Existing Houses */}
              {!isCustomTargetHouse ? (
                <div className="space-y-2.5">
                  {/* Dropdown for quick standard pick */}
                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">
                      তালিকা থেকে বাড়ি নির্বাচন করুন:
                    </label>
                    <select
                      value={targetHouseForTransfer}
                      onChange={(e) => setTargetHouseForTransfer(e.target.value)}
                      className="w-full px-3 py-2 bg-white border-2 border-emerald-300 focus:border-[#0f766e] rounded-xl text-xs font-black text-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                    >
                      {dynamicHouses.map((h, i) => {
                        const isCurrent = h === (quickTransferDonor.houseName || selectedHouse);
                        return (
                          <option key={h} value={h} disabled={isCurrent}>
                            {toBanglaNum(i + 1)}. {h} {isCurrent ? '(❌ বর্তমান বাড়ি)' : ''}
                          </option>
                        );
                      })}
                    </select>
                  </div>

                  {/* Fast Search & Clickable Grid */}
                  <div className="pt-1">
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-[11px] font-bold text-gray-600">বা সরাসরি ক্লিক করে বেছে নিন:</span>
                      <span className="text-[10px] text-gray-400">মোট {toBanglaNum(dynamicHouses.length)}টি বাড়ি</span>
                    </div>

                    <div className="relative mb-2">
                      <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-gray-400" />
                      <input
                        type="text"
                        value={houseSearchFilter}
                        onChange={(e) => setHouseSearchFilter(e.target.value)}
                        placeholder="দ্রুত বাড়ি খুঁজুন (নাম লিখুন)..."
                        className="w-full pl-8 pr-8 py-1.5 bg-gray-50 border border-gray-300 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                      />
                      {houseSearchFilter && (
                        <button
                          type="button"
                          onClick={() => setHouseSearchFilter('')}
                          className="absolute right-2 top-2 text-gray-400 hover:text-gray-600 cursor-pointer"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 max-h-44 overflow-y-auto p-1 bg-gray-50/80 rounded-xl border border-gray-200">
                      {dynamicHouses
                        .filter((h) => !houseSearchFilter.trim() || h.toLowerCase().includes(houseSearchFilter.toLowerCase()))
                        .map((house, idx) => {
                          const isCurrent = house === (quickTransferDonor.houseName || selectedHouse);
                          const isSelected = targetHouseForTransfer === house && !isCurrent;

                          return (
                            <button
                              key={house}
                              type="button"
                              disabled={isCurrent}
                              onClick={() => setTargetHouseForTransfer(house)}
                              className={`text-left px-2.5 py-1.5 rounded-lg text-xs transition duration-150 flex items-center justify-between border cursor-pointer ${
                                isCurrent
                                  ? 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed opacity-60'
                                  : isSelected
                                  ? 'bg-[#0f766e] text-white border-[#0f766e] font-black shadow-xs'
                                  : 'bg-white hover:bg-emerald-50 text-gray-700 hover:text-[#064e3b] border-gray-200'
                              }`}
                            >
                              <span className="truncate pr-1">
                                {toBanglaNum(idx + 1)}. {house}
                              </span>
                              {isCurrent ? (
                                <span className="text-[9px] bg-gray-200 text-gray-600 px-1 py-0.2 rounded shrink-0">বর্তমান</span>
                              ) : isSelected ? (
                                <Check className="h-3.5 w-3.5 text-white shrink-0" />
                              ) : null}
                            </button>
                          );
                        })}
                    </div>
                  </div>
                </div>
              ) : (
                /* Mode 2: Custom New House */
                <div className="space-y-2 p-3 bg-amber-50/60 rounded-xl border border-amber-200">
                  <label className="block text-xs font-bold text-amber-900">
                    নতুন বাড়ির নাম লিখুন:
                  </label>
                  <input
                    type="text"
                    value={customTargetHouseName}
                    onChange={(e) => setCustomTargetHouseName(e.target.value)}
                    placeholder="যেমন: হাজী নুরুল হক সওদাগর বাড়ি"
                    className="w-full px-3 py-2 bg-white border-2 border-amber-400 rounded-xl text-xs font-black text-[#064e3b] focus:outline-none focus:ring-2 focus:ring-[#0f766e]"
                    autoFocus
                  />
                  <p className="text-[11px] text-gray-600">
                    💡 এই নামে কোনো বাড়ি না থাকলে তা স্বয়ংক্রিয়ভাবে গ্রামের বাড়ির তালিকায় যুক্ত হয়ে যাবে এবং চাঁদাদাতা নতুন বাড়িতে স্থানান্তরিত হবেন।
                  </p>
                </div>
              )}

              {/* Navigation Option Checkbox */}
              <div className="pt-2 border-t border-gray-100">
                <label className="flex items-center space-x-2 text-xs font-bold text-[#064e3b] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={navigateAfterTransfer}
                    onChange={(e) => setNavigateAfterTransfer(e.target.checked)}
                    className="rounded text-[#0f766e] focus:ring-[#0f766e] h-4 w-4 border-gray-300 cursor-pointer"
                  />
                  <span>স্থানান্তরের পর সরাসরি নতুন বাড়ির তালিকায় যান</span>
                </label>
              </div>

              {/* Transfer Preview Alert */}
              {(() => {
                const finalTarget = isCustomTargetHouse ? customTargetHouseName.trim() : targetHouseForTransfer.trim();
                const current = quickTransferDonor.houseName || selectedHouse;
                if (finalTarget && finalTarget !== current) {
                  return (
                    <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-[#064e3b] flex items-center space-x-2">
                      <span className="text-base">🔄</span>
                      <span>
                        <strong>"{quickTransferDonor.donorName}"</strong>-কে <strong>"{current}"</strong> থেকে <strong>"{finalTarget}"</strong>-তে স্থানান্তর করা হবে।
                      </span>
                    </div>
                  );
                }
                return null;
              })()}
            </div>

            {/* Modal Footer */}
            <div className="bg-gray-50 px-5 py-3.5 border-t border-gray-100 flex items-center justify-end space-x-2">
              <button
                type="button"
                disabled={isTransferring}
                onClick={() => setQuickTransferDonor(null)}
                className="px-4 py-2 bg-white hover:bg-gray-100 text-gray-700 font-bold rounded-xl text-xs border border-gray-300 transition cursor-pointer"
              >
                বাতিল
              </button>

              <button
                type="button"
                disabled={
                  isTransferring ||
                  (isCustomTargetHouse ? !customTargetHouseName.trim() : !targetHouseForTransfer.trim()) ||
                  (!isCustomTargetHouse && targetHouseForTransfer.trim() === (quickTransferDonor.houseName || selectedHouse))
                }
                onClick={handleExecuteQuickTransfer}
                className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d9488] disabled:opacity-50 disabled:cursor-not-allowed text-white font-black rounded-xl text-xs transition shadow-md cursor-pointer flex items-center space-x-1.5"
              >
                {isTransferring ? (
                  <>
                    <span className="animate-spin text-sm">⏳</span>
                    <span>স্থানান্তর হচ্ছে...</span>
                  </>
                ) : (
                  <>
                    <Check className="h-4 w-4" />
                    <span>স্থানান্তর সম্পন্ন করুন</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Global CSS Style for print overrides */}
      <style>{`
        @page {
          size: A4 portrait;
          margin: 10mm 10mm 10mm 10mm;
        }
        @media print {
          /* Hide everything outside of print area */
          body * {
            visibility: hidden !important;
            background: none !important;
          }
          #print-area, #print-area *, #receipt-print-area, #receipt-print-area * {
            visibility: visible !important;
          }
          #print-area, #receipt-print-area {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: white !important;
          }
          /* Compress padding and table cells on print to guarantee 24 rows fit on one page */
          #print-area table th, #print-area table td {
            padding-top: 2.5px !important;
            padding-bottom: 2.5px !important;
            padding-left: 5px !important;
            padding-right: 5px !important;
            line-height: 1.1 !important;
            font-size: 10.5px !important;
          }
          /* Ensure text is dark and highly legible */
          #print-area text, #print-area span, #print-area h1, #print-area h2, #print-area td, #print-area th, #print-area div,
          #receipt-print-area text, #receipt-print-area span, #receipt-print-area h1, #receipt-print-area h2, #receipt-print-area div {
            color: #000000 !important;
          }
          /* Ensure borders are printed clearly */
          #print-area, #print-area table, #print-area th, #print-area td, #receipt-print-area {
            border-color: #000000 !important;
          }
          tr {
            page-break-inside: avoid !important;
          }
        }
      `}</style>

    </div>
  );
}
