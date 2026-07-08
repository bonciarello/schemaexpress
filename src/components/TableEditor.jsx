import React from 'react';

const TYPE_OPTIONS = [
  'ID', 'TESTO', 'NUMERO', 'INTERO', 'DECIMALE',
  'DATA', 'ORA', 'DATAORA', 'BOOLEANO',
  'EMAIL', 'TELEFONO', 'URL', 'CODICE',
];

export default function TableEditor({
  table,
  onTableNameChange,
  onColumnUpdate,
  onAddColumn,
  onDeleteColumn,
  onSave,
  onClose,
  onDeleteTable,
  schema,
}) {
  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" role="dialog" aria-labelledby="editor-modal-title" aria-modal="true">
        <div className="modal__header">
          <h2 className="modal__title" id="editor-modal-title">
            Modifica tabella
          </h2>
          <button className="btn btn-ghost btn-icon" onClick={onClose} aria-label="Chiudi editor">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>

        <div className="modal__body">
          {/* Table name */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <label htmlFor="edit-table-name">Nome tabella</label>
            <input
              id="edit-table-name"
              type="text"
              value={table.name}
              onChange={(e) => onTableNameChange(e.target.value)}
              placeholder="Nome della tabella"
            />
          </div>

          {/* Columns */}
          <div style={{ marginBottom: 'var(--space-md)' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-sm)' }}>
              <label style={{ margin: 0 }}>Colonne</label>
              <button className="btn btn-outline btn-sm" onClick={onAddColumn} aria-label="Aggiungi colonna">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                Aggiungi
              </button>
            </div>

            <div style={{ overflowX: 'auto' }}>
              <table className="editor-table">
                <thead>
                  <tr>
                    <th>Nome</th>
                    <th>Etichetta</th>
                    <th>Tipo</th>
                    <th>Obbligatorio</th>
                    <th>Unico</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {table.columns.map((col, idx) => (
                    <tr key={idx}>
                      <td>
                        <input
                          type="text"
                          value={col.name}
                          onChange={(e) => onColumnUpdate(idx, 'name', e.target.value)}
                          disabled={col.primaryKey}
                          aria-label={`Nome colonna ${idx + 1}`}
                          style={{ width: '100%', minWidth: '100px' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={col.label}
                          onChange={(e) => onColumnUpdate(idx, 'label', e.target.value)}
                          aria-label={`Etichetta colonna ${idx + 1}`}
                          style={{ width: '100%', minWidth: '80px' }}
                        />
                      </td>
                      <td>
                        <select
                          value={col.type}
                          onChange={(e) => onColumnUpdate(idx, 'type', e.target.value)}
                          disabled={col.primaryKey || !!col.foreignKey}
                          aria-label={`Tipo colonna ${idx + 1}`}
                          style={{ minWidth: '100px' }}
                        >
                          {TYPE_OPTIONS.map(t => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={!col.nullable}
                          onChange={(e) => onColumnUpdate(idx, 'nullable', !e.target.checked)}
                          disabled={col.primaryKey}
                          aria-label={`Obbligatorio per colonna ${idx + 1}`}
                          style={{ width: '18px', height: '18px', cursor: col.primaryKey ? 'not-allowed' : 'pointer' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={col.unique}
                          onChange={(e) => onColumnUpdate(idx, 'unique', e.target.checked)}
                          disabled={col.primaryKey}
                          aria-label={`Unico per colonna ${idx + 1}`}
                          style={{ width: '18px', height: '18px', cursor: col.primaryKey ? 'not-allowed' : 'pointer' }}
                        />
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-icon"
                          onClick={() => onDeleteColumn(idx)}
                          disabled={col.primaryKey}
                          aria-label={`Elimina colonna ${idx + 1}`}
                          title={col.primaryKey ? 'La chiave primaria non può essere eliminata' : 'Elimina colonna'}
                          style={{ opacity: col.primaryKey ? 0.3 : 1 }}
                        >
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/></svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Foreign key info */}
          {table.columns.some(c => c.foreignKey) && (
            <div style={{
              background: 'var(--accent-bg)',
              padding: 'var(--space-sm) var(--space-md)',
              borderRadius: 'var(--radius-md)',
              fontSize: 'var(--text-xs)',
              color: 'var(--accent-dark)',
              marginBottom: 'var(--space-md)',
            }}>
              <strong>Chiavi esterne:</strong> Le colonne FK vengono gestite automaticamente dalle relazioni.
              Per modificarle, cambia la descrizione testuale e rigenera lo schema.
            </div>
          )}
        </div>

        <div className="modal__footer">
          <button
            className="btn btn-danger btn-sm"
            onClick={onDeleteTable}
            aria-label="Elimina questa tabella"
            style={{ marginRight: 'auto' }}
          >
            Elimina tabella
          </button>
          <button className="btn btn-outline" onClick={onClose}>Annulla</button>
          <button className="btn btn-primary" onClick={onSave}>Salva modifiche</button>
        </div>
      </div>
    </div>
  );
}
