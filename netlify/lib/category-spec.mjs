// What counts as a right answer for each category, in Wikidata terms.
//
// - classes:     the answer is (a kind of) one of these — checked against the
//                item itself, its "instance of" (P31) and "subclass of" (P279)
// - occupations: the answer is a person whose occupation (P106) is (a kind of) one of these
// - claims:      the answer has one of these exact property values
// - capitals:    the answer is the current capital of a country
// - taxonOf:     the answer is a living thing in this branch of the tree of life
//
// `classes` and `occupations` are expanded to every subclass by
// `npm run build-categories`, which writes category-data.mjs. Re-run it after
// changing this file.

export const CATEGORY_SPEC = {
  country: { classes: ['Q6256', 'Q3624078'] }, // country, sovereign state
  capital: { capitals: true },
  // human settlement, city, municipality (French communes like Marseille), big city
  city: { classes: ['Q486972', 'Q515', 'Q15284', 'Q1549591'] },
  man: { classes: ['Q12308941', 'Q3409032'] }, // male given name, unisex given name
  woman: { classes: ['Q11879590', 'Q3409032'] }, // female given name, unisex given name
  singer: { occupations: ['Q177220', 'Q639669'], classes: ['Q215380'] }, // singer, musician; band
  car: {
    classes: ['Q1420', 'Q3231690', 'Q786820', 'Q59773381'], // car, car model, car maker, car marque
    claims: { P452: ['Q190117'], P1056: ['Q1420', 'Q752870'] }, // automotive industry; makes cars (Peugeot)
  },
  actor: { occupations: ['Q33999', 'Q245068'] }, // actor, comedian
  fruit: { classes: ['Q1364', 'Q3314483'] }, // fruit, edible fruit
  animal: { taxonOf: 'Q729', classes: ['Q729'] },
  food: { classes: ['Q2095', 'Q746549', 'Q25403900'] }, // food, dish, food ingredient
  vegetable: { classes: ['Q11004'] },
  athlete: { occupations: ['Q2066131'] },
  movie_tv: { classes: ['Q11424', 'Q5398426', 'Q15416', 'Q1261214'] }, // film, TV series, TV programme, TV show
  brand: { classes: ['Q431289', 'Q167270', 'Q4830453', 'Q783794'] }, // brand, trademark, business, company
  job: { classes: ['Q28640', 'Q12737077'] }, // occupation, profession
  sport: { classes: ['Q349', 'Q31629'] }, // sport, type of sport
};
