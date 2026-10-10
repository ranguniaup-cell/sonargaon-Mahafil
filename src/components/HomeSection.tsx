import React from 'react';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { Calendar, MapPin, Clock, Award, BookOpen, Heart, ShieldCheck, ChevronRight, Mic, Sparkles, Users, Share2, Check, QrCode } from 'lucide-react';
import { MahfilDetails, InvitedScholar, ActivityService, GalleryPhoto } from '../types';
import { initial2026Programs } from '../initialData';
import PhotoGallerySection from './PhotoGallerySection';

interface HomeSectionProps {
  onNavigate: (tab: string) => void;
  mahfilDetails: MahfilDetails;
  scholars?: InvitedScholar[];
  activities?: ActivityService[];
  photos?: GalleryPhoto[];
  isAdminLoggedIn?: boolean;
}

export default function HomeSection({ onNavigate, mahfilDetails, scholars = [], activities = [], photos = [], isAdminLoggedIn }: HomeSectionProps) {
  // Translate English digits to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // Convert Gregorian date (YYYY-MM-DD) into Bengali representation
  const getEnglishDateInBangla = (targetDateStr: string): string => {
    if (!targetDateStr) return '০৫ সেপ্টেম্বর, ২০২৬ ইং';
    try {
      const date = new Date(targetDateStr);
      if (isNaN(date.getTime())) return targetDateStr;
      
      const day = date.getDate();
      const year = date.getFullYear();
      
      const monthNamesBangla = [
        'জানুয়ারি', 'ফেব্রুয়ারি', 'মার্চ', 'এপ্রিল', 'মে', 'জুন',
        'জুলাই', 'আগস্ট', 'সেপ্টেম্বর', 'অক্টোবর', 'নভেম্বর', 'ডিসেম্বর'
      ];
      const month = monthNamesBangla[date.getMonth()];
      
      const dayNamesBangla = [
        'রবিবার', 'সোমবার', 'মঙ্গলবার', 'বুধবার', 'বৃহস্পতিবার', 'শুক্রবার', 'শনিবার'
      ];
      const dayOfWeek = dayNamesBangla[date.getDay()];
      
      return `${toBanglaNum(day)}ই ${month}, ${toBanglaNum(year)} ইং (${dayOfWeek})`;
    } catch (e) {
      return '০৫ সেপ্টেম্বর, ২০২৬ ইং (শনিবার)';
    }
  };

  // State for Countdown to Rabi' al-Awwal
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // State for share link
  const [copied, setCopied] = React.useState(false);
  const [showQrPopover, setShowQrPopover] = React.useState(false);

  const handleShareClick = async () => {
    const shareData = {
      title: 'সোনারগাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল',
      text: 'সোনারগাঁও উদযাপন পরিষদের কমিটি ও ২০২৫ সালের সম্পূর্ণ আয়-ব্যয় রিপোর্ট দেখুন।',
      url: 'https://sonargaon-celebration-council-435217603340.asia-southeast1.run.app',
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Error sharing:', err);
        // Fallback copy
        copyToClipboard();
      }
    } else {
      copyToClipboard();
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText('https://sonargaon-celebration-council-435217603340.asia-southeast1.run.app');
      setCopied(true);
      setTimeout(() => setCopied(false), 3000);
    } catch (err) {
      console.error('Could not copy link:', err);
    }
  };

  React.useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(mahfilDetails.targetDate) - +new Date();
      let left = {
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0
      };

      if (difference > 0) {
        left = {
          days: Math.floor(difference / (1000 * 60 * 60 * 24)),
          hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
          minutes: Math.floor((difference / 1000 / 60) % 60),
          seconds: Math.floor((difference / 1000) % 60),
        };
      }
      return left;
    };

    const timer = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    setTimeLeft(calculateTimeLeft());

    return () => clearInterval(timer);
  }, [mahfilDetails.targetDate]);

  return (
    <div id="home-section" className="space-y-10 pb-16 animate-fade-in text-[#3c3c3c]">
      {/* 1st Top Section: Pure Clean Photo Gallery Slider */}
      {photos.length > 0 && (
        <PhotoGallerySection
          photos={photos}
          onOpenCPanel={() => onNavigate('admin')}
          isAdminLoggedIn={isAdminLoggedIn}
        />
      )}

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#064e3b] via-[#0d9488] to-[#0f766e] border-2 border-[#d97706] p-5 sm:p-6 md:pb-12 lg:py-8 lg:px-10 shadow-xl text-center">
        {/* Share and QR Code in the upper right corner */}
        <div className="absolute top-3 right-3 flex items-center space-x-1.5 z-20">
          <button
            onClick={handleShareClick}
            className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg font-bold border text-[10px] sm:text-xs cursor-pointer shadow-sm transition duration-200 ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-500'
                : 'bg-white/95 hover:bg-white text-[#064e3b] border-[#cbd5e1]'
            }`}
            title="লিংক কপি করুন"
          >
            {copied ? <Check className="h-3.5 w-3.5 animate-pulse" /> : <Share2 className="h-3.5 w-3.5 text-[#d97706]" />}
            <span>{copied ? 'কপিড!' : 'শেয়ার'}</span>
          </button>

          <div className="relative">
            <button
              onClick={() => setShowQrPopover(!showQrPopover)}
              className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg font-bold border text-[10px] sm:text-xs cursor-pointer shadow-sm transition duration-200 ${
                showQrPopover
                  ? 'bg-[#d97706] text-white border-[#d97706]'
                  : 'bg-white/95 hover:bg-white text-[#064e3b] border-[#cbd5e1]'
              }`}
              title="কিউ আর কোড দেখুন"
            >
              <QrCode className="h-3.5 w-3.5 text-[#0f766e]" />
              <span>QR Code</span>
            </button>

            {showQrPopover && (
              <div className="absolute right-0 mt-2 w-48 bg-white border-2 border-[#d97706] rounded-xl p-3 shadow-xl z-30 animate-fade-in text-center flex flex-col items-center">
                <span className="text-[10px] font-bold text-[#064e3b] mb-1.5 block">মোবাইলে স্ক্যান করুন:</span>
                <img
                  src="https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=https://sonargaon-celebration-council-435217603340.asia-southeast1.run.app"
                  alt="QR Code"
                  className="w-32 h-32 border border-gray-100 p-1 bg-white rounded-lg shadow-sm"
                />
                <p className="text-[9px] text-gray-500 mt-1.5 leading-tight font-light">
                  এই কিউআর কোডটি স্ক্যান করে যেকোনো মোবাইলে সরাসরি সাইটটি ওপেন করুন।
                </p>
                <button
                  onClick={() => setShowQrPopover(false)}
                  className="text-[9px] text-[#0f766e] font-bold mt-2 hover:underline cursor-pointer"
                >
                  বন্ধ করুন
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#d97706]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#f8fafc]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Official Parishad Logo */}
          <div className="relative mb-3.5 group">
            <div className="absolute -inset-1.5 bg-gradient-to-r from-[#d97706] to-[#f59e0b] rounded-full blur-md opacity-75 group-hover:opacity-100 transition duration-300"></div>
            <img
              src={logo}
              onError={handleLogoError}
              alt="পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ লোগো"
              className="relative w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 rounded-full border-3 border-[#d97706] object-cover shadow-2xl bg-white p-0.5"
              referrerPolicy="no-referrer"
            />
          </div>

          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-white/10 text-white border border-white/20 mb-3 tracking-wide font-mono shadow-inner">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </span>

          <h1 className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-extrabold text-[#f8fafc] tracking-tight leading-tight mb-2 drop-shadow-md">
            সোনার গাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদ
          </h1>

          <p className="text-[#f8fafc]/90 text-[11px] sm:text-xs md:text-sm max-w-2xl leading-relaxed mb-4 font-light">
            “সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম” এর ঐতিহ্যবাহী ঈদে মিলাদুন্নবী (দঃ) উদযাপন ও জশনে জুলুস বর্ণাঢ্য এবং সুশৃঙ্খলভাবে সম্পন্ন করার লক্ষ্যে গঠিত উদযাপন পরিষদ।
          </p>

          <div className="flex flex-row flex-wrap justify-center gap-2 mt-1 md:absolute md:bottom-3 md:right-4">
            <button
              onClick={() => onNavigate('committee')}
              className="flex items-center justify-center space-x-1 px-3.5 py-1.5 bg-[#d97706] hover:bg-[#a38c5b] text-white font-bold rounded-lg shadow-md transition duration-200 text-xs cursor-pointer"
            >
              <span>পরিষদ কমিটি দেখুন</span>
              <ChevronRight className="h-3 w-3" />
            </button>
            {isAdminLoggedIn && (
              <button
                onClick={() => onNavigate('house-report')}
                className="flex items-center justify-center space-x-1 px-3.5 py-1.5 bg-[#064e3b] hover:bg-[#042f2e] border border-[#d97706]/40 hover:border-[#d97706] text-white rounded-lg font-bold transition duration-200 text-xs cursor-pointer shadow-md"
              >
                <span>বাড়ি রিপোর্ট ও শিট</span>
              </button>
            )}
            <button
              onClick={() => onNavigate('finance')}
              className="flex items-center justify-center space-x-1 px-3.5 py-1.5 bg-[#0f766e]/80 hover:bg-[#0f766e] border border-[#d97706]/30 hover:border-[#d97706] text-white rounded-lg font-bold transition duration-200 text-xs cursor-pointer"
            >
              <span>আয়-ব্যয় হিসাব</span>
            </button>
          </div>
        </div>
      </section>

      {/* Islamic Verse / Quote Block */}
      <section className="bg-[#f1f5f9] border border-[#cbd5e1] rounded-2xl p-6 sm:p-8 relative">
        <div className="absolute top-4 left-4 text-4xl text-[#d97706]/10 font-serif">“</div>
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-[#064e3b] text-lg sm:text-xl font-bold font-serif leading-relaxed italic">
            "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ"
          </p>
          <p className="text-[#3c3c3c] text-base sm:text-lg font-medium leading-relaxed">
            "আমি আপনাকে সমগ্র বিশ্বজগতের জন্য রহমতস্বরূপই প্রেরণ করেছি।"
          </p>
          <p className="text-[#0f766e] text-xs font-mono tracking-wider font-semibold">
            — আল-কুরআন, সূরা আল-আম্বিয়া, আয়াত: ১০৭
          </p>
        </div>
        <div className="absolute bottom-2 right-4 text-4xl text-[#d97706]/10 font-serif">”</div>
      </section>

      {/* Countdown & Event Details Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Grand Mahfil Information Card */}
        <div className="lg:col-span-7 bg-white/60 border border-[#cbd5e1] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#064e3b] border-b border-[#cbd5e1] pb-3 mb-6 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-[#0f766e]" />
              <span>আসন্ন পবিত্র মাহফিল ও জুলুস বিবরণী</span>
            </h2>

            <div className="space-y-5">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#f1f5f9] border border-[#cbd5e1] rounded-xl text-[#0f766e]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs text-[#0f766e] font-semibold">নির্ধারিত তারিখ</h4>
                  <p className="text-[#3c3c3c] text-sm sm:text-base font-bold mt-0.5">
                    {mahfilDetails.date}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#f1f5f9] border border-[#cbd5e1] rounded-xl text-[#0f766e]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs text-[#0f766e] font-semibold">সময়সূচী</h4>
                  <p className="text-[#3c3c3c] text-sm sm:text-base font-bold mt-0.5">
                    {mahfilDetails.time}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#f1f5f9] border border-[#cbd5e1] rounded-xl text-[#0f766e]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs text-[#0f766e] font-semibold">মাহফিল ময়দান</h4>
                  <p className="text-[#3c3c3c] text-sm sm:text-base font-bold mt-0.5">
                    {mahfilDetails.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#cbd5e1] flex items-center justify-between text-xs text-[#0f766e]">
            <span>সকল ধর্মপ্রাণ মুসলমানকে যথাসময়ে উপস্থিত হওয়ার জন্য বিনীত অনুরোধ রইল।</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="lg:col-span-5 bg-[#0f766e] text-[#f8fafc] rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#f8fafc]/5 rounded-full blur-2xl"></div>
          
          <h3 className="text-[#d97706] font-bold text-lg mb-2 tracking-wide flex items-center space-x-2 justify-center">
            <span>জুলুস ও মাহফিলের বাকি সময়</span>
          </h3>
          
          <div className="text-[#f8fafc] text-xs sm:text-xs md:text-sm font-semibold bg-[#064e3b]/50 px-4 py-2 sm:py-2.5 rounded-xl border border-white/10 mb-6 w-full max-w-sm space-y-1 sm:space-y-1.5">
            <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 text-[#f8fafc]/95">
              <span>🕌 হিজরী তারিখ:</span>
              <span className="text-[#d97706] font-extrabold">{mahfilDetails.date.split('(')[0].trim()}</span>
            </div>
            <div className="flex flex-col sm:flex-row items-center justify-center sm:space-x-1.5 border-t border-white/5 pt-1 sm:pt-1.5">
              <span>📅 ইংরেজি তারিখ:</span>
              <span className="text-[#d97706] font-extrabold">{getEnglishDateInBangla(mahfilDetails.targetDate)}</span>
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3 w-full max-w-sm mb-6">
            <div className="bg-[#064e3b]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#f8fafc] font-mono">
                {toBanglaNum(timeLeft.days)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#f8fafc]/80 mt-1">দিন</span>
            </div>
            <div className="bg-[#064e3b]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#f8fafc] font-mono">
                {toBanglaNum(timeLeft.hours)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#f8fafc]/80 mt-1">ঘণ্টা</span>
            </div>
            <div className="bg-[#064e3b]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#f8fafc] font-mono">
                {toBanglaNum(timeLeft.minutes)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#f8fafc]/80 mt-1">মিনিট</span>
            </div>
            <div className="bg-[#064e3b]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#d97706] font-mono">
                {toBanglaNum(timeLeft.seconds)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#f8fafc]/80 mt-1">সেকেন্ড</span>
            </div>
          </div>

          <p className="text-[#f8fafc]/95 text-xs sm:text-sm leading-relaxed font-light">
            রাসূল সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম এর শুভাগমনকে স্মরণ করে আকিদা রক্ষার্থে জুলুস উদযাপন করা আমাদের ঈমানী দায়িত্ব।
          </p>
        </div>
      </section>

      {/* Invited Scholars section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#cbd5e1] pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#064e3b] flex items-center space-x-2">
            <Mic className="h-6 w-6 text-[#d97706]" />
            <span>২০২৬ সালের দাওয়াতকৃত ওলামায়ে কেরাম ও মেহমানদের তালিকা</span>
          </h2>
          <span className="inline-flex items-center mt-2 sm:mt-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#0f766e]/10 text-[#0f766e] border border-[#0f766e]/20 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-[#0f766e] mr-1.5"></span>
            লাইভ আপডেট
          </span>
        </div>

        {scholars.length === 0 ? (
          <div className="bg-white/40 border border-dashed border-[#cbd5e1] p-8 text-center rounded-2xl text-[#0f766e] text-sm">
            আপাতত হুজুরদের তালিকা নির্ধারিত হচ্ছে। অতি শীঘ্রই আপডেট করা হবে ইনশাআল্লাহ।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholars.map((sch, idx) => (
              <div key={sch.id} className="relative bg-white/75 border border-[#cbd5e1] rounded-2xl p-5 hover:border-[#d97706] hover:shadow-md transition duration-300 flex flex-col justify-between overflow-hidden group">
                {/* Visual badge indicator */}
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#d97706]/10 to-transparent p-6 rounded-bl-full pointer-events-none group-hover:bg-[#d97706]/20 transition duration-300"></div>
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-[#f1f5f9] rounded-full border border-[#d97706] flex items-center justify-center text-[#0f766e] font-bold font-mono text-xs shadow-inner">
                      {toBanglaNum(sch.serialNo)}
                    </div>
                    <span className="text-xs font-bold text-[#d97706] bg-[#f1f5f9] px-2.5 py-0.5 rounded-full border border-[#cbd5e1]">
                      {sch.serialNo === 1 ? 'সভাপতিত্ব করবেন' : 
                       sch.serialNo === 2 ? 'প্রধান মেহমান' : 
                       sch.serialNo === 3 ? 'প্রধান বক্তা' : 
                       sch.serialNo === 4 ? 'উদ্বোধক' : 
                       sch.serialNo === 5 ? 'সংবর্ধেয় অতিথি' : 
                       'আমন্ত্রিত বক্তা'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#064e3b] tracking-tight group-hover:text-[#0f766e] transition duration-300 leading-snug">
                    {sch.name}
                  </h3>
                  <p className="text-[#3c3c3c] text-xs font-medium leading-relaxed bg-[#f8fafc]/60 p-2.5 rounded-lg border border-[#e2e8f0]">
                    {sch.title}
                  </p>
                </div>

                {sch.topic && (
                  <div className="mt-4 pt-3 border-t border-dashed border-[#e2e8f0] text-[11px] text-[#0f766e] font-semibold flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#d97706] flex-shrink-0" />
                    <span className="text-[#3c3c3c] font-light">আলোচনার বিষয়:</span>
                    <span className="italic text-[#064e3b]">“{sch.topic}”</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 2026 Mahfil Full Programs Schedule Section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#cbd5e1] pb-3">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#064e3b] flex items-center space-x-2">
              <Clock className="h-6 w-6 text-[#d97706]" />
              <span>২০২৬ সালের পবিত্র আজিমুশশান মাহফিলের পূর্ণাঙ্গ কর্মসূচি ও সময়সূচী</span>
            </h2>
            <p className="text-xs text-[#64748b] mt-1">
              ১২ই রবিউল আউয়াল সকাল থেকে রাত পর্যন্ত অনুষ্ঠিতব্য সকল মোবারক কার্যক্রমের ধারাবাহিক সূচী
            </p>
          </div>
          <span className="inline-flex items-center mt-2 sm:mt-0 px-3 py-1 rounded-full text-xs font-bold bg-[#0f766e]/10 text-[#0f766e] border border-[#0f766e]/20">
            <Sparkles className="h-3.5 w-3.5 mr-1 text-[#d97706]" />
            নির্ধারিত কার্যক্রম
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {((mahfilDetails.programs && mahfilDetails.programs.length > 0) ? mahfilDetails.programs : initial2026Programs).map((prog, idx) => (
            <div 
              key={prog.id || idx} 
              className="bg-white/90 border border-[#cbd5e1] hover:border-[#d97706] rounded-2xl p-5 shadow-xs hover:shadow-md transition duration-300 flex flex-col justify-between group relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-[#0f766e]/5 to-transparent rounded-bl-3xl pointer-events-none group-hover:from-[#d97706]/10 transition"></div>
              
              <div className="space-y-3 relative z-10">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center text-xs font-bold px-2.5 py-1 rounded-lg bg-[#0f766e] text-white shadow-xs">
                    <Clock className="h-3 w-3 mr-1 text-amber-200" />
                    {prog.time}
                  </span>
                  <span className="text-[11px] font-bold text-[#d97706] bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                    পর্ব {toBanglaNum(idx + 1)}
                  </span>
                </div>

                <h3 className="text-base font-bold text-[#064e3b] group-hover:text-[#0f766e] transition leading-snug">
                  {prog.title}
                </h3>

                {prog.speaker && (
                  <div className="bg-[#f8fafc] border border-slate-200/80 rounded-xl p-2.5 text-xs text-[#334155]">
                    <span className="font-bold text-[#0f766e] block text-[11px] mb-0.5">পরিচালনা / আলোচক:</span>
                    <span>{prog.speaker}</span>
                  </div>
                )}

                {prog.details && (
                  <p className="text-xs text-[#475569] leading-relaxed">
                    {prog.details}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Core Activities & Values Section */}
      <section className="space-y-6">
        <div className="text-center space-y-1">
          <h2 className="text-2xl font-bold text-[#064e3b] flex items-center justify-center space-x-2">
            <Award className="h-6 w-6 text-[#d97706]" />
            <span>আমাদের বার্ষিক ও নিয়মিত কার্যক্রম ও সেবাসমূহ</span>
          </h2>
          <p className="text-xs text-[#64748b]">
            সোনারগাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) উদযাপন পরিষদের সামাজিক, দ্বীনি ও কল্যাণমুখী উদ্যোগ
          </p>
        </div>

        {activities.length === 0 ? (
          <div className="bg-white/40 border border-dashed border-[#cbd5e1] p-8 text-center rounded-2xl text-[#0f766e] text-sm">
            কোনো কার্যক্রম বা সেবা পাওয়া যায়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((act, idx) => {
              // Cycle through representative icons
              const icons = [<BookOpen className="h-6 w-6" />, <Heart className="h-6 w-6" />, <ShieldCheck className="h-6 w-6" />, <Users className="h-6 w-6" />];
              const icon = icons[idx % icons.length];
              
              return (
                <div key={act.id} className="bg-white/50 border border-[#cbd5e1] rounded-2xl p-6 hover:border-[#d97706] hover:shadow-md transition duration-300 group flex flex-col h-full justify-between">
                  <div>
                    <div className="h-12 w-12 bg-[#f1f5f9] rounded-xl flex items-center justify-center text-[#0f766e] mb-4 group-hover:scale-110 transition duration-300 border border-[#e2e8f0]">
                      {icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#064e3b] mb-2">{act.title}</h3>
                    <p className="text-[#3c3c3c]/90 text-sm leading-relaxed font-light">
                      {act.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
