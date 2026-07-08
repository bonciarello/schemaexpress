/**
 * Esporta il contenuto di un elemento DOM come immagine PNG.
 * Usa html-to-image per la conversione.
 */
import { toPng } from 'html-to-image';

/**
 * Esporta un elemento DOM come PNG e avvia il download.
 * @param {HTMLElement} node - L'elemento DOM da esportare
 * @param {string} filename - Nome del file (senza estensione)
 * @param {object} options - Opzioni aggiuntive
 */
export async function exportAsPng(node, filename = 'schema-database', options = {}) {
  if (!node) {
    throw new Error('Nessun elemento da esportare');
  }

  const defaultOptions = {
    backgroundColor: '#FAF8F5',
    pixelRatio: 2,
    style: {
      transform: 'scale(1)',
    },
    filter: (el) => {
      // Esclude elementi con classe no-export
      return !el.classList || !el.classList.contains('no-export');
    },
  };

  const mergedOptions = { ...defaultOptions, ...options };

  try {
    const dataUrl = await toPng(node, mergedOptions);

    // Avvia il download
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataUrl;
    link.click();

    return dataUrl;
  } catch (error) {
    console.error('Errore durante l\'esportazione PNG:', error);
    throw error;
  }
}

/**
 * Esporta come SVG (alternativa).
 */
export async function exportAsSvg(node, filename = 'schema-database') {
  const { toSvg } = await import('html-to-image');

  if (!node) {
    throw new Error('Nessun elemento da esportare');
  }

  try {
    const dataUrl = await toSvg(node, {
      backgroundColor: '#FAF8F5',
    });

    const link = document.createElement('a');
    link.download = `${filename}.svg`;
    link.href = dataUrl;
    link.click();

    return dataUrl;
  } catch (error) {
    console.error('Errore durante l\'esportazione SVG:', error);
    throw error;
  }
}
