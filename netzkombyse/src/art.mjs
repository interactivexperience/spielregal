// Gemeinsame Nordsee-Illustrationen (Inline-SVG, eigene Zeichnungen)
export const INK = '#10263A';

/* Möwe als Figur (Seitenansicht) */
export const gull = (cls = '', ink = INK) => `<svg class="gl ${cls}" viewBox="0 0 112 82" aria-hidden="true" focusable="false">
  <g stroke="${ink}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">
    <path d="M47 64v13M60 64v13" stroke="#FF8A3D" stroke-width="3.6" fill="none"/><path d="M42 78h9M55 78h9" stroke="#FF8A3D" stroke-width="3.2" fill="none"/>
    <path d="M24 52L5 61l21 2z" fill="#fff"/>
    <ellipse cx="50" cy="48" rx="31" ry="20" fill="#fff"/>
    <g class="gl-w"><path d="M36 46Q54 28 78 46Q62 60 38 54z" fill="#A9BFD2"/></g>
    <circle cx="80" cy="29" r="14" fill="#fff"/>
    <path d="M92 26l18 6-18 6z" fill="#FFB400"/><circle cx="104" cy="33" r="2" fill="#E8412D" stroke="none"/>
    <circle cx="83" cy="26" r="2.6" fill="${ink}" stroke="none"/></g></svg>`;

/* Möwe im Flug (M-Silhouette) */
export const fly = (cls = '') => `<svg class="fl ${cls}" viewBox="0 0 64 28" aria-hidden="true" focusable="false"><path class="fl-a" d="M2 20Q16 -2 32 17Q48 -2 62 20" fill="none" stroke="currentColor" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

export const fisch = (cls = '') => `<svg class="fi ${cls}" viewBox="0 0 110 66" aria-hidden="true" focusable="false"><g stroke="${INK}" stroke-width="3.2" stroke-linejoin="round" stroke-linecap="round">
  <path d="M8 40h94v4a16 16 0 0 1-16 16H24A16 16 0 0 1 8 44z" fill="#E9B46D"/>
  <path d="M12 38Q20 30 30 38T50 38T70 38T90 38 98 36v6H12z" fill="#CBD7DF"/>
  <path d="M6 32a49 28 0 0 1 98 0z" fill="#F4C987"/>
  <circle cx="34" cy="20" r="2" fill="${INK}" stroke="none"/><circle cx="55" cy="14" r="2" fill="${INK}" stroke="none"/><circle cx="76" cy="21" r="2" fill="${INK}" stroke="none"/>
  <path d="M26 36q4-8 8 0M66 36q4-8 8 0" fill="none" stroke="#B94C6E" stroke-width="3"/></g></svg>`;

export const korb = (c = '#F0735A', cls = '') => `<svg class="ko ${cls}" viewBox="0 0 64 76" aria-hidden="true" focusable="false"><g stroke="${INK}" stroke-width="3" stroke-linejoin="round" stroke-linecap="round">
  <path d="M7 36Q7 6 32 6t25 30z" fill="${c}"/>
  <rect x="7" y="34" width="50" height="30" rx="4" fill="#fff"/>
  <path d="M19 34v30M32 34v30M45 34v30" stroke="${c}" stroke-width="5"/>
  <rect x="7" y="34" width="50" height="30" rx="4" fill="none"/>
  <path d="M14 64v8M50 64v8" /></g></svg>`;

export const wolke = (cls = '') => `<svg class="wk ${cls}" viewBox="0 0 240 90" aria-hidden="true" focusable="false"><path fill="currentColor" d="M30 82a26 26 0 0 1-2-52 36 36 0 0 1 68-8 34 34 0 0 1 56 8 28 28 0 0 1 36 14 24 24 0 0 1-2 38z"/></svg>`;

export const turm = (cls = '') => `<svg class="tu ${cls}" viewBox="0 0 160 380" aria-hidden="true" focusable="false"><g stroke="${INK}" stroke-width="3.4" stroke-linejoin="round" stroke-linecap="round">
  <path d="M52 366L64 92h32l12 274z" fill="#fff"/>
  <path d="M59 232l-5.5 134h53L101 232z" fill="#E8412D"/><path d="M62 130l-3 36h42l-3-36z" fill="#E8412D"/>
  <path d="M50 92h60l6-14H44z" fill="#9FB4C7"/>
  <rect x="62" y="44" width="36" height="34" rx="3" fill="#FFF4B8"/><path d="M62 44h36M80 44v34" />
  <path d="M56 44L80 16l24 28z" fill="#E8412D"/><circle cx="80" cy="12" r="4" fill="#fff"/>
  <rect class="win win1" x="73" y="106" width="14" height="20" rx="7" fill="#9FB4C7"/>
  <rect class="win win2" x="73" y="176" width="14" height="22" rx="7" fill="#9FB4C7"/>
  <rect class="win win3" x="72" y="264" width="16" height="26" rx="8" fill="#9FB4C7"/>
  <path d="M30 366h100" /></g></svg>`;

export const sonne = (cls = '') => `<svg class="so ${cls}" viewBox="0 0 120 120" aria-hidden="true" focusable="false"><circle cx="60" cy="60" r="26" fill="currentColor"/><g stroke="currentColor" stroke-width="5" stroke-linecap="round">${Array.from({ length: 12 }, (_, i) => `<path d="M60 14v12" transform="rotate(${i * 30} 60 60)"/>`).join('')}</g></svg>`;

const wp = (w, h, a, wl) => { let d = `M0 ${h / 2}Q${wl / 4} ${h / 2 - a * 2} ${wl / 2} ${h / 2}`; for (let x = wl; x <= w + 0.1; x += wl / 2) d += `T${x} ${h / 2}`; return d + `V${h}H0Z`; };
export const welle = (fill, h = 80, cls = '', wl = 480) => `<svg class="wv ${cls}" viewBox="0 0 1440 ${h}" preserveAspectRatio="none" aria-hidden="true" focusable="false"><path fill="${fill}" d="${wp(1440, h, h * .32, wl)}"/></svg>`;
/* doppelt breit: wandert per translateX(-50%) nahtlos */
export const welleLoop = (fill, h = 80, cls = '', wl = 480) => `<div class="wl2 ${cls}" aria-hidden="true"><svg viewBox="0 0 2880 ${h}" preserveAspectRatio="none" focusable="false"><path fill="${fill}" d="${wp(2880, h, h * .32, wl)}"/></svg></div>`;
