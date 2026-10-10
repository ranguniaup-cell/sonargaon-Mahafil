import { Transaction } from '../types';

/**
 * Checks if a transaction is an individual house-based donor collection
 * (বাড়ি ভিত্তিক ব্যক্তির চাঁদা আদায়).
 * Individual collections have a specific houseName or individual donor details under 'বাড়ি ভিত্তিক চাঁদা'.
 */
export function isHouseCollection(t: Transaction): boolean {
  if (!t) return false;
  // If houseName is explicitly set, it's definitely an individual house collection
  if (t.houseName && typeof t.houseName === 'string' && t.houseName.trim() !== '') {
    return true;
  }
  // If category is specifically individual house collection AND has donor name or specific receipt
  if (t.category === 'বাড়ি ভিত্তিক চাঁদা' && (t.donorName || t.receiptNo)) {
    return true;
  }
  return false;
}

/**
 * Robust helper to extract numerical year from transaction.
 * Supports t.year (number or string) and t.date ('YYYY-MM-DD').
 */
export function getTransactionYear(t: Transaction): number {
  if (!t) return 2026;
  if (t.year !== undefined && t.year !== null) {
    const yr = typeof t.year === 'number' ? t.year : parseInt(String(t.year), 10);
    if (!isNaN(yr) && yr > 1900) return yr;
  }
  if (t.date && typeof t.date === 'string') {
    const yr = parseInt(t.date.split('-')[0], 10);
    if (!isNaN(yr) && yr > 1900) return yr;
  }
  return 2026;
}

/**
 * Sorts manual transactions in First-In, First-Out (FIFO) chronological order.
 * The earliest / first entered posting appears first at index 0 (প্রথমের পোস্টিং ১ নম্বরে).
 */
export function sortTransactionsFIFO(transactions: Transaction[]): Transaction[] {
  return [...transactions].sort((a, b) => {
    // 1. Helper to extract numeric timestamp from createdAt or ID (e.g., t_1741528... or tx_1741528...)
    const getTimestamp = (t: Transaction): number => {
      if (typeof t.createdAt === 'number' && !isNaN(t.createdAt) && t.createdAt > 0) {
        return t.createdAt;
      }
      if (t.createdAt) {
        const parsed = new Date(t.createdAt).getTime();
        if (!isNaN(parsed) && parsed > 0) return parsed;
      }
      if (t.id) {
        const match = t.id.match(/_(\d{10,15})/);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > 0) return parsed;
        }
      }
      return 0;
    };

    const timeA = getTimestamp(a);
    const timeB = getTimestamp(b);
    if (timeA > 0 && timeB > 0 && timeA !== timeB) {
      return timeA - timeB; // Earliest timestamp first (FIFO)
    }

    // 2. Date comparison: earlier date first (FIFO)
    const dateComp = (a.date || '').localeCompare(b.date || '');
    if (dateComp !== 0) return dateComp;

    // 3. ID comparison: earlier ID first (numeric aware)
    if (a.id && b.id) {
      return a.id.localeCompare(b.id, undefined, { numeric: true });
    }

    return 0;
  });
}

/**
 * Filter transactions for General Income-Expense Financial Reports.
 * Excludes individual house collections so that only manual / general ledger entries appear.
 */
export function filterGeneralFinancialTransactions(
  transactions: Transaction[],
  excludeHouseCollections: boolean = true
): Transaction[] {
  if (!excludeHouseCollections) return transactions;
  return transactions.filter((t) => !isHouseCollection(t));
}

/**
 * Standard General Categories for Income & Expense Manual Posting
 */
export const GENERAL_INCOME_CATEGORIES = [
  'সাধারণ অনুদান ও কালেকশন',
  'সদস্য চাঁদা',
  'রশিদ বই মূলে প্রাপ্তি',
  'মাহফিল ময়দান কালেকশন',
  'প্রবাসী সম্মানিত ভাইদের অনুদান',
  'দোকান ও স্টল কালেকশন',
  'ব্যানার ও বিজ্ঞাপন কালেকশন',
  'বিশেষ অনুদান',
  'এককালীন বাড়ি চাঁদা মোট জমা',
  'অন্যান্য'
];

export const GENERAL_EXPENSE_CATEGORIES = [
  'তাবাররুক ও আপ্যায়ন',
  'মঞ্চ ও ডেকোরেশন',
  'মাইক ও সাউন্ড সিস্টেম',
  'পোস্টার ও মাইকিং প্রচার',
  'বক্তা ও অতিথি হাদিয়া',
  'আলোকসজ্জা ও বিদ্যুৎ',
  'স্টেশনারি ও যাতায়াত',
  'তোরণ ও গেট নির্মাণ',
  'আইনশৃঙ্খলা ও ভলান্টিয়ার',
  'অন্যান্য খরচ'
];

/**
 * Checks if a transaction is an auto-uploaded / initial seed transaction.
 */
export function isAutoUploadedTransaction(t: Transaction): boolean {
  if (!t || !t.id) return false;
  return (
    t.id.startsWith('t2025_') ||
    t.id.startsWith('t2024_') ||
    t.id.startsWith('t2023_') ||
    t.id.startsWith('t2026_') ||
    t.id.includes('_auto') ||
    (t.recordedBy === 'মো: তারেক জামাল' && t.id.startsWith('t20'))
  );
}

