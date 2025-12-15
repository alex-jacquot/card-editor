import type { DragEvent as ReactDragEvent } from 'react';
import type { Layer } from '../types';

interface LayersListProps {
  layers: Layer[];
  selectedLayerId: string | null;
  dragLayerId: string | null;
  onSelect: (layerId: string) => void;
  onDragStart: (layerId: string) => void;
  onDragEnd: () => void;
  onReorder: (targetId: string) => void;
  onUpdate: (layerId: string, patch: Partial<Layer>) => void;
}

export const LayersList = ({
  layers,
  selectedLayerId,
  dragLayerId,
  onSelect,
  onDragStart,
  onDragEnd,
  onReorder,
  onUpdate,
}: LayersListProps) => {
  return (
    <div className="layers-list">
      {layers.map((layer) => (
        <div
          key={layer.id}
          className={`layer-row ${
            layer.id === selectedLayerId ? 'active' : ''
          } ${layer.locked ? 'locked' : ''}`}
          draggable={!layer.locked}
          onDragStart={() => {
            if (!layer.locked) {
              onDragStart(layer.id);
            }
          }}
          onDragOver={(event: ReactDragEvent<HTMLDivElement>) =>
            event.preventDefault()
          }
          onDrop={() => {
            if (!layer.locked) {
              onReorder(layer.id);
              onDragEnd();
            }
          }}
          onDragEnd={onDragEnd}
          onClick={() => {
            if (!layer.locked) {
              onSelect(layer.id);
            }
          }}
        >
          <span>{layer.name}</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <small>{layer.type === 'text' ? 'TXT' : 'IMG'}</small>
            <button
              onClick={(e) => {
                e.stopPropagation();
                onUpdate(layer.id, {
                  locked: !layer.locked,
                });
              }}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '1rem',
                padding: '0.25rem',
                display: 'flex',
                alignItems: 'center',
                opacity: layer.locked ? 1 : 0.3,
                transition: 'opacity 0.2s',
              }}
              title={layer.locked ? 'Unlock layer' : 'Lock layer'}
            >
              🔒
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

