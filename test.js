/**
 * Test per SchemaExpress — Parser e Pluralizzatore
 * Esegui con: node test.js
 */

import { parseDescription } from './src/utils/parser.js';
import { pluralize } from './src/utils/pluralize.js';
import { generateSQL } from './src/utils/sqlGenerator.js';

let passed = 0;
let failed = 0;

function test(name, fn) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    failed++;
    console.log(`  ✗ ${name}`);
    console.log(`    ${e.message}`);
  }
}

function assert(condition, message) {
  if (!condition) throw new Error(message || 'Assertion failed');
}

function assertEqual(actual, expected, message) {
  if (actual !== expected) {
    throw new Error(message || `Expected "${expected}", got "${actual}"`);
  }
}

function assertContains(arr, item, message) {
  if (!arr.includes(item)) {
    throw new Error(message || `Expected array to contain "${item}"`);
  }
}

console.log('\n📋 SchemaExpress — Test Suite\n');

// ==================== Pluralize Tests ====================
console.log('Pluralizzatore italiano:');

test('cliente → Clienti', () => {
  assertEqual(pluralize('cliente'), 'Clienti');
});

test('ordine → Ordini', () => {
  assertEqual(pluralize('ordine'), 'Ordini');
});

test('persona → Persone', () => {
  assertEqual(pluralize('persona'), 'Persone');
});

test('prodotto → Prodotti', () => {
  assertEqual(pluralize('prodotto'), 'Prodotti');
});

test('città → Città (invariabile)', () => {
  assertEqual(pluralize('città'), 'Città');
});

test('problema → Problemi (maschile in -a)', () => {
  assertEqual(pluralize('problema'), 'Problemi');
});

test('sistema → Sistemi', () => {
  assertEqual(pluralize('sistema'), 'Sistemi');
});

// ==================== Parser Tests ====================
console.log('\nParser descrizioni:');

test('Criterio accettazione 1: entità base con relazione', () => {
  const result = parseDescription('Ogni ordine ha un numero, una data e appartiene a un cliente.');
  assert(result.tables.length >= 2, 'Dovrebbe creare almeno 2 tabelle');

  const ordini = result.tables.find(t => t.name === 'Ordini' || t.nameSingular === 'Ordine');
  const clienti = result.tables.find(t => t.name === 'Clienti' || t.nameSingular === 'Cliente');

  assert(ordini, 'Tabella Ordini non trovata');
  assert(clienti, 'Tabella Clienti non trovata');
  assert(result.relationships.length >= 1, 'Dovrebbe esserci almeno 1 relazione');

  const rel = result.relationships[0];
  assert(rel.type === 'many-to-one', `Tipo relazione dovrebbe essere many-to-one, è ${rel.type}`);
});

test('Entità con attributi tipizzati', () => {
  const result = parseDescription('Ogni cliente ha nome, email (email, obbligatorio) e telefono.');
  assertEqual(result.tables.length, 1);
  const cliente = result.tables[0];
  assertEqual(cliente.columns.length, 4); // id + 3 attributi

  const email = cliente.columns.find(c => c.name === 'email');
  assert(email, 'Colonna email non trovata');
  assertEqual(email.type, 'EMAIL');
  assertEqual(email.nullable, false, 'Email dovrebbe essere obbligatoria');

  const nome = cliente.columns.find(c => c.name === 'nome');
  assert(nome, 'Colonna nome non trovata');
  assertEqual(nome.type, 'TESTO');
});

test('Relazione uno-a-molti', () => {
  const result = parseDescription('Ogni cliente ha molti ordini.');
  assert(result.tables.length >= 2);
  assert(result.relationships.length >= 1);

  const rel = result.relationships.find(r => r.type === 'one-to-many');
  assert(rel, 'Relazione one-to-many non trovata');
});

test('Relazione uno-a-uno', () => {
  const result = parseDescription('Ogni utente ha un indirizzo.');
  assert(result.tables.length >= 2);

  const rel = result.relationships.find(r => r.type === 'one-to-one');
  assert(rel, 'Relazione one-to-one non trovata');
});

test('Descrizione multi-entità', () => {
  const result = parseDescription(
    'Ogni cliente ha nome, email e telefono. Ogni ordine ha un numero, una data e appartiene a un cliente. Ogni ordine contiene più prodotti.'
  );
  assert(result.tables.length >= 3, `Dovrebbe creare almeno 3 tabelle, create: ${result.tables.length}`);
  assert(result.relationships.length >= 2, `Dovrebbe avere almeno 2 relazioni, trovate: ${result.relationships.length}`);

  const clienti = result.tables.find(t => t.name === 'Clienti' || t.nameSingular === 'Cliente');
  const ordini = result.tables.find(t => t.name === 'Ordini' || t.nameSingular === 'Ordine');
  const prodotti = result.tables.find(t => t.name === 'Prodotti' || t.nameSingular === 'Prodotto');

  assert(clienti, 'Tabella Clienti non trovata');
  assert(ordini, 'Tabella Ordini non trovata');
  assert(prodotti, 'Tabella Prodotti non trovata');
});

test('Input vuoto restituisce schema vuoto', () => {
  const result = parseDescription('');
  assertEqual(result.tables.length, 0);
  assertEqual(result.relationships.length, 0);
});

test('ID automatico aggiunto a ogni tabella', () => {
  const result = parseDescription('Ogni libro ha titolo e autore.');
  assertEqual(result.tables.length, 1);
  const libro = result.tables[0];
  const idCol = libro.columns.find(c => c.name === 'id');
  assert(idCol, 'Colonna ID non trovata');
  assertEqual(idCol.primaryKey, true);
  assertEqual(idCol.type, 'ID');
});

test('Attributi con vincolo unico', () => {
  const result = parseDescription('Ogni studente ha email (email, unico) e nome.');
  const studente = result.tables[0];
  const email = studente.columns.find(c => c.name === 'email');
  assert(email, 'Colonna email non trovata');
  assertEqual(email.unique, true);
});

test('Formato colonna con nome+etichetta', () => {
  const result = parseDescription('Ogni libro ha titolo e anno di pubblicazione (numero).');
  const libro = result.tables[0];
  assert(libro.columns.some(c => c.label === 'anno di pubblicazione'),
    'Colonna "anno di pubblicazione" non trovata');
  assert(libro.columns.some(c => c.type === 'NUMERO'),
    'Tipo NUMERO non assegnato');
});

// ==================== SQL Generator Tests ====================
console.log('\nGeneratore SQL:');

test('Genera CREATE TABLE', () => {
  const result = parseDescription('Ogni cliente ha nome ed email.');
  const sql = generateSQL(result.tables, result.relationships);
  assert(sql.includes('CREATE TABLE'), 'SQL dovrebbe contenere CREATE TABLE');
  assert(sql.includes('id'), 'SQL dovrebbe menzionare id');
  assert(sql.includes('nome'), 'SQL dovrebbe menzionare nome');
  assert(sql.includes('PRIMARY KEY'), 'SQL dovrebbe contenere PRIMARY KEY');
});

test('SQL con foreign key', () => {
  const result = parseDescription('Ogni ordine appartiene a un cliente.');
  const sql = generateSQL(result.tables, result.relationships);
  assert(sql.includes('REFERENCES'), 'SQL dovrebbe contenere REFERENCES per FK');
});

// ==================== Riepilogo ====================
console.log('\n' + '='.repeat(50));
console.log(`Riepilogo: ${passed} test passati, ${failed} falliti`);
console.log('='.repeat(50) + '\n');

if (failed > 0) {
  process.exit(1);
}
