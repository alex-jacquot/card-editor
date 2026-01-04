import type { MouseEvent as ReactMouseEvent } from 'react';
import { Rnd } from 'react-rnd';
import type { Layer } from '../types';
import { TransparentImage } from './TransparentImage';
import { TextLayerContent } from './TextLayerContent';

interface LayerItemProps {
  layer: Layer;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  textEditInputRef: React.RefObject<HTMLTextAreaElement>;
  onSelect: (layerId: string) => void;
  onDragStart: (layerId: string) => void;
  onDragStop: (layerId: string, x: number, y: number) => void;
  onResizeStop: (layerId: string, width: number, height: number, position: { x: number; y: number }) => void;
  onUpdate: (layerId: string, patch: Partial<Layer>) => void;
  onTextEditStart: (layerId: string) => void;
  onTextEditEnd: () => void;
  onContextMenu: (event: ReactMouseEvent<HTMLDivElement>, layerId: string) => void;
}

export const LayerItem = ({
  layer,
  index,
  isSelected,
  isEditing,
  textEditInputRef,
  onSelect,
  onDragStart,
  onDragStop,
  onResizeStop,
  onUpdate,
  onTextEditStart,
  onTextEditEnd,
  onContextMenu,
}: LayerItemProps) => {
  const width = layer.baseSize.width * layer.scale.x;
  const height = layer.baseSize.height * layer.scale.y;

  return (
    <Rnd
      key={layer.id}
      size={{ width, height }}
      position={{ x: layer.position.x, y: layer.position.y }}
      disableDragging={layer.locked}
      disableResizing={layer.locked}
      onDragStart={() => {
        if (!layer.locked) {
          onDragStart(layer.id);
        }
      }}
      onDragStop={(_, data) => {
        if (!layer.locked) {
          onDragStop(layer.id, data.x, data.y);
        }
      }}
      onResizeStop={(_, __, ref, ___, position) => {
        if (!layer.locked) {
          const newWidth = ref.offsetWidth;
          const newHeight = ref.offsetHeight;
          onResizeStop(
            layer.id,
            newWidth,
            newHeight,
            position,
          );
        }
      }}
      bounds="parent"
      enableResizing={
        layer.locked
          ? false
          : {
              bottom: true,
              bottomLeft: true,
              bottomRight: true,
              left: true,
              right: true,
              top: true,
              topLeft: true,
              topRight: true,
            }
      }
      style={{
        zIndex: index + 1,
        background: 'transparent',
      }}
      onClick={(event: ReactMouseEvent<HTMLDivElement>) => {
        if (layer.locked) {
          // Allow click to pass through to layers underneath
          event.stopPropagation();
          return;
        }
        event.stopPropagation();
        onSelect(layer.id);
      }}
      onContextMenu={(event: ReactMouseEvent<HTMLDivElement>) => {
        if (!layer.locked) {
          onContextMenu(event, layer.id);
        }
      }}
    >
      <div
        className={`layer-item ${
          isSelected ? 'layer-selected' : ''
        } ${layer.type === 'text' && layer.backgroundOpacity === 0 ? 'text-no-background' : ''} ${layer.type === 'image' ? 'image-layer' : ''} ${layer.type === 'text' ? 'text-layer-container' : ''}`}
        style={{
          opacity: layer.opacity,
          transform: `rotate(${layer.rotation}deg)`,
          background: 'transparent',
          border: 'none',
        }}
      >
        {layer.type === 'image' && layer.src ? (
          <>
            <TransparentImage
              src={layer.src}
              transparencyColors={layer.transparencyColors}
              alt={layer.name}
            />
            <div
              className="tint-overlay"
              style={{ backgroundColor: layer.tint }}
            />
          </>
        ) : (
          <>
            {isEditing ? (
              <textarea
                ref={textEditInputRef}
                className="text-layer-edit"
                style={{
                  color: layer.tint,
                  background:
                    layer.backgroundOpacity !== undefined
                      ? `rgba(15, 23, 42, ${0.04 * layer.backgroundOpacity})`
                      : undefined,
                  fontSize: `${layer.fontSize || 18}px`,
                  fontWeight: layer.fontBold ? 'bold' : 'normal',
                  fontStyle: layer.fontItalic ? 'italic' : 'normal',
                  fontFamily: layer.fontFamily || 'Arial',
                  textAlign: layer.textAlign || 'center',
                  textDecoration: [
                    layer.fontUnderline ? 'underline' : '',
                    layer.fontStrikethrough ? 'line-through' : '',
                  ]
                    .filter(Boolean)
                    .join(' ') || 'none',
                }}
                value={layer.text ?? ''}
                onChange={(event) =>
                  onUpdate(layer.id, {
                    text: event.target.value,
                  })
                }
                onBlur={onTextEditEnd}
                onKeyDown={(event) => {
                  if (event.key === 'Escape') {
                    onTextEditEnd();
                  }
                  if (event.key === 'Enter' && event.ctrlKey) {
                    onTextEditEnd();
                  }
                  event.stopPropagation();
                }}
                autoFocus
              />
            ) : (
              <TextLayerContent
                layer={layer}
                onDoubleClick={() => {
                  if (isSelected) {
                    onTextEditStart(layer.id);
                  }
                }}
              />
            )}
          </>
        )}
      </div>
    </Rnd>
  );
};

