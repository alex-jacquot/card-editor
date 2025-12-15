export type AssetType = 'image' | 'text';

export type AssetDescriptor = {
  id: string;
  name: string;
  category: string;
  src?: string;
  type: AssetType;
};

export type Layer = {
  id: string;
  assetId: string;
  name: string;
  type: AssetType;
  src?: string;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  baseSize: { width: number; height: number };
  rotation: number;
  opacity: number;
  tint: string;
  text?: string;
  transparencyColors?: [string | null, string | null]; // Up to 2 colors to make transparent
  backgroundOpacity?: number; // For text layers: 0 = transparent, 1 = opaque background
  fontSize?: number; // Font size in pixels
  fontBold?: boolean;
  fontItalic?: boolean;
  fontUnderline?: boolean;
  fontStrikethrough?: boolean;
  fontFamily?: string; // Font family name
  textAlign?: 'left' | 'center' | 'right'; // Text alignment
  locked?: boolean; // Prevent layer from being selected and moved
};

