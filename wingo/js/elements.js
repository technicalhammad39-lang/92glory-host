export function getElements() {
  const root = document.querySelector('.WinGo__C');
  const scope = root || document;
  const query = (selector) => scope.querySelector(selector) || document.querySelector(selector);
  const queryAll = (selector) => Array.from(scope.querySelectorAll(selector));

  const bettingDialog = query('div[role="dialog"][data-v-7f36fe93]');
  const bettingPopup = bettingDialog ? bettingDialog.querySelector('[class^="Betting__Popup-"]') : null;

  return {
    root,
    gameListContainer: query('.GameList__C'),
    gameItems: queryAll('.GameList__C-item'),
    timeLeftName: query('.TimeLeft__C-name'),
    periodNumber: query('.TimeLeft__C-id'),
    periodTime: query('.TimeLeft__C-time'),
    tokenParent: query('.TimeLeft__C-num'),
    bettingMark: query('.Betting__C-mark'),
    bettingContainer: query('.Betting__C'),
    walletBalance: query('.Wallet__C-balance-l1 > div[data-v-7dd1adab]'),
    walletActionButtons: queryAll('.Wallet__C-balance-l3 > div'),

    bettingOnRed: query('.Betting__C-head-r'),
    bettingOnViolet: query('.Betting__C-head-p'),
    bettingOnGreen: query('.Betting__C-head-g'),
    bettingOnNumParent: query('.Betting__C-numC'),
    bettingOnBig: query('.Betting__C-foot-b'),
    bettingOnSmall: query('.Betting__C-foot-s'),

    overlay: query('.van-overlay[data-v-7f36fe93]'),
    dialogDiv: bettingDialog,
    bettingPopup,
    selectedNum: query('.Betting__Popup-head-selectName'),
    popupTitle: query('.Betting__Popup-head-title'),
    popupInput: query('input[id^="van-field-"][id$="-input"]'),
    popupConfirmBtn: query('.Betting__Popup-foot-s'),
    popupCancelBtn: query('.Betting__Popup-foot-c'),
    popupAgree: query('.Betting__Popup-agree'),
    popupAmountItems: queryAll('.Betting__Popup-body-line-item'),
    popupStepButtons: queryAll('.Betting__Popup-btn'),

    gameRecordBody: query('.GameRecord__C-body'),
    gameRecordHead: query('.GameRecord__C-head .van-row'),
    gameRecordFoot: query('.GameRecord__C-foot'),
    recordNavItems: queryAll('.RecordNav__C > div'),

    howtoBtn: query('.TimeLeft__C-rule'),
    ruleDialog: query("div[role='dialog'][data-v-0bba67ea]"),
    ruleCloseBtn: query('.TimeLeft__C-PreSale-foot-btn'),

    betTextToast: query('.van-toast--text'),
    betTextToastValue: query('.van-toast--text .van-toast__text'),
    failToast: query('.van-toast--fail'),
    failToastValue: query('.van-toast--fail .van-toast__text'),

    winDialog: query('.WinningTip__C'),
    winBonus: query('.bonus'),
    winDetail: query('.gameDetail'),
    winningNum: query('.WinningNum'),
    colorType: query('.WinningTip__C-body-l2'),
    winColor: query('.WinningTip__C-body-l2 > div:nth-child(1)'),
    winSmallBig: query('.WinningTip__C-body-l2 > div:nth-child(3)'),
    closeBtn: query('.closeBtn'),
    sec3Btn: query('.acitveBtn'),

    disableVoiceButtons: queryAll('.disableVoice'),
    voice1: document.getElementById('voice1'),
    voice2: document.getElementById('voice2')
  };
}
