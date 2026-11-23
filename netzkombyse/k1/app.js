/* Konzept 1 · Hafenkarte – Kompass im Menü, Routen-Fortschritt (Präsentation: shared/deck.js) */
(() => {
  const { $, $$ } = window.NK || {};
  if (!$) return;

  /* Kompassnadel folgt dem Menüpunkt */
  const mc = $('.menu-compass'), deg = $('[data-deg]');
  const aim = v => { if (!mc) return; mc.style.setProperty('--rot', v + 'deg'); if (deg) deg.textContent = String(v).padStart(3, '0'); };
  $$('.menu-nav li>a').forEach(a => {
    const v = +a.dataset.rot;
    ['mouseenter', 'focus', 'pointerdown'].forEach(ev => a.addEventListener(ev, () => aim(v)));
  });

  /* Routen-Fortschritt je Stationsbereich (nur Variable, kein Layout) */
  const sts = $$('.stations');
  if (sts.length) {
    let tick = false;
    const upd = () => { tick = false;
      sts.forEach(s => { const r = s.getBoundingClientRect(), h = r.height;
        const p = Math.min(1, Math.max(0, (innerHeight * .6 - r.top) / h)); s.style.setProperty('--rp', p.toFixed(4)); }); };
    addEventListener('scroll', () => { if (!tick) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
    addEventListener('resize', upd); upd();
  }
})();

/* Ladung: vertikaler Scroll fährt die Referenzen seitlich durch (Desktop, Bewegung an; sonst nativ wischen) */
(() => {
  const { $, motionOn } = window.NK || {};
  const cargo = $ && $('.cargo');
  if (!cargo) return;
  const fine = matchMedia('(min-width:900px) and (hover:hover)');
  const pin = document.createElement('div'), st = document.createElement('div'), inner = document.createElement('div');
  pin.className = 'cargo-pin'; st.className = 'cargo-stick'; inner.className = 'cargo-in';
  cargo.before(pin); pin.appendChild(st); st.appendChild(cargo);
  while (cargo.firstChild) inner.appendChild(cargo.firstChild);
  cargo.appendChild(inner);
  let max = 0, tick = false, active = false;
  const upd = () => { tick = false; if (!active) return;
    const p = Math.min(1, Math.max(0, -pin.getBoundingClientRect().top / (pin.offsetHeight - innerHeight)));
    inner.style.transform = `translate3d(${(-p * max).toFixed(1)}px,0,0)`; };
  const sync = () => {
    active = fine.matches && motionOn();
    pin.classList.remove('on'); pin.style.height = ''; inner.style.transform = '';
    if (!active) return;
    max = inner.scrollWidth - cargo.clientWidth;
    if (max < 40) { active = false; return; }
    pin.style.height = (innerHeight + max) + 'px'; pin.classList.add('on'); upd();
  };
  addEventListener('scroll', () => { if (!tick && active) { tick = true; requestAnimationFrame(upd); } }, { passive: true });
  addEventListener('nk:motion', sync); addEventListener('resize', sync);
  fine.addEventListener?.('change', sync);
  sync();
})();
