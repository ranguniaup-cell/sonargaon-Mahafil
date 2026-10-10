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
  orderBy,
  onSnapshot,
  increment,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { Transaction, CommitteeMember, InvitedScholar, ActivityService, MahfilDetails, GalleryPhoto, VisitorLog, VisitorSummary, ActiveSession } from '../types';
import { initialTransactions, initialCommitteeMembers, initialScholars, initialActivities, initialGalleryPhotos, initialMahfilDetails, initial2026Programs, initial2027Programs } from '../initialData';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Non-throwing logger for real-time listener callbacks
export function logFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('Firestore Listener Warning: ', JSON.stringify(errInfo));
}

// Helper to remove any undefined properties from object payloads before sending to Firestore
export function sanitizeForFirestore<T>(data: T): T {
  if (data === null || data === undefined) {
    return data;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeForFirestore(item)) as unknown as T;
  }
  if (typeof data === 'object') {
    const copy = {} as any;
    for (const key of Object.keys(data)) {
      const val = (data as any)[key];
      if (val !== undefined) {
        copy[key] = sanitizeForFirestore(val);
      }
    }
    return copy as T;
  }
  return data;
}

// Collection Names
const TRANSACTIONS_COL = 'transactions';
const COMMITTEE_COL = 'committee';
const SCHOLARS_COL = 'scholars';
const ACTIVITIES_COL = 'activities';
const GALLERY_COL = 'gallery';
const DETAILS_COL = 'details';
const DETAILS_DOC_ID = 'mahfil';

// Real-time Subscriptions
export function subscribeTransactions(onUpdate: (transactions: Transaction[]) => void, onError?: (error: any) => void): () => void {
  const q = query(collection(db, TRANSACTIONS_COL), orderBy('date', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const list: Transaction[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as Transaction);
    });
    
    // Sort descending by date
    list.sort((a, b) => b.date.localeCompare(a.date));
    onUpdate(list);
  }, (error) => {
    if (onError) onError(error);
    logFirestoreError(error, OperationType.GET, TRANSACTIONS_COL);
  });
}

export function subscribeCommitteeMembers(onUpdate: (members: CommitteeMember[]) => void, onError?: (error: any) => void): () => void {
  const q = collection(db, COMMITTEE_COL);
  return onSnapshot(q, (snapshot) => {
    const list: CommitteeMember[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as CommitteeMember);
    });
    onUpdate(list);
  }, (error) => {
    if (onError) onError(error);
    logFirestoreError(error, OperationType.GET, COMMITTEE_COL);
  });
}

export function subscribeScholars(onUpdate: (scholars: InvitedScholar[]) => void, onError?: (error: any) => void): () => void {
  const q = query(collection(db, SCHOLARS_COL), orderBy('serialNo', 'asc'));
  return onSnapshot(q, (snapshot) => {
    const list: InvitedScholar[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as InvitedScholar);
    });
    list.sort((a, b) => a.serialNo - b.serialNo);
    onUpdate(list);
  }, (error) => {
    if (onError) onError(error);
    logFirestoreError(error, OperationType.GET, SCHOLARS_COL);
  });
}

export function subscribeActivities(onUpdate: (activities: ActivityService[]) => void, onError?: (error: any) => void): () => void {
  const q = collection(db, ACTIVITIES_COL);
  return onSnapshot(q, (snapshot) => {
    const list: ActivityService[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as ActivityService);
    });
    onUpdate(list);
  }, (error) => {
    if (onError) onError(error);
    logFirestoreError(error, OperationType.GET, ACTIVITIES_COL);
  });
}

export function subscribeMahfilDetails(onUpdate: (details: MahfilDetails) => void, onError?: (error: any) => void): () => void {
  const docRef = doc(db, DETAILS_COL, DETAILS_DOC_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as MahfilDetails);
    }
  }, (error) => {
    if (onError) onError(error);
    logFirestoreError(error, OperationType.GET, `${DETAILS_COL}/${DETAILS_DOC_ID}`);
  });
}

// Helper for tracking deleted transaction IDs so initial transactions never resurrect if deleted
export function getDeletedTransactionIds(): Set<string> {
  try {
    const saved = localStorage.getItem('mahfil_deleted_tx_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  } catch {
    return new Set();
  }
}

export function recordDeletedTransactionIds(ids: string[]) {
  try {
    const current = getDeletedTransactionIds();
    ids.forEach((id) => current.add(id));
    localStorage.setItem('mahfil_deleted_tx_ids', JSON.stringify(Array.from(current)));
  } catch {}
}

// 1. Transactions Services
export async function getTransactions(): Promise<Transaction[]> {
  try {
    const q = query(collection(db, TRANSACTIONS_COL), orderBy('date', 'desc'));
    const snapshot = await getDocs(q);
    const wasInitialized = typeof window !== 'undefined' && localStorage.getItem('mahfil_db_tx_initialized');
    
    if (snapshot.empty) {
      // If previously initialized, it means user intentionally deleted/cleared transactions
      if (wasInitialized) {
        return [];
      }
      // Seed if brand new
      const list: Transaction[] = [];
      const deleted = getDeletedTransactionIds();
      for (const t of initialTransactions) {
        if (!deleted.has(t.id)) {
          await setDoc(doc(db, TRANSACTIONS_COL, t.id), t).catch(err => console.warn("Failed to seed transaction:", err));
          list.push(t);
        }
      }
      if (typeof window !== 'undefined') {
        localStorage.setItem('mahfil_db_tx_initialized', 'true');
      }
      return list;
    }

    if (typeof window !== 'undefined') {
      localStorage.setItem('mahfil_db_tx_initialized', 'true');
    }

    const list: Transaction[] = [];
    const deleted = getDeletedTransactionIds();
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as Transaction;
      if (!deleted.has(data.id)) {
        list.push(data);
      }
    });

    // Re-sort descending by date
    list.sort((a, b) => (b.date || '').localeCompare(a.date || ''));

    return list;
  } catch (error) {
    console.warn('Error fetching transactions, falling back to local initial transactions:', error);
    const deleted = getDeletedTransactionIds();
    return initialTransactions.filter((t) => !deleted.has(t.id));
  }
}

export async function addTransaction(t: Transaction): Promise<void> {
  try {
    await setDoc(doc(db, TRANSACTIONS_COL, t.id), sanitizeForFirestore(t));
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${TRANSACTIONS_COL}/${t.id}`);
  }
}

export async function batchAddTransactions(items: Transaction[]): Promise<void> {
  if (!items || items.length === 0) return;
  try {
    await Promise.all(
      items.map((item) =>
        setDoc(doc(db, TRANSACTIONS_COL, item.id), sanitizeForFirestore(item))
      )
    );
  } catch (error) {
    console.error('Batch add transactions error:', error);
    handleFirestoreError(error, OperationType.WRITE, TRANSACTIONS_COL);
  }
}

export async function updateTransaction(t: Transaction): Promise<void> {
  try {
    await setDoc(doc(db, TRANSACTIONS_COL, t.id), sanitizeForFirestore(t), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${TRANSACTIONS_COL}/${t.id}`);
  }
}

export async function deleteTransaction(id: string): Promise<void> {
  recordDeletedTransactionIds([id]);
  try {
    await deleteDoc(doc(db, TRANSACTIONS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${TRANSACTIONS_COL}/${id}`);
  }
}

export async function batchDeleteTransactions(ids: string[]): Promise<void> {
  if (!ids || ids.length === 0) return;
  recordDeletedTransactionIds(ids);
  try {
    await Promise.all(ids.map((id) => deleteDoc(doc(db, TRANSACTIONS_COL, id))));
  } catch (error) {
    console.error('Batch delete transactions error:', error);
    handleFirestoreError(error, OperationType.DELETE, TRANSACTIONS_COL);
  }
}

// 2. Committee Services
export async function getCommitteeMembers(): Promise<CommitteeMember[]> {
  try {
    const snapshot = await getDocs(collection(db, COMMITTEE_COL));
    if (snapshot.empty) {
      // Seed if empty
      const list: CommitteeMember[] = [];
      for (const m of initialCommitteeMembers) {
        await setDoc(doc(db, COMMITTEE_COL, m.id), m).catch(err => console.warn("Failed to seed member:", err));
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
    console.warn('Error fetching committee members, falling back to local initial members:', error);
    return initialCommitteeMembers;
  }
}

export async function addCommitteeMember(m: CommitteeMember): Promise<void> {
  try {
    await setDoc(doc(db, COMMITTEE_COL, m.id), m);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${COMMITTEE_COL}/${m.id}`);
  }
}

export async function updateCommitteeMember(m: CommitteeMember): Promise<void> {
  try {
    await setDoc(doc(db, COMMITTEE_COL, m.id), m);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${COMMITTEE_COL}/${m.id}`);
  }
}

export async function deleteCommitteeMember(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, COMMITTEE_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${COMMITTEE_COL}/${id}`);
  }
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
        await setDoc(doc(db, SCHOLARS_COL, s.id), s).catch(err => console.warn("Failed to seed scholar:", err));
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
    console.warn('Error fetching scholars, falling back to local initial scholars:', error);
    return initialScholars;
  }
}

export async function addScholar(s: InvitedScholar): Promise<void> {
  try {
    await setDoc(doc(db, SCHOLARS_COL, s.id), s);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${SCHOLARS_COL}/${s.id}`);
  }
}

export async function updateScholar(s: InvitedScholar): Promise<void> {
  try {
    await setDoc(doc(db, SCHOLARS_COL, s.id), s);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${SCHOLARS_COL}/${s.id}`);
  }
}

export async function deleteScholar(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, SCHOLARS_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${SCHOLARS_COL}/${id}`);
  }
}

// 4. Activities Services
export async function getActivities(): Promise<ActivityService[]> {
  try {
    const snapshot = await getDocs(collection(db, ACTIVITIES_COL));
    if (snapshot.empty) {
      // Seed if empty
      const list: ActivityService[] = [];
      for (const act of initialActivities) {
        await setDoc(doc(db, ACTIVITIES_COL, act.id), act).catch(err => console.warn("Failed to seed activity:", err));
        list.push(act);
      }
      return list;
    }
    const list: ActivityService[] = [];
    const existingIds = new Set<string>();
    snapshot.forEach((docSnap) => {
      const act = docSnap.data() as ActivityService;
      list.push(act);
      existingIds.add(act.id);
    });
    // Ensure all 2026 baseline activities exist
    for (const act of initialActivities) {
      if (!existingIds.has(act.id)) {
        list.push(act);
        setDoc(doc(db, ACTIVITIES_COL, act.id), act).catch(err => console.warn("Failed to seed missing activity:", err));
      }
    }
    return list;
  } catch (error) {
    console.warn('Error fetching activities, falling back to local initial activities:', error);
    return initialActivities;
  }
}

export async function addActivity(act: ActivityService): Promise<void> {
  try {
    await setDoc(doc(db, ACTIVITIES_COL, act.id), act);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${ACTIVITIES_COL}/${act.id}`);
  }
}

export async function updateActivity(act: ActivityService): Promise<void> {
  try {
    await setDoc(doc(db, ACTIVITIES_COL, act.id), act);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${ACTIVITIES_COL}/${act.id}`);
  }
}

export async function deleteActivity(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, ACTIVITIES_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${ACTIVITIES_COL}/${id}`);
  }
}

// 5. Mahfil Details Services
export async function getMahfilDetails(): Promise<MahfilDetails | null> {
  const defaultDetails: MahfilDetails = initialMahfilDetails;

  try {
    const docRef = doc(db, DETAILS_COL, DETAILS_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data() as MahfilDetails;
      // Auto-migrate legacy school field location if needed or revert erroneous 2027
      if (!data.year || data.year === 2027) {
        data.year = 2026;
        data.date = '১২ই রবিউল আউয়াল ১৪৪৮ হিজরী (সম্ভাব্য ০৫ সেপ্টেম্বর ২০২৬ খ্রি.)';
        data.time = 'সকাল ৮:০০ ঘটিকা হতে বর্ণাঢ্য জশনে জুলুস এবং যোহরের নামাজের পর হতে মূল আজিমুশশান মাহফিল।';
        data.location = 'সোনারগাঁও সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন সুবিশাল ময়দান, রাঙ্গুনিয়া, চট্টগ্রাম।';
        data.targetDate = '2026-09-05';
        data.theme = 'বিশ্বশান্তি প্রতিষ্ঠায় রাসূলুল্লাহ (দঃ) এর জীবনাদর্শই একমাত্র মুক্তির পথ';
        data.programs = initial2026Programs;
        setDoc(docRef, sanitizeForFirestore(data)).catch(err => console.warn("Failed to auto-update 2026 mahfil details in Firestore:", err));
      }
      // Populate defaults if missing
      if (!data.programs || data.programs.length === 0) {
        data.programs = initial2026Programs;
      }
      return data;
    } else {
      await setDoc(docRef, sanitizeForFirestore(defaultDetails)).catch(err => console.warn("Failed to set default details in Firestore:", err));
      return defaultDetails;
    }
  } catch (error) {
    console.warn('Error fetching mahfil details, falling back to local default details:', error);
    return defaultDetails;
  }
}

export async function updateMahfilDetails(details: MahfilDetails): Promise<void> {
  try {
    await setDoc(doc(db, DETAILS_COL, DETAILS_DOC_ID), sanitizeForFirestore(details));
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${DETAILS_COL}/${DETAILS_DOC_ID}`);
  }
}

// 5.5 Houses Config Services
const HOUSES_DOC_ID = 'houses';

export interface HousesConfig {
  activeHouses: string[];
  deletedHouses: string[];
  donorOrders?: Record<string, string[]>;
}

export function subscribeHousesConfig(onUpdate: (config: HousesConfig) => void, onError?: (error: any) => void): () => void {
  const docRef = doc(db, DETAILS_COL, HOUSES_DOC_ID);
  return onSnapshot(docRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as HousesConfig);
    }
  }, (error) => {
    if (onError) onError(error);
    logFirestoreError(error, OperationType.GET, `${DETAILS_COL}/${HOUSES_DOC_ID}`);
  });
}

export async function getHousesConfig(): Promise<HousesConfig> {
  const defaultHousesConfig: HousesConfig = {
    activeHouses: [
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
    ],
    deletedHouses: [],
    donorOrders: {}
  };

  try {
    const docRef = doc(db, DETAILS_COL, HOUSES_DOC_ID);
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      return {
        activeHouses: data.activeHouses || defaultHousesConfig.activeHouses,
        deletedHouses: data.deletedHouses || defaultHousesConfig.deletedHouses,
        donorOrders: data.donorOrders || {}
      };
    } else {
      await setDoc(docRef, defaultHousesConfig).catch(err => console.warn("Failed to set default houses in Firestore:", err));
      return defaultHousesConfig;
    }
  } catch (error) {
    console.warn('Error fetching houses config, falling back to local defaults:', error);
    return defaultHousesConfig;
  }
}

export async function updateHousesConfig(config: Partial<HousesConfig>): Promise<void> {
  try {
    await setDoc(doc(db, DETAILS_COL, HOUSES_DOC_ID), sanitizeForFirestore(config), { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${DETAILS_COL}/${HOUSES_DOC_ID}`);
  }
}

// 5.6 Gallery Photos Services
export function subscribeGalleryPhotos(onUpdate: (photos: GalleryPhoto[]) => void, onError?: (error: any) => void): () => void {
  const q = collection(db, GALLERY_COL);
  return onSnapshot(q, (snapshot) => {
    const list: GalleryPhoto[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as GalleryPhoto);
    });
    list.sort((a, b) => (a.serialNo ?? 999) - (b.serialNo ?? 999));
    onUpdate(list);
  }, (error) => {
    if (onError) onError(error);
    logFirestoreError(error, OperationType.GET, GALLERY_COL);
  });
}

export async function getGalleryPhotos(): Promise<GalleryPhoto[]> {
  try {
    const snapshot = await getDocs(collection(db, GALLERY_COL));
    if (snapshot.empty) {
      // Seed if empty
      const list: GalleryPhoto[] = [];
      for (const photo of initialGalleryPhotos) {
        await setDoc(doc(db, GALLERY_COL, photo.id), photo).catch(err => console.warn("Failed to seed photo:", err));
        list.push(photo);
      }
      return list.sort((a, b) => (a.serialNo ?? 999) - (b.serialNo ?? 999));
    }
    const list: GalleryPhoto[] = [];
    snapshot.forEach((docSnap) => {
      list.push(docSnap.data() as GalleryPhoto);
    });
    return list.sort((a, b) => (a.serialNo ?? 999) - (b.serialNo ?? 999));
  } catch (error) {
    console.warn('Error fetching gallery photos, falling back to local initial gallery:', error);
    return initialGalleryPhotos;
  }
}

export async function addGalleryPhoto(photo: GalleryPhoto): Promise<void> {
  try {
    const sanitized = sanitizeForFirestore(photo);
    await setDoc(doc(db, GALLERY_COL, photo.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${GALLERY_COL}/${photo.id}`);
  }
}

export async function updateGalleryPhoto(photo: GalleryPhoto): Promise<void> {
  try {
    const sanitized = sanitizeForFirestore(photo);
    await setDoc(doc(db, GALLERY_COL, photo.id), sanitized);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${GALLERY_COL}/${photo.id}`);
  }
}

export async function deleteGalleryPhoto(id: string): Promise<void> {
  try {
    await deleteDoc(doc(db, GALLERY_COL, id));
  } catch (error) {
    handleFirestoreError(error, OperationType.DELETE, `${GALLERY_COL}/${id}`);
  }
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

  // Gallery Photos
  const galSnap = await getDocs(collection(db, GALLERY_COL));
  for (const docSnap of galSnap.docs) {
    await deleteDoc(doc(db, GALLERY_COL, docSnap.id));
  }
  for (const photo of initialGalleryPhotos) {
    await setDoc(doc(db, GALLERY_COL, photo.id), photo);
  }

  // Details
  await setDoc(doc(db, DETAILS_COL, DETAILS_DOC_ID), sanitizeForFirestore(initialMahfilDetails));

  // Houses Config default
  const defaultHousesConfig = {
    activeHouses: [
      'বৈদ্ব বাড়ী',
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
    ],
    deletedHouses: []
  };
  await setDoc(doc(db, DETAILS_COL, HOUSES_DOC_ID), defaultHousesConfig);
}

// -------------------------------------------------------------
// VISITOR ANALYTICS & REAL-TIME TRAFFIC TRACKING
// -------------------------------------------------------------

const ANALYTICS_COL = 'analytics';
const VISITORS_SUMMARY_DOC = 'visitors_summary';
const VISITOR_LOGS_COL = 'visitor_logs';
const ACTIVE_SESSIONS_COL = 'active_sessions';

export function getClientDeviceInfo(): {
  visitorId: string;
  sessionId: string;
  isNew: boolean;
  device: 'mobile' | 'desktop' | 'tablet';
  browser: string;
  os: string;
} {
  let visitorId = '';
  let isNew = false;
  try {
    const stored = localStorage.getItem('mahfil_visitor_id');
    if (stored) {
      visitorId = stored;
    } else {
      visitorId = 'v_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      localStorage.setItem('mahfil_visitor_id', visitorId);
      isNew = true;
    }
  } catch {
    visitorId = 'v_anon_' + Date.now();
  }

  let sessionId = '';
  try {
    const sess = sessionStorage.getItem('mahfil_session_id');
    if (sess) {
      sessionId = sess;
    } else {
      sessionId = 's_' + Math.random().toString(36).substring(2, 9) + '_' + Date.now().toString(36);
      sessionStorage.setItem('mahfil_session_id', sessionId);
    }
  } catch {
    sessionId = 's_anon_' + Date.now();
  }

  const ua = typeof navigator !== 'undefined' ? navigator.userAgent : '';
  
  // Detect device
  let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/(tablet|ipad|playbook|silk)|(android(?!.*mobi))/i.test(ua)) {
    device = 'tablet';
  } else if (/Mobile|Android|iP(hone|od)|IEMobile|BlackBerry|Kindle|Silk-Accelerated|(hpw|web)OS|Opera M(obi|ini)/i.test(ua)) {
    device = 'mobile';
  } else if (typeof window !== 'undefined' && window.innerWidth <= 768) {
    device = 'mobile';
  }

  // Detect browser
  let browser = 'Chrome';
  if (ua.includes('Firefox')) browser = 'Firefox';
  else if (ua.includes('SamsungBrowser')) browser = 'Samsung Internet';
  else if (ua.includes('Opera') || ua.includes('OPR')) browser = 'Opera';
  else if (ua.includes('Edge') || ua.includes('Edg/')) browser = 'Edge';
  else if (ua.includes('Safari') && !ua.includes('Chrome')) browser = 'Safari';
  else if (ua.includes('Chrome')) browser = 'Chrome';
  else browser = 'অন্যান্য';

  // Detect OS
  let os = 'Unknown';
  if (ua.includes('Windows')) os = 'Windows';
  else if (ua.includes('Android')) os = 'Android';
  else if (ua.includes('iPhone') || ua.includes('iPad') || ua.includes('iOS')) os = 'iOS';
  else if (ua.includes('Mac OS') || ua.includes('Macintosh')) os = 'macOS';
  else if (ua.includes('Linux')) os = 'Linux';

  return { visitorId, sessionId, isNew, device, browser, os };
}

// Track a visit in Firestore
export async function recordWebsiteVisit(pageName: string = 'মূল পাতা'): Promise<void> {
  try {
    const info = getClientDeviceInfo();
    const now = new Date();
    const dateKey = now.toISOString().slice(0, 10); // YYYY-MM-DD
    const timeStr = now.toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });

    // Clean page name for firestore field path safety
    const safePage = pageName.replace(/[./[\]*~]/g, '_');
    const safeBrowser = info.browser.replace(/[./[\]*~]/g, '_');

    // 1. Update Aggregate Summary Doc
    const summaryRef = doc(db, ANALYTICS_COL, VISITORS_SUMMARY_DOC);
    
    // Check if doc exists
    const summarySnap = await getDoc(summaryRef);
    if (!summarySnap.exists()) {
      const initialSummary: VisitorSummary = {
        totalVisits: 1,
        uniqueVisitors: 1,
        todayVisits: 1,
        activeNow: 1,
        dailyVisits: { [dateKey]: 1 },
        deviceBreakdown: {
          mobile: info.device === 'mobile' ? 1 : 0,
          desktop: info.device === 'desktop' ? 1 : 0,
          tablet: info.device === 'tablet' ? 1 : 0
        },
        browserBreakdown: { [safeBrowser]: 1 },
        pageBreakdown: { [safePage]: 1 },
        lastUpdated: Date.now()
      };
      await setDoc(summaryRef, initialSummary);
    } else {
      const updatePayload: Record<string, any> = {
        totalVisits: increment(1),
        [`dailyVisits.${dateKey}`]: increment(1),
        [`deviceBreakdown.${info.device}`]: increment(1),
        [`browserBreakdown.${safeBrowser}`]: increment(1),
        [`pageBreakdown.${safePage}`]: increment(1),
        lastUpdated: Date.now()
      };

      if (info.isNew) {
        updatePayload.uniqueVisitors = increment(1);
      }

      await updateDoc(summaryRef, updatePayload);
    }

    // 2. Add Live Visitor Activity Log
    const logDoc: Omit<VisitorLog, 'id'> = {
      timestamp: Date.now(),
      date: dateKey,
      time: timeStr,
      page: pageName,
      device: info.device,
      browser: info.browser,
      os: info.os,
      visitorId: info.visitorId,
      isNew: info.isNew
    };
    await addDoc(collection(db, VISITOR_LOGS_COL), logDoc);

    // 3. Update Active Session Heartbeat
    const sessionRef = doc(db, ACTIVE_SESSIONS_COL, info.sessionId);
    await setDoc(sessionRef, {
      sessionId: info.sessionId,
      visitorId: info.visitorId,
      lastActive: Date.now(),
      device: info.device,
      browser: info.browser,
      os: info.os,
      page: pageName
    }, { merge: true });

  } catch (error) {
    console.warn('Analytics tracking warning (non-fatal):', error);
  }
}

// Session Heartbeat for Live online status
export async function sendSessionHeartbeat(pageName: string = 'মূল পাতা'): Promise<void> {
  try {
    const info = getClientDeviceInfo();
    const sessionRef = doc(db, ACTIVE_SESSIONS_COL, info.sessionId);
    await setDoc(sessionRef, {
      lastActive: Date.now(),
      page: pageName
    }, { merge: true });
  } catch {
    // Silent fail
  }
}

// Subscribe to Visitor Summary
export function subscribeVisitorSummary(onUpdate: (summary: VisitorSummary | null) => void): () => void {
  const summaryRef = doc(db, ANALYTICS_COL, VISITORS_SUMMARY_DOC);
  return onSnapshot(summaryRef, (docSnap) => {
    if (docSnap.exists()) {
      onUpdate(docSnap.data() as VisitorSummary);
    } else {
      onUpdate(null);
    }
  }, (error) => {
    console.warn('Error fetching visitor summary:', error);
  });
}

// Subscribe to Active Live Sessions (Online Visitors)
export function subscribeActiveSessions(onUpdate: (sessions: ActiveSession[], activeCount: number) => void): () => void {
  const sessionsRef = collection(db, ACTIVE_SESSIONS_COL);
  return onSnapshot(sessionsRef, (snapshot) => {
    const now = Date.now();
    const ACTIVE_THRESHOLD_MS = 3.5 * 60 * 1000; // 3.5 minutes
    const validSessions: ActiveSession[] = [];
    
    snapshot.forEach((docSnap) => {
      const data = docSnap.data() as ActiveSession;
      if (data && data.lastActive && (now - data.lastActive) < ACTIVE_THRESHOLD_MS) {
        validSessions.push(data);
      }
    });

    // Unique visitors currently online
    const uniqueVisitorIds = new Set(validSessions.map(s => s.visitorId));
    const activeCount = Math.max(validSessions.length, uniqueVisitorIds.size);

    onUpdate(validSessions, activeCount);
  }, (error) => {
    console.warn('Error fetching active sessions:', error);
  });
}

// Subscribe to Recent Visitor Logs
export function subscribeVisitorLogs(onUpdate: (logs: VisitorLog[]) => void, maxCount: number = 30): () => void {
  const q = query(
    collection(db, VISITOR_LOGS_COL),
    orderBy('timestamp', 'desc'),
    limit(maxCount)
  );

  return onSnapshot(q, (snapshot) => {
    const list: VisitorLog[] = [];
    snapshot.forEach((docSnap) => {
      list.push({ id: docSnap.id, ...docSnap.data() } as VisitorLog);
    });
    onUpdate(list);
  }, (error) => {
    console.warn('Error fetching visitor logs:', error);
  });
}

// Reset Visitor Analytics
export async function resetVisitorAnalytics(): Promise<void> {
  const now = new Date();
  const dateKey = now.toISOString().slice(0, 10);
  const initialSummary: VisitorSummary = {
    totalVisits: 0,
    uniqueVisitors: 0,
    todayVisits: 0,
    activeNow: 0,
    dailyVisits: { [dateKey]: 0 },
    deviceBreakdown: { mobile: 0, desktop: 0, tablet: 0 },
    browserBreakdown: {},
    pageBreakdown: {},
    lastUpdated: Date.now()
  };
  await setDoc(doc(db, ANALYTICS_COL, VISITORS_SUMMARY_DOC), initialSummary);

  // Clean old logs
  try {
    const logsSnap = await getDocs(collection(db, VISITOR_LOGS_COL));
    for (const docSnap of logsSnap.docs) {
      await deleteDoc(doc(db, VISITOR_LOGS_COL, docSnap.id));
    }
  } catch (e) {
    console.warn('Log cleanup error:', e);
  }
}
