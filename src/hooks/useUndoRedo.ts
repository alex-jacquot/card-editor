import { useEffect, useMemo, useRef, useState } from 'react';
import type { Layer } from '../types';
import { UNDO_HISTORY_SIZE_KEY, DEFAULT_UNDO_HISTORY_SIZE } from '../utils/constants';

export const useUndoRedo = (layers: Layer[], setLayers: (layers: Layer[]) => void) => {
  const [undoHistory, setUndoHistory] = useState<Layer[][]>(() => {
    return layers.length > 0 ? [JSON.parse(JSON.stringify(layers))] : [];
  });
  const [historyIndex, setHistoryIndex] = useState<number>(0);
  const [maxHistorySize, setMaxHistorySize] = useState<number>(() => {
    if (typeof window === 'undefined') return DEFAULT_UNDO_HISTORY_SIZE;
    const stored = localStorage.getItem(UNDO_HISTORY_SIZE_KEY);
    return stored ? parseInt(stored, 10) : DEFAULT_UNDO_HISTORY_SIZE;
  });
  const isUndoingRef = useRef(false);
  const previousLayersRef = useRef<Layer[]>(layers);

  // Save to history when layers change (but not during undo/redo)
  useEffect(() => {
    if (!isUndoingRef.current) {
      try {
        const layersChanged = JSON.stringify(previousLayersRef.current) !== JSON.stringify(layers);
        if (layersChanged) {
          setUndoHistory((prev) => {
            try {
              const newHistory = prev.slice(0, historyIndex + 1);
              const clonedLayers = JSON.parse(JSON.stringify(layers)); // Deep clone
              newHistory.push(clonedLayers);
              // Limit history size
              if (newHistory.length > maxHistorySize) {
                newHistory.shift();
                setHistoryIndex((prevIdx) => Math.max(0, prevIdx - 1));
                return newHistory;
              }
              setHistoryIndex(newHistory.length - 1);
              return newHistory;
            } catch (error) {
              console.error('[UndoRedo] Error cloning layers for history', {
                error,
                errorMessage: error instanceof Error ? error.message : 'Unknown error',
              });
              return prev; // Return previous history on error
            }
          });
          previousLayersRef.current = layers;
        }
      } catch (error) {
        console.error('[UndoRedo] Error comparing layers for history', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
  }, [layers, maxHistorySize, historyIndex]);

  // Undo function
  const handleUndo = useMemo(() => () => {
    if (historyIndex > 0) {
      try {
        isUndoingRef.current = true;
        const previousState = undoHistory[historyIndex - 1];
        const clonedState = JSON.parse(JSON.stringify(previousState)); // Deep clone
        setLayers(clonedState);
        previousLayersRef.current = clonedState;
        setHistoryIndex(historyIndex - 1);
        console.log('[UndoRedo] Undo performed', { newIndex: historyIndex - 1, historyLength: undoHistory.length });
        setTimeout(() => {
          isUndoingRef.current = false;
        }, 0);
      } catch (error) {
        console.error('[UndoRedo] Error during undo', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          historyIndex,
          historyLength: undoHistory.length,
        });
        isUndoingRef.current = false;
      }
    }
  }, [historyIndex, undoHistory, setLayers]);

  // Redo function
  const handleRedo = useMemo(() => () => {
    if (historyIndex < undoHistory.length - 1) {
      try {
        isUndoingRef.current = true;
        const nextState = undoHistory[historyIndex + 1];
        const clonedState = JSON.parse(JSON.stringify(nextState)); // Deep clone
        setLayers(clonedState);
        previousLayersRef.current = clonedState;
        setHistoryIndex(historyIndex + 1);
        console.log('[UndoRedo] Redo performed', { newIndex: historyIndex + 1, historyLength: undoHistory.length });
        setTimeout(() => {
          isUndoingRef.current = false;
        }, 0);
      } catch (error) {
        console.error('[UndoRedo] Error during redo', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          historyIndex,
          historyLength: undoHistory.length,
        });
        isUndoingRef.current = false;
      }
    }
  }, [historyIndex, undoHistory, setLayers]);

  const updateMaxHistorySize = (newSize: number) => {
    try {
      const clampedSize = Math.max(10, Math.min(200, newSize));
      setMaxHistorySize(clampedSize);
      localStorage.setItem(UNDO_HISTORY_SIZE_KEY, clampedSize.toString());
      console.log('[UndoRedo] Max history size updated', { newSize: clampedSize });
    } catch (error) {
      console.error('[UndoRedo] Error updating max history size', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        requestedSize: newSize,
      });
    }
  };

  return {
    handleUndo,
    handleRedo,
    canUndo: historyIndex > 0,
    canRedo: historyIndex < undoHistory.length - 1,
    maxHistorySize,
    updateMaxHistorySize,
  };
};

