// Words for Word Blitz, by room language and category. Edit freely, then
// run `npm run build-words` to fetch each word's meaning (English and French)
// from Wikipedia into netlify/lib/word-data.mjs.
//
// - Mostly long words (8+ letters); no spaces or hyphens.
// - "Word|Wikipedia page" when the page title isn't the word itself, and
//   "Word|Page|Page in the other language" when Wikipedia doesn't link the two.

export const WORD_LIST = {
  en: {
    country: [
      'Afghanistan', 'Argentina', 'Australia', 'Azerbaijan', 'Bangladesh', 'Botswana', 'Cambodia', 'Cameroon',
      'Colombia', 'Djibouti', 'Ethiopia', 'Guatemala', 'Honduras', 'Indonesia', 'Kazakhstan', 'Kyrgyzstan',
      'Liechtenstein', 'Lithuania', 'Luxembourg', 'Madagascar', 'Malaysia', 'Mauritania', 'Mauritius', 'Montenegro',
      'Mozambique', 'Nicaragua', 'Paraguay', 'Philippines', 'Portugal', 'Seychelles', 'Singapore', 'Slovakia',
      'Suriname', 'Switzerland', 'Tajikistan', 'Tanzania', 'Turkmenistan', 'Uzbekistan', 'Venezuela', 'Zimbabwe',
    ],
    capital: [
      'Amsterdam', 'Antananarivo', 'Asuncion|Asunción', 'Bratislava', 'Brazzaville', 'Bucharest', 'Budapest',
      'Bujumbura', 'Canberra', 'Copenhagen', 'Islamabad', 'Kathmandu', 'Kinshasa', 'Libreville', 'Ljubljana',
      'Montevideo', 'Nouakchott', 'Ouagadougou', 'Podgorica', 'Pretoria', 'Reykjavik|Reykjavík', 'Stockholm',
      'Tegucigalpa', 'Ulaanbaatar', 'Vientiane', 'Washington|Washington, D.C.', 'Wellington', 'Windhoek',
      'Yamoussoukro', 'Brasilia|Brasília',
    ],
    city: [
      'Alexandria', 'Bangalore|Bengaluru', 'Barcelona', 'Birmingham', 'Casablanca', 'Chittagong', 'Edinburgh',
      'Florence', 'Frankfurt', 'Guangzhou', 'Hiroshima', 'Istanbul', 'Johannesburg', 'Liverpool', 'Lubumbashi',
      'Manchester', 'Marrakesh', 'Marseille', 'Melbourne', 'Montreal', 'Philadelphia', 'Rotterdam', 'Sacramento',
      'Salzburg', 'Shanghai', 'Vancouver', 'Barranquilla', 'Bordeaux', 'Strasbourg', 'Toulouse',
    ],
    fruit: [
      'Pineapple', 'Blueberry', 'Blackberry', 'Raspberry', 'Strawberry', 'Watermelon', 'Grapefruit', 'Pomegranate',
      'Tangerine', 'Clementine', 'Gooseberry|Gooseberry|Groseillier à maquereau', 'Cranberry', 'Nectarine|Peach', 'Persimmon', 'Jackfruit',
      'Mangosteen', 'Cantaloupe', 'Elderberry|Sambucus', 'Mulberry', 'Blackcurrant', 'Carambola', 'Apricot',
      'Avocado', 'Coconut', 'Kumquat', 'Passionfruit|Passion fruit (fruit)', 'Redcurrant', 'Cherimoya', 'Rambutan',
      'Dragonfruit|Pitaya',
    ],
    vegetable: [
      'Artichoke|Globe artichoke', 'Asparagus', 'Aubergine|Eggplant', 'Beetroot', 'Broccoli', 'Cabbage',
      'Cauliflower', 'Chickpea', 'Courgette|Zucchini', 'Cucumber', 'Horseradish', 'Lettuce', 'Mushroom', 'Parsnip',
      'Pumpkin', 'Radicchio', 'Rhubarb', 'Shallot', 'Spinach', 'Watercress', 'Kohlrabi', 'Cassava', 'Sweetcorn|Sweet corn',
      'Celeriac', 'Butternut|Butternut squash', 'Jalapeno|Jalapeño',
    ],
    animal: [
      'Alligator', 'Anteater', 'Armadillo', 'Butterfly', 'Chameleon', 'Cheetah', 'Chimpanzee', 'Crocodile',
      'Dolphin', 'Dromedary', 'Elephant', 'Flamingo|Flamingo|Flamant (oiseau)', 'Giraffe', 'Gorilla', 'Grasshopper', 'Hedgehog',
      'Hippopotamus', 'Hummingbird', 'Jellyfish', 'Kangaroo', 'Leopard', 'Mosquito', 'Octopus', 'Orangutan',
      'Ostrich', 'Pangolin', 'Pelican', 'Penguin', 'Porcupine', 'Rattlesnake|Rattlesnake|Crotale', 'Rhinoceros', 'Salamander',
      'Scorpion', 'Squirrel', 'Tortoise', 'Woodpecker', 'Wolverine', 'Platypus', 'Chinchilla',
    ],
    food: [
      'Spaghetti', 'Lasagna|Lasagna', 'Hamburger', 'Croissant', 'Pancake', 'Omelette', 'Guacamole', 'Couscous',
      'Moussaka', 'Ratatouille', 'Risotto', 'Sandwich', 'Shawarma', 'Tiramisu', 'Cheesecake', 'Doughnut',
      'Meatball', 'Porridge', 'Quesadilla', 'Enchilada', 'Pepperoni', 'Mayonnaise', 'Barbecue|Barbecue|Barbecue', 'Cannelloni',
      'Carbonara', 'Bruschetta', 'Chocolate', 'Marshmallow', 'Popcorn', 'Baguette',
    ],
    job: [
      'Architect', 'Astronaut', 'Carpenter|Carpenter|Charpentier', 'Detective|Detective|Détective', 'Electrician', 'Firefighter', 'Journalist', 'Librarian',
      'Lifeguard', 'Mechanic|Mechanic|Mécanicien automobile', 'Musician', 'Paramedic|Paramedic|Ambulancier', 'Pharmacist', 'Photographer', 'Physician', 'Plumber|Plumbing',
      'Psychologist', 'Receptionist', 'Scientist', 'Secretary', 'Surgeon', 'Translator|Translation', 'Veterinarian',
      'Accountant', 'Ambassador', 'Babysitter|Babysitting', 'Blacksmith', 'Hairdresser', 'Programmer|Computer programmer',
      'Engineer',
    ],
    sport: [
      'Badminton', 'Basketball', 'Baseball', 'Bobsleigh', 'Canoeing', 'Climbing', 'Cricket|Cricket', 'Cycling',
      'Fencing', 'Football|Association football', 'Gymnastics', 'Handball', 'Kickboxing', 'Lacrosse', 'Marathon',
      'Motocross', 'Netball', 'Skateboarding', 'Snowboarding', 'Surfing', 'Swimming|Swimming (sport)', 'Taekwondo',
      'Triathlon', 'Volleyball', 'Weightlifting|Olympic weightlifting', 'Wrestling', 'Archery', 'Athletics|Sport of athletics',
      'Equestrianism',
    ],
    brand: [
      'Volkswagen', 'Lamborghini', 'Mitsubishi', 'Mercedes|Mercedes-Benz', 'Microsoft', 'Instagram', 'Facebook',
      'Starbucks', 'Heineken|Heineken N.V.', 'Panasonic', 'Playstation|PlayStation', 'Nintendo', 'Chevrolet',
      'Maserati', 'Burberry', 'Carrefour', 'Lufthansa', 'Michelin', 'Bridgestone', 'Vodafone', 'Motorola',
      'Nescafe|Nescafé', 'Peugeot', 'Renault', 'Samsung', 'Hyundai|Hyundai Motor Company', 'Ferrari', 'Porsche',
      'Whatsapp|WhatsApp', 'Youtube|YouTube',
    ],
  },
  fr: {
    country: [
      'Afghanistan', 'Allemagne', 'Argentine', 'Australie', 'Autriche', 'Azerbaïdjan', 'Bangladesh', 'Belgique',
      'Biélorussie', 'Botswana', 'Bulgarie', 'Cambodge', 'Cameroun', 'Colombie', 'Danemark', 'Djibouti', 'Équateur|Équateur (pays)',
      'Éthiopie', 'Guatemala', 'Indonésie', 'Jamaïque', 'Kazakhstan', 'Lituanie', 'Luxembourg|Luxembourg (pays)',
      'Madagascar', 'Mauritanie', 'Mongolie', 'Mozambique', 'Nicaragua', 'Ouzbékistan', 'Philippines', 'Portugal',
      'Roumanie', 'Singapour', 'Slovaquie', 'Tanzanie', 'Venezuela', 'Zimbabwe', 'Norvège', 'Turquie',
    ],
    capital: [
      'Amsterdam', 'Antananarivo', 'Bratislava', 'Brazzaville', 'Bruxelles', 'Bucarest', 'Budapest', 'Bujumbura',
      'Canberra', 'Copenhague', 'Islamabad', 'Katmandou', 'Kinshasa', 'Libreville', 'Ljubljana', 'Lisbonne',
      'Montevideo', 'Nouakchott', 'Ouagadougou', 'Podgorica', 'Pretoria', 'Reykjavik', 'Stockholm', 'Tegucigalpa',
      'Varsovie', 'Vientiane', 'Washington|Washington (district de Columbia)', 'Wellington', 'Windhoek', 'Yamoussoukro',
    ],
    city: [
      'Alexandrie', 'Barcelone', 'Birmingham', 'Bordeaux', 'Casablanca', 'Édimbourg', 'Florence', 'Francfort|Francfort-sur-le-Main',
      'Grenoble', 'Hambourg', 'Hiroshima', 'Istanbul', 'Johannesburg', 'Liverpool', 'Lubumbashi', 'Manchester',
      'Marrakech', 'Marseille', 'Melbourne', 'Montpellier', 'Montréal', 'Philadelphie', 'Rotterdam', 'Shanghai',
      'Strasbourg', 'Toulouse', 'Vancouver', 'Mombasa', 'Abidjan', 'Bangalore',
    ],
    fruit: [
      'Abricot', 'Canneberge', 'Carambole|Carambole (fruit)', 'Châtaigne|Châtaigne|Chestnut', 'Clémentine', 'Framboise', 'Grenadille', 'Groseille|Groseille|Redcurrant',
      'Mandarine', 'Mangoustan', 'Mirabelle|Mirabelle de Lorraine|Mirabelle plum', 'Myrtille', 'Nectarine', 'Pamplemousse|Pamplemousse et pomélo|Grapefruit', 'Pastèque',
      'Kumquat', 'Grenade|Grenade (fruit)', 'Cacahuète|Cacahuète|Peanut', 'Noisette', 'Pistache', 'Physalis',
      'Tamarin|Tamarinier', 'Ramboutan', 'Corossol|Corossol|Soursop',
    ],
    vegetable: [
      'Artichaut', 'Asperge', 'Aubergine', 'Betterave|Betterave potagère', 'Brocoli', 'Carotte', 'Champignon',
      'Citrouille', 'Concombre', 'Courgette', 'Échalote', 'Épinard', 'Haricot', 'Poireau', 'Poivron', 'Potiron',
      'Rutabaga', 'Topinambour', 'Gingembre', 'Salsifis|Salsifis cultivé', 'Cornichon', 'Cresson|Cresson de fontaine',
    ],
    animal: [
      'Alligator', 'Antilope', 'Autruche', 'Baleine', 'Caméléon', 'Chameau', 'Chimpanzé', 'Coccinelle',
      'Crocodile|Crocodile|Crocodile', 'Dromadaire', 'Écureuil', 'Éléphant', 'Flamant|Flamant (oiseau)', 'Fourmilier', 'Gorille', 'Guépard', 'Hérisson|Hérisson|Hedgehog',
      'Hippopotame', 'Hirondelle|Hirondelle|Swallow', 'Kangourou', 'Léopard', 'Libellule', 'Moustique', 'Ornithorynque', 'Pangolin',
      'Papillon', 'Pélican', 'Perroquet|Perroquet|Parrot', 'Pieuvre|Pieuvre|Octopus', 'Rhinocéros', 'Salamandre|Salamandridae|Salamander', 'Sauterelle|Sauterelle (insecte)|Tettigoniidae', 'Scorpion', 'Colibri|Colibri|Hummingbird',
      'Chinchilla', 'Pingouin|Pingouin|Auk', 'Dauphin',
    ],
    food: [
      'Blanquette|Blanquette de veau', 'Bouillabaisse', 'Cassoulet', 'Choucroute', 'Couscous',
      'Hamburger', 'Lasagnes|Lasagne', 'Mayonnaise', 'Moussaka', 'Omelette', 'Raclette', 'Ratatouille', 'Risotto', 'Croissant|Croissant (viennoiserie)',
      'Sandwich', 'Spaghetti', 'Tartiflette', 'Tiramisu', 'Vinaigrette|Vinaigrette (sauce)', 'Guacamole', 'Brioche', 'Madeleine|Madeleine (pâtisserie)',
      'Profiterole', 'Saucisson', 'Baguette|Baguette (pain)', 'Chocolat', 'Confiture', 'Croquette',
    ],
    job: [
      'Architecte', 'Astronaute', 'Bibliothécaire', 'Boulanger', 'Charpentier', 'Chirurgien',
      'Coiffeur', 'Comptable|Comptable|Accountant', 'Cuisinier', 'Dentiste', 'Détective', 'Électricien', 'Infirmier', 'Ingénieur',
      'Jardinier', 'Journaliste', 'Mécanicien|Mécanicien automobile', 'Musicien', 'Photographe', 'Pharmacien', 'Plombier', 'Policier',
      'Pompier|Sapeur-pompier', 'Professeur|Enseignant', 'Psychologue', 'Traducteur|Traduction', 'Vétérinaire', 'Agriculteur',
      'Ambassadeur', 'Forgeron', 'Menuisier',
    ],
    sport: [
      'Athlétisme', 'Badminton', 'Baseball', 'Basketball|Basket-ball', 'Cyclisme', 'Équitation', 'Escalade',
      'Escrime', 'Football', 'Gymnastique', 'Handball', 'Haltérophilie', 'Marathon|Marathon (sport)', 'Motocross', 'Natation',
      'Parachutisme', 'Patinage|Patinage artistique', 'Pétanque', 'Plongée|Plongée sous-marine', 'Skateboard', 'Snowboard', 'Taekwondo',
      'Triathlon', 'Volleyball|Volley-ball', 'Bobsleigh', 'Kickboxing',
    ],
    brand: [
      'Volkswagen', 'Lamborghini', 'Mitsubishi', 'Mercedes|Mercedes-Benz', 'Microsoft', 'Instagram', 'Facebook',
      'Starbucks', 'Heineken', 'Panasonic', 'Playstation|PlayStation', 'Nintendo', 'Chevrolet', 'Maserati',
      'Burberry', 'Carrefour|Carrefour (entreprise)', 'Decathlon|Decathlon (entreprise)', 'Lufthansa', 'Michelin',
      'Bridgestone', 'Vodafone', 'Motorola', 'Nescafé', 'Peugeot', 'Renault', 'Citroën', 'Lacoste|Lacoste (entreprise)',
      'Orangina', 'Samsung|Samsung Electronics',
    ],
  },
};
