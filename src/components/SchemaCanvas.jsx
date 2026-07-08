import React, { forwardRef, useRef, useState, useEffect, useCallback } from 'react';
import TableCard from './TableCard.jsx';

const SchemaCanvas = forwardRef(function SchemaCanvas({ contentRef, schema, onTablePosition, onEditTable }, ref) {
  const { tables, relationships } = schema;
  const canvasRef = useRef(null);
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 });
  const [dragging, setDragging] = useState(null);

  // Forward the content ref for PNG export
  useEffect(() => {
    if (contentRef) {
      contentRef.current = canvasRef.current;
    }
  });

  // Update canvas size based on table positions
  useEffect(() => {
    if (tables.length === 0) {
      setCanvasSize({ width: 800, height: 600 });
      return;
    }
    let maxX = 0, maxY = 0;
    tables.forEach(t => {
      maxX = Math.max(maxX, t.position.x + 280);
      maxY = Math.max(maxY, t.position.y + 280);
    });
    // Also consider the viewport
    const vw = window.innerWidth;
    const vh = window.innerHeight;
    setCanvasSize({
      width: Math.max(maxX + 60, vw - 400),
      height: Math.max(maxY + 60, vh - 200),
    });
  }, [tables]);

  const handleDragStart = useCallback((tableId, e) => {
    const table = tables.find(t => t.id === tableId);
    if (!table) return;
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    setDragging({
      tableId,
      startX: clientX - table.position.x,
      startY: clientY - table.position.y,
    });
  }, [tables]);

  const handleDragMove = useCallback((e) => {
    if (!dragging) return;
    e.preventDefault();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;
    const canvasRect = canvasRef.current?.getBoundingClientRect();
    if (!canvasRect) return;
    const x = clientX - canvasRect.left - dragging.startX;
    const y = clientY - canvasRect.top - dragging.startY;
    onTablePosition(dragging.tableId, Math.max(0, x), Math.max(0, y));
  }, [dragging, onTablePosition]);

  const handleDragEnd = useCallback(() => {
    setDragging(null);
  }, []);

  // Global mouse/touch handlers for dragging
  useEffect(() => {
    if (!dragging) return;
    const handleMove = (e) => handleDragMove(e);
    const handleUp = () => handleDragEnd();

    window.addEventListener('mousemove', handleMove);
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchmove', handleMove, { passive: false });
    window.addEventListener('touchend', handleUp);

    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleUp);
    };
  }, [dragging, handleDragMove, handleDragEnd]);

  // Compute line paths for relationships
  const computeLinePath = (fromTable, toTable) => {
    const fromX = fromTable.position.x + 110; // center of card
    const fromY = fromTable.position.y;
    const toX = toTable.position.x + 110;
    const toY = toTable.position.y;

    // Determine best connection points (top/bottom/left/right)
    let fx, fy, tx, ty;

    // Simple heuristic: connect from right to left, or top to bottom
    const dx = toX - fromX;
    const dy = toY - fromY;

    if (Math.abs(dx) > Math.abs(dy)) {
      // Horizontal connection
      if (dx > 0) {
        fx = fromTable.position.x + 220;
        fy = fromY + 60;
        tx = toTable.position.x;
        ty = toY + 60;
      } else {
        fx = fromTable.position.x;
        fy = fromY + 60;
        tx = toTable.position.x + 220;
        ty = toY + 60;
      }
    } else {
      // Vertical connection
      if (dy > 0) {
        fx = fromX;
        fy = fromTable.position.y + 180;
        tx = toX;
        ty = toTable.position.y;
      } else {
        fx = fromX;
        fy = fromTable.position.y;
        tx = toX;
        ty = toTable.position.y + 180;
      }
    }

    const midX = (fx + tx) / 2;
    return `M ${fx} ${fy} C ${midX} ${fy}, ${midX} ${ty}, ${tx} ${ty}`;
  };

  if (tables.length === 0) {
    return (
      <div className="schema-panel" ref={ref}>
        <div className="schema-canvas" ref={canvasRef}>
          <div className="schema-canvas__empty">
            <div className="schema-canvas__empty-icon" aria-hidden="true">
              <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" opacity="0.3">
                <rect x="3" y="3" width="7" height="7" /><rect x="14" y="3" width="7" height="7" /><rect x="14" y="14" width="7" height="7" /><rect x="3" y="14" width="7" height="7" />
              </svg>
            </div>
            <p className="schema-canvas__empty-text">
              Scrivi una descrizione a sinistra e premi <strong>Genera schema</strong> per vedere il diagramma.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="schema-panel" ref={ref}>
      <div
        className="schema-canvas"
        ref={canvasRef}
        style={{ width: canvasSize.width, height: canvasSize.height }}
      >
        {/* Relationship lines (SVG overlay) */}
        <svg className="relationships-svg" width={canvasSize.width} height={canvasSize.height} aria-hidden="true">
          <defs>
            <marker id="arrowhead-mto" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--accent)" />
            </marker>
            <marker id="arrowhead-otm" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--accent-green)" />
            </marker>
            <marker id="arrowhead-oto" markerWidth="8" markerHeight="6" refX="8" refY="3" orient="auto">
              <polygon points="0 0, 8 3, 0 6" fill="var(--primary)" />
            </marker>
          </defs>
          {relationships.map(rel => {
            const fromTable = tables.find(t => t.id === rel.from);
            const toTable = tables.find(t => t.id === rel.to);
            if (!fromTable || !toTable) return null;
            const path = computeLinePath(fromTable, toTable);
            const markerMap = {
              'many-to-one': 'url(#arrowhead-mto)',
              'one-to-many': 'url(#arrowhead-otm)',
              'one-to-one': 'url(#arrowhead-oto)',
            };
            return (
              <path
                key={rel.id}
                d={path}
                className={`relationship-line relationship-line--${rel.type}`}
                markerEnd={markerMap[rel.type] || ''}
              />
            );
          })}
        </svg>

        {/* Table cards */}
        {tables.map(table => (
          <TableCard
            key={table.id}
            table={table}
            relationships={relationships}
            allTables={tables}
            onDragStart={handleDragStart}
            onEdit={onEditTable}
          />
        ))}
      </div>
    </div>
  );
});

export default SchemaCanvas;
