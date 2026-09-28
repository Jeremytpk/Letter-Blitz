// "Contact us" form: sends the message to the game server, which keeps it
// for the Jerttech team (visible on the admin dashboard).
(() => {
  const form = document.getElementById('contact-form');
  const errorEl = document.getElementById('contact-error');
  const sendBtn = document.getElementById('contact-send');
  const lang = () => (document.documentElement.lang === 'fr' ? 'fr' : 'en');
  const MESSAGES = {
    en: {
      empty_message: 'Please write a message.',
      bad_email: 'That email address doesn’t look right.',
      too_many: 'Too many messages. Try again later.',
      offline: 'Couldn’t send — check your connection and try again.',
    },
    fr: {
      empty_message: 'Veuillez écrire un message.',
      bad_email: 'Cette adresse e-mail semble incorrecte.',
      too_many: 'Trop de messages. Réessayez plus tard.',
      offline: 'Envoi impossible — vérifiez votre connexion et réessayez.',
    },
  };
  const showError = (code) => {
    errorEl.textContent = MESSAGES[lang()][code] || MESSAGES[lang()].offline;
    errorEl.hidden = false;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    errorEl.hidden = true;
    const message = document.getElementById('contact-message').value.trim();
    if (message.length < 2) return showError('empty_message');
    sendBtn.disabled = true;
    try {
      const res = await fetch('/api/game', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'contact',
          name: document.getElementById('contact-name').value,
          email: document.getElementById('contact-email').value,
          message,
          website: document.getElementById('contact-website').value,
          lang: lang(),
        }),
      });
      const data = await res.json();
      if (!res.ok) return showError(data.errorCode);
      form.hidden = true;
      document.getElementById('contact-done').hidden = false;
    } catch {
      showError('offline');
    } finally {
      sendBtn.disabled = false;
    }
  });
})();
