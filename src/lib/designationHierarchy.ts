import { CommitteeMember } from '../types';

/**
 * Common Preset Designations for quick selection in forms
 */
export interface PresetDesignation {
  title: string;
  type: 'advisor' | 'leader' | 'member';
  groupLabel: string;
  rank: number;
}

export const PRESET_DESIGNATIONS: PresetDesignation[] = [
  // উপদেষ্টা পরিষদ
  { title: 'প্রধান উপদেষ্টা', type: 'advisor', groupLabel: 'উপদেষ্টা মণ্ডলী', rank: 10 },
  { title: 'উপদেষ্টা', type: 'advisor', groupLabel: 'উপদেষ্টা মণ্ডলী', rank: 20 },
  { title: 'সম্মানিত উপদেষ্টা', type: 'advisor', groupLabel: 'উপদেষ্টা মণ্ডলী', rank: 20 },

  // কার্যনির্বাহী পরিষদ নেতৃবৃন্দ
  { title: 'সভাপতি', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 100 },
  { title: 'কার্যকরী সভাপতি', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 110 },
  { title: 'সিনিয়র সহ-সভাপতি', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 120 },
  { title: 'সহ-সভাপতি', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 130 },
  { title: 'সাধারণ সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 200 },
  { title: 'যুগ্ম সাধারণ সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 210 },
  { title: 'সহ-সাধারণ সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 220 },
  { title: 'সাংগঠনিক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 300 },
  { title: 'সহ-সাংগঠনিক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 310 },
  { title: 'অর্থ সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 400 },
  { title: 'সহ-অর্থ সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 410 },
  { title: 'প্রচার সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 500 },
  { title: 'প্রচার ও প্রকাশনা সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 500 },
  { title: 'সহ-প্রচার সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 510 },
  { title: 'দপ্তর সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 600 },
  { title: 'সহ-দপ্তর সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 610 },
  { title: 'প্রবাসী বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 700 },
  { title: 'প্রবাসী কল্যাণ বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 700 },
  { title: 'সহ-প্রবাসী বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 710 },
  { title: 'সমাজকল্যাণ সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 800 },
  { title: 'সহ-সমাজকল্যাণ সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 810 },
  { title: 'আপ্যায়ন বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 900 },
  { title: 'সহ-আপ্যায়ন বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 910 },
  { title: 'শৃঙ্খলা ও নিরাপত্তা বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1000 },
  { title: 'স্বেচ্ছাসেবক বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1000 },
  { title: 'সহ-শৃঙ্খলা বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1010 },
  { title: 'ধর্ম বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1100 },
  { title: 'সাংস্কৃতিক বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1100 },
  { title: 'শিক্ষা ও পাঠাগার বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1200 },
  { title: 'তথ্য ও প্রযুক্তি বিষয়ক সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1300 },
  { title: 'মিডিয়া সম্পাদক', type: 'leader', groupLabel: 'কার্যনির্বাহী পরিষদ', rank: 1300 },

  // সদস্যবৃন্দ
  { title: 'সিনিয়র সদস্য', type: 'member', groupLabel: 'সদস্যবৃন্দ', rank: 2000 },
  { title: 'কার্যনির্বাহী সদস্য', type: 'member', groupLabel: 'সদস্যবৃন্দ', rank: 2100 },
  { title: 'সদস্য', type: 'member', groupLabel: 'সদস্যবৃন্দ', rank: 2200 },
  { title: 'সাধারণ সদস্য', type: 'member', groupLabel: 'সদস্যবৃন্দ', rank: 2200 },
];

/**
 * Normalize designation string for resilient fuzzy matching
 */
export function normalizeDesignation(designation: string): string {
  if (!designation) return '';
  return designation
    .trim()
    .replace(/[০-৯0-9]+(\s*নং|\s*ম|\s*য়|\s*র্থ)?/g, '') // remove numbers like ১নং, ২য়, 1
    .replace(/[\(\)\[\]\{\}\-\_\,\.\:]+/g, ' ') // replace punctuation with space
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Automatically detects whether a member should be classified as 'advisor', 'leader', or 'member'
 */
export function detectMemberType(designation: string): 'advisor' | 'leader' | 'member' {
  if (!designation) return 'member';
  const norm = designation.trim();

  // 1. Advisor Check
  if (norm.includes('উপদেষ্টা') || norm.includes('উপদেস্টা') || norm.includes('পৃষ্ঠপোষক')) {
    return 'advisor';
  }

  // 2. Member Check (only if it doesn't contain leader keywords like সম্পাদক/সভাপতি/কোষাধ্যক্ষ)
  if (
    (norm.includes('সদস্য') || norm.includes('মেম্বার')) &&
    !norm.includes('সম্পাদক') &&
    !norm.includes('সভাপতি') &&
    !norm.includes('কোষাধ্যক্ষ') &&
    !norm.includes('ক্যাশিয়ার')
  ) {
    return 'member';
  }

  // 3. Leader Check (President, General Secretary, Secretaries, Treasurers, etc.)
  return 'leader';
}

/**
 * Calculate hierarchical rank based on designation title
 * Lower rank means higher precedence in the committee structure.
 */
export function getDesignationRank(designation: string, type?: 'advisor' | 'leader' | 'member'): number {
  if (!designation) return 9999;
  const d = designation.trim();

  // 1. Check exact match in PRESET_DESIGNATIONS first
  const exact = PRESET_DESIGNATIONS.find(p => p.title === d);
  if (exact) return exact.rank;

  const normalized = normalizeDesignation(d);

  // 2. Advisors Hierarchy (10 - 99)
  if (d.includes('প্রধান উপদেষ্টা') || normalized.includes('প্রধান উপদেষ্টা')) return 10;
  if (d.includes('উপদেষ্টা') || normalized.includes('উপদেষ্টা')) return 20;
  if (d.includes('পৃষ্ঠপোষক')) return 30;

  // 3. President / Vice President Hierarchy (100 - 199)
  if (d === 'সভাপতি' || normalized === 'সভাপতি' || d.includes('প্রধান সভাপতি')) return 100;
  if (d.includes('কার্যকরী সভাপতি') || d.includes('কার্যনির্বাহী সভাপতি')) return 110;
  if (d.includes('সিনিয়র সহ-সভাপতি') || d.includes('১ম সহ-সভাপতি') || d.includes('১নং সহ-সভাপতি')) return 120;
  if (d.includes('সহ-সভাপতি') || d.includes('সহ সভাপতি') || d.includes('সহসভাপতি') || normalized.includes('সহ সভাপতি')) return 130;

  // 4. General Secretary / Joint / Assistant Hierarchy (200 - 299)
  if (d === 'সাধারণ সম্পাদক' || normalized === 'সাধারণ সম্পাদক' || d.includes('প্রধান সম্পাদক') || d.includes('সেক্রেটারি')) return 200;
  if (d.includes('যুগ্ম সাধারণ সম্পাদক') || d.includes('যুগ্ম-সাধারণ সম্পাদক') || d.includes('যুগ্ম সম্পাদক') || d.includes('যুগ্ম-সম্পাদক')) return 210;
  if (d.includes('সহ-সাধারণ সম্পাদক') || d.includes('সহ সাধারণ সম্পাদক') || d.includes('সহসাধারণ সম্পাদক') || d.includes('সহ-সম্পাদক')) return 220;

  // 5. Organizing Secretary (300 - 399)
  if (d.includes('সহ-সাংগঠনিক সম্পাদক') || d.includes('সহ সাংগঠনিক সম্পাদক')) return 310;
  if (d.includes('সাংগঠনিক সম্পাদক') || normalized.includes('সাংগঠনিক সম্পাদক')) return 300;

  // 6. Finance / Treasurer Secretary (400 - 499)
  if (d.includes('সহ-অর্থ সম্পাদক') || d.includes('সহ অর্থ সম্পাদক') || d.includes('সহ-কোষাধ্যক্ষ') || d.includes('সহ-ক্যাশিয়ার')) return 410;
  if (d.includes('অর্থ সম্পাদক') || d.includes('কোষাধ্যক্ষ') || d.includes('ক্যাশিয়ার') || d.includes('হিসাব সম্পাদক')) return 400;

  // 7. Publicity / Publication (500 - 599)
  if (d.includes('সহ-প্রচার') || d.includes('সহ প্রচার')) return 510;
  if (d.includes('প্রচার') || d.includes('প্রকাশনা')) return 500;

  // 8. Office Secretary (600 - 699)
  if (d.includes('সহ-দপ্তর') || d.includes('সহ দপ্তর')) return 610;
  if (d.includes('দপ্তর সম্পাদক') || d.includes('দফতর সম্পাদক')) return 600;

  // 9. Expatriate Affairs (700 - 799)
  if (d.includes('সহ-প্রবাসী') || d.includes('সহ প্রবাসী')) return 710;
  if (d.includes('প্রবাসী') || d.includes('আন্তর্জাতিক')) return 700;

  // 10. Social Welfare (800 - 899)
  if (d.includes('সহ-সমাজকল্যাণ') || d.includes('সহ-সমাজসেবা')) return 810;
  if (d.includes('সমাজকল্যাণ') || d.includes('সমাজ সেবা')) return 800;

  // 11. Hospitality / Food (900 - 999)
  if (d.includes('সহ-আপ্যায়ন') || d.includes('সহ-খাদ্য')) return 910;
  if (d.includes('আপ্যায়ন') || d.includes('খাদ্য')) return 900;

  // 12. Security / Volunteer (1000 - 1099)
  if (d.includes('সহ-শৃঙ্খলা') || d.includes('সহ-স্বেচ্ছাসেবক') || d.includes('সহ-নিরাপত্তা')) return 1010;
  if (d.includes('শৃঙ্খলা') || d.includes('নিরাপত্তা') || d.includes('স্বেচ্ছাসেবক') || d.includes('আইন')) return 1000;

  // 13. Religious / Cultural (1100 - 1199)
  if (d.includes('সহ-ধর্ম') || d.includes('সহ-সাংস্কৃতিক')) return 1110;
  if (d.includes('ধর্ম বিষয়ক') || d.includes('সাংস্কৃতিক') || d.includes('তবারক')) return 1100;

  // 14. Education / Library (1200 - 1299)
  if (d.includes('সহ-শিক্ষা') || d.includes('সহ-পাঠাগার')) return 1210;
  if (d.includes('শিক্ষা') || d.includes('পাঠাগার')) return 1200;

  // 15. IT / Media (1300 - 1399)
  if (d.includes('সহ-তথ্য') || d.includes('সহ-আইটি') || d.includes('সহ-মিডিয়া')) return 1310;
  if (d.includes('তথ্য ও প্রযুক্তি') || d.includes('আইটি') || d.includes('মিডিয়া')) return 1300;

  // 16. Any Other Secretary
  if (d.startsWith('সহ-') || d.startsWith('সহ ')) return 1450;
  if (d.includes('সম্পাদক')) return 1400;

  // 17. Members Hierarchy (2000 - 2999)
  if (d.includes('সিনিয়র সদস্য') || normalized.includes('সিনিয়র সদস্য')) return 2000;
  if (d.includes('কার্যনির্বাহী সদস্য') || d.includes('কার্যকরী সদস্য')) return 2100;
  if (d.includes('সদস্য') || d.includes('মেম্বার')) return 2200;

  // Fallback depending on type
  const effectiveType = type || detectMemberType(d);
  if (effectiveType === 'advisor') return 50;
  if (effectiveType === 'leader') return 1500;
  return 2500;
}

/**
 * Sorts an array of CommitteeMember objects strictly according to Designation Hierarchy,
 * and seamlessly re-calculates continuous sequential `serialNo` (1, 2, 3, ... N).
 */
export function sortCommitteeMembers<T extends CommitteeMember>(membersList: T[]): T[] {
  if (!membersList || membersList.length === 0) return [];

  const typeOrder: Record<'advisor' | 'leader' | 'member', number> = {
    advisor: 1,
    leader: 2,
    member: 3,
  };

  // Create cloned array to sort
  const sorted = [...membersList].sort((a, b) => {
    // 1. Primary: Category/Type Order (Advisor -> Leader -> Member)
    const effectiveTypeA = a.type || detectMemberType(a.designation);
    const effectiveTypeB = b.type || detectMemberType(b.designation);

    const typeRankA = typeOrder[effectiveTypeA] ?? 99;
    const typeRankB = typeOrder[effectiveTypeB] ?? 99;

    if (typeRankA !== typeRankB) {
      return typeRankA - typeRankB;
    }

    // 2. Secondary: Designation Hierarchy Rank
    const rankA = getDesignationRank(a.designation, effectiveTypeA);
    const rankB = getDesignationRank(b.designation, effectiveTypeB);

    if (rankA !== rankB) {
      return rankA - rankB;
    }

    // 3. Tertiary: If same designation (e.g. two Vice Presidents or two Senior Members),
    // maintain previous serialNo or original order
    const serialA = typeof a.serialNo === 'number' && !isNaN(a.serialNo) ? a.serialNo : 9999;
    const serialB = typeof b.serialNo === 'number' && !isNaN(b.serialNo) ? b.serialNo : 9999;

    if (serialA !== serialB) {
      return serialA - serialB;
    }

    // 4. Stable fallback: compare names
    return a.name.localeCompare(b.name, 'bn');
  });

  // Re-assign continuous sequential serial numbers
  return sorted.map((member, index) => ({
    ...member,
    type: member.type || detectMemberType(member.designation),
    serialNo: index + 1,
  }));
}
