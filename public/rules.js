// Official rules for a sponsor campaign: /rules.html?c=<campaign id>.
// Built from the campaign's own details, in English and French.
(() => {
  const id = new URLSearchParams(location.search).get('c') || '';

  const TEXT = {
    en: {
      title: '{name} prize games — official rules',
      notFound: 'This campaign doesn’t exist or has been removed.',
      intro: 'These rules apply to Letter Blitz games with a prize from {name}.',
      h1: 'Who runs it',
      p1: 'The game is run by Jerttech (Letter Blitz). The prizes are provided by {name}.',
      h2: 'When',
      p2: 'From {start} to {end}. Only games created during this period take part.',
      h3: 'Free to play',
      p3: 'No purchase or payment is necessary to play or to win. Buying anything does not improve your chances.',
      h4: 'How to win',
      p4: 'The prize goes to the player with the highest total score at the end of an eligible game: a game with at least {players} players and at least {rounds} rounds. If players tie for first place, each of them can receive a prize while prizes last. A game where nobody scores has no winner.',
      h5: 'The prize',
      p5: '{prize}. Prize codes are provided by {name} and follow {name}’s own conditions. They can’t be exchanged for cash unless {name} says otherwise.',
      h6: 'Limits',
      p6: 'One prize per player for the whole campaign, while codes last. The number of prizes is limited.',
      h7: 'Fair play',
      p7: 'Answers are checked automatically and scores are final. Jerttech may cancel a prize won by cheating — for example one person playing several players, sharing answers, or tampering with the game.',
      h8: 'Your email',
      p8: 'To receive the prize, the winner is asked for an email address. With the winner’s agreement, Jerttech shares it with {name} only to deliver the prize.',
      h9: 'Good to know',
      p9: 'If you are under 18, ask a parent or guardian before claiming a prize. You are responsible for following the laws where you live; this offer is void where prohibited. How we handle information is explained in the Privacy Policy.',
      h10: 'More rules from {name}',
      h11: 'Questions',
      p11: 'Write to us through the Contact page.',
    },
    fr: {
      title: 'Parties avec lots {name} — règlement officiel',
      notFound: 'Cette campagne n’existe pas ou a été supprimée.',
      intro: 'Ce règlement s’applique aux parties de Letter Blitz avec un lot offert par {name}.',
      h1: 'Organisateur',
      p1: 'Le jeu est organisé par Jerttech (Letter Blitz). Les lots sont offerts par {name}.',
      h2: 'Dates',
      p2: 'Du {start} au {end}. Seules les parties créées pendant cette période participent.',
      h3: 'Gratuit',
      p3: 'Aucun achat ni paiement n’est nécessaire pour jouer ou gagner. Acheter quoi que ce soit n’augmente pas vos chances.',
      h4: 'Comment gagner',
      p4: 'Le lot revient au joueur ayant le meilleur score total à la fin d’une partie éligible : une partie avec au moins {players} joueurs et au moins {rounds} manches. En cas d’égalité à la première place, chaque joueur concerné peut recevoir un lot dans la limite des lots disponibles. Une partie où personne ne marque n’a pas de gagnant.',
      h5: 'Le lot',
      p5: '{prize}. Les codes sont fournis par {name} et soumis à ses propres conditions. Ils ne peuvent pas être échangés contre de l’argent, sauf indication contraire de {name}.',
      h6: 'Limites',
      p6: 'Un lot par joueur pour toute la campagne, dans la limite des codes disponibles. Le nombre de lots est limité.',
      h7: 'Fair-play',
      p7: 'Les réponses sont vérifiées automatiquement et les scores sont définitifs. Jerttech peut annuler un lot gagné en trichant — par exemple une même personne jouant plusieurs joueurs, le partage de réponses ou la manipulation du jeu.',
      h8: 'Votre e-mail',
      p8: 'Pour recevoir le lot, le gagnant doit indiquer une adresse e-mail. Avec son accord, Jerttech la transmet à {name} uniquement pour la remise du lot.',
      h9: 'Bon à savoir',
      p9: 'Si vous avez moins de 18 ans, demandez l’accord d’un parent ou d’un tuteur avant de réclamer un lot. Vous êtes responsable du respect des lois de votre pays ; cette offre est nulle là où elle est interdite. Le traitement des informations est expliqué dans la Politique de confidentialité.',
      h10: 'Règles supplémentaires de {name}',
      h11: 'Questions',
      p11: 'Écrivez-nous via la page Contact.',
    },
  };

  const fill = (s, vars) => s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : ''));

  function build(container, lang, c) {
    const T = TEXT[lang];
    container.innerHTML = '';
    const add = (tag, text) => {
      const el = document.createElement(tag);
      el.textContent = text;
      container.appendChild(el);
      return el;
    };
    if (!c) {
      add('h1', lang === 'fr' ? 'Règlement' : 'Prize rules');
      add('p', T.notFound);
      return;
    }
    const locale = lang === 'fr' ? 'fr-FR' : 'en-US';
    const date = (ms) => new Date(ms).toLocaleString(locale, { dateStyle: 'long', timeStyle: 'short' });
    const vars = {
      name: c.name,
      start: date(c.startsAt),
      end: date(c.endsAt),
      players: c.minPlayers,
      rounds: c.minRounds,
      prize: (c.prize && (c.prize[lang] || c.prize.en || c.prize.fr)) || '—',
    };
    add('h1', fill(T.title, vars));
    add('p', fill(T.intro, vars)).className = 'lead';
    const sections = ['1', '2', '3', '4', '5', '6', '7'];
    if (c.collectEmail) sections.push('8');
    sections.push('9');
    for (const n of sections) {
      add('h2', fill(T[`h${n}`], vars));
      add('p', fill(T[`p${n}`], vars));
    }
    const extra = c.extraRules && (c.extraRules[lang] || c.extraRules.en || c.extraRules.fr);
    if (extra) {
      add('h2', fill(T.h10, vars));
      add('p', extra).style.whiteSpace = 'pre-line';
    }
    add('h2', T.h11);
    const p = add('p', '');
    const a = document.createElement('a');
    a.href = '/contact.html';
    a.textContent = T.p11;
    p.appendChild(a);
  }

  async function load() {
    let campaign = null;
    if (/^[a-z0-9]{8,24}$/.test(id)) {
      try {
        const res = await fetch('/api/game', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'sponsorInfo', id }),
        });
        if (res.ok) campaign = (await res.json()).sponsor;
      } catch {}
    }
    build(document.getElementById('rules-en'), 'en', campaign);
    build(document.getElementById('rules-fr'), 'fr', campaign);
  }
  load();
})();
