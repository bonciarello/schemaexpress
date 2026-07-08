import React from 'react';

export default function Toolbar({ schema, onDownloadPng, onExportSql, onCopySql, onAddTable, onClear }) {
  const { tables, relationships } = schema;
  const hasSchema = tables.length > 0;
  const totalColumns = tables.reduce((sum, t) => sum + t.columns.length, 0);

  return (
    <div className="toolbar" role="toolbar" aria-label="Azioni sullo schema">
      <button
        className="btn btn-primary btn-sm"
        onClick={onDownloadPng}
        disabled={!hasSchema}
        aria-label="Scarica il diagramma come PNG"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
        </svg>
        Scarica PNG
      </button>

      <button
        className="btn btn-outline btn-sm"
        onClick={onExportSql}
        disabled={!hasSchema}
        aria-label="Mostra il codice SQL generato"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
        </svg>
        SQL
      </button>

      <button
        className="btn btn-outline btn-sm"
        onClick={onCopySql}
        disabled={!hasSchema}
        aria-label="Copia SQL negli appunti"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
        Copia SQL
      </button>

      <div className="toolbar__divider" aria-hidden="true" />

      <button
        className="btn btn-ghost btn-sm"
        onClick={onAddTable}
        aria-label="Aggiungi una nuova tabella"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2" /><line x1="12" y1="8" x2="12" y2="16" /><line x1="8" y1="12" x2="16" y2="12" />
        </svg>
        Aggiungi tabella
      </button>

      <button
        className="btn btn-ghost btn-sm"
        onClick={onClear}
        aria-label="Azzera tutto lo schema"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
        </svg>
        Pulisci
      </button>

      {hasSchema && (
        <div className="toolbar__stats" aria-live="polite">
          {tables.length} tabell{tables.length === 1 ? 'a' : 'e'} · {totalColumns} colonn{totalColumns === 1 ? 'a' : 'e'} · {relationships.length} relazion{relationships.length === 1 ? 'e' : 'i'}
        </div>
      )}
    </div>
  );
}
