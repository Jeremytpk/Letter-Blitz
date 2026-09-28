// Shared script for the About / Privacy / Terms pages: shows the English or
// French version (same saved choice as the game) and fills in icons.
(() => {
  const LS_LANG = 'lb_lang';
  let lang;
  try {
    lang = localStorage.getItem(LS_LANG);
  } catch {}
  if (lang !== 'en' && lang !== 'fr') lang = (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';

  function apply() {
    document.documentElement.lang = lang;
    for (const el of document.querySelectorAll('[data-lang-block]')) el.hidden = el.dataset.langBlock !== lang;
    for (const btn of document.querySelectorAll('[data-lang]')) {
      const active = btn.dataset.lang === lang;
      btn.classList.toggle('is-active', active);
      btn.setAttribute('aria-pressed', String(active));
    }
    const title = document.querySelector(`[data-lang-block="${lang}"] h1`);
    if (title) document.title = `${title.textContent} · Letter Blitz`;
  }

  for (const btn of document.querySelectorAll('[data-lang]')) {
    btn.addEventListener('click', () => {
      lang = btn.dataset.lang;
      try {
        localStorage.setItem(LS_LANG, lang);
      } catch {}
      apply();
    });
  }
  apply();
})();
