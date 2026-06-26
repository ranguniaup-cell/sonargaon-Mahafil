import React from 'react';
import { CommitteeMember } from '../types';
import { Award, Shield, User, HelpCircle, Landmark, Megaphone, Globe, PenTool, BookOpen, Star, Printer, Download, Image } from 'lucide-react';

interface CommitteeSectionProps {
  members: CommitteeMember[];
}

export default function CommitteeSection({ members }: CommitteeSectionProps) {
  const committeeRef = React.useRef<HTMLDivElement>(null);
  const [isExporting, setIsExporting] = React.useState(false);
  const [viewMode, setViewMode] = React.useState<'cards' | 'table'>('cards');

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

    // Save original getComputedStyle of main window
    const originalMainGetComputedStyle = window.getComputedStyle;

    // Helper to patch getComputedStyle on a window object to avoid oklch/oklab errors
    const patchGetComputedStyle = (win: any) => {
      const originalGetComputedStyle = win.getComputedStyle;
      if (!originalGetComputedStyle) return;

      win.getComputedStyle = function (el: Element, pseudoElt?: string) {
        const style = originalGetComputedStyle.call(this, el, pseudoElt);
        if (!style) return style;

        return new Proxy(style, {
          get(target: any, prop: string | symbol, receiver: any) {
            const val = target[prop];
            if (typeof val === 'string') {
              if (val.includes('oklch') || val.includes('oklab')) {
                return val
                  .replace(/oklch\([^)]+\)/g, 'rgb(93, 109, 62)')
                  .replace(/oklab\([^)]+\)/g, 'rgb(93, 109, 62)');
              }
            }
            if (typeof val === 'function') {
              if (prop === 'getPropertyValue') {
                return function (propertyName: string) {
                  const originalVal = target.getPropertyValue(propertyName);
                  if (typeof originalVal === 'string' && (originalVal.includes('oklch') || originalVal.includes('oklab'))) {
                    return originalVal
                      .replace(/oklch\([^)]+\)/g, 'rgb(93, 109, 62)')
                      .replace(/oklab\([^)]+\)/g, 'rgb(93, 109, 62)');
                  }
                  return originalVal;
                };
              }
              return val.bind(target);
            }
            return val;
          }
        });
      };
    };

    try {
      // Patch main window
      patchGetComputedStyle(window);

      const html2canvas = (await import('html2canvas')).default;
      const canvas = await html2canvas(committeeRef.current, {
        background: '#fdfcf7',
        useCORS: true,
        scale: 2, // high resolution
        logging: false,
        onclone: (clonedDoc: Document) => {
          // Patch cloned iframe window
          const iframeWin = clonedDoc.defaultView;
          if (iframeWin) {
            patchGetComputedStyle(iframeWin);
          }

          // Also sanitize styles in style tags as a fallback
          const styles = clonedDoc.getElementsByTagName('style');
          for (let i = 0; i < styles.length; i++) {
            const style = styles[i];
            if (style.textContent) {
              style.textContent = style.textContent
                .replace(/oklch\([^)]+\)/g, 'rgb(93, 109, 62)')
                .replace(/oklab\([^)]+\)/g, 'rgb(93, 109, 62)');
            }
          }
        }
      } as any);

      const image = canvas.toDataURL('image/png');
      const link = document.createElement('a');
      link.href = image;
      link.download = 'Milad_Committee_List_Sonargaon_2026.png';
      link.click();
    } catch (error) {
      console.error('Error generating image:', error);
      alert('দুঃখিত, ছবি ডাউনলোড করতে সমস্যা হয়েছে। দয়া করে আবার চেষ্টা করুন বা স্ক্রিনশট নিন।');
    } finally {
      // Restore original getComputedStyle of main window
      window.getComputedStyle = originalMainGetComputedStyle;
      setIsExporting(false);
    }
  };

  // Filter members by type
  const advisors = members.filter((m) => m.type === 'advisor');
  const leaders = members.filter((m) => m.type === 'leader');
  const generalMembers = members.filter((m) => m.type === 'member');

  // Assign custom icon based on designation
  const getLeaderIcon = (designation: string) => {
    switch (designation) {
      case 'সভাপতি':
        return <Shield className="h-6 w-6 text-[#2d3a1d]" />;
      case 'সহ-সভাপতি':
        return <Shield className="h-5 w-5 text-[#5d6d3e] opacity-80" />;
      case 'সাধারণ সম্পাদক':
        return <PenTool className="h-5 w-5 text-[#bfa46f]" />;
      case 'সহ-সাধারণ সম্পাদক':
        return <PenTool className="h-4 w-4 text-[#5d6d3e]" />;
      case 'অর্থ সম্পাদক':
        return <Landmark className="h-5 w-5 text-[#bfa46f]" />;
      case 'সহ-অর্থ সম্পাদক':
        return <Landmark className="h-4 w-4 text-[#5d6d3e]" />;
      case 'প্রচার সম্পাদক':
        return <Megaphone className="h-5 w-5 text-[#5d6d3e]" />;
      case 'প্রবাসী বিষয়ক সম্পাদক':
        return <Globe className="h-5 w-5 text-[#bfa46f]" />;
      default:
        return <User className="h-5 w-5 text-[#5d6d3e]" />;
    }
  };

  return (
    <div id="committee-section" className="space-y-8 pb-16 animate-fade-in text-[#3c3c3c]">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs sm:text-sm font-semibold tracking-wider text-[#5d6d3e] uppercase bg-[#5d6d3e]/10 px-3 py-1 rounded-full border border-[#d4cfc0]">
          উদযাপন কমিটি ২০২৬-২৭
        </span>
        <h2 className="text-3xl font-extrabold text-[#2d3a1d] tracking-tight">
          পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
        </h2>
        <div className="h-0.5 w-24 bg-gradient-to-r from-transparent via-[#bfa46f] to-transparent mx-auto mt-3"></div>
        <p className="text-[#3c3c3c]/80 text-xs sm:text-sm leading-relaxed font-light pt-2">
          ঐতিহ্যবাহী সোনারগাঁও এলাকাবাসীর সম্মতিক্রমে গঠিত নবগঠিত উদযাপন পরিষদের সম্মানিত কর্মকর্তাদের তালিকা নিচে দেয়া হলো।
        </p>
      </div>

      {/* Download and Print Actions Bar */}
      <div className="flex flex-col items-center gap-4 bg-white border border-[#d4cfc0] rounded-2xl p-5 max-w-2xl mx-auto shadow-sm print:hidden">
        <div className="flex bg-[#f5f2eb] p-1 rounded-xl border border-[#d4cfc0] w-full sm:w-auto">
          <button
            onClick={() => setViewMode('cards')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
              viewMode === 'cards' ? 'bg-[#5d6d3e] text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            কার্ড ভিউ (Cards View)
          </button>
          <button
            onClick={() => setViewMode('table')}
            className={`flex-1 sm:flex-initial px-5 py-2 rounded-lg text-xs font-bold transition cursor-pointer text-center ${
              viewMode === 'table' ? 'bg-[#5d6d3e] text-white shadow-sm' : 'text-[#3c3c3c] hover:text-[#2d3a1d]'
            }`}
          >
            টেবিল ভিউ (Grid Table)
          </button>
        </div>

        <div className="flex flex-wrap justify-center gap-3 w-full border-t border-[#ece8de] pt-3">
          <button
            onClick={handlePrint}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-[#5d6d3e] hover:bg-[#43522f] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Printer className="h-4 w-4" />
            <span>কমিটি তালিকা প্রিন্ট করুন (Print/PDF)</span>
          </button>

          <button
            onClick={handleDownloadImage}
            disabled={isExporting}
            className="flex items-center justify-center space-x-2 px-5 py-2.5 bg-white hover:bg-[#f5f2eb] text-[#2d3a1d] border-2 border-[#d4cfc0] hover:border-[#bfa46f] rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer disabled:opacity-50"
          >
            <Image className="h-4 w-4 text-[#bfa46f]" />
            <span>{isExporting ? 'ছবি তৈরি হচ্ছে...' : 'ছবি হিসেবে ডাউনলোড করুন (PNG)'}</span>
          </button>
        </div>
      </div>

      {/* Main Committee list contents captured by ref */}
      <div ref={committeeRef} className="space-y-16 p-4 sm:p-8 bg-[#fdfcf7] rounded-3xl border border-[#d4cfc0]/30">
        <div className="text-center max-w-2xl mx-auto space-y-2 hidden print:block mb-8">
          <span className="text-sm font-semibold tracking-wider text-[#5d6d3e] uppercase bg-[#5d6d3e]/10 px-3 py-1 rounded-full border border-[#d4cfc0]">
            উদযাপন কমিটি ২০২৬-২৭
          </span>
          <h2 className="text-3xl font-extrabold text-[#2d3a1d] tracking-tight">
            পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
          </h2>
          <p className="text-[#3c3c3c]/80 text-sm font-light pt-2">
            সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম, বাংলাদেশ।
          </p>
        </div>

        {viewMode === 'table' ? (
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-[#2d3a1d] text-center flex items-center justify-center space-x-2">
              <span>উদযাপন পরিষদের সম্পূর্ণ তালিকা (টেবিল ভিউ)</span>
            </h3>
            <div className="overflow-x-auto border border-[#d4cfc0] rounded-2xl bg-white shadow-sm">
              <table className="w-full border-collapse text-left text-xs sm:text-sm text-[#3c3c3c]">
                <thead>
                  <tr className="bg-[#f5f2eb] border-b border-[#d4cfc0] text-[#2d3a1d] text-center">
                    <th className="py-3 px-2 sm:px-4 font-bold w-16">ক্রম</th>
                    <th className="py-3 px-4 sm:px-6 font-bold text-left">নাম</th>
                    <th className="py-3 px-4 sm:px-6 font-bold text-left">পদবি</th>
                    <th className="py-3 px-4 sm:px-6 font-bold">বিভাগ/ধরণ</th>
                  </tr>
                </thead>
                <tbody>
                  {members.map((member, idx) => (
                    <tr key={member.id} className="border-b border-[#ece8de]/70 hover:bg-[#fdfcf7]/60 transition">
                      <td className="py-3 px-2 sm:px-4 text-center font-mono font-semibold text-[#5d6d3e]">
                        {toBanglaNum(idx + 1)}
                      </td>
                      <td className="py-3 px-4 sm:px-6 font-bold text-[#2d3a1d]">{member.name}</td>
                      <td className="py-3 px-4 sm:px-6 text-[#3c3c3c]">{member.designation}</td>
                      <td className="py-3 px-4 sm:px-6 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                          member.type === 'advisor' 
                            ? 'bg-amber-50 text-amber-700 border-amber-200' 
                            : member.type === 'leader' 
                              ? 'bg-[#5d6d3e]/10 text-[#5d6d3e] border-[#5d6d3e]/20' 
                              : 'bg-gray-50 text-gray-700 border-gray-200'
                        }`}>
                          {member.type === 'advisor' ? 'উপদেষ্টা' : member.type === 'leader' ? 'কার্যনির্বাহী' : 'সদস্য'}
                        </span>
                      </td>
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
              <h3 className="text-xl font-bold text-[#2d3a1d] text-center flex items-center justify-center space-x-2">
                <Star className="h-5 w-5 text-[#bfa46f]" />
                <span>সম্মানিত উপদেষ্টা মণ্ডলী</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
                {advisors.map((member) => (
                  <div
                    id={`advisor-card-${member.id}`}
                    key={member.id}
                    className="relative overflow-hidden bg-[#f5f2eb] border-2 border-[#d4cfc0] hover:border-[#bfa46f] rounded-2xl p-6 text-center shadow-sm hover:shadow-md transition duration-300 group"
                  >
                    {/* Islamic Decorative Corners */}
                    <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-[#d4cfc0] group-hover:border-[#bfa46f] rounded-tl-xl transition duration-300"></div>
                    <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-[#d4cfc0] group-hover:border-[#bfa46f] rounded-tr-xl transition duration-300"></div>
                    <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-[#d4cfc0] group-hover:border-[#bfa46f] rounded-bl-xl transition duration-300"></div>
                    <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-[#d4cfc0] group-hover:border-[#bfa46f] rounded-br-xl transition duration-300"></div>

                    <div className="h-14 w-14 bg-white/80 border border-[#d4cfc0] rounded-full flex items-center justify-center mx-auto text-[#5d6d3e] mb-4 group-hover:scale-110 transition duration-300 shadow-sm">
                      <BookOpen className="h-6 w-6" />
                    </div>

                    <h4 className="text-lg font-bold text-[#2d3a1d] tracking-wide group-hover:text-[#5d6d3e] transition">
                      {member.name}
                    </h4>
                    <p className="text-[#bfa46f] text-xs font-bold mt-1 bg-[#bfa46f]/5 px-2.5 py-1 rounded-full border border-[#bfa46f]/10 inline-block">
                      {member.designation}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* 2. Leaders / Executives Section (কার্যনির্বাহী পরিষদ) */}
            <div className="space-y-6 pt-6">
              <h3 className="text-xl font-bold text-[#2d3a1d] text-center flex items-center justify-center space-x-2">
                <Award className="h-5 w-5 text-[#bfa46f]" />
                <span>কার্যনির্বাহী পরিষদ নেতৃবৃন্দ</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {leaders.map((member) => (
                  <div
                    id={`leader-card-${member.id}`}
                    key={member.id}
                    className="bg-white/70 border border-[#d4cfc0] hover:border-[#bfa46f] rounded-2xl p-5 flex items-start space-x-4 shadow-sm hover:shadow-md transition-all duration-300 transform hover:-translate-y-0.5 group"
                  >
                    {/* Leader serial/icon */}
                    <div className="relative flex-shrink-0">
                      <div className="h-12 w-12 bg-[#f5f2eb] border border-[#d4cfc0] group-hover:border-[#bfa46f] rounded-xl flex items-center justify-center transition duration-300 shadow-inner">
                        {getLeaderIcon(member.designation)}
                      </div>
                      <div className="absolute -bottom-1.5 -right-1.5 bg-[#5d6d3e] text-white font-bold text-[10px] h-5 w-5 rounded-full flex items-center justify-center border border-[#fdfcf7]">
                        {toBanglaNum(member.serialNo)}
                      </div>
                    </div>

                    {/* Leader Details */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-base font-bold text-[#2d3a1d] truncate group-hover:text-[#5d6d3e] transition tracking-wide">
                        {member.name}
                      </h4>
                      <p className="text-[#bfa46f] text-xs font-bold mt-1 inline-block">
                        {member.designation}
                      </p>
                      <div className="text-[10px] text-[#5d6d3e] font-medium mt-1 flex items-center space-x-1.5">
                        <span className="h-1.5 w-1.5 bg-[#5d6d3e] rounded-full"></span>
                        <span>উদযাপন পরিষদ কর্মকর্তা</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* 3. Senior Members Section (সিনিয়র সদস্য) */}
            <div className="space-y-6 pt-6">
              <h3 className="text-xl font-bold text-[#2d3a1d] text-center flex items-center justify-center space-x-2">
                <User className="h-5 w-5 text-[#bfa46f]" />
                <span>সম্মানিত সিনিয়র সদস্যবৃন্দ</span>
              </h3>

              <div className="bg-[#f5f2eb]/50 border border-[#d4cfc0] rounded-2xl p-6 sm:p-8 max-w-5xl mx-auto shadow-inner">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {generalMembers.map((member) => (
                    <div
                      id={`member-card-${member.id}`}
                      key={member.id}
                      className="bg-white/60 border border-[#d4cfc0] hover:border-[#bfa46f] hover:bg-white/90 p-3.5 rounded-xl flex items-center space-x-3 transition group shadow-sm"
                    >
                      <div className="h-8 w-8 bg-[#f5f2eb] border border-[#d4cfc0] rounded-full flex items-center justify-center text-[#5d6d3e] font-bold text-xs group-hover:border-[#bfa46f] group-hover:text-[#bfa46f] transition">
                        {toBanglaNum(member.serialNo)}
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-sm font-bold text-[#2d3a1d] truncate group-hover:text-[#5d6d3e]">
                          {member.name}
                        </h4>
                        <p className="text-[#5d6d3e] text-[10px] font-medium mt-0.5">
                          {member.designation}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}
      </div> {/* Closing committeeRef wrapper div */}
    </div>
  );
}
