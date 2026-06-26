import React from 'react';
import logo from '../assets/images/logo.jpg';
import { Calendar, MapPin, Clock, Award, BookOpen, Heart, MessageSquare, ShieldCheck, ChevronRight, Mic, Sparkles, Users, Share2, Download, Check, Smartphone, Info } from 'lucide-react';
import { MahfilDetails, InvitedScholar, ActivityService } from '../types';

interface HomeSectionProps {
  onNavigate: (tab: string) => void;
  mahfilDetails: MahfilDetails;
  scholars?: InvitedScholar[];
  activities?: ActivityService[];
}

export default function HomeSection({ onNavigate, mahfilDetails, scholars = [], activities = [] }: HomeSectionProps) {
  // Translate English digits to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  // State for Countdown to Rabi' al-Awwal
  const [timeLeft, setTimeLeft] = React.useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  // State for PWA installation & share link
  const [deferredPrompt, setDeferredPrompt] = React.useState<any>(null);
  const [isInstallable, setIsInstallable] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [showInstallGuide, setShowInstallGuide] = React.useState(false);

  React.useEffect(() => {
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Check if already in standalone app mode
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) {
      // If there's no native prompt, show the interactive installation guide
      setShowInstallGuide(true);
      return;
    }
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      console.log('User accepted the install prompt');
      setIsInstallable(false);
    }
    setDeferredPrompt(null);
  };

  const handleShareClick = async () => {
    const shareData = {
      title: 'সোনারগাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) মাহফিল',
      text: 'সোনারগাঁও উদযাপন পরিষদের কমিটি ও ২০২৫ সালের সম্পূর্ণ আয়-ব্যয় রিপোর্ট দেখুন।',
      url: window.location.origin,
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
      await navigator.clipboard.writeText(window.location.origin);
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
    <div id="home-section" className="space-y-12 pb-16 animate-fade-in text-[#3c3c3c]">
      {/* Hero Banner Section */}
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#2d3a1d] via-[#43522f] to-[#5d6d3e] border-2 border-[#bfa46f] p-8 sm:p-12 lg:p-16 shadow-xl text-center">
        {/* Decorative elements */}
        <div className="absolute top-0 left-0 w-32 h-32 bg-[#bfa46f]/10 rounded-full blur-3xl"></div>
        <div className="absolute bottom-0 right-0 w-48 h-48 bg-[#fdfcf7]/10 rounded-full blur-3xl"></div>
        
        <div className="max-w-3xl mx-auto flex flex-col items-center">
          {/* Logo with gold rotating glow effect */}
          <div className="relative mb-6">
            <div className="absolute -inset-2 bg-gradient-to-r from-[#bfa46f] via-[#ece8de] to-[#5d6d3e] rounded-full opacity-70 blur-md animate-pulse"></div>
            <img
              src={logo}
              alt="উদযাপন পরিষদ লোগো"
              className="relative h-28 w-28 sm:h-36 sm:w-36 rounded-full border-4 border-[#bfa46f] object-cover shadow-2xl"
              referrerPolicy="no-referrer"
            />
          </div>

          <span className="inline-flex items-center px-4 py-1.5 rounded-full text-xs sm:text-sm font-semibold bg-[#bfa46f]/20 text-[#bfa46f] border border-[#bfa46f]/30 mb-4 tracking-wide font-mono">
            بِسْمِ اللَّهِ الرَّحْمَٰنِ الرَّحِيمِ
          </span>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#fdfcf7] tracking-tight leading-tight mb-4 drop-shadow-md">
            সোনার গাঁও পবিত্র ঈদে মিলাদুন্নবী (দঃ) <br />
            <span className="text-[#bfa46f] font-bold">
              নবগঠিত উদযাপন পরিষদ
            </span>
          </h1>

          <p className="text-[#fdfcf7]/90 text-sm sm:text-base md:text-lg max-w-2xl leading-relaxed mb-8 font-light">
            “সোনারগাঁও, রাঙ্গুনিয়া, চট্টগ্রাম” এর ঐতিহ্যবাহী ঈদে মিলাদুন্নবী (দঃ) উদযাপন ও জশনে জুলুস বর্ণাঢ্য এবং সুশৃঙ্খলভাবে সম্পন্ন করার লক্ষ্যে গঠিত নবগঠিত উদযাপন পরিষদ।
          </p>

          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
            <button
              onClick={() => onNavigate('committee')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#bfa46f] hover:bg-[#a38c5b] text-white font-bold rounded-xl shadow-lg shadow-[#bfa46f]/20 transition-all duration-300 transform hover:-translate-y-0.5 active:translate-y-0 text-sm cursor-pointer"
            >
              <span>পরিষদ কমিটি দেখুন</span>
              <ChevronRight className="h-4 w-4" />
            </button>
            <button
              onClick={() => onNavigate('finance')}
              className="flex items-center justify-center space-x-2 px-6 py-3 bg-[#5d6d3e]/80 hover:bg-[#5d6d3e] border border-[#bfa46f]/30 hover:border-[#bfa46f] text-white rounded-xl font-bold transition-all duration-300 text-sm cursor-pointer"
            >
              <span>আয়-ব্যয় হিসাব ও রিপোর্ট</span>
            </button>
          </div>
        </div>
      </section>

      {/* PWA Install & Share Section */}
      <section className="bg-white/95 border-2 border-[#bfa46f] rounded-2xl p-5 sm:p-6 shadow-md">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-5">
          <div className="max-w-xl">
            <h3 className="text-[#2d3a1d] text-base sm:text-lg font-black flex items-center space-x-2">
              <Smartphone className="h-5 w-5 text-[#5d6d3e]" />
              <span>মোবাইলে সহজে ব্যবহার ও শেয়ার করুন</span>
            </h3>
            <p className="text-[#3c3c3c] text-xs sm:text-sm mt-1.5 leading-relaxed font-light">
              পবিত্র মাহফিলের এই হিসাব ও সদস্য তালিকা আপনার মোবাইলে সরাসরি ইনস্টল করতে পারবেন এবং বন্ধুদের সাথে লিংক শেয়ার দিয়ে সবাইকে দেখতে সহযোগিতা করতে পারেন।
            </p>
          </div>

          <div className="flex flex-row gap-3 w-full md:w-auto">
            <button
              onClick={handleInstallClick}
              className="flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 bg-[#5d6d3e] hover:bg-[#43522f] text-white font-bold rounded-xl shadow-md transition duration-200 text-xs sm:text-sm cursor-pointer"
            >
              <Download className="h-4 w-4" />
              <span>ইনস্টল করুন</span>
            </button>

            <button
              onClick={handleShareClick}
              className={`flex-1 md:flex-initial flex items-center justify-center space-x-2 px-4 py-2.5 rounded-xl font-bold border transition duration-200 text-xs sm:text-sm cursor-pointer ${
                copied
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-300'
                  : 'bg-[#fdfcf7] hover:bg-[#f5f2eb] text-[#2d3a1d] border-[#d4cfc0]'
              }`}
            >
              {copied ? <Check className="h-4 w-4 text-emerald-600 animate-bounce" /> : <Share2 className="h-4 w-4 text-[#bfa46f]" />}
              <span>{copied ? 'লিংক কপিড!' : 'লিংক শেয়ার করুন'}</span>
            </button>
          </div>
        </div>

        {/* Installation Instructions */}
        {(showInstallGuide || isInstallable) && (
          <div className="mt-4 pt-4 border-t border-dashed border-[#d4cfc0] animate-fade-in text-xs sm:text-sm text-[#3c3c3c] space-y-3 bg-[#fdfcf7]/60 p-4 rounded-xl">
            <p className="font-bold text-[#2d3a1d] flex items-center space-x-1.5">
              <Info className="h-4 w-4 text-[#bfa46f]" />
              <span>মোবাইলে বা কম্পিউটারে ইনস্টল করার সহজ নিয়ম:</span>
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="space-y-1 bg-white/70 p-3 rounded-lg border border-[#ece8de]">
                <p className="font-bold text-[#5d6d3e]">🤖 এন্ড্রয়েড / ক্রোম ব্রাউজার:</p>
                <ol className="list-decimal pl-4 space-y-1 font-light leading-relaxed text-[#3c3c3c]">
                  <li>উপরে ডানে অবস্থিত <b>৩ ডট (মেনু)</b> অপশনে ট্যাপ করুন।</li>
                  <li>মেনু তালিকা থেকে <b>"Install app"</b> অথবা <b>"Add to Home Screen"</b> চাপুন।</li>
                  <li>কনফার্ম করুন, অ্যাপটি সেকেন্ডের মধ্যে হোম স্ক্রিনে বসে যাবে।</li>
                </ol>
              </div>
              <div className="space-y-1 bg-white/70 p-3 rounded-lg border border-[#ece8de]">
                <p className="font-bold text-[#5d6d3e]">🍎 আইফোন / সাফারি (Safari):</p>
                <ol className="list-decimal pl-4 space-y-1 font-light leading-relaxed text-[#3c3c3c]">
                  <li>নিচের দিকে থাকা <b>Share (শেয়ার)</b> আইকনে ট্যাপ করুন।</li>
                  <li>মেনু থেকে নিচে স্ক্রল করে <b>"Add to Home Screen"</b> অপশনটি বেছে নিন।</li>
                  <li>ডান কোণায় <b>Add (যোগ করুন)</b> চাপলেই অ্যাপটি ইনস্টল হয়ে যাবে।</li>
                </ol>
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={() => setShowInstallGuide(false)}
                className="text-[#5d6d3e] font-semibold underline text-[11px] cursor-pointer hover:text-[#2d3a1d]"
              >
                নির্দেশনা লুকান
              </button>
            </div>
          </div>
        )}
      </section>

      {/* Islamic Verse / Quote Block */}
      <section className="bg-[#f5f2eb] border border-[#d4cfc0] rounded-2xl p-6 sm:p-8 relative">
        <div className="absolute top-4 left-4 text-4xl text-[#bfa46f]/10 font-serif">“</div>
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <p className="text-[#2d3a1d] text-lg sm:text-xl font-bold font-serif leading-relaxed italic">
            "وَمَا أَرْسَلْنَاكَ إِلَّا رَحْمَةً لِّلْعَالَمِينَ"
          </p>
          <p className="text-[#3c3c3c] text-base sm:text-lg font-medium leading-relaxed">
            "আমি আপনাকে সমগ্র বিশ্বজগতের জন্য রহমতস্বরূপই প্রেরণ করেছি।"
          </p>
          <p className="text-[#5d6d3e] text-xs font-mono tracking-wider font-semibold">
            — আল-কুরআন, সূরা আল-আম্বিয়া, আয়াত: ১০৭
          </p>
        </div>
        <div className="absolute bottom-2 right-4 text-4xl text-[#bfa46f]/10 font-serif">”</div>
      </section>

      {/* Countdown & Event Details Panel */}
      <section className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        {/* Grand Mahfil Information Card */}
        <div className="lg:col-span-7 bg-white/60 border border-[#d4cfc0] rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-sm">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-[#2d3a1d] border-b border-[#d4cfc0] pb-3 mb-6 flex items-center space-x-2">
              <Calendar className="h-5 w-5 text-[#5d6d3e]" />
              <span>আসন্ন পবিত্র মাহফিল ও জুলুস বিবরণী</span>
            </h2>

            <div className="space-y-5">
              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#f5f2eb] border border-[#d4cfc0] rounded-xl text-[#5d6d3e]">
                  <Calendar className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs text-[#5d6d3e] font-semibold">নির্ধারিত তারিখ</h4>
                  <p className="text-[#3c3c3c] text-sm sm:text-base font-bold mt-0.5">
                    {mahfilDetails.date}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#f5f2eb] border border-[#d4cfc0] rounded-xl text-[#5d6d3e]">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs text-[#5d6d3e] font-semibold">সময়সূচী</h4>
                  <p className="text-[#3c3c3c] text-sm sm:text-base font-bold mt-0.5">
                    {mahfilDetails.time}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <div className="p-3 bg-[#f5f2eb] border border-[#d4cfc0] rounded-xl text-[#5d6d3e]">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-xs text-[#5d6d3e] font-semibold">মাহফিল ময়দান</h4>
                  <p className="text-[#3c3c3c] text-sm sm:text-base font-bold mt-0.5">
                    {mahfilDetails.location}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#d4cfc0] flex items-center justify-between text-xs text-[#5d6d3e]">
            <span>সকল ধর্মপ্রাণ মুসলমানকে যথাসময়ে উপস্থিত হওয়ার জন্য বিনীত অনুরোধ রইল।</span>
          </div>
        </div>

        {/* Countdown Timer */}
        <div className="lg:col-span-5 bg-[#5d6d3e] text-[#fdfcf7] rounded-2xl p-6 sm:p-8 flex flex-col justify-center items-center text-center shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-24 h-24 bg-[#fdfcf7]/5 rounded-full blur-2xl"></div>
          
          <h3 className="text-[#bfa46f] font-bold text-lg mb-2 tracking-wide flex items-center space-x-2 justify-center">
            <span>জুলুস ও মাহফিলের বাকি সময়</span>
          </h3>
          
          <div className="text-[#fdfcf7] text-xs sm:text-sm font-semibold bg-[#2d3a1d]/50 px-4 py-1.5 rounded-xl border border-white/10 mb-6 max-w-xs">
            📅 মাহফিলের তারিখ: <span className="text-[#bfa46f] font-bold">{mahfilDetails.date}</span>
          </div>

          <div className="grid grid-cols-4 gap-3 w-full max-w-sm mb-6">
            <div className="bg-[#2d3a1d]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#fdfcf7] font-mono">
                {toBanglaNum(timeLeft.days)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#fdfcf7]/80 mt-1">দিন</span>
            </div>
            <div className="bg-[#2d3a1d]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#fdfcf7] font-mono">
                {toBanglaNum(timeLeft.hours)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#fdfcf7]/80 mt-1">ঘণ্টা</span>
            </div>
            <div className="bg-[#2d3a1d]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#fdfcf7] font-mono">
                {toBanglaNum(timeLeft.minutes)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#fdfcf7]/80 mt-1">মিনিট</span>
            </div>
            <div className="bg-[#2d3a1d]/40 border border-white/10 p-3 sm:p-4 rounded-xl flex flex-col justify-center items-center shadow-inner">
              <span className="text-xl sm:text-3xl font-extrabold text-[#bfa46f] font-mono">
                {toBanglaNum(timeLeft.seconds)}
              </span>
              <span className="text-[10px] sm:text-xs text-[#fdfcf7]/80 mt-1">সেকেন্ড</span>
            </div>
          </div>

          <p className="text-[#fdfcf7]/95 text-xs sm:text-sm leading-relaxed font-light">
            রাসূল সাল্লাল্লাহু আলাইহি ওয়া সাল্লাম এর শুভাগমনকে স্মরণ করে আকিদা রক্ষার্থে জুলুস উদযাপন করা আমাদের ঈমানী দায়িত্ব।
          </p>
        </div>
      </section>

      {/* Invited Scholars section */}
      <section className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between border-b border-[#d4cfc0] pb-3">
          <h2 className="text-xl sm:text-2xl font-bold text-[#2d3a1d] flex items-center space-x-2">
            <Mic className="h-6 w-6 text-[#bfa46f]" />
            <span>২০২৬ সালের দাওয়াতকৃত ওলামায়ে কেরাম ও মেহমানদের তালিকা</span>
          </h2>
          <span className="inline-flex items-center mt-2 sm:mt-0 px-2.5 py-1 rounded-full text-[10px] font-bold bg-[#5d6d3e]/10 text-[#5d6d3e] border border-[#5d6d3e]/20 animate-pulse">
            <span className="h-1.5 w-1.5 rounded-full bg-[#5d6d3e] mr-1.5"></span>
            লাইভ আপডেট
          </span>
        </div>

        {scholars.length === 0 ? (
          <div className="bg-white/40 border border-dashed border-[#d4cfc0] p-8 text-center rounded-2xl text-[#5d6d3e] text-sm">
            আপাতত হুজুরদের তালিকা নির্ধারিত হচ্ছে। অতি শীঘ্রই আপডেট করা হবে ইনশাআল্লাহ।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scholars.map((sch, idx) => (
              <div key={sch.id} className="relative bg-white/75 border border-[#d4cfc0] rounded-2xl p-5 hover:border-[#bfa46f] hover:shadow-md transition duration-300 flex flex-col justify-between overflow-hidden group">
                {/* Visual badge indicator */}
                <div className="absolute top-0 right-0 bg-gradient-to-l from-[#bfa46f]/10 to-transparent p-6 rounded-bl-full pointer-events-none group-hover:bg-[#bfa46f]/20 transition duration-300"></div>
                
                <div className="space-y-3 relative z-10">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-[#f5f2eb] rounded-full border border-[#bfa46f] flex items-center justify-center text-[#5d6d3e] font-bold font-mono text-xs shadow-inner">
                      {toBanglaNum(idx + 1)}
                    </div>
                    <span className="text-xs font-bold text-[#bfa46f] bg-[#f5f2eb] px-2.5 py-0.5 rounded-full border border-[#d4cfc0]">
                      {sch.serialNo === 1 ? 'প্রধান বক্তা' : sch.serialNo === 2 ? 'বিশেষ বক্তা' : 'আমন্ত্রিত বক্তা'}
                    </span>
                  </div>

                  <h3 className="text-base font-black text-[#2d3a1d] tracking-tight group-hover:text-[#5d6d3e] transition duration-300 leading-snug">
                    {sch.name}
                  </h3>
                  <p className="text-[#3c3c3c] text-xs font-medium leading-relaxed bg-[#fdfcf7]/60 p-2.5 rounded-lg border border-[#ece8de]">
                    {sch.title}
                  </p>
                </div>

                {sch.topic && (
                  <div className="mt-4 pt-3 border-t border-dashed border-[#ece8de] text-[11px] text-[#5d6d3e] font-semibold flex items-center space-x-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#bfa46f] flex-shrink-0" />
                    <span className="text-[#3c3c3c] font-light">আলোচনার বিষয়:</span>
                    <span className="italic text-[#2d3a1d]">“{sch.topic}”</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Core Activities & Values Section */}
      <section className="space-y-6">
        <h2 className="text-2xl font-bold text-center text-[#2d3a1d] flex items-center justify-center space-x-2">
          <Award className="h-6 w-6 text-[#bfa46f]" />
          <span>আমাদের কার্যক্রম ও সেবাসমূহ</span>
        </h2>

        {activities.length === 0 ? (
          <div className="bg-white/40 border border-dashed border-[#d4cfc0] p-8 text-center rounded-2xl text-[#5d6d3e] text-sm">
            কোনো কার্যক্রম বা সেবা পাওয়া যায়নি।
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {activities.map((act, idx) => {
              // Cycle through representative icons
              const icons = [<BookOpen className="h-6 w-6" />, <Heart className="h-6 w-6" />, <ShieldCheck className="h-6 w-6" />, <Users className="h-6 w-6" />];
              const icon = icons[idx % icons.length];
              
              return (
                <div key={act.id} className="bg-white/50 border border-[#d4cfc0] rounded-2xl p-6 hover:border-[#bfa46f] hover:shadow-md transition duration-300 group flex flex-col h-full justify-between">
                  <div>
                    <div className="h-12 w-12 bg-[#f5f2eb] rounded-xl flex items-center justify-center text-[#5d6d3e] mb-4 group-hover:scale-110 transition duration-300 border border-[#ece8de]">
                      {icon}
                    </div>
                    <h3 className="text-lg font-bold text-[#2d3a1d] mb-2">{act.title}</h3>
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
