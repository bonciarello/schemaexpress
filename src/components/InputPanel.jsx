import React, { forwardRef } from 'react';

const InputPanel = forwardRef(function InputPanel({ description, onChange, onParse, onClear, examples, onExample }, ref) {
  const handleKeyDown = (e) => {
    // Ctrl+Enter or Cmd+Enter to parse
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      onParse();
    }
  };

  return (
    <aside className="input-panel" role="complementary" aria-label="Pannello descrizione">
      <label htmlFor="description-input" className="input-panel__label">
        Descrivi i tuoi dati in italiano
      </label>
      <p className="input-panel__hint">
        Scrivi frasi come «Ogni cliente ha nome, email e telefono».
        Collega le entità con «appartiene a», «ha molti», «ha un».
        Aggiungi il tipo tra parentesi: «prezzo (numero)».
      </p>

      <textarea
        id="description-input"
        ref={ref}
        className="input-panel__textarea"
        value={description}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={'Ogni cliente ha nome, email (email, obbligatorio) e telefono.\nOgni ordine ha un numero, una data e appartiene a un cliente.\nOgni ordine contiene più prodotti.'}
        aria-label="Descrizione dello schema del database in italiano"
        autoFocus
      />

      <div className="input-panel__actions">
        <button className="btn btn-accent" onClick={onParse} aria-label="Genera lo schema">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polygon points="5 3 19 12 5 21 5 3" />
          </svg>
          Genera schema
        </button>
        <button className="btn btn-outline" onClick={onClear} aria-label="Azzera tutto">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" /><path d="M10 11v6" /><path d="M14 11v6" />
          </svg>
          Pulisci
        </button>
      </div>

      <div className="examples">
        <div className="examples__title">Esempi rapidi</div>
        <div className="examples__list">
          {examples.map((ex, i) => (
            <button
              key={i}
              className="example-chip"
              onClick={() => onExample(ex.text)}
              aria-label={`Carica esempio: ${ex.label}`}
            >
              {ex.label}
            </button>
          ))}
        </div>
      </div>
    </aside>
  );
});

export default InputPanel;
