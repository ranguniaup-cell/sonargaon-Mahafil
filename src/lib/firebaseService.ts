import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  setDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  orderBy 
} from 'firebase/firestore';
import { db } from './firebase';
import { Transaction, CommitteeMember, InvitedScholar, ActivityService, MahfilDetails } from '../types';
import { initialTransactions, initialCommitteeMembers, initialScholars, initialActivities } from '../initialData';

// Collection Names
const TRANSACTIONS_COL = 'transactions';
const COMMITTEE_COL = 'committee';
const SCHOLARS_COL = 'scholars';
const ACTIVITIES_COL = 'activities';
const DETAILS_COL = 'details';
const DETAILS_DOC_ID = 'mahfil';

// 1. Transactions Services
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const q = query(collection(db, TRANSACTIONS_COL), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Seed if empty
      const list: Transaction[] = [];
      for (const t of initialTransactions) {
        await setDoc(doc(db, TRANSACTIONS_COL, t.id), t);
        list.push(t);
      }
      return list;
    }
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Transaction);
    });

    // Automatically check and append 2025 transactions if they are missing
    const has2025 = list.some((t) => t.year === 2025);
    if (!has2025) {
      for (const t of initialTransactions) {
        if (t.year === 2025) {
          await setDoc(doc(db, TRANSACTIONS_COL, t.id), t);
          list.push(t);
        }
      }
      // Re-sort descendending by date
      list.sort((a, b) => b.date.localeCompare(a.date));
    }

    return list;
  } catch (error) {
    console.error('Error fetching transactions:', error);
    return [];
  }
}

export async function addTransaction(t: Transaction): Promise<void> {
  await setDoc(doc(db, TRANSACTIONS_COL, t.id), t);
}

export async function deleteTransaction(id: string): Promise<void> {
  await deleteDoc(doc(db, TRANSACTIONS_COL, id));
}

// 2. Committee Services
export async function getCommitteeMembers(): Promise<CommitteeMember[]> {
  try {
    const snapshot = await getDocs(collection(db, COMMITTEE_COL));
    if (snapshot.empty) {
      // Seed if empty
      const list: CommitteeMember[] = [];
      for (const m of initialCommitteeMembers) {
        await setDoc(doc(db, COMMITTEE_COL, m.id), m);
        list.push(m);
      }
      return list;
    }
    const list: CommitteeMember[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CommitteeMember);
    });
    return list;
  } catch (error) {
    console.error('Error fetching committee members:', error);
    return [];
  }
}

export async function addCommitteeMember(m: CommitteeMember): Promise<void> {
  await setDoc(doc(db, COMMITTEE_COL, m.id), m);
}

export async function updateCommitteeMember(m: CommitteeMember): Promise<void> {
  await setDoc(doc(db, COMMITTEE_COL, m.id), m);
}

export async function deleteCommitteeMember(id: string): Promise<void> {
  await deleteDoc(doc(db, COMMITTEE_COL, id));
}

// 3. Scholars Services
export async function getScholars(): Promise<InvitedScholar[]> {
  try {
    const q = query(collection(db, SCHOLARS_COL), orderBy('serialNo', 'asc'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
      // Seed if empty
      const list: InvitedScholar[] = [];
      for (const s of initialScholars) {
        await setDoc(doc(db, SCHOLARS_COL, s.id), s);
        list.push(s);
      }
      return list.sort((a, b) => a.serialNo - b.serialNo);
    }
    const list: InvitedScholar[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as InvitedScholar);
    });
    return list.sort((a, b) => a.serialNo - b.serialNo);
  } catch (error) {
    console.error('Error fetching scholars:', error);
    return [];
  }
}

export async function addScholar(s: InvitedScholar): Promise<void> {
  await setDoc(doc(db, SCHOLARS_COL, s.id), s);
}

export async function updateScholar(s: InvitedScholar): Promise<void> {
  await setDoc(doc(db, SCHOLARS_COL, s.id), s);
}

export async function deleteScholar(id: string): Promise<void> {
  await deleteDoc(doc(db, SCHOLARS_COL, id));
}

// 4. Activities Services
export async function getActivities(): Promise<ActivityService[]> {
  try {
    const snapshot = await getDocs(collection(db, ACTIVITIES_COL));
    if (snapshot.empty) {
      // Seed if empty
      const list: ActivityService[] = [];
      for (const act of initialActivities) {
        await setDoc(doc(db, ACTIVITIES_COL, act.id), act);
        list.push(act);
      }
      return list;
    }
    const list: ActivityService[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ActivityService);
    });
    return list;
  } catch (error) {
    console.error('Error fetching activities:', error);
    return [];
  }
}

export async function addActivity(act: ActivityService): Promise<void> {
  await setDoc(doc(db, ACTIVITIES_COL, act.id), act);
}

export async function updateActivity(act: ActivityService): Promise<void> {
  await setDoc(doc(db, ACTIVITIES_COL, act.id), act);
}

export async function deleteActivity(id: string): Promise<void> {
  await deleteDoc(doc(db, ACTIVITIES_COL, id));
}

// 5. Mahfil Details Services
export async function getMahfilDetails(): Promise<MahfilDetails | null> {
  try {
    const docRef = doc(db, DETAILS_COL, DETAILS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      return docSnap.data() as MahfilDetails;
    } else {
      const defaultDetails: MahfilDetails = {
        date: '১২ই রবিউল আউয়াল ১৪৪৮ হিজরী (সম্ভাব্য ২০২৬ খ্রি.)',
        time: 'সকাল ৮:০০ ঘটিকা হতে বর্ণাঢ্য জশনে জুলুস এবং যোহরের নামাজের পর হতে মূল আজিমুশশান মাহফিল।',
        location: 'সোনারগাঁও সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন বিশাল ময়দান, রাঙ্গুনিয়া, চট্টগ্রাম।',
        targetDate: '2026-09-05'
      };
      await setDoc(docRef, defaultDetails);
      return defaultDetails;
    }
  } catch (error) {
    console.error('Error fetching mahfil details:', error);
    return null;
  }
}

export async function updateMahfilDetails(details: MahfilDetails): Promise<void> {
  await setDoc(doc(db, DETAILS_COL, DETAILS_DOC_ID), details);
}

// 6. Reset all to defaults in Firestore
export async function resetFirestoreData(): Promise<void> {
  // We can delete current items and re-seed
  // Transactions
  const transSnap = await getDocs(collection(db, TRANSACTIONS_COL));
  for (const docSnap of transSnap.docs) {
    await deleteDoc(doc(db, TRANSACTIONS_COL, docSnap.id));
  }
  for (const t of initialTransactions) {
    await setDoc(doc(db, TRANSACTIONS_COL, t.id), t);
  }

  // Committee
  const commSnap = await getDocs(collection(db, COMMITTEE_COL));
  for (const docSnap of commSnap.docs) {
    await deleteDoc(doc(db, COMMITTEE_COL, docSnap.id));
  }
  for (const m of initialCommitteeMembers) {
    await setDoc(doc(db, COMMITTEE_COL, m.id), m);
  }

  // Scholars
  const schSnap = await getDocs(collection(db, SCHOLARS_COL));
  for (const docSnap of schSnap.docs) {
    await deleteDoc(doc(db, SCHOLARS_COL, docSnap.id));
  }
  for (const s of initialScholars) {
    await setDoc(doc(db, SCHOLARS_COL, s.id), s);
  }

  // Activities
  const actSnap = await getDocs(collection(db, ACTIVITIES_COL));
  for (const docSnap of actSnap.docs) {
    await deleteDoc(doc(db, ACTIVITIES_COL, docSnap.id));
  }
  for (const act of initialActivities) {
    await setDoc(doc(db, ACTIVITIES_COL, act.id), act);
  }

  // Details
  const defaultDetails: MahfilDetails = {
    date: '১২ই রবিউল আউয়াল ১৪৪৮ হিজরী (সম্ভাব্য ২০২৬ খ্রি.)',
    time: 'সকাল ৮:০০ ঘটিকা হতে বর্ণাঢ্য জশনে জুলুস এবং যোহরের নামাজের পর হতে মূল আজিমুশশান মাহফিল।',
    location: 'সোনারগাঁও সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন বিশাল ময়দান, রাঙ্গুনিয়া, চট্টগ্রাম।',
    targetDate: '2026-09-05'
  };
  await setDoc(doc(db, DETAILS_COL, DETAILS_DOC_ID), defaultDetails);
}
