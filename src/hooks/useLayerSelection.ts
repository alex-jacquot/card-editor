import { useEffect, useRef, useState } from 'react';
import type { Layer } from '../types';

export const useLayerSelection = (layers: Layer[]) => {
  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null);
  const [editingTextLayerId, setEditingTextLayerId] = useState<string | null>(null);
  const textEditInputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (
      selectedLayerId &&
      !layers.some((layer) => layer.id === selectedLayerId)
    ) {
      setSelectedLayerId(layers.at(-1)?.id ?? null);
    }
  }, [layers, selectedLayerId]);

  useEffect(() => {
    if (editingTextLayerId && textEditInputRef.current) {
      textEditInputRef.current.focus();
      textEditInputRef.current.select();
    }
  }, [editingTextLayerId]);

  return {
    selectedLayerId,
    setSelectedLayerId,
    editingTextLayerId,
    setEditingTextLayerId,
    textEditInputRef,
  };
};

