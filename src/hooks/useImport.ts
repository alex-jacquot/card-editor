import type { Layer, AssetDescriptor } from '../types';

export const useImport = (
  assets: AssetDescriptor[],
  setLayers: (layers: Layer[]) => void,
  setCanvasTitle: (title: string) => void,
  setSelectedLayerId: (id: string | null) => void,
  loadJSONData: (importData: any) => Promise<void>,
) => {
  // Helper function to load JSON data into editor (without confirmation)
  const loadJSONDataInternal = async (importData: any): Promise<void> => {
    // Validate structure
    if (!importData.layers || !Array.isArray(importData.layers)) {
      throw new Error('Invalid JSON format: missing layers array');
    }

    // Restore layers by matching asset paths to current assets
    const restoredLayers = importData.layers.map((layer: Layer & { assetPath?: string; imageData?: string }): Layer => {
      if (layer.type === 'image') {
        // Try to find the asset by path
        let matchedAsset: AssetDescriptor | undefined;
        
        if (layer.assetPath) {
          // New format: match by assetPath (e.g., 'cards/card1.png')
          matchedAsset = assets.find((asset) => {
            if (asset.type !== 'image' || !asset.src) return false;
            // Extract path from asset id - handle both ../assets/ and ../../assets/ formats
            const assetPathFromId = asset.id.replace(/^\.\.\/\.\.\/assets\//, '').replace(/^\.\.\/assets\//, '');
            return assetPathFromId === layer.assetPath;
          });
        }
        
        // If not found by assetPath, try matching by assetId (normalize paths)
        if (!matchedAsset && layer.assetId) {
          // Normalize the assetId from JSON (could be ../assets/... or ../../assets/...)
          const normalizedAssetId = layer.assetId.replace(/^\.\.\/\.\.\/assets\//, '').replace(/^\.\.\/assets\//, '');
          
          matchedAsset = assets.find((asset) => {
            if (asset.type !== 'image' || !asset.src) return false;
            // Normalize the current asset id
            const normalizedCurrentId = asset.id.replace(/^\.\.\/\.\.\/assets\//, '').replace(/^\.\.\/assets\//, '');
            return normalizedCurrentId === normalizedAssetId || asset.id === layer.assetId;
          });
        }
        
        // Legacy format: try to match by imageData
        if (!matchedAsset && layer.imageData) {
          matchedAsset = assets.find((asset) => asset.id === layer.assetId);
        }

        if (matchedAsset && matchedAsset.src) {
          return {
            ...layer,
            assetId: matchedAsset.id,
            src: matchedAsset.src,
            // Remove temporary fields
            assetPath: undefined,
            imageData: undefined,
          } as Layer;
        } else {
          // Asset not found - warn but still import the layer structure
          console.warn(
            `Asset not found for layer ${layer.name}: ${layer.assetPath || layer.assetId}`,
          );
          return {
            ...layer,
            src: undefined, // Will show as missing asset
            assetPath: undefined,
            imageData: undefined,
          } as Layer;
        }
      }
      return layer as Layer;
    });

    // Ensure all layers have required fields
    const validatedLayers = restoredLayers.map((layer: Layer) => ({
      ...layer,
      transparencyColors: layer.transparencyColors || [null, null],
      backgroundOpacity:
        layer.type === 'text'
          ? layer.backgroundOpacity !== undefined
            ? layer.backgroundOpacity
            : 1
          : undefined,
      fontSize: layer.type === 'text' ? (layer.fontSize || 18) : undefined,
      fontBold: layer.type === 'text' ? (layer.fontBold || false) : undefined,
      fontItalic: layer.type === 'text' ? (layer.fontItalic || false) : undefined,
      fontUnderline: layer.type === 'text' ? (layer.fontUnderline || false) : undefined,
      fontStrikethrough: layer.type === 'text' ? (layer.fontStrikethrough || false) : undefined,
      fontFamily: layer.type === 'text' ? (layer.fontFamily || 'Arial') : undefined,
      textAlign: layer.type === 'text' ? (layer.textAlign || 'center') : undefined,
      locked: layer.locked || false,
    }));

    // Set layers without confirmation
    console.log('[Import] Loading JSON data into editor', { layerCount: validatedLayers.length });
    setLayers(validatedLayers);
    setSelectedLayerId(validatedLayers[0]?.id || null);
    console.log('[Import] JSON data loaded successfully');

    // Wait a bit for the canvas to render
    await new Promise(resolve => setTimeout(resolve, 100));
  };

  const handleImportJSON = async () => {
    try {
      let file: File | null = null;
      
      // Use File System Access API to show file picker
      if ('showOpenFilePicker' in window) {
        try {
          const [fileHandle] = await (window as any).showOpenFilePicker({
            types: [{
              description: 'JSON Files',
              accept: { 'application/json': ['.json'] }
            }],
            multiple: false
          });
          
          file = await fileHandle.getFile();
        } catch (error: any) {
          // User cancelled
          if (error.name === 'AbortError') {
            return;
          }
          throw error;
        }
      } else {
        // Fallback: create a temporary input element
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        
        await new Promise<void>((resolve, reject) => {
          input.onchange = (e: Event) => {
            const target = e.target as HTMLInputElement;
            const selectedFile = target.files?.[0];
            if (selectedFile) {
              file = selectedFile;
              resolve();
            } else {
              reject(new Error('No file selected'));
            }
          };
          input.oncancel = () => reject(new Error('File selection cancelled'));
          input.click();
        });
      }

      if (!file) {
        return;
      }

      // Extract filename without extension and set as canvas title
      const filename = file.name;
      const nameWithoutExt = filename.replace(/\.json$/i, '');
      setCanvasTitle(nameWithoutExt);
      localStorage.setItem('card-editor:canvas-title', nameWithoutExt);

      const text = await file.text();
      const importData = JSON.parse(text);

      // Validate structure
      if (!importData.layers || !Array.isArray(importData.layers)) {
        throw new Error('Invalid JSON format: missing layers array');
      }

      // Restore layers by matching asset paths to current assets
      const restoredLayers = importData.layers.map((layer: Layer & { assetPath?: string; imageData?: string }): Layer => {
        if (layer.type === 'image') {
          // Try to find the asset by path
          let matchedAsset: AssetDescriptor | undefined;
          
          if (layer.assetPath) {
            // New format: match by assetPath (e.g., 'cards/card1.png')
            matchedAsset = assets.find((asset) => {
              if (asset.type !== 'image' || !asset.src) return false;
              // Extract path from asset id - handle both ../assets/ and ../../assets/ formats
              const assetPathFromId = asset.id.replace(/^\.\.\/\.\.\/assets\//, '').replace(/^\.\.\/assets\//, '');
              return assetPathFromId === layer.assetPath;
            });
          }
          
          // If not found by assetPath, try matching by assetId (normalize paths)
          if (!matchedAsset && layer.assetId) {
            // Normalize the assetId from JSON (could be ../assets/... or ../../assets/...)
            const normalizedAssetId = layer.assetId.replace(/^\.\.\/\.\.\/assets\//, '').replace(/^\.\.\/assets\//, '');
            
            matchedAsset = assets.find((asset) => {
              if (asset.type !== 'image' || !asset.src) return false;
              // Normalize the current asset id
              const normalizedCurrentId = asset.id.replace(/^\.\.\/\.\.\/assets\//, '').replace(/^\.\.\/assets\//, '');
              return normalizedCurrentId === normalizedAssetId || asset.id === layer.assetId;
            });
          }
          
          // Legacy format: try to match by imageData
          if (!matchedAsset && layer.imageData) {
            matchedAsset = assets.find((asset) => asset.id === layer.assetId);
          }

          if (matchedAsset && matchedAsset.src) {
            return {
              ...layer,
              assetId: matchedAsset.id,
              src: matchedAsset.src,
              // Remove temporary fields
              assetPath: undefined,
              imageData: undefined,
            } as Layer;
          } else {
            // Asset not found - warn but still import the layer structure
            console.warn(
              `Asset not found for layer ${layer.name}: ${layer.assetPath || layer.assetId}`,
            );
            return {
              ...layer,
              src: undefined, // Will show as missing asset
              assetPath: undefined,
              imageData: undefined,
            } as Layer;
          }
        }
        return layer as Layer;
      });

      // Ensure all layers have required fields
      const validatedLayers = restoredLayers.map((layer: Layer) => ({
        ...layer,
        transparencyColors: layer.transparencyColors || [null, null],
        backgroundOpacity:
          layer.type === 'text'
            ? layer.backgroundOpacity !== undefined
              ? layer.backgroundOpacity
              : 1
            : undefined,
        fontSize: layer.type === 'text' ? (layer.fontSize || 18) : undefined,
        fontBold: layer.type === 'text' ? (layer.fontBold || false) : undefined,
        fontItalic: layer.type === 'text' ? (layer.fontItalic || false) : undefined,
        fontUnderline: layer.type === 'text' ? (layer.fontUnderline || false) : undefined,
        fontStrikethrough: layer.type === 'text' ? (layer.fontStrikethrough || false) : undefined,
        fontFamily: layer.type === 'text' ? (layer.fontFamily || 'Arial') : undefined,
        textAlign: layer.type === 'text' ? (layer.textAlign || 'center') : undefined,
        locked: layer.locked || false,
      }));

      // Check for missing assets and log warnings
      const missingAssets = validatedLayers.filter(
        (layer: Layer) => layer.type === 'image' && !layer.src,
      );
      if (missingAssets.length > 0) {
        const missingNames = missingAssets.map((l: Layer) => l.name).join(', ');
        console.warn(
          `[Import] Some assets could not be found: ${missingNames}. Make sure the required assets are in the assets folder.`,
          { missingAssets, availableAssets: assets.filter(a => a.type === 'image').map(a => a.name) }
        );
      }

      // Clear current layers and set imported ones
      if (
        confirm(
          'This will replace all current layers. Are you sure you want to continue?',
        )
      ) {
        console.log('[Import] Loading layers into canvas', { layerCount: validatedLayers.length });
        setLayers(validatedLayers);
        setSelectedLayerId(validatedLayers[0]?.id || null);
        console.log('[Import] Layers loaded successfully');
      } else {
        console.log('[Import] Import cancelled by user');
      }
    } catch (error) {
      console.error('[Import] JSON import failed', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      // Don't show alert, just log the error
    }
  };

  return {
    handleImportJSON,
    loadJSONData: loadJSONDataInternal,
  };
};

