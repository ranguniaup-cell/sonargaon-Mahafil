import React from 'react';
import { FileText, TrendingUp, DollarSign, Calendar, ArrowUpRight, ArrowDownRight, Award, PieChart, BarChart2 } from 'lucide-react';

export default function ReportSection() {
  const [selectedYear, setSelectedYear] = React.useState<string>('all');

  // Translate English digits to Bengali digits
  const toBanglaNum = (num: number | string): string => {
    const banglaDigits = ['০', '১', '২', '৩', '৪', '৫', '৬', '৭', '৮', '৯'];
    return num.toString().replace(/\d/g, (d) => banglaDigits[parseInt(d)]);
  };

  // Previous years data
  const historicalReports = [
    {
      year: '২০২৩ (১৪৪৫ হিজরী)',
      key: '2023',
      totalIncome: 450000,
      totalExpense: 420000,
      surplus: 30000,
      attendance: '৫,০০০+ জন',
      majorDonors: [
        { name: 'আলহাজ্ব মোহাম্মদ ইউনুস', amount: 50000, location: 'রাঙ্গুনিয়া' },
        { name: 'হাজী জহুরুল ইসলাম', amount: 30000, location: 'সোনারগাঁও' },
        { name: 'প্রবাসী কল্যাণ তহবিল', amount: 80000, location: 'দুবাই শাখা' },
      ],
      breakdown: [
        { category: 'প্যান্ডেল, আলোকসজ্জা ও ডেকোরেশন', amount: 150000, percentage: 35.7 },
        { category: 'তাবাররুক ও মেহমানদারি', amount: 180000, percentage: 42.8 },
        { category: 'বক্তা হাদিয়া ও যাতায়াত', amount: 50000, percentage: 11.9 },
        { category: 'মাইক ও প্রচার প্রচারণা', amount: 25000, percentage: 5.9 },
        { category: 'বিবিধ ও আনুষঙ্গিক', amount: 15000, percentage: 3.7 },
      ]
    },
    {
      year: '২০২৪ (১৪৪৬ হিজরী)',
      key: '2024',
      totalIncome: 580000,
      totalExpense: 550000,
      surplus: 30000,
      attendance: '৬,৫০০+ জন',
      majorDonors: [
        { name: 'লায়ন আলহাজ্ব ওসমান গণি', amount: 60000, location: 'চট্টগ্রাম' },
        { name: 'আলহাজ্ব সোলায়মান সওদাগর', amount: 40000, location: 'রাঙ্গুনিয়া' },
        { name: 'সোনারগাঁও প্রবাসী পরিষদ', amount: 120000, location: 'ওমান ও কাতার' },
      ],
      breakdown: [
        { category: 'প্যান্ডেল, আলোকসজ্জা ও ডেকোরেশন', amount: 200000, percentage: 36.3 },
        { category: 'তাবাররুক ও মেহমানদারি', amount: 210000, percentage: 38.2 },
        { category: 'বক্তা হাদিয়া ও যাতায়াত', amount: 80000, percentage: 14.5 },
        { category: 'মাইক ও প্রচার প্রচারণা', amount: 35000, percentage: 6.4 },
        { category: 'বিবিধ ও আনুষঙ্গিক', amount: 25000, percentage: 4.6 },
      ]
    },
    {
      year: '২০২৫ (১৪৪৭ হিজরী)',
      key: '2025',
      totalIncome: 612776,
      totalExpense: 571497,
      surplus: 41279,
      attendance: '৮,০০০+ জন',
      majorDonors: [
        { name: '১৩নং রসিদ বই (কালেকশন)', amount: 125200, location: 'রাঙ্গুনিয়া ও সোনারগাঁও' },
        { name: '১৫নং রসিদ বই (কালেকশন)', amount: 100315, location: 'রাঙ্গুনিয়া ও সোনারগাঁও' },
        { name: '১২নং রসিদ বই (কালেকশন)', amount: 85811, location: 'রাঙ্গুনিয়া ও সোনারগাঁও' },
      ],
      breakdown: [
        { category: 'তাবাররুক ও আপ্যায়ন সামগ্রী', amount: 391017, percentage: 68.4 },
        { category: 'সম্মানিত বক্তা ও অতিথি হাদিয়া', amount: 61150, percentage: 10.7 },
        { category: 'মঞ্চ ও ডেকোরেশন ভাড়া', amount: 20000, percentage: 3.5 },
        { category: 'মাইক ও সাউন্ড সিস্টেম', amount: 17750, percentage: 3.1 },
        { category: 'পোস্টার ও মাইকিং প্রচার', amount: 10250, percentage: 1.8 },
        { category: 'স্টেশনারি ও যাতায়াত', amount: 7255, percentage: 1.3 },
        { category: 'বিবিধ ও অন্যান্য ব্যয়', amount: 64075, percentage: 11.2 },
      ]
    }
  ];

  // Filtering reports based on selected year
  const displayedReports = selectedYear === 'all' 
    ? historicalReports 
    : historicalReports.filter(r => r.key === selectedYear);

  // Aggregated Values for Summary
  const overallIncome = historicalReports.reduce((sum, r) => sum + r.totalIncome, 0);
  const overallExpense = historicalReports.reduce((sum, r) => sum + r.totalExpense, 0);
  const overallSurplus = historicalReports.reduce((sum, r) => sum + r.surplus, 0);

  // Printable Area handler
  const handlePrintReport = () => {
    window.print();
  };

  return (
    <div className="space-y-10 animate-fade-in">
      {/* Visual Banner */}
      <div className="relative overflow-hidden bg-gradient-to-br from-[#2d3a1d] to-[#43522f] rounded-3xl p-8 sm:p-10 text-white shadow-xl">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-bl from-[#bfa46f]/20 to-transparent rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-10 -left-10 w-64 h-64 bg-[#5d6d3e]/20 rounded-full blur-2xl pointer-events-none"></div>
        
        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3">
            <span className="text-xs font-bold tracking-wider text-[#bfa46f] bg-[#bfa46f]/10 border border-[#bfa46f]/30 px-3 py-1 rounded-full uppercase inline-block">
              আর্কাইভ ও বার্ষিক পরিসংখ্যান
            </span>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              বিগত বছরসমূহের আয়-ব্যয় রিপোর্ট
            </h1>
            <p className="text-[#ece8de]/80 text-xs sm:text-sm font-light max-w-xl leading-relaxed">
              ২০২৩ খ্রি. হতে বিগত বছরগুলোর আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিলের আর্থিক বিবরণী, তাবাররুক ব্যয় এবং সম্মানিত দাতাদের অবদানের একটি স্বচ্ছ এবং সুন্দর চিত্র নিচে উপস্থাপন করা হলো।
            </p>
          </div>
          <div className="flex items-center space-x-3 self-start md:self-center">
            <button
              onClick={handlePrintReport}
              className="px-5 py-2.5 bg-[#bfa46f] hover:bg-[#a38754] text-white rounded-xl text-xs sm:text-sm font-bold shadow-md hover:shadow-lg transition-all transform hover:-translate-y-0.5 cursor-pointer"
            >
              রিপোর্ট প্রিন্ট করুন (PDF)
            </button>
          </div>
        </div>
      </div>

      {/* Aggregate Stats Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-green-50 text-green-700 rounded-xl border border-green-100">
            <TrendingUp className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a817c]">সর্বমোট বিগত বছরের আয়</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#2d3a1d] mt-1">
              ৳ {toBanglaNum(overallIncome.toLocaleString('bn-BD'))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-red-50 text-red-700 rounded-xl border border-red-100">
            <DollarSign className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a817c]">সর্বমোট বিগত বছরের ব্যয়</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#2d3a1d] mt-1">
              ৳ {toBanglaNum(overallExpense.toLocaleString('bn-BD'))}
            </div>
          </div>
        </div>

        <div className="bg-white border border-[#d4cfc0] rounded-2xl p-6 shadow-sm flex items-center space-x-4">
          <div className="p-3.5 bg-amber-50 text-amber-700 rounded-xl border border-amber-100">
            <Award className="h-6 w-6" />
          </div>
          <div>
            <div className="text-xs font-semibold text-[#8a817c]">সর্বমোট উদবৃত্ত অবশিষ্টাংশ</div>
            <div className="text-xl sm:text-2xl font-extrabold text-[#2d3a1d] mt-1">
              ৳ {toBanglaNum(overallSurplus.toLocaleString('bn-BD'))}
            </div>
          </div>
        </div>
      </div>

      {/* Year Filter Tab Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-[#f5f2eb] border border-[#d4cfc0] rounded-2xl p-4">
        <div className="flex items-center space-x-2">
          <Calendar className="h-5 w-5 text-[#5d6d3e]" />
          <span className="text-sm font-bold text-[#2d3a1d]">বছর নির্বাচন করুন:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedYear('all')}
            className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              selectedYear === 'all' 
                ? 'bg-[#5d6d3e] text-white shadow-sm' 
                : 'bg-white text-[#3c3c3c] border border-[#d4cfc0] hover:bg-white/80'
            }`}
          >
            সকল বছর একত্রে
          </button>
          {historicalReports.map((r) => (
            <button
              key={r.key}
              onClick={() => setSelectedYear(r.key)}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
                selectedYear === r.key 
                  ? 'bg-[#5d6d3e] text-white shadow-sm' 
                  : 'bg-white text-[#3c3c3c] border border-[#d4cfc0] hover:bg-white/80'
              }`}
            >
              {r.year}
            </button>
          ))}
        </div>
      </div>

      {/* Main Report View Card Block */}
      <div className="space-y-12">
        {displayedReports.map((report) => (
          <div key={report.key} className="bg-white border border-[#d4cfc0] rounded-3xl p-6 sm:p-8 shadow-sm space-y-8 relative overflow-hidden">
            {/* Islamic subtle corner decoration */}
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-[#bfa46f]/5 to-transparent rounded-bl-full pointer-events-none"></div>

            {/* Header of Year Card */}
            <div className="border-b border-[#ece8de] pb-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="space-y-1">
                <h3 className="text-xl font-bold text-[#2d3a1d] flex items-center space-x-2">
                  <span className="h-2.5 w-2.5 bg-[#bfa46f] rounded-full"></span>
                  <span>আজিমুশশান ঈদে মিলাদুন্নবী (দঃ) মাহফিল — {report.year}</span>
                </h3>
                <p className="text-[#8a817c] text-xs font-medium">সোনারগাঁও সরকারি প্রাথমিক বিদ্যালয় সংলগ্ন বিশাল ময়দান</p>
              </div>
              <div className="text-xs font-bold text-[#5d6d3e] bg-[#5d6d3e]/10 border border-[#d4cfc0] px-3.5 py-1.5 rounded-full inline-block">
                মোট উপস্থিতি: {report.attendance}
              </div>
            </div>

            {/* Financial Overview Cards of Specific Year */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              <div className="bg-[#fcfbf9] border border-[#ece8de] rounded-2xl p-4 text-center">
                <span className="text-[11px] font-bold text-[#5d6d3e] uppercase">মোট সংগৃহীত বাজেট (আয়)</span>
                <div className="text-xl font-extrabold text-green-700 mt-1">
                  ৳ {toBanglaNum(report.totalIncome.toLocaleString('bn-BD'))}
                </div>
              </div>
              <div className="bg-[#fcfbf9] border border-[#ece8de] rounded-2xl p-4 text-center">
                <span className="text-[11px] font-bold text-[#5d6d3e] uppercase">মোট ব্যয়িত বাজেট</span>
                <div className="text-xl font-extrabold text-red-600 mt-1">
                  ৳ {toBanglaNum(report.totalExpense.toLocaleString('bn-BD'))}
                </div>
              </div>
              <div className="bg-[#fcfbf9] border border-[#ece8de] rounded-2xl p-4 text-center">
                <span className="text-[11px] font-bold text-[#5d6d3e] uppercase">সমাপনী উদবৃত্ত অবশিষ্টাংশ</span>
                <div className="text-xl font-extrabold text-amber-700 mt-1">
                  ৳ {toBanglaNum(report.surplus.toLocaleString('bn-BD'))}
                </div>
              </div>
            </div>

            {/* Expenses Breakdown List & Graph */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Detailed Table */}
              <div className="lg:col-span-7 space-y-4">
                <h4 className="text-sm font-bold text-[#2d3a1d] flex items-center space-x-2 pb-2 border-b border-[#ece8de]">
                  <PieChart className="h-4 w-4 text-[#5d6d3e]" />
                  <span>ব্যয়ের খাতভিত্তিক বিবরণী</span>
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse text-left text-xs sm:text-sm">
                    <thead>
                      <tr className="border-b border-[#ece8de] text-[#5d6d3e] font-bold">
                        <th className="py-2.5 px-1">খাতের নাম</th>
                        <th className="py-2.5 px-3 text-right">ব্যয়ের পরিমাণ</th>
                        <th className="py-2.5 px-3 text-center">শতকরা হার</th>
                      </tr>
                    </thead>
                    <tbody>
                      {report.breakdown.map((item, idx) => (
                        <tr key={idx} className="border-b border-[#ece8de]/50 hover:bg-[#fdfcf7]/60 transition">
                          <td className="py-3 px-1 text-[#2d3a1d] font-semibold">{item.category}</td>
                          <td className="py-3 px-3 text-right font-bold text-[#3c3c3c]">
                            ৳ {toBanglaNum(item.amount.toLocaleString('bn-BD'))}
                          </td>
                          <td className="py-3 px-3 text-center">
                            <span className="px-2.5 py-0.5 bg-[#f5f2eb] rounded-full text-[10px] font-bold text-[#5d6d3e]">
                              {toBanglaNum(item.percentage)}%
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Graphical Visualizer (Clean Tailwind Progress representation) */}
              <div className="lg:col-span-5 bg-[#fdfcf7] border border-[#ece8de] rounded-2xl p-5 space-y-5 shadow-inner">
                <h4 className="text-sm font-bold text-[#2d3a1d] flex items-center space-x-2 border-b border-[#ece8de] pb-2">
                  <BarChart2 className="h-4 w-4 text-[#5d6d3e]" />
                  <span>ব্যয় বিশ্লেষণ গ্রাফ</span>
                </h4>
                <div className="space-y-4 pt-1">
                  {report.breakdown.map((item, idx) => (
                    <div key={idx} className="space-y-1">
                      <div className="flex justify-between text-[11px] font-bold text-[#3c3c3c]">
                        <span className="truncate max-w-[200px]">{item.category}</span>
                        <span>{toBanglaNum(item.percentage)}%</span>
                      </div>
                      <div className="w-full bg-[#ece8de] h-2.5 rounded-full overflow-hidden">
                        <div 
                          className="bg-[#5d6d3e] h-2.5 rounded-full" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Major Donors and Contributors */}
            <div className="pt-4 border-t border-[#ece8de]/70 space-y-4">
              <h4 className="text-sm font-bold text-[#2d3a1d] flex items-center space-x-2">
                <Award className="h-4 w-4 text-[#bfa46f]" />
                <span>প্রধান ডোনার ও পৃষ্ঠপোষকবৃন্দ</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {report.majorDonors.map((donor, idx) => (
                  <div key={idx} className="bg-white border border-[#ece8de] rounded-xl p-4 flex items-center justify-between shadow-sm">
                    <div className="min-w-0">
                      <div className="font-bold text-xs text-[#2d3a1d] truncate">{donor.name}</div>
                      <div className="text-[10px] text-[#8a817c] font-semibold mt-0.5">{donor.location}</div>
                    </div>
                    <div className="text-xs font-bold text-[#5d6d3e] bg-[#5d6d3e]/5 border border-[#5d6d3e]/20 px-2.5 py-1 rounded-lg">
                      ৳ {toBanglaNum(donor.amount.toLocaleString('bn-BD'))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
