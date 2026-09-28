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
      id: 'Titina',
      name: { en: 'Titina', fr: 'Titina' },
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
      id: 'Tpk',
      name: { en: 'Tpk', fr: 'Tpk' },
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
      id: 'Liango',
      name: { en: 'Liango', fr: 'Liango' },
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
    // ---- Page 2: cars, nature, places, money, careers and fun stuff ----
    {
      id: 'turbo',
      name: { en: 'Turbo', fr: 'Turbo' },
      kind: { en: 'Sports car', fr: 'Voiture de sport' },
      svg: `${bg('#264653')}
        <rect y="74" width="100" height="26" fill="#1d3a44"/>
        <path d="M0 90 H100" stroke="#e9c46a" stroke-width="2.6" stroke-dasharray="9 7"/>
        <g transform="translate(6 7) scale(.86)">
        <path d="M2 56 H12 M5 63 H14 M1 49 H9" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".55"/>
        <path d="M10 49 H24 L24 53 H13 Z" fill="#b5222f"/><path d="M18 53 V58" stroke="#b5222f" stroke-width="2.5"/>
        <path d="M14 67 Q15 56 29 54 L40 44 Q46 39 58 39 L66 39 Q75 40 81 49 L89 53 Q95 55 95 63 L95 69 Q95 73 91 73 L18 73 Q14 73 14 67 Z" fill="#e63946"/>
        <path d="M42 47 Q47 43 56 43 L64 43 Q70 44 75 51 L39 51 Z" fill="#a8dadc"/>
        <path d="M58 43 V51" stroke="#e63946" stroke-width="2.2"/>
        <path d="M20 61 H91" stroke="#fff" stroke-width="3" stroke-linecap="round"/>
        <ellipse cx="88" cy="58" rx="4" ry="3.2" fill="#fff"/><circle cx="89" cy="58" r="1.8" fill="#1b1b24"/>
        <path d="M80 66 Q84 68 88 66" stroke="#1b1b24" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <circle cx="31" cy="73" r="9.5" fill="#1b1b24"/><circle cx="31" cy="73" r="4.2" fill="#adb5bd"/>
        <circle cx="76" cy="73" r="9.5" fill="#1b1b24"/><circle cx="76" cy="73" r="4.2" fill="#adb5bd"/>
        <ellipse cx="50" cy="56" rx="9" ry="1.6" fill="#fff" opacity=".35"/>
        </g>`,
    },
    {
      id: 'gym',
      name: { en: 'Gym', fr: 'Gym' },
      kind: { en: 'Gym', fr: 'Salle de sport' },
      svg: `${bg('#06d6a0')}
        <g opacity=".35"><rect x="10" y="17" width="16" height="3" rx="1.5" fill="#1b1b24"/><rect x="8" y="13" width="4" height="11" rx="1.5" fill="#1b1b24"/><rect x="24" y="13" width="4" height="11" rx="1.5" fill="#1b1b24"/></g>
        <path d="M80 14 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2 Z" fill="#fff" opacity=".8"/>
        <path d="M34 50 Q32 24 50 24 Q68 24 66 50" stroke="#2b2d42" stroke-width="8" fill="none" stroke-linecap="round"/>
        <circle cx="50" cy="64" r="24" fill="#2b2d42"/>
        <rect x="32" y="82" width="36" height="8" rx="3" fill="#2b2d42"/>
        <path d="M27 54 Q50 47 73 54 L73 60 Q50 53 27 60 Z" fill="#e63946"/>
        <path d="M72 55 Q80 54 83 60 Q78 58 74 60 Z M72 57 Q79 60 80 67 Q76 63 73 62 Z" fill="#e63946"/>
        <ellipse cx="43" cy="66" rx="3.4" ry="3.8" fill="#fff"/><ellipse cx="57" cy="66" rx="3.4" ry="3.8" fill="#fff"/>
        <circle cx="43.6" cy="66.6" r="1.9" fill="#1b1b24"/><circle cx="57.6" cy="66.6" r="1.9" fill="#1b1b24"/>
        <path d="M44 74 Q50 79 56 74" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        <text x="50" y="88.6" text-anchor="middle" font-family="Unbounded, system-ui, sans-serif" font-weight="800" font-size="6.5" fill="#06d6a0">16 KG</text>
        <path d="M78 36 Q74 42 78 45 Q82 42 78 36 Z" fill="#4cc9f0"/>
        <circle cx="38" cy="50" r="2.2" fill="#fff" opacity=".35"/>`,
    },
    {
      id: 'bloom',
      name: { en: 'Bloom', fr: 'Bloom' },
      kind: { en: 'Flower', fr: 'Fleur' },
      svg: `${bg('#cdb4db')}
        <path d="M50 64 V100" stroke="#52b788" stroke-width="5"/>
        <path d="M50 86 Q36 76 30 86 Q40 94 50 89 Z M50 80 Q64 70 70 79 Q60 88 50 83 Z" fill="#52b788"/>
        ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="50" cy="23" rx="6.5" ry="12.5" fill="${i % 2 ? '#ffb703' : '#ffd166'}" transform="rotate(${i * 30} 50 43)"/>`).join('')}
        <circle cx="50" cy="43" r="14.5" fill="#6f4e37"/>
        <circle cx="45" cy="41" r="2.3" fill="#1b1b24"/><circle cx="55" cy="41" r="2.3" fill="#1b1b24"/>
        <circle cx="45.8" cy="40.2" r=".8" fill="#fff"/><circle cx="55.8" cy="40.2" r=".8" fill="#fff"/>
        <path d="M44.5 47 Q50 52 55.5 47" stroke="#ffd166" stroke-width="2" fill="none" stroke-linecap="round"/>
        ${blush(41, 46)}${blush(59, 46)}`,
    },
    {
      id: 'summit',
      name: { en: 'Summit', fr: 'Sommet' },
      kind: { en: 'Landscape', fr: 'Paysage' },
      svg: `${bg('#ffb4a2')}
        <circle cx="66" cy="38" r="14" fill="#ffe8a3"/>
        <path d="M61.5 37 Q63 35.5 64.5 37 M67.5 37 Q69 35.5 70.5 37" stroke="#e76f51" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M62 41.5 Q66 44.5 70 41.5" stroke="#e76f51" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <ellipse cx="24" cy="26" rx="10" ry="3.5" fill="#fff" opacity=".7"/><ellipse cx="84" cy="18" rx="8" ry="3" fill="#fff" opacity=".7"/>
        <path d="M16 20 q3 -3 6 0 q3 -3 6 0 M80 30 q2.5 -2.5 5 0 q2.5 -2.5 5 0" stroke="#6d597a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
        <path d="M0 70 L22 46 L40 62 L58 42 L80 60 L100 46 V100 H0 Z" fill="#b5838d"/>
        <path d="M0 82 L30 50 L52 76 L72 56 L100 84 V100 H0 Z" fill="#6d597a"/>
        <path d="M30 50 L24 57 L28 56 L31 60 L34 56 L37 57 Z M72 56 L67 62 L71 61 L73 64 L76 61 L78 62 Z" fill="#fff"/>
        <path d="M0 91 Q50 85 100 91 V100 H0 Z" fill="#4a4e69"/>
        <path d="M22 94 H34 M60 93 H76" stroke="#ffe8a3" stroke-width="1.5" stroke-linecap="round" opacity=".6"/>`,
    },
    {
      id: 'marina',
      name: { en: 'Marina', fr: 'Marina' },
      kind: { en: 'Yacht', fr: 'Yacht' },
      svg: `${bg('#48cae4')}
        <circle cx="20" cy="20" r="8" fill="#ffe66d"/>
        <path d="M72 22 q3 -3 6 0 q3 -3 6 0" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
        <path d="M52 46 V30" stroke="#6c757d" stroke-width="1.6"/><path d="M52 30 L63 33.5 L52 37 Z" fill="#e63946"/>
        <path d="M40 55 L43 46 L61 46 L64 55 Z" fill="#fff"/>
        <rect x="45" y="48.5" width="13" height="3.2" rx="1.6" fill="#023e8a"/>
        <path d="M28 67 L33 54 L68 54 L75 67 Z" fill="#f1faee"/>
        <rect x="37" y="57" width="8" height="5" rx="2" fill="#023e8a"/><rect x="49" y="57" width="8" height="5" rx="2" fill="#023e8a"/><rect x="61" y="57" width="6" height="5" rx="2" fill="#023e8a"/>
        <path d="M12 66 L90 66 L80 79 L22 79 Z" fill="#fff"/>
        <path d="M17 72 H85" stroke="#023e8a" stroke-width="3"/>
        <circle cx="30" cy="76" r="1.4" fill="#023e8a"/><circle cx="38" cy="76" r="1.4" fill="#023e8a"/>
        <path d="M0 78 Q12 74 25 78 T50 78 T75 78 T100 78 V100 H0 Z" fill="#0077b6"/>
        <path d="M8 86 q6 -3 12 0 M40 90 q6 -3 12 0 M70 86 q6 -3 12 0" stroke="#90e0ef" stroke-width="2" fill="none" stroke-linecap="round"/>
        <path d="M86 80 q5 2 10 0" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: 'cash',
      name: { en: 'Cash', fr: 'Cash' },
      kind: { en: 'Money', fr: 'Argent' },
      svg: `${bg('#2d6a4f')}
        <rect x="60" y="70" width="28" height="15" rx="2" transform="rotate(-18 74 77)" fill="#95d5b2"/>
        <circle cx="74" cy="77" r="4" fill="#52b788"/>
        ${[0, 1, 2, 3].map((i) => `<ellipse cx="21" cy="${88 - i * 6}" rx="12" ry="4" fill="#e9b949"/><ellipse cx="21" cy="${86.5 - i * 6}" rx="12" ry="4" fill="#ffd166"/>`).join('')}
        <path d="M42 26 L38 15 L46 19 L50 12 L54 19 L62 15 L58 26 Z" fill="#e9c46a"/>
        <path d="M50 29 Q33 33 30 60 Q28 87 50 88 Q72 87 70 60 Q67 33 50 29 Z" fill="#e9c46a"/>
        <path d="M40 29 Q50 35 60 29 L58 25 Q50 29 42 25 Z" fill="#bc8a3c"/>
        <text x="50" y="80" text-anchor="middle" font-family="Unbounded, system-ui, sans-serif" font-weight="800" font-size="17" fill="#2d6a4f">$</text>
        ${eye(44, 54, 2.4)}${eye(56, 54, 2.4)}
        <path d="M45 60 Q50 64 55 60" stroke="#1b1b24" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        ${blush(39, 60)}${blush(61, 60)}
        <circle cx="38" cy="40" r="2" fill="#fff" opacity=".6"/>`,
    },
    {
      id: 'doc',
      name: { en: 'Doc', fr: 'Doc' },
      kind: { en: 'Doctor', fr: 'Médecin' },
      svg: `${bg('#e0fbfc')}
        <path d="M24 80 H30 V86 H36 V92 H30 V98 H24 V92 H18 V86 H24 Z" fill="#e63946" opacity=".25"/>
        ${shoulders('#f8f9fa')}
        <path d="M40 77 L50 92 L60 77 Z" fill="#48cae4"/>
        <path d="M37 80 Q35 95 46 95" stroke="#1b1b24" stroke-width="2" fill="none"/><circle cx="47" cy="95" r="3.2" fill="#adb5bd"/>
        <rect x="43" y="66" width="14" height="13" fill="#c68b59"/>
        <path d="M29 56 Q27 26 50 26 Q73 26 71 56 L66 64 L34 64 Z" fill="#3d2c1e"/>
        <ellipse cx="50" cy="54" rx="18" ry="20" fill="#e0ac69"/>
        <path d="M32 48 Q34 32 50 34 Q66 32 68 48 Q60 40 50 41 Q40 40 32 48 Z" fill="#3d2c1e"/>
        <path d="M31 38 Q50 30 69 38" stroke="#adb5bd" stroke-width="2.2" fill="none"/>
        <circle cx="50" cy="31" r="6" fill="#ced4da"/><circle cx="50" cy="31" r="3" fill="#fff"/>
        ${eye(43, 54)}${eye(57, 54)}${blush(38, 61)}${blush(62, 61)}
        <path d="M44 63 Q50 68 56 63" stroke="#8a4b2a" stroke-width="2.2" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: 'soccer',
      name: { en: 'Goal', fr: 'Goal' },
      kind: { en: 'Soccer ball', fr: 'Ballon de foot' },
      svg: (() => {
        const cx = 50, cy = 50, R = 27;
        const pt = (r, deg) => {
          const a = (deg * Math.PI) / 180;
          return `${(cx + r * Math.cos(a)).toFixed(2)} ${(cy + r * Math.sin(a)).toFixed(2)}`;
        };
        const centre = [0, 1, 2, 3, 4].map((i) => pt(11, -90 + i * 72)).join(' L ');
        const patches = [0, 1, 2, 3, 4]
          .map((i) => {
            const t = -54 + i * 72; // between two centre corners
            return `<path d="M ${pt(R, t - 17)} L ${pt(22.5, t - 13)} L ${pt(20, t)} L ${pt(22.5, t + 13)} L ${pt(R, t + 17)} A ${R} ${R} 0 0 0 ${pt(R, t - 17)} Z" fill="#1b1b24"/>`;
          })
          .join('');
        const seams = [0, 1, 2, 3, 4]
          // one seam from each centre corner out to the edge, between two patches
          .map((i) => `M ${pt(11, -90 + i * 72)} L ${pt(R, -90 + i * 72)}`)
          .join(' ');
        return `${bg('#52b788')}
          <rect x="0" y="0" width="12" height="100" fill="#40916c"/><rect x="24" y="0" width="12" height="100" fill="#40916c"/><rect x="48" y="0" width="12" height="100" fill="#40916c"/><rect x="72" y="0" width="12" height="100" fill="#40916c"/>
          <path d="M0 88 H100" stroke="#fff" stroke-width="2" opacity=".7"/>
          <ellipse cx="50" cy="84" rx="22" ry="4" fill="#1b1b24" opacity=".25"/>
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="#fff"/>
          ${patches}
          <path d="${seams}" stroke="#adb5bd" stroke-width="1.6" fill="none"/>
          <path d="M ${centre} Z" fill="#1b1b24"/>
          <circle cx="46" cy="48" r="2" fill="#fff"/><circle cx="54" cy="48" r="2" fill="#fff"/>
          <path d="M46.5 53 Q50 56 53.5 53" stroke="#fff" stroke-width="1.6" fill="none" stroke-linecap="round"/>
          <path d="M14 38 H22 M10 46 H20 M14 54 H22" stroke="#fff" stroke-width="2" stroke-linecap="round" opacity=".6"/>
          <circle cx="${cx}" cy="${cy}" r="${R}" fill="none" stroke="#1b1b24" stroke-width="1.2" opacity=".35"/>
          <circle cx="40" cy="34" r="2.4" fill="#fff" opacity=".9"/>`;
      })(),
    },
    {
      id: 'astro',
      name: { en: 'Astro', fr: 'Astro' },
      kind: { en: 'Astronaut', fr: 'Astronaute' },
      svg: `${bg('#14213d')}
        <circle cx="14" cy="16" r="1.4" fill="#fff"/><circle cx="30" cy="8" r="1" fill="#fff"/><circle cx="90" cy="46" r="1.2" fill="#fff"/><circle cx="8" cy="52" r="1" fill="#fff"/><circle cx="72" cy="10" r="1" fill="#fff"/>
        <circle cx="84" cy="20" r="7" fill="#f4a261"/><ellipse cx="84" cy="20" rx="12" ry="3.5" fill="none" stroke="#ffd166" stroke-width="1.6" transform="rotate(-20 84 20)"/>
        ${shoulders('#e9ecef')}
        <rect x="40" y="84" width="20" height="12" rx="3" fill="#3a86ff"/>
        <circle cx="45" cy="90" r="1.8" fill="#e63946"/><circle cx="50" cy="90" r="1.8" fill="#ffd166"/><circle cx="55" cy="90" r="1.8" fill="#06d6a0"/>
        <rect x="19" y="44" width="7" height="14" rx="3" fill="#ced4da"/><rect x="74" y="44" width="7" height="14" rx="3" fill="#ced4da"/>
        <circle cx="50" cy="50" r="27" fill="#f8f9fa"/>
        <path d="M50 23 V16" stroke="#ced4da" stroke-width="2"/><circle cx="50" cy="15" r="2.6" fill="#e63946"/>
        <ellipse cx="50" cy="52" rx="19.5" ry="16.5" fill="#1b263b"/>
        <ellipse cx="43.5" cy="52" rx="2.6" ry="3.2" fill="#80ffdb"/><ellipse cx="56.5" cy="52" rx="2.6" ry="3.2" fill="#80ffdb"/>
        <path d="M45 59 Q50 62.5 55 59" stroke="#80ffdb" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M36 46 Q39 39 47 38" stroke="#fff" stroke-width="2.4" fill="none" stroke-linecap="round" opacity=".55"/>`,
    },
    {
      id: 'basket',
      name: { en: 'Hoops', fr: 'Hoops' },
      kind: { en: 'Basketball', fr: 'Basket-ball' },
      svg: `${bg('#577590')}
        <rect x="62" y="6" width="32" height="22" rx="2" fill="#f8f9fa"/><rect x="71" y="13" width="14" height="10" fill="none" stroke="#e63946" stroke-width="1.6"/>
        <path d="M66 28 H90" stroke="#e63946" stroke-width="3" stroke-linecap="round"/>
        <path d="M67 29 L71 40 M72 29 L74 40 M78 29 L78 40 M84 29 L82 40 M89 29 L85 40 M69 34 H87" stroke="#fff" stroke-width="1.2" opacity=".85"/>
        <ellipse cx="46" cy="90" rx="22" ry="4" fill="#1b1b24" opacity=".25"/>
        <circle cx="46" cy="58" r="27" fill="#f77f00"/>
        <path d="M46 31 V85 M19 58 H73" stroke="#6f3a0b" stroke-width="2.4"/>
        <path d="M28 38 Q40 58 28 78 M64 38 Q52 58 64 78" stroke="#6f3a0b" stroke-width="2.4" fill="none"/>
        <ellipse cx="38.5" cy="53" rx="3.2" ry="3.8" fill="#fff"/><ellipse cx="53.5" cy="53" rx="3.2" ry="3.8" fill="#fff"/>
        <circle cx="39" cy="53.6" r="1.9" fill="#1b1b24"/><circle cx="54" cy="53.6" r="1.9" fill="#1b1b24"/>
        <path d="M40 64 Q46 69 52 64" stroke="#1b1b24" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        ${blush(33, 62)}${blush(59, 62)}
        <circle cx="34" cy="40" r="2.6" fill="#fff" opacity=".45"/>
        <path d="M12 20 q3 4 0 8 M18 16 q3 4 0 8" stroke="#fff" stroke-width="1.8" fill="none" stroke-linecap="round" opacity=".6"/>`,
    },
    {
      id: 'slice',
      name: { en: 'Slice', fr: 'Slice' },
      kind: { en: 'Pizza', fr: 'Pizza' },
      svg: `${bg('#4361ee')}
        <circle cx="14" cy="80" r="2" fill="#fff" opacity=".5"/><circle cx="86" cy="70" r="2.5" fill="#fff" opacity=".5"/>
        <path d="M20 24 Q50 14 80 24 L53 88 Q50 93 47 88 Z" fill="#ffd166"/>
        <path d="M22 26 Q50 17 78 26 L70 44 Q50 38 30 44 Z" fill="#f4a261" opacity=".35"/>
        <path d="M18 21 Q50 8 82 21 Q85 29 78 30 Q50 19 22 30 Q15 29 18 21 Z" fill="#e09f3e"/>
        <circle cx="36" cy="38" r="5.5" fill="#e63946"/><circle cx="64" cy="40" r="5.5" fill="#e63946"/><circle cx="50" cy="70" r="4.5" fill="#e63946"/>
        <circle cx="34.5" cy="36.5" r="1.2" fill="#fff" opacity=".6"/><circle cx="62.5" cy="38.5" r="1.2" fill="#fff" opacity=".6"/>
        <circle cx="58" cy="60" r="2.6" fill="none" stroke="#2d6a4f" stroke-width="1.6"/><circle cx="41" cy="56" r="2.2" fill="none" stroke="#2d6a4f" stroke-width="1.5"/>
        ${eye(44.5, 48, 2.3)}${eye(55.5, 48, 2.3)}
        <path d="M46 53 Q50 57 54 53" stroke="#1b1b24" stroke-width="1.8" fill="none" stroke-linecap="round"/>
        <path d="M60 77 Q61 84 58 88" stroke="#ffd166" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    },
    {
      id: 'joy',
      name: { en: 'Joy', fr: 'Joy' },
      kind: { en: 'Game controller', fr: 'Manette de jeu' },
      svg: `${bg('#f72585')}
        <path d="M50 37 Q50 22 62 16 Q70 12 74 18" stroke="#3a0ca3" stroke-width="3" fill="none" stroke-linecap="round"/>
        <path d="M22 46 Q22 36 34 36 H66 Q78 36 78 46 L86 70 Q88 81 78 81 Q72 81 68 73 L64 67 H36 L32 73 Q28 81 22 81 Q12 81 14 70 Z" fill="#7209b7"/>
        <path d="M26 51 H34 V47 H38 V51 H42 V55 H38 V59 H34 V55 H26 V51 Z" transform="translate(-3 0)" fill="#3a0ca3"/>
        <circle cx="68" cy="47" r="3" fill="#ffd166"/><circle cx="74" cy="53" r="3" fill="#06d6a0"/><circle cx="62" cy="53" r="3" fill="#4cc9f0"/><circle cx="68" cy="59" r="3" fill="#e63946"/>
        <ellipse cx="45.5" cy="49" rx="3" ry="3.6" fill="#fff"/><ellipse cx="54.5" cy="49" rx="3" ry="3.6" fill="#fff"/>
        <circle cx="46" cy="49.8" r="1.7" fill="#1b1b24"/><circle cx="55" cy="49.8" r="1.7" fill="#1b1b24"/>
        <path d="M46 57 Q50 61 54 57" stroke="#fff" stroke-width="2" fill="none" stroke-linecap="round"/>
        <circle cx="30" cy="42" r="1.6" fill="#fff" opacity=".6"/>`,
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
