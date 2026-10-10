import React from 'react';
import { Phone, Award, Shield, UserCheck, Heart } from 'lucide-react';

interface FooterProps {
  setActiveTab: (tab: string) => void;
}

export default function Footer({ setActiveTab }: FooterProps) {
  // Translate numbers to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  return (
    <footer id="app-footer" className="bg-[#022c22] text-[#f8fafc] border-t border-[#d97706] py-4 sm:py-5 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          
          {/* Left: President & Finance Secretary Contact Details */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 md:gap-6 text-xs text-[#f8fafc]/90">
            <div className="flex flex-wrap items-center gap-2 bg-[#064e3b]/60 px-3 py-2 rounded-xl border border-[#d97706]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-pulse"></span>
              <span className="font-bold text-[#d97706]">সভাপতি:</span>
              <span className="font-semibold text-[#f8fafc]">মাস্টার মো: আবদুস সত্তার</span>
              <a href="tel:01660116070" className="text-[#d97706] hover:text-[#e2e8f0] hover:underline font-mono font-bold flex items-center gap-1 ml-1 bg-[#022c22] px-2 py-0.5 rounded border border-[#d97706]/10 transition-all duration-200">
                <Phone className="h-3 w-3 text-[#d97706]" />
                <span>01660-116070</span>
              </a>
            </div>

            <div className="flex flex-wrap items-center gap-2 bg-[#064e3b]/60 px-3 py-2 rounded-xl border border-[#d97706]/20">
              <span className="w-1.5 h-1.5 rounded-full bg-[#d97706] animate-pulse"></span>
              <span className="font-bold text-[#d97706]">অর্থ-সম্পাদক:</span>
              <span className="font-semibold text-[#f8fafc]">মো: তারেক জামাল</span>
              <a href="tel:01688055698" className="text-[#d97706] hover:text-[#e2e8f0] hover:underline font-mono font-bold flex items-center gap-1 ml-1 bg-[#022c22] px-2 py-0.5 rounded border border-[#d97706]/10 transition-all duration-200">
                <Phone className="h-3 w-3 text-[#d97706]" />
                <span>01688-055698</span>
              </a>
            </div>
          </div>

          {/* Right: Builder Credential */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
            <div className="text-[11px] sm:text-xs text-[#f8fafc]/80 leading-relaxed bg-[#064e3b]/40 border border-[#d97706]/15 rounded-xl px-3 py-2">
              <span className="text-[#d97706] font-bold">নির্মিতর নাম: </span>
              <span className="font-bold text-[#f8fafc]">মোঃ তারেক জামাল (ব্যাংকার)</span>
              <span className="text-[#f8fafc]/70 font-light block sm:inline sm:ml-1 text-[10px] sm:text-[11px]">
                (পল্লী সঞ্চয় ব্যাংক, রাঙ্গুনিয়া শাখা, চট্টগ্রাম)
              </span>
            </div>
          </div>

        </div>

        {/* Legal Row and Quick Links */}
        <div className="mt-4 pt-3 border-t border-[#f8fafc]/10 flex flex-col md:flex-row items-center justify-between gap-3 text-[10px] text-[#f8fafc]/50">
          <p>
            সোনারগাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ © {toBanglaNum(2026)}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <div className="flex flex-wrap justify-center items-center gap-3 font-medium">
            <button onClick={() => setActiveTab('home')} className="hover:text-[#d97706] transition-colors cursor-pointer">মূল পাতা</button>
            <span className="opacity-30">•</span>
            <button onClick={() => setActiveTab('committee')} className="hover:text-[#d97706] transition-colors cursor-pointer">উদযাপন পরিষদ</button>
            <span className="opacity-30">•</span>
            <button onClick={() => setActiveTab('finance')} className="hover:text-[#d97706] transition-colors cursor-pointer">আয়-ব্যয় হিসাব</button>
            <span className="opacity-30">•</span>
            <button onClick={() => setActiveTab('report')} className="hover:text-[#d97706] transition-colors cursor-pointer">রিপোর্ট</button>
            <span className="opacity-30">•</span>
            <button onClick={() => setActiveTab('admin')} className="hover:text-[#d97706] transition-colors cursor-pointer font-bold text-[#d97706]/80 hover:text-[#d97706]">সি-প্যানেল</button>
          </div>
        </div>
      </div>
    </footer>
  );
}
