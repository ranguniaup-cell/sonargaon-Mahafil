import React from 'react';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { CommitteeMember } from '../types';
import { Award, Shield, User, HelpCircle, Landmark, Megaphone, Globe, PenTool, BookOpen, Star, Printer, Download, Image, Plus, Trash2, Pencil, CheckCircle, Lock, Unlock, Key, FileText, Sparkles } from 'lucide-react';
import jsPDF from 'jspdf';
import { renderSafeCanvas, exportElementToPdf, downloadCanvasAsImage } from '../utils/html2canvasSafe';
import { cleanPhoneInput } from '../lib/numberUtils';
import { sortCommitteeMembers, detectMemberType, PRESET_DESIGNATIONS } from '../lib/designationHierarchy';

interface CommitteeSectionProps {
  members: CommitteeMember[];
  isAdminLoggedIn?: boolean;
  onAddMember?: (m: Omit<CommitteeMember, 'id'>) => void;
  onUpdateMember?: (m: CommitteeMember) => void;
  onDeleteMember?: (id: string) => void;
  setIsAdminLoggedIn?: (status: boolean) => void;
}

export default function CommitteeSection({
  members,
  isAdminLoggedIn = false,
  onAddMember,
  onUpdateMember,
  onDeleteMember,
  setIsAdminLoggedIn,
}: CommitteeSectionProps) {
  const committeeRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');

  // Admin form state
  const [showLogin, setShowLogin] = React.useState(false);
  const [password, setPassword] = React.useState('');
  const [loginError, setLoginError] = React.useState('');

  // Add Member form state
  const [mName, setMName] = React.useState('');
  const [mDesignation, setMDesignation] = React.useState('');
  const [mPhone, setMPhone] = React.useState('');
  const [mType, setMType] = React.useState<'leader' | 'member' | 'advisor'>('leader');
  const [mSuccessMsg, setMSuccessMsg] = React.useState('');

  // Member inline editing states
  const [editingMemberId, setEditingMemberId] = React.useState<string | null>(null);
  const [editName, setEditName] = React.useState('');
  const [editDesignation, setEditDesignation] = React.useState('');
  const [editPhone, setEditPhone] = React.useState('');
  const [editType, setEditType] = React.useState<'leader' | 'member' | 'advisor'>('leader');
  const [editSerialNo, setEditSerialNo] = React.useState('');

  // Translate English digits to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadImage = async () => {
    if (!committeeRef.current) return;
    setIsExporting(true);

    try {
      const canvas = await renderSafeCanvas(committeeRef.current, {
        backgroundColor: '#f8fafc',
        scale: 2,
      });

      downloadCanvasAsImage(canvas, 'Milad_Committee_List_Sonargaon_2026.png', 'image/png');
    } catch (error) {
      console.error('Error generating image:', error);
      alert('দুঃখিত, ছবি ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন বা স্ক্রিনশট নিন।');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadPDF = async () => {
    const pdfArea = document.getElementById('committee-pdf-template');
    if (!pdfArea) return;
    setIsExporting(true);

    try {
      await exportElementToPdf(pdfArea, {
        fileName: 'Sonargaon_Milad_Committee_List_2026.pdf',
        format: 'a4',
        orientation: 'portrait',
        margin: 8,
        scale: 2.5
      });
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('পিডিএফ ফাইল তৈরিতে সমস্যা হয়েছে। অনুগ্রহ করে আবার চেষ্টা করুন।');
    } finally {
      setIsExporting(false);
    }
  };

  // Automatically sort entire committee strictly according to designation hierarchy
  const sortedAllMembers = React.useMemo(() => sortCommitteeMembers(members), [members]);

  // Filter members by type based on sorted list
  const advisors = React.useMemo(() => sortedAllMembers.filter((m) => m.type === 'advisor'), [sortedAllMembers]);
  const leaders = React.useMemo(() => sortedAllMembers.filter((m) => m.type === 'leader'), [sortedAllMembers]);
  const generalMembers = React.useMemo(() => sortedAllMembers.filter((m) => m.type === 'member'), [sortedAllMembers]);

  // Sorted combined non-advisor members for unified table presentation
  const tableMembers = React.useMemo(() => [
    ...leaders,
    ...generalMembers
  ], [leaders, generalMembers]);

  // Assign custom icon based on designation
  const getLeaderIcon = (designation: string) => {
    const d = designation.trim();
    if (d.includes('সভাপতি')) {
      return d === 'সভাপতি' ? <Shield className="h-6 w-6 text-[#064e3b]" /> : <Shield className="h-5 w-5 text-[#0f766e] opacity-80" />;
    }
    if (d.includes('সম্পাদক') && (d.includes('সাধারণ') || d.includes('সেক্রেটারি'))) {
      return <PenTool className="h-5 w-5 text-[#d97706]" />;
    }
    if (d.includes('সাংগঠনিক')) {
      return <Award className="h-5 w-5 text-[#0f766e]" />;
    }
    if (d.includes('অর্থ') || d.includes('কোষাধ্যক্ষ') || d.includes('ক্যাশিয়ার')) {
      return <Landmark className="h-5 w-5 text-[#d97706]" />;
    }
    if (d.includes('প্রচার') || d.includes('প্রকাশনা')) {
      return <Megaphone className="h-5 w-5 text-[#0f766e]" />;
    }
    if (d.includes('দপ্তর') || d.includes('দফতর')) {
      return <FileText className="h-5 w-5 text-[#0f766e]" />;
    }
    if (d.includes('প্রবাসী') || d.includes('আন্তর্জাতিক')) {
      return <Globe className="h-5 w-5 text-[#d97706]" />;
    }
    if (d.includes('ধর্ম') || d.includes('সাংস্কৃতিক') || d.includes('শিক্ষা')) {
      return <BookOpen className="h-5 w-5 text-[#0f766e]" />;
    }
    if (d.includes('প্রযুক্তি') || d.includes('আইটি') || d.includes('মিডিয়া')) {
      return <Sparkles className="h-5 w-5 text-[#0f766e]" />;
    }
    return <User className="h-5 w-5 text-[#0f766e]" />;
  };

  return (
    <div id="committee-section" className="space-y-8 pb-16 animate-fade-in text-[#3c3c3c]">
      
      {/* 1. Screen Only Display - Hidden during print */}
      <div className="print:hidden space-y-8">
        
        {/* Title */}
        <div className="text-center max-w-2xl mx-auto space-y-3">
          <div className="flex justify-center">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#d97706] to-[#0f766e] rounded-full blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <img
                src={logo}
                onError={handleLogoError}
                alt="উদযাপন পরিষদ লোগো"
                className="relative h-20 w-20 rounded-full border-2 border-[#d97706] object-cover shadow-md bg-white p-0.5"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#0f766e] uppercase bg-[#0f766e]/10 px-3 py-1 rounded-full border border-[#cbd5e1] inline-block">
            উদযাপন কমিটি ২০২৬-২৭
          </span>
          <h2 className="text-3xl font-extrabold text-[#064e3b] tracking-tight">
            পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
          </h2>
          <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#d97706] to-transparent mx-auto mt-3"></div>
          <p className="text-[#3c3c3c]/80 text-xs sm:text-sm leading-relaxed font-light pt-2">
            ঐতিহ্যবাহী সোনারগাঁও এলাকাবাসীর সম্মতিক্রমে গঠিত নবগঠিত উদযাপন পরিষদের সম্মানিত কর্মকর্তাদের তালিকা নিচে দেয়া হলো।
          </p>
        </div>

        {/* Download and Print Actions Bar */}
        <div className="flex flex-col items-center gap-4 bg-white border border-[#cbd5e1] rounded-2xl p-5 max-w-2xl mx-auto shadow-sm">
          <div className="flex bg-[#f1f5f9] p-1 rounded-xl border border-[#cbd5e1] w-full sm:w-auto">
            <button
              onClick={() => setViewMode('cards')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                viewMode === 'cards' ? 'bg-[#0f766e] text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#064e3b]'
              }`}
            >
              কার্ড ভিউ (Cards View)
            </button>
            <button
              onClick={() => setViewMode('table')}
              className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
                viewMode === 'table' ? 'bg-[#0f766e] text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#064e3b]'
              }`}
            >
              টেবিল ভিউ (Grid Table)
            </button>
          </div>

          <div className="flex flex-wrap justify-center gap-3 w-full border-t border-[#e2e8f0] pt-3">
            <button
              onClick={handlePrint}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#0f766e] hover:bg-[#0d9488] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              <Printer className="h-4 w-4" />
              <span>কমিটি তালিকা প্রিন্ট করুন (Print/PDF)</span>
            </button>

            <button
              onClick={handleDownloadPDF}
              disabled={isExporting}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#1b4332] hover:bg-[#122e22] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-4 w-4" />
              <span>{isExporting ? 'পিডিএফ তৈরি হচ্ছে...' : 'কমিটি তালিকা ডাউনলোড করুন (PDF)'}</span>
            </button>

            <button
              onClick={handleDownloadImage}
              disabled={isExporting}
              className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-white hover:bg-[#f1f5f9] text-[#064e3b] border-2 border-[#cbd5e1] hover:border-[#d97706] rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
            >
              <Image className="h-4 w-4 text-[#d97706]" />
              <span>{isExporting ? 'ছবি তৈরি হচ্ছে...' : 'ছবি হিসেবে ডাউনলোড করুন (PNG)'}</span>
            </button>

            {isAdminLoggedIn ? (
              <button
                onClick={() => setIsAdminLoggedIn?.(false)}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Unlock className="h-4 w-4" />
                <span>সম্পাদনা বন্ধ করুন (লগআউট)</span>
              </button>
            ) : (
              <button
                onClick={() => setShowLogin(!showLogin)}
                className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#d97706] hover:bg-[#a68c56] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
              >
                <Lock className="h-4 w-4" />
                <span>কমিটি পরিচালনা করুন</span>
              </button>
            )}
          </div>
        </div>

        {/* Password Submission Block (Inline) */}
        {showLogin && !isAdminLoggedIn && (
          <div className="bg-[#f1f5f9] border-2 border-[#d97706]/30 rounded-2xl p-5 max-w-md mx-auto shadow-sm animate-scale-in space-y-3">
            <h4 className="text-xs sm:text-sm font-bold text-[#064e3b] flex items-center space-x-2">
              <Key className="h-4 w-4 text-[#d97706]" />
              <span>কমিটি তালিকা পরিচালনা করতে পাসওয়ার্ড দিন</span>
            </h4>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (password === 'T@a546195') {
                setIsAdminLoggedIn?.(true);
                setLoginError('');
                setPassword('');
                setShowLogin(false);
              } else {
                setLoginError('ভুল পাসওয়ার্ড! সঠিক পাসওয়ার্ড দিন।');
              }
            }} className="flex flex-col sm:flex-row gap-2">
              <div className="flex-grow">
                <input
                  type="password"
                  placeholder="পাসওয়ার্ড লিখুন..."
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 bg-white border border-[#cbd5e1] rounded-xl text-xs focus:outline-none focus:border-[#d97706] transition"
                />
              </div>
              <button
                type="submit"
                className="px-5 py-2.5 bg-[#0f766e] text-white font-bold rounded-xl text-xs hover:bg-[#0d9488] transition cursor-pointer"
              >
                প্রবেশ করুন
              </button>
            </form>
            {loginError && <p className="text-[10px] text-red-600 font-bold">{loginError}</p>}
          </div>
        )}

        {/* Admin Mode - Member Registration Form Block */}
        {isAdminLoggedIn && (
          <div className="bg-white border-2 border-[#0f766e]/30 rounded-2xl p-5 max-w-xl mx-auto shadow-sm animate-scale-in">
            <h4 className="text-sm font-bold text-[#064e3b] mb-4 flex items-center justify-between border-b border-[#e2e8f0] pb-2">
              <span className="flex items-center space-x-2">
                <Plus className="h-4 w-4 text-[#0f766e]" />
                <span>নতুন সদস্য যুক্তকরণ ফর্ম (অ্যাডমিন মোড)</span>
              </span>
              <span className="text-[10px] text-[#0f766e] bg-[#0f766e]/10 px-2 py-0.5 rounded font-bold">
                পদবী অনুযায়ী Auto Set
              </span>
            </h4>

            {/* Datalist for fast designation suggestion */}
            <datalist id="committee-preset-designations">
              {PRESET_DESIGNATIONS.map((preset) => (
                <option key={preset.title} value={preset.title}>
                  {preset.title} ({preset.groupLabel})
                </option>
              ))}
            </datalist>

            <form onSubmit={(e) => {
              e.preventDefault();
              if (!mName.trim() || !mDesignation.trim()) {
                alert('সদস্যের নাম এবং পদবী আবশ্যক।');
                return;
              }

              const autoType = mType || detectMemberType(mDesignation.trim());

              onAddMember?.({
                name: mName.trim(),
                designation: mDesignation.trim(),
                phone: mPhone.trim() || 'প্রযোজ্য নয়',
                type: autoType,
                serialNo: 0
              });

              setMName('');
              setMDesignation('');
              setMPhone('');
              setMSuccessMsg('সদস্য পদবীর ধারাবাহিকতা অনুযায়ী স্বয়ংক্রিয়ভাবে উপযুক্ত স্থানে যুক্ত হয়েছেন!');
              setTimeout(() => setMSuccessMsg(''), 4000);
            }} className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
              <div className="sm:col-span-1">
                <label className="block text-[#0f766e] text-[10px] font-bold mb-1">সদস্যের পুরো নাম *</label>
                <input
                  type="text"
                  required
                  placeholder="যেমন: আলহাজ্ব করিম উল্লাহ"
                  value={mName}
                  onChange={(e) => setMName(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c]"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[#0f766e] text-[10px] font-bold mb-1">পদবী (Designation) *</label>
                <input
                  type="text"
                  required
                  list="committee-preset-designations"
                  placeholder="যেমন: সহ-সভাপতি / সম্পাদক"
                  value={mDesignation}
                  onChange={(e) => {
                    const val = e.target.value;
                    setMDesignation(val);
                    const suggestedType = detectMemberType(val);
                    if (suggestedType) {
                      setMType(suggestedType);
                    }
                  }}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c]"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[#0f766e] text-[10px] font-bold mb-1">মোবাইল নম্বর (Contact)</label>
                <input
                  type="text"
                  placeholder="যেমন: ০১৮১৮-XXXXXX"
                  value={mPhone}
                  onChange={(e) => setMPhone(cleanPhoneInput(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c]"
                />
              </div>
              <div className="sm:col-span-1">
                <label className="block text-[#0f766e] text-[10px] font-bold mb-1">সদস্যের বিভাগ (Auto)</label>
                <select
                  value={mType}
                  onChange={(e) => setMType(e.target.value as any)}
                  className="w-full px-3 py-1.5 bg-white border border-[#cbd5e1] rounded-lg text-[#3c3c3c] cursor-pointer"
                >
                  <option value="leader">কার্যনির্বাহী পরিষদ (Leader)</option>
                  <option value="member">সদস্যবৃন্দ (Member)</option>
                  <option value="advisor">উপদেষ্টা মণ্ডলী (Advisor)</option>
                </select>
              </div>
              <div className="sm:col-span-4 flex justify-between items-center mt-2 pt-2 border-t border-[#f1f5f9]">
                {mSuccessMsg ? (
                  <span className="text-xs text-[#0f766e] bg-[#0f766e]/10 px-3 py-1 rounded border border-[#0f766e]/20">{mSuccessMsg}</span>
                ) : (
                  <span className="text-[10px] text-[#0f766e] font-medium flex items-center space-x-1">
                    <Sparkles className="h-3 w-3 text-[#d97706]" />
                    <span>পদবীর মর্যাদা ও ধারাবাহিকতা অনুসারে তালিকায় স্বয়ংক্রিয়ভাবে সঠিক পজিশনে সেট হবে।</span>
                  </span>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-[#0f766e] hover:bg-[#0d9488] text-white font-bold rounded-lg cursor-pointer transition shadow-sm"
                >
                  কমিটিতে যুক্ত করুন
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Main Committee list contents captured by ref */}
        <div ref={committeeRef} className="space-y-16 p-4 sm:p-8 bg-[#f8fafc] rounded-3xl border border-[#cbd5e1]/30">
          
          {viewMode === 'table' ? (
            <div className="space-y-6">
              <h3 className="text-xl font-bold text-[#064e3b] text-center flex items-center justify-center space-x-2">
                <span>উদযাপন পরিষদের সম্পূর্ণ তালিকা (টেবিল ভিউ)</span>
              </h3>
              <div className="overflow-x-auto border border-[#cbd5e1] rounded-2xl bg-white shadow-sm">
                <table className="w-full border-collapse text-left text-xs sm:text-sm text-[#3c3c3c]">
                  <thead>
                    <tr className="bg-[#f1f5f9] border-b border-[#cbd5e1] text-[#064e3b] text-center font-bold">
                      <th className="py-3 px-2 sm:px-4 w-16">ক্রম</th>
                      <th className="py-3 px-4 sm:px-6 text-left">নাম</th>
                      <th className="py-3 px-4 sm:px-6 text-left">পদবি</th>
                      <th className="py-3 px-4 sm:px-6 text-left">মোবাইল নম্বর</th>
                      <th className="py-3 px-4 sm:px-6">বিভাগ/ধরণ</th>
                      {isAdminLoggedIn && <th className="py-3 px-4 sm:px-6">অ্যাকশন</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {members.map((member, idx) => (
                      <tr key={member.id} className="border-b border-[#e2e8f0]/70 hover:bg-[#f8fafc]/60 transition">
                        <td className="py-3 px-2 sm:px-4 text-center font-mono font-semibold text-[#0f766e]">
                          {toBanglaNum(idx + 1)}
                        </td>
                        
                        {editingMemberId === member.id ? (
                          <>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                required
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                className="px-2 py-1 border border-[#cbd5e1] rounded text-xs w-full font-bold"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                required
                                value={editDesignation}
                                onChange={(e) => setEditDesignation(e.target.value)}
                                className="px-2 py-1 border border-[#cbd5e1] rounded text-xs w-full text-gray-700"
                              />
                            </td>
                            <td className="py-2 px-4">
                              <input
                                type="text"
                                value={editPhone}
                                onChange={(e) => setEditPhone(cleanPhoneInput(e.target.value))}
                                className="px-2 py-1 border border-[#cbd5e1] rounded text-xs w-full text-gray-700"
                                placeholder="যেমন: ০১৮১৮-XXXXXX"
                              />
                            </td>
                            <td className="py-2 px-4 text-center">
                              <select
                                value={editType}
                                onChange={(e) => setEditType(e.target.value as any)}
                                className="px-2 py-1 border border-[#cbd5e1] rounded text-xs cursor-pointer bg-white"
                              >
                                <option value="leader">কার্যনির্বাহী</option>
                                <option value="member">সদস্য</option>
                                <option value="advisor">উপদেষ্টা</option>
                              </select>
                            </td>
                            <td className="py-2 px-4 text-center">
                              <div className="flex justify-center items-center space-x-1.5">
                                <button
                                  onClick={() => {
                                    onUpdateMember?.({
                                      id: member.id,
                                      name: editName,
                                      designation: editDesignation,
                                      type: editType,
                                      serialNo: parseInt(editSerialNo, 10) || member.serialNo,
                                      phone: editPhone
                                    });
                                    setEditingMemberId(null);
                                  }}
                                  className="px-2 py-1 bg-[#0f766e] text-white font-bold rounded text-[10px] hover:bg-[#0d9488] cursor-pointer"
                                >
                                  ওকে
                                </button>
                                <button
                                  onClick={() => setEditingMemberId(null)}
                                  className="px-2 py-1 bg-gray-300 text-gray-700 font-bold rounded text-[10px] hover:bg-gray-400 cursor-pointer"
                                >
                                  বাতিল
                                </button>
                              </div>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="py-3 px-4 sm:px-6 font-bold text-[#064e3b]">{member.name}</td>
                            <td className="py-3 px-4 sm:px-6 text-[#3c3c3c]">{member.designation}</td>
                            <td className="py-3 px-4 sm:px-6 text-slate-500 font-mono text-xs">{member.phone || 'প্রযোজ্য নয়'}</td>
                            <td className="py-3 px-4 sm:px-6 text-center">
                              <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                                member.type === 'advisor' 
                                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                                  : member.type === 'leader' 
                                    ? 'bg-[#0f766e]/10 text-[#0f766e] border-[#0f766e]/20' 
                                    : 'bg-gray-50 text-gray-700 border-gray-200'
                              }`}>
                                {member.type === 'advisor' ? 'উপদেষ্টা' : member.type === 'leader' ? 'কার্যনির্বাহী' : 'সদস্য'}
                              </span>
                            </td>
                            {isAdminLoggedIn && (
                              <td className="py-3 px-4 sm:px-6 text-center">
                                <div className="flex justify-center items-center space-x-2">
                                  <button
                                    onClick={() => {
                                      setEditingMemberId(member.id);
                                      setEditName(member.name);
                                      setEditDesignation(member.designation);
                                      setEditType(member.type);
                                      setEditSerialNo(member.serialNo.toString());
                                      setEditPhone(member.phone || '');
                                    }}
                                    className="p-1 hover:bg-[#0f766e]/10 text-[#0f766e] rounded transition"
                                    title="সম্পাদনা করুন"
                                  >
                                    <Pencil className="h-3.5 w-3.5" />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`আপনি কি "${member.name}" কে অপসারণ করতে চান?`)) {
                                        onDeleteMember?.(member.id);
                                      }
                                    }}
                                    className="p-1 hover:bg-red-500/10 text-red-600 rounded transition"
                                    title="মুছে ফেলুন"
                                  >
                                    <Trash2 className="h-3.5 w-3.5" />
                                  </button>
                                </div>
                              </td>
                            )}
                          </>
                        )}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <>
              {/* 1. Advisor Section (উপদেষ্টা) - Top Premium Design */}
              <div className="space-y-6">
                <h3 className="text-xl font-bold text-[#064e3b] text-center flex items-center justify-center space-x-2">
                  <Star className="h-5 w-5 text-[#d97706]" />
                  <span>সম্মানিত উপদেষ্টা মণ্ডলী</span>
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                  {advisors.map((member) => (
                    <div
                      id={`advisor-card-${member.id}`}
                      key={member.id}
                      className="relative overflow-hidden bg-[#f1f5f9] border-2 border-[#cbd5e1] hover:border-[#d97706] rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition duration-300 group"
                    >
                      {/* Islamic Decorative Corners */}
                      <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#cbd5e1] group-hover:border-[#d97706] rounded-tl-xl transition duration-300"></div>
                      <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#cbd5e1] group-hover:border-[#d97706] rounded-tr-xl transition duration-300"></div>
                      <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#cbd5e1] group-hover:border-[#d97706] rounded-bl-xl transition duration-300"></div>
                      <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#cbd5e1] group-hover:border-[#d97706] rounded-br-xl transition duration-300"></div>

                      {/* Admin Controls Overlay */}
                      {isAdminLoggedIn && editingMemberId !== member.id && (
                        <div className="absolute top-2 right-2 flex items-center space-x-1 z-10 bg-white/95 p-1 rounded-lg border border-[#cbd5e1]/60 shadow-sm">
                          <button
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditName(member.name);
                              setEditDesignation(member.designation);
                              setEditType(member.type);
                              setEditSerialNo(member.serialNo.toString());
                            }}
                            className="p-1 text-[#0f766e] hover:bg-gray-100 rounded cursor-pointer"
                            title="এডিট"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`আপনি কি "${member.name}" কে অপসারণ করতে চান?`)) {
                                onDeleteMember?.(member.id);
                              }
                            }}
                            className="p-1 text-red-600 hover:bg-gray-100 rounded cursor-pointer"
                            title="মুছে ফেলুন"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}

                      <div className="h-14 w-14 bg-white/80 border border-[#cbd5e1] rounded-full flex items-center justify-center mx-auto text-[#0f766e] mb-4 group-hover:scale-110 transition duration-300 shadow-sm">
                        <BookOpen className="h-6 w-6" />
                      </div>

                      {editingMemberId === member.id ? (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          onUpdateMember?.({
                            id: member.id,
                            name: editName,
                            designation: editDesignation,
                            type: editType,
                            serialNo: parseInt(editSerialNo, 10) || member.serialNo
                          });
                          setEditingMemberId(null);
                        }} className="space-y-2 max-w-xs mx-auto text-left">
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-[#cbd5e1] rounded font-bold"
                          />
                          <input
                            type="text"
                            required
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="w-full px-2 py-1 text-xs border border-[#cbd5e1] rounded text-gray-600"
                          />
                          <div className="flex justify-end space-x-1">
                            <button type="submit" className="px-2 py-0.5 bg-[#0f766e] text-white text-[10px] rounded font-bold cursor-pointer">ওকে</button>
                            <button type="button" onClick={() => setEditingMemberId(null)} className="px-2 py-0.5 bg-gray-300 text-gray-700 text-[10px] rounded font-bold cursor-pointer">বাতিল</button>
                          </div>
                        </form>
                      ) : (
                        <>
                          <h4 className="text-lg font-bold text-[#064e3b] tracking-wide group-hover:text-[#0f766e] transition">
                            {member.name}
                          </h4>
                          <p className="text-[#d97706] text-xs font-bold mt-1 bg-[#d97706]/5 px-2.5 py-1 rounded-full border border-[#d97706]/10 inline-block">
                            {member.designation}
                          </p>
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 2. Leaders / Executives Section (কার্যনির্বাহী পরিষদ) */}
              <div className="space-y-6 pt-6">
                <h3 className="text-xl font-bold text-[#064e3b] text-center flex items-center justify-center space-x-2">
                  <Award className="h-5 w-5 text-[#d97706]" />
                  <span>কার্যনির্বাহী পরিষদ নেতৃবৃন্দ</span>
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {leaders.map((member) => (
                    <div
                      id={`leader-card-${member.id}`}
                      key={member.id}
                      className="bg-white/70 border border-[#cbd5e1] hover:border-[#d97706] rounded-2xl p-5 flex items-start space-x-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group relative"
                    >
                      {/* Leader serial/icon */}
                      <div className="relative flex-shrink-0">
                        <div className="h-12 w-12 bg-[#f1f5f9] border border-[#cbd5e1] group-hover:border-[#d97706] rounded-xl flex items-center justify-center transition duration-300 shadow-inner">
                          {getLeaderIcon(member.designation)}
                        </div>
                        <div className="absolute -bottom-1.5 -right-1.5 bg-[#0f766e] text-white font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border border-[#f8fafc]">
                          {toBanglaNum(member.serialNo)}
                        </div>
                      </div>

                      {editingMemberId === member.id ? (
                        <form onSubmit={(e) => {
                          e.preventDefault();
                          onUpdateMember?.({
                            id: member.id,
                            name: editName,
                            designation: editDesignation,
                            type: editType,
                            serialNo: parseInt(editSerialNo, 10) || member.serialNo
                          });
                          setEditingMemberId(null);
                        }} className="space-y-1.5 flex-1 text-left text-xs">
                          <input
                            type="text"
                            required
                            value={editName}
                            onChange={(e) => setEditName(e.target.value)}
                            className="w-full px-2 py-0.5 border border-[#cbd5e1] rounded font-bold"
                          />
                          <input
                            type="text"
                            required
                            value={editDesignation}
                            onChange={(e) => setEditDesignation(e.target.value)}
                            className="w-full px-2 py-0.5 border border-[#cbd5e1] rounded text-gray-600"
                          />
                          <div className="flex space-x-1.5">
                            <button type="submit" className="px-2 py-0.5 bg-[#0f766e] text-white text-[10px] rounded font-bold cursor-pointer">ওকে</button>
                            <button type="button" onClick={() => setEditingMemberId(null)} className="px-2 py-0.5 bg-gray-300 text-gray-700 text-[10px] rounded font-bold cursor-pointer">বাতিল</button>
                          </div>
                        </form>
                      ) : (
                        /* Leader Details */
                        <div className="flex-1 min-w-0">
                          <h4 className="text-base font-bold text-[#064e3b] truncate group-hover:text-[#0f766e] transition tracking-wide">
                            {member.name}
                          </h4>
                          <p className="text-[#d97706] text-xs font-bold mt-1 inline-block">
                            {member.designation}
                          </p>
                          <div className="text-[10px] text-[#0f766e] font-medium mt-1 flex items-center space-x-1.5">
                            <span className="h-1.5 w-1.5 bg-[#0f766e] rounded-full"></span>
                            <span>উদযাপন পরিষদ কর্মকর্তা</span>
                          </div>
                        </div>
                      )}

                      {/* Admin overlay controls */}
                      {isAdminLoggedIn && editingMemberId !== member.id && (
                        <div className="flex flex-col space-y-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingMemberId(member.id);
                              setEditName(member.name);
                              setEditDesignation(member.designation);
                              setEditType(member.type);
                              setEditSerialNo(member.serialNo.toString());
                            }}
                            className="p-1 hover:bg-gray-150 rounded text-[#0f766e] cursor-pointer"
                            title="সম্পাদনা"
                          >
                            <Pencil className="h-3 w-3" />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`আপনি কি "${member.name}" কে অপসারণ করতে চান?`)) {
                                onDeleteMember?.(member.id);
                              }
                            }}
                            className="p-1 hover:bg-red-50 text-red-600 rounded cursor-pointer"
                            title="অপসারণ"
                          >
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* 3. Senior Members Section (সিনিয়র সদস্য) */}
              <div className="space-y-6 pt-6">
                <h3 className="text-xl font-bold text-[#064e3b] text-center flex items-center justify-center space-x-2">
                  <User className="h-5 w-5 text-[#d97706]" />
                  <span>সম্মানিত সিনিয়র সদস্যবৃন্দ</span>
                </h3>

                <div className="bg-[#f1f5f9]/50 border border-[#cbd5e1] rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto shadow-inner">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {generalMembers.map((member) => (
                      <div
                        id={`member-card-${member.id}`}
                        key={member.id}
                        className="bg-white/60 border border-[#cbd5e1] hover:border-[#d97706] hover:bg-white/90 p-3.5 rounded-xl flex items-center space-x-3 transition group shadow-sm"
                      >
                        <div className="h-8 w-8 bg-[#f1f5f9] border border-[#cbd5e1] rounded-full flex items-center justify-center text-[#0f766e] font-bold text-xs group-hover:border-[#d97706] group-hover:text-[#d97706] transition flex-shrink-0">
                          {toBanglaNum(member.serialNo)}
                        </div>

                        {editingMemberId === member.id ? (
                          <form onSubmit={(e) => {
                            e.preventDefault();
                            onUpdateMember?.({
                              id: member.id,
                              name: editName,
                              designation: editDesignation,
                              type: editType,
                              serialNo: parseInt(editSerialNo, 10) || member.serialNo
                            });
                            setEditingMemberId(null);
                          }} className="space-y-1.5 flex-1 text-left text-xs">
                            <input
                              type="text"
                              required
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              className="w-full px-2 py-0.5 border border-[#cbd5e1] rounded font-bold"
                            />
                            <input
                              type="text"
                              required
                              value={editDesignation}
                              onChange={(e) => setEditDesignation(e.target.value)}
                              className="w-full px-2 py-0.5 border border-[#cbd5e1] rounded text-gray-600"
                            />
                            <div className="flex space-x-1.5">
                              <button type="submit" className="px-1.5 py-0.5 bg-[#0f766e] text-white text-[9px] rounded font-bold cursor-pointer">ওকে</button>
                              <button type="button" onClick={() => setEditingMemberId(null)} className="px-1.5 py-0.5 bg-gray-300 text-gray-700 text-[9px] rounded font-bold cursor-pointer">বাতিল</button>
                            </div>
                          </form>
                        ) : (
                          <div className="min-w-0 flex-1">
                            <h4 className="text-sm font-bold text-[#064e3b] truncate group-hover:text-[#0f766e]">
                              {member.name}
                            </h4>
                            <p className="text-[#0f766e] text-[10px] font-medium mt-0.5">
                              {member.designation}
                            </p>
                          </div>
                        )}

                        {/* Admin controls inline */}
                        {isAdminLoggedIn && editingMemberId !== member.id && (
                          <div className="flex items-center space-x-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                setEditingMemberId(member.id);
                                setEditName(member.name);
                                setEditDesignation(member.designation);
                                setEditType(member.type);
                                setEditSerialNo(member.serialNo.toString());
                              }}
                              className="p-0.5 text-[#0f766e] hover:bg-gray-100 rounded cursor-pointer"
                              title="সম্পাদনা"
                            >
                              <Pencil className="h-3 w-3" />
                            </button>
                            <button
                              onClick={() => {
                                      if (confirm(`আপনি কি "${member.name}" কে অপসারণ করতে চান?`)) {
                                        onDeleteMember?.(member.id);
                                      }
                              }}
                              className="p-0.5 text-red-600 hover:bg-gray-100 rounded cursor-pointer"
                              title="অপসারণ"
                            >
                              <Trash2 className="h-3 w-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </>
          )}
        </div> {/* Closing committeeRef wrapper div */}
      </div>

      {/* 2. Print-Only Beautiful Official Document Layout - Visible ONLY during window.print() */}
      <div className="hidden print:block text-black bg-white p-6 max-w-4xl mx-auto font-sans" id="committee-print-area">
        
        {/* Document Header with Double Decorative Lines */}
        <div className="text-center space-y-2 border-b-4 border-double border-gray-800 pb-4 mb-6 relative">
          <div className="flex items-center justify-center gap-4">
            <img
              src={logo}
              onError={handleLogoError}
              alt="Logo"
              className="h-16 w-16 object-contain rounded-full border border-gray-300 bg-white"
              referrerPolicy="no-referrer"
            />
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">বিসমিল্লাহির রাহমানির রাহিম</p>
              <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-950 tracking-tight">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h1>
              <p className="text-sm font-bold text-gray-700">সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম, বাংলাদেশ।</p>
            </div>
          </div>
          <p className="text-xs font-semibold text-gray-600">কমিটি মেয়াদ: ২০২৬-২০২৭ খ্রি. / ১৪৪৮ হিজরী</p>
        </div>

        {/* Group 1: Advisors (উপদেষ্টা) */}
        {advisors.length > 0 && (
          <div className="mb-6 avoid-break">
            <h3 className="bg-gray-100 text-xs sm:text-sm font-bold text-gray-900 py-1.5 px-3 border border-gray-400 rounded mb-3 flex items-center justify-between">
              <span>সম্মানিত উপদেষ্টা মণ্ডলী</span>
              <span className="text-[10px] font-medium">মোট সদস্য: {toBanglaNum(advisors.length)} জন</span>
            </h3>
            <div className="grid grid-cols-2 gap-x-6 gap-y-1 text-xs">
              {advisors.map((m, idx) => (
                <div key={m.id} className="flex justify-between items-center py-1.5 border-b border-gray-200">
                  <span className="font-bold text-gray-950">{toBanglaNum(idx + 1)}. {m.name}</span>
                  <span className="text-gray-700 font-semibold">{m.designation}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Group 2: Executive Committee (কার্যনির্বাহী পরিষদ) */}
        {leaders.length > 0 && (
          <div className="mb-6 avoid-break">
            <h3 className="bg-gray-100 text-xs sm:text-sm font-bold text-gray-900 py-1.5 px-3 border border-gray-400 rounded mb-3 flex items-center justify-between">
              <span>কার্যনির্বাহী পরিষদ নেতৃবৃন্দ</span>
              <span className="text-[10px] font-medium">মোট সদস্য: {toBanglaNum(leaders.length)} জন</span>
            </h3>
            <table className="w-full border-collapse border border-gray-400 text-xs text-left">
              <thead>
                <tr className="bg-gray-100 border-b border-gray-400 text-center font-bold text-gray-900">
                  <th className="py-2 px-3 border-r border-gray-400 w-14">ক্রমিক</th>
                  <th className="py-2 px-4 border-r border-gray-400 text-left">নাম</th>
                  <th className="py-2 px-4 text-left">পদবী</th>
                </tr>
              </thead>
              <tbody>
                {leaders.map((m, idx) => (
                  <tr key={m.id} className="border-b border-gray-400 hover:bg-gray-50">
                    <td className="py-2 px-3 border-r border-gray-400 text-center font-bold font-mono">{toBanglaNum(idx + 1)}</td>
                    <td className="py-2 px-4 border-r border-gray-400 font-bold text-gray-950">{m.name}</td>
                    <td className="py-2 px-4 text-gray-800 font-semibold">{m.designation}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Group 3: Senior Members (সদস্যবৃন্দ) */}
        {generalMembers.length > 0 && (
          <div className="mb-8 avoid-break">
            <h3 className="bg-gray-100 text-xs sm:text-sm font-bold text-gray-900 py-1.5 px-3 border border-gray-400 rounded mb-3 flex items-center justify-between">
              <span>সম্মানিত সিনিয়র সদস্যবৃন্দ</span>
              <span className="text-[10px] font-medium">মোট সদস্য: {toBanglaNum(generalMembers.length)} জন</span>
            </h3>
            <div className="grid grid-cols-3 gap-x-6 gap-y-1.5">
              {generalMembers.map((m, idx) => (
                <div key={m.id} className="text-xs py-1.5 border-b border-gray-200 flex items-center space-x-1">
                  <span className="font-semibold text-gray-950">{toBanglaNum(idx + 1)}. {m.name}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Signature Verification Block at the bottom of printed page */}
        <div className="mt-16 pt-8 border-t-2 border-gray-300 grid grid-cols-3 gap-4 text-center text-xs font-bold text-gray-800">
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">সভাপতি</p>
          </div>
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">সাধারণ সম্পাদক</p>
          </div>
          <div>
            <div className="h-12"></div>
            <p className="border-t border-gray-400 pt-1.5 inline-block px-4">অর্থ-সম্পাদক</p>
          </div>
        </div>

      </div>

      {/* 3. High-Fidelity PDF Generation Template (Offscreen capture) */}
      <div 
        id="committee-pdf-template" 
        className="absolute bg-white text-[#1f2937] p-12 border border-[#d97706] shadow-2xl flex flex-col justify-between" 
        style={{ 
          position: 'absolute', 
          left: '-9999px', 
          top: '-9999px', 
          width: '794px', 
          minHeight: '1110px', 
          boxSizing: 'border-box' 
        }}
      >
        {/* Inner green border */}
        <div className="absolute inset-2.5 border-2 border-[#1b4332] pointer-events-none"></div>
        
        {/* Corner Decorative Ornaments (L-Brackets) */}
        {/* Top Left */}
        <div className="absolute top-5 left-5 w-8 h-8 border-t-4 border-l-4 border-[#d97706] pointer-events-none"></div>
        <div className="absolute top-7 left-7 w-5 h-5 border-t-2 border-l-2 border-[#1b4332] pointer-events-none"></div>
        
        {/* Top Right */}
        <div className="absolute top-5 right-5 w-8 h-8 border-t-4 border-r-4 border-[#d97706] pointer-events-none"></div>
        <div className="absolute top-7 right-7 w-5 h-5 border-t-2 border-r-2 border-[#1b4332] pointer-events-none"></div>
        
        {/* Bottom Left */}
        <div className="absolute bottom-5 left-5 w-8 h-8 border-b-4 border-l-4 border-[#d97706] pointer-events-none"></div>
        <div className="absolute bottom-7 left-7 w-5 h-5 border-b-2 border-l-2 border-[#1b4332] pointer-events-none"></div>
        
        {/* Bottom Right */}
        <div className="absolute bottom-5 right-5 w-8 h-8 border-b-4 border-r-4 border-[#d97706] pointer-events-none"></div>
        <div className="absolute bottom-7 right-7 w-5 h-5 border-b-2 border-r-2 border-[#1b4332] pointer-events-none"></div>

        {/* Header Block */}
        <div className="relative z-10 space-y-4">
          <div className="text-center space-y-1">
            <div className="text-lg font-bold text-[#1b4332] tracking-wider font-serif">بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ</div>
            <div className="text-[10px] text-gray-500 font-medium">পরম করুণাময় অসীম দয়ালু আল্লাহর নামে শুরু করছি</div>
          </div>

          <div className="flex items-center justify-center gap-4 text-center">
            <img
              src={logo}
              onError={handleLogoError}
              alt="Logo"
              className="h-16 w-16 object-contain rounded-full border border-gray-300 bg-white"
              referrerPolicy="no-referrer"
            />
            <div className="text-left">
              <h1 className="text-2xl font-black text-[#1b4332] tracking-tight">পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ</h1>
              <div className="text-xs font-bold text-[#d97706] tracking-wide">সোনারগাঁও, দক্ষিণপাড়া, রাঙ্গুনিয়া, চট্টগ্রাম।</div>
            </div>
          </div>

          {/* Advisors Section */}
          {advisors.length > 0 && (
            <div className="space-y-2">
              <div className="bg-[#0b5e32] text-white text-center py-1.5 px-4 rounded-lg font-bold text-xs shadow-sm">
                সম্মানিত উপদেষ্টা মণ্ডলী (Honorable Advisors Board)
              </div>
              <div className="flex flex-wrap justify-center items-center gap-x-5 gap-y-1.5 text-[10.5px] font-bold text-gray-800 px-4 py-1 bg-emerald-50/50 rounded-md border border-emerald-100">
                {advisors.sort((a, b) => a.serialNo - b.serialNo).map((member, idx) => (
                  <span key={member.id} className="inline-flex items-center">
                    <span className="text-[#0b5e32] mr-1">●</span>
                    <span>{toBanglaNum(idx + 1).padStart(2, '০')}. {member.name}</span>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Committee Table Section */}
          {tableMembers.length > 0 && (
            <div className="space-y-2">
              <div className="bg-[#1e293b] text-white text-center py-1.5 px-4 rounded-lg font-bold text-xs shadow-sm">
                কার্যকরী পরিচালনা কমিটি কর্মকর্তা পরিষদ (Executive Working Committee)
              </div>
              <div className="overflow-hidden border border-slate-300 rounded-lg shadow-sm">
                <table className="w-full border-collapse border-spacing-0 text-left">
                  <thead>
                    <tr className="bg-[#f1f5f9] border-b border-slate-300 text-slate-800 text-center font-bold text-[10.5px]">
                      <th className="py-1.5 px-2 border-r border-slate-300 w-12 text-center">ক্র.নং</th>
                      <th className="py-1.5 px-3 border-r border-slate-300 text-left">পদের নাম (Designation)</th>
                      <th className="py-1.5 px-3 border-r border-slate-300 text-left">কর্মকর্তার নাম (Member Name)</th>
                      <th className="py-1.5 px-3 text-left">মোবাইল নম্বর (Contact)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const totalRowsCount = tableMembers.length;
                      let pdfTextClass = "text-[10.5px]";
                      let pdfPaddingClass = "py-1 px-3";
                      if (totalRowsCount > 25) {
                        pdfTextClass = "text-[9px]";
                        pdfPaddingClass = "py-0.5 px-2";
                      } else if (totalRowsCount > 18) {
                        pdfTextClass = "text-[9.5px]";
                        pdfPaddingClass = "py-0.5 px-2.5";
                      }

                      return tableMembers.map((m, idx) => (
                        <tr key={m.id} className="border-b border-slate-300 hover:bg-slate-50/50 transition">
                          <td className={`border-r border-slate-300 text-center font-bold text-[#1b4332] ${pdfTextClass} ${pdfPaddingClass}`}>
                            {toBanglaNum(idx + 1).padStart(2, '০')}
                          </td>
                          <td className={`border-r border-slate-300 text-left font-bold text-slate-700 ${pdfTextClass} ${pdfPaddingClass}`}>
                            {m.designation}
                          </td>
                          <td className={`border-r border-slate-300 text-left font-black text-slate-900 ${pdfTextClass} ${pdfPaddingClass}`}>
                            {m.name}
                          </td>
                          <td className={`text-left font-semibold text-slate-600 font-mono ${pdfTextClass} ${pdfPaddingClass}`}>
                            {m.phone && m.phone !== 'প্রযোজ্য নয়' ? toBanglaNum(m.phone) : 'প্রযোজ্য নয়'}
                          </td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Bottom Footer & Directives (Official Directives) */}
        <div className="relative z-10 space-y-4 mt-4">

          <div className="text-center space-y-2 pt-2 border-t border-slate-200">
            <div className="text-xs font-bold text-slate-800">
              অনুমোদনকারী: <span className="text-[#0b5e32]">এলাকাবাসী</span>
            </div>
            <div className="text-[9px] text-[#0b5e32] font-semibold tracking-wide">
              • এই কপিটি কম্পিউটার দ্বারা অনলাইন প্ল্যাটফর্ম হতে সংগৃহীত ও প্রত্যায়িত।
            </div>
          </div>
        </div>

      </div>

    </div>
  );
}
