import React from 'react';
import Header from './components/Header';
import HomeSection from './components/HomeSection';
import CommitteeSection from './components/CommitteeSection';
import HouseDonationsSection from './components/HouseDonationsSection';
import HouseReportSection from './components/HouseReportSection';
import FinanceSection from './components/FinanceSection';
import ReportSection from './components/ReportSection';
import CPanelSection from './components/CPanelSection';
import ManualFinancialPostingSection from './components/ManualFinancialPostingSection';
import PostingSection from './components/PostingSection';
import Footer from './components/Footer';

import { Transaction, CommitteeMember, MahfilDetails, InvitedScholar, ActivityService, GalleryPhoto, VisitorSummary, ActiveSession, VisitorLog } from './types';
import { initialTransactions, initialCommitteeMembers, initialScholars, initialActivities, initialGalleryPhotos, initialMahfilDetails } from './initialData';
import { 
  getTransactions, 
  addTransaction, 
  batchAddTransactions,
  updateTransaction,
  deleteTransaction, 
  getCommitteeMembers, 
  addCommitteeMember, 
  updateCommitteeMember, 
  deleteCommitteeMember, 
  getScholars, 
  addScholar, 
  updateScholar, 
  deleteScholar, 
  getActivities, 
  addActivity, 
  updateActivity, 
  deleteActivity, 
  getGalleryPhotos,
  addGalleryPhoto,
  updateGalleryPhoto,
  deleteGalleryPhoto,
  getMahfilDetails, 
  updateMahfilDetails,
  resetFirestoreData,
  subscribeTransactions,
  subscribeCommitteeMembers,
  subscribeScholars,
  subscribeActivities,
  subscribeGalleryPhotos,
  subscribeMahfilDetails,
  subscribeHousesConfig,
  getHousesConfig,
  updateHousesConfig,
  recordWebsiteVisit,
  sendSessionHeartbeat,
  subscribeVisitorSummary,
  subscribeActiveSessions,
  subscribeVisitorLogs,
  resetVisitorAnalytics
} from './lib/firebaseService';
import { sortCommitteeMembers, detectMemberType } from './lib/designationHierarchy';

export default function App() {
  const [activeTab, setActiveTab] = React.useState<string>('home');
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [committeeMembers, setCommitteeMembers] = React.useState<CommitteeMember[]>([]);
  const [scholars, setScholars] = React.useState<InvitedScholar[]>([]);
  const [activities, setActivities] = React.useState<ActivityService[]>([]);
  const [galleryPhotos, setGalleryPhotos] = React.useState<GalleryPhoto[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mahfilDetails, setMahfilDetails] = React.useState<MahfilDetails>(initialMahfilDetails);
  const [activeHouses, setActiveHouses] = React.useState<string[]>([
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
  ]);
  const [deletedHouses, setDeletedHouses] = React.useState<string[]>([]);
  const [donorOrders, setDonorOrders] = React.useState<Record<string, string[]>>(() => {
    try {
      const saved = localStorage.getItem('mahfil_donor_orders');
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });
  const [visitorSummary, setVisitorSummary] = React.useState<VisitorSummary | null>(null);
  const [activeSessions, setActiveSessions] = React.useState<ActiveSession[]>([]);
  const [activeVisitorCount, setActiveVisitorCount] = React.useState<number>(1);
  const [visitorLogs, setVisitorLogs] = React.useState<VisitorLog[]>([]);

  // Record visitor & start live heartbeat
  React.useEffect(() => {
    // Record page visit
    recordWebsiteVisit(activeTab).catch((err) => {
      console.warn('Analytics visit record skipped:', err);
    });

    // Send initial session heartbeat
    sendSessionHeartbeat(activeTab).catch((err) => {
      console.warn('Session heartbeat initial failed:', err);
    });

    // Heartbeat every 45 seconds to keep session alive in Firestore
    const heartbeatInterval = setInterval(() => {
      sendSessionHeartbeat(activeTab).catch((err) => {
        console.warn('Session heartbeat interval failed:', err);
      });
    }, 45000);

    return () => {
      clearInterval(heartbeatInterval);
    };
  }, [activeTab]);

  // Initialize data on mount from Firebase and subscribe to real-time updates
  React.useEffect(() => {
    let unsubTransactions: (() => void) | null = null;
    let unsubCommittee: (() => void) | null = null;
    let unsubScholars: (() => void) | null = null;
    let unsubActivities: (() => void) | null = null;
    let unsubGallery: (() => void) | null = null;
    let unsubDetails: (() => void) | null = null;
    let unsubHouses: (() => void) | null = null;
    let unsubSummary: (() => void) | null = null;
    let unsubActive: (() => void) | null = null;
    let unsubLogs: (() => void) | null = null;

    async function loadInitialAndSubscribe() {
      try {
        setIsLoading(true);
        // Call initial fetch functions to make sure Firestore is seeded if empty
        const [trans, comm, sch, act, photos, det, housesConfig] = await Promise.all([
          getTransactions(),
          getCommitteeMembers(),
          getScholars(),
          getActivities(),
          getGalleryPhotos(),
          getMahfilDetails(),
          getHousesConfig()
        ]);
        
        setTransactions(trans);
        setCommitteeMembers(sortCommitteeMembers(comm));
        setGalleryPhotos(photos || []);
        if (housesConfig) {
          if (housesConfig.activeHouses) setActiveHouses(housesConfig.activeHouses);
          if (housesConfig.deletedHouses) setDeletedHouses(housesConfig.deletedHouses);
        }
        
        // Ensure presidency scholar (serialNo 1) is present and correct in Firestore
        let currentScholars = [...sch];
        const s0Index = currentScholars.findIndex(s => s.id === 's0');
        const presScholar: InvitedScholar = {
          id: 's0',
          name: 'ছৈয়দ মুহাম্মদ মছিহুদ্দৌলা(মা:জি:আ:)',
          title: 'মহাসচিব -আহলে সুন্নাত ওয়াল জামা\'য়াত বাংলাদেশ। সাজ্জাদানশীল, ছৈয়দ বাড়ী দরবার শরীফ, ফটিকছড়ি',
          topic: 'সভাপতিত্ব করবেন',
          serialNo: 1
        };

        if (s0Index === -1) {
          console.log('Seeding presidency scholar...');
          await addScholar(presScholar).catch(err => console.error('Failed to auto-seed presidency scholar:', err));
          currentScholars.push(presScholar);
        } else {
          const existing = currentScholars[s0Index];
          if (existing.name !== presScholar.name || existing.title !== presScholar.title || existing.serialNo !== 1) {
            console.log('Updating presidency scholar info...');
            await updateScholar(presScholar).catch(err => console.error('Failed to update presidency scholar:', err));
            currentScholars[s0Index] = presScholar;
          }
        }

        // Align and update rest of the scholars s1, s2, s3
        for (const s of currentScholars) {
          if (s.id === 's1' && s.serialNo !== 2) {
            s.serialNo = 2;
            await updateScholar(s).catch(err => console.error('Failed to align s1 serialNo:', err));
          } else if (s.id === 's2' && s.serialNo !== 3) {
            s.serialNo = 3;
            await updateScholar(s).catch(err => console.error('Failed to align s2 serialNo:', err));
          } else if (s.id === 's3' && s.serialNo !== 4) {
            s.serialNo = 4;
            await updateScholar(s).catch(err => console.error('Failed to align s3 serialNo:', err));
          }
        }

        setScholars(currentScholars.sort((a, b) => a.serialNo - b.serialNo));

        setActivities(act);
        if (det) {
          setMahfilDetails(det);
        }
      } catch (err) {
        console.error('Error loading initial data from Firestore:', err);
      } finally {
        setIsLoading(false);
      }

      // Establish real-time sync listeners across both mobile and PC
      unsubTransactions = subscribeTransactions((list) => {
        setTransactions(list);
      });
      unsubCommittee = subscribeCommitteeMembers((list) => {
        setCommitteeMembers(sortCommitteeMembers(list));
      });
      unsubScholars = subscribeScholars((list) => {
        setScholars(list);
      });
      unsubActivities = subscribeActivities((list) => {
        setActivities(list);
      });
      unsubGallery = subscribeGalleryPhotos((list) => {
        setGalleryPhotos(list);
      });
      unsubDetails = subscribeMahfilDetails((det) => {
        if (det) {
          setMahfilDetails(det);
        }
      });
      unsubHouses = subscribeHousesConfig((config) => {
        if (config) {
          if (config.activeHouses) setActiveHouses(config.activeHouses);
          if (config.deletedHouses) setDeletedHouses(config.deletedHouses);
          if (config.donorOrders) {
            setDonorOrders(config.donorOrders);
            try {
              localStorage.setItem('mahfil_donor_orders', JSON.stringify(config.donorOrders));
            } catch {}
          }
        }
      });

      // Real-time visitor analytics listeners
      unsubSummary = subscribeVisitorSummary((sum) => {
        if (sum) setVisitorSummary(sum);
      });
      unsubActive = subscribeActiveSessions((sessions, count) => {
        setActiveSessions(sessions);
        setActiveVisitorCount(count);
      });
      unsubLogs = subscribeVisitorLogs((logs) => {
        setVisitorLogs(logs);
      });
    }
    
    loadInitialAndSubscribe();

    // 3. Admin State (optional transient checkout)
    const adminSession = sessionStorage.getItem('mahfil_admin_logged');
    if (adminSession === 'true') {
      setIsAdminLoggedIn(true);
    }

    // Clean up real-time snapshot listeners on component unmount
    return () => {
      if (unsubTransactions) unsubTransactions();
      if (unsubCommittee) unsubCommittee();
      if (unsubScholars) unsubScholars();
      if (unsubActivities) unsubActivities();
      if (unsubGallery) unsubGallery();
      if (unsubDetails) unsubDetails();
      if (unsubHouses) unsubHouses();
      if (unsubSummary) unsubSummary();
      if (unsubActive) unsubActive();
      if (unsubLogs) unsubLogs();
    };
  }, []);

  // Update session storage for admin login state
  const handleAdminLoginStateChange = (status: boolean) => {
    setIsAdminLoggedIn(status);
    if (status) {
      sessionStorage.setItem('mahfil_admin_logged', 'true');
    } else {
      sessionStorage.removeItem('mahfil_admin_logged');
      if (activeTab === 'house-donations' || activeTab === 'manual-posting' || activeTab === 'house-report' || activeTab === 'admin') {
        setActiveTab('home');
      }
    }
  };

  const handleUpdateHousesConfig = async (updatedActive: string[], updatedDeleted: string[]) => {
    setActiveHouses(updatedActive);
    setDeletedHouses(updatedDeleted);
    try {
      await updateHousesConfig({ activeHouses: updatedActive, deletedHouses: updatedDeleted });
    } catch (e) {
      console.error("Failed to save updated houses config to Firestore:", e);
    }
  };

  const handleUpdateDonorOrder = async (key: string, orderedIds: string[]) => {
    const updated = { ...donorOrders, [key]: orderedIds };
    setDonorOrders(updated);
    try {
      localStorage.setItem('mahfil_donor_orders', JSON.stringify(updated));
    } catch {}
    try {
      await updateHousesConfig({ donorOrders: updated });
    } catch (e) {
      console.error("Failed to update donor order in Firestore:", e);
    }
  };

  const handleAddHouse = async (houseName: string) => {
    const trimmed = houseName.trim();
    if (!trimmed) return;
    
    let updatedActive = [...activeHouses];
    let updatedDeleted = deletedHouses.filter(h => h !== trimmed);
    
    if (!updatedActive.includes(trimmed)) {
      updatedActive.push(trimmed);
    }
    
    await handleUpdateHousesConfig(updatedActive, updatedDeleted);
  };

  // Helper to verify admin authority before any posting or database mutation
  const checkAdminAuth = (): boolean => {
    const isAuthorized = isAdminLoggedIn || sessionStorage.getItem('mahfil_admin_logged') === 'true';
    if (!isAuthorized) {
      console.warn('পোস্টিং বা লেনদেন পরিবর্তন ব্যর্থ: শুধুমাত্র দায়িত্বপ্রাপ্ত অ্যাডমিন পোস্টিং করতে পারবেন।');
      return false;
    }
    return true;
  };

  // 1. Transaction Handlers
  const generateUniqueTxId = (prefix = 't') => {
    return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
  };

  const handleAddTransaction = async (newT: Omit<Transaction, 'id'>) => {
    if (!checkAdminAuth()) return;
    const id = generateUniqueTxId();
    const item: Transaction = {
      ...newT,
      id,
      createdAt: newT.createdAt || Date.now()
    };
    setTransactions((prev) => [item, ...prev]);
    try {
      await addTransaction(item);
    } catch (e) {
      console.error('Add transaction error:', e);
    }
  };

  const handleBatchAddTransactions = async (newItems: Omit<Transaction, 'id'>[]) => {
    if (!checkAdminAuth()) return;
    if (!newItems || newItems.length === 0) return;
    const baseTime = Date.now();
    const itemsWithIds: Transaction[] = newItems.map((item, idx) => ({
      ...item,
      id: `${generateUniqueTxId()}_${idx}`,
      createdAt: item.createdAt || (baseTime + idx)
    }));

    setTransactions((prev) => [...itemsWithIds, ...prev]);

    try {
      await batchAddTransactions(itemsWithIds);
    } catch (e) {
      console.error('Batch add error in App.tsx:', e);
      for (const it of itemsWithIds) {
        await addTransaction(it).catch((err) => console.error(err));
      }
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    if (!checkAdminAuth()) return;
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    try {
      await deleteTransaction(id);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateTransaction = async (updatedT: Transaction) => {
    if (!checkAdminAuth()) return;
    const updated = transactions.map((t) => t.id === updatedT.id ? updatedT : t);
    setTransactions(updated);
    try {
      await updateTransaction(updatedT);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Member Handlers (Automatically sorted by designation hierarchy)
  const handleAddMember = async (newM: Omit<CommitteeMember, 'id'>) => {
    if (!checkAdminAuth()) return;
    const id = 'm_' + Date.now();
    const rawItem: CommitteeMember = {
      ...newM,
      type: newM.type || detectMemberType(newM.designation),
      id,
    };
    const updated = sortCommitteeMembers([...committeeMembers, rawItem]);
    setCommitteeMembers(updated);
    try {
      // Save all updated members with their newly calculated continuous serial numbers
      await Promise.all(updated.map((m) => addCommitteeMember(m)));
    } catch (e) {
      console.error('Error adding committee member:', e);
    }
  };

  const handleUpdateMember = async (updatedM: CommitteeMember) => {
    if (!checkAdminAuth()) return;
    const formatted: CommitteeMember = {
      ...updatedM,
      type: updatedM.type || detectMemberType(updatedM.designation),
    };
    const list = committeeMembers.map((m) => m.id === formatted.id ? formatted : m);
    const updated = sortCommitteeMembers(list);
    setCommitteeMembers(updated);
    try {
      await Promise.all(updated.map((m) => updateCommitteeMember(m)));
    } catch (e) {
      console.error('Error updating committee member:', e);
    }
  };

  const handleDeleteMember = async (id: string) => {
    if (!checkAdminAuth()) return;
    const updated = sortCommitteeMembers(committeeMembers.filter((m) => m.id !== id));
    setCommitteeMembers(updated);
    try {
      await deleteCommitteeMember(id);
      await Promise.all(updated.map((m) => updateCommitteeMember(m)));
    } catch (e) {
      console.error('Error deleting committee member:', e);
    }
  };

  // 3. Mahfil Details Handlers
  const handleUpdateMahfilDetails = async (updatedDetails: MahfilDetails) => {
    if (!checkAdminAuth()) return;
    setMahfilDetails(updatedDetails);
    try {
      await updateMahfilDetails(updatedDetails);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Scholar Handlers
  const handleAddScholar = async (newS: Omit<InvitedScholar, 'id'>) => {
    if (!checkAdminAuth()) return;
    const id = 's_' + Date.now();
    const item = { ...newS, id };
    const updated = [...scholars, item].sort((a, b) => a.serialNo - b.serialNo);
    setScholars(updated);
    try {
      await addScholar(item);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateScholar = async (updatedS: InvitedScholar) => {
    if (!checkAdminAuth()) return;
    const updated = scholars.map((s) => s.id === updatedS.id ? updatedS : s).sort((a, b) => a.serialNo - b.serialNo);
    setScholars(updated);
    try {
      await updateScholar(updatedS);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteScholar = async (id: string) => {
    if (!checkAdminAuth()) return;
    const updated = scholars.filter((s) => s.id !== id);
    setScholars(updated);
    try {
      await deleteScholar(id);
    } catch (e) {
      console.error(e);
    }
  };

  // 5. Activity Handlers
  const handleAddActivity = async (newAct: Omit<ActivityService, 'id'>) => {
    if (!checkAdminAuth()) return;
    const id = 'act_' + Date.now();
    const item = { ...newAct, id };
    const updated = [...activities, item];
    setActivities(updated);
    try {
      await addActivity(item);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateActivity = async (updatedAct: ActivityService) => {
    if (!checkAdminAuth()) return;
    const updated = activities.map((act) => act.id === updatedAct.id ? updatedAct : act);
    setActivities(updated);
    try {
      await updateActivity(updatedAct);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    if (!checkAdminAuth()) return;
    const updated = activities.filter((act) => act.id !== id);
    setActivities(updated);
    try {
      await deleteActivity(id);
    } catch (e) {
      console.error(e);
    }
  };

  // 5.5 Gallery Photo Handlers
  const handleAddGalleryPhoto = async (newPhoto: Omit<GalleryPhoto, 'id'>) => {
    if (!checkAdminAuth()) return;
    const id = 'photo_' + Date.now();
    const item: GalleryPhoto = { ...newPhoto, id };
    const updated = [...galleryPhotos, item].sort((a, b) => (a.serialNo ?? 999) - (b.serialNo ?? 999));
    setGalleryPhotos(updated);
    try {
      await addGalleryPhoto(item);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateGalleryPhoto = async (updatedPhoto: GalleryPhoto) => {
    if (!checkAdminAuth()) return;
    const updated = galleryPhotos.map((p) => (p.id === updatedPhoto.id ? updatedPhoto : p)).sort((a, b) => (a.serialNo ?? 999) - (b.serialNo ?? 999));
    setGalleryPhotos(updated);
    try {
      await updateGalleryPhoto(updatedPhoto);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteGalleryPhoto = async (id: string) => {
    if (!checkAdminAuth()) return;
    const updated = galleryPhotos.filter((p) => p.id !== id);
    setGalleryPhotos(updated);
    try {
      await deleteGalleryPhoto(id);
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Factory Reset Handler
  const handleResetData = async () => {
    if (!checkAdminAuth()) return;
    setIsLoading(true);
    try {
      await resetFirestoreData();
      const [trans, comm, sch, act, photos, det, housesConfig] = await Promise.all([
        getTransactions(),
        getCommitteeMembers(),
        getScholars(),
        getActivities(),
        getGalleryPhotos(),
        getMahfilDetails(),
        getHousesConfig()
      ]);
      setTransactions(trans);
      setCommitteeMembers(sortCommitteeMembers(comm));
      setScholars(sch);
      setActivities(act);
      setGalleryPhotos(photos || []);
      if (det) {
        setMahfilDetails(det);
      }
      if (housesConfig) {
        if (housesConfig.activeHouses) setActiveHouses(housesConfig.activeHouses);
        if (housesConfig.deletedHouses) setDeletedHouses(housesConfig.deletedHouses);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // Render proper sub-view inside container
  const renderActiveSection = () => {
    switch (activeTab) {
      case 'home':
        return (
          <HomeSection
            onNavigate={(tab) => setActiveTab(tab)}
            mahfilDetails={mahfilDetails}
            scholars={scholars}
            activities={activities}
            photos={galleryPhotos}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        );
      case 'committee':
        return (
          <CommitteeSection
            members={committeeMembers}
            isAdminLoggedIn={isAdminLoggedIn}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
          />
        );
      case 'house-report':
        return (
          <HouseReportSection
            transactions={transactions}
            mahfilDetails={mahfilDetails}
            activeHouses={activeHouses}
            deletedHouses={deletedHouses}
            donorOrders={donorOrders}
            onUpdateDonorOrder={handleUpdateDonorOrder}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateHouses={handleUpdateHousesConfig}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'posting':
        return (
          <PostingSection
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
            activeHouses={activeHouses}
            onAddHouse={handleAddHouse}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'manual-posting':
        return (
          <PostingSection
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
            activeHouses={activeHouses}
            onAddHouse={handleAddHouse}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'house-donations':
        return (
          <HouseDonationsSection
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
            mahfilDetails={mahfilDetails}
            activeHouses={activeHouses}
            deletedHouses={deletedHouses}
            donorOrders={donorOrders}
            onUpdateDonorOrder={handleUpdateDonorOrder}
            onUpdateHouses={handleUpdateHousesConfig}
          />
        );
      case 'finance':
        return (
          <FinanceSection
            transactions={transactions}
            isAdminLoggedIn={isAdminLoggedIn}
            isFinancePublic={mahfilDetails?.isFinancePublic}
            onToggleFinancePublic={(val) => handleUpdateMahfilDetails({ ...mahfilDetails, isFinancePublic: val })}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
            onAddTransaction={handleAddTransaction}
            onBatchAddTransactions={handleBatchAddTransactions}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      case 'report':
        return (
          <ReportSection
            transactions={transactions}
            mahfilDetails={mahfilDetails}
            isAdminLoggedIn={isAdminLoggedIn}
            isReportPublic={mahfilDetails?.isReportPublic}
            isFinancePublic={mahfilDetails?.isFinancePublic}
            onToggleReportPublic={(val) => handleUpdateMahfilDetails({ ...mahfilDetails, isReportPublic: val })}
            onToggleFinancePublic={(val) => handleUpdateMahfilDetails({ ...mahfilDetails, isFinancePublic: val })}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
            onAddTransaction={handleAddTransaction}
            onBatchAddTransactions={handleBatchAddTransactions}
            onUpdateTransaction={(id, updated) => {
              const existing = transactions.find((t) => t.id === id);
              if (existing) {
                return handleUpdateTransaction({ ...existing, ...updated } as Transaction);
              }
            }}
            onDeleteTransaction={handleDeleteTransaction}
          />
        );
      case 'admin':
        return (
          <CPanelSection
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
            onUpdateTransaction={handleUpdateTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            committeeMembers={committeeMembers}
            onAddMember={handleAddMember}
            onUpdateMember={handleUpdateMember}
            onDeleteMember={handleDeleteMember}
            scholars={scholars}
            onAddScholar={handleAddScholar}
            onUpdateScholar={handleUpdateScholar}
            onDeleteScholar={handleDeleteScholar}
            activities={activities}
            onAddActivity={handleAddActivity}
            onUpdateActivity={handleUpdateActivity}
            onDeleteActivity={handleDeleteActivity}
            galleryPhotos={galleryPhotos}
            onAddGalleryPhoto={handleAddGalleryPhoto}
            onUpdateGalleryPhoto={handleUpdateGalleryPhoto}
            onDeleteGalleryPhoto={handleDeleteGalleryPhoto}
            mahfilDetails={mahfilDetails}
            onUpdateMahfilDetails={handleUpdateMahfilDetails}
            onResetData={handleResetData}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
            activeHouses={activeHouses}
            deletedHouses={deletedHouses}
            donorOrders={donorOrders}
            onUpdateDonorOrder={handleUpdateDonorOrder}
            onAddHouse={handleAddHouse}
            onUpdateHouses={handleUpdateHousesConfig}
            visitorSummary={visitorSummary}
            activeSessions={activeSessions}
            activeVisitorCount={activeVisitorCount}
            visitorLogs={visitorLogs}
            onResetVisitorAnalytics={async () => {
              try {
                await resetVisitorAnalytics();
              } catch (e) {
                console.error(e);
              }
            }}
            onRefreshVisitorAnalytics={() => {
              // Pulse or refresh trigger
            }}
            onNavigate={(tab) => setActiveTab(tab)}
          />
        );
      default:
        return (
          <HomeSection
            onNavigate={(tab) => setActiveTab(tab)}
            mahfilDetails={mahfilDetails}
            scholars={scholars}
            activities={activities}
            photos={galleryPhotos}
            isAdminLoggedIn={isAdminLoggedIn}
          />
        );
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#f8fafc] min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[#e2e8f0]"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#0f766e] animate-spin"></div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[#064e3b] font-bold text-base sm:text-lg">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h3>
            <p className="text-xs text-[#0f766e] font-semibold animate-pulse">ডাটাবেজ হতে লাইভ তথ্য লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#f8fafc] text-[#3c3c3c] min-h-screen flex flex-col selection:bg-[#d97706] selection:text-white font-sans relative overflow-x-hidden w-full max-w-full">
      {/* Background Ambience / Subtle Golden Ray glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#d97706]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-[#0f766e]/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header section */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isAdminLoggedIn={isAdminLoggedIn}
        onLogout={() => handleAdminLoginStateChange(false)}
      />

      {/* Main Container */}
      <main id="main-content" className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        {renderActiveSection()}
      </main>

      {/* Footer section */}
      {activeTab !== 'admin' && <Footer setActiveTab={setActiveTab} />}
    </div>
  );
}
