import React, { useState, useCallback, useRef } from 'react';
import { parseDescription, createEmptyTable, addColumnToTable } from './utils/parser.js';
import { exportAsPng } from './utils/exportPng.js';
import { generateSQL, copyToClipboard } from './utils/sqlGenerator.js';
import Header from './components/Header.jsx';
import InputPanel from './components/InputPanel.jsx';
import Toolbar from './components/Toolbar.jsx';
import SchemaCanvas from './components/SchemaCanvas.jsx';
import TableEditor from './components/TableEditor.jsx';
import Toast from './components/Toast.jsx';

const EXAMPLES = [
  {
    label: 'Negozio base',
    text: 'Ogni cliente ha nome, email (email, obbligatorio) e telefono. Ogni ordine ha un numero, una data e appartiene a un cliente. Ogni ordine contiene più prodotti.',
  },
  {
    label: 'Scuola',
    text: 'Ogni studente ha nome, cognome, data di nascita (data) e email (unico). Ogni corso ha un titolo, una descrizione e un docente. Ogni studente può frequentare più corsi.',
  },
  {
    label: 'Biblioteca',
    text: 'Ogni libro ha titolo, autore, anno (numero) e ISBN (codice, unico). Ogni utente ha nome, email e telefono. Ogni prestito ha una data inizio, una data fine e appartiene a un utente. Ogni prestito riguarda un libro.',
  },
];

export default function App() {
  const [description, setDescription] = useState('');
  const [schema, setSchema] = useState({ tables: [], relationships: [] });
  const [editingTable, setEditingTable] = useState(null);
  const [toast, setToast] = useState(null);
  const [showSql, setShowSql] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const schemaCanvasRef = useRef(null);
  const canvasContentRef = useRef(null);
  const inputRef = useRef(null);

  const showToast = useCallback((message, type = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3500);
  }, []);

  const handleParse = useCallback(() => {
    if (!description.trim()) {
      showToast('Inserisci una descrizione prima di generare lo schema.', 'error');
      return;
    }
    const result = parseDescription(description);
    setSchema(result);
    if (result.tables.length === 0) {
      showToast('Nessuna tabella trovata. Prova con frasi come "Ogni cliente ha nome, email e telefono".', 'error');
    } else {
      showToast(`Schema generato: ${result.tables.length} tabelle, ${result.relationships.length} relazioni.`);
    }
  }, [description, showToast]);

  const handleClear = useCallback(() => {
    setDescription('');
    setSchema({ tables: [], relationships: [] });
    if (inputRef.current) inputRef.current.focus();
    showToast('Schema azzerato.');
  }, [showToast]);

  const handleExample = useCallback((text) => {
    setDescription(text);
    // Auto-parse after a tick
    setTimeout(() => {
      const result = parseDescription(text);
      setSchema(result);
      showToast(`Schema generato: ${result.tables.length} tabelle, ${result.relationships.length} relazioni.`);
    }, 50);
  }, [showToast]);

  const handleDownloadPng = useCallback(async () => {
    if (!canvasContentRef.current) {
      showToast('Nessuno schema da scaricare.', 'error');
      return;
    }
    try {
      await exportAsPng(canvasContentRef.current, 'schema-database');
      showToast('Diagramma scaricato come PNG.');
    } catch (err) {
      showToast('Errore durante il download. Riprova.', 'error');
    }
  }, [showToast]);

  const handleExportSql = useCallback(() => {
    if (schema.tables.length === 0) {
      showToast('Nessuna tabella da esportare.', 'error');
      return;
    }
    const sql = generateSQL(schema.tables, schema.relationships);
    setSqlCode(sql);
    setShowSql(true);
  }, [schema, showToast]);

  const handleCopySql = useCallback(async () => {
    const sql = generateSQL(schema.tables, schema.relationships);
    const ok = await copyToClipboard(sql);
    if (ok) {
      showToast('SQL copiato negli appunti.');
    } else {
      showToast('Impossibile copiare. Seleziona e copia manualmente.', 'error');
    }
  }, [schema, showToast]);

  const handleUpdateTable = useCallback((tableId, updatedTable) => {
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map(t => t.id === tableId ? updatedTable : t),
    }));
  }, []);

  const handleDeleteTable = useCallback((tableId) => {
    setSchema(prev => ({
      tables: prev.tables.filter(t => t.id !== tableId),
      relationships: prev.relationships.filter(r => r.from !== tableId && r.to !== tableId),
    }));
    setEditingTable(null);
    showToast('Tabella rimossa.');
  }, [showToast]);

  const handleAddTable = useCallback(() => {
    setSchema(prev => {
      const newTable = createEmptyTable(prev.tables);
      return {
        ...prev,
        tables: [...prev.tables, newTable],
      };
    });
    showToast('Nuova tabella aggiunta. Modificala per personalizzarla.');
  }, [showToast]);

  const handleTablePosition = useCallback((tableId, x, y) => {
    setSchema(prev => ({
      ...prev,
      tables: prev.tables.map(t =>
        t.id === tableId ? { ...t, position: { x, y } } : t
      ),
    }));
  }, []);

  const handleEditTable = useCallback((tableId) => {
    const table = schema.tables.find(t => t.id === tableId);
    if (table) {
      setEditingTable({ ...table, columns: [...table.columns] });
    }
  }, [schema.tables]);

  const handleSaveEdit = useCallback(() => {
    if (editingTable) {
      handleUpdateTable(editingTable.id, editingTable);
      setEditingTable(null);
      showToast('Modifiche salvate.');
    }
  }, [editingTable, handleUpdateTable, showToast]);

  const handleAddColumn = useCallback(() => {
    if (!editingTable) return;
    const updated = addColumnToTable(editingTable, {
      label: 'nuovo_campo',
      name: 'nuovo_campo',
      type: 'TESTO',
    });
    setEditingTable(updated);
  }, [editingTable]);

  const handleUpdateColumn = useCallback((colIdx, field, value) => {
    if (!editingTable) return;
    const newColumns = [...editingTable.columns];
    newColumns[colIdx] = { ...newColumns[colIdx], [field]: value };
    setEditingTable({ ...editingTable, columns: newColumns });
  }, [editingTable]);

  const handleDeleteColumn = useCallback((colIdx) => {
    if (!editingTable) return;
    const col = editingTable.columns[colIdx];
    if (col.primaryKey) {
      showToast('Non puoi eliminare la chiave primaria.', 'error');
      return;
    }
    const newColumns = editingTable.columns.filter((_, i) => i !== colIdx);
    setEditingTable({ ...editingTable, columns: newColumns });
  }, [editingTable, showToast]);

  const handleEditTableName = useCallback((name) => {
    if (!editingTable) return;
    setEditingTable({ ...editingTable, name });
  }, [editingTable]);

  return (
    <div className="app">
      <Header
        onExportSql={handleExportSql}
        onCopySql={handleCopySql}
        schema={schema}
      />

      <main className="app-main">
        <InputPanel
          ref={inputRef}
          description={description}
          onChange={setDescription}
          onParse={handleParse}
          onClear={handleClear}
          examples={EXAMPLES}
          onExample={handleExample}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <Toolbar
            schema={schema}
            onDownloadPng={handleDownloadPng}
            onExportSql={handleExportSql}
            onCopySql={handleCopySql}
            onAddTable={handleAddTable}
            onClear={handleClear}
          />

          <SchemaCanvas
            ref={schemaCanvasRef}
            contentRef={canvasContentRef}
            schema={schema}
            onTablePosition={handleTablePosition}
            onEditTable={handleEditTable}
          />
        </div>
      </main>

      <footer className="app-footer">
        <span>SchemaExpress</span>
        <span>·</span>
        <span>Descrivi i tuoi dati in italiano</span>
        <span>·</span>
        <a href="https://cristianporco.it/app/schemaexpress/" target="_blank" rel="noopener">cristianporco.it</a>
      </footer>

      {editingTable && (
        <TableEditor
          table={editingTable}
          onTableNameChange={handleEditTableName}
          onColumnUpdate={handleUpdateColumn}
          onAddColumn={handleAddColumn}
          onDeleteColumn={handleDeleteColumn}
          onSave={handleSaveEdit}
          onClose={() => setEditingTable(null)}
          onDeleteTable={() => handleDeleteTable(editingTable.id)}
          schema={schema}
        />
      )}

      {showSql && (
        <SqlModal sql={sqlCode} onClose={() => setShowSql(false)} onCopy={handleCopySql} />
      )}

      {toast && (
        <Toast message={toast.message} type={toast.type} onDismiss={() => setToast(null)} />
      )}
    </div>
  );
}

function SqlModal({ sql, onClose, onCopy }) {
  const handleCopy = async () => {
    const ok = await copyToClipboard(sql);
    // toast will come from parent
    onCopy();
  };

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-labelledby="sql-modal-title" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title" id="sql-modal-title">SQL Generato</h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Chiudi">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
        <div className="modal__body">
          <pre style={{
            background: '#1E1E24',
            color: '#E8E8E8',
            padding: 'var(--space-lg)',
            borderRadius: 'var(--radius-md)',
            fontSize: 'var(--text-xs)',
            fontFamily: 'var(--font-mono)',
            lineHeight: 1.7,
            overflowX: 'auto',
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
          }}>
            {sql}
          </pre>
        </div>
        <div className="modal__footer">
          <button className="btn btn-outline" onClick={onClose}>Chiudi</button>
          <button className="btn btn-primary" onClick={handleCopy}>Copia SQL</button>
        </div>
      </div>
    </div>
  );
}
