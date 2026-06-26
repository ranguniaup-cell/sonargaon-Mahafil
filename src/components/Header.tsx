import React from 'react';
import logo from '../assets/images/logo.jpg';
import { Menu, X, Home, Users, DollarSign, Settings, Heart, FileText } from 'lucide-react';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isAdminLoggedIn: boolean;
  onLogout: () => void;
}

export default function Header({ activeTab, setActiveTab, isAdminLoggedIn, onLogout }: HeaderProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { id: 'home', label: 'মূল পাতা', icon: Home },
    { id: 'committee', label: 'উদযাপন পরিষদ', icon: Users },
    { id: 'finance', label: 'আয়-ব্যয় হিসাব', icon: DollarSign },
    { id: 'report', label: 'রিপোর্ট', icon: FileText },
    { id: 'admin', label: 'সি-প্যানেল', icon: Settings },
  ];

  return (
    <header id="app-header" className="sticky top-0 z-50 bg-[#fdfcf7]/95 backdrop-blur-md border-b-2 border-[#d4cfc0] shadow-sm print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-20 items-center">
          {/* Logo & Branding */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('home')}>
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-r from-[#bfa46f] to-[#5d6d3e] rounded-full blur-sm opacity-60 group-hover:opacity-100 transition duration-300"></div>
              <img
                src={logo}
                alt="উদযাপন পরিষদ লোগো"
                className="relative h-14 w-14 rounded-full border-2 border-[#bfa46f] object-cover shadow-md"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="flex flex-col">
              <span className="text-[#2d3a1d] font-bold text-base sm:text-lg leading-tight tracking-tight">
                পবিত্র ঈদে মিলাদুন্নবী (দঃ)
              </span>
              <span className="text-[#5d6d3e] font-semibold text-xs sm:text-sm tracking-wide">
                সোনারগাঁও উদযাপন পরিষদ
              </span>
            </div>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex space-x-1 items-center">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = activeTab === item.id;
              return (
                <button
                  id={`nav-btn-${item.id}`}
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={`flex items-center space-x-1.5 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-300 ${
                    isActive
                      ? 'bg-[#5d6d3e] text-white font-semibold shadow-md shadow-[#5d6d3e]/20 scale-102'
                      : 'text-[#3c3c3c] hover:text-[#2d3a1d] hover:bg-[#f5f2eb]'
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {isAdminLoggedIn && (
              <button
                id="logout-desktop-btn"
                onClick={onLogout}
                className="ml-4 px-3 py-1.5 border border-red-600/40 hover:border-red-600 text-red-600 hover:text-white hover:bg-red-600/10 rounded-md text-xs font-medium transition duration-200"
              >
                লগআউট
              </button>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <div className="md:hidden">
            <button
              id="mobile-menu-toggle"
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-md text-[#3c3c3c] hover:text-[#2d3a1d] hover:bg-[#f5f2eb] focus:outline-none transition duration-200"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Navigation Menu */}
      {isOpen && (
        <div className="md:hidden bg-[#fdfcf7] border-t border-[#d4cfc0] shadow-xl transition-all duration-300 ease-in-out">
          <div className="px-2 pt-2 pb-4 space-y-1">
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
                  className={`flex items-center space-x-3 w-full px-4 py-3 rounded-lg text-base font-medium transition-colors ${
                    isActive
                      ? 'bg-[#5d6d3e] text-white font-semibold shadow-md'
                      : 'text-[#3c3c3c] hover:text-[#2d3a1d] hover:bg-[#f5f2eb]'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.label}</span>
                </button>
              );
            })}

            {isAdminLoggedIn && (
              <div className="pt-2 border-t border-[#d4cfc0] mt-2 px-4">
                <button
                  id="logout-mobile-btn"
                  onClick={() => {
                    onLogout();
                    setIsOpen(false);
                  }}
                  className="w-full py-2.5 border border-red-600/40 hover:border-red-600 text-red-600 hover:text-white hover:bg-red-600/10 rounded-lg text-sm font-medium transition"
                >
                  লগআউট (সি-প্যানেল)
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
