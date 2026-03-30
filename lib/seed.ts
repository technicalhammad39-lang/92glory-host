import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { Prisma } from '@prisma/client';
import { defaultMemberName, generateUniqueUid } from '@/lib/user-utils';

declare global {
  var __seedPromise: Promise<void> | undefined;
  var __seedCompleted: boolean | undefined;
  var __seedDisabledUntil: number | undefined;
}

const databaseUrl = process.env.DATABASE_URL || '';
const usingFileDatabase = databaseUrl.startsWith('file:');
const AUTO_SEED_ENABLED = process.env.AUTO_SEED === 'true' ? usingFileDatabase : process.env.AUTO_SEED !== 'false' && usingFileDatabase;
const AUTO_SEED_RETRY_COOLDOWN_MS = Number(process.env.AUTO_SEED_RETRY_COOLDOWN_MS || 60_000);

const defaultBanners = [
  { image: '/banner 1.png', order: 1, placement: 'home' },
  { image: '/banner 2.png', order: 2, placement: 'home' },
  { image: '/banenr 3.png', order: 3, placement: 'home' },
  { image: '/banner 4.png', order: 4, placement: 'home' }
];

const defaultCategories = [
  { key: 'lottery', name: 'Lottery', icon: '/lotterycat.png', order: 1 },
  { key: 'slots', name: 'Slots', icon: '/cat1.png', order: 2, providers: ['JILI', 'PG', 'JDB', '9G', 'PP'] },
  { key: 'original', name: 'Original', icon: '/original cat.png', order: 3 },
  { key: 'hot', name: 'Hot Slots', icon: '/hot sale cat.png', order: 4 },
  { key: 'casino', name: 'Casino', icon: '/casinocat.png', order: 5, providers: ['SEXY', 'EVO', 'DG', 'MG'] },
  { key: 'pvc', name: 'PVC', icon: '/pvccat.png', order: 6, providers: ['PVC', 'KOOLBAT'] },
  { key: 'sports', name: 'Sports', icon: '/sportscat.png', order: 7 },
  { key: 'fishing', name: 'Fishing', icon: '/fishingcat.png', order: 8 },
  { key: 'jackpot', name: 'Super Jackpot', icon: '/superjackpotcat.png', order: 9 }
];

const defaultGames = [
  { name: 'FORTUNE GEMS 2', category: 'slots', image: '/card1.png', provider: 'JILI', order: 1 },
  { name: 'MONEY COMING', category: 'slots', image: '/card2.png', provider: 'JILI', order: 2 },
  { name: 'FORTUNE GEMS 3', category: 'slots', image: '/card3.png', provider: 'JILI', order: 3 },
  { name: 'FORTUNE GEMS', category: 'slots', image: '/card 3.png', provider: 'JILI', order: 4 },
  { name: 'MONEY COMING EXPAND BETS', category: 'slots', image: '/card2.png', provider: 'JILI', order: 5 },

  { name: 'WinGo', category: 'lottery', image: '/wingo 1.png', provider: 'LOTTO', order: 1 },
  { name: 'Moto Racing', category: 'lottery', image: '/moto racing 2.png', provider: 'LOTTO', order: 2 },
  { name: 'K3', category: 'lottery', image: '/k3 card.png', provider: 'LOTTO', order: 3 },
  { name: '5D', category: 'lottery', image: '/5d card.png', provider: 'LOTTO', order: 4 },
  { name: 'Thai Hi Lo', category: 'lottery', image: '/thai hi lu.png', provider: 'LOTTO', order: 5 },

  { name: 'Chicken Road', category: 'original', image: '/chicken road.png', provider: 'ORIGINAL', order: 1 },
  { name: 'Air Combat', category: 'original', image: '/air combat.png', provider: 'ORIGINAL', order: 2 },
  { name: 'Javelin', category: 'original', image: '/javelin.png', provider: 'ORIGINAL', order: 3 },

  { name: 'Hot Fortune', category: 'hot', image: '/card1.png', provider: 'HOT', order: 1 },
  { name: 'Hot Gems', category: 'hot', image: '/card3.png', provider: 'HOT', order: 2 },
  { name: 'Hot Money', category: 'hot', image: '/card2.png', provider: 'HOT', order: 3 },

  { name: 'Baccarat Classic', category: 'casino', image: '/baccarat.png', provider: 'SEXY', order: 1 },
  { name: 'Dragon Tiger', category: 'casino', image: '/dragon tiger.png', provider: 'EVO', order: 2 },
  { name: 'Roulette', category: 'casino', image: '/roulete.png', provider: 'DG', order: 3 },
  { name: 'Broadcasting Sexy', category: 'casino', image: '/broadcasting sexy.png', provider: 'SEXY', order: 4 },

  { name: 'PVC', category: 'pvc', image: '/pvc.png', provider: 'PVC', order: 1 },
  { name: 'Koolbat', category: 'pvc', image: '/pvc koolbat.png', provider: 'PVC', order: 2 },

  { name: 'Sports', category: 'sports', image: '/sport.png', provider: 'SBO', order: 1 },
  { name: 'Cricket', category: 'sports', image: '/cricket.png', provider: 'SBO', order: 2 },
  { name: 'Tennis', category: 'sports', image: '/sport.png', provider: 'SBO', order: 3 },

  { name: 'Royal Fishing', category: 'fishing', image: '/royal fishing.png', provider: 'JILI', order: 1 },
  { name: 'Jackpot Fishing', category: 'fishing', image: '/jackpot fissing.png', provider: 'JILI', order: 2 },

  { name: 'Aviator', category: 'jackpot', image: '/aviator.png', provider: 'JACKPOT', order: 1 },
  { name: 'Lucky 777', category: 'jackpot', image: '/lucky 777.png', provider: 'JACKPOT', order: 2 },
  { name: 'Mines', category: 'jackpot', image: '/mines pro boom.png', provider: 'JACKPOT', order: 3 }
];

const defaultActivities = [
  {
    title: 'Gifts',
    description: 'Enter the redemption code to receive gift rewards',
    image: '/gifts.webp',
    type: 'card',
    order: 1
  },
  {
    title: 'Attendance bonus',
    description: 'The more consecutive days you sign in, the higher the reward will be.',
    image: '/attendence bonus.webp',
    type: 'card',
    order: 2
  },
  {
    title: 'Deposit bonus',
    description: 'Get extra rewards when you deposit',
    image: '/depositbonus.png',
    type: 'banner',
    order: 3
  },
  {
    title: 'Monthly bonus',
    description: 'Claim your monthly loyal bonus',
    image: '/monthly bonus.jpg',
    type: 'banner',
    order: 4
  },
  {
    title: 'Winning streak',
    description: 'Extra rewards for consecutive wins',
    image: '/winning streak.png',
    type: 'banner',
    order: 5
  }
];

const defaultVipLevels = [
  { level: 1, title: 'VIP1', expRequired: 0, payoutDays: 5, betToExp: 100, isOpen: true },
  { level: 2, title: 'VIP2', expRequired: 500, payoutDays: 5, betToExp: 100, isOpen: false }
];

const defaultVipBenefits = [
  {
    level: 2,
    group: 'LEVEL',
    title: 'Level up rewards',
    description: 'Each account can only receive 1 time',
    image: '/level-up-reward.webp',
    value: '200',
    secondaryValue: '0',
    order: 1
  },
  {
    level: 2,
    group: 'LEVEL',
    title: 'Monthly reward',
    description: 'Each account can only receive 1 time per month',
    image: '/monthly-reward.webp',
    value: '100',
    secondaryValue: '0',
    order: 2
  },
  {
    level: 2,
    group: 'LEVEL',
    title: 'Rebate rate',
    description: 'Increase income of rebate',
    image: '/rebete-rate.webp',
    value: '0.15%',
    order: 3
  },
  {
    level: 2,
    group: 'MY',
    title: 'Level up rewards',
    description: 'Each account can only receive 1 time',
    image: '/levelup2.webp',
    value: '60',
    order: 1
  },
  {
    level: 2,
    group: 'MY',
    title: 'Monthly reward',
    description: 'Each account can only receive 1 time per month',
    image: '/monthlyreward2.webp',
    value: '30',
    order: 2
  },
  {
    level: 2,
    group: 'MY',
    title: 'Rebate rate',
    description: 'Increase income of rebate',
    image: '/rebete 2.webp',
    value: '0.15%',
    order: 3
  }
];

const defaultPages = [
  { slug: 'game-history', title: 'Game History', content: 'Your game history will appear here.' },
  { slug: 'transaction', title: 'Transaction', content: 'Your transaction history will appear here.' },
  { slug: 'deposit', title: 'Deposit', content: 'Deposit history and methods appear here.' },
  { slug: 'withdraw', title: 'Withdraw', content: 'Withdraw history and methods appear here.' },
  { slug: 'notification', title: 'Notification', content: 'Notifications will appear here.' },
  { slug: 'gifts', title: 'Gifts', content: 'Redeem gifts and rewards here.' },
  { slug: 'game-statistics', title: 'Game Statistics', content: 'Stats and performance will appear here.' },
  { slug: 'language', title: 'Language', content: 'Select your preferred language.' },
  { slug: 'settings', title: 'Settings', content: 'Manage your account settings here.' },
  { slug: 'feedback', title: 'Feedback', content: 'Send feedback to our support team.' },
  { slug: 'announcement', title: 'Announcement', content: 'Latest announcements appear here.' },
  { slug: 'customer-service', title: 'Customer Service', content: 'Contact our customer service here.' },
  { slug: 'beginners-guide', title: 'Beginner\'s Guide', content: 'Learn how to get started.' },
  { slug: 'about-us', title: 'About Us', content: 'About 92 Glory0.' },
  { slug: 'partner-rewards', title: 'Partner Rewards', content: 'Partner rewards details.' },
  { slug: 'invitation-code', title: 'Invitation Code', content: 'Your invitation code can be copied and shared here.' },
  { slug: 'subordinate-data', title: 'Subordinate Data', content: 'Your subordinate data.' },
  { slug: 'commission-detail', title: 'Commission Detail', content: 'Commission details and history.' },
  { slug: 'invitation-rules', title: 'Invitation Rules', content: 'Invitation rules and terms.' },
  { slug: 'agent-support', title: 'Agent Line Customer Service', content: 'Agent support contact.' },
  { slug: 'rebate-ratio', title: 'Rebate Ratio', content: 'Rebate ratio information.' }
];

export const defaultSiteConfig = {
  brandName: '92 Glory0',
  announcement: 'Welcome to 92 Glory0, the most trusted and fairest site, you can play our games to get rich.',
  announcementButton: 'Detail'
};

const defaultPopup = {
  title: 'Welcome To 92 Glory0',
  content: [
    'WELCOME TO 92 GLORY0',
    'Avoid Scams, Stay Safe',
    'Protect Your Personal Information',
    'Enjoy the Rewards We Offer',
    'Experience the Fastest and Safest Transactions',
    'Have Fun and Good Luck!'
  ].join('\n'),
  order: 1,
  isActive: true
};

const defaultPromotionSetting = {
  commissionRate: 0.1,
  rebateRate: 0.15,
  customerService: 'telegram: @92Glory0Support'
};

function isUniqueConstraintError(error: unknown) {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002';
}

export function getFallbackHomeData() {
  return {
    site: {
      id: 'seed-site',
      ...defaultSiteConfig
    },
    banners: defaultBanners.map((banner, index) => ({
      id: `seed-banner-${index + 1}`,
      ...banner,
      link: null,
      isActive: true,
      createdAt: new Date(0).toISOString()
    })),
    categories: defaultCategories.map((category, index) => ({
      id: `seed-category-${index + 1}`,
      key: category.key,
      name: category.name,
      icon: category.icon,
      order: category.order,
      providers: category.providers ? JSON.stringify(category.providers) : null,
      isActive: true,
      createdAt: new Date(0).toISOString()
    })),
    games: defaultGames.map((game, index) => ({
      id: `seed-game-${index + 1}`,
      ...game,
      isActive: true,
      createdAt: new Date(0).toISOString()
    })),
    popups: [
      {
        id: 'seed-popup-1',
        ...defaultPopup,
        createdAt: new Date(0).toISOString()
      }
    ]
  };
}

async function seedSiteConfig() {
  const site = await db.siteConfig.findFirst();
  if (site) return;

  await db.siteConfig.create({
    data: defaultSiteConfig
  });
}

async function seedAdminUser() {
  const adminExists = await db.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
  if (adminExists) return;

  const password = await bcrypt.hash('admin123', 10);
  const uid = await generateUniqueUid();

  try {
    await db.user.create({
      data: {
        phone: '03000000000',
        uid,
        name: `Admin-${defaultMemberName(uid).slice(-4)}`,
        password,
        inviteCode: 'ADMIN92',
        role: 'ADMIN',
        balance: 5000,
        vipLevel: 2,
        exp: 397
      }
    });
  } catch (error) {
    if (!isUniqueConstraintError(error)) throw error;
    const adminCreatedByConcurrentRequest = await db.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    if (!adminCreatedByConcurrentRequest) throw error;
  }
}

async function seedBanners() {
  const bannerCount = await db.banner.count();
  if (bannerCount) return;
  await db.banner.createMany({ data: defaultBanners });
}

async function seedPopups() {
  const popupCount = await db.popup.count();
  if (popupCount) return;
  await db.popup.create({ data: defaultPopup });
}

async function seedCategories() {
  await db.category.createMany({
    data: defaultCategories.map((cat) => ({
      key: cat.key,
      name: cat.name,
      icon: cat.icon,
      order: cat.order,
      providers: cat.providers ? JSON.stringify(cat.providers) : null,
      isActive: true
    })),
    skipDuplicates: true
  });
}

async function seedGames() {
  const gameCount = await db.game.count();
  if (gameCount) return;
  await db.game.createMany({ data: defaultGames });
}

async function seedActivities() {
  const activityCount = await db.activity.count();
  if (activityCount) return;
  await db.activity.createMany({ data: defaultActivities });
}

async function seedVipLevels() {
  await db.vipLevel.createMany({ data: defaultVipLevels, skipDuplicates: true });
}

async function seedVipBenefits() {
  const vipBenefitCount = await db.vipBenefit.count();
  if (vipBenefitCount) return;
  await db.vipBenefit.createMany({ data: defaultVipBenefits });
}

async function seedContentPages() {
  await db.contentPage.createMany({ data: defaultPages, skipDuplicates: true });
}

async function seedPromotionSetting() {
  const promoSetting = await db.promotionSetting.findFirst();
  if (promoSetting) return;
  await db.promotionSetting.create({ data: defaultPromotionSetting });
}

async function runSeed() {
  await seedSiteConfig();
  await seedAdminUser();
  await seedBanners();
  await seedPopups();
  await seedCategories();
  await seedGames();
  await seedActivities();
  await seedVipLevels();
  await seedVipBenefits();
  await seedContentPages();
  await seedPromotionSetting();
}

export async function ensureSeeded() {
  if (!AUTO_SEED_ENABLED) return;
  if (globalThis.__seedCompleted) return;
  if ((globalThis.__seedDisabledUntil || 0) > Date.now()) return;

  if (!globalThis.__seedPromise) {
    globalThis.__seedPromise = runSeed()
      .then(() => {
        globalThis.__seedCompleted = true;
        globalThis.__seedDisabledUntil = undefined;
      })
      .finally(() => {
        globalThis.__seedPromise = undefined;
      });
  }

  await globalThis.__seedPromise;
}

export async function ensureSeededSafe() {
  try {
    await ensureSeeded();
    return true;
  } catch (error) {
    globalThis.__seedDisabledUntil = Date.now() + AUTO_SEED_RETRY_COOLDOWN_MS;
    if (process.env.NODE_ENV !== 'production') {
      const retryInSec = Math.max(1, Math.round(AUTO_SEED_RETRY_COOLDOWN_MS / 1000));
      console.error(`Seeding failed. Auto-seed retry paused for ${retryInSec}s:`, error);
    }
    return false;
  }
}
