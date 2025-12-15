import { useState } from 'react';
import type { Layer, AssetDescriptor } from '../types';
import { STORAGE_KEY } from '../utils/constants';
import { generateId, defaultBaseSize } from '../utils/helpers';

const loadInitialLayers = (): Layer[] => {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      // Ensure all layers have required fields for backward compatibility
      return parsed.map((layer) => ({
        ...layer,
        transparencyColors: layer.transparencyColors || [null, null],
        backgroundOpacity:
          layer.type === 'text'
            ? layer.backgroundOpacity !== undefined
              ? layer.backgroundOpacity
              : 1
            : undefined,
        locked: layer.locked || false,
      }));
    } else {
      console.warn('[Layers] Invalid data format in localStorage', { parsed });
    }
  } catch (error) {
    console.error('[Layers] Error loading initial layers from localStorage', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      storageKey: STORAGE_KEY,
    });
  }
  return [];
};

const addLayerFromAsset = (
  asset: AssetDescriptor,
  position: { x: number; y: number } = { x: 180, y: 160 },
): Layer => {
  const baseSize = defaultBaseSize(asset);
  return {
    id: generateId(),
    assetId: asset.id,
    name: asset.name,
    type: asset.type,
    src: asset.src,
    position,
    scale: { x: 1, y: 1 },
    baseSize,
    rotation: 0,
    opacity: 1,
    tint: asset.type === 'text' ? '#000000' : '#ffffff',
    text: asset.type === 'text' ? 'Double-click to edit text' : undefined,
    transparencyColors: [null, null],
    backgroundOpacity: asset.type === 'text' ? 1 : undefined,
    fontSize: asset.type === 'text' ? 18 : undefined,
    fontBold: asset.type === 'text' ? false : undefined,
    fontItalic: asset.type === 'text' ? false : undefined,
    fontUnderline: asset.type === 'text' ? false : undefined,
    fontStrikethrough: asset.type === 'text' ? false : undefined,
    fontFamily: asset.type === 'text' ? 'Arial' : undefined,
    textAlign: asset.type === 'text' ? 'center' : undefined,
    locked: false,
  };
};

export const useLayers = () => {
  const [layers, setLayers] = useState<Layer[]>(() => loadInitialLayers());
  const [dragLayerId, setDragLayerId] = useState<string | null>(null);

  // Save to localStorage whenever layers change
  const updateLayers = (updater: (prev: Layer[]) => Layer[]) => {
    setLayers((prev) => {
      try {
        const next = updater(prev);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
        return next;
      } catch (error) {
        console.error('[Layers] Error saving to localStorage', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
        });
        // Still return the updated layers even if localStorage fails
        return updater(prev);
      }
    });
  };

  const handleLayerUpdate = (layerId: string, patch: Partial<Layer>) => {
    updateLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              ...patch,
            }
          : layer,
      ),
    );
  };

  const handleTransformUpdate = (
    layerId: string,
    transform: Partial<Layer['position'] | Layer['scale']>,
    kind: 'position' | 'scale',
  ) => {
    updateLayers((prev) =>
      prev.map((layer) =>
        layer.id === layerId
          ? {
              ...layer,
              [kind]: {
                ...(layer as Layer)[kind],
                ...(transform as Record<string, number>),
              },
            }
          : layer,
      ),
    );
  };

  const handleLayerDelete = (layerId: string) => {
    updateLayers((prev) => prev.filter((layer) => layer.id !== layerId));
  };

  const handleLayerDuplicate = (layerId: string) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    const newLayer: Layer = {
      ...layer,
      id: generateId(),
      position: {
        x: layer.position.x + 20,
        y: layer.position.y + 20,
      },
    };
    updateLayers((prev) => [...prev, newLayer]);
    return newLayer.id;
  };

  const handleLayerReorder = (targetId: string) => {
    if (!dragLayerId || dragLayerId === targetId) return;
    updateLayers((prev) => {
      const next = [...prev];
      const from = next.findIndex((layer) => layer.id === dragLayerId);
      const to = next.findIndex((layer) => layer.id === targetId);
      if (from === -1 || to === -1) return prev;
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      return next;
    });
  };

  const addLayer = (asset: AssetDescriptor, position?: { x: number; y: number }) => {
    const newLayer = addLayerFromAsset(asset, position);
    updateLayers((prev) => [...prev, newLayer]);
    return newLayer;
  };

  const clearLayers = () => {
    updateLayers(() => []);
  };

  const setLayersDirect = (newLayers: Layer[]) => {
    updateLayers(() => newLayers);
  };

  return {
    layers,
    dragLayerId,
    setDragLayerId,
    handleLayerUpdate,
    handleTransformUpdate,
    handleLayerDelete,
    handleLayerDuplicate,
    handleLayerReorder,
    addLayer,
    clearLayers,
    setLayersDirect,
  };
};

