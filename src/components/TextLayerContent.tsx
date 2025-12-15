import { useMemo } from 'react';
import type { Layer } from '../types';
import { parseFormattedText } from '../utils/helpers';

interface TextLayerContentProps {
  layer: Layer;
  onDoubleClick: () => void;
}

export const TextLayerContent = ({
  layer,
  onDoubleClick,
}: TextLayerContentProps) => {
  const formattedParts = useMemo(
    () => parseFormattedText(layer.text || ''),
    [layer.text],
  );

  const baseStyle: React.CSSProperties = {
    color: layer.tint,
    background:
      layer.backgroundOpacity !== undefined
        ? `rgba(15, 23, 42, ${0.04 * layer.backgroundOpacity})`
        : undefined,
    cursor: 'text',
    fontSize: `${layer.fontSize || 18}px`,
    fontFamily: layer.fontFamily || 'Arial',
    textAlign: layer.textAlign || 'center',
    fontWeight: layer.fontBold ? 'bold' : 'normal',
    fontStyle: layer.fontItalic ? 'italic' : 'normal',
    textDecoration: [
      layer.fontUnderline ? 'underline' : '',
      layer.fontStrikethrough ? 'line-through' : '',
    ]
      .filter(Boolean)
      .join(' ') || 'none',
  };

  return (
    <div
      className="text-layer"
      style={baseStyle}
      onDoubleClick={(event) => {
        event.stopPropagation();
        onDoubleClick();
      }}
    >
      <div className="text-layer-content">
        {formattedParts.map((part, index) => {
          const partStyle: React.CSSProperties = {
            fontWeight: part.bold ? 'bold' : layer.fontBold ? 'bold' : 'normal',
            fontStyle: part.italic ? 'italic' : layer.fontItalic ? 'italic' : 'normal',
            textDecoration: [
              part.underline || layer.fontUnderline ? 'underline' : '',
              part.strikethrough || layer.fontStrikethrough ? 'line-through' : '',
            ]
              .filter(Boolean)
              .join(' ') || 'none',
          };
          return (
            <span key={index} style={partStyle}>
              {part.text}
            </span>
          );
        })}
      </div>
    </div>
  );
};

