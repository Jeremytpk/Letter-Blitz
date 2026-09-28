// Letter Blitz avatars — original characters drawn as inline SVG (100×100).
// Shown inside a round frame (.avatar), so shapes may run past the circle.
(() => {
  const bg = (color) => `<rect width="100" height="100" fill="${color}"/>`;
  const shoulders = (color) => `<path d="M14 100 Q18 78 50 77 Q82 78 86 100 Z" fill="${color}"/>`;
  const eye = (x, y, r = 2.8) =>
    `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 1.2}" fill="#1b1b24"/><circle cx="${x + r * 0.35}" cy="${y - r * 0.45}" r="${r * 0.35}" fill="#fff"/>`;
  const blush = (x, y) => `<circle cx="${x}" cy="${y}" r="3.4" fill="#ff6b81" opacity=".35"/>`;

  const AVATARS = [
    {
      id: 'zuri',
      name: { en: 'Zuri', fr: 'Zuri' },
      kind: { en: 'Human', fr: 'Humaine' },
      svg: `${bg('#ffb86b')}
        <circle cx="22" cy="24" r="13" fill="#2b1a12"/><circle cx="78" cy="24" r="13" fill="#2b1a12"/>
        <circle cx="50" cy="46" r="29" fill="#2b1a12"/>
        ${shoulders('#5b5bd6')}
        <rect x="43" y="66" width="14" height="14" fill="#6f4219"/>
        <ellipse cx="50" cy="53" rx="19" ry="21" fill="#8d5524"/>
        <path d="M30 47 Q50 20 70 47 Q62 36 50 36 Q38 36 30 47 Z" fill="#2b1a12"/>
        <circle cx="31" cy="61" r="3" fill="#ffd23f"/><circle cx="69" cy="61" r="3" fill="#ffd23f"/>
        ${eye(42, 54)}${eye(58, 54)}${blush(37, 61)}${blush(63, 61)}
        <path d="M43 64 Q50 70 57 64" stroke="#3b1d0e" stroke-width="2.4" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: 'kofi',
      name: { en: 'Kofi', fr: 'Kofi' },
      kind: { en: 'Human', fr: 'Humain' },
      svg: `${bg('#3a86ff')}
        ${shoulders('#ffd166')}
        <path d="M40 77 L50 86 L60 77 Z" fill="#e9b949"/>
        <rect x="43" y="66" width="14" height="14" fill="#a86b32"/>
        <circle cx="31" cy="55" r="4.5" fill="#b8793a"/><circle cx="69" cy="55" r="4.5" fill="#b8793a"/>
        <ellipse cx="50" cy="54" rx="19" ry="21" fill="#c68642"/>
        <path d="M31 55 Q32 79 50 80 Q68 79 69 55 Q64 69 50 70 Q36 69 31 55 Z" fill="#2b1a12"/>
        <path d="M44 65 Q50 70 56 65 Z" fill="#fff"/>
        <path d="M38 47 L45 46 M55 46 L62 47" stroke="#2b1a12" stroke-width="2.2" stroke-linecap="round"/>
        ${eye(42, 53)}${eye(58, 53)}
        <path d="M29 46 Q29 25 50 25 Q71 25 71 46 Z" fill="#e63946"/>
        <path d="M50 43 Q73 40 86 47 Q72 50 50 48 Z" fill="#b5222f"/>
        <circle cx="50" cy="26" r="2.2" fill="#b5222f"/>
        <path d="M40 30 Q50 27 60 30" stroke="#ff8a95" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: 'zog',
      name: { en: 'Zog', fr: 'Zog' },
      kind: { en: 'Alien', fr: 'Extraterrestre' },
      svg: `${bg('#7b2ff7')}
        <circle cx="18" cy="20" r="1.5" fill="#fff" opacity=".7"/><circle cx="84" cy="30" r="1.2" fill="#fff" opacity=".7"/><circle cx="12" cy="62" r="1" fill="#fff" opacity=".6"/>
        ${shoulders('#2d2d44')}
        <path d="M36 80 Q50 72 64 80" stroke="#7ee081" stroke-width="3" fill="none"/>
        <path d="M41 31 L31 12 M59 31 L69 12" stroke="#7ee081" stroke-width="3.5" stroke-linecap="round"/>
        <circle cx="31" cy="11" r="4.5" fill="#ffe66d"/><circle cx="69" cy="11" r="4.5" fill="#ffe66d"/>
        <path d="M24 48 Q24 26 50 26 Q76 26 76 48 Q76 70 50 76 Q24 70 24 48 Z" fill="#7ee081"/>
        <circle cx="33" cy="64" r="3" fill="#5ec26a"/><circle cx="68" cy="36" r="2.4" fill="#5ec26a"/>
        <ellipse cx="38" cy="52" rx="7" ry="8" fill="#fff"/><ellipse cx="62" cy="52" rx="7" ry="8" fill="#fff"/>
        <ellipse cx="50" cy="38" rx="5.5" ry="6" fill="#fff"/>
        <circle cx="39" cy="53" r="4" fill="#1b1b24"/><circle cx="61" cy="53" r="4" fill="#1b1b24"/><circle cx="50" cy="39" r="3" fill="#1b1b24"/>
        <circle cx="40.5" cy="51" r="1.3" fill="#fff"/><circle cx="62.5" cy="51" r="1.3" fill="#fff"/><circle cx="51" cy="37.5" r="1" fill="#fff"/>
        <ellipse cx="50" cy="66" rx="3.5" ry="2.4" fill="#2d6a4f"/>`,
    },
    {
      id: 'nova',
      name: { en: 'Nova', fr: 'Nova' },
      kind: { en: 'Cyborg', fr: 'Cyborg' },
      svg: `${bg('#1d3557')}
        <path d="M10 30 H22 V20 M90 70 H78 V80" stroke="#48cae4" stroke-width="1.5" fill="none" opacity=".5"/>
        ${shoulders('#0ea5e9')}
        <path d="M36 78 H64 V86 H36 Z" fill="#9aa5b5"/>
        <rect x="43" y="66" width="14" height="14" fill="#d9a066"/>
        <ellipse cx="50" cy="53" rx="19" ry="21" fill="#f1c27d"/>
        <path d="M50 32 A19 21 0 0 1 50 74 Z" fill="#9aa5b5"/>
        <path d="M50 44 H62 M56 44 V60 M50 60 H66" stroke="#6b7686" stroke-width="1.3" fill="none"/>
        <circle cx="64" cy="40" r="1.4" fill="#6b7686"/><circle cx="62" cy="68" r="1.4" fill="#6b7686"/>
        <path d="M30 50 Q28 27 52 28 L52 36 Q40 34 32 52 Z" fill="#23232f"/>
        <path d="M52 28 Q70 28 70 46 L64 40 Q60 33 52 34 Z" fill="#6b7686"/>
        ${eye(42, 53)}
        <circle cx="58" cy="53" r="8" fill="#ff3b3b" opacity=".25"/>
        <circle cx="58" cy="53" r="5" fill="#111"/><circle cx="58" cy="53" r="2.8" fill="#ff3b3b"/><circle cx="59" cy="52" r="1" fill="#ffd6d6"/>
        <path d="M43 65 H50" stroke="#8a4b2a" stroke-width="2.2" stroke-linecap="round"/>
        <path d="M52 63 H58 M52 66 H57" stroke="#48cae4" stroke-width="1.6" stroke-linecap="round"/>`,
    },
    {
      id: 'bolt',
      name: { en: 'Bolt', fr: 'Bolt' },
      kind: { en: 'Robot', fr: 'Robot' },
      svg: `${bg('#ffd166')}
        ${shoulders('#457b9d')}
        <circle cx="50" cy="90" r="4" fill="#80ffdb"/>
        <rect x="43" y="66" width="14" height="12" fill="#6c757d"/>
        <path d="M50 28 V15" stroke="#219ebc" stroke-width="3"/>
        <circle cx="50" cy="13" r="4.5" fill="#e63946"/>
        <rect x="18" y="42" width="8" height="16" rx="3" fill="#219ebc"/><rect x="74" y="42" width="8" height="16" rx="3" fill="#219ebc"/>
        <rect x="24" y="27" width="52" height="43" rx="11" fill="#8ecae6"/>
        <rect x="31" y="35" width="38" height="26" rx="7" fill="#023047"/>
        <rect x="37" y="41" width="7" height="9" rx="2" fill="#80ffdb"/><rect x="56" y="41" width="7" height="9" rx="2" fill="#80ffdb"/>
        <path d="M42 54 Q50 59 58 54" stroke="#80ffdb" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <circle cx="29" cy="31" r="1.5" fill="#219ebc"/><circle cx="71" cy="31" r="1.5" fill="#219ebc"/>
        <circle cx="29" cy="66" r="1.5" fill="#219ebc"/><circle cx="71" cy="66" r="1.5" fill="#219ebc"/>`,
    },
    {
      id: 'kitsu',
      name: { en: 'Kitsu', fr: 'Kitsu' },
      kind: { en: 'Fox', fr: 'Renard' },
      svg: `${bg('#90e0ef')}
        <path d="M14 100 Q20 76 50 75 Q80 76 86 100 Z" fill="#e36414"/>
        <path d="M34 100 Q50 82 66 100 Z" fill="#fff"/>
        <path d="M50 80 Q25 73 23 47 L27 18 L43 34 Q50 31 57 34 L73 18 L77 47 Q75 73 50 80 Z" fill="#f77f00"/>
        <path d="M29 26 L38 36 L30 41 Z M71 26 L62 36 L70 41 Z" fill="#3d2c1e"/>
        <path d="M50 80 Q35 74 31 57 Q42 62 50 55 Q58 62 69 57 Q65 74 50 80 Z" fill="#fff"/>
        <path d="M34 50 Q40 45 45 50" stroke="#1b1b24" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <path d="M55 50 Q60 45 66 50" stroke="#1b1b24" stroke-width="2.6" fill="none" stroke-linecap="round"/>
        <ellipse cx="50" cy="65" rx="4.5" ry="3.2" fill="#1b1b24"/>
        <path d="M46 71 Q50 74 54 71" stroke="#1b1b24" stroke-width="1.8" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: 'hoot',
      name: { en: 'Hoot', fr: 'Hoot' },
      kind: { en: 'Owl', fr: 'Hibou' },
      svg: `${bg('#2a9d8f')}
        <path d="M0 88 H100 V94 H0 Z" fill="#6d4c3d"/>
        <path d="M24 33 L28 16 L40 29 Z M76 33 L72 16 L60 29 Z" fill="#6f4e37"/>
        <ellipse cx="50" cy="58" rx="30" ry="33" fill="#8d6346"/>
        <ellipse cx="50" cy="75" rx="18" ry="16" fill="#e9c46a"/>
        <path d="M42 70 l3 3 l3 -3 M52 70 l3 3 l3 -3 M47 78 l3 3 l3 -3" stroke="#b08968" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <circle cx="38" cy="48" r="12" fill="#f1faee"/><circle cx="62" cy="48" r="12" fill="#f1faee"/>
        <circle cx="38" cy="48" r="8" fill="#ffb703"/><circle cx="62" cy="48" r="8" fill="#ffb703"/>
        <circle cx="38" cy="48" r="4.5" fill="#1b1b24"/><circle cx="62" cy="48" r="4.5" fill="#1b1b24"/>
        <circle cx="39.8" cy="46" r="1.6" fill="#fff"/><circle cx="63.8" cy="46" r="1.6" fill="#fff"/>
        <path d="M26 37 Q37 31 48 39 M74 37 Q63 31 52 39" stroke="#5c3d2e" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path d="M46 57 L54 57 L50 65 Z" fill="#fb8500"/>`,
    },
    {
      id: 'bamboo',
      name: { en: 'Bamboo', fr: 'Bambou' },
      kind: { en: 'Panda', fr: 'Panda' },
      svg: `${bg('#ff99c8')}
        ${shoulders('#23232f')}
        <circle cx="27" cy="29" r="10" fill="#23232f"/><circle cx="73" cy="29" r="10" fill="#23232f"/>
        <ellipse cx="50" cy="53" rx="28" ry="26" fill="#fff"/>
        <ellipse cx="38" cy="51" rx="7" ry="9.5" transform="rotate(-25 38 51)" fill="#23232f"/>
        <ellipse cx="62" cy="51" rx="7" ry="9.5" transform="rotate(25 62 51)" fill="#23232f"/>
        <circle cx="39" cy="50" r="2.8" fill="#fff"/><circle cx="61" cy="50" r="2.8" fill="#fff"/>
        <circle cx="39.5" cy="50.5" r="1.5" fill="#23232f"/><circle cx="60.5" cy="50.5" r="1.5" fill="#23232f"/>
        <ellipse cx="50" cy="61" rx="4.5" ry="3.2" fill="#23232f"/>
        <path d="M46 66 Q50 70 54 66" stroke="#23232f" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${blush(33, 62)}${blush(67, 62)}
        <path d="M66 22 Q76 12 86 16 Q78 24 66 22 Z" fill="#52b788"/><path d="M68 21 Q76 17 84 17" stroke="#2d6a4f" stroke-width="1" fill="none"/>`,
    },
    {
      id: 'felis',
      name: { en: 'Felis', fr: 'Félis' },
      kind: { en: 'Cat hybrid', fr: 'Hybride chat' },
      svg: `${bg('#ef476f')}
        <path d="M24 70 Q20 36 50 30 Q80 36 76 70 Z" fill="#3a0ca3"/>
        ${shoulders('#ffd166')}
        <path d="M27 38 L29 11 L46 28 Z M73 38 L71 11 L54 28 Z" fill="#3a0ca3"/>
        <path d="M31 30 L32 18 L41 27 Z M69 30 L68 18 L59 27 Z" fill="#f7a8c4"/>
        <rect x="43" y="66" width="14" height="14" fill="#f0c49c"/>
        <ellipse cx="50" cy="54" rx="19" ry="21" fill="#ffdbac"/>
        <path d="M31 50 Q33 30 50 32 Q67 30 69 50 Q61 39 55 44 Q50 36 45 44 Q39 39 31 50 Z" fill="#3a0ca3"/>
        <ellipse cx="42" cy="55" rx="3.8" ry="4.3" fill="#ffd60a"/><ellipse cx="58" cy="55" rx="3.8" ry="4.3" fill="#ffd60a"/>
        <ellipse cx="42" cy="55" rx="1.1" ry="3.6" fill="#1b1b24"/><ellipse cx="58" cy="55" rx="1.1" ry="3.6" fill="#1b1b24"/>
        <path d="M48 62 L52 62 L50 64.5 Z" fill="#f15b8a"/>
        <path d="M45.5 66 Q48 68.5 50 66 Q52 68.5 54.5 66" stroke="#8a4b2a" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M34 62 L24 60 M34 65 L24 66 M66 62 L76 60 M66 65 L76 66" stroke="#fff" stroke-width="1.2" stroke-linecap="round" opacity=".9"/>`,
    },
    {
      id: 'draco',
      name: { en: 'Draco', fr: 'Draco' },
      kind: { en: 'Dragon', fr: 'Dragon' },
      svg: `${bg('#fb5607')}
        <path d="M6 70 Q10 50 24 58 Q20 64 22 74 Z M94 70 Q90 50 76 58 Q80 64 78 74 Z" fill="#1a8f3c"/>
        <path d="M16 100 Q22 76 50 74 Q78 76 84 100 Z" fill="#1a8f3c"/>
        <path d="M40 100 Q50 80 60 100 Z" fill="#ffe8a3"/>
        <path d="M33 31 L22 9 L42 26 Z M67 31 L78 9 L58 26 Z" fill="#ffe8a3"/>
        <path d="M44 27 L50 16 L56 27 Z" fill="#1a8f3c"/>
        <ellipse cx="50" cy="47" rx="24" ry="21" fill="#2dc653"/>
        <ellipse cx="50" cy="64" rx="18" ry="13" fill="#52d67a"/>
        <ellipse cx="44" cy="61" rx="2.2" ry="1.6" fill="#145a2a"/><ellipse cx="56" cy="61" rx="2.2" ry="1.6" fill="#145a2a"/>
        <ellipse cx="39" cy="44" rx="5.5" ry="6.5" fill="#ffd60a"/><ellipse cx="61" cy="44" rx="5.5" ry="6.5" fill="#ffd60a"/>
        <ellipse cx="39" cy="44" rx="1.6" ry="5.5" fill="#1b1b24"/><ellipse cx="61" cy="44" rx="1.6" ry="5.5" fill="#1b1b24"/>
        <path d="M38 69 Q50 76 62 69" stroke="#145a2a" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M43 70.5 L45 75 L47 71.5 Z M53 71.5 L55 75 L57 70.5 Z" fill="#fff"/>`,
    },
    {
      id: 'inky',
      name: { en: 'Inky', fr: 'Inky' },
      kind: { en: 'Octopus', fr: 'Pieuvre' },
      svg: `${bg('#caffbf')}
        <circle cx="16" cy="30" r="3" fill="#fff" opacity=".8"/><circle cx="84" cy="22" r="4" fill="#fff" opacity=".8"/><circle cx="88" cy="40" r="2" fill="#fff" opacity=".8"/>
        <path d="M28 70 Q18 86 30 96 M40 74 Q34 92 46 100 M60 74 Q66 92 54 100 M72 70 Q82 86 70 96" stroke="#ff5d8f" stroke-width="9" fill="none" stroke-linecap="round"/>
        <path d="M24 58 Q22 20 50 18 Q78 20 76 58 Q76 76 50 76 Q24 76 24 58 Z" fill="#ff5d8f"/>
        <circle cx="36" cy="31" r="3.5" fill="#ff8fab"/><circle cx="62" cy="26" r="2.5" fill="#ff8fab"/><circle cx="66" cy="36" r="4" fill="#ff8fab"/>
        <ellipse cx="40" cy="52" rx="6.5" ry="7.5" fill="#fff"/><ellipse cx="60" cy="52" rx="6.5" ry="7.5" fill="#fff"/>
        <circle cx="41" cy="53" r="3.8" fill="#1b1b24"/><circle cx="59" cy="53" r="3.8" fill="#1b1b24"/>
        <circle cx="42.4" cy="51.3" r="1.3" fill="#fff"/><circle cx="60.4" cy="51.3" r="1.3" fill="#fff"/>
        ${blush(31, 62)}${blush(69, 62)}
        <path d="M44 64 Q50 70 56 64" stroke="#9d174d" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: 'yeti',
      name: { en: 'Yeti', fr: 'Yéti' },
      kind: { en: 'Yeti', fr: 'Yéti' },
      svg: `${bg('#adb5bd')}
        <circle cx="20" cy="18" r="2" fill="#fff"/><circle cx="82" cy="14" r="1.6" fill="#fff"/><circle cx="88" cy="52" r="2" fill="#fff"/><circle cx="10" cy="48" r="1.6" fill="#fff"/>
        <path d="M14 100 L18 84 L28 90 L34 80 L50 86 L66 80 L72 90 L82 84 L86 100 Z" fill="#f8f9fa"/>
        <path d="M50 14 L58 20 L66 15 L70 24 L80 23 L78 33 L87 39 L80 47 L86 57 L78 63 L80 75 L68 77 L62 86 L50 82 L38 86 L32 77 L20 75 L22 63 L14 57 L20 47 L13 39 L22 33 L20 23 L30 24 L34 15 L42 20 Z" fill="#f8f9fa"/>
        <ellipse cx="50" cy="56" rx="18" ry="17" fill="#a5d8ff"/>
        <path d="M37 45 L46 48 M63 45 L54 48" stroke="#4a6a8a" stroke-width="2.4" stroke-linecap="round"/>
        ${eye(42, 53)}${eye(58, 53)}
        <path d="M39 61 Q50 73 61 61 Z" fill="#1b1b24"/>
        <path d="M42 61.5 L44 66 L46 62 Z M54 62 L56 66 L58 61.5 Z" fill="#fff"/>`,
    },
  ];

  const byId = new Map(AVATARS.map((a) => [a.id, a]));

  // Markup for an avatar in a round frame; unknown ids fall back to initials.
  function avatarHTML(id, fallbackName = '?') {
    const a = byId.get(id);
    if (!a) {
      const initials = String(fallbackName).trim().slice(0, 2).toUpperCase();
      return `<span class="avatar avatar-initials" aria-hidden="true">${initials.replace(/[<>&"]/g, '')}</span>`;
    }
    return `<span class="avatar" aria-hidden="true"><svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${a.svg}</svg></span>`;
  }

  window.AVATARS = AVATARS;
  window.avatarHTML = avatarHTML;
})();
