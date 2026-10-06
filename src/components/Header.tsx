import React, { useState, useEffect, useRef } from 'react';
import {
  Film,
  Users,
  Sparkles,
  Play,
  Video,
  Plus,
  SlidersHorizontal,
  Download,
  ChevronDown,
  Menu,
  X,
  Check,
} from 'lucide-react';

export type ActiveTab = 'script' | 'characters' | 'rooms' | 'animate' | 'player';

interface HeaderProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  onNewDramaClick: () => void;
  onOpenPlayer: () => void;
  onExportClick: () => void;
  currentProjectTitle: string;
}

const MENU_STEPS: Array<{
  id: ActiveTab;
  label: string;
  shortDesc: string;
  icon: React.ComponentType<{ className?: string }>;
  tag?: string;
}> = [
  {
    id: 'script',
    label: '1. Naskah & Serial',
    shortDesc: 'Alur cerita, adegan, storyboard, dan naskah dialog',
    icon: SlidersHorizontal,
  },
  {
    id: 'characters',
    label: '2. Karakter & Suara',
    shortDesc: 'Aktor drama, kostum, dan profil vokal (Gemini TTS)',
    icon: Users,
  },
  {
    id: 'rooms',
    label: '3. Ruangan & Latar',
    shortDesc: 'Set lokasi, pencahayaan sinematik, dan atmosfer suara',
    icon: Film,
  },
  {
    id: 'animate',
    label: '4. Video Veo Sinematik',
    shortDesc: 'Animasi foto, naskah adegan per episode, & klip dari teks',
    icon: Video,
    tag: 'Veo 3.1',
  },
  {
    id: 'player',
    label: '5. Player & Urutan Klip',
    shortDesc: 'Atur urutan klip, play per klip, dan putar semua berurutan',
    icon: Play,
  },
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  onNewDramaClick,
  onOpenPlayer,
  onExportClick,
  currentProjectTitle,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const activeStep = MENU_STEPS.find((s) => s.id === activeTab) || MENU_STEPS[0];

  const handleSelectTab = (tab: ActiveTab) => {
    setActiveTab(tab);
    setIsMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 bg-neutral-950/95 backdrop-blur-md border-b border-neutral-800/80 px-3 sm:px-6 py-2.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-3 relative">
        {/* Zone 1: Interactive Brand Wordmark that triggers the Features Menu */}
        <div className="relative" ref={menuRef}>
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="flex items-center gap-2.5 p-1 -m-1 rounded-xl hover:bg-neutral-900/80 transition-all text-left group cursor-pointer focus:outline-none"
            aria-expanded={isMenuOpen}
            aria-label="Pilih menu fitur BuatDrama"
          >
            {/* Logo Icon */}
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-rose-600 via-rose-500 to-amber-500 flex items-center justify-center shadow-lg shadow-rose-900/30 group-hover:scale-105 transition-transform shrink-0">
              <Film className="w-5 h-5 text-white" />
            </div>

            {/* Brand Title & Active Step Badge */}
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <span className="font-display text-base sm:text-lg font-bold tracking-tight text-white leading-none">
                  BuatDrama<span className="text-rose-500">.AI</span>
                </span>
                <ChevronDown
                  className={`w-3.5 h-3.5 text-neutral-400 group-hover:text-white transition-transform duration-200 ${
                    isMenuOpen ? 'rotate-180 text-rose-400' : ''
                  }`}
                />
              </div>

              {/* In Portrait / Mobile: show current step as active breadcrumb */}
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[10px] text-rose-400 font-medium truncate max-w-[140px] sm:hidden">
                  {activeStep.label}
                </span>
                <span className="text-[10px] text-neutral-400 font-mono tracking-wider hidden sm:inline">
                  PILIH FITUR ▾
                </span>
              </div>
            </div>
          </button>

          {/* DROPDOWN / MENU STEP SHEET */}
          {isMenuOpen && (
            <div className="absolute left-0 top-full mt-2 w-72 sm:w-84 bg-neutral-900/98 border border-neutral-700/80 rounded-2xl shadow-2xl p-2.5 z-50 backdrop-blur-xl animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-3 py-2 border-b border-neutral-800/80 mb-1 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-400 font-semibold block">
                    Menu Tahapan Serial Drama
                  </span>
                  <span className="text-xs text-white font-medium truncate block max-w-[200px]">
                    {currentProjectTitle}
                  </span>
                </div>
                <button
                  onClick={() => setIsMenuOpen(false)}
                  className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* 5 Feature Step Buttons */}
              <div className="space-y-1">
                {MENU_STEPS.map((step) => {
                  const Icon = step.icon;
                  const isCurrent = activeTab === step.id;

                  return (
                    <button
                      key={step.id}
                      onClick={() => handleSelectTab(step.id)}
                      className={`w-full flex items-start gap-3 p-2.5 rounded-xl text-left transition-all cursor-pointer ${
                        isCurrent
                          ? 'bg-rose-600 text-white shadow-md shadow-rose-950/40'
                          : 'hover:bg-neutral-800/80 text-neutral-300 hover:text-white'
                      }`}
                    >
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                          isCurrent
                            ? 'bg-white/20 text-white'
                            : 'bg-neutral-950 text-neutral-400 border border-neutral-800'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <span
                            className={`text-xs font-semibold truncate block ${
                              isCurrent ? 'text-white' : 'text-neutral-100'
                            }`}
                          >
                            {step.label}
                          </span>
                          {step.tag && (
                            <span
                              className={`text-[9px] font-mono px-1.5 py-0.2 rounded font-bold shrink-0 ${
                                isCurrent
                                  ? 'bg-white/20 text-white'
                                  : 'bg-amber-500/20 text-amber-300'
                              }`}
                            >
                              {step.tag}
                            </span>
                          )}
                        </div>
                        <span
                          className={`text-[10px] block leading-snug mt-0.5 ${
                            isCurrent ? 'text-rose-100' : 'text-neutral-400'
                          }`}
                        >
                          {step.shortDesc}
                        </span>
                      </div>

                      {isCurrent && <Check className="w-4 h-4 text-white shrink-0 mt-1" />}
                    </button>
                  );
                })}
              </div>

              {/* Mobile Quick Action Buttons inside dropdown */}
              <div className="pt-2 mt-2 border-t border-neutral-800/80 grid grid-cols-2 gap-1.5">
                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onNewDramaClick();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5 text-rose-400" />
                  <span>Drama Baru</span>
                </button>

                <button
                  onClick={() => {
                    setIsMenuOpen(false);
                    onExportClick();
                  }}
                  className="flex items-center justify-center gap-1.5 p-2 rounded-xl text-xs font-medium bg-neutral-950 hover:bg-neutral-800 border border-neutral-800 text-neutral-200 transition-colors"
                >
                  <Download className="w-3.5 h-3.5 text-neutral-400" />
                  <span>Ekspor Naskah</span>
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Zone 2: Navigation Links (Visible on desktop/landscape, hidden on small portrait to prevent overflow) */}
        <nav className="hidden lg:flex items-center gap-1 bg-neutral-900/90 p-1 rounded-xl border border-neutral-800/80">
          <button
            onClick={() => setActiveTab('script')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'script'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Naskah & Serial</span>
          </button>

          <button
            onClick={() => setActiveTab('characters')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'characters'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Karakter & Suara</span>
          </button>

          <button
            onClick={() => setActiveTab('rooms')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'rooms'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Film className="w-3.5 h-3.5" />
            <span>Ruangan & Latar</span>
          </button>

          <button
            onClick={() => setActiveTab('animate')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'animate'
                ? 'bg-gradient-to-r from-amber-600 to-rose-600 text-white shadow-sm'
                : 'text-amber-400 hover:text-amber-300 hover:bg-neutral-800/60'
            }`}
          >
            <Video className="w-3.5 h-3.5" />
            <span>Animasi Foto (Veo)</span>
          </button>

          <button
            onClick={() => setActiveTab('player')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all duration-200 cursor-pointer ${
              activeTab === 'player'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/60'
            }`}
          >
            <Play className="w-3.5 h-3.5" />
            <span>Director Player</span>
          </button>
        </nav>

        {/* Zone 3: Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={onNewDramaClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <Plus className="w-3.5 h-3.5 text-rose-400" />
            <span>Drama Baru</span>
          </button>

          <button
            onClick={onExportClick}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 rounded-lg transition-colors whitespace-nowrap"
          >
            <Download className="w-3.5 h-3.5 text-neutral-400" />
            <span>Export</span>
          </button>

          <button
            onClick={onOpenPlayer}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-500 rounded-lg shadow-md shadow-rose-950 transition-colors whitespace-nowrap cursor-pointer"
          >
            <Play className="w-3.5 h-3.5 fill-current" />
            <span className="sm:inline">Putar Drama</span>
          </button>
        </div>
      </div>
    </header>
  );
};
