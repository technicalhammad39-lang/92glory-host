'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Header } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { StartupScreen } from '@/components/StartupScreen';
import { PopupModal } from '@/components/PopupModal';
import { Volume2, ChevronRight, ChevronLeft, Play, Download } from 'lucide-react';
import Image from 'next/image';
import { motion, AnimatePresence } from 'motion/react';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, Pagination } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

interface BannerItem {
  id: string;
  image: string;
  link?: string | null;
}

interface CategoryItem {
  id: string;
  key: string;
  name: string;
  icon: string;
  order?: number;
  providers?: string | null;
}

interface GameItem {
  id: string;
  name: string;
  category: string;
  image: string;
  provider?: string | null;
}

interface PopupItem {
  id: string;
  title: string;
  content: string;
}

const FALLBACK_GAME_IMAGE = '/card1.png';
const parseProviderList = (raw?: string | null): string[] => {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((item) => typeof item === 'string') : [];
  } catch {
    return [];
  }
};

const SECTION_SUBTITLES: Record<string, string> = {
  lottery: 'Fair and diverse lottery gameplay',
  slots: 'Online real-time game dealers, all verified fair games',
  original: 'Exclusive in-house originals with instant results',
  hot: 'Top trending games chosen by players',
  casino: 'Live casino tables with professional dealers',
  pvc: 'Fast-paced PVC games with smooth experience',
  sports: 'Daily sports matches with dynamic odds',
  fishing: 'Arcade fishing battles and jackpots',
  jackpot: 'High-reward games with massive prize pools'
};

export default function HomePage() {
  const [hydrated, setHydrated] = useState(false);
  const [showStartup, setShowStartup] = useState(false);
  const [currentPopupIndex, setCurrentPopupIndex] = useState(-1);
  const [activeCategory, setActiveCategory] = useState('lottery');
  const [activeProviders, setActiveProviders] = useState<Record<string, string>>({});
  const [mounted, setMounted] = useState(false);
  const [siteAnnouncement, setSiteAnnouncement] = useState('');
  const [announcementButton, setAnnouncementButton] = useState('Detail');
  const [banners, setBanners] = useState<BannerItem[]>([]);
  const [categories, setCategories] = useState<CategoryItem[]>([]);
  const [games, setGames] = useState<GameItem[]>([]);
  const [popups, setPopups] = useState<PopupItem[]>([]);
  const [lotterySwiper, setLotterySwiper] = useState<any>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    setMounted(true);
    setHydrated(true);
    const splashShown = sessionStorage.getItem('splashShown');
    if (!splashShown) {
      setShowStartup(true);
    }
    fetch('/api/home')
      .then(async (res) => {
        if (!res.ok) return null;
        return res.json();
      })
      .then((data) => {
        if (!data) return;
        setBanners(data.banners || []);
        setCategories(data.categories || []);
        setGames(data.games || []);
        setPopups(data.popups || []);
        setSiteAnnouncement(data.site?.announcement || '');
        setAnnouncementButton(data.site?.announcementButton || 'Detail');

        const defaults: Record<string, string> = {};
        (data.categories || []).forEach((cat: CategoryItem) => {
          const list = parseProviderList(cat.providers);
          if (list.length) defaults[cat.key] = list[0];
        });
        setActiveProviders(defaults);
      })
      .catch(() => {
        setBanners([]);
        setCategories([]);
        setGames([]);
        setPopups([]);
      });
  }, []);

  useEffect(() => {
    if (!showStartup && popups.length) {
      setCurrentPopupIndex(0);
    }
  }, [showStartup, popups]);

  const handleStartupComplete = () => {
    sessionStorage.setItem('splashShown', 'true');
    setShowStartup(false);
    setCurrentPopupIndex(0);
  };

  const activePopup = currentPopupIndex >= 0 ? popups[currentPopupIndex] : null;

  const closePopup = () => {
    if (currentPopupIndex < popups.length - 1) {
      setCurrentPopupIndex((prev) => prev + 1);
    } else {
      setCurrentPopupIndex(-1);
    }
  };

  const gamesByCategory = useMemo(() => {
    const ordered = [...categories].sort((a, b) => {
      if (a.key === 'lottery') return -1;
      if (b.key === 'lottery') return 1;
      return (a.order ?? 0) - (b.order ?? 0);
    });

    return ordered.map((cat) => {
      const list = games.filter((game) => game.category === cat.key);
      return { ...cat, games: list };
    });
  }, [categories, games]);

  useEffect(() => {
    if (!gamesByCategory.length) return;
    if (!gamesByCategory.some((cat) => cat.key === activeCategory)) {
      setActiveCategory(gamesByCategory[0].key);
    }
  }, [gamesByCategory, activeCategory]);

  const GameCard = ({
    game,
    multiplier
  }: {
    game: GameItem;
    multiplier?: string;
  }) => {
    const [imageSrc, setImageSrc] = useState(game.image || FALLBACK_GAME_IMAGE);

    return (
      <motion.div whileTap={{ scale: 0.97 }} className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm border border-gray-100 bg-white">
        <Image
          src={imageSrc}
          alt={game.name}
          fill
          className="object-cover"
          onError={() => {
            if (imageSrc !== FALLBACK_GAME_IMAGE) {
              setImageSrc(FALLBACK_GAME_IMAGE);
            }
          }}
        />
        {multiplier && (
          <div className="absolute top-2 left-2 bg-gradient-to-r from-yellow-300 to-yellow-500 text-[10px] font-black px-2 py-0.5 rounded-md text-gray-800 shadow-sm">
            {multiplier}
          </div>
        )}
        <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/75 to-transparent pt-6 pb-2 px-2">
          <p className="text-[11px] text-white font-black leading-tight truncate uppercase">{game.name}</p>
        </div>
      </motion.div>
    );
  };

  const LotteryCard = ({ game }: { game: GameItem }) => {
    const [imageSrc, setImageSrc] = useState(game.image || FALLBACK_GAME_IMAGE);
    return (
      <motion.div
        whileTap={{ scale: 0.97 }}
        className="relative aspect-[3/4] rounded-xl overflow-hidden border border-[#F4C8F6] bg-gradient-to-br from-[#FCEEFF] to-[#F4D8FF]"
      >
        <Image
          src={imageSrc}
          alt={game.name}
          fill
          className="object-cover"
          onError={() => {
            if (imageSrc !== FALLBACK_GAME_IMAGE) setImageSrc(FALLBACK_GAME_IMAGE);
          }}
        />
        <span className="sr-only">{game.name}</span>
      </motion.div>
    );
  };

  const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
    <div className="mb-3">
      <div className="flex items-center gap-2">
        <div className="w-1.5 h-4 bg-gradient-to-b from-accent-purple to-purple-400 rounded-full"></div>
        <h3 className="text-gray-800 font-black text-base">{title}</h3>
      </div>
      {subtitle && <p className="text-gray-400 text-xs mt-1 ml-3.5">{subtitle}</p>}
    </div>
  );

  const ProviderTabs = ({ providers, categoryKey }: { providers: string[]; categoryKey: string }) => (
    <div className="flex bg-gray-50 rounded-xl p-1 mb-4 shadow-inner border border-gray-100">
      {providers.map((tab) => (
        <button
          key={tab}
          onClick={() => setActiveProviders((prev) => ({ ...prev, [categoryKey]: tab }))}
          className={`flex-1 py-2 text-[11px] font-black transition-all rounded-lg ${
            activeProviders[categoryKey] === tab ? 'bg-gradient-to-r from-accent-purple to-purple-500 text-white shadow-md' : 'text-gray-500'
          }`}
        >
          {tab}
        </button>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-gray-50 pb-24 overflow-x-hidden">
      <AnimatePresence>{hydrated && showStartup && <StartupScreen onComplete={handleStartupComplete} />}</AnimatePresence>

      <Header showLogo />

      {activePopup && (
        <PopupModal
          isOpen={!!activePopup}
          onClose={closePopup}
          title={activePopup.title}
          content={(activePopup.content || '').split('\n')}
          confirmText="Confirm"
        />
      )}

      {/* Banner Section */}
      <div className="px-3 pt-3 bg-white">
        <div className="relative w-full aspect-[21/9] rounded-xl overflow-hidden shadow-sm">
          <Swiper
            modules={[Autoplay, Pagination]}
            pagination={{ clickable: true }}
            autoplay={{ delay: 3500 }}
            loop={banners.length > 1}
            className="w-full h-full"
          >
            {banners.map((src) => (
              <SwiperSlide key={src.id}>
                <Image src={src.image} alt="Banner" fill className="object-cover" priority />
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      </div>

      {/* Announcement Strip */}
      <div className="px-3 py-3 bg-white border-b border-gray-100">
        <div className="bg-[#F5F2FF] rounded-full h-11 flex items-center px-4 gap-3 border border-purple-100">
          <Volume2 className="w-4 h-4 text-accent-purple shrink-0" />
          <div className="flex-1 overflow-hidden">
            <p className="text-gray-600 text-xs font-semibold whitespace-nowrap animate-marquee">
              {siteAnnouncement || 'Welcome to 92 Glory0, the most trusted and fairest site, you can play our games to get rich.'}
            </p>
          </div>
          <button className="bg-gradient-to-r from-accent-purple to-purple-500 text-white text-[11px] font-bold px-4 py-1.5 rounded-full shrink-0 shadow-sm active:scale-95 transition-transform flex items-center gap-1">
            <Play className="w-3 h-3 fill-current" /> {announcementButton}
          </button>
        </div>
      </div>

      {/* Categories Row */}
      <div className="px-3 py-4 bg-white mb-2">
        <div className="flex gap-0.5 overflow-x-auto no-scrollbar scroll-smooth pr-3 touch-pan-x">
          {gamesByCategory.map((cat) => (
            <button
              key={cat.id}
              onClick={() => {
                setActiveCategory(cat.key);
                sectionRefs.current[cat.key]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
              className="flex flex-col items-center gap-1 shrink-0 focus:outline-none"
              style={{ width: 96 }}
            >
              <div className="relative w-[74px] h-[74px] transition-all duration-200 active:scale-95">
                <Image src={cat.icon} alt={cat.name} fill className="object-contain" />
              </div>
              <span className={`text-xs font-black ${activeCategory === cat.key ? 'text-accent-purple' : 'text-gray-500'}`}>
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Sections */}
      {gamesByCategory.map((section) => {
        const providers = parseProviderList(section.providers);
        const filtered = providers.length
          ? section.games.filter((g) => (activeProviders[section.key] ? g.provider === activeProviders[section.key] : true))
          : section.games;

        return (
          <div
            key={section.id}
            ref={(node) => {
              sectionRefs.current[section.key] = node;
            }}
            className="p-4 bg-white mb-2 shadow-sm scroll-mt-16"
          >
            {section.key === 'lottery' ? (
              <div className="mb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-1.5 h-4 bg-gradient-to-b from-accent-purple to-purple-400 rounded-full"></div>
                    <h3 className="text-gray-800 font-black text-base">{section.name}</h3>
                    <span className="text-[11px] text-[#D36BE8] font-bold">More 4</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => lotterySwiper?.slidePrev()}
                      className="w-6 h-5 rounded-md bg-gradient-to-r from-[#F0B9FF] to-[#E58FFB] text-white flex items-center justify-center"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => lotterySwiper?.slideNext()}
                      className="w-6 h-5 rounded-md bg-gradient-to-r from-[#F0B9FF] to-[#E58FFB] text-white flex items-center justify-center"
                    >
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Fair and diverse lottery gameplay</p>
              </div>
            ) : (
              <SectionHeader title={section.name} subtitle={SECTION_SUBTITLES[section.key]} />
            )}
            {providers.length > 0 && <ProviderTabs providers={providers} categoryKey={section.key} />}
            {section.key === 'lottery' ? (
              <Swiper
                modules={[Autoplay]}
                onSwiper={setLotterySwiper}
                slidesPerView={3}
                spaceBetween={6}
                autoplay={{ delay: 2600, disableOnInteraction: false }}
                loop={filtered.length > 3}
                className="w-full"
              >
                {filtered.map((game) => (
                  <SwiperSlide key={game.id}>
                    <LotteryCard game={game} />
                  </SwiperSlide>
                ))}
              </Swiper>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {filtered.slice(0, 6).map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    multiplier={
                      section.key === 'jackpot'
                        ? game.name === 'Aviator'
                          ? '24.03X'
                          : game.name === 'Lucky 777'
                            ? '77.7X'
                            : '10.00X'
                        : undefined
                    }
                  />
                ))}
                {section.key === 'slots' && (
                <motion.button
                  whileTap={{ scale: 0.96 }}
                  className="relative aspect-[3/4] rounded-xl overflow-hidden shadow-sm bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-100 flex flex-col items-center justify-center gap-2"
                >
                  <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center shadow-sm">
                    <ChevronRight className="w-5 h-5 text-accent-purple" />
                  </div>
                  <span className="text-xs font-black text-accent-purple">Detail</span>
                </motion.button>
                )}
              </div>
            )}
          </div>
        );
      })}

      {/* Winning Information */}
      <div className="p-4 bg-white shadow-sm mb-4">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-1.5 h-4 bg-gradient-to-b from-accent-purple to-purple-400 rounded-full"></div>
          <h3 className="text-gray-800 font-black text-sm">Winning information</h3>
        </div>
        <div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
              <div className="flex items-center gap-3">
                <div className="relative w-9 h-9 rounded-lg overflow-hidden bg-gray-100">
                  <Image src={`/casinocat.png`} alt="User" fill className="object-cover" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-gray-500">User</p>
                  <p className="text-[10px] font-bold text-gray-400">Winning amount</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-black text-gray-700 font-mono">Mem***{String.fromCharCode(65 + i)}X</p>
                <p className="text-[11px] font-black text-accent-pink">Rs {mounted ? (Math.random() * 5000 + 100).toFixed(2) : '0.00'}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-40 pointer-events-none">
        <motion.button className="h-9 rounded-full bg-gradient-to-r from-[#6F8DF8] to-[#DA7CE8] pl-2 pr-4 text-white text-[12px] font-semibold flex items-center gap-2 pointer-events-auto">
          <div className="w-6 h-6 rounded-full bg-white/25 flex items-center justify-center">
            <Download className="w-3.5 h-3.5" />
          </div>
          <span className="leading-none">Add to Desktop</span>
        </motion.button>
      </div>

      <BottomNav />
    </div>
  );
}
