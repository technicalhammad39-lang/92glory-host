export const GAME_LIST = [
  { label: 'Win Go 30s', typeId: 30, durationSec: 30 },
  { label: 'Win Go 1Min', typeId: 1, durationSec: 60 },
  { label: 'Win Go 3Min', typeId: 2, durationSec: 180 },
  { label: 'Win Go 5Min', typeId: 3, durationSec: 300 }
];

const GAME_BY_LABEL = new Map(GAME_LIST.map((game) => [normalizeText(game.label), game]));
const GAME_BY_COMPACT_LABEL = new Map(
  GAME_LIST.map((game) => [compactText(game.label), game])
);

export function normalizeText(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

export function compactText(value) {
  return normalizeText(value).replace(/\s+/g, '');
}

export function resolveGameFromLabel(rawLabel) {
  const normalized = normalizeText(rawLabel);
  const compact = compactText(rawLabel);
  return GAME_BY_LABEL.get(normalized) || GAME_BY_COMPACT_LABEL.get(compact) || null;
}

export function getGameByDuration(durationSec) {
  return GAME_LIST.find((game) => game.durationSec === Number(durationSec)) || GAME_LIST[0];
}

export function parseColors(value) {
  return String(value || '')
    .split(',')
    .map((item) => item.trim().toUpperCase())
    .filter(Boolean);
}

export function getResultMeta(resultNumber, resultColor, resultSize) {
  const number = Number(resultNumber);
  const colors = parseColors(resultColor);
  const size = String(resultSize || (number >= 5 ? 'BIG' : 'SMALL')).toUpperCase();

  let numberClass = 'defaultColor';
  if (number === 0) {
    numberClass = 'mixedColor0';
  } else if (number === 5) {
    numberClass = 'mixedColor5';
  } else if (colors.includes('GREEN') && !colors.includes('RED')) {
    numberClass = 'greenColor';
  }

  let typeClass = 'type4';
  let colorText = 'Red';
  if (number === 0) {
    typeClass = 'type0';
    colorText = 'Red Violet';
  } else if (number === 5) {
    typeClass = 'type5';
    colorText = 'Green Violet';
  } else if (colors.includes('GREEN')) {
    typeClass = 'type3';
    colorText = 'Green';
  }

  return {
    number,
    size: size === 'BIG' ? 'Big' : 'Small',
    colors,
    numberClass,
    typeClass,
    colorText
  };
}

export function formatMoney(value) {
  const amount = Number(value) || 0;
  return `Rs ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}
