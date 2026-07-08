/**
 * Parser NLP italiano per descrizioni di database.
 * Trasforma frasi in italiano in uno schema di tabelle e relazioni.
 */
import { pluralize } from './pluralize.js';

// Tipi di dato riconosciuti
const TYPE_MAP = {
  'testo': 'TESTO',
  'stringa': 'TESTO',
  'string': 'TESTO',
  'varchar': 'TESTO',
  'char': 'TESTO',
  'text': 'TESTO',
  'numero': 'NUMERO',
  'numerico': 'NUMERO',
  'number': 'NUMERO',
  'int': 'INTERO',
  'integer': 'INTERO',
  'intero': 'INTERO',
  'decimale': 'DECIMALE',
  'decimal': 'DECIMALE',
  'float': 'DECIMALE',
  'double': 'DECIMALE',
  'data': 'DATA',
  'date': 'DATA',
  'ora': 'ORA',
  'time': 'ORA',
  'dataora': 'DATAORA',
  'datetime': 'DATAORA',
  'timestamp': 'DATAORA',
  'booleano': 'BOOLEANO',
  'boolean': 'BOOLEANO',
  'bool': 'BOOLEANO',
  'sì-no': 'BOOLEANO',
  'sì/no': 'BOOLEANO',
  'email': 'EMAIL',
  'mail': 'EMAIL',
  'telefono': 'TELEFONO',
  'url': 'URL',
  'link': 'URL',
  'codice': 'CODICE',
  'code': 'CODICE',
  'id': 'ID',
  'chiave': 'ID',
};

function normalizeType(raw) {
  if (!raw) return 'TESTO';
  const cleaned = raw.toLowerCase().trim().replace(/[()]/g, '');
  return TYPE_MAP[cleaned] || 'TESTO';
}

// Articoli indeterminativi (per estrarre il nome dell'entità)
const ARTICOLI_INDET = /\b(un|uno|una|un')\s+/i;

// Verbi che introducono attributi o relazioni
const ALL_VERBS = 'ha|possiede|è\s+caratterizzat[oa]\s+da|contiene|include|comprende|presenta|raccoglie|appartiene|fa\s+riferimento|è\s+associat[oa]|è\s+collegat[oa]|è\s+di|può\s+avere|riguarda';

// Pattern per riconoscere la definizione di un'entità
// Gruppi: [1] nome entità, [2] verbo, [3] attributi
const ENTITY_PATTERNS = [
  // "Ogni cliente ha nome, email e telefono"
  new RegExp(`ogni\\s+([a-zàèéìòù'']+(?:\\s+[a-zàèéìòù'']+){0,3})\\s+(${ALL_VERBS})\\s+(.+)`, 'i'),
  // "Il cliente ha nome, email e telefono"
  new RegExp(`(?:il|lo|la|l')\\s+([a-zàèéìòù'']+(?:\\s+[a-zàèéìòù'']+){0,3})\\s+(${ALL_VERBS})\\s+(.+)`, 'i'),
  // "Cliente: nome, email, telefono" (nessun verbo)
  { regex: /^([A-ZÀÈÉÌÒÙ][a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})\s*:\s*(.+)$/m, hasVerb: false },
];

// Pattern per le relazioni
const RELATION_PATTERNS = [
  // "appartiene a un cliente"
  { regex: /(?:e\s+)?appartiene\s+a\s+(?:un|uno|una|un')\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'many-to-one' },
  // "fa riferimento a un cliente"
  { regex: /(?:e\s+)?fa\s+riferimento\s+a\s+(?:un|uno|una|un')\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'many-to-one' },
  // "è associato a un cliente"
  { regex: /(?:e\s+)?è\s+associat[oa]\s+a\s+(?:un|uno|una|un')\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'many-to-one' },
  // "è collegato a un cliente"
  { regex: /(?:e\s+)?è\s+collegat[oa]\s+a\s+(?:un|uno|una|un')\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'many-to-one' },
  // "è di un cliente"
  { regex: /(?:e\s+)?è\s+di\s+(?:un|uno|una|un')\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'many-to-one' },
  // "ha un/una indirizzo"
  { regex: /(?:e\s+)?ha\s+(?:un|uno|una|un')\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})(?!\s*(?:,|e|\())/i, type: 'one-to-one' },
  // "ha molti/molte ordini"
  { regex: /(?:e\s+)?ha\s+(?:molti|molte|più|diversi|diverse|vari|varie|numerosi|numerose)\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'one-to-many' },
  // "contiene molti/molte prodotti"
  { regex: /(?:e\s+)?contiene\s+(?:molti|molte|più|diversi|diverse|vari|varie)\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'one-to-many' },
  // "può avere più ordini"
  { regex: /(?:e\s+)?può\s+avere\s+(?:più|molti|molte)\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'one-to-many' },
  // "include più prodotti"
  { regex: /(?:e\s+)?include\s+(?:più|molti|molte)\s+([a-zàèéìòù'']+(?:\s+[a-zàèéìòù'']+){0,3})/i, type: 'one-to-many' },
];

// Attributi con tipo: "nome (testo)" o "prezzo di tipo numero"
const TYPE_IN_PARENS = /^(.+?)\s*\(([^)]+)\)\s*$/;
const TYPE_CON_DEBITO = /^(.+?)\s+di\s+tipo\s+(\S+)\s*$/i;

// Vincoli
const OBBLIGATORIO = /\b(?:obbligatorio|obbligatoria|non\s+può\s+essere\s+vuoto|necessario|necessaria|richiesto|richiesta)\b/i;
const UNICO = /\b(?:unico|unica|non\s+può\s+essere\s+duplicato|non\s+duplicabile|senza\s+duplicati)\b/i;

/**
 * Estrae il nome dell'entità dal testo, rimuovendo articoli.
 */
function extractEntityName(raw) {
  return raw.trim()
    .replace(/^\s*(?:ogni|il|lo|la|l'|un|uno|una|un')\s+/i, '')
    .trim();
}

/**
 * Divide gli attributi di una lista: "nome, email e telefono" → ["nome", "email", "telefono"]
 * Gestisce parentesi per non spezzare "email (email, obbligatorio)".
 */
function splitAttributes(attrText) {
  let cleaned = attrText.trim();
  cleaned = cleaned.replace(/\.\s*$/, '');

  // Proteggi il contenuto tra parentesi: sostituisci temporaneamente
  // le virgole interne con un token univoco
  const TOKEN = '\u0001';
  const protectedParens = [];
  cleaned = cleaned.replace(/\(([^)]+)\)/g, (match, inner) => {
    const idx = protectedParens.length;
    const safe = inner.replace(/,/g, TOKEN + 'C' + TOKEN);
    protectedParens.push(safe);
    return '(' + TOKEN + 'P' + idx + TOKEN + ')';
  });

  // Prima estraiamo eventuali relazioni alla fine della frase
  const relationStart = cleaned.search(/\s+e\s+(?:appartiene|fa\s+riferimento|è\s+associat|è\s+collegat|è\s+di|ha\s+(?:un|molti|molte|più)|contiene|può\s+avere|include\s+(?:più|molti)|riguarda)/i);

  let relPart = '';
  let remaining = cleaned;
  if (relationStart >= 0) {
    relPart = remaining.slice(relationStart);
    remaining = remaining.slice(0, relationStart);
    relPart = relPart.replace(/^\s+e\s+/, '').trim();
    relPart = restoreParens(relPart, TOKEN, protectedParens);
  }

  const parts = [];
  if (remaining) {
    const normalized = remaining.replace(/\s+e\s+/g, ', ');
    const rawParts = normalized.split(/\s*,\s*/).filter(p => p.trim());
    for (const raw of rawParts) {
      parts.push(restoreParens(raw.trim(), TOKEN, protectedParens));
    }
  }

  return { attributes: parts, relationText: relPart };
}

function restoreParens(text, TOKEN, protectedParens) {
  return text.replace(new RegExp('\\(' + TOKEN + 'P(\\d+)' + TOKEN + '\\)', 'g'), (_, idx) => {
    const inner = protectedParens[parseInt(idx)];
    return '(' + inner.replace(new RegExp(TOKEN + 'C' + TOKEN, 'g'), ',') + ')';
  });
}

/**
 * Analizza un singolo attributo: "nome (testo, obbligatorio)" → { name, type, constraints }
 */
function parseAttribute(raw) {
  let name = raw.trim();
  // Rimuovi articoli indeterminativi iniziali: "un numero" → "numero"
  name = name.replace(/^(?:un|uno|una|un'|il|lo|la|l')\s+/i, '');
  let type = 'TESTO';
  let nullable = true;
  let unique = false;

  // Tipo tra parentesi
  const parenMatch = name.match(TYPE_IN_PARENS);
  if (parenMatch) {
    name = parenMatch[1].trim();
    const typeAndConstraints = parenMatch[2].trim();
    // Dentro le parentesi potrebbe esserci tipo + vincoli separati da virgola
    const tcParts = typeAndConstraints.split(/\s*,\s*/).map(p => p.trim());
    if (tcParts.length > 0) {
      type = normalizeType(tcParts[0]);
    }
    // Cerca vincoli nei restanti elementi
    const restText = tcParts.join(' ');
    if (OBBLIGATORIO.test(restText)) nullable = false;
    if (UNICO.test(restText)) unique = true;
  }

  // "di tipo X"
  const diTipoMatch = name.match(TYPE_CON_DEBITO);
  if (diTipoMatch) {
    name = diTipoMatch[1].trim();
    type = normalizeType(diTipoMatch[2]);
  }

  // Controlla vincoli sul nome originale
  if (OBBLIGATORIO.test(raw)) nullable = false;
  if (UNICO.test(raw)) unique = true;

  return { name, type, nullable, unique };
}

/**
 * Normalizza il nome di una colonna: prima lettera minuscola, sostituisce spazi con _
 */
function normalizeColumnName(name) {
  return name
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '')
    .replace(/^_+|_+$/g, '');
}

/**
 * Normalizza il nome di una entità (tabella): prima lettera maiuscola
 */
function normalizeEntityName(name) {
  return name
    .trim()
    .split(/\s+/)
    .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join('');
}

let tableCounter = 0;

/**
 * Aggiunge una relazione tra tabelle, creando la tabella target se necessario.
 */
function addRelation(sourceTableId, sourceEntityName, targetRawName, relType, tableMap, tables, relationships) {
  const targetName = extractEntityName(targetRawName);
  const targetNormalized = normalizeEntityName(targetName);
  const targetPlural = pluralize(targetName);
  let targetId = generateTableId(targetNormalized);

  // Crea la tabella target se non esiste
  if (tableMap[targetId] === undefined) {
    tableMap[targetId] = tables.length;
    tables.push({
      id: targetId,
      name: targetPlural,
      nameSingular: targetNormalized,
      columns: [],
      position: { x: 0, y: 0 },
    });
  }

  const sourceTable = tables[tableMap[sourceTableId]];
  if (!sourceTable) return;

  const sourceSingular = sourceTable.nameSingular;
  const fkColName = normalizeColumnName(targetName) + '_id';
  const sourceFkCol = normalizeColumnName(sourceSingular) + '_id';

  // Evita relazioni duplicate
  const exists = relationships.find(r =>
    r.from === sourceTableId && r.to === targetId && r.type === relType
  );
  if (exists) return;

  const relEntry = {
    id: `rel_${relationships.length}`,
    type: relType,
    fromColumn: fkColName,
    toColumn: 'id',
  };

  if (relType === 'many-to-one') {
    relEntry.from = sourceTableId;
    relEntry.to = targetId;
    relationships.push(relEntry);
    if (!sourceTable.columns.find(c => c.name === fkColName)) {
      sourceTable.columns.push({
        name: fkColName, label: targetPlural.toLowerCase(), type: 'ID',
        nullable: true, unique: false, primaryKey: false,
        foreignKey: { table: targetId, column: 'id' },
      });
    }
  } else if (relType === 'one-to-one') {
    relEntry.from = sourceTableId;
    relEntry.to = targetId;
    relationships.push(relEntry);
    if (!sourceTable.columns.find(c => c.name === fkColName)) {
      sourceTable.columns.push({
        name: fkColName, label: targetPlural.toLowerCase(), type: 'ID',
        nullable: true, unique: true, primaryKey: false,
        foreignKey: { table: targetId, column: 'id' },
      });
    }
  } else if (relType === 'one-to-many') {
    // FK va nella tabella target
    relEntry.from = sourceTableId;
    relEntry.to = targetId;
    relEntry.fromColumn = sourceFkCol;
    relationships.push(relEntry);
    const targetTable = tables[tableMap[targetId]];
    if (targetTable && !targetTable.columns.find(c => c.name === sourceFkCol)) {
      targetTable.columns.push({
        name: sourceFkCol, label: sourceSingular.toLowerCase(), type: 'ID',
        nullable: true, unique: false, primaryKey: false,
        foreignKey: { table: sourceTableId, column: 'id' },
      });
    }
  }
}

/**
 * Genera un ID univoco per una nuova tabella.
 */
function generateTableId(name) {
  tableCounter++;
  const normalized = name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '');
  return normalized || `tabella_${tableCounter}`;
}

/**
 * Parser principale: trasforma un testo descrittivo in schema.
 */
export function parseDescription(text) {
  tableCounter = 0;
  const tables = [];
  const relationships = [];
  const tableMap = {}; // normalized name → table index

  if (!text || !text.trim()) {
    return { tables, relationships };
  }

  // 1. Dividi in frasi (per punto, punto e virgola, o a capo)
  const sentences = text
    .split(/[.;\n]+/)
    .map(s => s.trim())
    .filter(s => s.length > 5); // Ignora frammenti troppo corti

  for (const sentence of sentences) {
    // 2. Cerca pattern di definizione entità
    let entityName = null;
    let attributesRaw = '';

    let matchedVerb = '';
    for (const pattern of ENTITY_PATTERNS) {
      if (pattern.regex) {
        // Pattern speciale (es. "Cliente: ...")
        const match = sentence.match(pattern.regex);
        if (match) {
          entityName = extractEntityName(match[1]);
          attributesRaw = match[2];
          matchedVerb = '';
          break;
        }
      } else {
        const match = sentence.match(pattern);
        if (match) {
          entityName = extractEntityName(match[1]);
          matchedVerb = (match[2] || '').trim();
          attributesRaw = match[3] || '';
          break;
        }
      }
    }

    // Se non troviamo un pattern entità, proviamo a cercare solo attributi
    // o relazioni standalone
    if (!entityName) {
      // Pattern: "[entità] ha un/una [altra]" - relazione standalone
      for (const rel of RELATION_PATTERNS) {
        const match = sentence.match(rel.regex);
        if (match) {
          // È una frase di sola relazione: la saltiamo per ora
          // (verrà gestita quando l'entità è definita)
        }
      }
      continue; // Passa alla prossima frase
    }

    // 3. Trova o crea la tabella per questa entità (usa il plurale)
    const normalizedName = normalizeEntityName(entityName);
    const pluralName = pluralize(entityName);

    let tableId = generateTableId(normalizedName);
    if (tableMap[tableId] !== undefined) {
      // Tabella già esistente: aggiorniamo
    } else {
      tableMap[tableId] = tables.length;
      tables.push({
        id: tableId,
        name: pluralName, // Nome visualizzato al plurale
        nameSingular: normalizedName,
        columns: [],
        position: { x: 0, y: 0 },
      });
    }

    const tableIdx = tableMap[tableId];
    const table = tables[tableIdx];

    // 4. Analizza attributi e relazioni
    if (attributesRaw) {
      // Prima verifica se l'intero attributesRaw è una relazione pura
      // Ricostruisci verbo + attributi per il matching completo
      const reconstructed = matchedVerb ? `${matchedVerb} ${attributesRaw}` : attributesRaw;
      let isPureRelation = false;
      for (const relPattern of RELATION_PATTERNS) {
        let testText = reconstructed;
        let match = testText.match(relPattern.regex);
        if (match && match[0].trim().length >= testText.trim().length - 2) {
          isPureRelation = true;
          addRelation(tableId, normalizedName, match[1], relPattern.type, tableMap, tables, relationships);
          break;
        }
      }

      if (!isPureRelation) {
        const { attributes, relationText } = splitAttributes(attributesRaw);

        // Prima di aggiungere colonne, controlla se qualche "attributo" è in realtà
        // una relazione (es. "ha molti ordini" viene catturato come attributo)
        for (const attr of attributes) {
          let handledAsRelation = false;
          for (const relPattern of RELATION_PATTERNS) {
            const match = attr.match(relPattern.regex);
            if (match && match[0].length === attr.length) {
              addRelation(tableId, normalizedName, match[1], relPattern.type, tableMap, tables, relationships);
              handledAsRelation = true;
              break;
            }
          }
          if (!handledAsRelation) {
            const parsed = parseAttribute(attr);
            if (parsed.name && parsed.name.length > 0 && parsed.name.length < 40) {
              const colName = normalizeColumnName(parsed.name);
              if (!table.columns.find(c => c.name === colName)) {
                table.columns.push({
                  name: colName,
                  label: parsed.name.trim(),
                  type: parsed.type,
                  nullable: parsed.nullable,
                  unique: parsed.unique,
                  primaryKey: false,
                  foreignKey: null,
                });
              }
            }
          }
        }

        // 5. Analizza relazioni nella parte finale della frase
        if (relationText) {
          for (const relPattern of RELATION_PATTERNS) {
            const relMatch = relationText.match(relPattern.regex);
            if (relMatch) {
              addRelation(tableId, normalizedName, relMatch[1], relPattern.type, tableMap, tables, relationships);
            }
          }
        }
      }
    }
  }

  // 6. Aggiungi colonna ID automatica a ogni tabella che non ce l'ha
  for (const table of tables) {
    if (!table.columns.find(c => c.primaryKey || c.name === 'id')) {
      table.columns.unshift({
        name: 'id',
        label: 'ID',
        type: 'ID',
        nullable: false,
        unique: true,
        primaryKey: true,
        foreignKey: null,
      });
    }
  }

  // 7. Posiziona le tabelle in una griglia automatica
  const cols = Math.min(tables.length, 3);
  const gapX = 320;
  const gapY = 260;
  tables.forEach((table, i) => {
    if (table.position.x === 0 && table.position.y === 0) {
      const col = i % cols;
      const row = Math.floor(i / cols);
      table.position = {
        x: 40 + col * gapX,
        y: 40 + row * gapY,
      };
    }
  });

  return { tables, relationships };
}

/**
 * Aggiunge una nuova tabella vuota allo schema.
 */
export function createEmptyTable(tables) {
  const id = generateTableId('nuova_tabella');
  const maxY = tables.reduce((max, t) => Math.max(max, t.position.y), 0);
  const maxX = tables.reduce((max, t) => Math.max(max, t.position.x), 0);
  return {
    id,
    name: 'NuovaTabella',
    nameSingular: 'NuovaTabella',
    columns: [
      { name: 'id', label: 'ID', type: 'ID', nullable: false, unique: true, primaryKey: true, foreignKey: null },
    ],
    position: { x: maxX > 0 ? 40 : maxX + 320, y: maxY > 0 ? 40 : maxY },
  };
}

/**
 * Genera colonne di esempio per una tabella vuota.
 */
export function addColumnToTable(table, columnData) {
  return {
    ...table,
    columns: [...table.columns, {
      name: normalizeColumnName(columnData.label || columnData.name),
      label: columnData.label || columnData.name,
      type: columnData.type || 'TESTO',
      nullable: columnData.nullable !== false,
      unique: columnData.unique || false,
      primaryKey: false,
      foreignKey: columnData.foreignKey || null,
    }],
  };
}
