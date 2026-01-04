import type { Layer, AssetDescriptor } from '../types';
import { FONT_FAMILIES } from '../utils/constants';

interface LayerControlsProps {
  layer: Layer;
  maxHistorySize: number;
  assets?: AssetDescriptor[];
  onUpdate: (layerId: string, patch: Partial<Layer>) => void;
  onTransformUpdate: (layerId: string, transform: Partial<Layer['position'] | Layer['scale']>, kind: 'position' | 'scale') => void;
  onDelete: (layerId: string) => void;
  onMaxHistorySizeChange: (size: number) => void;
}

export const LayerControls = ({
  layer,
  maxHistorySize,
  assets = [],
  onUpdate,
  onTransformUpdate,
  onDelete,
  onMaxHistorySizeChange,
}: LayerControlsProps) => {
  // Filter to only image assets
  const imageAssets = assets.filter((asset) => asset.type === 'image' && asset.src);
  return (
    <div className="layer-controls">
      <h3>Layer Settings</h3>
      <div style={{ marginBottom: '1rem', padding: '0.75rem', background: 'rgba(15, 23, 42, 0.02)', borderRadius: '0.5rem' }}>
        <label>
          Undo History Size
          <input
            type="number"
            min="10"
            max="200"
            value={maxHistorySize}
            onChange={(event) => {
              const newSize = Math.max(10, Math.min(200, parseInt(event.target.value, 10) || 50));
              onMaxHistorySizeChange(newSize);
            }}
            style={{ marginTop: '0.25rem', width: '100%' }}
          />
          <small style={{ display: 'block', marginTop: '0.25rem', color: '#64748b', fontSize: '0.75rem' }}>
            Number of actions to remember (10-200)
          </small>
        </label>
      </div>
      <label className="checkbox-label">
        <input
          type="checkbox"
          checked={layer.locked || false}
          onChange={(event) =>
            onUpdate(layer.id, {
              locked: event.target.checked,
            })
          }
        />
        <span>🔒 Lock Layer</span>
      </label>
      <label>
        Name
        <input
          value={layer.name}
          onChange={(event) =>
            onUpdate(layer.id, {
              name: event.target.value,
            })
          }
        />
      </label>
      <label>
        Position X
        <input
          type="number"
          value={Math.round(layer.position.x)}
          onChange={(event) =>
            onTransformUpdate(
              layer.id,
              { x: Number(event.target.value) },
              'position',
            )
          }
        />
      </label>
      <label>
        Position Y
        <input
          type="number"
          value={Math.round(layer.position.y)}
          onChange={(event) =>
            onTransformUpdate(
              layer.id,
              { y: Number(event.target.value) },
              'position',
            )
          }
        />
      </label>
      <label>
        Scale X
        <input
          type="number"
          step="0.1"
          value={layer.scale.x}
          onChange={(event) =>
            onUpdate(layer.id, {
              scale: {
                ...layer.scale,
                x: Number(event.target.value),
              },
            })
          }
        />
      </label>
      <label>
        Scale Y
        <input
          type="number"
          step="0.1"
          value={layer.scale.y}
          onChange={(event) =>
            onUpdate(layer.id, {
              scale: {
                ...layer.scale,
                y: Number(event.target.value),
              },
            })
          }
        />
      </label>
      <label>
        Rotation
        <input
          type="number"
          value={layer.rotation}
          onChange={(event) =>
            onUpdate(layer.id, {
              rotation: Number(event.target.value),
            })
          }
        />
      </label>
      <label>
        Opacity
        <input
          type="range"
          min="0.1"
          max="1"
          step="0.05"
          value={layer.opacity}
          onChange={(event) =>
            onUpdate(layer.id, {
              opacity: Number(event.target.value),
            })
          }
        />
      </label>
      <label>
        Color / Tint
        <input
          type="color"
          value={layer.tint}
          onChange={(event) =>
            onUpdate(layer.id, {
              tint: event.target.value,
            })
          }
        />
      </label>
      {layer.type === 'image' && (
        <>
          <label>
            Image Source
            <select
              value={layer.assetId || ''}
              onChange={(event) => {
                const selectedAsset = imageAssets.find((asset) => asset.id === event.target.value);
                if (selectedAsset) {
                  // Only update src, assetId, and name - preserve all other attributes
                  onUpdate(layer.id, {
                    src: selectedAsset.src,
                    assetId: selectedAsset.id,
                    name: selectedAsset.name,
                  });
                }
              }}
              style={{ marginTop: '0.25rem', width: '100%' }}
            >
              <option value="">Select an image...</option>
              {imageAssets.map((asset) => (
                <option key={asset.id} value={asset.id}>
                  {asset.name}
                </option>
              ))}
            </select>
            <small className="control-hint">
              Change the image while keeping position, scale, rotation, and other properties
            </small>
          </label>
          <div className="experimental-section">
            <h4>Experimental: Color Transparency</h4>
            <p className="experimental-note">
              Select up to 2 colors to make transparent (PNG only)
            </p>
            <label>
              Transparency Color 1
              <div className="transparency-control">
                <input
                  type="color"
                  value={
                    layer.transparencyColors?.[0] || '#ffffff'
                  }
                  onChange={(event) => {
                    const colors: [string | null, string | null] = [
                      event.target.value || null,
                      layer.transparencyColors?.[1] || null,
                    ];
                    onUpdate(layer.id, {
                      transparencyColors: colors,
                    });
                  }}
                />
                <button
                  className="ghost small"
                  onClick={() => {
                    const colors: [string | null, string | null] = [
                      null,
                      layer.transparencyColors?.[1] || null,
                    ];
                    onUpdate(layer.id, {
                      transparencyColors: colors,
                    });
                  }}
                >
                  Clear
                </button>
              </div>
            </label>
            <label>
              Transparency Color 2
              <div className="transparency-control">
                <input
                  type="color"
                  value={
                    layer.transparencyColors?.[1] || '#ffffff'
                  }
                  onChange={(event) => {
                    const colors: [string | null, string | null] = [
                      layer.transparencyColors?.[0] || null,
                      event.target.value || null,
                    ];
                    onUpdate(layer.id, {
                      transparencyColors: colors,
                    });
                  }}
                />
                <button
                  className="ghost small"
                  onClick={() => {
                    const colors: [string | null, string | null] = [
                      layer.transparencyColors?.[0] || null,
                      null,
                    ];
                    onUpdate(layer.id, {
                      transparencyColors: colors,
                    });
                  }}
                >
                  Clear
                </button>
              </div>
            </label>
          </div>
        </>
      )}
      {layer.type === 'text' && (
        <>
          <label>
            Background Opacity
            <div className="background-opacity-control">
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={layer.backgroundOpacity ?? 1}
                onChange={(event) =>
                  onUpdate(layer.id, {
                    backgroundOpacity: Number(event.target.value),
                  })
                }
              />
              <span className="opacity-value">
                {Math.round((layer.backgroundOpacity ?? 1) * 100)}%
              </span>
            </div>
            <small className="control-hint">
              Set to 0% for text without background or outline
            </small>
          </label>
          <label>
            Font Size
            <input
              type="number"
              min="8"
              max="200"
              value={layer.fontSize ?? 18}
              onChange={(event) =>
                onUpdate(layer.id, {
                  fontSize: Number(event.target.value),
                })
              }
            />
          </label>
          <label>
            Font Style
            <div className="font-style-controls">
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={layer.fontBold ?? false}
                  onChange={(event) =>
                    onUpdate(layer.id, {
                      fontBold: event.target.checked,
                    })
                  }
                />
                <span>Bold</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={layer.fontItalic ?? false}
                  onChange={(event) =>
                    onUpdate(layer.id, {
                      fontItalic: event.target.checked,
                    })
                  }
                />
                <span>Italic</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={layer.fontUnderline ?? false}
                  onChange={(event) =>
                    onUpdate(layer.id, {
                      fontUnderline: event.target.checked,
                    })
                  }
                />
                <span>Underline</span>
              </label>
              <label className="checkbox-label">
                <input
                  type="checkbox"
                  checked={layer.fontStrikethrough ?? false}
                  onChange={(event) =>
                    onUpdate(layer.id, {
                      fontStrikethrough: event.target.checked,
                    })
                  }
                />
                <span>Strikethrough</span>
              </label>
            </div>
            <small className="control-hint">
              Use tags in text: *italic*, **bold**, ***bold italic***, ~~strikethrough~~, &lt;u&gt;underline&lt;/u&gt;
            </small>
          </label>
          <label>
            Font Family
            <select
              value={layer.fontFamily ?? 'Arial'}
              onChange={(event) =>
                onUpdate(layer.id, {
                  fontFamily: event.target.value,
                })
              }
            >
              {FONT_FAMILIES.map((font) => (
                <option key={font.value} value={font.value}>
                  {font.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Text Alignment
            <div className="alignment-controls">
              <button
                type="button"
                className={`alignment-button ${
                  (layer.textAlign || 'center') === 'left'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onUpdate(layer.id, {
                    textAlign: 'left',
                  })
                }
                title="Align Left"
              >
                ⬅
              </button>
              <button
                type="button"
                className={`alignment-button ${
                  (layer.textAlign || 'center') === 'center'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onUpdate(layer.id, {
                    textAlign: 'center',
                  })
                }
                title="Align Center"
              >
                ⬌
              </button>
              <button
                type="button"
                className={`alignment-button ${
                  (layer.textAlign || 'center') === 'right'
                    ? 'active'
                    : ''
                }`}
                onClick={() =>
                  onUpdate(layer.id, {
                    textAlign: 'right',
                  })
                }
                title="Align Right"
              >
                ➡
              </button>
            </div>
          </label>
          <label>
            Text Content
            <textarea
              value={layer.text ?? ''}
              onChange={(event) =>
                onUpdate(layer.id, {
                  text: event.target.value,
                })
              }
            />
          </label>
        </>
      )}
      <button
        className="danger"
        onClick={() => onDelete(layer.id)}
      >
        Delete Layer
      </button>
    </div>
  );
};

