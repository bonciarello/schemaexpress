import React, { memo } from 'react';

const COL_ICONS = {
  ID: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
    </svg>
  ),
  TESTO: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="4 7 4 4 20 4 20 7" /><line x1="9" y1="20" x2="15" y2="20" /><line x1="12" y1="4" x2="12" y2="20" />
    </svg>
  ),
  NUMERO: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <line x1="4" y1="9" x2="20" y2="9" /><line x1="4" y1="15" x2="20" y2="15" /><line x1="10" y1="3" x2="8" y2="21" /><line x1="16" y1="3" x2="14" y2="21" />
    </svg>
  ),
  DATA: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <rect x="3" y="4" width="18" height="18" rx="2" ry="2" /><line x1="16" y1="2" x2="16" y2="6" /><line x1="8" y1="2" x2="8" y2="6" /><line x1="3" y1="10" x2="21" y2="10" />
    </svg>
  ),
  EMAIL: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><polyline points="22,6 12,13 2,6" />
    </svg>
  ),
  BOOLEANO: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  ),
  DEFAULT: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
};

function getColIcon(type) {
  return COL_ICONS[type] || COL_ICONS.DEFAULT;
}

const TableCard = memo(function TableCard({ table, relationships, allTables, onDragStart, onEdit }) {
  const handlePointerDown = (e) => {
    e.preventDefault();
    onDragStart(table.id, e);
  };

  const handleDoubleClick = () => {
    onEdit(table.id);
  };

  // Get relationships involving this table
  const tableRels = relationships.filter(r => r.from === table.id || r.to === table.id);

  return (
    <div
      className="table-card"
      style={{
        left: table.position.x,
        top: table.position.y,
      }}
      onDoubleClick={handleDoubleClick}
      role="group"
      aria-label={`Tabella ${table.name}`}
    >
      <div
        className="table-card__header"
        onPointerDown={handlePointerDown}
        onTouchStart={handlePointerDown}
        style={{ cursor: 'grab' }}
        aria-label={`Intestazione ${table.name} — trascina per spostare, doppio clic per modificare`}
      >
        <span className="table-card__name">{table.name}</span>
        <span className="table-card__pk-badge" title="Doppio clic per modificare">
          {table.columns.length} col
        </span>
      </div>

      <div className="table-card__columns">
        {table.columns.map((col, idx) => {
          let badgeClass = '';
          let badgeText = '';
          if (col.primaryKey) {
            badgeClass = 'table-card__col-badge--pk';
            badgeText = 'PK';
          } else if (col.foreignKey) {
            badgeClass = 'table-card__col-badge--fk';
            badgeText = 'FK';
          } else if (col.unique) {
            badgeClass = 'table-card__col-badge--unique';
            badgeText = 'UQ';
          } else if (!col.nullable) {
            badgeClass = 'table-card__col-badge--required';
            badgeText = 'NN';
          }

          return (
            <div
              key={col.name}
              className={`table-card__column ${col.primaryKey ? 'table-card__column--pk' : ''} ${col.foreignKey ? 'table-card__column--fk' : ''}`}
            >
              <span className="table-card__col-icon">{getColIcon(col.type)}</span>
              <span className="table-card__col-name" title={col.label}>{col.label}</span>
              <span className="table-card__col-type">{col.type}</span>
              {badgeText && (
                <span className={`table-card__col-badge ${badgeClass}`}>{badgeText}</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Relationship indicators */}
      {tableRels.length > 0 && (
        <div style={{
          padding: '6px 16px',
          borderTop: '1px solid var(--border-light)',
          display: 'flex',
          flexWrap: 'wrap',
          gap: '4px',
        }}>
          {tableRels.map(rel => {
            const isFrom = rel.from === table.id;
            const otherId = isFrom ? rel.to : rel.from;
            const otherTable = allTables.find(t => t.id === otherId);
            if (!otherTable) return null;
            let relLabel = '';
            if (rel.type === 'many-to-one') relLabel = isFrom ? `→ ${otherTable.name}` : '';
            if (rel.type === 'one-to-many') relLabel = isFrom ? `→ *${otherTable.name}` : `← ${otherTable.name}`;
            if (rel.type === 'one-to-one') relLabel = isFrom ? `→1 ${otherTable.name}` : '';
            if (!relLabel) return null;
            return (
              <span
                key={rel.id}
                style={{
                  fontSize: '9px',
                  fontFamily: 'var(--font-mono)',
                  padding: '2px 6px',
                  borderRadius: '3px',
                  background: rel.type === 'many-to-one' ? 'var(--accent-bg)' : rel.type === 'one-to-many' ? 'var(--accent-green-bg)' : 'var(--primary-bg)',
                  color: rel.type === 'many-to-one' ? 'var(--accent-dark)' : rel.type === 'one-to-many' ? 'var(--accent-green)' : 'var(--primary-dark)',
                  fontWeight: 600,
                }}
              >
                {relLabel}
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
});

export default TableCard;
