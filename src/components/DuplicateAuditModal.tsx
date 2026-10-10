import React from 'react';
import { Transaction } from '../types';
import {
  Copy,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  X,
  Search,
  Building2,
  Calendar,
  Coins,
  ShieldCheck,
  User,
  ExternalLink,
  Info
} from 'lucide-react';

// Helper for Bangla numbers
const toBanglaNum = (num: number | string | undefined | null): string => {
  if (num === undefined || num === null || num === '') return '০';
  const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
  return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d, 10)]);
};

// Helper for Bangla date formatting (YYYY-MM-DD -> DD/MM/YYYY)
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

interface DuplicateAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  onDeleteTransaction?: (id: string) => Promise<void> | void;
  initialYear?: string;
}

export interface DuplicateGroup {
  key: string;
  name: string;
  amount?: number;
  transactions: Transaction[];
  houses: string[];
  dates: string[];
  isSameAmount: boolean;
  isSameDay: boolean;
  isSameHouse: boolean;
}

export default function DuplicateAuditModal({
  isOpen,
  onClose,
  transactions = [],
  onDeleteTransaction,
  initialYear = '2026'
}: DuplicateAuditModalProps) {
  const [selectedYear, setSelectedYear] = React.useState<string>(initialYear);
  const [searchQuery, setSearchQuery] = React.useState<string>('');
  const [activeTab, setActiveTab] = React.useState<'exact' | 'sameHouse' | 'allMatches'>('exact');
  const [deletingId, setDeletingId] = React.useState<string | null>(null);
  const [successNotice, setSuccessNotice] = React.useState<string | null>(null);

  // Filter transactions by year
  const yearFilteredTransactions = React.useMemo(() => {
    return transactions.filter((t) => {
      if (t.type !== 'income') return false;
      if (!t.donorName || t.donorName.trim() === '') return false;
      if (selectedYear === 'all') return true;
      const tYear = t.year ? t.year.toString() : (t.date ? t.date.split('-')[0] : '2026');
      return tYear === selectedYear;
    });
  }, [transactions, selectedYear]);

  // Compute duplicate groups with thorough classification
  const { exactGroups, sameHouseGroups, crossHouseDifferentAmtGroups } = React.useMemo(() => {
    const normalize = (name: string) => 
      (name || '')
        .replace(/[\s\u200B-\u200D\uFEFF\.\,\(\)\-\_]/g, '')
        .trim()
        .toLowerCase();

    // Map by normalized donor name
    const byName = new Map<string, Transaction[]>();
    yearFilteredTransactions.forEach((t) => {
      const key = normalize(t.donorName || '');
      if (!key) return;
      if (!byName.has(key)) byName.set(key, []);
      byName.get(key)!.push(t);
    });

    const exactList: DuplicateGroup[] = [];
    const sameHouseList: DuplicateGroup[] = [];
    const crossDifferentList: DuplicateGroup[] = [];

    byName.forEach((txs, normKey) => {
      if (txs.length <= 1) return;

      // 1. Check for same house groups
      const byHouse = new Map<string, Transaction[]>();
      txs.forEach((t) => {
        const h = t.houseName || 'অনির্ধারিত বাড়ি';
        if (!byHouse.has(h)) byHouse.set(h, []);
        byHouse.get(h)!.push(t);
      });

      byHouse.forEach((hTxs, house) => {
        if (hTxs.length > 1) {
          const amounts = Array.from(new Set(hTxs.map((t) => t.amount)));
          const dates = Array.from(new Set(hTxs.map((t) => t.date)));
          sameHouseList.push({
            key: `samehouse_${normKey}_${house}`,
            name: hTxs[0].donorName || normKey,
            transactions: hTxs,
            houses: [house],
            dates,
            isSameAmount: amounts.length === 1,
            isSameDay: dates.length === 1,
            isSameHouse: true
          });
        }
      });

      // 2. Check for exact matches across amounts (same donor + same amount)
      const byAmount = new Map<number, Transaction[]>();
      txs.forEach((t) => {
        const amt = t.amount || 0;
        if (!byAmount.has(amt)) byAmount.set(amt, []);
        byAmount.get(amt)!.push(t);
      });

      byAmount.forEach((amtTxs, amt) => {
        if (amtTxs.length > 1) {
          const houses = Array.from(new Set(amtTxs.map((t) => t.houseName || 'অনির্ধারিত বাড়ি')));
          const dates = Array.from(new Set(amtTxs.map((t) => t.date)));
          exactList.push({
            key: `exact_${normKey}_${amt}`,
            name: amtTxs[0].donorName || normKey,
            amount: amt,
            transactions: amtTxs,
            houses,
            dates,
            isSameAmount: true,
            isSameDay: dates.length === 1,
            isSameHouse: houses.length === 1
          });
        }
      });

      // 3. Collect cross-house matches that have different amounts
      const amounts = Array.from(new Set(txs.map((t) => t.amount)));
      const houses = Array.from(new Set(txs.map((t) => t.houseName || 'অনির্ধারিত বাড়ি')));
      const dates = Array.from(new Set(txs.map((t) => t.date)));
      
      crossDifferentList.push({
        key: `all_${normKey}`,
        name: txs[0].donorName || normKey,
        transactions: txs,
        houses,
        dates,
        isSameAmount: amounts.length === 1,
        isSameDay: dates.length === 1,
        isSameHouse: houses.length === 1
      });
    });

    return {
      exactGroups: exactList,
      sameHouseGroups: sameHouseList,
      crossHouseDifferentAmtGroups: crossDifferentList
    };
  }, [yearFilteredTransactions]);

  // Search filter
  const filterBySearch = (groups: DuplicateGroup[]) => {
    if (!searchQuery.trim()) return groups;
    const q = searchQuery.toLowerCase().trim();
    return groups.filter((g) =>
      g.name.toLowerCase().includes(q) ||
      g.houses.some((h) => h.toLowerCase().includes(q)) ||
      (g.amount !== undefined && g.amount.toString().includes(q))
    );
  };

  const displayedGroups = React.useMemo(() => {
    if (activeTab === 'exact') return filterBySearch(exactGroups);
    if (activeTab === 'sameHouse') return filterBySearch(sameHouseGroups);
    return filterBySearch(crossHouseDifferentAmtGroups);
  }, [activeTab, exactGroups, sameHouseGroups, crossHouseDifferentAmtGroups, searchQuery]);

  // Handle single transaction delete
  const handleDelete = async (tx: Transaction) => {
    if (!onDeleteTransaction) return;
    const houseInfo = tx.houseName ? `(${tx.houseName})` : '';
    const confirmMsg = `আপনি কি নিশ্চিত যে "${tx.donorName}" ${houseInfo} এর ৳ ${toBanglaNum(tx.amount.toLocaleString('bn-BD'))}/- টাকার পোস্টিংটি স্থায়ীভাবে মুছে ফেলতে চান?`;
    if (!window.confirm(confirmMsg)) return;

    setDeletingId(tx.id);
    try {
      await onDeleteTransaction(tx.id);
      setSuccessNotice(`"${tx.donorName}" এর ৳ ${toBanglaNum(tx.amount)}/- টাকার ভাউচার সফলভাবে মুছে ফেলা হয়েছে।`);
      setTimeout(() => setSuccessNotice(null), 5000);
    } catch (err) {
      console.error('Failed to delete duplicate transaction:', err);
      alert('এন্ট্রি মুছতে সমস্যা হয়েছে। অনুগ্রহ করে ইন্টারনেট সংযোগ চেক করে পুনরায় চেষ্টা করুন।');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-3 sm:p-4 animate-fade-in text-slate-900">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full overflow-hidden flex flex-col max-h-[90vh] border border-gray-200">
        
        {/* Modal Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-slate-950 via-slate-900 to-emerald-950 text-white flex items-center justify-between border-b border-emerald-500/30">
          <div className="flex items-center space-x-3">
            <span className="p-2.5 bg-amber-400/20 text-amber-300 rounded-xl border border-amber-400/30 shadow-inner">
              <Copy className="h-6 w-6" />
            </span>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="text-base sm:text-lg font-black tracking-tight text-white">
                  একই ব্যক্তির নামে ডুপ্লিকেট পোস্টিং নিরীক্ষা ও সমাধান
                </h3>
                <span className="text-[11px] font-black bg-amber-400 text-slate-950 px-2 py-0.5 rounded-full shadow-xs">
                  {selectedYear === 'all' ? 'সকল বছর' : `${toBanglaNum(selectedYear)} খ্রি.`}
                </span>
              </div>
              <p className="text-xs text-slate-300 font-medium mt-0.5">
                একই ব্যক্তির নামে ভুলবশত দুইবার বা অতিরিক্ত পোস্টিং চিহ্নিত ও বাতিল করার প্রশাসনিক টুল
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-white rounded-xl hover:bg-white/10 transition cursor-pointer"
            title="বন্ধ করুন"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Action & Filter Toolbar */}
        <div className="p-3 sm:p-4 bg-slate-50 border-b border-gray-200 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center justify-between">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400 pointer-events-none" />
            <input
              type="text"
              placeholder="দাতার নাম, বাড়ি বা টাকার অংক দিয়ে খুঁজুন..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-8 py-2 bg-white border border-gray-300 rounded-xl text-xs text-slate-800 placeholder-gray-400 focus:outline-none focus:border-[#0f766e] focus:ring-1 focus:ring-[#0f766e] transition"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          {/* Year selector */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Calendar className="h-3.5 w-3.5 text-[#0f766e]" />
              <span>বছর:</span>
            </span>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="px-3 py-1.5 bg-white border border-gray-300 rounded-xl text-xs font-bold text-slate-800 focus:outline-none focus:border-[#0f766e] cursor-pointer"
            >
              <option value="2026">২০২৬ খ্রি.</option>
              <option value="2025">২০২৫ খ্রি.</option>
              <option value="2024">২০২৪ খ্রি.</option>
              <option value="all">সকল বছর</option>
            </select>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-gray-200 bg-gray-100 px-3 sm:px-4 pt-2 gap-1.5 sm:gap-2 overflow-x-auto no-scrollbar">
          {/* Tab 1: Exact Matches */}
          <button
            type="button"
            onClick={() => setActiveTab('exact')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'exact'
                ? 'border-red-600 text-red-700 bg-white shadow-xs font-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <span>হুবহু ডুপ্লিকেট (একই নাম ও সমপরিমাণ টাকা)</span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
              exactGroups.length > 0 ? 'bg-red-600 text-white animate-pulse' : 'bg-gray-200 text-gray-700'
            }`}>
              {toBanglaNum(exactGroups.length)}
            </span>
          </button>

          {/* Tab 2: Same House Duplicates */}
          <button
            type="button"
            onClick={() => setActiveTab('sameHouse')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'sameHouse'
                ? 'border-amber-600 text-amber-800 bg-white shadow-xs font-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <span>একই বাড়িতে একাধিক এন্ট্রি</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-gray-200 text-gray-700">
              {toBanglaNum(sameHouseGroups.length)}
            </span>
          </button>

          {/* Tab 3: All Cross-House Matches */}
          <button
            type="button"
            onClick={() => setActiveTab('allMatches')}
            className={`px-3.5 py-2.5 text-xs font-bold rounded-t-xl transition cursor-pointer flex items-center gap-2 border-b-2 whitespace-nowrap ${
              activeTab === 'allMatches'
                ? 'border-[#0f766e] text-[#0f766e] bg-white shadow-xs font-black'
                : 'border-transparent text-gray-600 hover:text-gray-900 hover:bg-gray-200/60'
            }`}
          >
            <span>সকল একই নামের দাতা ({toBanglaNum(crossHouseDifferentAmtGroups.length)})</span>
          </button>
        </div>

        {/* Success Notice */}
        {successNotice && (
          <div className="mx-4 mt-3 p-3 bg-emerald-50 border border-emerald-300 rounded-xl text-xs font-bold text-emerald-900 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>{successNotice}</span>
            </div>
            <button
              type="button"
              onClick={() => setSuccessNotice(null)}
              className="text-emerald-700 hover:text-emerald-900"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Modal Content Body */}
        <div className="p-3 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {/* Informational Guidance Banner based on Tab */}
          {activeTab === 'exact' && (
            <div className="p-3.5 bg-red-50/80 border border-red-200 rounded-xl text-xs text-red-900 flex items-start gap-2.5">
              <AlertTriangle className="h-5 w-5 text-red-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  ⚠️ সতর্কতা: নিচে একই নামের সাথে হুবহু একই টাকার পরিমাণের পোস্টিং চিহ্নিত করা হয়েছে।
                </p>
                <p className="text-[11px] text-red-800 leading-relaxed">
                  বিশেষ করে একই দিনে একাধিক বাড়িতে একই ব্যক্তি ও একই টাকার এন্ট্রি হলে সেটি সাধারণত ভুলবশত দুইবার পোস্টিং হওয়ার প্রবল সম্ভাবনা থাকে। অপ্রয়োজনীয় ডুপ্লিকেট এন্ট্রিটি ডানপাশের <strong>&apos;মুছে ফেলুন&apos;</strong> বাটনে ক্লিক করে বাতিল করুন।
                </p>
              </div>
            </div>
          )}

          {activeTab === 'sameHouse' && (
            <div className="p-3.5 bg-amber-50/80 border border-amber-200 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <Info className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
              <p className="text-[11px] text-amber-800 leading-relaxed">
                একই পরিবারের/বাড়ির অধীনে একই ব্যক্তির নামে একাধিক এন্ট্রি থাকলে এখানে প্রদর্শিত হবে।
              </p>
            </div>
          )}

          {activeTab === 'allMatches' && (
            <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-xl text-xs text-blue-900 flex items-start gap-2.5">
              <Info className="h-5 w-5 text-blue-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <p className="font-bold">
                  💡 বিভিন্ন বাড়িতে একই নামের দাতা নিরীক্ষা:
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  গ্রামাঞ্চলে একই নামের একাধিক ভিন্ন ব্যক্তি থাকতে পারেন (যেমন ভিন্ন বাড়ির মোঃ খোরশেদ আলম বা মোঃ আফছার)। নিশ্চিত হয়ে প্রয়োজনমতো এন্ট্রি পর্যালোচনা বা মুছতে পারেন।
                </p>
              </div>
            </div>
          )}

          {/* Group List */}
          {displayedGroups.length === 0 ? (
            <div className="p-10 text-center bg-emerald-50/50 rounded-2xl border border-emerald-200 space-y-3">
              <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="h-7 w-7" />
              </div>
              <h4 className="text-base font-black text-emerald-950">
                কোনো ডুপ্লিকেট পোস্টিং পাওয়া যায়নি!
              </h4>
              <p className="text-xs text-emerald-800 max-w-md mx-auto leading-relaxed">
                আলহামদুলিল্লাহ, নির্বাচিত ফিল্টারে কোনো অনাকাঙ্ক্ষিত ডুপ্লিকেট রেকর্ড নেই। সকল হিসাব পরিচ্ছন্ন ও সঠিক রয়েছে।
              </p>
            </div>
          ) : (
            <div className="space-y-3.5">
              {displayedGroups.map((group) => {
                const isExactCandidate = group.isSameAmount;
                return (
                  <div
                    key={group.key}
                    className={`bg-white rounded-2xl border-2 transition-all shadow-xs overflow-hidden ${
                      isExactCandidate
                        ? 'border-red-300 hover:border-red-400'
                        : 'border-slate-200 hover:border-slate-300'
                    }`}
                  >
                    {/* Group Header */}
                    <div className={`px-4 py-2.5 flex flex-wrap items-center justify-between gap-2 border-b ${
                      isExactCandidate
                        ? 'bg-red-50 border-red-200 text-red-950'
                        : 'bg-slate-100 border-slate-200 text-slate-900'
                    }`}>
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4 text-[#0f766e]" />
                        <span className="font-black text-sm">{group.name}</span>
                        {group.amount !== undefined && (
                          <span className="text-xs font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded-md">
                            ৳ {toBanglaNum(group.amount.toLocaleString('bn-BD'))}/-
                          </span>
                        )}
                        {group.isSameDay && (
                          <span className="text-[10px] font-extrabold bg-red-600 text-white px-2 py-0.5 rounded-full">
                            একই দিনে পোস্টিং
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-600 font-bold">
                          মোট {toBanglaNum(group.transactions.length)} টি এন্ট্রি
                        </span>
                        <span className="text-xs text-slate-400">|</span>
                        <span className="text-xs text-slate-600 font-medium">
                          বাড়ি: {group.houses.join(', ')}
                        </span>
                      </div>
                    </div>

                    {/* Transaction Items */}
                    <div className="divide-y divide-gray-100 p-2.5 space-y-2">
                      {group.transactions.map((tx, idx) => (
                        <div
                          key={tx.id}
                          className="p-3 bg-slate-50/70 hover:bg-slate-100/80 rounded-xl transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 border border-slate-200/60"
                        >
                          <div className="space-y-1 text-xs">
                            <div className="flex items-center gap-2 flex-wrap">
                              <span className="text-[11px] font-black text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200">
                                #{toBanglaNum(idx + 1)}
                              </span>
                              <span className="font-bold text-[#064e3b] text-sm">
                                ৳ {toBanglaNum(tx.amount.toLocaleString('bn-BD'))}/-
                              </span>
                              <span className="px-2 py-0.5 rounded-md text-[10px] font-extrabold bg-emerald-100 text-[#064e3b]">
                                {tx.houseName || 'বাড়ি অনির্ধারিত'}
                              </span>
                              <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.5 rounded font-medium">
                                {tx.category || 'সাধারণ রশিদ কালেকশন'}
                              </span>
                              {tx.donationType === 'item' && (
                                <span className="text-[10px] bg-purple-100 text-purple-800 px-1.5 py-0.5 rounded font-bold">
                                  পণ্য: {tx.itemName || tx.description || 'পণ্য অনুদান'}
                                </span>
                              )}
                            </div>

                            <div className="flex items-center gap-3 text-[11px] text-slate-500 flex-wrap">
                              <span>তারিখ: {toBanglaDate(tx.date)}</span>
                              {tx.recordedBy && <span>সংগ্রহকারী: {tx.recordedBy}</span>}
                              {tx.receiptNo && <span>রশিদ নং: {tx.receiptNo}</span>}
                              <span className="text-[9.5px] font-mono text-slate-400">ID: {tx.id}</span>
                            </div>
                          </div>

                          {/* Delete Button */}
                          {onDeleteTransaction && (
                            <button
                              type="button"
                              disabled={deletingId === tx.id}
                              onClick={() => handleDelete(tx)}
                              className="px-3.5 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer self-end sm:self-auto shrink-0 shadow-xs active:scale-95 disabled:opacity-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              <span>{deletingId === tx.id ? 'মুছে ফেলা হচ্ছে...' : 'মুছে ফেলুন'}</span>
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-slate-50 border-t border-gray-200 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-600">
            <ShieldCheck className="h-4 w-4 text-[#0f766e]" />
            <span>
              মোট শনাক্তকৃত: <strong className="text-slate-900">{toBanglaNum(exactGroups.length)} টি হুবহু গ্রুপ</strong> (মোট {toBanglaNum(crossHouseDifferentAmtGroups.length)} টি নাম ম্যাচ)
            </span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="w-full sm:w-auto px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition cursor-pointer shadow-sm"
          >
            সম্পন্ন / বন্ধ করুন
          </button>
        </div>

      </div>
    </div>
  );
}
