import { getGameIssue, getGameHistory, getMyBets, submitBet } from './api.js';
import { GAME_LIST, formatMoney } from './gameConfig.js';
import { renderTokenStrip } from './colorTokens.js';
import { getElements } from './elements.js';
import { getPopupClassSuffix, closeOverlay, openOverlay, showToast } from './events.js';
import { renderHistoryRows, renderMyBetRows, renderRecordHead } from './gameRecord.js';
import { setWalletBalance } from './handleMoney.js';
import { hideWinDialog, showWinDialog } from './updateWin.js';
import { getGameFromItemElement, setActiveGameItem } from './utils.js';

const PENDING_SETTLEMENTS_KEY = 'wingo_pending_settlements';
const WINGO_OPEN_RELOAD_KEY = 'wingo_open_reload_once';
const HOME_RELOAD_AFTER_WINGO_KEY = 'home_reload_after_wingo';
const MAX_QTY = 9999;
const originalRootFontSize = document.documentElement.style.fontSize;

if (typeof window !== 'undefined') {
  const initialViewportWidth = Math.min(window.innerWidth || 450, 450);
  document.documentElement.style.fontSize = `${initialViewportWidth / 10}px`;
}

const elements = getElements();
const state = {
  game: GAME_LIST[0],
  round: null,
  history: [],
  myBets: [],
  recordTab: 'game',
  serverOffsetMs: 0,
  lastVoiceSecond: null,
  voiceDisabled: false,
  awaitingRoundRefresh: false,
  initialized: false,
  clockLoopStarted: false,
  pollingStarted: false,
  myBetsPollingStarted: false,
  clockIntervalId: null,
  pollingIntervalId: null,
  myBetsPollingIntervalId: null,
  popup: {
    betType: 'COLOR',
    selection: 'RED',
    label: 'Red',
    stake: 1,
    quantity: 1
  }
};

function applyBranding() {
  const headLogo = document.querySelector('.navbar__content-center .headLogo');
  if (headLogo) {
    headLogo.style.backgroundImage = "url('/92glory-logo.png')";
    headLogo.style.backgroundRepeat = 'no-repeat';
    headLogo.style.backgroundPosition = 'center';
    headLogo.style.backgroundSize = 'contain';
  }
}

function bindTopNavActions() {
  const backContainer = elements.root?.querySelector('.navbar__content-left') || document.querySelector('.navbar__content-left');
  if (!backContainer) return;

  backContainer.style.cursor = 'pointer';
  backContainer.addEventListener('click', () => {
    goHomeWithReload();
  });
}

function bindWalletActions() {
  const [withdrawButton, depositButton] = elements.walletActionButtons || [];

  if (withdrawButton) {
    withdrawButton.style.cursor = 'pointer';
    withdrawButton.addEventListener('click', () => {
      cleanupBeforeLeave();
      window.location.href = '/withdraw';
    });
  }

  if (depositButton) {
    depositButton.style.cursor = 'pointer';
    depositButton.addEventListener('click', () => {
      cleanupBeforeLeave();
      window.location.href = '/deposit';
    });
  }
}

function getPendingSettlements() {
  try {
    const raw = localStorage.getItem(PENDING_SETTLEMENTS_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function setPendingSettlements(data) {
  try {
    localStorage.setItem(PENDING_SETTLEMENTS_KEY, JSON.stringify(data));
  } catch {
    // ignore storage failures
  }
}

function pendingKey(issueNumber, durationSec) {
  return `${durationSec}:${issueNumber}`;
}

function rememberPendingSettlement(issueNumber, durationSec) {
  const pending = getPendingSettlements();
  pending[pendingKey(issueNumber, durationSec)] = Date.now();
  setPendingSettlements(pending);
}

function clearPendingSettlement(issueNumber, durationSec) {
  const pending = getPendingSettlements();
  delete pending[pendingKey(issueNumber, durationSec)];
  setPendingSettlements(pending);
}

function hasPendingSettlement(issueNumber, durationSec) {
  const pending = getPendingSettlements();
  return Boolean(pending[pendingKey(issueNumber, durationSec)]);
}

function setRootFontSize() {
  const viewportWidth = Math.min(window.innerWidth || 450, 450);
  document.documentElement.style.fontSize = `${viewportWidth / 10}px`;
}

function restoreRootFontSize() {
  document.documentElement.style.fontSize = originalRootFontSize;
}

function markHomeReloadFlag() {
  try {
    sessionStorage.setItem(HOME_RELOAD_AFTER_WINGO_KEY, '1');
  } catch {
    // ignore storage errors
  }
}

function clearWingoOpenReloadFlag() {
  try {
    sessionStorage.removeItem(WINGO_OPEN_RELOAD_KEY);
  } catch {
    // ignore storage errors
  }
}

function goHomeWithReload() {
  cleanupBeforeLeave();
  markHomeReloadFlag();
  window.location.replace('/');
}

function cleanupBeforeLeave() {
  if (state.clockIntervalId) {
    window.clearInterval(state.clockIntervalId);
    state.clockIntervalId = null;
    state.clockLoopStarted = false;
  }
  if (state.pollingIntervalId) {
    window.clearInterval(state.pollingIntervalId);
    state.pollingIntervalId = null;
    state.pollingStarted = false;
  }
  if (state.myBetsPollingIntervalId) {
    window.clearInterval(state.myBetsPollingIntervalId);
    state.myBetsPollingIntervalId = null;
    state.myBetsPollingStarted = false;
  }

  restoreRootFontSize();
  clearWingoOpenReloadFlag();
  document.body.classList.remove('van-overflow-hidden');
  if (elements.ruleDialog) elements.ruleDialog.style.display = 'none';
  if (elements.overlay) elements.overlay.style.display = 'none';
  closeOverlay(elements);
}

function bindResponsiveRoot() {
  setRootFontSize();
  window.addEventListener('resize', setRootFontSize);
  window.addEventListener('pagehide', restoreRootFontSize);
  window.addEventListener('beforeunload', restoreRootFontSize);
  document.addEventListener(
    'click',
    (event) => {
      const target = event.target instanceof Element ? event.target : null;
      const link = target?.closest('a[href]');
      if (!link) return;
      const href = String(link.getAttribute('href') || '').trim();
      if (!href || href.startsWith('#') || href.startsWith('javascript:')) return;
      cleanupBeforeLeave();
    },
    true
  );
}

function bindBackButtonHomeRedirect() {
  try {
    if (!window.history.state?.__wingoBackGuard) {
      window.history.replaceState({ ...(window.history.state || {}), __wingoRoot: true }, '', window.location.href);
      window.history.pushState({ __wingoBackGuard: true }, '', window.location.href);
    }
  } catch {
    // ignore history API limitations
  }

  window.addEventListener('popstate', () => {
    goHomeWithReload();
  });
}

function updatePeriodName() {
  if (elements.timeLeftName) {
    elements.timeLeftName.textContent = state.game.label;
  }
  if (elements.popupTitle) {
    elements.popupTitle.textContent = state.game.label;
  }
  if (elements.bettingContainer) {
    elements.bettingContainer.setAttribute('typeid', String(state.game.typeId));
  }
}

function updatePeriodNumber(issueNumber) {
  if (elements.periodNumber) {
    elements.periodNumber.textContent = issueNumber || '-';
  }
}

function updateTimeDisplay(totalSeconds) {
  if (!elements.periodTime) return;
  const safeSeconds = Math.max(0, Number(totalSeconds) || 0);
  const minutes = Math.floor(safeSeconds / 60);
  const seconds = safeSeconds % 60;
  const timeDivs = elements.periodTime.querySelectorAll('div');
  if (timeDivs.length === 5) {
    timeDivs[0].textContent = String(Math.floor(minutes / 10));
    timeDivs[1].textContent = String(minutes % 10);
    timeDivs[3].textContent = String(Math.floor(seconds / 10));
    timeDivs[4].textContent = String(seconds % 10);
  }
}

function updateCountdownMark(totalSeconds) {
  if (!elements.bettingMark) return;
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  if (seconds > 0 && seconds <= 5) {
    elements.bettingMark.style.display = 'flex';
    elements.bettingMark.innerHTML = `
      <div data-v-4aca9bd1="">${Math.floor(seconds / 10)}</div>
      <div data-v-4aca9bd1="">${seconds % 10}</div>
    `;
  } else {
    elements.bettingMark.style.display = 'none';
  }
}

function playCountdownVoice(totalSeconds) {
  const seconds = Math.max(0, Number(totalSeconds) || 0);
  if (state.voiceDisabled || seconds > 5 || seconds < 1) {
    state.lastVoiceSecond = null;
    return;
  }
  if (state.lastVoiceSecond === seconds) return;
  state.lastVoiceSecond = seconds;

  const audio = seconds === 1 ? elements.voice2 : elements.voice1;
  if (!audio) return;
  try {
    audio.currentTime = 0;
    void audio.play();
  } catch {
    // autoplay may be blocked by browser policies
  }
}

function getSecondsLeft() {
  if (!state.round?.endAt) return 0;
  const now = Date.now() + state.serverOffsetMs;
  return Math.max(0, Math.ceil((new Date(state.round.endAt).getTime() - now) / 1000));
}

function showBetSuccess(message) {
  showToast(elements.betTextToast, elements.betTextToastValue, message || 'Bet succeed');
}

function showBetFailure(message) {
  showToast(elements.failToast, elements.failToastValue, message || 'Request failed');
}

function getPopupSelectionLabel(betType, selection) {
  if (betType === 'NUMBER') return String(selection);
  if (selection === 'VIOLET') return 'Violet';
  if (selection === 'GREEN') return 'Green';
  if (selection === 'RED') return 'Red';
  if (selection === 'BIG') return 'Big';
  return 'Small';
}

function setPopupSelection(betType, selection) {
  state.popup.betType = betType;
  state.popup.selection = String(selection);
  state.popup.label = getPopupSelectionLabel(betType, selection);

  const suffix = getPopupClassSuffix(betType, String(selection));
  if (elements.bettingPopup) {
    const classes = Array.from(elements.bettingPopup.classList).filter((name) => !/^Betting__Popup-\d+$/.test(name));
    elements.bettingPopup.className = `${classes.join(' ')} Betting__Popup-${suffix}`.trim();
  }

  if (elements.selectedNum) {
    const spans = elements.selectedNum.querySelectorAll('span');
    if (spans.length > 1) {
      spans[1].textContent = state.popup.label;
    }
  }
}

function updatePopupAmount() {
  const amount = (state.popup.stake || 0) * (state.popup.quantity || 0);
  if (elements.popupConfirmBtn) {
    elements.popupConfirmBtn.textContent = `Total amount ${formatMoney(amount)}`;
  }
}

function syncPopupQuantityInput() {
  if (!elements.popupInput) return;
  elements.popupInput.value = String(state.popup.quantity);
}

function setPopupQuantity(nextValue) {
  const quantity = Math.min(MAX_QTY, Math.max(1, Number(nextValue) || 1));
  state.popup.quantity = quantity;
  syncPopupQuantityInput();
  updatePopupAmount();
}

function setPopupStake(nextValue) {
  const stake = Math.max(1, Number(nextValue) || 1);
  state.popup.stake = stake;
  updatePopupAmount();
}

function closeBetPopup() {
  closeOverlay(elements);
}

function openBetPopup() {
  openOverlay(elements);
  updatePopupAmount();
}

function parseSelectionFromNumberItem(element) {
  const className = element?.className || '';
  const match = className.match(/item(\d)$/);
  return match ? match[1] : null;
}

function bindPopupSelectionHandlers() {
  if (elements.bettingOnGreen) {
    elements.bettingOnGreen.addEventListener('click', () => {
      setPopupSelection('COLOR', 'GREEN');
      openBetPopup();
    });
  }
  if (elements.bettingOnViolet) {
    elements.bettingOnViolet.addEventListener('click', () => {
      setPopupSelection('COLOR', 'VIOLET');
      openBetPopup();
    });
  }
  if (elements.bettingOnRed) {
    elements.bettingOnRed.addEventListener('click', () => {
      setPopupSelection('COLOR', 'RED');
      openBetPopup();
    });
  }

  if (elements.bettingOnBig) {
    elements.bettingOnBig.addEventListener('click', () => {
      setPopupSelection('SIZE', 'BIG');
      openBetPopup();
    });
  }

  if (elements.bettingOnSmall) {
    elements.bettingOnSmall.addEventListener('click', () => {
      setPopupSelection('SIZE', 'SMALL');
      openBetPopup();
    });
  }

  if (elements.bettingOnNumParent) {
    elements.bettingOnNumParent.addEventListener('click', (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (!target) return;
      const numberItem = target.closest('.Betting__C-numC > div');
      if (!numberItem) return;
      const number = parseSelectionFromNumberItem(numberItem);
      if (number == null) return;
      setPopupSelection('NUMBER', number);
      openBetPopup();
    });
  }
}

function getPopupAmountItems() {
  return (elements.popupAmountItems || []).filter((item) => /^\d+$/.test(item.textContent?.trim() || ''));
}

function getPopupQuantityItems() {
  return (elements.popupAmountItems || []).filter((item) => /^X\d+$/i.test(item.textContent?.trim() || ''));
}

function bindPopupAmountControls() {
  const amountItems = getPopupAmountItems();
  const quantityItems = getPopupQuantityItems();

  amountItems.forEach((item) => {
    item.addEventListener('click', () => {
      amountItems.forEach((entry) => entry.classList.remove('bgcolor'));
      item.classList.add('bgcolor');
      setPopupStake(Number(item.textContent?.trim() || 1));
    });
  });

  quantityItems.forEach((item) => {
    item.addEventListener('click', () => {
      quantityItems.forEach((entry) => entry.classList.remove('bgcolor'));
      item.classList.add('bgcolor');
      const quantity = Number(item.textContent?.trim().replace(/^X/i, '') || 1);
      setPopupQuantity(quantity);
    });
  });

  if (elements.popupInput) {
    elements.popupInput.addEventListener('input', () => {
      const onlyDigits = String(elements.popupInput.value || '').replace(/[^\d]/g, '').slice(0, 4);
      elements.popupInput.value = onlyDigits;
      quantityItems.forEach((item) => item.classList.remove('bgcolor'));
      setPopupQuantity(Number(onlyDigits || 1));
    });
  }

  const [minusBtn, plusBtn] = elements.popupStepButtons || [];
  if (minusBtn) {
    minusBtn.addEventListener('click', () => setPopupQuantity(state.popup.quantity - 1));
  }
  if (plusBtn) {
    plusBtn.addEventListener('click', () => setPopupQuantity(state.popup.quantity + 1));
  }
}

async function placeCurrentBet() {
  if (!state.round?.issueNumber) {
    showBetFailure('Round is not ready yet.');
    return;
  }

  if (!state.round.isBettingOpen) {
    showBetFailure('Betting is closed for this round.');
    return;
  }

  if (elements.popupAgree && !elements.popupAgree.classList.contains('active')) {
    showBetFailure('Please agree to pre-sale rules.');
    return;
  }

  const amount = (state.popup.stake || 0) * (state.popup.quantity || 0);
  if (amount <= 0) {
    showBetFailure('Invalid amount.');
    return;
  }

  try {
    const payload = {
      durationSec: state.game.durationSec,
      issueNumber: state.round.issueNumber,
      bets: [
        {
          betType: state.popup.betType,
          selection: state.popup.selection,
          amount
        }
      ]
    };

    const data = await submitBet(payload);
    if (data?.user?.balance !== undefined) {
      setWalletBalance(elements, data.user.balance);
    }

    rememberPendingSettlement(state.round.issueNumber, state.game.durationSec);
    showBetSuccess('Bet succeed');
    closeBetPopup();
    await syncCurrentRound();
  } catch (error) {
    const status = Number(error?.status || 0);
    if (status === 401) {
      showBetFailure('Please login first.');
      window.location.href = '/login';
      return;
    }
    showBetFailure(error?.message || 'Unable to place bet.');
    if (status === 409) {
      await syncCurrentRound();
    }
  }
}

function bindPopupActions() {
  if (elements.popupCancelBtn) {
    elements.popupCancelBtn.addEventListener('click', closeBetPopup);
  }

  if (elements.popupConfirmBtn) {
    elements.popupConfirmBtn.addEventListener('click', () => {
      void placeCurrentBet();
    });
  }

  if (elements.popupAgree) {
    elements.popupAgree.addEventListener('click', () => {
      elements.popupAgree.classList.toggle('active');
    });
  }
}

function bindRuleDialog() {
  if (elements.howtoBtn) {
    elements.howtoBtn.addEventListener('click', () => {
      if (elements.ruleDialog) elements.ruleDialog.style.display = '';
      if (elements.overlay) elements.overlay.style.display = '';
      document.body.classList.add('van-overflow-hidden');
    });
  }

  if (elements.ruleCloseBtn) {
    elements.ruleCloseBtn.addEventListener('click', () => {
      if (elements.ruleDialog) elements.ruleDialog.style.display = 'none';
      if (elements.overlay) elements.overlay.style.display = 'none';
      document.body.classList.remove('van-overflow-hidden');
    });
  }
}

function bindWinDialogControls() {
  if (elements.closeBtn) {
    elements.closeBtn.addEventListener('click', () => hideWinDialog(elements));
  }
}

function bindVoiceControls() {
  (elements.disableVoiceButtons || []).forEach((button) => {
    button.addEventListener('click', () => {
      state.voiceDisabled = !state.voiceDisabled;
      button.classList.toggle('active', state.voiceDisabled);
    });
  });
}

function bindGameTabs() {
  if (!elements.gameItems?.length) return;

  elements.gameItems.forEach((item, index) => {
    item.addEventListener('click', async () => {
      const game = getGameFromItemElement(item) || GAME_LIST[index] || GAME_LIST[0];

      state.game = game;
      setActiveGameItem(elements.gameItems, item);
      updatePeriodName();
      await syncCurrentRound(true);
    });
  });
}

function setRecordTab(tab) {
  state.recordTab = tab;
  const tabs = elements.recordNavItems || [];
  tabs.forEach((node, index) => {
    const isActive =
      (tab === 'game' && index === 0) ||
      (tab === 'chart' && index === 1) ||
      (tab === 'my' && index === 2);
    node.classList.toggle('active', isActive);
  });
  renderRecordSection();
}

function renderRecordSection() {
  if (state.recordTab === 'my') {
    renderRecordHead(elements.gameRecordHead, 'my');
    renderMyBetRows(elements.gameRecordBody, state.myBets);
    if (elements.gameRecordFoot) {
      elements.gameRecordFoot.style.display = 'none';
    }
    return;
  }

  renderRecordHead(elements.gameRecordHead, state.recordTab === 'chart' ? 'chart' : 'game');
  renderHistoryRows(elements.gameRecordBody, state.history);
  if (elements.gameRecordFoot) {
    elements.gameRecordFoot.style.display = '';
  }
}

function bindRecordTabs() {
  if (!elements.recordNavItems?.length) return;
  elements.recordNavItems.forEach((item, index) => {
    item.addEventListener('click', async () => {
      const tab = index === 2 ? 'my' : index === 1 ? 'chart' : 'game';
      setRecordTab(tab);
      if (tab === 'my') {
        await syncMyBets();
      }
    });
  });
}

function renderRoundClock() {
  if (!state.round) {
    updatePeriodNumber('-');
    updateTimeDisplay(0);
    updateCountdownMark(0);
    return;
  }

  updatePeriodNumber(state.round.issueNumber);
  const secondsLeft = getSecondsLeft();
  updateTimeDisplay(secondsLeft);
  updateCountdownMark(secondsLeft);
  playCountdownVoice(secondsLeft);
}

async function syncHistory() {
  const historyData = await getGameHistory(state.game.durationSec, 10);
  const rounds = Array.isArray(historyData?.rounds) ? historyData.rounds : [];
  state.history = rounds;
  renderTokenStrip(elements.tokenParent, rounds);
}

async function syncMyBets() {
  try {
    const myBetsData = await getMyBets(state.game.durationSec, 50);
    const bets = Array.isArray(myBetsData?.bets) ? myBetsData.bets : [];
    state.myBets = bets;
    if (state.recordTab === 'my') {
      renderRecordSection();
    }
  } catch {
    // no-op
  }
}

async function tryResolvePendingSettlement(issueNumber) {
  if (!issueNumber || !hasPendingSettlement(issueNumber, state.game.durationSec)) {
    return;
  }

  try {
    const myBetsData = await getMyBets(state.game.durationSec, 50);
    const bets = Array.isArray(myBetsData?.bets) ? myBetsData.bets : [];
    state.myBets = bets;
    const settled = bets.filter((bet) => bet.issueNumber === issueNumber && bet.status !== 'PENDING');
    if (!settled.length) return;

    const won = settled.filter((bet) => bet.status === 'WON');
    if (won.length > 0) {
      const totalWin = won.reduce((sum, item) => sum + (Number(item.winAmount) || 0), 0);
      const reference = won[0];
      showWinDialog(elements, {
        issueNumber,
        resultNumber: reference.resultNumber,
        resultColor: reference.resultColor,
        resultSize: reference.resultSize,
        winAmount: totalWin
      });
      window.setTimeout(() => hideWinDialog(elements), 3000);
    }

    clearPendingSettlement(issueNumber, state.game.durationSec);
    if (state.recordTab === 'my') {
      renderRecordSection();
    }
  } catch {
    // no-op
  }
}

async function syncCurrentRound(forceHistory = false) {
  const data = await getGameIssue({ durationSec: state.game.durationSec });
  const nextRound = data?.round || null;
  if (!nextRound) return;

  const previousIssue = state.round?.issueNumber || null;
  state.serverOffsetMs = new Date(data.serverTime).getTime() - Date.now();
  state.round = nextRound;

  if (data?.user?.balance !== undefined) {
    setWalletBalance(elements, data.user.balance);
  }

  renderRoundClock();

  const issueChanged = Boolean(previousIssue && previousIssue !== nextRound.issueNumber);
  if (forceHistory || !state.history.length || issueChanged) {
    await syncHistory();
  }
  if (state.recordTab === 'my') {
    await syncMyBets();
  }

  renderRecordSection();

  if (issueChanged) {
    await tryResolvePendingSettlement(previousIssue);
  }
}

function startClockLoop() {
  if (state.clockLoopStarted) return;
  state.clockLoopStarted = true;
  state.clockIntervalId = window.setInterval(() => {
    renderRoundClock();
    const secondsLeft = getSecondsLeft();
    if (secondsLeft === 0 && state.round && !state.awaitingRoundRefresh) {
      state.awaitingRoundRefresh = true;
      window.setTimeout(async () => {
        try {
          await syncCurrentRound(true);
        } catch {
          // no-op
        } finally {
          state.awaitingRoundRefresh = false;
        }
      }, 1200);
    }
  }, 250);
}

function startPolling() {
  if (state.pollingStarted) return;
  state.pollingStarted = true;
  let inFlight = false;
  state.pollingIntervalId = window.setInterval(async () => {
    if (inFlight) return;
    inFlight = true;
    try {
      await syncCurrentRound();
    } catch {
      // no-op
    } finally {
      inFlight = false;
    }
  }, 3000);
}

function startMyBetsPolling() {
  if (state.myBetsPollingStarted) return;
  state.myBetsPollingStarted = true;
  let inFlight = false;
  state.myBetsPollingIntervalId = window.setInterval(async () => {
    if (state.recordTab !== 'my') return;
    if (inFlight) return;
    inFlight = true;
    try {
      await syncMyBets();
    } catch {
      // no-op
    } finally {
      inFlight = false;
    }
  }, 5000);
}

function bindVisibilityRefresh() {
  const refresh = () => {
    setRootFontSize();
    startClockLoop();
    startPolling();
    startMyBetsPolling();
    void syncCurrentRound(true);
  };

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) return;
    refresh();
  });
  window.addEventListener('pageshow', () => {
    refresh();
  });
  window.addEventListener('focus', refresh);
}

async function initialize() {
  if (state.initialized) return;
  if (!elements.root) return;
  state.initialized = true;

  applyBranding();
  bindTopNavActions();
  bindResponsiveRoot();
  bindBackButtonHomeRedirect();
  bindVoiceControls();
  bindRuleDialog();
  bindPopupSelectionHandlers();
  bindPopupAmountControls();
  bindPopupActions();
  bindWinDialogControls();
  bindWalletActions();
  bindGameTabs();
  bindRecordTabs();
  bindVisibilityRefresh();

  updatePeriodName();
  setPopupSelection('COLOR', 'RED');
  setRecordTab('game');
  syncPopupQuantityInput();
  updatePopupAmount();
  setWalletBalance(elements, 0);

  try {
    await syncCurrentRound(true);
  } catch {
    // no-op
  }

  startClockLoop();
  startPolling();
  startMyBetsPolling();
}

function boot() {
  if (window.__WINGO_BOOTSTRAPPED__) return;
  window.__WINGO_BOOTSTRAPPED__ = true;
  void initialize();
}

if (document.readyState === 'loading') {
  window.addEventListener('DOMContentLoaded', boot, { once: true });
} else {
  boot();
}
