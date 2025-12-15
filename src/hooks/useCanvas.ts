import { useEffect, useRef, useState } from 'react';

export const useCanvas = () => {
  const [canvasTitle, setCanvasTitle] = useState<string>(() => {
    if (typeof window === 'undefined') return 'Card Canvas';
    const stored = localStorage.getItem('card-editor:canvas-title');
    return stored || 'Card Canvas';
  });
  const [editingCanvasTitle, setEditingCanvasTitle] = useState<boolean>(false);
  const canvasTitleInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (editingCanvasTitle && canvasTitleInputRef.current) {
      canvasTitleInputRef.current.focus();
      canvasTitleInputRef.current.select();
    }
  }, [editingCanvasTitle]);

  useEffect(() => {
    try {
      localStorage.setItem('card-editor:canvas-title', canvasTitle);
    } catch (error) {
      console.error('[Canvas] Error saving canvas title to localStorage', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        canvasTitle,
      });
    }
  }, [canvasTitle]);

  return {
    canvasTitle,
    setCanvasTitle,
    editingCanvasTitle,
    setEditingCanvasTitle,
    canvasTitleInputRef,
  };
};

