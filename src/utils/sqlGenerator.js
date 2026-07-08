/**
 * Generatore SQL — converte uno schema in istruzioni CREATE TABLE.
 */

const SQL_TYPE_MAP = {
  'ID': 'INTEGER',
  'TESTO': 'VARCHAR(255)',
  'NUMERO': 'NUMERIC(10,2)',
  'INTERO': 'INTEGER',
  'DECIMALE': 'DECIMAL(10,2)',
  'DATA': 'DATE',
  'ORA': 'TIME',
  'DATAORA': 'TIMESTAMP',
  'BOOLEANO': 'BOOLEAN',
  'EMAIL': 'VARCHAR(255)',
  'TELEFONO': 'VARCHAR(20)',
  'URL': 'VARCHAR(2048)',
  'CODICE': 'VARCHAR(50)',
};

/**
 * Genera istruzioni SQL CREATE TABLE per lo schema dato.
 */
export function generateSQL(tables, relationships) {
  const lines = [];
  lines.push('-- SchemaExpress — Schema generato automaticamente');
  lines.push('-- Generato il: ' + new Date().toLocaleDateString('it-IT'));
  lines.push('');

  for (const table of tables) {
    const tableName = table.name.toLowerCase().replace(/[^a-z0-9_]/g, '_');
    lines.push(`CREATE TABLE ${tableName} (`);

    const colDefs = [];

    for (const col of table.columns) {
      let sqlType = SQL_TYPE_MAP[col.type] || 'VARCHAR(255)';
      let def = `  ${col.name} ${sqlType}`;

      if (col.primaryKey) {
        def = `  ${col.name} INTEGER PRIMARY KEY AUTOINCREMENT`;
      } else {
        if (!col.nullable) {
          def += ' NOT NULL';
        }
        if (col.unique) {
          def += ' UNIQUE';
        }
      }

      // Foreign key
      if (col.foreignKey && col.foreignKey.table) {
        const refTable = col.foreignKey.table.toLowerCase().replace(/[^a-z0-9_]/g, '_');
        const refCol = col.foreignKey.column || 'id';
        def += ` REFERENCES ${refTable}(${refCol})`;
      }

      colDefs.push(def);
    }

    lines.push(colDefs.join(',\n'));
    lines.push(');');
    lines.push('');
  }

  // Aggiungi commenti sulle relazioni
  if (relationships && relationships.length > 0) {
    lines.push('-- Relazioni:');
    for (const rel of relationships) {
      const fromName = rel.from.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const toName = rel.to.toLowerCase().replace(/[^a-z0-9_]/g, '_');
      const relTypeLabels = {
        'many-to-one': `${fromName}.${rel.fromColumn} → ${toName}.${rel.toColumn} (Molti-a-Uno)`,
        'one-to-many': `${fromName}.${rel.fromColumn} → ${toName}.${rel.toColumn} (Uno-a-Molti)`,
        'one-to-one': `${fromName}.${rel.fromColumn} → ${toName}.${rel.toColumn} (Uno-a-Uno)`,
      };
      lines.push(`-- ${relTypeLabels[rel.type] || rel.type}`);
    }
  }

  return lines.join('\n');
}

/**
 * Copia il testo negli appunti.
 */
export async function copyToClipboard(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback per browser meno recenti
    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    try {
      document.execCommand('copy');
      return true;
    } catch {
      return false;
    } finally {
      document.body.removeChild(textarea);
    }
  }
}
