import { useEffect, useRef } from 'react';
import type { DragEvent as ReactDragEvent, MouseEvent as ReactMouseEvent } from 'react';
import { useAssets } from './hooks/useAssets';
import { useLayers } from './hooks/useLayers';
import { useUndoRedo } from './hooks/useUndoRedo';
import { useLayerSelection } from './hooks/useLayerSelection';
import { useCanvas } from './hooks/useCanvas';
import { useContextMenu } from './hooks/useContextMenu';
import { useExport } from './hooks/useExport';
import { useImport } from './hooks/useImport';
import { AssetsPanel } from './components/AssetsPanel';
import { CanvasPanel } from './components/CanvasPanel';
import { LayersPanel } from './components/LayersPanel';
import { ContextMenu } from './components/ContextMenu';
import './App.css';

function App() {
  const canvasRef = useRef<HTMLDivElement>(null);
  
  // Hooks
  const { assets, assetsByCategory } = useAssets();
  const {
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
  } = useLayers();
  
  const {
    selectedLayerId,
    setSelectedLayerId,
    editingTextLayerId,
    setEditingTextLayerId,
    textEditInputRef,
  } = useLayerSelection(layers);
  
  const { contextMenu, setContextMenu } = useContextMenu();
  
  const {
    canvasTitle,
    setCanvasTitle,
    editingCanvasTitle,
    setEditingCanvasTitle,
    canvasTitleInputRef,
  } = useCanvas();
  
  const {
    handleUndo,
    handleRedo,
    canUndo,
    canRedo,
    maxHistorySize,
    updateMaxHistorySize,
  } = useUndoRedo(layers, setLayersDirect);
  
  const { handleImportJSON, loadJSONData } = useImport(
    assets,
    setLayersDirect,
    setCanvasTitle,
    setSelectedLayerId,
    async (importData: any) => {
      // This will be handled by loadJSONData
    },
  );

  const {
    handleExport,
    handleExportJSON,
    handleBatchExport,
    handleBatchExportFiles,
    batchExportInputRef,
    exportCanvasAsPNGBlob,
  } = useExport(canvasRef, layers, canvasTitle, loadJSONData, setCanvasTitle);

  // Keyboard shortcuts for undo/redo
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't intercept if user is typing in an input/textarea
      const target = event.target as HTMLElement;
      if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
        // Allow undo in text inputs, but not our custom shortcuts
        if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
          // Let browser handle default undo in text inputs
          return;
        }
      }
      
      if ((event.ctrlKey || event.metaKey) && event.key === 'z' && !event.shiftKey) {
        event.preventDefault();
        handleUndo();
      } else if (
        ((event.ctrlKey || event.metaKey) && event.key === 'y') ||
        ((event.ctrlKey || event.metaKey) && event.shiftKey && event.key === 'z')
      ) {
        event.preventDefault();
        handleRedo();
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [handleUndo, handleRedo]);

  // Handlers
  const handleCanvasDrop: React.DragEventHandler<HTMLDivElement> = (event) => {
    try {
      event.preventDefault();
      const payload = event.dataTransfer?.getData('application/x-card-asset');
      if (!payload || !canvasRef.current) {
        if (!payload) {
          console.warn('[App] No payload in drop event');
        }
        return;
      }
      const asset = JSON.parse(payload);
      const bounds = canvasRef.current.getBoundingClientRect();
      const newLayer = addLayer(asset, {
        x: event.clientX - bounds.left - 50,
        y: event.clientY - bounds.top - 50,
      });
      setSelectedLayerId(newLayer.id);
      console.log('[App] Asset dropped on canvas', { assetName: asset.name, layerId: newLayer.id });
    } catch (error) {
      console.error('[App] Error handling canvas drop', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
    }
  };

  const handleAssetQuickAdd = (asset: any) => {
    try {
      const newLayer = addLayer(asset);
      setSelectedLayerId(newLayer.id);
      console.log('[App] Asset quick added', { assetName: asset.name, layerId: newLayer.id });
    } catch (error) {
      console.error('[App] Error quick adding asset', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        asset,
      });
    }
  };

  const handleAssetDragStart = (event: ReactDragEvent<HTMLButtonElement>, asset: any) => {
    try {
      event.dataTransfer?.setData('application/x-card-asset', JSON.stringify(asset));
      event.dataTransfer.effectAllowed = 'copy';
    } catch (error) {
      console.error('[App] Error starting asset drag', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        asset,
      });
    }
  };

  const handleLayerDragStop = (layerId: string, x: number, y: number) => {
    handleTransformUpdate(layerId, { x, y }, 'position');
  };

  const handleLayerResizeStop = (
    layerId: string,
    width: number,
    height: number,
    position: { x: number; y: number },
  ) => {
    const layer = layers.find((l) => l.id === layerId);
    if (!layer) return;
    
    handleLayerUpdate(layerId, {
      position,
      scale: {
        x: Number((width / layer.baseSize.width).toFixed(2)),
        y: Number((height / layer.baseSize.height).toFixed(2)),
      },
    });
  };

  const handleContextMenuClick = (
    event: ReactMouseEvent<HTMLDivElement>,
    layerId: string,
  ) => {
    event.preventDefault();
    event.stopPropagation();
    setContextMenu({
      visible: true,
      x: event.clientX,
      y: event.clientY,
      layerId,
    });
    setSelectedLayerId(layerId);
  };

  const handleContextMenuDuplicate = () => {
    if (!contextMenu) return;
    try {
      const newLayerId = handleLayerDuplicate(contextMenu.layerId);
      if (newLayerId) {
        setSelectedLayerId(newLayerId);
        console.log('[App] Layer duplicated', { originalId: contextMenu.layerId, newId: newLayerId });
      }
      setContextMenu(null);
    } catch (error) {
      console.error('[App] Error duplicating layer', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        layerId: contextMenu.layerId,
      });
    }
  };

  const handleContextMenuDelete = () => {
    if (!contextMenu) return;
    try {
      handleLayerDelete(contextMenu.layerId);
      if (selectedLayerId === contextMenu.layerId) {
        setSelectedLayerId(null);
      }
      console.log('[App] Layer deleted', { layerId: contextMenu.layerId });
      setContextMenu(null);
    } catch (error) {
      console.error('[App] Error deleting layer', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        layerId: contextMenu.layerId,
      });
    }
  };

  const handleClear = () => {
    clearLayers();
    setSelectedLayerId(null);
  };

  const handleTitleCancel = () => {
    setCanvasTitle('Card Canvas');
    setEditingCanvasTitle(false);
  };

  const selectedLayer = layers.find((layer) => layer.id === selectedLayerId);

  return (
    <div className="app-shell">
      <AssetsPanel
        assetsByCategory={assetsByCategory}
        onAssetDragStart={handleAssetDragStart}
        onAssetQuickAdd={handleAssetQuickAdd}
      />

      <CanvasPanel
        canvasRef={canvasRef}
        layers={layers}
        canvasTitle={canvasTitle}
        editingCanvasTitle={editingCanvasTitle}
        canvasTitleInputRef={canvasTitleInputRef}
        selectedLayerId={selectedLayerId}
        editingTextLayerId={editingTextLayerId}
        textEditInputRef={textEditInputRef}
        batchExportInputRef={batchExportInputRef}
        onTitleChange={setCanvasTitle}
        onTitleEditStart={() => setEditingCanvasTitle(true)}
        onTitleEditEnd={() => setEditingCanvasTitle(false)}
        onTitleCancel={handleTitleCancel}
        onClear={handleClear}
        onUndo={handleUndo}
        onRedo={handleRedo}
        canUndo={canUndo}
        canRedo={canRedo}
        onExport={handleExport}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onBatchExport={handleBatchExport}
        onBatchExportFiles={handleBatchExportFiles}
        onCanvasDrop={handleCanvasDrop}
        onSelect={setSelectedLayerId}
        onDragStart={setSelectedLayerId}
        onDragStop={handleLayerDragStop}
        onResizeStop={handleLayerResizeStop}
        onUpdate={handleLayerUpdate}
        onTextEditStart={setEditingTextLayerId}
        onTextEditEnd={() => setEditingTextLayerId(null)}
        onContextMenu={handleContextMenuClick}
      />

      <LayersPanel
        layers={layers}
        selectedLayer={selectedLayer}
        selectedLayerId={selectedLayerId}
        dragLayerId={dragLayerId}
        maxHistorySize={maxHistorySize}
        assets={assets}
        onSelect={setSelectedLayerId}
        onDragStart={setDragLayerId}
        onDragEnd={() => setDragLayerId(null)}
        onReorder={handleLayerReorder}
        onUpdate={handleLayerUpdate}
        onTransformUpdate={handleTransformUpdate}
        onDelete={handleLayerDelete}
        onMaxHistorySizeChange={updateMaxHistorySize}
      />

      {contextMenu && (
        <ContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          layerId={contextMenu.layerId}
          onDuplicate={handleContextMenuDuplicate}
          onDelete={handleContextMenuDelete}
        />
      )}
    </div>
  );
}

export default App;
