import type { Layer, AssetDescriptor } from '../types';
import { LayerControls } from './LayerControls';
import { LayersList } from './LayersList';

interface LayersPanelProps {
  layers: Layer[];
  selectedLayer: Layer | undefined;
  selectedLayerId: string | null;
  dragLayerId: string | null;
  maxHistorySize: number;
  assets?: AssetDescriptor[];
  onSelect: (layerId: string) => void;
  onDragStart: (layerId: string) => void;
  onDragEnd: () => void;
  onReorder: (targetId: string) => void;
  onUpdate: (layerId: string, patch: Partial<Layer>) => void;
  onTransformUpdate: (layerId: string, transform: Partial<Layer['position'] | Layer['scale']>, kind: 'position' | 'scale') => void;
  onDelete: (layerId: string) => void;
  onMaxHistorySizeChange: (size: number) => void;
}

export const LayersPanel = ({
  layers,
  selectedLayer,
  selectedLayerId,
  dragLayerId,
  maxHistorySize,
  assets,
  onSelect,
  onDragStart,
  onDragEnd,
  onReorder,
  onUpdate,
  onTransformUpdate,
  onDelete,
  onMaxHistorySizeChange,
}: LayersPanelProps) => {
  return (
    <aside className="panel layers-panel">
      <header>
        <h2>Layers</h2>
        <p className="panel-subtitle">Drag to reorder, click to edit</p>
      </header>
      <div className="layer-controls-container">
        {selectedLayer ? (
          <LayerControls
            layer={selectedLayer}
            maxHistorySize={maxHistorySize}
            assets={assets}
            onUpdate={onUpdate}
            onTransformUpdate={onTransformUpdate}
            onDelete={onDelete}
            onMaxHistorySizeChange={onMaxHistorySizeChange}
          />
        ) : (
          <p className="layer-placeholder">Select a layer to edit its styles.</p>
        )}
      </div>
      <LayersList
        layers={layers}
        selectedLayerId={selectedLayerId}
        dragLayerId={dragLayerId}
        onSelect={onSelect}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
        onReorder={onReorder}
        onUpdate={onUpdate}
      />
    </aside>
  );
};

