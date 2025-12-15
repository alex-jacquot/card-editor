import type { DragEvent as ReactDragEvent } from 'react';
import type { Layer } from '../types';
import { CanvasHeader } from './CanvasHeader';
import { LayerItem } from './LayerItem';

interface CanvasPanelProps {
  canvasRef: React.RefObject<HTMLDivElement>;
  layers: Layer[];
  canvasTitle: string;
  editingCanvasTitle: boolean;
  canvasTitleInputRef: React.RefObject<HTMLInputElement>;
  selectedLayerId: string | null;
  editingTextLayerId: string | null;
  textEditInputRef: React.RefObject<HTMLTextAreaElement>;
  batchExportInputRef: React.RefObject<HTMLInputElement>;
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
  onBatchExportFiles: (event: React.ChangeEvent<HTMLInputElement>) => void;
  onCanvasDrop: (event: ReactDragEvent<HTMLDivElement>) => void;
  onSelect: (layerId: string) => void;
  onDragStart: (layerId: string) => void;
  onDragStop: (layerId: string, x: number, y: number) => void;
  onResizeStop: (layerId: string, width: number, height: number, position: { x: number; y: number }) => void;
  onUpdate: (layerId: string, patch: Partial<Layer>) => void;
  onTextEditStart: (layerId: string) => void;
  onTextEditEnd: () => void;
  onContextMenu: (event: React.MouseEvent<HTMLDivElement>, layerId: string) => void;
}

export const CanvasPanel = ({
  canvasRef,
  layers,
  canvasTitle,
  editingCanvasTitle,
  canvasTitleInputRef,
  selectedLayerId,
  editingTextLayerId,
  textEditInputRef,
  batchExportInputRef,
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
  onBatchExportFiles,
  onCanvasDrop,
  onSelect,
  onDragStart,
  onDragStop,
  onResizeStop,
  onUpdate,
  onTextEditStart,
  onTextEditEnd,
  onContextMenu,
}: CanvasPanelProps) => {
  return (
    <main className="canvas-panel">
      <CanvasHeader
        canvasTitle={canvasTitle}
        editingCanvasTitle={editingCanvasTitle}
        canvasTitleInputRef={canvasTitleInputRef}
        onTitleChange={onTitleChange}
        onTitleEditStart={onTitleEditStart}
        onTitleEditEnd={onTitleEditEnd}
        onTitleCancel={onTitleCancel}
        onClear={onClear}
        onUndo={onUndo}
        onRedo={onRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={onExport}
        onExportJSON={onExportJSON}
        onImportJSON={onImportJSON}
        onBatchExport={onBatchExport}
        batchExportInputRef={batchExportInputRef}
        onBatchExportFiles={onBatchExportFiles}
      />
      <div
        className="canvas-board"
        ref={canvasRef}
        onDragOver={(event: ReactDragEvent<HTMLDivElement>) => {
          event.preventDefault();
          if (event.dataTransfer) {
            event.dataTransfer.dropEffect = 'copy';
          }
        }}
        onDrop={onCanvasDrop}
      >
        {layers.length === 0 && (
          <p className="canvas-placeholder">
            Drag an asset or double-click an item to add it.
          </p>
        )}
        {layers.map((layer, index) => (
          <LayerItem
            key={layer.id}
            layer={layer}
            index={index}
            isSelected={selectedLayerId === layer.id}
            isEditing={editingTextLayerId === layer.id}
            textEditInputRef={textEditInputRef}
            onSelect={onSelect}
            onDragStart={onDragStart}
            onDragStop={onDragStop}
            onResizeStop={onResizeStop}
            onUpdate={onUpdate}
            onTextEditStart={onTextEditStart}
            onTextEditEnd={onTextEditEnd}
            onContextMenu={onContextMenu}
          />
        ))}
      </div>
    </main>
  );
};

