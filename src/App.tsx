import React from 'react';
import Header from './components/Header';
import HomeSection from './components/HomeSection';
import CommitteeSection from './components/CommitteeSection';
import FinanceSection from './components/FinanceSection';
import ReportSection from './components/ReportSection';
import CPanelSection from './components/CPanelSection';
import Footer from './components/Footer';

import { Transaction, CommitteeMember, MahfilDetails, InvitedScholar, ActivityService } from './types';
import { initialTransactions, initialCommitteeMembers, initialScholars, initialActivities } from './initialData';
import { 
  getTransactions, 
  addTransaction, 
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
  getMahfilDetails, 
  updateMahfilDetails,
  resetFirestoreData
} from './lib/firebaseService';

const sortMembers = (mList: CommitteeMember[]) => {
  const typeOrder = { advisor: 1, leader: 2, member: 3 };
  return [...mList].sort((a, b) => {
    const orderA = typeOrder[a.type] || 99;
    const orderB = typeOrder[b.type] || 99;
    if (orderA !== orderB) {
      return orderA - orderB;
    }
    return a.serialNo - b.serialNo;
  });
};

export default function App() {
  const [activeTab, setActiveTab] = React.useState<string>('home');
  const [transactions, setTransactions] = React.useState<Transaction[]>([]);
  const [committeeMembers, setCommitteeMembers] = React.useState<CommitteeMember[]>([]);
  const [scholars, setScholars] = React.useState<InvitedScholar[]>([]);
  const [activities, setActivities] = React.useState<ActivityService[]>([]);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [mahfilDetails, setMahfilDetails] = React.useState<MahfilDetails>({
    date: '১২ই রবিউল আউয়াল ১৪৪৮ হিজরী (সম্ভাব্য ২০২৬ খ্রি.)',
    time: 'সকাল ৮:০০ ঘটিকা হতে বর্ণাঢ্য জশনে জুলুস এবং যোহরের নামাজের পর হতে মূল আজিমুশশান মাহফিল।',
    location: 'সোনারগাঁও সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন বিশাল ময়দান, রাঙ্গুনিয়া, চট্টগ্রাম।',
    targetDate: '2026-09-05'
  });

  // Initialize data on mount from Firebase
  React.useEffect(() => {
    async function loadAllData() {
      try {
        setIsLoading(true);
        const [trans, comm, sch, act, det] = await Promise.all([
          getTransactions(),
          getCommitteeMembers(),
          getScholars(),
          getActivities(),
          getMahfilDetails()
        ]);
        
        setTransactions(trans);
        setCommitteeMembers(sortMembers(comm));
        setScholars(sch);
        setActivities(act);
        if (det) {
          setMahfilDetails(det);
        }
      } catch (err) {
        console.error('Error loading data from Firestore:', err);
      } finally {
        setIsLoading(false);
      }
    }
    
    loadAllData();

    // 3. Admin State (optional transient checkout)
    const adminSession = sessionStorage.getItem('mahfil_admin_logged');
    if (adminSession === 'true') {
      setIsAdminLoggedIn(true);
    }
  }, []);

  // Update session storage for admin login state
  const handleAdminLoginStateChange = (status: boolean) => {
    setIsAdminLoggedIn(status);
    if (status) {
      sessionStorage.setItem('mahfil_admin_logged', 'true');
    } else {
      sessionStorage.removeItem('mahfil_admin_logged');
    }
  };

  // 1. Transaction Handlers
  const handleAddTransaction = async (newT: Omit<Transaction, 'id'>) => {
    const id = 't_' + Date.now();
    const item = { ...newT, id };
    const updated = [item, ...transactions];
    setTransactions(updated);
    try {
      await addTransaction(item);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const updated = transactions.filter((t) => t.id !== id);
    setTransactions(updated);
    try {
      await deleteTransaction(id);
    } catch (e) {
      console.error(e);
    }
  };

  // 2. Member Handlers
  const handleAddMember = async (newM: Omit<CommitteeMember, 'id'>) => {
    const id = 'm_' + Date.now();
    const item = { ...newM, id };
    const updated = sortMembers([...committeeMembers, item]);
    setCommitteeMembers(updated);
    try {
      await addCommitteeMember(item);
    } catch (e) {
      console.error(e);
    }
  };

  const handleUpdateMember = async (updatedM: CommitteeMember) => {
    const updated = sortMembers(committeeMembers.map((m) => m.id === updatedM.id ? updatedM : m));
    setCommitteeMembers(updated);
    try {
      await updateCommitteeMember(updatedM);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteMember = async (id: string) => {
    const updated = sortMembers(committeeMembers.filter((m) => m.id !== id));
    setCommitteeMembers(updated);
    try {
      await deleteCommitteeMember(id);
    } catch (e) {
      console.error(e);
    }
  };

  // 3. Mahfil Details Handlers
  const handleUpdateMahfilDetails = async (updatedDetails: MahfilDetails) => {
    setMahfilDetails(updatedDetails);
    try {
      await updateMahfilDetails(updatedDetails);
    } catch (e) {
      console.error(e);
    }
  };

  // 4. Scholar Handlers
  const handleAddScholar = async (newS: Omit<InvitedScholar, 'id'>) => {
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
    const updated = scholars.map((s) => s.id === updatedS.id ? updatedS : s).sort((a, b) => a.serialNo - b.serialNo);
    setScholars(updated);
    try {
      await updateScholar(updatedS);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteScholar = async (id: string) => {
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
    const updated = activities.map((act) => act.id === updatedAct.id ? updatedAct : act);
    setActivities(updated);
    try {
      await updateActivity(updatedAct);
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteActivity = async (id: string) => {
    const updated = activities.filter((act) => act.id !== id);
    setActivities(updated);
    try {
      await deleteActivity(id);
    } catch (e) {
      console.error(e);
    }
  };

  // 6. Factory Reset Handler
  const handleResetData = async () => {
    setIsLoading(true);
    try {
      await resetFirestoreData();
      const [trans, comm, sch, act, det] = await Promise.all([
        getTransactions(),
        getCommitteeMembers(),
        getScholars(),
        getActivities(),
        getMahfilDetails()
      ]);
      setTransactions(trans);
      setCommitteeMembers(sortMembers(comm));
      setScholars(sch);
      setActivities(act);
      if (det) {
        setMahfilDetails(det);
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
        return <HomeSection onNavigate={(tab) => setActiveTab(tab)} mahfilDetails={mahfilDetails} scholars={scholars} activities={activities} />;
      case 'committee':
        return <CommitteeSection members={committeeMembers} />;
      case 'finance':
        return <FinanceSection transactions={transactions} />;
      case 'report':
        return <ReportSection />;
      case 'admin':
        return (
          <CPanelSection
            transactions={transactions}
            onAddTransaction={handleAddTransaction}
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
            mahfilDetails={mahfilDetails}
            onUpdateMahfilDetails={handleUpdateMahfilDetails}
            onResetData={handleResetData}
            isAdminLoggedIn={isAdminLoggedIn}
            setIsAdminLoggedIn={handleAdminLoginStateChange}
          />
        );
      default:
        return <HomeSection onNavigate={(tab) => setActiveTab(tab)} mahfilDetails={mahfilDetails} scholars={scholars} activities={activities} />;
    }
  };

  if (isLoading) {
    return (
      <div className="bg-[#fdfcf7] min-h-screen flex flex-col items-center justify-center p-4">
        <div className="text-center space-y-4">
          <div className="relative w-16 h-16 mx-auto">
            <div className="absolute inset-0 rounded-full border-4 border-[#ece8de]"></div>
            <div className="absolute inset-0 rounded-full border-4 border-t-[#5d6d3e] animate-spin"></div>
          </div>
          <div className="space-y-1.5">
            <h3 className="text-[#2d3a1d] font-bold text-base sm:text-lg">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h3>
            <p className="text-xs text-[#5d6d3e] font-semibold animate-pulse">ডাটাবেজ হতে লাইভ তথ্য লোড হচ্ছে, অনুগ্রহ করে অপেক্ষা করুন...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#fdfcf7] text-[#3c3c3c] min-h-screen flex flex-col selection:bg-[#bfa46f] selection:text-white font-sans relative">
      {/* Background Ambience / Subtle Golden Ray glow */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-[#bfa46f]/5 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-10 right-1/4 w-[600px] h-[600px] bg-[#5d6d3e]/5 rounded-full blur-3xl pointer-events-none"></div>

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
      <Footer setActiveTab={setActiveTab} />
    </div>
  );
}
