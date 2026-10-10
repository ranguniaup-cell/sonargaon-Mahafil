import React from 'react';
import { VisitorSummary, ActiveSession, VisitorLog } from '../types';
import { 
  Users, 
  Globe, 
  Smartphone, 
  Monitor, 
  Tablet, 
  Clock, 
  TrendingUp, 
  Activity, 
  RefreshCw, 
  Compass, 
  ShieldCheck, 
  Eye, 
  Sparkles,
  Calendar,
  RotateCcw,
  Layers,
  Chrome
} from 'lucide-react';

interface CPanelVisitorAnalyticsProps {
  summary: VisitorSummary | null;
  activeSessions: ActiveSession[];
  activeCount: number;
  recentLogs: VisitorLog[];
  onRefresh?: () => void;
  onReset?: () => void;
}

export default function CPanelVisitorAnalytics({
  summary,
  activeSessions,
  activeCount,
  recentLogs,
  onRefresh,
  onReset
}: CPanelVisitorAnalyticsProps) {
  const [isResetting, setIsResetting] = React.useState(false);

  // Translate numbers to Bengali digits
  const toBanglaNum = (num: number | string | undefined | null): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    if (num === undefined || num === null) return '০';
    return num.toString().replace(/\d/g, (digit) => banglaDigits[parseInt(digit, 10)]);
  };

  const totalVisits = summary?.totalVisits ?? (recentLogs.length > 0 ? recentLogs.length : 1);
  const uniqueVisitors = summary?.uniqueVisitors ?? Math.max(1, Math.round(totalVisits * 0.7));
  
  // Calculate today's visits from dailyVisits
  const todayKey = new Date().toISOString().slice(0, 10);
  const todayVisits = summary?.dailyVisits?.[todayKey] ?? recentLogs.filter(l => l.date === todayKey).length;

  // Live count
  const liveCount = Math.max(activeCount, 1);

  // Device counts
  const mobileCount = summary?.deviceBreakdown?.mobile ?? recentLogs.filter(l => l.device === 'mobile').length;
  const desktopCount = summary?.deviceBreakdown?.desktop ?? recentLogs.filter(l => l.device === 'desktop').length;
  const tabletCount = summary?.deviceBreakdown?.tablet ?? recentLogs.filter(l => l.device === 'tablet').length;
  const deviceTotal = Math.max(1, mobileCount + desktopCount + tabletCount);
  const mobilePct = Math.round((mobileCount / deviceTotal) * 100);
  const desktopPct = Math.round((desktopCount / deviceTotal) * 100);
  const tabletPct = Math.max(0, 100 - mobilePct - desktopPct);

  // Last 7 days trend data
  const getLast7DaysData = () => {
    const result: { dateKey: string; label: string; count: number }[] = [];
    const dailyMap = summary?.dailyVisits || {};

    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateKey = d.toISOString().slice(0, 10);
      const dayName = d.toLocaleDateString('bn-BD', { weekday: 'short' });
      const dayNum = d.getDate();
      const count = dailyMap[dateKey] || 0;
      result.push({
        dateKey,
        label: `${dayName} (${toBanglaNum(dayNum)})`,
        count
      });
    }
    return result;
  };

  const last7Days = getLast7DaysData();
  const maxDayCount = Math.max(1, ...last7Days.map(d => d.count));

  // Handle Reset
  const handleResetClick = () => {
    if (confirm('আপনি কি নিশ্চিত যে ভিজিটর ট্রাফিক অ্যানালিটিক্স রিসেট করতে চান?')) {
      if (onReset) {
        setIsResetting(true);
        onReset();
        setTimeout(() => setIsResetting(false), 1500);
      }
    }
  };

  return (
    <div id="visitor-analytics-section" className="space-y-8 animate-fade-in text-[#3c3c3c]">
      {/* Header Bar */}
      <div className="bg-gradient-to-r from-[#064e3b] via-[#0f766e] to-[#047857] text-white p-5 sm:p-6 rounded-2xl sm:rounded-3xl shadow-lg flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-2 border-[#d97706]/40">
        <div className="space-y-1.5">
          <div className="flex items-center gap-2.5">
            <div className="h-10 w-10 rounded-xl bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20">
              <Activity className="h-5 w-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-xl sm:text-2xl font-black tracking-wide text-white">
                ওয়েবসাইট লাইভ ভিজিটর ও ট্রাফিক অ্যানালিটিক্স
              </h2>
              <p className="text-xs text-emerald-100 font-light">
                কতজন ভিজিটর আপনার ওয়েবসাইট দেখছেন এবং ব্রাউজ করছেন তার রিয়েল-টাইম ক্লাউড মনিটরিং
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto">
          {onRefresh && (
            <button
              type="button"
              onClick={onRefresh}
              className="px-3.5 py-2 rounded-xl bg-white/15 hover:bg-white/25 text-white text-xs font-bold transition flex items-center gap-1.5 border border-white/20 backdrop-blur-sm cursor-pointer"
              title="রিফ্রেশ করুন"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>রিফ্রেশ</span>
            </button>
          )}

          {onReset && (
            <button
              type="button"
              onClick={handleResetClick}
              disabled={isResetting}
              className="px-3.5 py-2 rounded-xl bg-rose-600/80 hover:bg-rose-600 text-white text-xs font-bold transition flex items-center gap-1.5 border border-rose-400/30 backdrop-blur-sm cursor-pointer disabled:opacity-50"
              title="অ্যানালিটিক্স রিসেট করুন"
            >
              <RotateCcw className={`h-3.5 w-3.5 ${isResetting ? 'animate-spin' : ''}`} />
              <span>রিসেট</span>
            </button>
          )}
        </div>
      </div>

      {/* 4 Main KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
        {/* Card 1: Currently Live Online */}
        <div className="bg-white border-2 border-emerald-300/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-[11px] sm:text-xs font-bold text-emerald-800 uppercase tracking-wider flex items-center gap-1.5">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
              </span>
              বর্তমানে লাইভ অনলাইনে
            </span>
            <div className="h-8 w-8 rounded-lg bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <Users className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-emerald-700 tracking-tight">
              {toBanglaNum(liveCount)} <span className="text-sm font-semibold text-emerald-600">জন</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#3c3c3c]/70 mt-1 flex items-center gap-1 font-medium">
              <span className="text-emerald-600 font-bold">●</span> রিয়েল-টাইম ব্রাউজ করছেন
            </p>
          </div>
        </div>

        {/* Card 2: Today's Visits */}
        <div className="bg-white border-2 border-amber-300/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-[11px] sm:text-xs font-bold text-amber-800 uppercase tracking-wider">
              আজকের সর্বমোট ভিজিট
            </span>
            <div className="h-8 w-8 rounded-lg bg-amber-100/80 text-amber-700 flex items-center justify-center">
              <Calendar className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-amber-700 tracking-tight">
              {toBanglaNum(todayVisits)} <span className="text-sm font-semibold text-amber-600">বার</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#3c3c3c]/70 mt-1 font-medium">
              আজকের দিনব্যাপী মোট পেজ ভিউ
            </p>
          </div>
        </div>

        {/* Card 3: Total All-time Visits */}
        <div className="bg-white border-2 border-teal-300/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-teal-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-[11px] sm:text-xs font-bold text-teal-800 uppercase tracking-wider">
              সর্বমোট পেজ ভিউ (Visits)
            </span>
            <div className="h-8 w-8 rounded-lg bg-teal-100/80 text-teal-700 flex items-center justify-center">
              <Globe className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-[#0f766e] tracking-tight">
              {toBanglaNum(totalVisits)} <span className="text-sm font-semibold text-teal-600">বার</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#3c3c3c]/70 mt-1 font-medium">
              শুরু হতে সর্বমোট ট্রাফিক ভিউ
            </p>
          </div>
        </div>

        {/* Card 4: Unique Visitors */}
        <div className="bg-white border-2 border-blue-300/80 rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition relative overflow-hidden group">
          <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-full -mr-8 -mt-8 pointer-events-none group-hover:scale-110 transition-transform"></div>
          <div className="flex items-center justify-between mb-2 relative z-10">
            <span className="text-[11px] sm:text-xs font-bold text-blue-800 uppercase tracking-wider">
              ইউনিক ভিজিটর (স্বতন্ত্র মানুষ)
            </span>
            <div className="h-8 w-8 rounded-lg bg-blue-100/80 text-blue-700 flex items-center justify-center">
              <ShieldCheck className="h-4 w-4" />
            </div>
          </div>
          <div className="relative z-10">
            <div className="text-2xl sm:text-3xl font-black text-blue-700 tracking-tight">
              {toBanglaNum(uniqueVisitors)} <span className="text-sm font-semibold text-blue-600">জন</span>
            </div>
            <p className="text-[10px] sm:text-xs text-[#3c3c3c]/70 mt-1 font-medium">
              ভিন্ন ভিন্ন স্বতন্ত্র ডিভাইস ও মানুষ
            </p>
          </div>
        </div>
      </div>

      {/* Middle Grid: Last 7 Days Traffic Trend & Device Breakdown */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: 7 Days Trend (7 cols) */}
        <div className="lg:col-span-7 bg-white border border-[#cbd5e1] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5">
          <div className="flex items-center justify-between border-b border-[#cbd5e1]/60 pb-3">
            <div className="flex items-center gap-2">
              <div className="h-7 w-7 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center">
                <TrendingUp className="h-4 w-4" />
              </div>
              <h3 className="text-base font-bold text-[#064e3b]">গত ৭ দিনের ভিজিটর পরিসংখ্যান</h3>
            </div>
            <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
              দৈনিক ট্রাফিক
            </span>
          </div>

          {/* Bar Chart Representation */}
          <div className="pt-2">
            <div className="h-48 flex items-end gap-2 sm:gap-4 px-2">
              {last7Days.map((day, idx) => {
                const heightPct = Math.max(12, Math.round((day.count / maxDayCount) * 100));
                const isToday = idx === 6;

                return (
                  <div key={day.dateKey} className="flex-1 flex flex-col items-center gap-1.5 group h-full justify-end">
                    {/* Tooltip Count */}
                    <span className="text-[11px] font-bold text-slate-700 opacity-80 group-hover:opacity-100 group-hover:scale-110 transition-all">
                      {toBanglaNum(day.count)}
                    </span>
                    
                    {/* Bar */}
                    <div 
                      className={`w-full max-w-[42px] rounded-t-lg transition-all duration-500 shadow-sm relative ${
                        isToday 
                          ? 'bg-gradient-to-t from-[#0f766e] to-[#047857] group-hover:from-amber-500 group-hover:to-amber-400' 
                          : 'bg-gradient-to-t from-slate-200 to-teal-100 group-hover:from-teal-300 group-hover:to-teal-200'
                      }`}
                      style={{ height: `${heightPct}%` }}
                    >
                      {isToday && (
                        <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-amber-400 animate-ping"></span>
                      )}
                    </div>

                    {/* Day Label */}
                    <span className={`text-[10px] sm:text-xs text-center font-medium leading-tight truncate w-full ${
                      isToday ? 'font-bold text-[#0f766e]' : 'text-[#3c3c3c]/70'
                    }`}>
                      {day.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Device & Browser Breakdown (5 cols) */}
        <div className="lg:col-span-5 bg-white border border-[#cbd5e1] rounded-2xl p-5 sm:p-6 shadow-sm space-y-5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-[#cbd5e1]/60 pb-3 mb-4">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                  <Smartphone className="h-4 w-4" />
                </div>
                <h3 className="text-base font-bold text-[#064e3b]">ডিভাইস ও ব্রাউজার বিশ্লেষণ</h3>
              </div>
              <span className="text-xs bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full font-medium">
                অনুপাত
              </span>
            </div>

            {/* Device Progress Bars */}
            <div className="space-y-4">
              {/* Mobile */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                    স্মার্টফোন / মোবাইল
                  </span>
                  <span className="text-amber-700 font-extrabold">
                    {toBanglaNum(mobilePct)}% ({toBanglaNum(mobileCount)} জন)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-amber-500 h-full rounded-full transition-all duration-700" style={{ width: `${mobilePct}%` }}></div>
                </div>
              </div>

              {/* Desktop */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between text-xs font-bold">
                  <span className="flex items-center gap-1.5 text-slate-700">
                    <Monitor className="h-3.5 w-3.5 text-[#0f766e]" />
                    কম্পিউটার / ল্যাপটপ
                  </span>
                  <span className="text-[#0f766e] font-extrabold">
                    {toBanglaNum(desktopPct)}% ({toBanglaNum(desktopCount)} জন)
                  </span>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-[#0f766e] h-full rounded-full transition-all duration-700" style={{ width: `${desktopPct}%` }}></div>
                </div>
              </div>

              {/* Tablet */}
              {tabletCount > 0 && (
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs font-bold">
                    <span className="flex items-center gap-1.5 text-slate-700">
                      <Tablet className="h-3.5 w-3.5 text-blue-600" />
                      ট্যাবলেট
                    </span>
                    <span className="text-blue-700 font-extrabold">
                      {toBanglaNum(tabletPct)}% ({toBanglaNum(tabletCount)} জন)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden">
                    <div className="bg-blue-500 h-full rounded-full transition-all duration-700" style={{ width: `${tabletPct}%` }}></div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Browser badges */}
          <div className="pt-4 border-t border-[#cbd5e1]/40">
            <p className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1.5">
              <Chrome className="h-3.5 w-3.5 text-slate-500" />
              শীর্ষ ব্রাউজারসমূহ:
            </p>
            <div className="flex flex-wrap gap-1.5">
              {summary?.browserBreakdown && Object.keys(summary.browserBreakdown).length > 0 ? (
                Object.entries(summary.browserBreakdown).map(([browser, count]) => (
                  <span key={browser} className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold border border-slate-200">
                    <span>{browser}:</span>
                    <span className="text-[#0f766e] font-bold">{toBanglaNum(count)}</span>
                  </span>
                ))
              ) : (
                <span className="text-xs text-slate-500 italic">Chrome, Safari, Firefox, Samsung Browser</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Active Sessions Live Feed */}
      {activeSessions.length > 0 && (
        <div className="bg-emerald-50/70 border-2 border-emerald-300 rounded-2xl p-5 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-600"></span>
              </span>
              <h3 className="text-sm sm:text-base font-bold text-emerald-900">
                বর্তমানে সক্রিয় লাইভ ভিজিটর তালিকা ({toBanglaNum(activeSessions.length)} টি সক্রিয় সেশন)
              </h3>
            </div>
            <span className="text-[11px] text-emerald-700 bg-emerald-100/90 font-bold px-2.5 py-1 rounded-full border border-emerald-300">
              লাইভ আপডেট
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
            {activeSessions.map((session, idx) => (
              <div key={session.sessionId || idx} className="bg-white p-3 rounded-xl border border-emerald-200 shadow-xs flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                    {session.device === 'mobile' ? (
                      <Smartphone className="h-4 w-4" />
                    ) : session.device === 'tablet' ? (
                      <Tablet className="h-4 w-4" />
                    ) : (
                      <Monitor className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-800">
                      ভিজিটর #{toBanglaNum(idx + 1)} ({session.device === 'mobile' ? 'মোবাইল' : 'ডেক্সটপ'})
                    </p>
                    <p className="text-[10px] text-emerald-600 font-medium truncate max-w-[140px]">
                      {session.browser} • {session.page || 'মূল পাতা'}
                    </p>
                  </div>
                </div>
                <span className="text-[9px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                  অনলাইন
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Visitors Activity Log Table */}
      <div className="bg-white border border-[#cbd5e1] rounded-2xl p-5 sm:p-6 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-[#cbd5e1]/60 pb-3">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-teal-50 text-[#0f766e] flex items-center justify-center">
              <Clock className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-[#064e3b]">সাম্প্রতিক ভিজিটর লগ (Recent Visit Activity)</h3>
              <p className="text-xs text-[#3c3c3c]/70 font-light">
                ভিজিটররা কখন কোন ডিভাইস দিয়ে ওয়েবসাইটে প্রবেশ করেছেন তার সাম্প্রতিক তালিকা
              </p>
            </div>
          </div>

          <span className="text-xs bg-slate-100 text-slate-600 px-3 py-1 rounded-full font-bold self-start sm:self-auto">
            সর্বশেষ {toBanglaNum(recentLogs.length)} টি ভিজিট
          </span>
        </div>

        {recentLogs.length === 0 ? (
          <div className="py-10 text-center text-slate-500 space-y-2">
            <Globe className="h-10 w-10 mx-auto text-slate-300 animate-pulse" />
            <p className="text-sm font-medium">কোনো সাম্প্রতিক ভিজিটর লগ পাওয়া যায়নি।</p>
            <p className="text-xs text-slate-400">ওয়েবসাইটে ভিজিটর আসার সাথে সাথে এখানে তালিকা দৃশ্যমান হবে।</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200 text-slate-700 font-bold">
                  <th className="py-2.5 px-3">সময় ও তারিখ</th>
                  <th className="py-2.5 px-3">ডিভাইস ও ওএস</th>
                  <th className="py-2.5 px-3">ব্রাউজার</th>
                  <th className="py-2.5 px-3">পরিদর্শিত পাতা</th>
                  <th className="py-2.5 px-3 text-right">ভিজিট স্ট্যাটাস</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {recentLogs.map((log, index) => (
                  <tr key={log.id || index} className="hover:bg-slate-50/70 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-800">{log.time || 'এইমাত্র'}</div>
                      <div className="text-[10px] text-slate-400">{log.date}</div>
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="flex items-center gap-1.5 font-semibold text-slate-700">
                        {log.device === 'mobile' ? (
                          <Smartphone className="h-3.5 w-3.5 text-amber-600" />
                        ) : log.device === 'tablet' ? (
                          <Tablet className="h-3.5 w-3.5 text-blue-600" />
                        ) : (
                          <Monitor className="h-3.5 w-3.5 text-[#0f766e]" />
                        )}
                        <span>{log.device === 'mobile' ? 'মোবাইল' : log.device === 'tablet' ? 'ট্যাবলেট' : 'কম্পিউটার'}</span>
                        <span className="text-[10px] text-slate-400">({log.os || 'OS'})</span>
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-slate-600 font-medium">
                      {log.browser || 'Browser'}
                    </td>
                    <td className="py-2.5 px-3">
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-teal-50 text-teal-800 font-medium text-[11px] border border-teal-200">
                        <Layers className="h-3 w-3 text-teal-600" />
                        {log.page || 'মূল পাতা'}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {log.isNew ? (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                          নতুন ভিজিটর
                        </span>
                      ) : (
                        <span className="inline-block px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[10px] font-semibold">
                          রিটার্নিং
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
