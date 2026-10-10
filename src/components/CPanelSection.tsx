import React from 'react';
import { Transaction, CommitteeMember, MahfilDetails, InvitedScholar, ActivityService, GalleryPhoto, VisitorSummary, ActiveSession, VisitorLog } from '../types';
import { defaultCategories } from '../initialData';
import { Lock, Unlock, Plus, Trash2, Key, Info, CheckCircle, AlertCircle, RefreshCw, Upload, Download, Eye, Pencil, Edit, Calendar, Mic, Sparkles, Users, TrendingUp, TrendingDown, Zap, Coins, ChevronDown, ChevronUp, Check, Save, Settings, Image as ImageIcon, Activity, Globe, FileText, ArrowRightLeft, Building2, Copy, FileSpreadsheet } from 'lucide-react';
import { toEnglishDigits, cleanNumericInput } from '../lib/numberUtils';
import { PRESET_DESIGNATIONS, detectMemberType, sortCommitteeMembers } from '../lib/designationHierarchy';
import CPanelGalleryManager from './CPanelGalleryManager';
import CPanelVisitorAnalytics from './CPanelVisitorAnalytics';
import CPanelCollectionSheets from './CPanelCollectionSheets';
import DuplicateAuditModal from './DuplicateAuditModal';
import ManualFinancialPostingSection from './ManualFinancialPostingSection';
import EditTransactionModal from './EditTransactionModal';
import { isAutoUploadedTransaction } from '../lib/transactionUtils';

interface CPanelSectionProps {
  transactions: Transaction[];
  onAddTransaction: (t: Omit<Transaction, 'id'>) => void;
  onUpdateTransaction?: (t: Transaction) => Promise<void> | void;
  onDeleteTransaction: (id: string) => void;
  committeeMembers: CommitteeMember[];
  onAddMember: (m: Omit<CommitteeMember, 'id'>) => void;
  onUpdateMember: (m: CommitteeMember) => void;
  onDeleteMember: (id: string) => void;
  scholars?: InvitedScholar[];
  onAddScholar: (s: Omit<InvitedScholar, 'id'>) => void;
  onUpdateScholar: (s: InvitedScholar) => void;
  onDeleteScholar: (id: string) => void;
  activities?: ActivityService[];
  onAddActivity: (act: Omit<ActivityService, 'id'>) => void;
  onUpdateActivity: (act: ActivityService) => void;
  onDeleteActivity: (id: string) => void;
  galleryPhotos?: GalleryPhoto[];
  onAddGalleryPhoto?: (photo: Omit<GalleryPhoto, 'id'>) => void;
  onUpdateGalleryPhoto?: (photo: GalleryPhoto) => void;
  onDeleteGalleryPhoto?: (id: string) => void;
  mahfilDetails: MahfilDetails;
  onUpdateMahfilDetails: (d: MahfilDetails) => void;
  onResetData: () => void;
  isAdminLoggedIn: boolean;
  setIsAdminLoggedIn: (status: boolean) => void;
  activeHouses?: string[];
  deletedHouses?: string[];
  donorOrders?: Record<string, string[]>;
  onUpdateDonorOrder?: (key: string, orderedIds: string[]) => Promise<void> | void;
  onAddHouse?: (houseName: string) => void;
  onUpdateHouses?: (active: string[], deleted: string[]) => Promise<void> | void;
  visitorSummary?: VisitorSummary | null;
  activeSessions?: ActiveSession[];
  activeVisitorCount?: number;
  visitorLogs?: VisitorLog[];
  onResetVisitorAnalytics?: () => void;
  onRefreshVisitorAnalytics?: () => void;
  onNavigate?: (tab: string) => void;
}

export default function CPanelSection({
  transactions,
  onAddTransaction,
  onUpdateTransaction,
  onDeleteTransaction,
  committeeMembers,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  scholars = [],
  onAddScholar,
  onUpdateScholar,
  onDeleteScholar,
  activities = [],
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  galleryPhotos = [],
  onAddGalleryPhoto,
  onUpdateGalleryPhoto,
  onDeleteGalleryPhoto,
  mahfilDetails,
  onUpdateMahfilDetails,
  onResetData,
  isAdminLoggedIn,
  setIsAdminLoggedIn,
  activeHouses: activeHousesProp,
  deletedHouses: deletedHousesProp,
  donorOrders,
  onUpdateDonorOrder,
  onAddHouse,
  onUpdateHouses,
  visitorSummary = null,
  activeSessions = [],
  activeVisitorCount = 1,
  visitorLogs = [],
  onResetVisitorAnalytics,
  onRefreshVisitorAnalytics,
  onNavigate
}: CPanelSectionProps) {
  // Login form state
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');

  // Transaction form state
  const [tDate, setTDate] = React.useState(new Date().toISOString().split('T')[0]);
  const [tYear, setTYear] = React.useState<number>(2026);
  const [tType, setTType] = React.useState<'income' | 'expense'>('income');
  const [tCategory, setTCategory] = React.useState('চাঁদা ও অনুদান');
  const [tCustomCategory, setTCustomCategory] = React.useState('');
  const [tAmount, setTAmount] = React.useState('');
  const [tDonor, setTDonor] = React.useState('');
  const [tDesc, setTDesc] = React.useState('');
  const [tReceipt, setTReceipt] = React.useState('');
  const [tRecordedBy, setTRecordedBy] = React.useState('মো: তারেক জামাল');
  const [tSuccessMsg, setTSuccessMsg] = React.useState('');

  // Dynamic Houses List variables
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

  const availableHouses = React.useMemo(() => {
    const housesInDb = transactions
      .filter((t) => t.houseName)
      .map((t) => t.houseName as string);
    const combined = [...activeHouses, ...housesInDb];
    const unique = Array.from(new Set(combined));
    return unique.filter((house) => !deletedHouses.includes(house));
  }, [activeHouses, transactions, deletedHouses]);

  const [tHouseName, setTHouseName] = React.useState('');
  const [tCustomHouseName, setTCustomHouseName] = React.useState('');
  const [filterHouseName, setFilterHouseName] = React.useState('');

  // Quick House Transfer state in CPanel
  const [cpanelTransferTx, setCpanelTransferTx] = React.useState<Transaction | null>(null);
  const [cpanelTargetHouse, setCpanelTargetHouse] = React.useState<string>('');
  const [cpanelTransferSuccess, setCpanelTransferSuccess] = React.useState<string>('');
  const [cpanelEditingTx, setCpanelEditingTx] = React.useState<Transaction | null>(null);

  // Dynamic Expense Categories List state (initialized from localStorage with default expense categories)
  const [expenseCategories, setExpenseCategories] = React.useState<string[]>(() => {
    const saved = localStorage.getItem('sonargaon_expense_categories_v1');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        // Fallback
      }
    }
    return defaultCategories.expense;
  });

  // Settings - Expense Categories states & handlers
  const [newSettingsCategory, setNewSettingsCategory] = React.useState('');
  const [settingsCategoryError, setSettingsCategoryError] = React.useState('');
  const [settingsCategorySuccess, setSettingsCategorySuccess] = React.useState('');

  const handleAddSettingsCategory = (e: React.FormEvent) => {
    e.preventDefault();
    const cat = newSettingsCategory.trim();
    if (!cat) return;
    if (expenseCategories.includes(cat)) {
      setSettingsCategoryError('এই খাতটি ইতিমধ্যেই বিদ্যমান আছে!');
      setTimeout(() => setSettingsCategoryError(''), 3000);
      return;
    }
    const updated = [...expenseCategories.filter(c => c !== 'অন্যান্য'), cat, 'অন্যান্য'];
    setExpenseCategories(updated);
    localStorage.setItem('sonargaon_expense_categories_v1', JSON.stringify(updated));
    setNewSettingsCategory('');
    setSettingsCategorySuccess('নতুন ব্যয়ের খাতটি সফলভাবে যুক্ত হয়েছে!');
    setTimeout(() => setSettingsCategorySuccess(''), 3000);
  };

  const handleDeleteSettingsCategory = (catToDelete: string) => {
    if (catToDelete === 'অন্যান্য') {
      alert('"অন্যান্য" খাতটি মুছে ফেলা সম্ভব নয়!');
      return;
    }
    if (confirm(`আপনি কি নিশ্চিতভাবে "${catToDelete}" ব্যয়ের খাতটি মুছে ফেলতে চান?`)) {
      const updated = expenseCategories.filter(c => c !== catToDelete);
      setExpenseCategories(updated);
      localStorage.setItem('sonargaon_expense_categories_v1', JSON.stringify(updated));
    }
  };

  const filteredRecentTransactions = React.useMemo(() => {
    let list = transactions;
    if (filterHouseName) {
      list = list.filter((t) => t.houseName === filterHouseName);
    }
    return list;
  }, [transactions, filterHouseName]);

  // Sync year with selected date
  React.useEffect(() => {
    if (tDate) {
      const yearPart = new Date(tDate).getFullYear();
      if (yearPart && !isNaN(yearPart)) {
        setTYear(yearPart);
      }
    }
  }, [tDate]);

  // Member form state
  const [mName, setMName] = React.useState('');
  const [mDesignation, setMDesignation] = React.useState('');
  const [mType, setMType] = React.useState<'leader' | 'member' | 'advisor'>('leader');
  const [mSuccessMsg, setMSuccessMsg] = React.useState('');

  // Member inline editing states
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editDesignation, setEditDesignation] = React.useState('');
  const [editType, setEditType] = React.useState<'leader' | 'member' | 'advisor'>('leader');
  const [editSerialNo, setEditSerialNo] = React.useState('');

  // Mahfil details states
  const [mahfilDate, setMahfilDate] = React.useState(mahfilDetails.date);
  const [mahfilTime, setMahfilTime] = React.useState(mahfilDetails.time);
  const [mahfilLocation, setMahfilLocation] = React.useState(mahfilDetails.location);
  const [mahfilTargetDate, setMahfilTargetDate] = React.useState(mahfilDetails.targetDate);
  const [mahfilSuccessMsg, setMahfilSuccessMsg] = React.useState('');

  // Sync Mahfil details when prop updates
  React.useEffect(() => {
    setMahfilDate(mahfilDetails.date);
    setMahfilTime(mahfilDetails.time);
    setMahfilLocation(mahfilDetails.location);
    setMahfilTargetDate(mahfilDetails.targetDate);
  }, [mahfilDetails]);

  // Scholar form state
  const [sName, setSName] = React.useState('');
  const [sTitle, setSTitle] = React.useState('');
  const [sTopic, setSTopic] = React.useState('');
  const [sSerialNo, setSSerialNo] = React.useState('');
  const [sSuccessMsg, setSSuccessMsg] = React.useState('');

  // Scholar inline editing state
  const [editingScholarId, setEditingScholarId] = React.useState<string | null>(null);
  const [editSName, setEditSName] = React.useState('');
  const [editSTitle, setEditSTitle] = React.useState('');
  const [editSTopic, setEditSTopic] = React.useState('');
  const [editSSerialNo, setEditSSerialNo] = React.useState('');

  // Activity form state
  const [actTitle, setActTitle] = React.useState('');
  const [actDesc, setActDesc] = React.useState('');
  const [actSuccessMsg, setActSuccessMsg] = React.useState('');

  // Activity inline editing state
  const [editingActivityId, setEditingActivityId] = React.useState<string | null>(null);
  const [editActTitle, setEditActTitle] = React.useState('');
  const [editActDesc, setEditActDesc] = React.useState('');

  // active sub-tab in Cpanel
  const [cpanelTab, setCpanelTab] = React.useState<'quick-post' | 'manual-ledger' | 'collection-sheets' | 'visitors' | 'transactions' | 'committee' | 'settings' | 'mahfil' | 'scholars' | 'activities' | 'gallery'>('quick-post');
  const [showOptionalFields, setShowOptionalFields] = React.useState(false);
  const [showDuplicateAuditModal, setShowDuplicateAuditModal] = React.useState(false);

  // Exact duplicate posting count for admin awareness badge
  const duplicateExactCount = React.useMemo(() => {
    const normalize = (name: string) => (name || '').replace(/[\s\u200B-\u200D\uFEFF\.\,\(\)\-\_]/g, '').trim().toLowerCase();
    const map = new Map<string, number>();
    transactions.forEach((t) => {
      if (t.type !== 'income' || !t.donorName) return;
      const key = `${t.year || 2026}_${normalize(t.donorName)}_${t.amount}`;
      map.set(key, (map.get(key) || 0) + 1);
    });
    let count = 0;
    map.forEach((c) => {
      if (c > 1) count++;
    });
    return count;
  }, [transactions]);

  // Define metadata for CPanel tabs to support responsive menus
  const cpanelTabs = [
    { id: 'quick-post', label: 'সহজ আয়-ব্যয় পোস্টিং', shortLabel: 'সহজ পোস্টিং', icon: Zap, color: 'text-amber-500' },
    { id: 'manual-ledger', label: 'বছর ভিত্তিক ম্যানুয়াল পোস্টিং', shortLabel: 'ম্যানুয়াল পোস্টিং', icon: FileSpreadsheet, color: 'text-[#0f766e]' },
    { id: 'collection-sheets', label: 'বাড়ি রিপোর্ট ও কালেকশন শিট', shortLabel: 'বাড়ি রিপোর্ট', icon: Building2, color: 'text-[#0f766e]' },
    { id: 'visitors', label: 'লাইভ ভিজিটর ও ট্রাফিক', shortLabel: 'ভিজিটর', icon: Activity, color: 'text-emerald-600' },
    { id: 'transactions', label: 'বিস্তারিত পোস্টিং', shortLabel: 'বিস্তারিত', icon: Coins, color: 'text-[#0f766e]' },
    { id: 'gallery', label: 'ফটো গ্যালারী ও ছবি আপলোড', shortLabel: 'ছবি আপলোড', icon: ImageIcon, color: 'text-amber-600' },
    { id: 'committee', label: 'কমিটি এডিট ও সংযোজন', shortLabel: 'কমিটি', icon: Users, color: 'text-blue-500' },
    { id: 'mahfil', label: 'মাহফিল বিবরণী এডিট', shortLabel: 'মাহফিল', icon: Calendar, color: 'text-rose-500' },
    { id: 'scholars', label: 'হুজুরদের তালিকা এডিট', shortLabel: 'হুজুরগণ', icon: Mic, color: 'text-purple-500' },
    { id: 'activities', label: 'কার্যক্রম ও সেবাসমূহ', shortLabel: 'সেবা এডিট', icon: Sparkles, color: 'text-emerald-500' },
    { id: 'settings', label: 'সিস্টেম সেটিংস প্যানেল', shortLabel: 'সেটিংস', icon: Settings, color: 'text-slate-600' }
  ] as const;

  // Translate numbers to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Handle Login submission
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === 'T@a546195') {
      setIsAdminLoggedIn(true);
      setLoginError('');
    } else {
      setLoginError('ভুল পাসওয়ার্ড! অনুগ্রহ করে সঠিক পাসওয়ার্ডটি পুনরায় প্রদান করুন।');
    }
  };

  // Handle transaction submit
  const handleTransactionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!tAmount || isNaN(parseFloat(tAmount)) || parseFloat(tAmount) <= 0) {
      alert('অনুগ্রহ করে সঠিক টাকার পরিমাণ প্রদান করুন।');
      return;
    }

    const finalCategory = (tCategory === 'অন্যান্য' || tCategory === 'new_category') && tCustomCategory.trim() !== '' 
      ? tCustomCategory.trim() 
      : tCategory;

    const finalHouseName = tType === 'income' 
      ? (tHouseName === 'new_house' ? tCustomHouseName.trim() : tHouseName || undefined)
      : undefined;

    // If a new house name was entered, save it dynamically via prop callback
    if (tType === 'income' && tHouseName === 'new_house' && tCustomHouseName.trim() !== '') {
      const newHouse = tCustomHouseName.trim();
      if (onAddHouse) {
        onAddHouse(newHouse);
      }
    }

    // If a new expense category was entered, save it dynamically to localStorage
    if (tType === 'expense' && tCategory === 'new_category' && tCustomCategory.trim() !== '') {
      const newCat = tCustomCategory.trim();
      try {
        const saved = localStorage.getItem('sonargaon_expense_categories_v1');
        let currentCats = [...expenseCategories];
        if (saved) {
          try {
            currentCats = JSON.parse(saved);
          } catch (err) {}
        }
        if (!currentCats.includes(newCat)) {
          const baseCats = currentCats.filter((c) => c !== 'অন্যান্য');
          const updatedCats = [...baseCats, newCat, 'অন্যান্য'];
          setExpenseCategories(updatedCats);
          localStorage.setItem('sonargaon_expense_categories_v1', JSON.stringify(updatedCats));
        }
      } catch (err) {
        console.error('Error saving new expense category:', err);
      }
    }

    onAddTransaction({
      date: tDate,
      type: tType,
      category: finalCategory,
      amount: parseFloat(tAmount),
      donorName: tType === 'income' ? tDonor : undefined,
      description: tType === 'expense' ? tDesc : (tDesc ? tDesc : undefined),
      receiptNo: tReceipt.trim() !== '' ? tReceipt.trim() : undefined,
      recordedBy: tRecordedBy,
      year: tYear,
      houseName: finalHouseName
    });

    // Reset fields except date and recordedBy for ease of fast multi-entries
    setTAmount('');
    setTDonor('');
    setTDesc('');
    setTReceipt('');
    setTCustomCategory('');
    setTHouseName('');
    setTCustomHouseName('');
    setTSuccessMsg('ভাউচার এন্ট্রি সফল হয়েছে!');
    setTimeout(() => setTSuccessMsg(''), 4000);
  };

  // Update default category selection when changing type
  React.useEffect(() => {
    if (tType === 'income') {
      setTCategory(defaultCategories.income[0] || 'চাঁদা ও অনুদান');
    } else {
      setTCategory(defaultCategories.expense[0]);
    }
  }, [tType]);

  // Handle Member submit (Auto-sorted by designation hierarchy)
  const handleMemberSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mName.trim() || !mDesignation.trim()) {
      alert('সদস্যের নাম এবং পদবী উভয়ই আবশ্যক।');
      return;
    }

    const autoType = mType || detectMemberType(mDesignation.trim());

    onAddMember({
      name: mName.trim(),
      designation: mDesignation.trim(),
      type: autoType,
      serialNo: 0, // Will be auto-calculated by designation hierarchy rank in App.tsx
    });

    setMName('');
    setMDesignation('');
    setMSuccessMsg('নতুন সদস্য পদবীর ধারাবাহিকতা অনুযায়ী স্বয়ংক্রিয়ভাবে কমিটিতে যুক্ত হয়েছেন!');
    setTimeout(() => setMSuccessMsg(''), 4000);
  };

  // Handle Mahfil Details Submit
  const handleMahfilSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!mahfilDate.trim() || !mahfilTime.trim() || !mahfilLocation.trim() || !mahfilTargetDate.trim()) {
      alert('সকল তথ্য পূরণ করা আবশ্যক।');
      return;
    }
    onUpdateMahfilDetails({
      ...mahfilDetails,
      year: mahfilDetails.year || 2026,
      date: mahfilDate.trim(),
      time: mahfilTime.trim(),
      location: mahfilLocation.trim(),
      targetDate: mahfilTargetDate.trim()
    });
    setMahfilSuccessMsg('মাহফিল ও জশনে জুলুসের তথ্য সফলভাবে আপডেট হয়েছে!');
    setTimeout(() => setMahfilSuccessMsg(''), 4000);
  };

  // Import Backup from JSON
  const handleImportBackup = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed && Array.isArray(parsed.transactions)) {
          // Trigger file confirmation
          if (confirm('আপনি কি ব্যাকআপ ডেটা লোড করতে চান? এটি আপনার বর্তমান ডেটার সাথে যুক্ত হবে।')) {
            parsed.transactions.forEach((t: any) => onAddTransaction(t));
            alert('ব্যাকআপ ডেটা সফলভাবে ইম্পোর্ট করা হয়েছে!');
          }
        } else {
          alert('ত্রুটি: ফাইলের ফরম্যাট সঠিক নয়।');
        }
      } catch (err) {
        alert('ত্রুটি: ফাইলটি পড়া সম্ভব হয়নি।');
      }
    };
    reader.readAsText(file);
  };

  // Export backup JSON
  const handleExportBackup = () => {
    const dataStr = JSON.stringify({ transactions, committeeMembers }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `Mahfil_Backup_${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Render Login Panel if not logged in
  if (!isAdminLoggedIn) {
    return (
      <div id="cpanel-login-section" className="max-w-md mx-auto py-12 px-4 sm:px-6 lg:px-8 animate-fade-in text-[#3c3c3c]">
        <div className="bg-white border-2 border-[#cbd5e1] hover:border-[#d97706] rounded-2xl p-6 sm:p-8 shadow-md space-y-6 relative transition duration-300">
          {/* Decorative Corner Filigree */}
          <div className="absolute top-0 left-0 w-6 h-6 border-t-2 border-l-2 border-[#cbd5e1] rounded-tl-xl"></div>
          <div className="absolute top-0 right-0 w-6 h-6 border-t-2 border-r-2 border-[#cbd5e1] rounded-tr-xl"></div>

          <div className="text-center space-y-2">
            <div className="h-12 w-12 bg-[#f1f5f9] border border-[#cbd5e1] rounded-full flex items-center justify-center mx-auto text-[#0f766e]">
              <Lock className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold text-[#064e3b] tracking-wide">সি-প্যানেল প্রবেশদ্বার (C-Panel)</h3>
            <p className="text-xs text-[#3c3c3c]/80 font-light">
              উদযাপন পরিষদের অর্থ সম্পাদক ও পরিচালকদের জন্য সংরক্ষিত প্রশাসনিক প্যানেল।
            </p>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#0f766e] uppercase tracking-wider mb-1.5">
                পাসওয়ার্ড প্রদান করুন (Password)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#d97706]">
                  <Key className="h-4 w-4" />
                </div>
                <input
                  id="admin-password-input"
                  type="password"
                  required
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="block w-full pl-9 pr-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-sm text-[#3c3c3c] placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] focus:ring-1 focus:ring-[#d97706] transition"
                />
              </div>
            </div>

            {loginError && (
              <div className="flex items-center space-x-2 text-xs text-red-700 bg-red-500/10 p-2.5 rounded-lg border border-red-500/20">
                <AlertCircle className="h-4 w-4 flex-shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <button
              id="admin-login-submit"
              type="submit"
              className="w-full py-3 px-4 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-xl text-sm transition-all duration-300 shadow-md cursor-pointer"
            >
              লগইন করুন
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Render Logged-In Administrative Controls
  return (
    <div id="cpanel-admin-section" className="space-y-8 pb-24 md:pb-16 animate-fade-in text-[#3c3c3c]">
      {/* Live Visitor Status Ribbon for Admin Awareness */}
      <div className="bg-gradient-to-r from-emerald-50 via-teal-50/60 to-white border border-emerald-300/80 rounded-2xl px-4 py-3 flex flex-wrap items-center justify-between gap-2.5 shadow-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="flex items-center gap-2 bg-white px-2.5 py-1 rounded-full border border-emerald-200 shadow-xs">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-600"></span>
            </span>
            <span className="text-xs font-bold text-emerald-800">
              লাইভ অনলাইনে: <span className="text-emerald-950 font-black">{toBanglaNum(activeVisitorCount)} জন</span>
            </span>
          </div>

          <div className="flex items-center gap-2 text-xs text-slate-700 font-medium">
            <span className="text-slate-300">|</span>
            <span>আজকের ভিজিট: <span className="font-bold text-amber-700">{toBanglaNum(visitorSummary?.dailyVisits?.[new Date().toISOString().slice(0,10)] ?? visitorSummary?.todayVisits ?? 0)} বার</span></span>
            <span className="text-slate-300 hidden sm:inline">|</span>
            <span className="hidden sm:inline">সর্বমোট ভিউ: <span className="font-bold text-[#0f766e]">{toBanglaNum(visitorSummary?.totalVisits ?? 0)} বার</span></span>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setShowDuplicateAuditModal(true)}
            className="px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300 shadow-2xs"
            title="একই ব্যক্তির নামে কোন ডুপ্লিকেট পোস্টিং রয়েছে কি না নিরীক্ষা ও সমাধান করুন"
          >
            <Copy className="h-3.5 w-3.5 text-amber-700" />
            <span>ডুপ্লিকেট পোস্টিং চেক</span>
            {duplicateExactCount > 0 ? (
              <span className="bg-red-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                {toBanglaNum(duplicateExactCount)}
              </span>
            ) : (
              <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                ০
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setCpanelTab('visitors')}
            className={`px-3 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              cpanelTab === 'visitors'
                ? 'bg-[#0f766e] text-white shadow-xs'
                : 'bg-emerald-100 hover:bg-emerald-200 text-emerald-900'
            }`}
          >
            <Activity className="h-3.5 w-3.5" />
            <span>{cpanelTab === 'visitors' ? 'অ্যানালিটিক্স দেখছেন' : 'সম্পূর্ণ অ্যানালিটিক্স দেখুন'}</span>
          </button>
        </div>
      </div>

      {/* Public Approval & Visibility Status Banners for Finance & Report Menus */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Card 1: Report Menu Public Approval */}
        <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          mahfilDetails?.isReportPublic 
            ? 'bg-gradient-to-r from-emerald-900 to-[#064e3b] text-white border-emerald-700' 
            : 'bg-gradient-to-r from-amber-950/90 to-slate-900 text-white border-amber-800/80'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              mahfilDetails?.isReportPublic 
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' 
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            }`}>
              {mahfilDetails?.isReportPublic ? <FileText className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">রিপোর্ট মেনু পাবলিক অনুমোদন</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  mahfilDetails?.isReportPublic ? 'bg-emerald-500 text-white shadow-xs' : 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                }`}>
                  {mahfilDetails?.isReportPublic ? '🟢 উন্মুক্ত ও সক্রিয়' : '🔒 অ্যাডমিন সংরক্ষিত'}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-light mt-0.5">
                {mahfilDetails?.isReportPublic 
                  ? 'সাধারণ দর্শকগণ রিপোর্ট মেনু থেকে লেজার শিট ও পিডিএফ ডাউনলোড করতে পারছেন।' 
                  : 'সাধারণ দর্শকদের জন্য রিপোর্ট মেনু লক রয়েছে। অনুমোদন দিলে উন্মুক্ত হবে।'}
              </p>
            </div>
          </div>

          <button
            id="toggle-public-report-cpanel-btn"
            type="button"
            onClick={() => {
              const nextStatus = !(mahfilDetails?.isReportPublic);
              onUpdateMahfilDetails({
                ...mahfilDetails,
                isReportPublic: nextStatus
              });
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all transform hover:scale-102 cursor-pointer flex items-center space-x-2 shrink-0 ${
              mahfilDetails?.isReportPublic 
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' 
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            }`}
          >
            {mahfilDetails?.isReportPublic ? (
              <>
                <Lock className="h-4 w-4" />
                <span>রিপোর্ট লক করুন</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>রিপোর্ট উন্মুক্ত করুন</span>
              </>
            )}
          </button>
        </div>

        {/* Card 2: Finance Menu Public Approval */}
        <div className={`rounded-2xl p-4 sm:p-5 border transition-all duration-300 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 ${
          mahfilDetails?.isFinancePublic 
            ? 'bg-gradient-to-r from-emerald-900 to-[#064e3b] text-white border-emerald-700' 
            : 'bg-gradient-to-r from-amber-950/90 to-slate-900 text-white border-amber-800/80'
        }`}>
          <div className="flex items-center space-x-3.5">
            <div className={`p-2.5 rounded-xl shrink-0 ${
              mahfilDetails?.isFinancePublic 
                ? 'bg-emerald-400/20 text-emerald-300 border border-emerald-400/30' 
                : 'bg-amber-400/20 text-amber-300 border border-amber-400/30'
            }`}>
              {mahfilDetails?.isFinancePublic ? <Globe className="h-6 w-6" /> : <Lock className="h-6 w-6" />}
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-emerald-200">আয়-ব্যয় হিসাব পাবলিক অনুমোদন</span>
                <span className={`text-[10px] font-black px-2 py-0.5 rounded-full ${
                  mahfilDetails?.isFinancePublic ? 'bg-emerald-500 text-white shadow-xs' : 'bg-amber-500 text-slate-950 font-extrabold shadow-xs'
                }`}>
                  {mahfilDetails?.isFinancePublic ? '🟢 উন্মুক্ত ও সক্রিয়' : '🔒 অ্যাডমিন সংরক্ষিত'}
                </span>
              </div>
              <p className="text-xs text-slate-200 font-light mt-0.5">
                {mahfilDetails?.isFinancePublic 
                  ? 'সাধারণ দর্শকগণ ওয়েবসাইট থেকে সরাসরি আয়-ব্যয় লেনদেন তালিকা দেখতে পারছেন।' 
                  : 'সাধারণ দর্শকরা হিসাব দেখতে পারছেন না। অনুমোদন দিলে দেখতে পাবে।'}
              </p>
            </div>
          </div>

          <button
            id="toggle-public-finance-cpanel-btn"
            type="button"
            onClick={() => {
              const nextStatus = !(mahfilDetails?.isFinancePublic);
              onUpdateMahfilDetails({
                ...mahfilDetails,
                isFinancePublic: nextStatus
              });
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-extrabold shadow-md transition-all transform hover:scale-102 cursor-pointer flex items-center space-x-2 shrink-0 ${
              mahfilDetails?.isFinancePublic 
                ? 'bg-amber-400 hover:bg-amber-300 text-slate-950' 
                : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950'
            }`}
          >
            {mahfilDetails?.isFinancePublic ? (
              <>
                <Lock className="h-4 w-4" />
                <span>হিসাব লক করুন</span>
              </>
            ) : (
              <>
                <CheckCircle className="h-4 w-4" />
                <span>হিসাব উন্মুক্ত করুন</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Sub-Tabs Navigation Row */}
      <div className={`bg-white border border-[#cbd5e1] rounded-2xl p-3 flex-col md:flex-row justify-between items-center shadow-sm ${
        cpanelTab === 'quick-post' ? 'hidden md:flex' : 'flex'
      }`}>
        {/* Sub-tabs within Cpanel (Desktop View - Side-by-side Flow) */}
        <div className="hidden md:flex flex-wrap gap-1 bg-[#f1f5f9] p-1 rounded-xl border border-[#cbd5e1] justify-start w-full">
          {cpanelTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = cpanelTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`subtab-${tab.id}`}
                onClick={() => setCpanelTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer flex items-center space-x-1.5 ${
                  isActive 
                    ? 'bg-[#0f766e] text-white font-bold shadow-sm' 
                    : 'text-[#3c3c3c] hover:text-[#064e3b] hover:bg-[#cbd5e1]/20'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${tab.id === 'quick-post' ? 'text-amber-500 fill-amber-500 animate-pulse' : ''}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Sub-tabs within Cpanel (Mobile/Tablet View - Grid Layout with No Horizontal Scrollbar) */}
        <div className="grid md:hidden grid-cols-5 gap-1 w-full bg-[#f1f5f9]/70 p-1 rounded-xl border border-[#cbd5e1]/60">
          {cpanelTabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = cpanelTab === tab.id;
            return (
              <button
                key={tab.id}
                id={`subtab-mobile-${tab.id}`}
                onClick={() => setCpanelTab(tab.id)}
                className={`py-1.5 px-0.5 rounded-lg text-[10px] font-black transition-all flex flex-col items-center justify-center gap-0.5 cursor-pointer min-h-[44px] ${
                  isActive 
                    ? 'bg-[#0f766e] text-white font-black shadow-sm' 
                    : 'text-[#3c3c3c] bg-white border border-[#cbd5e1]/30 hover:bg-[#cbd5e1]/15'
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? 'scale-110' : ''}`} />
                <span className="truncate max-w-full text-center leading-none text-[8.5px]">{tab.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sticky Bottom Nav Bar for Admin on Mobile - Highly responsive dock with tap highlight */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#f8fafc]/95 backdrop-blur-md border-t-2 border-[#cbd5e1]/80 shadow-[0_-8px_24px_rgba(0,0,0,0.08)] px-1 pt-1.5 pb-3 flex justify-around items-center w-full max-w-full overflow-x-auto no-scrollbar">
        {cpanelTabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = cpanelTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCpanelTab(tab.id)}
              className={`flex flex-col items-center justify-center flex-shrink-0 min-w-[52px] py-1 px-0.5 transition duration-150 min-h-[42px] ${
                isActive ? 'text-[#0f766e]' : 'text-[#8a817c]/80'
              }`}
            >
              <div className={`relative p-1 rounded-full transition-all duration-200 ${
                isActive ? 'bg-[#0f766e]/15 text-[#0f766e] scale-105' : 'text-[#8a817c]/80 hover:bg-gray-100/30'
              }`}>
                <Icon className="h-4 w-4" />
                {tab.id === 'quick-post' && (
                  <span className="absolute -top-1 -right-1 flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-500"></span>
                  </span>
                )}
              </div>
              <span className={`text-[8px] mt-0.5 tracking-tight select-none transition-all duration-200 leading-none ${
                isActive ? 'font-black text-[#064e3b] scale-105' : 'font-medium text-[#8a817c]'
              }`}>
                {tab.shortLabel}
              </span>
            </button>
          );
        })}
      </div>

      {/* Sub-Tab Content 0: Quick and Easy Transaction Posting Form */}
      {cpanelTab === 'quick-post' && (
        <div className="max-w-2xl mx-auto w-full animate-fade-in">
          {/* Add Transaction Form Panel */}
          <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm relative">

            <form onSubmit={handleTransactionSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-5">
                <h4 className="text-sm sm:text-base font-bold text-[#064e3b] flex items-center space-x-2">
                  <Coins className="h-5 w-5 text-[#0f766e]" />
                  <span>দ্রুত পোস্টিং</span>
                </h4>
                <button
                  type="submit"
                  className="p-1.5 bg-[#0f766e]/10 hover:bg-[#0f766e] text-[#0f766e] hover:text-white rounded-lg border border-[#0f766e]/30 hover:border-transparent transition cursor-pointer flex items-center space-x-1 shadow-sm"
                  title="ভাউচার এন্ট্রি সংরক্ষণ করুন"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">সংরক্ষণ</span>
                </button>
              </div>
              {/* Type Switcher */}
              <div>
                <label className="block text-[#0f766e] text-[10px] font-black uppercase tracking-wider mb-1.5">লেনদেনের ধরন (Transaction Type)</label>
                <div className="grid grid-cols-2 gap-2 bg-[#f1f5f9] p-1 rounded-xl border border-[#cbd5e1]">
                  <button
                    id="quick-type-select-income"
                    type="button"
                    onClick={() => setTType('income')}
                    className={`py-2.5 rounded-lg font-black text-center transition cursor-pointer flex items-center justify-center space-x-2 ${
                      tType === 'income' ? 'bg-[#0f766e] text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#064e3b]'
                    }`}
                  >
                    <TrendingUp className="h-4 w-4" />
                    <span>আয় (টাকা জমা)</span>
                  </button>
                  <button
                    id="quick-type-select-expense"
                    type="button"
                    onClick={() => setTType('expense')}
                    className={`py-2.5 rounded-lg font-black text-center transition cursor-pointer flex items-center justify-center space-x-2 ${
                      tType === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#064e3b]'
                    }`}
                  >
                    <TrendingDown className="h-4 w-4" />
                    <span>ব্যয় (টাকা খরচ)</span>
                  </button>
                </div>
              </div>

              {/* Amount Box */}
              <div>
                <label className="block text-[#0f766e] text-[10px] font-black uppercase mb-1">টাকার পরিমাণ (৳) *</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-lg font-bold text-[#0f766e]">৳</span>
                  <input
                    id="quick-amount-input"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="টাকার পরিমাণ লিখুন..."
                    value={tAmount}
                    onChange={(e) => setTAmount(cleanNumericInput(e.target.value))}
                    className="block w-full pl-8 pr-3 py-2.5 bg-[#f8fafc] border-2 border-[#cbd5e1] rounded-xl text-lg font-black text-gray-800 placeholder-[#8a817c] focus:outline-none focus:border-[#0f766e] transition"
                  />
                </div>
              </div>

              {/* Quick Category Badges Grid or Dropdown depending on Income/Expense */}
              <div>
                <label className="block text-[#0f766e] text-[10px] font-black uppercase mb-1.5">খাত নির্বাচন (Category) *</label>
                {tType === 'income' ? (
                  <div className="grid grid-cols-2 gap-2">
                    {Array.from(new Set(defaultCategories.income)).map((cat) => {
                      const isSelected = tCategory === cat;
                      return (
                        <button
                          key={cat}
                          type="button"
                          onClick={() => setTCategory(cat)}
                          className={`p-2.5 rounded-xl border text-left text-xs font-semibold transition cursor-pointer flex items-center justify-between ${
                            isSelected 
                              ? 'bg-[#0f766e]/10 border-[#0f766e] text-[#064e3b] font-bold ring-2 ring-[#0f766e]/20' 
                              : 'bg-white border-[#cbd5e1] hover:bg-[#f1f5f9]'
                          }`}
                        >
                          <span className="truncate">{cat}</span>
                          {isSelected && <Check className="h-3.5 w-3.5 text-[#0f766e] flex-shrink-0 ml-1" />}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div>
                    <select
                      id="quick-expense-category-select"
                      value={tCategory}
                      onChange={(e) => {
                        setTCategory(e.target.value);
                        if (e.target.value !== 'new_category' && e.target.value !== 'অন্যান্য') {
                          setTCustomCategory('');
                        }
                      }}
                      className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#3c3c3c] focus:outline-none focus:border-[#0f766e] transition cursor-pointer"
                    >
                      <option value="" disabled>ব্যয়ের খাত নির্বাচন করুন...</option>
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="new_category" className="font-bold text-[#0f766e]">
                        + নতুন ব্যয়ের খাত যুক্ত করুন (Add New)
                      </option>
                    </select>
                  </div>
                )}
              </div>

              {/* Custom Category Input if selected other or new_category */}
              {((tType === 'income' && tCategory === 'অন্যান্য') || 
                (tType === 'expense' && (tCategory === 'অন্যান্য' || tCategory === 'new_category'))) && (
                <div className="animate-scale-in">
                  <label className="block text-[#d97706] text-[10px] font-bold uppercase mb-1">নতুন ব্যয়ের খাতের নাম লিখুন</label>
                  <input
                    id="quick-custom-category-input"
                    type="text"
                    required
                    placeholder="উদা: গেট নির্মাণ"
                    value={tCustomCategory}
                    onChange={(e) => setTCustomCategory(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#3c3c3c] placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
              )}

              {/* Donor Name Input (Only for Income) */}
              {tType === 'income' && (
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-black uppercase mb-1">
                    দাতার নাম / উৎস (Contributor/Source) *
                  </label>
                  <input
                    id="quick-donor-input"
                    type="text"
                    required
                    placeholder="উদা: মো: আলমগীর (সিনিয়র সদস্য)"
                    value={tDonor}
                    onChange={(e) => setTDonor(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#3c3c3c] placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
              )}

              {/* House Name Selection (Only for Income) */}
              {tType === 'income' && (
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-black uppercase mb-1">
                    চাঁদা দাতার বাড়ির নাম (Donor's House Name)
                  </label>
                  <select
                    id="quick-house-select"
                    value={tHouseName}
                    onChange={(e) => setTHouseName(e.target.value)}
                    className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#3c3c3c] focus:outline-none focus:border-[#d97706] transition"
                  >
                    <option value="">বাড়ির নাম প্রযোজ্য নয় / সিলেক্ট করুন</option>
                    {availableHouses.map((house) => (
                      <option key={house} value={house}>
                        {house}
                      </option>
                    ))}
                    <option value="new_house" className="font-bold text-[#0f766e]">
                      + নতুন বাড়ির নাম লিখুন (Add New House)
                    </option>
                  </select>

                  {/* If "new_house" selected, show text field to type custom house name */}
                  {tHouseName === 'new_house' && (
                    <div className="mt-2 animate-scale-in">
                      <label className="block text-[#d97706] text-[10px] font-bold uppercase mb-1">
                        নতুন বাড়ির নাম লিখুন
                      </label>
                      <input
                        id="quick-custom-house-input"
                        type="text"
                        required
                        placeholder="উদা: মিস্ত্রি বাড়ী"
                        value={tCustomHouseName}
                        onChange={(e) => setTCustomHouseName(e.target.value)}
                        className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#3c3c3c] placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                      />
                    </div>
                  )}
                </div>
              )}

              {/* Expense Details Input (Only for Expense) */}
              {tType === 'expense' && (
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-black uppercase mb-1">
                    ব্যয়ের বিস্তারিত বিবরণ (Expense Details) *
                  </label>
                  <textarea
                    id="quick-desc-input"
                    required
                    rows={2}
                    placeholder="উদা: সাউন্ড সার্ভিসকে ডেকোরেশন পেমেন্ট দেওয়া হলো..."
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-xl text-xs text-[#3c3c3c] placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
              )}

              {/* Optional details toggle wrapper */}
              <div className="border border-[#e2e8f0] rounded-xl overflow-hidden bg-[#f8fafc]/50">
                <button
                  type="button"
                  onClick={() => setShowOptionalFields(!showOptionalFields)}
                  className="w-full px-4 py-2.5 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[11px] font-bold text-[#0f766e] flex justify-between items-center transition cursor-pointer"
                >
                  <span>অতিরিক্ত তথ্য (তারিখ, রশিদ নং ও অন্যান্য)</span>
                  {showOptionalFields ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                </button>
                
                {showOptionalFields && (
                  <div className="p-3.5 space-y-3 border-t border-[#e2e8f0] animate-fade-in text-xs">
                    {/* Date & Year Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[#0f766e] text-[9px] font-bold mb-1 uppercase">ভাউচার তারিখ (Date)</label>
                        <input
                          id="quick-date-input"
                          type="date"
                          required
                          value={tDate}
                          onChange={(e) => setTDate(e.target.value)}
                          className="block w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c]"
                        />
                      </div>
                      <div>
                        <label className="block text-[#0f766e] text-[9px] font-bold mb-1 uppercase">হিসাবের বছর</label>
                        <select
                          id="quick-year-input"
                          value={tYear}
                          onChange={(e) => setTYear(parseInt(e.target.value, 10))}
                          className="block w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c]"
                        >
                          <option value={2024}>২০২৪ খ্রি.</option>
                          <option value={2025}>২০২৫ খ্রি.</option>
                          <option value={2026}>২০২৬ খ্রি.</option>
                        </select>
                      </div>
                    </div>

                    {/* Receipt No */}
                    <div>
                      <label className="block text-[#0f766e] text-[9px] font-bold mb-1 uppercase">রশিদ নম্বর / ভাউচার রেফারেন্স (Receipt No)</label>
                      <input
                        id="quick-receipt-input"
                        type="text"
                        placeholder="উদা: ০১০৫ বা ই-০৫৫"
                        value={tReceipt}
                        onChange={(e) => setTReceipt(toEnglishDigits(e.target.value))}
                        className="block w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] placeholder-[#8a817c]"
                      />
                    </div>

                    {/* Entry Person Name */}
                    <div>
                      <label className="block text-[#0f766e] text-[9px] font-bold mb-1 uppercase">এন্ট্রি কারী কর্মকর্তা</label>
                      <input
                        id="quick-recorder-input"
                        type="text"
                        required
                        value={tRecordedBy}
                        onChange={(e) => setTRecordedBy(e.target.value)}
                        className="block w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c]"
                      />
                    </div>

                    {/* Optional description/notes for Income */}
                    {tType === 'income' && (
                      <div>
                        <label className="block text-[#0f766e] text-[9px] font-bold mb-1 uppercase">বিবরণ / মন্তব্য (ঐচ্ছিক)</label>
                        <input
                          id="quick-income-desc-input"
                          type="text"
                          placeholder="অতিরিক্ত কোনো মন্তব্য..."
                          value={tDesc}
                          onChange={(e) => setTDesc(e.target.value)}
                          className="block w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c]"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Success Notification Alert */}
              {tSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#0f766e] bg-[#0f766e]/10 p-2.5 rounded-lg border border-[#0f766e]/20 animate-scale-in">
                  <CheckCircle className="h-4 w-4" />
                  <span>{tSuccessMsg}</span>
                </div>
              )}

              <button
                id="quick-transaction-submit-btn"
                type="submit"
                className="w-full py-3 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-xl text-sm transition cursor-pointer shadow-md hover:shadow-lg flex items-center justify-center space-x-2"
              >
                <CheckCircle className="h-4 w-4" />
                <span>ভাউচার এন্ট্রি সংরক্ষণ করুন</span>
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Sub-Tab Content: Year-wise Manual Income/Expense Posting */}
      {cpanelTab === 'manual-ledger' && (
        <div className="w-full animate-fade-in">
          <ManualFinancialPostingSection
            transactions={transactions}
            onAddTransaction={onAddTransaction}
            onDeleteTransaction={onDeleteTransaction}
            onUpdateTransaction={(id, updated) => {
              const existing = transactions.find((t) => t.id === id);
              if (existing && onUpdateTransaction) {
                return onUpdateTransaction({ ...existing, ...updated } as Transaction);
              }
            }}
            isAdminLoggedIn={isAdminLoggedIn}
            onNavigate={(tab) => onNavigate ? onNavigate(tab) : setCpanelTab('quick-post')}
            isEmbedded={true}
          />
        </div>
      )}

      {/* Sub-Tab Content 1: Transaction Voucher Entry Form & Delete Ledger */}
      {cpanelTab === 'transactions' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Transaction Form Panel */}
          <div className="lg:col-span-5 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm relative">
            <form onSubmit={handleTransactionSubmit} className="space-y-4 text-xs sm:text-sm">
              <div className="flex items-center justify-between border-b border-[#e2e8f0] pb-3 mb-5">
                <h4 className="text-sm sm:text-base font-bold text-[#064e3b] flex items-center space-x-2">
                  <Plus className="h-5 w-5 text-[#0f766e]" />
                  <span>নতুন ভাউচার পোস্টিং</span>
                </h4>
                <button
                  type="submit"
                  className="p-1.5 bg-[#0f766e]/10 hover:bg-[#0f766e] text-[#0f766e] hover:text-white rounded-lg border border-[#0f766e]/30 hover:border-transparent transition cursor-pointer flex items-center space-x-1 shadow-sm"
                  title="ভাউচার এন্ট্রি সংরক্ষণ করুন"
                >
                  <Save className="h-3.5 w-3.5" />
                  <span className="text-[10px] font-bold">সংরক্ষণ</span>
                </button>
              </div>
              {/* Type Switcher */}
              <div>
                <label className="block text-[#0f766e] text-[10px] font-bold uppercase tracking-wider mb-1.5">লেনদেনের ধরন (Transaction Type)</label>
                <div className="grid grid-cols-2 gap-2 bg-[#f1f5f9] p-1 rounded-xl border border-[#cbd5e1]">
                  <button
                    id="type-select-income"
                    type="button"
                    onClick={() => setTType('income')}
                    className={`py-2 rounded-lg font-bold text-center transition cursor-pointer ${
                      tType === 'income' ? 'bg-[#0f766e] text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#064e3b]'
                    }`}
                  >
                    আয় (Income)
                  </button>
                  <button
                    id="type-select-expense"
                    type="button"
                    onClick={() => setTType('expense')}
                    className={`py-2 rounded-lg font-bold text-center transition cursor-pointer ${
                      tType === 'expense' ? 'bg-red-600 text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#064e3b]'
                    }`}
                  >
                    ব্যয় (Expense)
                  </button>
                </div>
              </div>

              {/* Amount, Date & Year Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">টাকার পরিমাণ (টাকা) *</label>
                  <input
                    id="amount-input"
                    type="text"
                    inputMode="numeric"
                    required
                    placeholder="উদা: ৫০০০"
                    value={tAmount}
                    onChange={(e) => setTAmount(cleanNumericInput(e.target.value))}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">ভাউচার তারিখ (Date)</label>
                  <input
                    id="date-input"
                    type="date"
                    required
                    value={tDate}
                    onChange={(e) => setTDate(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition cursor-pointer"
                  />
                </div>
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">হিসাবের বছর (Financial Year)</label>
                  <select
                    id="year-input"
                    value={tYear}
                    onChange={(e) => setTYear(parseInt(e.target.value, 10))}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition cursor-pointer"
                  >
                    <option value={2024}>২০২৪ খ্রি.</option>
                    <option value={2025}>২০২৫ খ্রি.</option>
                    <option value={2026}>২০২৬ খ্রি.</option>
                  </select>
                </div>
              </div>

              {/* Receipt No */}
              <div>
                <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">রশিদ নম্বর / ভাউচার রেফারেন্স (Receipt No)</label>
                <input
                  id="receipt-input"
                  type="text"
                  placeholder="উদা: ০১০৫ বা ই-০৫৫"
                  value={tReceipt}
                  onChange={(e) => setTReceipt(toEnglishDigits(e.target.value))}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                />
              </div>

              {/* Category dropdown */}
              <div>
                <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">খাত নির্বাচন (Category)</label>
                <select
                  id="category-select"
                  value={tCategory}
                  onChange={(e) => {
                    setTCategory(e.target.value);
                    if (e.target.value !== 'new_category' && e.target.value !== 'অন্যান্য') {
                      setTCustomCategory('');
                    }
                  }}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition cursor-pointer"
                >
                  {tType === 'income' ? (
                    defaultCategories.income.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))
                  ) : (
                    <>
                      {expenseCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      <option value="new_category" className="font-bold text-[#0f766e]">
                        + নতুন ব্যয়ের খাত যুক্ত করুন (Add New)
                      </option>
                    </>
                  )}
                </select>
              </div>

              {/* Custom Category Input if selected other or new_category */}
              {((tType === 'income' && tCategory === 'অন্যান্য') || 
                (tType === 'expense' && (tCategory === 'অন্যান্য' || tCategory === 'new_category'))) && (
                <div className="animate-scale-in">
                  <label className="block text-[#d97706] text-[10px] font-bold uppercase mb-1">নতুন ব্যয়ের খাতের নাম লিখুন</label>
                  <input
                    id="custom-category-input"
                    type="text"
                    required
                    placeholder="উদা: গেট নির্মাণ"
                    value={tCustomCategory}
                    onChange={(e) => setTCustomCategory(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
              )}

              {/* Contributor Name (For Income) */}
              {tType === 'income' ? (
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">দাতার নাম / উৎস (Contributor/Source) *</label>
                  <input
                    id="donor-input"
                    type="text"
                    required
                    placeholder="উদা: মো: আলমগীর (সিনিয়র সদস্য)"
                    value={tDonor}
                    onChange={(e) => setTDonor(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
              ) : (
                /* Expense Details */
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">ব্যয়ের বিস্তারিত বিবরণ (Expense Details) *</label>
                  <textarea
                    id="desc-input"
                    required
                    rows={2}
                    placeholder="উদা: সাউন্ড সার্ভিসকে ডেকোরেশন পেমেন্ট দেওয়া হলো..."
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
              )}

              {/* Description/Notes for Income (Optional) */}
              {tType === 'income' && (
                <div>
                  <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">বিবরণ / মন্তব্য (ঐচ্ছিক)</label>
                  <textarea
                    id="income-desc-input"
                    rows={1}
                    placeholder="অতিরিক্ত কোনো মন্তব্য..."
                    value={tDesc}
                    onChange={(e) => setTDesc(e.target.value)}
                    className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                  />
                </div>
              )}

              {/* Entry Person Name */}
              <div>
                <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">এন্ট্রি কারী কর্মকর্তা (Recorded By)</label>
                <input
                  id="recorder-input"
                  type="text"
                  required
                  placeholder="উদা: মো: তারেক জামাল"
                  value={tRecordedBy}
                  onChange={(e) => setTRecordedBy(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                />
              </div>

              {/* Success Notification Alert */}
              {tSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#0f766e] bg-[#0f766e]/10 p-2.5 rounded-lg border border-[#0f766e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{tSuccessMsg}</span>
                </div>
              )}

              <button
                id="transaction-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                ভাউচার এন্ট্রি সংরক্ষণ করুন
              </button>
            </form>
          </div>

          {/* List/Delete Transaction Panel */}
          <div className="lg:col-span-7 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm relative overflow-hidden">
            <h4 className="text-base font-bold text-[#064e3b] mb-5 flex flex-wrap items-center justify-between gap-2 border-b border-[#e2e8f0] pb-3">
              <div className="flex items-center gap-2">
                <span>লেনদেন সংশোধন ও অপসারণ তালিকা</span>
                <span className="text-[10px] font-semibold text-[#0f766e]">({toBanglaNum(transactions.length)} টি)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowDuplicateAuditModal(true)}
                className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 rounded-lg text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs"
                title="ডুপ্লিকেট পোস্টিং নিরীক্ষা করুন"
              >
                <Copy className="h-3.5 w-3.5 text-amber-700" />
                <span>ডুপ্লিকেট অডিট</span>
                {duplicateExactCount > 0 && (
                  <span className="bg-red-600 text-white text-[9px] px-1.5 py-0.2 rounded-full font-black animate-pulse">
                    {toBanglaNum(duplicateExactCount)}
                  </span>
                )}
              </button>
            </h4>

            {cpanelTransferSuccess && (
              <div className="mb-4 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-[#064e3b] flex items-center space-x-2">
                <CheckCircle className="h-4 w-4 text-[#0f766e] shrink-0" />
                <span>{cpanelTransferSuccess}</span>
              </div>
            )}

            <div className="overflow-y-auto max-h-[500px] divide-y divide-[#e2e8f0]">
              {transactions.length > 0 ? (
                transactions.map((t) => (
                  <div
                    id={`admin-transaction-item-${t.id}`}
                    key={t.id}
                    className="py-3 flex justify-between items-center space-x-4 hover:bg-[#f1f5f9]/40 px-2 rounded-lg transition"
                  >
                    <div className="min-w-0">
                      <div className="flex items-center space-x-2 flex-wrap gap-y-1">
                        <span className={`h-2 w-2 rounded-full ${t.type === 'income' ? 'bg-[#0f766e]' : 'bg-red-600'}`}></span>
                        {t.category && t.category !== 'সাধারণ রশিদ কালেকশন' && (
                          <span className="text-xs font-bold text-[#064e3b]">{t.category}</span>
                        )}
                        {t.houseName ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCpanelTransferTx(t);
                              setCpanelTargetHouse(t.houseName || availableHouses[0] || '');
                            }}
                            className="text-[10px] bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 text-[#0f766e] px-1.5 py-0.5 rounded font-bold flex items-center space-x-1 cursor-pointer transition"
                            title="বাড়ি পরিবর্তন করতে ক্লিক করুন"
                          >
                            <span>🏠 {t.houseName}</span>
                            <ArrowRightLeft className="h-2.5 w-2.5 text-[#0f766e]" />
                          </button>
                        ) : t.type === 'income' ? (
                          <button
                            type="button"
                            onClick={() => {
                              setCpanelTransferTx(t);
                              setCpanelTargetHouse(availableHouses[0] || '');
                            }}
                            className="text-[10px] bg-amber-50 hover:bg-amber-100 border border-amber-200 text-amber-800 px-1.5 py-0.5 rounded font-bold flex items-center space-x-1 cursor-pointer transition"
                            title="বাড়ি নির্ধারণ করুন"
                          >
                            <span>🏠 বাড়ি নির্ধারণ</span>
                            <Plus className="h-2.5 w-2.5" />
                          </button>
                        ) : null}
                        {t.receiptNo && (
                          <span className="text-[10px] font-mono bg-[#f1f5f9] border border-[#cbd5e1] text-[#0f766e] px-1.5 py-0.5 rounded">
                            রশিদ: {toBanglaNum(t.receiptNo)}
                          </span>
                        )}
                        {isAutoUploadedTransaction(t) && (
                          <span className="text-[9px] bg-purple-100 text-purple-800 border border-purple-200 px-1.5 py-0.5 rounded font-black">
                            ⚡ অটো
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-[#3c3c3c] mt-1 truncate font-light">
                        {t.type === 'income' ? t.donorName : t.description}
                      </p>
                      <span className="text-[10px] text-[#0f766e] block mt-0.5">{toBanglaNum(t.date)} | এন্ট্রি: {t.recordedBy}</span>
                    </div>

                    <div className="flex items-center space-x-2">
                      <span className={`text-xs font-bold font-mono ${t.type === 'income' ? 'text-[#0f766e]' : 'text-red-700'}`}>
                        ৳{toBanglaNum(t.amount)}
                      </span>
                      {t.type === 'income' && (
                        <button
                          type="button"
                          onClick={() => {
                            setCpanelTransferTx(t);
                            setCpanelTargetHouse(t.houseName || availableHouses[0] || '');
                          }}
                          className="p-1.5 bg-amber-500/10 hover:bg-amber-600 text-amber-800 hover:text-white rounded border border-amber-500/20 hover:border-amber-600 transition cursor-pointer"
                          title="চাঁদাদাতার বাড়ি পরিবর্তন করুন"
                        >
                          <ArrowRightLeft className="h-4 w-4" />
                        </button>
                      )}
                      {/* Edit Button */}
                      <button
                        type="button"
                        onClick={() => setCpanelEditingTx(t)}
                        className="p-1.5 bg-emerald-500/10 hover:bg-[#0f766e] text-emerald-800 hover:text-white rounded border border-emerald-500/20 hover:border-[#0f766e] transition cursor-pointer"
                        title="সম্পাদনা / এডিট করুন"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        id={`delete-trans-btn-${t.id}`}
                        onClick={() => {
                          if (confirm(`আপনি কি এই ${t.type === 'income' ? 'আয়' : 'ব্যয়'} হিসাবটি স্থায়ীভাবে মুছে ফেলতে চান?`)) {
                            onDeleteTransaction(t.id);
                          }
                        }}
                        className="p-1.5 bg-red-500/10 hover:bg-red-600 text-red-700 hover:text-white rounded border border-red-500/20 hover:border-red-600 transition cursor-pointer"
                        title="মুছে ফেলুন"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12 text-[#8a817c] text-xs">কোনো ভাউচার হিসাব পাওয়া যায়নি।</div>
              )}
            </div>
          </div>

          {/* Edit Transaction Modal */}
          {cpanelEditingTx && (
            <EditTransactionModal
              transaction={cpanelEditingTx}
              isOpen={Boolean(cpanelEditingTx)}
              onClose={() => setCpanelEditingTx(null)}
              onSave={async (updated) => {
                if (onUpdateTransaction) {
                  await onUpdateTransaction(updated);
                }
              }}
              onDelete={async (id) => {
                if (onDeleteTransaction) {
                  await onDeleteTransaction(id);
                }
              }}
              availableHouses={availableHouses}
            />
          )}

          {/* Quick House Transfer Modal for CPanel */}

          {cpanelTransferTx && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
              <div 
                className="bg-white w-full max-w-md rounded-2xl shadow-2xl border border-emerald-100 p-5 space-y-4 animate-in fade-in zoom-in-95 duration-150"
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between pb-3 border-b border-gray-100">
                  <h4 className="text-sm font-black text-[#064e3b] flex items-center space-x-2">
                    <ArrowRightLeft className="h-4 w-4 text-[#0f766e]" />
                    <span>চাঁদাদাতার বাড়ি পরিবর্তন</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => setCpanelTransferTx(null)}
                    className="text-gray-400 hover:text-gray-600 font-bold p-1 rounded-lg"
                  >
                    ✕
                  </button>
                </div>

                <div className="p-3.5 bg-emerald-50/70 border border-emerald-200 rounded-xl text-xs space-y-1.5">
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">চাঁদাদাতা:</span>
                    <span className="text-[#064e3b] font-black">{cpanelTransferTx.donorName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">বর্তমান বাড়ি:</span>
                    <span className="text-red-700 font-black">🏠 {cpanelTransferTx.houseName || 'নির্ধারিত নেই'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 font-bold">টাকার পরিমাণ:</span>
                    <span className="text-[#0f766e] font-black">৳ {toBanglaNum(cpanelTransferTx.amount)}</span>
                  </div>
                  {cpanelTransferTx.receiptNo && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 font-bold">রসিদ নম্বর:</span>
                      <span className="text-gray-800 font-mono">#{toBanglaNum(cpanelTransferTx.receiptNo)}</span>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1.5">নতুন বাড়ি নির্বাচন করুন:</label>
                  <select
                    value={cpanelTargetHouse}
                    onChange={(e) => setCpanelTargetHouse(e.target.value)}
                    className="w-full px-3 py-2 bg-white border-2 border-emerald-300 focus:border-[#0f766e] rounded-xl text-xs font-black text-[#064e3b] focus:outline-none focus:ring-1 focus:ring-[#0f766e]"
                  >
                    {availableHouses.map((h, i) => (
                      <option key={h} value={h}>
                        {toBanglaNum(i + 1)}. {h} {h === cpanelTransferTx.houseName ? '(বর্তমান বাড়ি)' : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {cpanelTargetHouse && cpanelTargetHouse !== cpanelTransferTx.houseName && (
                  <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900 font-bold">
                    🔄 এই চাঁদাদাতাকে <strong>"{cpanelTargetHouse}"</strong>-তে স্থানান্তর করা হবে।
                  </div>
                )}

                <div className="flex justify-end space-x-2 pt-2 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => setCpanelTransferTx(null)}
                    className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl cursor-pointer"
                  >
                    বাতিল
                  </button>
                  <button
                    type="button"
                    onClick={async () => {
                      if (!cpanelTargetHouse || cpanelTargetHouse === cpanelTransferTx.houseName) {
                        setCpanelTransferTx(null);
                        return;
                      }
                      if (onUpdateTransaction) {
                        await onUpdateTransaction({
                          ...cpanelTransferTx,
                          houseName: cpanelTargetHouse
                        });
                      }
                      setCpanelTransferSuccess(`"${cpanelTransferTx.donorName}" সফলভাবে "${cpanelTargetHouse}" বাড়িতে স্থানান্তরিত হয়েছে!`);
                      setTimeout(() => setCpanelTransferSuccess(''), 4000);
                      setCpanelTransferTx(null);
                    }}
                    className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white text-xs font-black rounded-xl shadow-sm cursor-pointer"
                  >
                    স্থানান্তর সম্পন্ন করুন
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Sub-Tab Content 2: Add / Manage Committee Members */}
      {cpanelTab === 'committee' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Member Insertion Form */}
          <div className="lg:col-span-5 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#064e3b] mb-5 flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <span className="flex items-center space-x-2">
                <Plus className="h-5 w-5 text-[#0f766e]" />
                <span>নতুন সদস্য যুক্তকরণ ফর্ম</span>
              </span>
              <span className="text-[10px] text-[#0f766e] bg-[#0f766e]/10 px-2 py-0.5 rounded font-bold">
                Auto Set ক্রমানুসার
              </span>
            </h4>

            {/* Datalist for preset designations */}
            <datalist id="cpanel-preset-designations">
              {PRESET_DESIGNATIONS.map((preset) => (
                <option key={preset.title} value={preset.title}>
                  {preset.title} ({preset.groupLabel})
                </option>
              ))}
            </datalist>

            <form onSubmit={handleMemberSubmit} className="space-y-4 text-xs sm:text-sm">
              <div>
                <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">সদস্যের পুরো নাম *</label>
                <input
                  id="member-name-input"
                  type="text"
                  required
                  placeholder="উদা: আলহাজ্ব মো: তারেক রহমান"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                />
              </div>

              <div>
                <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">পদবী (Designation) *</label>
                <input
                  id="member-designation-input"
                  type="text"
                  required
                  list="cpanel-preset-designations"
                  placeholder="উদা: সহ-সভাপতি / অর্থ সম্পাদক"
                  value={mDesignation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMDesignation(val);
                    const suggestedType = detectMemberType(val);
                    if (suggestedType) {
                      setMType(suggestedType);
                    }
                  }}
                  className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs placeholder-[#8a817c] focus:outline-none focus:border-[#d97706] transition"
                />
                <p className="text-[10px] text-[#0f766e] mt-1 font-medium flex items-center space-x-1">
                  <Sparkles className="h-3 w-3 text-[#d97706]" />
                  <span>পদবীর ক্রমানুসারে স্বয়ংক্রিয়ভাবে তালিকায় সঠিক পজিশনে সেট হবে।</span>
                </p>
              </div>

              <div>
                <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1.5">সদস্যের বিভাগ (Category Group)</label>
                <select
                  id="member-type-select"
                  value={mType}
                  onChange={(e) => setMType(e.target.value as any)}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition cursor-pointer"
                >
                  <option value="leader">পরিষদ নির্বাহী কর্মকর্তা (Leader)</option>
                  <option value="member">সদস্যবৃন্দ (Member)</option>
                  <option value="advisor">সম্মানিত উপদেষ্টা (Advisor)</option>
                </select>
              </div>

              {mSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#0f766e] bg-[#0f766e]/10 p-2.5 rounded-lg border border-[#0f766e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{mSuccessMsg}</span>
                </div>
              )}

              <button
                id="member-submit-btn"
                type="submit"
                className="w-full py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                কমিটিতে যুক্ত করুন
              </button>
            </form>
          </div>

          {/* Committee list with immediate delete trigger */}
          <div className="lg:col-span-7 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#064e3b] mb-5 flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <span>বর্তমান কমিটি সদস্য তালিকা ও ব্যবস্থাপনা</span>
              <span className="text-[10px] text-[#0f766e]">মোট সদস্য: {toBanglaNum(committeeMembers.length)} জন</span>
            </h4>

            <div className="overflow-y-auto max-h-[500px] divide-y divide-[#e2e8f0] space-y-2">
              {sortCommitteeMembers(committeeMembers).map((member) => (
                <div
                  id={`admin-member-item-${member.id}`}
                  key={member.id}
                  className="py-3 px-2 rounded-lg transition"
                >
                  {editingMemberId === member.id ? (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault();
                        const autoType = editType || detectMemberType(editDesignation.trim());
                        onUpdateMember({
                          id: member.id,
                          name: editName.trim(),
                          designation: editDesignation.trim(),
                          type: autoType,
                          serialNo: parseInt(editSerialNo, 10) || member.serialNo,
                        });
                        setEditingMemberId(null);
                      }}
                      className="space-y-3 bg-[#f1f5f9] p-3 rounded-xl border border-[#d97706]/30"
                    >
                      <h5 className="text-xs font-bold text-[#064e3b]">সদস্যের তথ্য সংশোধন</h5>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                        <div>
                          <label className="block text-[#0f766e] text-[9px] font-bold mb-1">নাম</label>
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="block w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#0f766e] text-[9px] font-bold mb-1">পদবী</label>
                          <input
                            type="text"
                            required
                            list="cpanel-preset-designations"
                            value={editDesignation}
                            onChange={(e) => {
                              const val = e.target.value;
                              setEditDesignation(val);
                              const suggested = detectMemberType(val);
                              if (suggested) {
                                setEditType(suggested);
                              }
                            }}
                            className="block w-full px-2.5 py-1.5 bg-white border border-[#cbd5e1] rounded"
                          />
                        </div>
                        <div>
                          <label className="block text-[#0f766e] text-[9px] font-bold mb-1">বিভাগ</label>
                          <select
                            value={editType}
                            onChange={(e) => setEditType(e.target.value as any)}
                            className="block w-full px-2 py-1.5 bg-white border border-[#cbd5e1] rounded"
                          >
                            <option value="leader">পরিষদ নির্বাহী কর্মকর্তা (Leader)</option>
                            <option value="member">সদস্যবৃন্দ (Member)</option>
                            <option value="advisor">উপদেষ্টা (Advisor)</option>
                          </select>
                        </div>
                        <div>
                          <label className="block text-[#0f766e] text-[9px] font-bold mb-1">পদবী মর্যাদা ক্রম</label>
                          <div className="px-2.5 py-1.5 bg-gray-100 border border-gray-300 rounded text-gray-700 text-xs font-semibold">
                            ক্রমিক: {toBanglaNum(member.serialNo)} (Auto Set)
                          </div>
                        </div>
                      </div>
                      <div className="flex justify-end space-x-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingMemberId(null)}
                          className="px-3 py-1.5 bg-white border border-[#cbd5e1] text-[#3c3c3c] rounded hover:bg-gray-100 transition"
                        >
                          বাতিল
                        </button>
                        <button
                          type="submit"
                          className="px-3 py-1.5 bg-[#0f766e] text-white rounded font-bold hover:bg-[#0d9488] transition"
                        >
                          সংরক্ষণ করুন
                        </button>
                      </div>
                    </form>
                  ) : (
                    <div className="flex justify-between items-center space-x-4">
                      <div>
                        <h5 className="text-xs font-bold text-[#064e3b]">{member.name}</h5>
                        <p className="text-[10px] text-[#d97706] font-bold mt-0.5">{member.designation}</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="text-[9px] text-[#0f766e] bg-[#0f766e]/10 border border-[#cbd5e1]/40 px-1.5 py-0.5 rounded inline-block">
                            {member.type === 'leader' ? 'নেতৃবৃন্দ' : (member.type === 'advisor' ? 'উপদেষ্টা' : 'সদস্য')}
                          </span>
                          <span className="text-[9px] text-[#3c3c3c]/60 bg-[#f1f5f9] px-1.5 py-0.5 rounded inline-block">
                            ক্রমিক: {toBanglaNum(member.serialNo)}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          id={`edit-member-btn-${member.id}`}
                          onClick={() => {
                            setEditingMemberId(member.id);
                            setEditName(member.name);
                            setEditDesignation(member.designation);
                            setEditType(member.type);
                            setEditSerialNo(member.serialNo.toString());
                          }}
                          className="p-1.5 bg-[#0f766e]/10 hover:bg-[#0f766e] text-[#0f766e] hover:text-white rounded border border-[#0f766e]/20 transition cursor-pointer"
                          title="সম্পাদনা করুন"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          id={`delete-member-btn-${member.id}`}
                          onClick={() => {
                            if (confirm(`আপনি কি "${member.name}" কে কমিটি থেকে স্থায়ীভাবে অপসারণ করতে চান?`)) {
                              onDeleteMember(member.id);
                            }
                          }}
                          className="p-1.5 bg-red-500/10 hover:bg-red-600 text-red-700 hover:text-white rounded border border-red-500/20 hover:border-red-600 transition cursor-pointer"
                          title="অপসারণ"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Sub-Tab Content: Edit Mahfil Details */}
      {cpanelTab === 'mahfil' && (
        <div className="max-w-2xl mx-auto bg-white border border-[#cbd5e1] rounded-2xl p-6 sm:p-8 shadow-sm">
          <h4 className="text-base font-bold text-[#064e3b] mb-5 flex items-center space-x-2 border-b border-[#e2e8f0] pb-3">
            <Calendar className="h-5 w-5 text-[#0f766e]" />
            <span>আসন্ন পবিত্র মাহফিল ও জুলুস বিবরণী সংশোধন</span>
          </h4>

          <form onSubmit={handleMahfilSubmit} className="space-y-4 text-xs sm:text-sm">
            <div>
              <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">নির্ধারিত তারিখ *</label>
              <input
                type="text"
                required
                placeholder="উদা: ১২ই রবিউল আউয়াল ১৪৪৮ হিজরী (সম্ভাব্য ২০২৬ খ্রি.)"
                value={mahfilDate}
                onChange={(e) => setMahfilDate(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition"
              />
            </div>

            <div>
              <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">সময়সূচী *</label>
              <textarea
                required
                rows={2}
                placeholder="উদা: সকাল ৮:০০ ঘটিকা হতে বর্ণাঢ্য জশনে জুলুস এবং যোহরের নামাজের পর হতে মূল আজিমুশশান মাহফিল।"
                value={mahfilTime}
                onChange={(e) => setMahfilTime(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition"
              />
            </div>

            <div>
              <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">মাহফিল ময়দান *</label>
              <input
                type="text"
                required
                placeholder="উদা: সোনারগাঁও, তুপ্পারপাড়, রাঙ্গুনিয়া, চট্টগ্রাম।"
                value={mahfilLocation}
                onChange={(e) => setMahfilLocation(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition"
              />
            </div>

            <div>
              <label className="block text-[#0f766e] text-[10px] font-bold uppercase mb-1">কাউন্টডাউন শেষ সময় (Target Date for Countdown) *</label>
              <input
                type="date"
                required
                value={mahfilTargetDate}
                onChange={(e) => setMahfilTargetDate(e.target.value)}
                className="block w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] text-xs focus:outline-none focus:border-[#d97706] transition cursor-pointer"
              />
              <span className="text-[10px] text-[#8a817c] mt-1 block font-light">এই তারিখটি দিয়ে প্রথম পাতার কাউন্টডাউন টাইমারটি স্বয়ংক্রিয়ভাবে হিসাব করা হবে।</span>
            </div>

            {mahfilSuccessMsg && (
              <div className="flex items-center space-x-2 text-xs text-[#0f766e] bg-[#0f766e]/10 p-2.5 rounded-lg border border-[#0f766e]/20">
                <CheckCircle className="h-4 w-4 text-[#0f766e]" />
                <span>{mahfilSuccessMsg}</span>
              </div>
            )}

            <button
              type="submit"
              className="w-full py-3 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
            >
              মাহফিল তথ্য ও তারিখ সংরক্ষণ করুন
            </button>
          </form>
        </div>
      )}

      {/* Sub-Tab Content 4: Manage Invited Scholars for 2026 */}
      {cpanelTab === 'scholars' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Scholar Form Panel */}
          <div className="lg:col-span-4 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#064e3b] mb-5 flex items-center space-x-2 border-b border-[#e2e8f0] pb-3">
              <Plus className="h-5 w-5 text-[#0f766e]" />
              <span>নতুন বক্তা ও মেহমান যুক্ত করুন</span>
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!sName.trim() || !sTitle.trim()) {
                  alert('নাম এবং পরিচয় আবশ্যক!');
                  return;
                }
                onAddScholar({
                  name: sName.trim(),
                  title: sTitle.trim(),
                  topic: sTopic.trim() || undefined,
                  serialNo: Number(sSerialNo) || (scholars.length + 1),
                });
                setSName('');
                setSTitle('');
                setSTopic('');
                setSSerialNo('');
                setSSuccessMsg('বক্তা সফলভাবে তালিকায় যুক্ত হয়েছেন!');
                setTimeout(() => setSSuccessMsg(''), 3000);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#0f766e] uppercase mb-1.5">হুজুরের নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আল্লামা মুফতি ওবাইদুল্লাহ আশরাফী"
                  value={sName}
                  onChange={(e) => setSName(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#d97706] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f766e] uppercase mb-1.5">উপাধি / পদবি / ঠিকানা *</label>
                <textarea
                  required
                  rows={2}
                  placeholder="যেমন: প্রধান বক্তা, বিশিষ্ট ইসলামী চিন্তাবিদ ও খতিব..."
                  value={sTitle}
                  onChange={(e) => setSTitle(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#d97706] transition resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f766e] uppercase mb-1.5">আলোচনার বিষয় (ঐচ্ছিক)</label>
                <input
                  type="text"
                  placeholder="যেমন: তাজিম এ মোস্তফা ও জশনে জুলুস উদযাপন"
                  value={sTopic}
                  onChange={(e) => setSTopic(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#d97706] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f766e] uppercase mb-1.5">সিরিয়াল নম্বর (প্রদর্শন ক্রম)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  placeholder={`যেমন: ${toBanglaNum(scholars.length + 1)}`}
                  value={sSerialNo}
                  onChange={(e) => setSSerialNo(cleanNumericInput(e.target.value))}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#d97706] transition"
                />
              </div>

              {sSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#0f766e] bg-[#0f766e]/10 p-2.5 rounded-lg border border-[#0f766e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{sSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                বক্তা তালিকায় যুক্ত করুন
              </button>
            </form>
          </div>

          {/* Scholars List Panel */}
          <div className="lg:col-span-8 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm overflow-hidden">
            <h4 className="text-base font-bold text-[#064e3b] mb-5 flex items-center justify-between border-b border-[#e2e8f0] pb-3">
              <span className="flex items-center space-x-2">
                <Mic className="h-5 w-5 text-[#0f766e]" />
                <span>২০২৬ সালের দাওয়াতকৃত বক্তাগণের তালিকা</span>
              </span>
              <span className="text-xs bg-[#f1f5f9] border border-[#cbd5e1] px-2.5 py-1 rounded-full text-[#0f766e] font-semibold">
                সর্বমোট: {toBanglaNum(scholars.length)} জন
              </span>
            </h4>

            {scholars.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8a817c]">কোনো আমন্ত্রিত হুজুর যুক্ত করা হয়নি।</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-[#e2e8f0] text-xs font-bold text-[#0f766e] bg-[#f8fafc]">
                      <th className="py-3 px-2 text-center w-12">ক্রম</th>
                      <th className="py-3 px-3">নাম ও পরিচয়</th>
                      <th className="py-3 px-3">আলোচনার বিষয়</th>
                      <th className="py-3 px-3 text-center w-28">অ্যাকশন</th>
                    </tr>
                  </thead>
                  <tbody>
                    {scholars.map((sch) => {
                      const isEditing = editingScholarId === sch.id;
                      return (
                        <tr key={sch.id} className="border-b border-[#e2e8f0]/70 text-xs hover:bg-[#f8fafc]/60 transition">
                          <td className="py-3 px-2 text-center font-mono">
                            {isEditing ? (
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editSSerialNo}
                                onChange={(e) => setEditSSerialNo(cleanNumericInput(e.target.value))}
                                className="w-10 p-1 border border-[#cbd5e1] rounded text-center"
                              />
                            ) : (
                              toBanglaNum(sch.serialNo)
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <div className="space-y-1">
                                <input
                                  type="text"
                                  value={editSName}
                                  onChange={(e) => setEditSName(e.target.value)}
                                  className="w-full p-1 border border-[#cbd5e1] rounded font-bold text-xs"
                                  placeholder="হুজুরের নাম"
                                />
                                <textarea
                                  value={editSTitle}
                                  onChange={(e) => setEditSTitle(e.target.value)}
                                  className="w-full p-1 border border-[#cbd5e1] rounded text-[11px] resize-none"
                                  rows={2}
                                  placeholder="পরিচিতি"
                                />
                              </div>
                            ) : (
                              <div>
                                <div className="font-bold text-[#064e3b]">{sch.name}</div>
                                <div className="text-[11px] text-[#0f766e] mt-0.5">{sch.title}</div>
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            {isEditing ? (
                              <input
                                type="text"
                                value={editSTopic}
                                onChange={(e) => setEditSTopic(e.target.value)}
                                className="w-full p-1 border border-[#cbd5e1] rounded text-xs"
                                placeholder="আলোচনার বিষয়"
                              />
                            ) : (
                              <span className="italic text-[#3c3c3c]">{sch.topic || 'নির্ধারিত হয়নি'}</span>
                            )}
                          </td>
                          <td className="py-3 px-3 text-center">
                            {isEditing ? (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    if (!editSName.trim() || !editSTitle.trim()) {
                                      alert('নাম এবং পরিচয় আবশ্যক!');
                                      return;
                                    }
                                    onUpdateScholar({
                                      id: sch.id,
                                      name: editSName.trim(),
                                      title: editSTitle.trim(),
                                      topic: editSTopic.trim() || undefined,
                                      serialNo: Number(editSSerialNo) || sch.serialNo,
                                    });
                                    setEditingScholarId(null);
                                  }}
                                  className="p-1.5 bg-green-500 hover:bg-green-600 text-white rounded transition cursor-pointer"
                                  title="সংরক্ষণ"
                                >
                                  <CheckCircle className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => setEditingScholarId(null)}
                                  className="p-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded transition cursor-pointer"
                                  title="বাতিল"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            ) : (
                              <div className="flex items-center justify-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    setEditingScholarId(sch.id);
                                    setEditSName(sch.name);
                                    setEditSTitle(sch.title);
                                    setEditSTopic(sch.topic || '');
                                    setEditSSerialNo(String(sch.serialNo));
                                  }}
                                  className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded transition cursor-pointer"
                                  title="সম্পাদনা করুন"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  onClick={() => {
                                    if (confirm(`আপনি কি নিশ্চিতভাবে "${sch.name}"-কে তালিকা থেকে বাদ দিতে চান?`)) {
                                      onDeleteScholar(sch.id);
                                    }
                                  }}
                                  className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded transition cursor-pointer"
                                  title="মুছে ফেলুন"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab Content 5: Manage Activities & Services */}
      {cpanelTab === 'activities' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Add Activity Form Panel */}
          <div className="lg:col-span-4 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#064e3b] mb-5 flex items-center space-x-2 border-b border-[#e2e8f0] pb-3">
              <Plus className="h-5 w-5 text-[#0f766e]" />
              <span>নতুন কার্যক্রম বা সেবা যোগ করুন</span>
            </h4>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (!actTitle.trim() || !actDesc.trim()) {
                  alert('শিরোনাম ও বিবরণ আবশ্যক!');
                  return;
                }
                onAddActivity({
                  title: actTitle.trim(),
                  description: actDesc.trim(),
                });
                setActTitle('');
                setActDesc('');
                setActSuccessMsg('নতুন কার্যক্রম সফলভাবে যুক্ত হয়েছে!');
                setTimeout(() => setActSuccessMsg(''), 3000);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-xs font-semibold text-[#0f766e] uppercase mb-1.5">কার্যক্রম/সেবার শিরোনাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: তাবাররুক বিতরণ"
                  value={actTitle}
                  onChange={(e) => setActTitle(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#d97706] transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#0f766e] uppercase mb-1.5">বিস্তারিত বিবরণ *</label>
                <textarea
                  required
                  rows={4}
                  placeholder="যেমন: তাবাররুক বিতরণের সুশৃঙ্খল পরিকল্পনা..."
                  value={actDesc}
                  onChange={(e) => setActDesc(e.target.value)}
                  className="block w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#d97706] transition resize-none"
                />
              </div>

              {actSuccessMsg && (
                <div className="flex items-center space-x-2 text-xs text-[#0f766e] bg-[#0f766e]/10 p-2.5 rounded-lg border border-[#0f766e]/20">
                  <CheckCircle className="h-4 w-4" />
                  <span>{actSuccessMsg}</span>
                </div>
              )}

              <button
                type="submit"
                className="w-full py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg text-xs transition cursor-pointer shadow-sm"
              >
                কার্যক্রম তালিকায় যুক্ত করুন
              </button>
            </form>
          </div>

          {/* Activities List Panel */}
          <div className="lg:col-span-8 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm">
            <h4 className="text-base font-bold text-[#064e3b] mb-5 flex items-center space-x-2 border-b border-[#e2e8f0] pb-3">
              <Users className="h-5 w-5 text-[#0f766e]" />
              <span>আমাদের বর্তমান কার্যক্রম ও সেবাসমূহ</span>
            </h4>

            {activities.length === 0 ? (
              <div className="py-12 text-center text-xs text-[#8a817c]">কোনো কার্যক্রম বা সেবা পাওয়া যায়নি।</div>
            ) : (
              <div className="space-y-4">
                {activities.map((act) => {
                  const isEditing = editingActivityId === act.id;
                  return (
                    <div key={act.id} className="border border-[#e2e8f0] rounded-xl p-4 hover:border-[#d97706] hover:bg-[#f8fafc]/30 transition relative group">
                      {isEditing ? (
                        <div className="space-y-3">
                          <div>
                            <label className="block text-[10px] font-bold text-[#0f766e] uppercase mb-1">কার্যক্রমের শিরোনাম</label>
                            <input
                              type="text"
                              value={editActTitle}
                              onChange={(e) => setEditActTitle(e.target.value)}
                              className="w-full p-2 border border-[#cbd5e1] rounded-lg text-xs font-bold text-[#064e3b]"
                              placeholder="শিরোনাম"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-[#0f766e] uppercase mb-1">বিস্তারিত বিবরণ</label>
                            <textarea
                              value={editActDesc}
                              onChange={(e) => setEditActDesc(e.target.value)}
                              className="w-full p-2 border border-[#cbd5e1] rounded-lg text-xs resize-none"
                              rows={3}
                              placeholder="বিবরণ"
                            />
                          </div>
                          <div className="flex items-center space-x-2 pt-1">
                            <button
                              onClick={() => {
                                if (!editActTitle.trim() || !editActDesc.trim()) {
                                  alert('শিরোনাম ও বিবরণ আবশ্যক!');
                                  return;
                                }
                                onUpdateActivity({
                                  id: act.id,
                                  title: editActTitle.trim(),
                                  description: editActDesc.trim(),
                                });
                                setEditingActivityId(null);
                              }}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white rounded-lg text-xs transition cursor-pointer"
                            >
                              <CheckCircle className="h-3.5 w-3.5" />
                              <span>সংরক্ষণ করুন</span>
                            </button>
                            <button
                              onClick={() => setEditingActivityId(null)}
                              className="flex items-center space-x-1 px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white rounded-lg text-xs transition cursor-pointer"
                            >
                              <span>বাতিল</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex justify-between items-start space-x-4">
                          <div className="space-y-1">
                            <h5 className="font-bold text-[#064e3b] text-sm">{act.title}</h5>
                            <p className="text-xs text-[#3c3c3c]/90 leading-relaxed font-light">{act.description}</p>
                          </div>
                          <div className="flex items-center space-x-1.5 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingActivityId(act.id);
                                setEditActTitle(act.title);
                                setEditActDesc(act.description);
                              }}
                              className="p-1.5 bg-blue-50 hover:bg-blue-100 text-blue-600 border border-blue-200 rounded-lg transition cursor-pointer"
                              title="সম্পাদনা করুন"
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </button>
                            <button
                              onClick={() => {
                                if (confirm(`আপনি কি নিশ্চিতভাবে "${act.title}" কার্যক্রমটি মুছে ফেলতে চান?`)) {
                                  onDeleteActivity(act.id);
                                }
                              }}
                              className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 rounded-lg transition cursor-pointer"
                              title="মুছে ফেলুন"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Sub-Tab Content: House Collection Sheets & Donation Receipts */}
      {cpanelTab === 'collection-sheets' && (
        <div className="space-y-4">
          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-300/80 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
            <div className="flex items-center space-x-3">
              <div className="p-2.5 bg-[#064e3b] text-white rounded-xl shadow-xs shrink-0">
                <Building2 className="h-5 w-5 text-amber-400" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-[#064e3b] flex items-center gap-2">
                  <span>অ্যাডমিন বাড়ি রিপোর্ট ও কালেকশন শিট কেন্দ্র</span>
                  <span className="text-[10px] bg-emerald-200/80 text-emerald-900 font-bold px-2 py-0.5 rounded-full">
                    এডমিন সেকশন
                  </span>
                </h4>
                <p className="text-xs text-emerald-900/80">
                  কালেকশন শিট তৈরি, ক্রম পুনর্বিন্যাস এবং প্রতিটি বাড়ির বিস্তারিত রিপোর্ট পরিচালনা করুন।
                </p>
              </div>
            </div>
            {onNavigate && (
              <button
                type="button"
                onClick={() => onNavigate('house-report')}
                className="px-4 py-2 bg-[#064e3b] hover:bg-[#0f766e] text-white rounded-xl text-xs font-bold transition flex items-center space-x-2 shadow-sm cursor-pointer shrink-0"
              >
                <Eye className="h-4 w-4 text-amber-300" />
                <span>সম্পূর্ণ বাড়ি রিপোর্ট স্ক্রিনে যান</span>
              </button>
            )}
          </div>
          <CPanelCollectionSheets
            transactions={transactions}
            mahfilDetails={mahfilDetails}
            activeHouses={activeHousesProp}
            deletedHouses={deletedHousesProp}
            donorOrders={donorOrders}
            onUpdateDonorOrder={onUpdateDonorOrder}
            onAddTransaction={onAddTransaction}
            onUpdateHouses={onUpdateHouses}
          />
        </div>
      )}

      {/* Sub-Tab Content: Website Visitor Analytics */}
      {cpanelTab === 'visitors' && (
        <CPanelVisitorAnalytics
          summary={visitorSummary}
          activeSessions={activeSessions}
          activeCount={activeVisitorCount}
          recentLogs={visitorLogs}
          onRefresh={onRefreshVisitorAnalytics}
          onReset={onResetVisitorAnalytics}
        />
      )}

      {/* Sub-Tab Content: Gallery Photo Management */}
      {cpanelTab === 'gallery' && (
        <CPanelGalleryManager
          photos={galleryPhotos}
          onAddPhoto={onAddGalleryPhoto || (() => {})}
          onUpdatePhoto={onUpdateGalleryPhoto || (() => {})}
          onDeletePhoto={onDeleteGalleryPhoto || (() => {})}
        />
      )}

      {/* Sub-Tab Content 3: Reset Data & Settings & Backups */}
      {cpanelTab === 'settings' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Column 1: Manage Expense Categories (lg:col-span-6) */}
          <div className="lg:col-span-6 bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-5">
            <h4 className="text-base font-bold text-[#064e3b] flex items-center space-x-2 border-b border-[#e2e8f0] pb-3">
              <Settings className="h-5 w-5 text-[#0f766e]" />
              <span>ব্যয়ের খাতসমূহ নিয়ন্ত্রণ (Expense Categories)</span>
            </h4>

            {/* Add New Category form inside Settings */}
            <form onSubmit={handleAddSettingsCategory} className="space-y-3 bg-[#f8fafc] p-4 rounded-xl border border-[#cbd5e1]/60 text-xs">
              <h5 className="font-bold text-[#064e3b] text-xs">নতুন ব্যয়ের খাত যুক্ত করুন</h5>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="উদা: ডেকোরেশন ও লাইটিং"
                  value={newSettingsCategory}
                  onChange={(e) => setNewSettingsCategory(e.target.value)}
                  className="flex-1 px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-xs text-[#3c3c3c] focus:outline-none focus:border-[#0f766e]"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg transition text-xs shrink-0 cursor-pointer"
                >
                  যোগ করুন
                </button>
              </div>

              {settingsCategoryError && (
                <p className="text-red-600 font-medium text-[10px]">{settingsCategoryError}</p>
              )}
              {settingsCategorySuccess && (
                <p className="text-[#0f766e] font-medium text-[10px]">{settingsCategorySuccess}</p>
              )}
            </form>

            {/* List of current expense categories */}
            <div className="space-y-2">
              <h5 className="font-bold text-[#064e3b] text-xs">বিদ্যমান ব্যয়ের খাতসমূহ ({toBanglaNum(expenseCategories.length)}টি):</h5>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-1">
                {expenseCategories.map((cat) => {
                  return (
                    <div
                      key={cat}
                      className="flex items-center justify-between p-2.5 bg-[#f1f5f9]/60 border border-[#cbd5e1]/40 rounded-lg text-xs"
                    >
                      <span className="truncate font-medium text-[#064e3b]">{cat}</span>
                      {cat !== 'অন্যান্য' ? (
                        <button
                          type="button"
                          onClick={() => handleDeleteSettingsCategory(cat)}
                          className="p-1 text-red-600 hover:bg-red-50 rounded transition cursor-pointer"
                          title="মুছে ফেলুন"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      ) : (
                        <span className="text-[9px] text-[#8a817c] font-bold bg-white px-1.5 py-0.5 rounded border border-[#cbd5e1]/40">সিস্টেম</span>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Column 2: Backups, Visibility and Data Reset (lg:col-span-6) */}
          <div className="lg:col-span-6 space-y-6">
            {/* Public Access Control Setting Card */}
            <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-[#064e3b] flex items-center space-x-2 border-b border-[#e2e8f0] pb-3">
                <Globe className="h-5 w-5 text-[#0f766e]" />
                <span>পাবলিক মেনু এক্সেস ও অনুমোদন সেটিংস</span>
              </h4>
              <p className="text-xs text-[#3c3c3c]/80 leading-relaxed font-light">
                সাধারণ জনগণ ও দর্শকদের জন্য রিপোর্ট মেনু এবং আয়-ব্যয় হিসাব উন্মুক্ত থাকবে কি না তা এখান থেকে নিয়ন্ত্রণ করুন।
              </p>

              <div className="space-y-3">
                {/* 1. Report Menu Visibility */}
                <div className="flex items-center justify-between p-3.5 bg-[#f8fafc] rounded-xl border border-[#cbd5e1]/60">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#064e3b] block">রিপোর্ট মেনু ও পিডিএফ কেন্দ্র:</span>
                    <span className={`text-xs font-bold ${mahfilDetails?.isReportPublic ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {mahfilDetails?.isReportPublic ? '🟢 সবার জন্য উন্মুক্ত (Public Approved)' : '🔒 সাধারণের জন্য লক (Admin Only)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus = !(mahfilDetails?.isReportPublic);
                      onUpdateMahfilDetails({
                        ...mahfilDetails,
                        isReportPublic: nextStatus
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                      mahfilDetails?.isReportPublic
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {mahfilDetails?.isReportPublic ? 'রিপোর্ট লক করুন' : 'রিপোর্ট অনুমোদন দিন'}
                  </button>
                </div>

                {/* 2. Finance Menu Visibility */}
                <div className="flex items-center justify-between p-3.5 bg-[#f8fafc] rounded-xl border border-[#cbd5e1]/60">
                  <div className="space-y-0.5">
                    <span className="text-xs font-bold text-[#064e3b] block">আয়-ব্যয় হিসাব লেনদেন মেনু:</span>
                    <span className={`text-xs font-bold ${mahfilDetails?.isFinancePublic ? 'text-emerald-700' : 'text-amber-700'}`}>
                      {mahfilDetails?.isFinancePublic ? '🟢 সবার জন্য উন্মুক্ত (Public Approved)' : '🔒 সাধারণের জন্য লক (Admin Only)'}
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      const nextStatus = !(mahfilDetails?.isFinancePublic);
                      onUpdateMahfilDetails({
                        ...mahfilDetails,
                        isFinancePublic: nextStatus
                      });
                    }}
                    className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer shadow-xs ${
                      mahfilDetails?.isFinancePublic
                        ? 'bg-amber-100 hover:bg-amber-200 text-amber-900 border border-amber-300'
                        : 'bg-emerald-600 hover:bg-emerald-700 text-white'
                    }`}
                  >
                    {mahfilDetails?.isFinancePublic ? 'হিসাব লক করুন' : 'হিসাব অনুমোদন দিন'}
                  </button>
                </div>
              </div>
            </div>

            {/* Backups Panel */}
            <div className="bg-white border border-[#cbd5e1] rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-[#064e3b] flex items-center space-x-2 border-b border-[#e2e8f0] pb-3">
                <Download className="h-5 w-5 text-[#0f766e]" />
                <span>ডেটা ব্যাকআপ ও ইম্পোর্ট</span>
              </h4>
              <p className="text-xs text-[#3c3c3c]/80 leading-relaxed font-light">
                আপনার সমস্ত লেনদেনের হিসেব ও কমিটির তালিকা একটি সুরক্ষিত জেসন (JSON) ফাইলে ব্যাকআপ করে রাখতে পারেন। যেকোনো সময় এই ব্যাকআপ ফাইলটি পুনরায় আপলোড করে ডেটা পুনরুদ্ধার করা সম্ভব।
              </p>

              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                {/* Export Backup Button */}
                <button
                  id="export-backup-btn"
                  onClick={handleExportBackup}
                  className="flex-1 flex items-center justify-center space-x-2 py-3 bg-white hover:bg-[#f1f5f9] text-[#0f766e] rounded-xl text-xs font-bold border border-[#cbd5e1] transition cursor-pointer shadow-sm"
                >
                  <Download className="h-4 w-4" />
                  <span>জেসন ব্যাকআপ এক্সপোর্ট</span>
                </button>

                {/* Import Backup Button Wrapper */}
                <label className="flex-1 flex items-center justify-center space-x-2 py-3 bg-[#f1f5f9] hover:bg-[#e2e8f0] text-[#064e3b] rounded-xl text-xs font-bold border border-[#cbd5e1] cursor-pointer transition text-center shadow-sm">
                  <Upload className="h-4 w-4 text-[#0f766e]" />
                  <span>জেসন ফাইল ইম্পোর্ট</span>
                  <input
                    id="import-backup-file"
                    type="file"
                    accept=".json"
                    className="hidden"
                    onChange={handleImportBackup}
                  />
                </label>
              </div>
            </div>

            {/* Reset/Factory Database Panel */}
            <div className="bg-white border border-red-200 rounded-2xl p-6 shadow-sm space-y-4">
              <h4 className="text-base font-bold text-red-700 flex items-center space-x-2 border-b border-red-100 pb-3">
                <RefreshCw className="h-5 w-5 text-red-600" />
                <span>ডেটা রিসেট ও ফ্যাক্টরি রিস্টোর</span>
              </h4>
              <p className="text-xs text-[#3c3c3c]/80 leading-relaxed font-light">
                আপনি কি সমস্ত লেনদেনের রেকর্ড এবং কাস্টম কমিটি সরিয়ে প্রথম অবস্থায় ফিরে যেতে চান? ডেটা রিসেট করলে আপনার নিজের হাতে যোগ করা যাবতীয় হিসাব মুছে যাবে এবং প্রারম্ভিক নমুনা তথ্যসমূহ পুনর্বহাল হবে।
              </p>

              <button
                id="reset-db-btn"
                onClick={() => {
                  if (confirm('সতর্কতা: আপনি কি সত্যিই সমস্ত আর্থিক ডেটা রিসেট করতে চান? এই প্রক্রিয়াটি আর ফেরত আনা যাবে না।')) {
                    onResetData();
                    alert('সমস্ত ডাটা সফলভাবে প্রথম অবস্থায় রিসেট করা হয়েছে!');
                  }
                }}
                className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
              >
                ফ্যাক্টরি ডেটা রিসেট করুন
              </button>
            </div>
          </div>
        </div>
      )}
      {/* Duplicate Posting Audit Modal */}
      <DuplicateAuditModal
        isOpen={showDuplicateAuditModal}
        onClose={() => setShowDuplicateAuditModal(false)}
        transactions={transactions}
        onDeleteTransaction={onDeleteTransaction}
        initialYear="2026"
      />
    </div>
  );
}
