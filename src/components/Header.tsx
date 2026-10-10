import React from 'react';
import logo from '../assets/images/logo.jpg';
import { handleLogoError } from '../lib/logoConstants';
import { Menu, X, Home, Users, DollarSign, Settings, FileText, Building2, Coins, Send } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({ activeTab, setActiveTab, isAdminLoggedIn, onLogout }: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'মূল পাতা', shortLabel: 'মূল পাতা', icon: Home },
    { id: 'committee', label: 'উদযাপন পরিষদ', shortLabel: 'কমিটি', icon: Users },
    { id: 'posting', label: 'পোস্টিং', shortLabel: 'পোস্টিং', icon: Send },
    ...(isAdminLoggedIn ? [
      { id: 'house-report', label: 'বাড়ি রিপোর্ট', shortLabel: 'বাড়ি রিপোর্ট', icon: Building2 },
      { id: 'house-donations', label: 'বাড়ি চাঁদা', shortLabel: 'বাড়ি চাঁদা', icon: Coins }
    ] : []),
    { id: 'finance', label: 'আয়-ব্যয় হিসাব', shortLabel: 'আয়-ব্যয়', icon: DollarSign },
    { id: 'report', label: 'রিপোর্ট', shortLabel: 'রিপোর্ট', icon: FileText },
    { id: 'admin', label: 'সি-প্যানেল', shortLabel: 'সি-প্যানেল', icon: Settings },
  ];

  return (
    <header id="app-header" className="sticky top-0 z-50 bg-[#f8fafc]/95 backdrop-blur-md border-b-2 border-[#cbd5e1] shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-8">
        <div className="flex justify-between h-16 sm:h-20 items-center">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="relative group">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d97706] to-[#0f766e] rounded-full blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <img
                src={logo}
                onError={handleLogoError}
                alt="উদযাপন পরিষদ লোগো"
                className="relative h-11 w-11 sm:h-14 sm:w-14 rounded-full border-2 border-[#d97706] object-cover shadow-md bg-white"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[#064e3b] font-extrabold text-sm sm:text-lg leading-tight tracking-tight">
                পবিত্র ঈদে মিলাদুন্নবী (দঃ)
              </span>
              <span className="text-[#0f766e] font-semibold text-[11px] sm:text-sm tracking-wide">
                সোনারগাঁও উদযাপন পরিষদ
              </span>
            </div>
          </div>

          {/* Desktop Navigation - Compact & Clean */}
          <nav className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-btn-${item.id}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1 px-3 py-1.5 rounded-lg text-xs font-bold transition-all duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-[#0f766e] text-white shadow-sm ring-1 ring-[#d97706]/30'
                      : 'text-[#3c3c3c] hover:text-[#064e3b] hover:bg-[#f1f5f9]'
                  }`}
                >
                  <Icon className={`h-3.5 w-3.5 ${isActive ? 'text-[#f59e0b]' : 'text-[#0f766e]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {isAdminLoggedIn && (
              <button
                id="logout-desktop-btn"
                onClick={onLogout}
                className="ml-2 px-2.5 py-1.5 border border-red-600/40 hover:border-red-600 text-red-600 hover:text-white hover:bg-red-600/10 rounded-lg text-xs font-bold transition duration-200 cursor-pointer"
              >
                লগআউট
              </button>
            )}
          </nav>

          {/* Mobile Actions: Quick Toggle */}
          <div className="md:hidden flex items-center space-x-2">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-1.5 rounded-lg text-[#3c3c3c] hover:text-[#064e3b] hover:bg-[#f1f5f9] focus:outline-none transition duration-200"
              aria-label="Toggle Menu"
            >
              {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Topbar Quick-Access Compact Strip: ALL items visible at once without scrolling */}
      <div className="md:hidden border-t border-[#cbd5e1]/80 bg-[#f1f5f9]/95 px-1 py-1.5">
        <div className={`grid ${isAdminLoggedIn ? 'grid-cols-8' : 'grid-cols-6'} gap-0.5 w-full`}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                id={`topbar-grid-btn-${item.id}`}
                key={`topbar-grid-${item.id}`}
                onClick={() => {
                  setActiveTab(item.id);
                  setIsOpen(false);
                }}
                className={`flex flex-col items-center justify-center py-1 px-0.5 rounded-lg text-[9px] sm:text-[10px] font-bold transition-all duration-200 cursor-pointer active:scale-95 select-none ${
                  isActive
                    ? 'bg-[#0f766e] text-white shadow-sm ring-1 ring-[#d97706]/40'
                    : 'bg-white text-[#334155] border border-[#cbd5e1]/80 hover:border-[#0f766e]/40 hover:text-[#064e3b]'
                }`}
              >
                <Icon className={`h-3 w-3 sm:h-3.5 sm:w-3.5 mb-0.5 shrink-0 ${isActive ? 'text-[#f59e0b]' : 'text-[#0f766e]'}`} />
                <span className="truncate w-full text-center leading-tight tracking-tighter">{item.shortLabel}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Mobile Navigation Menu (Expanded Grid View) */}
      {isOpen && (
        <div className="md:hidden bg-[#f8fafc] border-t-2 border-[#d97706]/40 shadow-2xl transition-all duration-300 ease-in-out">
          <div className="p-3.5 space-y-3">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-[#cbd5e1]/60">
              <span className="text-xs font-bold text-[#064e3b] flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#d97706]"></span>
                সকল মেনু তালিকা (গ্রিড ভিউ)
              </span>
              <span className="text-[10px] text-gray-500 font-medium">ট্যাপ করে প্রবেশ করুন</span>
            </div>

            {/* 2-Column Responsive Grid View for Mobile */}
            <div className="grid grid-cols-2 gap-2.5">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    id={`mobile-nav-btn-${item.id}`}
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsOpen(false);
                    }}
                    className={`flex flex-col items-center text-center p-3 rounded-2xl border transition-all duration-200 cursor-pointer active:scale-95 shadow-sm ${
                      isActive
                        ? 'bg-gradient-to-br from-[#064e3b] to-[#0f766e] text-white border-[#d97706] shadow-md ring-2 ring-[#d97706]/50'
                        : 'bg-white hover:bg-[#f1f5f9] text-[#3c3c3c] border-[#cbd5e1] hover:border-[#0f766e]/40'
                    }`}
                  >
                    <div
                      className={`p-2.5 rounded-xl mb-2 flex items-center justify-center transition-colors ${
                        isActive
                          ? 'bg-white/20 text-[#f59e0b]'
                          : 'bg-[#0f766e]/10 text-[#0f766e]'
                      }`}
                    >
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="text-xs font-bold leading-tight line-clamp-1">{item.label}</span>
                  </button>
                );
              })}
            </div>

            {isAdminLoggedIn && (
              <div className="pt-2 border-t border-[#cbd5e1]">
                <button
                  id="logout-mobile-btn"
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full py-2.5 border border-red-600/40 hover:border-red-600 text-red-600 hover:text-white hover:bg-red-600/10 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>লগআউট (সি-প্যানেল)</span>
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
