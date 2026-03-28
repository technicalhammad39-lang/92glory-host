import { db } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { defaultMemberName, generateUniqueUid } from '@/lib/user-utils';

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

declare global {
  var __seedPromise: Promise<void> | undefined;
  var __seedDone: boolean | undefined;
}

async function runSeed() {
  const site = await db.siteConfig.findFirst();
  if (!site) {
    await db.siteConfig.create({
      data: {
        brandName: '92 Glory0',
        announcement: 'Welcome to 92 Glory0, the most trusted and fairest site, you can play our games to get rich.',
        announcementButton: 'Detail'
      }
    });
  }

  const adminByInvite = await db.user.findUnique({ where: { inviteCode: 'ADMIN92' } });
  if (adminByInvite) {
    if (adminByInvite.role !== 'ADMIN') {
      await db.user.update({
        where: { id: adminByInvite.id },
        data: { role: 'ADMIN' }
      });
    }
  } else {
    const anyAdmin = await db.user.findFirst({ where: { role: 'ADMIN' }, select: { id: true } });
    if (!anyAdmin) {
      const password = await bcrypt.hash('admin123', 10);
      const uid = await generateUniqueUid();
      await db.user.create({
        data: {
          phone: null,
          email: null,
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
    }
  }

  const bannerCount = await db.banner.count();
  if (!bannerCount) {
    await db.banner.createMany({ data: defaultBanners });
  }

  const popupCount = await db.popup.count();
  if (!popupCount) {
    await db.popup.create({
      data: {
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
      }
    });
  }

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

  const gameCount = await db.game.count();
  if (!gameCount) {
    await db.game.createMany({ data: defaultGames });
  }

  const activityCount = await db.activity.count();
  if (!activityCount) {
    await db.activity.createMany({ data: defaultActivities });
  }

  await db.vipLevel.createMany({ data: defaultVipLevels, skipDuplicates: true });

  const vipBenefitCount = await db.vipBenefit.count();
  if (!vipBenefitCount) {
    await db.vipBenefit.createMany({ data: defaultVipBenefits });
  }

  await db.contentPage.createMany({ data: defaultPages, skipDuplicates: true });

  const promoSetting = await db.promotionSetting.findFirst();
  if (!promoSetting) {
    await db.promotionSetting.create({
      data: {
        commissionRate: 0.1,
        rebateRate: 0.15,
        customerService: 'telegram: @92Glory0Support'
      }
    });
  }
}

export async function ensureSeeded() {
  if (process.env.ENABLE_RUNTIME_SEED === 'false') {
    const [hasCategories, hasGames, hasBanners] = await Promise.all([
      db.category.count().then((n) => n > 0).catch(() => false),
      db.game.count().then((n) => n > 0).catch(() => false),
      db.banner.count().then((n) => n > 0).catch(() => false)
    ]);

    if (hasCategories && hasGames && hasBanners) {
      global.__seedDone = true;
      return;
    }
  }

  if (global.__seedDone) return;
  if (!global.__seedPromise) {
    global.__seedPromise = runSeed()
      .then(() => {
        global.__seedDone = true;
      })
      .finally(() => {
        global.__seedPromise = undefined;
      });
  }
  await global.__seedPromise;
}
