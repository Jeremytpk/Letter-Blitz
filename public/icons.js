// Letter Blitz icons — flat, chunky shapes in the same palette as the avatars
// (public/avatars.js). icon(name) returns inline SVG; elements with
// data-icon="name" in the page are filled in automatically.
(() => {
  const DARK = '#1b1b24';
  const shine = (x, y, r = 1.3) => `<circle cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".75"/>`;
  const face = (x, y, color) =>
    `<circle cx="${x}" cy="${y}" r="5.6" fill="${color}"/>` +
    `<circle cx="${x - 2}" cy="${y - 0.6}" r="1" fill="${DARK}"/><circle cx="${x + 2}" cy="${y - 0.6}" r="1" fill="${DARK}"/>` +
    `<path d="M${x - 1.8} ${y + 2} Q${x} ${y + 3.6} ${x + 1.8} ${y + 2}" stroke="${DARK}" stroke-width="1.1" fill="none" stroke-linecap="round"/>`;
  const medal = (fill, inner, n) => `
    <path d="M8 2 H14 L18.5 13 H12.5 Z" fill="#3a86ff"/>
    <path d="M24 2 H18 L13.5 13 H19.5 Z" fill="#e63946"/>
    <circle cx="16" cy="20.5" r="9" fill="${fill}"/>
    <circle cx="16" cy="20.5" r="6.4" fill="${inner}"/>
    <text x="16" y="24" text-anchor="middle" font-family="Unbounded, system-ui, sans-serif" font-weight="800" font-size="9.5" fill="${DARK}">${n}</text>
    ${shine(11.5, 16.5, 1.5)}`;

  const ICONS = {
    crown: `
      <rect x="6" y="22" width="20" height="5.5" rx="1.8" fill="#e9b949"/>
      <path d="M5 11 L10.5 18 L16 7.5 L21.5 18 L27 11 L25.5 23 H6.5 Z" fill="#ffd166"/>
      <circle cx="5" cy="10.5" r="2.3" fill="#ffd166"/><circle cx="16" cy="6.5" r="2.5" fill="#ffd166"/><circle cx="27" cy="10.5" r="2.3" fill="#ffd166"/>
      <circle cx="16" cy="24.7" r="1.7" fill="#e63946"/><circle cx="10.5" cy="24.7" r="1.3" fill="#4fd1c5"/><circle cx="21.5" cy="24.7" r="1.3" fill="#4fd1c5"/>
      ${shine(11, 17.5, 1.1)}`,
    trophy: `
      <path d="M9.5 7 H5.5 Q5 14 11 14.5 M22.5 7 H26.5 Q27 14 21 14.5" stroke="#e9b949" stroke-width="2.4" fill="none" stroke-linecap="round"/>
      <path d="M9 4.5 H23 V11.5 Q23 19 16 19 Q9 19 9 11.5 Z" fill="#ffd166"/>
      <rect x="14" y="18.5" width="4" height="4" fill="#e9b949"/>
      <rect x="9" y="22" width="14" height="6" rx="1.8" fill="#8d6346"/>
      <rect x="12" y="23.9" width="8" height="2" rx="1" fill="#ffd166"/>
      <path d="M16 7.5 L17.2 10 L19.8 10.3 L17.9 12.1 L18.4 14.7 L16 13.4 L13.6 14.7 L14.1 12.1 L12.2 10.3 L14.8 10 Z" fill="#fff" opacity=".9"/>
      ${shine(11.5, 7.5, 1.1)}`,
    'medal-1': medal('#ffd166', '#ffe8a3', 1),
    'medal-2': medal('#adb5bd', '#e9ecef', 2),
    'medal-3': medal('#e59866', '#f5c29a', 3),
    players: `
      <path d="M14 30 Q15 19.5 21.5 19.5 Q28 19.5 29 30 Z" fill="#7b2ff7"/>
      ${face(21.5, 12, '#7ee081')}
      <path d="M2 31 Q3 21.5 10.5 21.5 Q18 21.5 19 31 Z" fill="#3a86ff"/>
      ${face(10.5, 14.5, '#ff99c8')}`,
    tie: `
      <path d="M1 31 Q2 21 9.5 21 Q17 21 18 31 Z" fill="#3a86ff"/>
      <path d="M14 31 Q15 21 22.5 21 Q30 21 31 31 Z" fill="#fb5607"/>
      ${face(9.5, 13, '#ffd166')}${face(22.5, 13, '#7ee081')}
      <path d="M13.5 5 H18.5 M13.5 8 H18.5" stroke="#e63946" stroke-width="2" stroke-linecap="round"/>`,
    link: `
      <g transform="rotate(-45 16 16)">
        <rect x="2.5" y="11" width="15" height="10" rx="5" fill="none" stroke="#3a86ff" stroke-width="3.6"/>
        <rect x="14.5" y="11" width="15" height="10" rx="5" fill="none" stroke="#ff5d8f" stroke-width="3.6"/>
      </g>`,
    stopwatch: `
      <rect x="13" y="2.5" width="6" height="3.6" rx="1.3" fill="#e63946"/>
      <rect x="15" y="5.5" width="2" height="3" fill="#e63946"/>
      <rect x="23.2" y="6.2" width="4" height="3" rx="1" transform="rotate(45 25.2 7.7)" fill="#e63946"/>
      <circle cx="16" cy="18.5" r="11" fill="#ff5d8f"/>
      <circle cx="16" cy="18.5" r="8" fill="#fff"/>
      <path d="M16 18.5 V13 M16 18.5 L19.6 20.6" stroke="${DARK}" stroke-width="2" stroke-linecap="round"/>
      <circle cx="16" cy="18.5" r="1.4" fill="${DARK}"/>
      ${shine(9.5, 12.5, 1.3)}`,
    closed: `
      <path d="M10 14 V10.5 Q10 4 16 4 Q22 4 22 10.5 V14" stroke="#adb5bd" stroke-width="3.6" fill="none" stroke-linecap="round"/>
      <rect x="5.5" y="13" width="21" height="16.5" rx="4.5" fill="#ffd166"/>
      <rect x="5.5" y="24.5" width="21" height="5" rx="2.5" fill="#e9b949"/>
      <circle cx="12.3" cy="19.6" r="1.3" fill="${DARK}"/><circle cx="19.7" cy="19.6" r="1.3" fill="${DARK}"/>
      <path d="M13.2 24.6 Q16 22.4 18.8 24.6" stroke="${DARK}" stroke-width="1.4" fill="none" stroke-linecap="round"/>
      <circle cx="10" cy="22.4" r="1.5" fill="#ff6b81" opacity=".45"/><circle cx="22" cy="22.4" r="1.5" fill="#ff6b81" opacity=".45"/>
      ${shine(9.2, 16.3, 1.2)}`,
    'arrow-right': `<path d="M6 16 H25 M18 9 L25 16 L18 23" stroke="currentColor" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
    'arrow-left': `<path d="M26 16 H7 M14 9 L7 16 L14 23" stroke="currentColor" stroke-width="3.6" fill="none" stroke-linecap="round" stroke-linejoin="round"/>`,
  };

  function icon(name, extraClass = '') {
    const body = ICONS[name];
    if (!body) return '';
    return `<svg class="icon icon-${name}${extraClass ? ' ' + extraClass : ''}" viewBox="0 0 32 32" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg">${body}</svg>`;
  }

  function fillIcons(root = document) {
    for (const el of root.querySelectorAll('[data-icon]')) el.innerHTML = icon(el.dataset.icon);
  }

  window.icon = icon;
  fillIcons();
})();
