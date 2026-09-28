// English / French text for the whole site. Each player picks their own
// language; it's saved on their device and doesn't affect anyone else.
(() => {
  const STRINGS = {
    en: {
      tagline: 'Everyone gets the same letter. Fill every category before the clock hits zero.',
      yourName: 'Your name',
      namePlaceholder: 'e.g. Jamie',
      joinTab: 'Join a room',
      createTab: 'Create a room',
      roomCode: 'Room code',
      joinRoom: 'Join room',
      roundLength: 'Round length:',
      seconds: 's',
      categoriesPerRound: 'Categories per round:',
      numberOfRounds: 'Number of rounds',
      roundsOne: '1 round',
      roundsMany: '{n} rounds',
      lobbySettings: '{rounds} · {seconds} s per round · {cats} categories',
      roundOf: 'Round {round} of {total}',
      seeFinalScores: 'See final scores →',
      finalResults: 'Final results · {rounds}',
      youWinGame: '🏆 You win the game!',
      playerWinsGame: '🏆 {name} wins the game!',
      tieGame: '🤝 Tie between {names}!',
      and: ' and ',
      playAgain: 'Play again',
      waitingForRestart: 'Game over! Waiting for the host to start a new game…',
      err_game_over: 'The game is over.',
      err_host_only_restart: 'Only the host can start a new game.',
      createRoom: 'Create room',

      leave: 'Leave',
      leaveRoom: 'Leave room',
      shareCode: 'Share this code — everyone joins from their own phone.',
      startGame: 'Start game',
      waitingForPlayers: 'Waiting for more players…',
      waitingForHost: 'Waiting for the host to start…',
      host: 'Host',
      left: 'left',
      you: 'you',

      yourLetter: 'Your letter',
      startsWith: 'Starts with {letter}…',
      checking: 'Checking…',
      checkingNote: "⏱ Time's up! Checking answers online…",

      roundWon: '🏆 {name} won round {round} with {points} pts — you scored {mine}',
      roundResults: 'Round {round} results',
      noAnswer: 'no answer',
      notFound: 'not found',
      wrongCategory: 'wrong category',
      wrongLetter: 'wrong letter',
      dupe: 'dupe',
      notFoundHint: "Couldn't find this online — marked as doesn't exist",
      wrongCategoryHint: "Found online, but it isn't in the category “{category}”",
      seeScores: 'See scores →',

      roundLetter: 'Round {round} of {total} · letter {letter}',
      youWonWith: '🏆 You won with {points} pts',
      playerWonWith: '🏆 {name} won with {points} pts',
      roundOver: 'Round over',
      scores: 'Scores',
      pts: '{points} pts',
      pickNextLetter: 'You won the round — pick the next letter',
      waitingForPick: 'Waiting for {name} to pick the next letter…',
      backToAnswers: '← Back to answers',

      leaveTitle: 'Leave this room?',
      leaveText:
        "This will erase all your data on this device — your username, your room and your scores. You won't be able to come back to this game.",
      stay: 'Stay',
      leaveAndErase: 'Leave & erase',
      leftToast: 'You left the room. Your data was erased.',

      enterName: 'Enter a name first.',
      codeFormat: 'Room codes are 4 letters/numbers.',
      cantReach: "Can't reach the game. Check your connection.",
      roomEnded: 'That room has ended.',
      somethingWrong: 'Something went wrong. Try again.',

      // Errors sent by the game (by code)
      err_name_required: 'Enter a name first.',
      err_room_not_found: 'Room not found. Check the code.',
      err_game_started: 'This game already started. Ask the host for a new room.',
      err_room_full: 'Room is full.',
      err_name_taken: 'That name is taken in this room. Try another.',
      err_busy: 'The room is busy — please try again.',
      err_create_failed: 'Could not create a room — please try again.',
      err_not_in_room: 'You are no longer in this room.',
      err_host_only: 'Only the host can start the game.',
      err_need_players: 'Need at least 2 players to start.',
      err_invalid_letter: 'Pick a valid letter.',
      err_winner_only: 'Only the round winner picks the next letter.',

      categories: {
        country: 'Country',
        capital: 'Capital City',
        city: 'City',
        man: "Man's Name",
        woman: "Woman's Name",
        singer: 'Singer',
        car: 'Car Brand or Model',
        actor: 'Comedian or Actor',
        fruit: 'Fruit',
        animal: 'Animal',
        food: 'Food or Dish',
        vegetable: 'Vegetable',
        athlete: 'Footballer or Athlete',
        movie_tv: 'Movie or TV Show',
        brand: 'Brand',
        job: 'Job or Profession',
        sport: 'Sport',
      },
    },

    fr: {
      tagline: 'Tout le monde a la même lettre. Remplissez chaque catégorie avant la fin du chrono.',
      yourName: 'Votre nom',
      namePlaceholder: 'ex. Jamie',
      joinTab: 'Rejoindre',
      createTab: 'Créer une salle',
      roomCode: 'Code de la salle',
      joinRoom: 'Rejoindre la salle',
      roundLength: 'Durée de la manche :',
      seconds: ' s',
      categoriesPerRound: 'Catégories par manche :',
      numberOfRounds: 'Nombre de manches',
      roundsOne: '1 manche',
      roundsMany: '{n} manches',
      lobbySettings: '{rounds} · {seconds} s par manche · {cats} catégories',
      roundOf: 'Manche {round} sur {total}',
      seeFinalScores: 'Voir le classement final →',
      finalResults: 'Classement final · {rounds}',
      youWinGame: '🏆 Vous gagnez la partie !',
      playerWinsGame: '🏆 {name} gagne la partie !',
      tieGame: '🤝 Égalité entre {names} !',
      and: ' et ',
      playAgain: 'Rejouer',
      waitingForRestart: 'Partie terminée ! En attente d’une nouvelle partie par l’hôte…',
      err_game_over: 'La partie est terminée.',
      err_host_only_restart: 'Seul l’hôte peut lancer une nouvelle partie.',
      createRoom: 'Créer la salle',

      leave: 'Quitter',
      leaveRoom: 'Quitter la salle',
      shareCode: 'Partagez ce code — chacun rejoint depuis son téléphone.',
      startGame: 'Lancer la partie',
      waitingForPlayers: 'En attente d’autres joueurs…',
      waitingForHost: 'En attente du lancement par l’hôte…',
      host: 'Hôte',
      left: 'parti',
      you: 'vous',

      yourLetter: 'Votre lettre',
      startsWith: 'Commence par {letter}…',
      checking: 'Vérification…',
      checkingNote: '⏱ Temps écoulé ! Vérification des réponses en ligne…',

      roundWon: '🏆 {name} gagne la manche {round} avec {points} pts — vous avez {mine}',
      roundResults: 'Résultats de la manche {round}',
      noAnswer: 'pas de réponse',
      notFound: 'introuvable',
      wrongCategory: 'mauvaise catégorie',
      wrongLetter: 'mauvaise lettre',
      dupe: 'doublon',
      notFoundHint: 'Introuvable en ligne — considéré comme inexistant',
      wrongCategoryHint: 'Trouvé en ligne, mais ce n’est pas dans la catégorie « {category} »',
      seeScores: 'Voir les scores →',

      roundLetter: 'Manche {round} sur {total} · lettre {letter}',
      youWonWith: '🏆 Vous gagnez avec {points} pts',
      playerWonWith: '🏆 {name} gagne avec {points} pts',
      roundOver: 'Manche terminée',
      scores: 'Scores',
      pts: '{points} pts',
      pickNextLetter: 'Vous avez gagné la manche — choisissez la prochaine lettre',
      waitingForPick: '{name} choisit la prochaine lettre…',
      backToAnswers: '← Retour aux réponses',

      leaveTitle: 'Quitter cette salle ?',
      leaveText:
        'Toutes vos données sur cet appareil seront effacées — votre nom, votre salle et vos scores. Vous ne pourrez pas revenir dans cette partie.',
      stay: 'Rester',
      leaveAndErase: 'Quitter et effacer',
      leftToast: 'Vous avez quitté la salle. Vos données ont été effacées.',

      enterName: 'Entrez d’abord un nom.',
      codeFormat: 'Le code de salle comporte 4 lettres/chiffres.',
      cantReach: 'Impossible de joindre le jeu. Vérifiez votre connexion.',
      roomEnded: 'Cette salle est terminée.',
      somethingWrong: 'Un problème est survenu. Réessayez.',

      err_name_required: 'Entrez d’abord un nom.',
      err_room_not_found: 'Salle introuvable. Vérifiez le code.',
      err_game_started: 'La partie a déjà commencé. Demandez une nouvelle salle à l’hôte.',
      err_room_full: 'La salle est pleine.',
      err_name_taken: 'Ce nom est déjà pris dans cette salle. Essayez-en un autre.',
      err_busy: 'La salle est occupée — réessayez.',
      err_create_failed: 'Impossible de créer la salle — réessayez.',
      err_not_in_room: 'Vous n’êtes plus dans cette salle.',
      err_host_only: 'Seul l’hôte peut lancer la partie.',
      err_need_players: 'Il faut au moins 2 joueurs pour commencer.',
      err_invalid_letter: 'Choisissez une lettre valide.',
      err_winner_only: 'Seul le gagnant de la manche choisit la prochaine lettre.',

      categories: {
        country: 'Pays',
        capital: 'Capitale',
        city: 'Ville',
        man: 'Prénom masculin',
        woman: 'Prénom féminin',
        singer: 'Chanteur ou chanteuse',
        car: 'Marque ou modèle de voiture',
        actor: 'Humoriste ou acteur',
        fruit: 'Fruit',
        animal: 'Animal',
        food: 'Plat ou aliment',
        vegetable: 'Légume',
        athlete: 'Footballeur ou athlète',
        movie_tv: 'Film ou série',
        brand: 'Marque',
        job: 'Métier',
        sport: 'Sport',
      },
    },
  };

  const LS_LANG = 'lb_lang';

  function initialLang() {
    try {
      const saved = localStorage.getItem(LS_LANG);
      if (saved && STRINGS[saved]) return saved;
    } catch {}
    return (navigator.language || '').toLowerCase().startsWith('fr') ? 'fr' : 'en';
  }

  let lang = initialLang();

  function t(key, vars = {}) {
    const s = STRINGS[lang][key] ?? STRINGS.en[key] ?? key;
    return s.replace(/\{(\w+)\}/g, (_, k) => (k in vars ? vars[k] : `{${k}}`));
  }

  function categoryLabel(cat) {
    return STRINGS[lang].categories[cat.id] || cat.label;
  }

  // Fill every element marked with data-i18n / -placeholder / -title / -aria-label.
  function applyStatic(root = document) {
    document.documentElement.lang = lang;
    for (const el of root.querySelectorAll('[data-i18n]')) el.textContent = t(el.dataset.i18n);
    for (const el of root.querySelectorAll('[data-i18n-placeholder]')) el.placeholder = t(el.dataset.i18nPlaceholder);
    for (const el of root.querySelectorAll('[data-i18n-title]')) el.title = t(el.dataset.i18nTitle);
    for (const el of root.querySelectorAll('[data-lang]')) {
      const active = el.dataset.lang === lang;
      el.classList.toggle('is-active', active);
      el.setAttribute('aria-pressed', String(active));
    }
  }

  const listeners = [];
  function setLang(next) {
    if (!STRINGS[next] || next === lang) return;
    lang = next;
    try {
      localStorage.setItem(LS_LANG, lang);
    } catch {}
    applyStatic();
    for (const fn of listeners) fn(lang);
  }

  window.i18n = {
    t,
    categoryLabel,
    applyStatic,
    setLang,
    get lang() {
      return lang;
    },
    onChange: (fn) => listeners.push(fn),
  };
})();
