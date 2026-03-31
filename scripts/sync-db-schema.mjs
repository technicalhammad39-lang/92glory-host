import { PrismaClient } from '@prisma/client';
import { loadEnvTarget } from './env-loader.mjs';

const envTarget = process.env.DB_ENV_TARGET || 'local';
const loadedEnv = loadEnvTarget(envTarget);

if (!process.env.DATABASE_URL) {
  throw new Error(`[db-sync] DATABASE_URL missing. target=${envTarget} files=${loadedEnv.loadedFiles.join(',') || 'none'}`);
}

console.log(
  `[db-sync] env target=${loadedEnv.target} host=${loadedEnv.databaseHost || 'unknown'} files=${loadedEnv.loadedFiles.join(',') || 'none'}`
);

const db = new PrismaClient();

function log(message) {
  console.log(`[db-sync] ${message}`);
}

async function tableExists(tableName) {
  const rows = await db.$queryRaw`
    SELECT 1 AS present
    FROM INFORMATION_SCHEMA.TABLES
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${tableName}
    LIMIT 1
  `;
  return Array.isArray(rows) && rows.length > 0;
}

async function columnExists(tableName, columnName) {
  const rows = await db.$queryRaw`
    SELECT 1 AS present
    FROM INFORMATION_SCHEMA.COLUMNS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${tableName}
      AND COLUMN_NAME = ${columnName}
    LIMIT 1
  `;
  return Array.isArray(rows) && rows.length > 0;
}

async function indexExists(tableName, indexName) {
  const rows = await db.$queryRaw`
    SELECT 1 AS present
    FROM INFORMATION_SCHEMA.STATISTICS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = ${tableName}
      AND INDEX_NAME = ${indexName}
    LIMIT 1
  `;
  return Array.isArray(rows) && rows.length > 0;
}

async function ensureColumn(tableName, columnName, columnSql) {
  if (!(await tableExists(tableName))) return;
  if (await columnExists(tableName, columnName)) return;
  await db.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnSql}`);
  log(`Added column ${tableName}.${columnName}`);
}

async function ensureIndex(tableName, indexName, indexSql) {
  if (!(await tableExists(tableName))) return;
  if (await indexExists(tableName, indexName)) return;
  await db.$executeRawUnsafe(`ALTER TABLE \`${tableName}\` ADD ${indexSql}`);
  log(`Added index ${indexName} on ${tableName}`);
}

async function ensureTable(tableName, createSql) {
  if (await tableExists(tableName)) return;
  await db.$executeRawUnsafe(createSql);
  log(`Created table ${tableName}`);
}

async function syncExistingTables() {
  await ensureColumn('Banner', 'title', "`title` VARCHAR(191) NOT NULL DEFAULT ''");
  await ensureColumn('Banner', 'description', '`description` LONGTEXT NULL');
  await ensureColumn('Banner', 'rulesText', '`rulesText` LONGTEXT NULL');

  await ensureColumn('PromotionSetting', 'partnerRewardCap', '`partnerRewardCap` DOUBLE NOT NULL DEFAULT 10000');
  await ensureColumn('PromotionSetting', 'invitationBaseUrl', '`invitationBaseUrl` VARCHAR(255) NULL');
  await ensureColumn('PromotionSetting', 'invitationRulesText', '`invitationRulesText` LONGTEXT NULL');
  await ensureColumn('PromotionSetting', 'promotionRulesText', '`promotionRulesText` LONGTEXT NULL');
  await ensureColumn('PromotionSetting', 'rebateRatioRulesText', '`rebateRatioRulesText` LONGTEXT NULL');
}

async function createFeatureTables() {
  await ensureTable(
    'GiftCode',
    `
    CREATE TABLE \`GiftCode\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`code\` VARCHAR(191) NOT NULL,
      \`rewardAmount\` DOUBLE NOT NULL,
      \`maxTotalClaims\` INT NOT NULL DEFAULT 1,
      \`perUserLimit\` INT NOT NULL DEFAULT 1,
      \`expiresAt\` DATETIME(3) NULL,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`totalClaimed\` INT NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`GiftCode_code_key\` (\`code\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'GiftClaim',
    `
    CREATE TABLE \`GiftClaim\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`giftCodeId\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`amount\` DOUBLE NOT NULL,
      \`status\` ENUM('SUCCESS','FAILED') NOT NULL DEFAULT 'SUCCESS',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`GiftClaim_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      KEY \`GiftClaim_giftCodeId_createdAt_idx\` (\`giftCodeId\`, \`createdAt\`),
      CONSTRAINT \`GiftClaim_giftCodeId_fkey\` FOREIGN KEY (\`giftCodeId\`) REFERENCES \`GiftCode\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`GiftClaim_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'AttendanceSetting',
    `
    CREATE TABLE \`AttendanceSetting\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`minDepositAmount\` DOUBLE NOT NULL DEFAULT 500,
      \`oneTimeOnly\` TINYINT(1) NOT NULL DEFAULT 0,
      \`day1Reward\` DOUBLE NOT NULL DEFAULT 15,
      \`day2Reward\` DOUBLE NOT NULL DEFAULT 25,
      \`day3Reward\` DOUBLE NOT NULL DEFAULT 45,
      \`day4Reward\` DOUBLE NOT NULL DEFAULT 85,
      \`day5Reward\` DOUBLE NOT NULL DEFAULT 110,
      \`day6Reward\` DOUBLE NOT NULL DEFAULT 140,
      \`day7Reward\` DOUBLE NOT NULL DEFAULT 180,
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'AttendanceRecord',
    `
    CREATE TABLE \`AttendanceRecord\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`dayKey\` VARCHAR(191) NOT NULL,
      \`consecutiveDays\` INT NOT NULL DEFAULT 1,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`AttendanceRecord_userId_dayKey_key\` (\`userId\`, \`dayKey\`),
      KEY \`AttendanceRecord_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      CONSTRAINT \`AttendanceRecord_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'AttendanceClaim',
    `
    CREATE TABLE \`AttendanceClaim\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`dayKey\` VARCHAR(191) NOT NULL,
      \`dayNumber\` INT NOT NULL,
      \`amount\` DOUBLE NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`AttendanceClaim_userId_dayKey_key\` (\`userId\`, \`dayKey\`),
      KEY \`AttendanceClaim_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      CONSTRAINT \`AttendanceClaim_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'ActivityTask',
    `
    CREATE TABLE \`ActivityTask\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`title\` VARCHAR(191) NOT NULL,
      \`description\` LONGTEXT NOT NULL,
      \`gameType\` VARCHAR(191) NOT NULL DEFAULT 'SLOT',
      \`period\` ENUM('DAILY','WEEKLY') NOT NULL DEFAULT 'DAILY',
      \`targetAmount\` DOUBLE NOT NULL,
      \`rewardAmount\` DOUBLE NOT NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'ActivityTaskProgress',
    `
    CREATE TABLE \`ActivityTaskProgress\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`taskId\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`progressAmount\` DOUBLE NOT NULL DEFAULT 0,
      \`periodKey\` VARCHAR(191) NOT NULL,
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`ActivityTaskProgress_taskId_userId_periodKey_key\` (\`taskId\`, \`userId\`, \`periodKey\`),
      KEY \`ActivityTaskProgress_userId_periodKey_idx\` (\`userId\`, \`periodKey\`),
      CONSTRAINT \`ActivityTaskProgress_taskId_fkey\` FOREIGN KEY (\`taskId\`) REFERENCES \`ActivityTask\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`ActivityTaskProgress_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'ActivityTaskClaim',
    `
    CREATE TABLE \`ActivityTaskClaim\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`taskId\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`periodKey\` VARCHAR(191) NOT NULL,
      \`amount\` DOUBLE NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`ActivityTaskClaim_taskId_userId_periodKey_key\` (\`taskId\`, \`userId\`, \`periodKey\`),
      KEY \`ActivityTaskClaim_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      CONSTRAINT \`ActivityTaskClaim_taskId_fkey\` FOREIGN KEY (\`taskId\`) REFERENCES \`ActivityTask\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE,
      CONSTRAINT \`ActivityTaskClaim_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'RebateConfig',
    `
    CREATE TABLE \`RebateConfig\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`gameType\` VARCHAR(191) NOT NULL,
      \`title\` VARCHAR(191) NOT NULL,
      \`rate\` DOUBLE NOT NULL,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`order\` INT NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`RebateConfig_gameType_key\` (\`gameType\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'RebateClaim',
    `
    CREATE TABLE \`RebateClaim\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`gameType\` VARCHAR(191) NOT NULL DEFAULT 'ALL',
      \`periodKey\` VARCHAR(191) NOT NULL,
      \`betAmount\` DOUBLE NOT NULL DEFAULT 0,
      \`rebateRate\` DOUBLE NOT NULL DEFAULT 0,
      \`rebateAmount\` DOUBLE NOT NULL DEFAULT 0,
      \`status\` ENUM('PENDING','CLAIMED','EXPIRED') NOT NULL DEFAULT 'CLAIMED',
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`RebateClaim_userId_gameType_periodKey_key\` (\`userId\`, \`gameType\`, \`periodKey\`),
      KEY \`RebateClaim_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      CONSTRAINT \`RebateClaim_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'JackpotSetting',
    `
    CREATE TABLE \`JackpotSetting\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`minBetAmount\` DOUBLE NOT NULL DEFAULT 10000,
      \`rewardAmount\` DOUBLE NOT NULL DEFAULT 180,
      \`validDays\` INT NOT NULL DEFAULT 7,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'JackpotClaim',
    `
    CREATE TABLE \`JackpotClaim\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`periodKey\` VARCHAR(191) NOT NULL,
      \`eligibleAmount\` DOUBLE NOT NULL DEFAULT 0,
      \`rewardAmount\` DOUBLE NOT NULL,
      \`status\` ENUM('ELIGIBLE','CLAIMED','EXPIRED') NOT NULL DEFAULT 'ELIGIBLE',
      \`eligibleAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`expiresAt\` DATETIME(3) NULL,
      \`claimedAt\` DATETIME(3) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`JackpotClaim_userId_periodKey_key\` (\`userId\`, \`periodKey\`),
      KEY \`JackpotClaim_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      CONSTRAINT \`JackpotClaim_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'Notification',
    `
    CREATE TABLE \`Notification\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`type\` ENUM('LOGIN','SYSTEM') NOT NULL DEFAULT 'SYSTEM',
      \`title\` VARCHAR(191) NOT NULL,
      \`content\` LONGTEXT NOT NULL,
      \`isRead\` TINYINT(1) NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`Notification_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      CONSTRAINT \`Notification_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'SupportTicket',
    `
    CREATE TABLE \`SupportTicket\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`userId\` VARCHAR(191) NOT NULL,
      \`category\` VARCHAR(191) NOT NULL,
      \`subject\` VARCHAR(191) NOT NULL,
      \`details\` LONGTEXT NOT NULL,
      \`status\` ENUM('OPEN','IN_PROGRESS','RESOLVED','REJECTED') NOT NULL DEFAULT 'OPEN',
      \`adminResponse\` LONGTEXT NULL,
      \`resolvedAt\` DATETIME(3) NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`SupportTicket_userId_createdAt_idx\` (\`userId\`, \`createdAt\`),
      KEY \`SupportTicket_status_updatedAt_idx\` (\`status\`, \`updatedAt\`),
      CONSTRAINT \`SupportTicket_userId_fkey\` FOREIGN KEY (\`userId\`) REFERENCES \`User\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'SupportTicketAttachment',
    `
    CREATE TABLE \`SupportTicketAttachment\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`ticketId\` VARCHAR(191) NOT NULL,
      \`url\` VARCHAR(191) NOT NULL,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      KEY \`SupportTicketAttachment_ticketId_createdAt_idx\` (\`ticketId\`, \`createdAt\`),
      CONSTRAINT \`SupportTicketAttachment_ticketId_fkey\` FOREIGN KEY (\`ticketId\`) REFERENCES \`SupportTicket\`(\`id\`) ON DELETE CASCADE ON UPDATE CASCADE
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'PartnerRewardRule',
    `
    CREATE TABLE \`PartnerRewardRule\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`stage\` VARCHAR(191) NOT NULL,
      \`minAmount\` DOUBLE NOT NULL,
      \`maxAmount\` DOUBLE NOT NULL,
      \`minTurnover\` DOUBLE NOT NULL,
      \`bonusAmount\` DOUBLE NOT NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'RebateRatio',
    `
    CREATE TABLE \`RebateRatio\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`category\` VARCHAR(191) NOT NULL,
      \`level\` INT NOT NULL,
      \`depth\` INT NOT NULL,
      \`ratio\` DOUBLE NOT NULL,
      \`order\` INT NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`),
      UNIQUE KEY \`RebateRatio_category_level_depth_key\` (\`category\`, \`level\`, \`depth\`),
      KEY \`RebateRatio_category_level_order_idx\` (\`category\`, \`level\`, \`order\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureTable(
    'CustomerServiceLink',
    `
    CREATE TABLE \`CustomerServiceLink\` (
      \`id\` VARCHAR(191) NOT NULL,
      \`label\` VARCHAR(191) NOT NULL,
      \`type\` VARCHAR(191) NOT NULL DEFAULT 'TELEGRAM',
      \`url\` VARCHAR(191) NOT NULL,
      \`isActive\` TINYINT(1) NOT NULL DEFAULT 1,
      \`order\` INT NOT NULL DEFAULT 0,
      \`createdAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
      \`updatedAt\` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
      PRIMARY KEY (\`id\`)
    ) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci
    `
  );

  await ensureIndex('PartnerRewardRule', 'PartnerRewardRule_order_idx', 'INDEX `PartnerRewardRule_order_idx` (`order`)');
  await ensureIndex('CustomerServiceLink', 'CustomerServiceLink_order_idx', 'INDEX `CustomerServiceLink_order_idx` (`order`)');
}

async function main() {
  try {
    await syncExistingTables();
    await createFeatureTables();
    log('Schema sync completed.');
  } finally {
    await db.$disconnect();
  }
}

main().catch((error) => {
  console.error('[db-sync] failed:', error);
  process.exitCode = 1;
});
