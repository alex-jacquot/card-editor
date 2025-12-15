import type { RefObject } from 'react';

interface CanvasHeaderProps {
  canvasTitle: string;
  editingCanvasTitle: boolean;
  canvasTitleInputRef: RefObject<HTMLInputElement>;
  onTitleChange: (title: string) => void;
  onTitleEditStart: () => void;
  onTitleEditEnd: () => void;
  onTitleCancel: () => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onExport: () => void;
  onExportJSON: () => void;
  onImportJSON: () => void;
  onBatchExport: () => void;
  batchExportInputRef: RefObject<HTMLInputElement>;
  onBatchExportFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export const CanvasHeader = ({
  canvasTitle,
  editingCanvasTitle,
  canvasTitleInputRef,
  onTitleChange,
  onTitleEditStart,
  onTitleEditEnd,
  onTitleCancel,
  onClear,
  onUndo,
  onRedo,
  canUndo,
  canRedo,
  onExport,
  onExportJSON,
  onImportJSON,
  onBatchExport,
  batchExportInputRef,
  onBatchExportFiles,
}: CanvasHeaderProps) => {
  return (
    <header className="canvas-header">
      <div className="canvas-title-container">
        {editingCanvasTitle ? (
          <input
            ref={canvasTitleInputRef}
            type="text"
            value={canvasTitle}
            onChange={(e) => onTitleChange(e.target.value)}
            onBlur={onTitleEditEnd}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                onTitleEditEnd();
              } else if (e.key === 'Escape') {
                onTitleCancel();
              }
            }}
            className="canvas-title-input"
            style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              border: '2px solid #3b82f6',
              borderRadius: '0.5rem',
              padding: '0.5rem',
              textAlign: 'center',
              outline: 'none',
              background: '#ffffff',
            }}
          />
        ) : (
          <h1
            onClick={onTitleEditStart}
            style={{ cursor: 'pointer', userSelect: 'none' }}
            title="Click to edit title"
          >
            {canvasTitle}
          </h1>
        )}
      </div>
      <div className="canvas-actions">
        <button className="ghost" onClick={onClear}>
          Clear
        </button>
        <button onClick={onUndo} disabled={!canUndo} title="Undo (Ctrl+Z)">
          ↶ Undo
        </button>
        <button onClick={onRedo} disabled={!canRedo} title="Redo (Ctrl+Y)">
          ↷ Redo
        </button>
        <button onClick={onExport}>Export PNG</button>
        <button onClick={onExportJSON}>Export JSON</button>
        <button onClick={onImportJSON} className="import-button">
          Import JSON
        </button>
        <button
          onClick={onBatchExport}
          className="import-button"
          style={{ background: '#059669' }}
        >
          Batch Export PNGs
        </button>
        <input
          ref={batchExportInputRef}
          type="file"
          accept=".json"
          multiple
          onChange={onBatchExportFiles}
          style={{ display: 'none' }}
        />
      </div>
    </header>
  );
};

