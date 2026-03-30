'use client';

import { type ReactNode, useCallback, useEffect, useState } from 'react';
import { useAuthStore } from '@/lib/store';

type PromotionSetting = {
  commissionRate: number;
  rebateRate: number;
  customerService: string;
  partnerRewardCap: number;
  invitationBaseUrl: string;
  invitationRulesText: string;
  promotionRulesText: string;
  rebateRatioRulesText: string;
};

type GiftCode = {
  id: string;
  code: string;
  rewardAmount: number;
  maxTotalClaims: number;
  perUserLimit: number;
  expiresAt: string | null;
  isActive: boolean;
};

type ActivityTask = {
  id: string;
  title: string;
  description: string;
  gameType: string;
  period: 'DAILY' | 'WEEKLY';
  targetAmount: number;
  rewardAmount: number;
  order: number;
  isActive: boolean;
};

type RebateConfig = {
  id: string;
  gameType: string;
  title: string;
  rate: number;
  order: number;
  isActive: boolean;
};

type JackpotSetting = {
  minBetAmount: number;
  rewardAmount: number;
  validDays: number;
  isActive: boolean;
};

type AttendanceSetting = {
  minDepositAmount: number;
  oneTimeOnly: boolean;
  day1Reward: number;
  day2Reward: number;
  day3Reward: number;
  day4Reward: number;
  day5Reward: number;
  day6Reward: number;
  day7Reward: number;
};

type PartnerRewardRule = {
  id: string;
  stage: string;
  minAmount: number;
  maxAmount: number;
  minTurnover: number;
  bonusAmount: number;
  order: number;
  isActive: boolean;
};

type RebateRatio = {
  id: string;
  category: string;
  level: number;
  depth: number;
  ratio: number;
  order: number;
};

type CustomerServiceLink = {
  id: string;
  label: string;
  type: string;
  url: string;
  order: number;
  isActive: boolean;
};

const defaultPromotionSetting: PromotionSetting = {
  commissionRate: 0.1,
  rebateRate: 0.15,
  customerService: '',
  partnerRewardCap: 10000,
  invitationBaseUrl: '',
  invitationRulesText: '',
  promotionRulesText: '',
  rebateRatioRulesText: ''
};

const defaultAttendanceSetting: AttendanceSetting = {
  minDepositAmount: 500,
  oneTimeOnly: false,
  day1Reward: 15,
  day2Reward: 25,
  day3Reward: 45,
  day4Reward: 85,
  day5Reward: 110,
  day6Reward: 140,
  day7Reward: 180
};

const defaultGiftForm = {
  code: '',
  rewardAmount: 0,
  maxTotalClaims: 1,
  perUserLimit: 1,
  expiresAt: '',
  isActive: true
};

const defaultTaskForm = {
  title: '',
  description: '',
  gameType: 'SLOT',
  period: 'DAILY' as 'DAILY' | 'WEEKLY',
  targetAmount: 0,
  rewardAmount: 0,
  order: 0,
  isActive: true
};

const defaultRebateConfigForm = {
  gameType: 'LOTTERY',
  title: '',
  rate: 0,
  order: 0,
  isActive: true
};

const defaultJackpotSetting: JackpotSetting = {
  minBetAmount: 10000,
  rewardAmount: 180,
  validDays: 7,
  isActive: true
};

const defaultPartnerRuleForm = {
  stage: '',
  minAmount: 0,
  maxAmount: 0,
  minTurnover: 0,
  bonusAmount: 0,
  order: 0,
  isActive: true
};

const defaultRatioForm = {
  category: 'LOTTERY',
  level: 0,
  depth: 1,
  ratio: 0,
  order: 0
};

const defaultSupportForm = {
  label: '',
  type: 'TELEGRAM',
  url: '',
  order: 0,
  isActive: true
};

function toDatetimeLocal(value: string | null) {
  if (!value) return '';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  const hh = String(date.getHours()).padStart(2, '0');
  const mi = String(date.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export default function AdminPromotion() {
  const { token } = useAuthStore();

  const [settingForm, setSettingForm] = useState<PromotionSetting>(defaultPromotionSetting);
  const [attendanceForm, setAttendanceForm] = useState<AttendanceSetting>(defaultAttendanceSetting);
  const [jackpotForm, setJackpotForm] = useState<JackpotSetting>(defaultJackpotSetting);

  const [giftCodes, setGiftCodes] = useState<GiftCode[]>([]);
  const [giftForm, setGiftForm] = useState(defaultGiftForm);
  const [giftEditId, setGiftEditId] = useState<string | null>(null);

  const [tasks, setTasks] = useState<ActivityTask[]>([]);
  const [taskForm, setTaskForm] = useState(defaultTaskForm);
  const [taskEditId, setTaskEditId] = useState<string | null>(null);

  const [rebateConfigs, setRebateConfigs] = useState<RebateConfig[]>([]);
  const [rebateConfigForm, setRebateConfigForm] = useState(defaultRebateConfigForm);
  const [rebateConfigEditId, setRebateConfigEditId] = useState<string | null>(null);

  const [partnerRules, setPartnerRules] = useState<PartnerRewardRule[]>([]);
  const [partnerRuleForm, setPartnerRuleForm] = useState(defaultPartnerRuleForm);
  const [partnerRuleEditId, setPartnerRuleEditId] = useState<string | null>(null);

  const [ratios, setRatios] = useState<RebateRatio[]>([]);
  const [ratioForm, setRatioForm] = useState(defaultRatioForm);
  const [ratioEditId, setRatioEditId] = useState<string | null>(null);

  const [supportLinks, setSupportLinks] = useState<CustomerServiceLink[]>([]);
  const [supportForm, setSupportForm] = useState(defaultSupportForm);
  const [supportEditId, setSupportEditId] = useState<string | null>(null);

  const authHeaders = useCallback((json: boolean = false) => {
    const headers: Record<string, string> = {};
    if (json) headers['Content-Type'] = 'application/json';
    if (token) headers.Authorization = `Bearer ${token}`;
    return headers;
  }, [token]);

  const load = useCallback(async () => {
    if (!token) return;
    const [
      promotionSetting,
      attendanceSetting,
      jackpotSetting,
      gifts,
      activityTasks,
      rebateRows,
      partnerRows,
      ratioRows,
      supportRows
    ] = await Promise.all([
      fetch('/api/promotion/settings').then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/attendance-setting', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/jackpot-setting', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/gift-codes', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/activity-tasks', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/rebate-config', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/partner-reward-rules', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/rebate-ratios', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null)),
      fetch('/api/admin/customer-service-links', { headers: authHeaders() }).then(async (res) => (res.ok ? res.json().catch(() => null) : null))
    ]);

    if (promotionSetting?.setting) setSettingForm(promotionSetting.setting);
    if (attendanceSetting?.setting) setAttendanceForm(attendanceSetting.setting);
    if (jackpotSetting?.setting) setJackpotForm(jackpotSetting.setting);
    setGiftCodes(gifts?.codes || []);
    setTasks(activityTasks?.tasks || []);
    setRebateConfigs(rebateRows?.configs || []);
    setPartnerRules(partnerRows?.rules || []);
    setRatios(ratioRows?.ratios || []);
    setSupportLinks(supportRows?.links || []);
  }, [authHeaders, token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      load();
    }, 0);
    return () => clearTimeout(timer);
  }, [load]);

  const saveSetting = async () => {
    await fetch('/api/promotion/settings', {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(settingForm)
    });
    load();
  };

  const saveAttendance = async () => {
    await fetch('/api/admin/attendance-setting', {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(attendanceForm)
    });
    load();
  };

  const saveJackpot = async () => {
    await fetch('/api/admin/jackpot-setting', {
      method: 'PUT',
      headers: authHeaders(true),
      body: JSON.stringify(jackpotForm)
    });
    load();
  };

  const saveGift = async () => {
    const url = giftEditId ? `/api/admin/gift-codes/${giftEditId}` : '/api/admin/gift-codes';
    const method = giftEditId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(giftForm)
    });
    setGiftEditId(null);
    setGiftForm(defaultGiftForm);
    load();
  };

  const saveTask = async () => {
    const url = taskEditId ? `/api/admin/activity-tasks/${taskEditId}` : '/api/admin/activity-tasks';
    const method = taskEditId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(taskForm)
    });
    setTaskEditId(null);
    setTaskForm(defaultTaskForm);
    load();
  };

  const saveRebateConfig = async () => {
    const url = rebateConfigEditId ? `/api/admin/rebate-config/${rebateConfigEditId}` : '/api/admin/rebate-config';
    const method = rebateConfigEditId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(rebateConfigForm)
    });
    setRebateConfigEditId(null);
    setRebateConfigForm(defaultRebateConfigForm);
    load();
  };

  const savePartnerRule = async () => {
    const url = partnerRuleEditId ? `/api/admin/partner-reward-rules/${partnerRuleEditId}` : '/api/admin/partner-reward-rules';
    const method = partnerRuleEditId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(partnerRuleForm)
    });
    setPartnerRuleEditId(null);
    setPartnerRuleForm(defaultPartnerRuleForm);
    load();
  };

  const saveRatio = async () => {
    const url = ratioEditId ? `/api/admin/rebate-ratios/${ratioEditId}` : '/api/admin/rebate-ratios';
    const method = ratioEditId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(ratioForm)
    });
    setRatioEditId(null);
    setRatioForm(defaultRatioForm);
    load();
  };

  const saveSupport = async () => {
    const url = supportEditId ? `/api/admin/customer-service-links/${supportEditId}` : '/api/admin/customer-service-links';
    const method = supportEditId ? 'PUT' : 'POST';
    await fetch(url, {
      method,
      headers: authHeaders(true),
      body: JSON.stringify(supportForm)
    });
    setSupportEditId(null);
    setSupportForm(defaultSupportForm);
    load();
  };

  const remove = async (url: string) => {
    await fetch(url, { method: 'DELETE', headers: authHeaders() });
    load();
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-black text-gray-800">Promotion & Activity Controls</h1>
        <p className="text-gray-400 text-sm">Manage gift, activity, attendance, rebate, jackpot, rules, and support settings.</p>
      </div>

      <AdminSection title="Promotion Settings">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <NumberInput label="Commission rate" value={settingForm.commissionRate} onChange={(value) => setSettingForm({ ...settingForm, commissionRate: value })} step="0.0001" />
          <NumberInput label="Rebate rate" value={settingForm.rebateRate} onChange={(value) => setSettingForm({ ...settingForm, rebateRate: value })} step="0.0001" />
          <NumberInput label="Partner reward cap" value={settingForm.partnerRewardCap} onChange={(value) => setSettingForm({ ...settingForm, partnerRewardCap: value })} />
          <TextInput label="Customer service text" value={settingForm.customerService} onChange={(value) => setSettingForm({ ...settingForm, customerService: value })} />
          <TextInput label="Invitation base URL" value={settingForm.invitationBaseUrl} onChange={(value) => setSettingForm({ ...settingForm, invitationBaseUrl: value })} />
          <div />
          <TextArea label="Invitation rules text" value={settingForm.invitationRulesText} onChange={(value) => setSettingForm({ ...settingForm, invitationRulesText: value })} />
          <TextArea label="Promotion rules text" value={settingForm.promotionRulesText} onChange={(value) => setSettingForm({ ...settingForm, promotionRulesText: value })} />
          <TextArea label="Rebate ratio rules text" value={settingForm.rebateRatioRulesText} onChange={(value) => setSettingForm({ ...settingForm, rebateRatioRulesText: value })} />
        </div>
        <PrimaryButton onClick={saveSetting}>Save Promotion Settings</PrimaryButton>
      </AdminSection>

      <AdminSection title="Gift Codes">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <TextInput label="Code" value={giftForm.code} onChange={(value) => setGiftForm({ ...giftForm, code: value })} />
          <NumberInput label="Reward amount" value={giftForm.rewardAmount} onChange={(value) => setGiftForm({ ...giftForm, rewardAmount: value })} />
          <NumberInput label="Max total claims" value={giftForm.maxTotalClaims} onChange={(value) => setGiftForm({ ...giftForm, maxTotalClaims: value })} />
          <NumberInput label="Per user limit" value={giftForm.perUserLimit} onChange={(value) => setGiftForm({ ...giftForm, perUserLimit: value })} />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-500 uppercase">Expiry</p>
            <input
              type="datetime-local"
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={giftForm.expiresAt}
              onChange={(e) => setGiftForm({ ...giftForm, expiresAt: e.target.value })}
            />
          </div>
          <ToggleInput label="Active" checked={giftForm.isActive} onChange={(checked) => setGiftForm({ ...giftForm, isActive: checked })} />
        </div>
        <PrimaryButton onClick={saveGift}>{giftEditId ? 'Update Gift Code' : 'Add Gift Code'}</PrimaryButton>
        <DataTable
          columns={['Code', 'Reward', 'Claims', 'Per User', 'Expiry', 'Active', 'Actions']}
          rows={giftCodes.map((row) => [
            row.code,
            row.rewardAmount.toFixed(2),
            String(row.maxTotalClaims),
            String(row.perUserLimit),
            row.expiresAt ? new Date(row.expiresAt).toLocaleString() : '-',
            row.isActive ? 'Yes' : 'No',
            <ActionGroup
              key={row.id}
              onEdit={() => {
                setGiftEditId(row.id);
                setGiftForm({
                  code: row.code,
                  rewardAmount: row.rewardAmount,
                  maxTotalClaims: row.maxTotalClaims,
                  perUserLimit: row.perUserLimit,
                  expiresAt: toDatetimeLocal(row.expiresAt),
                  isActive: row.isActive
                });
              }}
              onDelete={() => remove(`/api/admin/gift-codes/${row.id}`)}
            />
          ])}
        />
      </AdminSection>

      <AdminSection title="Attendance Bonus">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <NumberInput label="Min deposit amount" value={attendanceForm.minDepositAmount} onChange={(value) => setAttendanceForm({ ...attendanceForm, minDepositAmount: value })} />
          <ToggleInput label="One time only" checked={attendanceForm.oneTimeOnly} onChange={(checked) => setAttendanceForm({ ...attendanceForm, oneTimeOnly: checked })} />
          <NumberInput label="Day 1 reward" value={attendanceForm.day1Reward} onChange={(value) => setAttendanceForm({ ...attendanceForm, day1Reward: value })} />
          <NumberInput label="Day 2 reward" value={attendanceForm.day2Reward} onChange={(value) => setAttendanceForm({ ...attendanceForm, day2Reward: value })} />
          <NumberInput label="Day 3 reward" value={attendanceForm.day3Reward} onChange={(value) => setAttendanceForm({ ...attendanceForm, day3Reward: value })} />
          <NumberInput label="Day 4 reward" value={attendanceForm.day4Reward} onChange={(value) => setAttendanceForm({ ...attendanceForm, day4Reward: value })} />
          <NumberInput label="Day 5 reward" value={attendanceForm.day5Reward} onChange={(value) => setAttendanceForm({ ...attendanceForm, day5Reward: value })} />
          <NumberInput label="Day 6 reward" value={attendanceForm.day6Reward} onChange={(value) => setAttendanceForm({ ...attendanceForm, day6Reward: value })} />
          <NumberInput label="Day 7 reward" value={attendanceForm.day7Reward} onChange={(value) => setAttendanceForm({ ...attendanceForm, day7Reward: value })} />
        </div>
        <PrimaryButton onClick={saveAttendance}>Save Attendance Setting</PrimaryButton>
      </AdminSection>

      <AdminSection title="Activity Tasks">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <TextInput label="Title" value={taskForm.title} onChange={(value) => setTaskForm({ ...taskForm, title: value })} />
          <TextInput label="Game type" value={taskForm.gameType} onChange={(value) => setTaskForm({ ...taskForm, gameType: value.toUpperCase() })} />
          <div className="space-y-1">
            <p className="text-[11px] font-bold text-gray-500 uppercase">Period</p>
            <select
              className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
              value={taskForm.period}
              onChange={(e) => setTaskForm({ ...taskForm, period: e.target.value as 'DAILY' | 'WEEKLY' })}
            >
              <option value="DAILY">DAILY</option>
              <option value="WEEKLY">WEEKLY</option>
            </select>
          </div>
          <ToggleInput label="Active" checked={taskForm.isActive} onChange={(checked) => setTaskForm({ ...taskForm, isActive: checked })} />
          <NumberInput label="Target amount" value={taskForm.targetAmount} onChange={(value) => setTaskForm({ ...taskForm, targetAmount: value })} />
          <NumberInput label="Reward amount" value={taskForm.rewardAmount} onChange={(value) => setTaskForm({ ...taskForm, rewardAmount: value })} />
          <NumberInput label="Order" value={taskForm.order} onChange={(value) => setTaskForm({ ...taskForm, order: value })} />
          <TextArea label="Description" value={taskForm.description} onChange={(value) => setTaskForm({ ...taskForm, description: value })} />
        </div>
        <PrimaryButton onClick={saveTask}>{taskEditId ? 'Update Task' : 'Add Task'}</PrimaryButton>
        <DataTable
          columns={['Title', 'Type', 'Period', 'Target', 'Reward', 'Order', 'Active', 'Actions']}
          rows={tasks.map((row) => [
            row.title,
            row.gameType,
            row.period,
            row.targetAmount.toFixed(2),
            row.rewardAmount.toFixed(2),
            String(row.order),
            row.isActive ? 'Yes' : 'No',
            <ActionGroup
              key={row.id}
              onEdit={() => {
                setTaskEditId(row.id);
                setTaskForm({
                  title: row.title,
                  description: row.description,
                  gameType: row.gameType,
                  period: row.period,
                  targetAmount: row.targetAmount,
                  rewardAmount: row.rewardAmount,
                  order: row.order,
                  isActive: row.isActive
                });
              }}
              onDelete={() => remove(`/api/admin/activity-tasks/${row.id}`)}
            />
          ])}
        />
      </AdminSection>

      <AdminSection title="Rebate Config">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <TextInput label="Game type" value={rebateConfigForm.gameType} onChange={(value) => setRebateConfigForm({ ...rebateConfigForm, gameType: value.toUpperCase() })} />
          <TextInput label="Title" value={rebateConfigForm.title} onChange={(value) => setRebateConfigForm({ ...rebateConfigForm, title: value })} />
          <NumberInput label="Rate" value={rebateConfigForm.rate} onChange={(value) => setRebateConfigForm({ ...rebateConfigForm, rate: value })} step="0.000001" />
          <NumberInput label="Order" value={rebateConfigForm.order} onChange={(value) => setRebateConfigForm({ ...rebateConfigForm, order: value })} />
          <ToggleInput label="Active" checked={rebateConfigForm.isActive} onChange={(checked) => setRebateConfigForm({ ...rebateConfigForm, isActive: checked })} />
        </div>
        <PrimaryButton onClick={saveRebateConfig}>{rebateConfigEditId ? 'Update Rebate Config' : 'Add Rebate Config'}</PrimaryButton>
        <DataTable
          columns={['Game type', 'Title', 'Rate', 'Order', 'Active', 'Actions']}
          rows={rebateConfigs.map((row) => [
            row.gameType,
            row.title,
            row.rate.toString(),
            String(row.order),
            row.isActive ? 'Yes' : 'No',
            <ActionGroup
              key={row.id}
              onEdit={() => {
                setRebateConfigEditId(row.id);
                setRebateConfigForm({
                  gameType: row.gameType,
                  title: row.title,
                  rate: row.rate,
                  order: row.order,
                  isActive: row.isActive
                });
              }}
              onDelete={() => remove(`/api/admin/rebate-config/${row.id}`)}
            />
          ])}
        />
      </AdminSection>

      <AdminSection title="Super Jackpot">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <NumberInput label="Min bet amount" value={jackpotForm.minBetAmount} onChange={(value) => setJackpotForm({ ...jackpotForm, minBetAmount: value })} />
          <NumberInput label="Reward amount" value={jackpotForm.rewardAmount} onChange={(value) => setJackpotForm({ ...jackpotForm, rewardAmount: value })} />
          <NumberInput label="Valid days" value={jackpotForm.validDays} onChange={(value) => setJackpotForm({ ...jackpotForm, validDays: value })} />
          <ToggleInput label="Active" checked={jackpotForm.isActive} onChange={(checked) => setJackpotForm({ ...jackpotForm, isActive: checked })} />
        </div>
        <PrimaryButton onClick={saveJackpot}>Save Jackpot Setting</PrimaryButton>
      </AdminSection>

      <AdminSection title="Partner Reward Rules">
        <div className="grid grid-cols-1 md:grid-cols-8 gap-3">
          <TextInput label="Stage" value={partnerRuleForm.stage} onChange={(value) => setPartnerRuleForm({ ...partnerRuleForm, stage: value })} />
          <NumberInput label="Min amount" value={partnerRuleForm.minAmount} onChange={(value) => setPartnerRuleForm({ ...partnerRuleForm, minAmount: value })} />
          <NumberInput label="Max amount" value={partnerRuleForm.maxAmount} onChange={(value) => setPartnerRuleForm({ ...partnerRuleForm, maxAmount: value })} />
          <NumberInput label="Min turnover" value={partnerRuleForm.minTurnover} onChange={(value) => setPartnerRuleForm({ ...partnerRuleForm, minTurnover: value })} />
          <NumberInput label="Bonus amount" value={partnerRuleForm.bonusAmount} onChange={(value) => setPartnerRuleForm({ ...partnerRuleForm, bonusAmount: value })} />
          <NumberInput label="Order" value={partnerRuleForm.order} onChange={(value) => setPartnerRuleForm({ ...partnerRuleForm, order: value })} />
          <ToggleInput label="Active" checked={partnerRuleForm.isActive} onChange={(checked) => setPartnerRuleForm({ ...partnerRuleForm, isActive: checked })} />
        </div>
        <PrimaryButton onClick={savePartnerRule}>{partnerRuleEditId ? 'Update Partner Rule' : 'Add Partner Rule'}</PrimaryButton>
        <DataTable
          columns={['Stage', 'Amount range', 'Turnover', 'Bonus', 'Order', 'Active', 'Actions']}
          rows={partnerRules.map((row) => [
            row.stage,
            `${row.minAmount} - ${row.maxAmount}`,
            row.minTurnover.toString(),
            row.bonusAmount.toString(),
            String(row.order),
            row.isActive ? 'Yes' : 'No',
            <ActionGroup
              key={row.id}
              onEdit={() => {
                setPartnerRuleEditId(row.id);
                setPartnerRuleForm({
                  stage: row.stage,
                  minAmount: row.minAmount,
                  maxAmount: row.maxAmount,
                  minTurnover: row.minTurnover,
                  bonusAmount: row.bonusAmount,
                  order: row.order,
                  isActive: row.isActive
                });
              }}
              onDelete={() => remove(`/api/admin/partner-reward-rules/${row.id}`)}
            />
          ])}
        />
      </AdminSection>

      <AdminSection title="Rebate Ratios">
        <div className="grid grid-cols-1 md:grid-cols-6 gap-3">
          <TextInput label="Category" value={ratioForm.category} onChange={(value) => setRatioForm({ ...ratioForm, category: value.toUpperCase() })} />
          <NumberInput label="Level" value={ratioForm.level} onChange={(value) => setRatioForm({ ...ratioForm, level: value })} />
          <NumberInput label="Depth" value={ratioForm.depth} onChange={(value) => setRatioForm({ ...ratioForm, depth: value })} />
          <NumberInput label="Ratio" value={ratioForm.ratio} onChange={(value) => setRatioForm({ ...ratioForm, ratio: value })} step="0.0000001" />
          <NumberInput label="Order" value={ratioForm.order} onChange={(value) => setRatioForm({ ...ratioForm, order: value })} />
        </div>
        <PrimaryButton onClick={saveRatio}>{ratioEditId ? 'Update Rebate Ratio' : 'Add Rebate Ratio'}</PrimaryButton>
        <DataTable
          columns={['Category', 'L', 'Depth', 'Ratio', 'Order', 'Actions']}
          rows={ratios.map((row) => [
            row.category,
            String(row.level),
            String(row.depth),
            row.ratio.toString(),
            String(row.order),
            <ActionGroup
              key={row.id}
              onEdit={() => {
                setRatioEditId(row.id);
                setRatioForm({
                  category: row.category,
                  level: row.level,
                  depth: row.depth,
                  ratio: row.ratio,
                  order: row.order
                });
              }}
              onDelete={() => remove(`/api/admin/rebate-ratios/${row.id}`)}
            />
          ])}
        />
      </AdminSection>

      <AdminSection title="Customer Service Links">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <TextInput label="Label" value={supportForm.label} onChange={(value) => setSupportForm({ ...supportForm, label: value })} />
          <TextInput label="Type" value={supportForm.type} onChange={(value) => setSupportForm({ ...supportForm, type: value.toUpperCase() })} />
          <TextInput label="URL" value={supportForm.url} onChange={(value) => setSupportForm({ ...supportForm, url: value })} />
          <NumberInput label="Order" value={supportForm.order} onChange={(value) => setSupportForm({ ...supportForm, order: value })} />
          <ToggleInput label="Active" checked={supportForm.isActive} onChange={(checked) => setSupportForm({ ...supportForm, isActive: checked })} />
        </div>
        <PrimaryButton onClick={saveSupport}>{supportEditId ? 'Update Support Link' : 'Add Support Link'}</PrimaryButton>
        <DataTable
          columns={['Label', 'Type', 'URL', 'Order', 'Active', 'Actions']}
          rows={supportLinks.map((row) => [
            row.label,
            row.type,
            row.url,
            String(row.order),
            row.isActive ? 'Yes' : 'No',
            <ActionGroup
              key={row.id}
              onEdit={() => {
                setSupportEditId(row.id);
                setSupportForm({
                  label: row.label,
                  type: row.type,
                  url: row.url,
                  order: row.order,
                  isActive: row.isActive
                });
              }}
              onDelete={() => remove(`/api/admin/customer-service-links/${row.id}`)}
            />
          ])}
        />
      </AdminSection>
    </div>
  );
}

function AdminSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 space-y-4">
      <h2 className="text-base font-black text-gray-800">{title}</h2>
      {children}
    </div>
  );
}

function TextInput({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-gray-500 uppercase">{label}</p>
      <input
        type="text"
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function NumberInput({
  label,
  value,
  onChange,
  step = '1'
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: string;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-gray-500 uppercase">{label}</p>
      <input
        type="number"
        step={step}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </div>
  );
}

function TextArea({
  label,
  value,
  onChange
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-gray-500 uppercase">{label}</p>
      <textarea
        rows={4}
        className="w-full border border-gray-200 rounded-xl px-3 py-2 text-sm"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function ToggleInput({
  label,
  checked,
  onChange
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="space-y-1">
      <p className="text-[11px] font-bold text-gray-500 uppercase">{label}</p>
      <label className="h-[42px] border border-gray-200 rounded-xl px-3 flex items-center gap-2 text-sm text-gray-700">
        <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        Enabled
      </label>
    </div>
  );
}

function PrimaryButton({
  children,
  onClick
}: {
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button onClick={onClick} className="bg-accent-purple text-white px-5 py-2 rounded-full text-sm font-bold">
      {children}
    </button>
  );
}

function DataTable({
  columns,
  rows
}: {
  columns: string[];
  rows: Array<Array<string | ReactNode>>;
}) {
  return (
    <div className="overflow-x-auto border border-gray-100 rounded-xl">
      <table className="w-full text-sm">
        <thead className="bg-gray-50">
          <tr>
            {columns.map((col) => (
              <th key={col} className="text-left px-3 py-2 text-gray-600 font-bold whitespace-nowrap">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, idx) => (
            <tr key={idx} className="border-t border-gray-100">
              {row.map((cell, cellIdx) => (
                <td key={cellIdx} className="px-3 py-2 text-gray-700 whitespace-nowrap align-top">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function ActionGroup({
  onEdit,
  onDelete
}: {
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="flex gap-2">
      <button onClick={onEdit} className="text-xs font-bold text-accent-purple">
        Edit
      </button>
      <button onClick={onDelete} className="text-xs font-bold text-red-500">
        Delete
      </button>
    </div>
  );
}
