import React from 'react';

export default function Header({ onExportSql, onCopySql, schema }) {
  return (
    <header className="app-header" role="banner">
      <a href="./" className="app-header__brand" aria-label="SchemaExpress — Home">
        <div className="app-header__logo" aria-hidden="true">SE</div>
        <div>
          <div className="app-header__title">SchemaExpress</div>
          <div className="app-header__subtitle">dal linguaggio naturale allo schema</div>
        </div>
      </a>
      <div className="app-header__actions">
        {schema.tables.length > 0 && (
          <>
            <button className="btn btn-ghost btn-sm" onClick={onExportSql} title="Genera SQL">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <polyline points="16 18 22 12 16 6" /><polyline points="8 6 2 12 8 18" />
              </svg>
              <span className="hide-mobile">SQL</span>
            </button>
            <button className="btn btn-ghost btn-sm" onClick={onCopySql} title="Copia SQL">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              <span className="hide-mobile">Copia</span>
            </button>
          </>
        )}
      </div>
    </header>
  );
}
