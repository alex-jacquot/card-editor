import type { DragEvent as ReactDragEvent } from 'react';
import type { AssetDescriptor } from '../types';

interface AssetsPanelProps {
  assetsByCategory: Record<string, AssetDescriptor[]>;
  onAssetDragStart: (event: ReactDragEvent<HTMLButtonElement>, asset: AssetDescriptor) => void;
  onAssetQuickAdd: (asset: AssetDescriptor) => void;
}

export const AssetsPanel = ({
  assetsByCategory,
  onAssetDragStart,
  onAssetQuickAdd,
}: AssetsPanelProps) => {
  return (
    <aside className="panel assets-panel">
      <header>
        <h2>Assets</h2>
        <p className="panel-subtitle">Drag onto the canvas</p>
      </header>
      <div className="assets-scroll">
        {Object.entries(assetsByCategory).map(([category, group]) => (
          <section key={category} className="asset-category">
            <h3>{category}</h3>
            <div className="asset-grid">
              {group.map((asset) => (
                <button
                  key={asset.id}
                  className="asset-tile"
                  draggable
                  onDragStart={(event: ReactDragEvent<HTMLButtonElement>) => {
                    onAssetDragStart(event, asset);
                  }}
                  onDoubleClick={() => onAssetQuickAdd(asset)}
                >
                  {asset.type === 'image' && asset.src ? (
                    <img
                      src={asset.src}
                      alt={asset.name}
                      draggable={false}
                      onDragStart={(event: ReactDragEvent<HTMLImageElement>) =>
                        event.preventDefault()
                      }
                    />
                  ) : (
                    <span className="text-placeholder">T</span>
                  )}
                  <span>{asset.name}</span>
                </button>
              ))}
            </div>
          </section>
        ))}
      </div>
    </aside>
  );
};

