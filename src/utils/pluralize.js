/**
 * Pluralizzatore italiano — trasforma il singolare in plurale.
 * Regole di base con lookup per le eccezioni più comuni.
 */

// Parole maschili in -a che fanno il plurale in -i (origine greca)
const MASCHILI_IN_A = new Set([
  'problema', 'sistema', 'tema', 'schema', 'programma', 'dramma',
  'telegramma', 'diagramma', 'poema', 'clima', 'dogma', 'enigma',
  'fantasma', 'idioma', 'panorama', 'pianeta', 'sintomo', 'teorema',
  'diploma', 'trauma', 'stigma', 'paradigma', 'anatema', 'aroma',
  'asma', 'carisma', 'enigma', 'miasma', 'plasma', 'prisma', 'scisma',
]);

// Parole invariabili (uguali singolare e plurale)
const INVARIABILI = new Set([
  'città', 'università', 'libertà', 'qualità', 'quantità', 'varietà',
  'caffè', 'tè', 'sport', 'film', 'computer', 'bar', 'gas', 'bus',
  'analisi', 'sintesi', 'crisi', 'ipotesi', 'tesi', 'oasi',
  're', 'specie', 'serie', 'superficie',
]);

// Plurali irregolari
const IRREGOLARI = {
  'uomo': 'uomini',
  'dio': 'dei',
  'bue': 'buoi',
  'tempio': 'templi',
  'ala': 'ali',
  'arma': 'armi',
  'dito': 'dita',
  'labbro': 'labbra',
  'osso': 'ossa',
  'paio': 'paia',
  'uovo': 'uova',
  'miglio': 'miglia',
  'centinaio': 'centinaia',
  'migliaio': 'migliaia',
  'orecchio': 'orecchie',
  'ginocchio': 'ginocchia',
  'lenzuolo': 'lenzuola',
};

export function pluralize(word) {
  if (!word || typeof word !== 'string') return word;
  const lower = word.toLowerCase().trim();

  // Parola vuota
  if (lower.length === 0) return word;

  // Invariabili
  if (INVARIABILI.has(lower)) return capitalizeFirst(word);

  // Irregolari
  if (IRREGOLARI[lower]) return capitalizeFirst(IRREGOLARI[lower]);

  // Maschili in -a → -i
  if (MASCHILI_IN_A.has(lower)) {
    return capitalizeFirst(lower.slice(0, -1) + 'i');
  }

  // Regole generali
  const last = lower.slice(-1);
  const lastTwo = lower.slice(-2);

  // -co / -go → -chi / -ghi (se piani) o -ci / -gi
  if (last === 'o') {
    // amico → amici, medico → medici
    if (lastTwo === 'co' || lastTwo === 'go') {
      // Default: -ci, -gi (più comune per parole di uso frequente)
      return capitalizeFirst(lower.slice(0, -2) + (lastTwo === 'co' ? 'ci' : 'gi'));
    }
    return capitalizeFirst(lower.slice(0, -1) + 'i');
  }

  if (last === 'a') {
    return capitalizeFirst(lower.slice(0, -1) + 'e');
  }

  if (last === 'e') {
    return capitalizeFirst(lower.slice(0, -1) + 'i');
  }

  // Accentate o altre
  return capitalizeFirst(lower);
}

function capitalizeFirst(str) {
  if (!str) return str;
  return str.charAt(0).toUpperCase() + str.slice(1);
}

/**
 * Tenta di risalire al singolare dal plurale (per lookup inverso).
 */
export function singularize(word) {
  if (!word || typeof word !== 'string') return word;
  const lower = word.toLowerCase().trim();

  // Controlla irregolari inversi
  for (const [sing, plur] of Object.entries(IRREGOLARI)) {
    if (plur === lower) return sing;
  }

  if (lower.endsWith('i')) {
    const candidate = lower.slice(0, -1) + 'o';
    if (MASCHILI_IN_A.has(candidate)) return candidate + 'a';
    // Potrebbe essere da -o o da -e
    return lower.slice(0, -1) + 'e';
  }
  if (lower.endsWith('e')) {
    return lower.slice(0, -1) + 'a';
  }

  return lower;
}
