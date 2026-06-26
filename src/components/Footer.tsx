import React from 'react';
import logo from '../assets/images/logo.jpg';
import { Heart } from 'lucide-react';

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
    <footer id="app-footer" className="bg-[#2d3a1d] text-[#fdfcf7] border-t-2 border-[#bfa46f] pt-12 pb-8 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-[#fdfcf7]/10">
          {/* Logo, title and description */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <img
                src={logo}
                alt="উদযাপন পরিষদ লোগো"
                className="h-12 w-12 rounded-full border border-[#bfa46f] object-cover"
                referrerPolicy="no-referrer"
              />
              <div className="flex flex-col">
                <span className="text-[#bfa46f] font-bold text-base leading-tight">
                  পবিত্র ঈদে মিলাদুন্নবী (দঃ)
                </span>
                <span className="text-[#fdfcf7]/90 font-semibold text-xs">
                  সোনারগাঁও উদযাপন পরিষদ
                </span>
              </div>
            </div>
            <p className="text-[#fdfcf7]/75 text-xs leading-relaxed max-w-xs font-light">
              মদিনার সুমহান বাণীতে জীবন গড়া এবং আশেক-এ-রাসূলদের হৃদয়ে পবিত্র ঈদে মিলাদুন্নবী (দঃ) এর শাশ্বত প্রেম ছড়িয়ে দেওয়াই আমাদের মূল লক্ষ্য।
            </p>
          </div>

          {/* Quick links */}
          <div className="space-y-3">
            <h4 className="text-[#bfa46f] font-bold text-sm tracking-wider uppercase">দ্রুত মেনু</h4>
            <div className="grid grid-cols-2 gap-2 text-xs text-[#fdfcf7]/90">
              <button onClick={() => setActiveTab('home')} className="text-left hover:text-[#bfa46f] transition-colors cursor-pointer">মূল পাতা</button>
              <button onClick={() => setActiveTab('committee')} className="text-left hover:text-[#bfa46f] transition-colors cursor-pointer">উদযাপন পরিষদ</button>
              <button onClick={() => setActiveTab('finance')} className="text-left hover:text-[#bfa46f] transition-colors cursor-pointer">আয়-ব্যয় হিসাব</button>
              <button onClick={() => setActiveTab('report')} className="text-left hover:text-[#bfa46f] transition-colors cursor-pointer">রিপোর্ট</button>
              <button onClick={() => setActiveTab('admin')} className="text-left hover:text-[#bfa46f] transition-colors cursor-pointer">সি-প্যানেল</button>
            </div>
          </div>

          {/* Contact and address */}
          <div className="space-y-3">
            <h4 className="text-[#bfa46f] font-bold text-sm tracking-wider uppercase">যোগাযোগ ও ঠিকানা</h4>
            <div className="text-xs text-[#fdfcf7]/85 space-y-2">
              <p>📍 সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম, বাংলাদেশ।</p>
              <p>📞 সভাপতি: +৮৮০১XXXXXXXXX</p>
              <p>✉️ ranguniaup@gmail.com</p>
            </div>
          </div>
        </div>

        {/* Legal and system watermark */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-[10px] text-[#fdfcf7]/60">
          <p>
            সোনারগাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) নবগঠিত উদযাপন পরিষদ © {toBanglaNum(2026)}। সর্বস্বত্ব সংরক্ষিত।
          </p>
          <p className="flex items-center space-x-1 mt-2 sm:mt-0 font-light">
            <span>নির্মিত হয়েছে আশেকানদের জন্য</span>
            <Heart className="h-3 w-3 text-red-500 fill-red-500" />
            <span>দ্বারা।</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
