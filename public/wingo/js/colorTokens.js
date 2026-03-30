export function renderTokenStrip(tokenParent, rounds) {
  if (!tokenParent) return;
  const values = (rounds || [])
    .map((item) => Number(item?.resultNumber))
    .filter((value) => Number.isInteger(value) && value >= 0 && value <= 9)
    .slice(0, 5);

  if (!values.length) return;

  tokenParent.innerHTML = '';
  values.forEach((value) => {
    const div = document.createElement('div');
    div.setAttribute('data-v-3e4c6499', '');
    div.className = `n${value}`;
    tokenParent.appendChild(div);
  });
}

