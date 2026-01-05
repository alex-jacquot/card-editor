import { useRef } from 'react';
import { toPng } from 'html-to-image';
import type { Layer } from '../types';

export const useExport = (
  canvasRef: React.RefObject<HTMLDivElement>,
  layers: Layer[],
  canvasTitle: string,
  loadJSONData?: (importData: any) => Promise<void>,
  setCanvasTitle?: (title: string) => void,
) => {
  const batchExportInputRef = useRef<HTMLInputElement>(null);

  // Helper function to export current canvas as PNG blob
  const exportCanvasAsPNGBlob = async (): Promise<Blob> => {
    if (!canvasRef.current || layers.length === 0) {
      throw new Error('No layers to export');
    }

    // Add exporting class to hide selection outlines and background
    canvasRef.current.classList.add('exporting');
    
    // Wait for styles to apply
    await new Promise(resolve => setTimeout(resolve, 50));

    try {
      // Get actual rendered bounds of all layer DOM elements
      let minX = Infinity;
      let minY = Infinity;
      let maxX = -Infinity;
      let maxY = -Infinity;

      // Get the canvas container's position relative to viewport
      const canvasRect = canvasRef.current.getBoundingClientRect();

      // Find all layer elements - Rnd components create the positioned wrapper divs
      const layerElements = canvasRef.current.querySelectorAll('.react-rnd');
      
      if (layerElements.length > 0) {
        // Use actual DOM element bounds for more accurate cropping
        layerElements.forEach((element) => {
          const rect = element.getBoundingClientRect();
          const relativeX = rect.left - canvasRect.left;
          const relativeY = rect.top - canvasRect.top;
          
          minX = Math.min(minX, relativeX);
          minY = Math.min(minY, relativeY);
          maxX = Math.max(maxX, relativeX + rect.width);
          maxY = Math.max(maxY, relativeY + rect.height);
        });
        
        console.log('[Export] Using DOM element bounds', { 
          layerElementCount: layerElements.length,
          calculatedBounds: { minX, minY, maxX, maxY }
        });
      } else {
        // Fallback: Calculate from layer data if DOM elements not found
        layers.forEach((layer) => {
          const width = layer.baseSize.width * layer.scale.x;
          const height = layer.baseSize.height * layer.scale.y;
          
          // Account for rotation by calculating bounding box
          const corners = [
            { x: layer.position.x, y: layer.position.y },
            { x: layer.position.x + width, y: layer.position.y },
            { x: layer.position.x, y: layer.position.y + height },
            { x: layer.position.x + width, y: layer.position.y + height },
          ];

          // Rotate corners if needed
          if (layer.rotation !== 0) {
            const centerX = layer.position.x + width / 2;
            const centerY = layer.position.y + height / 2;
            const rad = (layer.rotation * Math.PI) / 180;
            const cos = Math.cos(rad);
            const sin = Math.sin(rad);

            corners.forEach((corner) => {
              const dx = corner.x - centerX;
              const dy = corner.y - centerY;
              corner.x = centerX + dx * cos - dy * sin;
              corner.y = centerY + dx * sin + dy * cos;
            });
          }

          corners.forEach((corner) => {
            minX = Math.min(minX, corner.x);
            minY = Math.min(minY, corner.y);
            maxX = Math.max(maxX, corner.x);
            maxY = Math.max(maxY, corner.y);
          });
        });
      }

      // Add small padding (5px on each side) and ensure we don't go negative
      const padding = 5;
      minX = Math.max(0, minX - padding);
      minY = Math.max(0, minY - padding);
      maxX = maxX + padding; // Don't limit to canvas size - export only content
      maxY = maxY + padding;

      const exportWidth = maxX - minX;
      const exportHeight = maxY - minY;

      // Validate bounds
      if (exportWidth <= 0 || exportHeight <= 0 || !isFinite(exportWidth) || !isFinite(exportHeight)) {
        throw new Error('Invalid export bounds calculated');
      }

      console.log('[Export] Calculated bounds', {
        minX,
        minY,
        maxX,
        maxY,
        exportWidth,
        exportHeight,
        canvasWidth: canvasRef.current.offsetWidth,
        canvasHeight: canvasRef.current.offsetHeight,
        layerCount: layers.length,
      });

      // Export full canvas first
      const fullDataUrl = await toPng(canvasRef.current, {
        cacheBust: true,
        pixelRatio: 2, // Higher quality
        backgroundColor: undefined, // Transparent background
      });

      // Create a temporary image to load the full export
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = reject;
        img.src = fullDataUrl;
      });

      // Create a temporary canvas to analyze the image
      const tempCanvas = document.createElement('canvas');
      tempCanvas.width = img.width;
      tempCanvas.height = img.height;
      const tempCtx = tempCanvas.getContext('2d', { willReadFrequently: true });
      if (!tempCtx) throw new Error('Could not get canvas context');
      
      tempCtx.drawImage(img, 0, 0);
      const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
      const data = imageData.data;

      // Detect background color by sampling corners and edges
      const samplePoints: number[] = [];
      const sampleSize = 10; // Sample 10 pixels from each corner
      
      // Sample corners
      for (let i = 0; i < sampleSize; i++) {
        const x = i;
        const y = i;
        const idx = (y * tempCanvas.width + x) * 4;
        samplePoints.push(data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
      }
      
      for (let i = 0; i < sampleSize; i++) {
        const x = tempCanvas.width - 1 - i;
        const y = i;
        const idx = (y * tempCanvas.width + x) * 4;
        samplePoints.push(data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
      }
      
      for (let i = 0; i < sampleSize; i++) {
        const x = i;
        const y = tempCanvas.height - 1 - i;
        const idx = (y * tempCanvas.width + x) * 4;
        samplePoints.push(data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
      }
      
      for (let i = 0; i < sampleSize; i++) {
        const x = tempCanvas.width - 1 - i;
        const y = tempCanvas.height - 1 - i;
        const idx = (y * tempCanvas.width + x) * 4;
        samplePoints.push(data[idx], data[idx + 1], data[idx + 2], data[idx + 3]);
      }

      // Find most common background color (or use transparent if most samples are transparent)
      const bgColors = new Map<string, number>();
      for (let i = 0; i < samplePoints.length; i += 4) {
        const r = samplePoints[i];
        const g = samplePoints[i + 1];
        const b = samplePoints[i + 2];
        const a = samplePoints[i + 3];
        const key = `${r},${g},${b},${a}`;
        bgColors.set(key, (bgColors.get(key) || 0) + 1);
      }
      
      let mostCommon = '';
      let maxCount = 0;
      bgColors.forEach((count, key) => {
        if (count > maxCount) {
          maxCount = count;
          mostCommon = key;
        }
      });
      
      const [bgR, bgG, bgB, bgA] = mostCommon.split(',').map(Number);
      const tolerance = 5; // Color matching tolerance

      // Function to check if a pixel matches the background
      const isBackground = (r: number, g: number, b: number, a: number): boolean => {
        if (bgA < 10) {
          // Background is transparent - check alpha
          return a < 10;
        }
        // Background has color - check RGB with tolerance
        return (
          Math.abs(r - bgR) <= tolerance &&
          Math.abs(g - bgG) <= tolerance &&
          Math.abs(b - bgB) <= tolerance
        );
      };

      // Find content bounds by scanning from edges
      let cropMinX = 0;
      let cropMinY = 0;
      let cropMaxX = tempCanvas.width;
      let cropMaxY = tempCanvas.height;

      // Scan from top
      for (let y = 0; y < tempCanvas.height; y++) {
        let hasContent = false;
        for (let x = 0; x < tempCanvas.width; x++) {
          const idx = (y * tempCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (!isBackground(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          cropMinY = y;
          break;
        }
      }

      // Scan from bottom
      for (let y = tempCanvas.height - 1; y >= 0; y--) {
        let hasContent = false;
        for (let x = 0; x < tempCanvas.width; x++) {
          const idx = (y * tempCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (!isBackground(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          cropMaxY = y + 1;
          break;
        }
      }

      // Scan from left
      for (let x = 0; x < tempCanvas.width; x++) {
        let hasContent = false;
        for (let y = cropMinY; y < cropMaxY; y++) {
          const idx = (y * tempCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (!isBackground(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          cropMinX = x;
          break;
        }
      }

      // Scan from right
      for (let x = tempCanvas.width - 1; x >= 0; x--) {
        let hasContent = false;
        for (let y = cropMinY; y < cropMaxY; y++) {
          const idx = (y * tempCanvas.width + x) * 4;
          const r = data[idx];
          const g = data[idx + 1];
          const b = data[idx + 2];
          const a = data[idx + 3];
          if (!isBackground(r, g, b, a)) {
            hasContent = true;
            break;
          }
        }
        if (hasContent) {
          cropMaxX = x + 1;
          break;
        }
      }

      // Add small padding
      const cropPadding = 5;
      cropMinX = Math.max(0, cropMinX - cropPadding);
      cropMinY = Math.max(0, cropMinY - cropPadding);
      cropMaxX = Math.min(tempCanvas.width, cropMaxX + cropPadding);
      cropMaxY = Math.min(tempCanvas.height, cropMaxY + cropPadding);

      const finalWidth = cropMaxX - cropMinX;
      const finalHeight = cropMaxY - cropMinY;

      console.log('[Export] Auto-cropped bounds', {
        cropMinX,
        cropMinY,
        cropMaxX,
        cropMaxY,
        finalWidth,
        finalHeight,
        backgroundColor: `rgba(${bgR}, ${bgG}, ${bgB}, ${bgA})`,
      });

      // Create final export canvas with cropped dimensions
      const exportCanvas = document.createElement('canvas');
      const ctx = exportCanvas.getContext('2d');
      if (!ctx) throw new Error('Could not get canvas context');

      exportCanvas.width = finalWidth;
      exportCanvas.height = finalHeight;

      // Draw the cropped portion
      ctx.drawImage(
        tempCanvas,
        cropMinX,
        cropMinY,
        finalWidth,
        finalHeight,
        0,
        0,
        finalWidth,
        finalHeight,
      );

      // Convert to blob
      return new Promise((resolve, reject) => {
        exportCanvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Failed to create blob'));
          }
        }, 'image/png');
      });
    } finally {
      // Ensure exporting class is removed even if there's an error
      canvasRef.current?.classList.remove('exporting');
    }
  };

  const handleExport = async () => {
    if (!canvasRef.current || layers.length === 0) {
      if (layers.length === 0) {
        console.warn('[Export] No layers to export');
      } else {
        console.error('[Export] Canvas ref not available');
      }
      return;
    }

    try {
      console.log('[Export] Starting PNG export', { layerCount: layers.length, canvasTitle });
      const blob = await exportCanvasAsPNGBlob();
      const defaultFilename = `${canvasTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      const filename = defaultFilename.endsWith('.png') ? defaultFilename : `${defaultFilename}.png`;
      
      // Use File System Access API to show save dialog
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'PNG Image',
              accept: { 'image/png': ['.png'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          console.log('[Export] PNG exported successfully via File System Access API', { filename });
          return;
        } catch (error: any) {
          // User cancelled, fall back to download
          if (error.name !== 'AbortError') {
            console.error('[Export] File System Access API error, falling back to download', {
              error,
              errorName: error.name,
              errorMessage: error.message,
            });
          } else {
            console.log('[Export] User cancelled file save dialog');
            return;
          }
        }
      }
      
      // Fallback to download method
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      console.log('[Export] PNG exported successfully via download', { filename });
    } catch (error) {
      console.error('[Export] PNG export failed', {
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
        layerCount: layers.length,
        canvasRefAvailable: !!canvasRef.current,
      });
    }
  };

  const handleExportJSON = async () => {
    try {
      // Export layers with asset references (not image data)
      const exportLayers = layers.map((layer) => {
        // For image layers, extract the asset path from assetId
        // assetId format: '../assets/cards/card1.png'
        // We want to store just the relative path: 'cards/card1.png'
        if (layer.type === 'image' && layer.assetId) {
          const assetPath = layer.assetId.replace(/^\.\.\/assets\//, '');
          return {
            ...layer,
            assetPath, // Store the relative asset path
            src: undefined, // Don't store src, it will be resolved from assets on import
          };
        }
        return layer;
      });

      const exportData = {
        version: '1.0.0',
        exportDate: new Date().toISOString(),
        layers: exportLayers,
        metadata: {
          canvasSize: {
            width: canvasRef.current?.offsetWidth || 0,
            height: canvasRef.current?.offsetHeight || 0,
          },
        },
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const defaultFilename = `${canvasTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.json`;
      const filename = defaultFilename.endsWith('.json') ? defaultFilename : `${defaultFilename}.json`;
      
      // Use File System Access API to show save dialog
      if ('showSaveFilePicker' in window) {
        try {
          const fileHandle = await (window as any).showSaveFilePicker({
            suggestedName: filename,
            types: [{
              description: 'JSON File',
              accept: { 'application/json': ['.json'] }
            }]
          });
          
          const writable = await fileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
          return;
        } catch (error: any) {
          // User cancelled, fall back to download
          if (error.name !== 'AbortError') {
            console.error('File System Access API error:', error);
          }
        }
      }
      
      // Fallback to download method
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('JSON export failed', error);
      alert('Unable to export JSON. Please try again.');
    }
  };

  // Process a single JSON file and export as PNG (used by both Chrome and Firefox)
  const processJSONFile = async (
    file: File,
    saveFunction: (blob: Blob, filename: string) => Promise<void>
  ): Promise<boolean> => {
    if (!loadJSONData) {
      console.error('[Batch Export] loadJSONData function not provided');
      return false;
    }

    try {
      console.log('[Batch Export] Processing file', { filename: file.name });
      const text = await file.text();
      const importData = JSON.parse(text);

      // Extract filename and set as canvas title
      const filename = file.name;
      const nameWithoutExt = filename.replace(/\.json$/i, '');
      if (setCanvasTitle) {
        setCanvasTitle(nameWithoutExt);
      }

      // Load JSON into editor
      await loadJSONData(importData);

      // Wait for canvas to render
      await new Promise(resolve => setTimeout(resolve, 200));

      // Export as PNG using the blob function
      const blob = await exportCanvasAsPNGBlob();

      // Save using the provided function
      const pngFilename = `${nameWithoutExt}.png`;
      await saveFunction(blob, pngFilename);

      console.log('[Batch Export] File processed successfully', { filename: file.name, pngFilename });
      return true;
    } catch (error) {
      console.error('[Batch Export] Failed to process file', {
        filename: file.name,
        error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : undefined,
      });
      return false;
    }
  };

  // Batch export function to process all JSON files in templates folder
  const handleBatchExport = async () => {
    // Check if File System Access API is supported (Chrome/Edge)
    if ('showDirectoryPicker' in window) {
      try {
        // Get access to templates folder
        const templatesHandle = await (window as any).showDirectoryPicker({
          mode: 'readwrite'
        });

        // Get all JSON files
        const jsonFiles: FileSystemFileHandle[] = [];
        for await (const entry of templatesHandle.values()) {
          if (entry.kind === 'file' && entry.name.endsWith('.json')) {
            jsonFiles.push(entry);
          }
        }

        if (jsonFiles.length === 0) {
          console.warn('[Batch Export] No JSON files found in the selected folder');
          return;
        }

        console.log('[Batch Export] Found JSON files', { count: jsonFiles.length });

        // Get or create previews folder
        let previewsHandle: FileSystemDirectoryHandle;
        try {
          previewsHandle = await templatesHandle.getDirectoryHandle('previews', { create: true });
          console.log('[Batch Export] Previews folder ready');
        } catch (error) {
          console.error('[Batch Export] Could not create previews folder', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
          });
          return;
        }

        const total = jsonFiles.length;
        let processed = 0;
        let failed = 0;

        // Save function for Chrome/Edge
        const saveToPreviews = async (blob: Blob, filename: string) => {
          const pngFileHandle = await previewsHandle.getFileHandle(filename, { create: true });
          const writable = await pngFileHandle.createWritable();
          await writable.write(blob);
          await writable.close();
        };

        // Process files in batches of 5 with delays
        const batchSize = 5;
        const delayBetweenBatches = 500; // 500ms delay between batches

        for (let i = 0; i < jsonFiles.length; i += batchSize) {
          const batch = jsonFiles.slice(i, i + batchSize);
          
          for (const fileHandle of batch) {
            const file = await fileHandle.getFile();
            const success = await processJSONFile(file, saveToPreviews);
            if (success) {
              processed++;
              console.log(`Exported: ${file.name.replace('.json', '.png')} (${processed}/${total})`);
            } else {
              failed++;
            }
          }

          // Delay between batches (except for the last batch)
          if (i + batchSize < jsonFiles.length) {
            await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
          }
        }

        alert(`Batch export complete!\nProcessed: ${processed}\nFailed: ${failed}\nTotal: ${total}`);
      } catch (error: any) {
        if (error.name === 'AbortError') {
          // User cancelled
          return;
        }
        console.error('Batch export failed', error);
        alert(`Batch export failed: ${error.message || 'Unknown error'}`);
      }
    } else {
      // Firefox fallback: use file input with multiple selection
      if (!batchExportInputRef.current) {
        alert('File input not available. Please refresh the page.');
        return;
      }

      // Trigger file input
      batchExportInputRef.current.click();
    }
  };

  // Handle file selection for Firefox batch export
  const handleBatchExportFiles = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    // Filter to only JSON files
    const jsonFiles = Array.from(files).filter(file => file.name.endsWith('.json'));

    if (jsonFiles.length === 0) {
      console.warn('[Batch Export] No JSON files selected');
      event.target.value = '';
      return;
    }

    console.log('[Batch Export] Processing files', { count: jsonFiles.length, files: jsonFiles.map(f => f.name) });
    const total = jsonFiles.length;
    let processed = 0;
    let failed = 0;

    // Save function for Firefox (downloads files)
    const downloadPNG = async (blob: Blob, filename: string) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = filename;
      link.href = url;
      link.click();
      URL.revokeObjectURL(url);
      // Small delay to prevent browser from blocking multiple downloads
      await new Promise(resolve => setTimeout(resolve, 100));
    };

    // Process files in batches of 3 with delays (smaller batches for Firefox)
    const batchSize = 3;
    const delayBetweenBatches = 1000; // 1 second delay between batches for Firefox

    try {
      for (let i = 0; i < jsonFiles.length; i += batchSize) {
        const batch = jsonFiles.slice(i, i + batchSize);
        
        for (const file of batch) {
          const success = await processJSONFile(file, downloadPNG);
          if (success) {
            processed++;
            console.log(`Exported: ${file.name.replace('.json', '.png')} (${processed}/${total})`);
          } else {
            failed++;
          }
        }

        // Delay between batches (except for the last batch)
        if (i + batchSize < jsonFiles.length) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
        }
      }

      console.log('[Batch Export] Complete', { processed, failed, total });
      // Keep success alert for batch export as it's informational
      alert(`Batch export complete!\nProcessed: ${processed}\nFailed: ${failed}\nTotal: ${total}\n\nNote: PNG files have been downloaded to your default download folder. You can organize them into a "previews" folder manually.`);
    } catch (error: any) {
      console.error('[Batch Export] Failed', {
        error,
        errorName: error.name,
        errorMessage: error.message,
        errorStack: error.stack,
      });
      // Keep error alert for batch export as it's a critical operation
      alert(`Batch export failed: ${error.message || 'Unknown error'}`);
    } finally {
      // Reset file input
      event.target.value = '';
    }
  };

  return {
    handleExport,
    handleExportJSON,
    handleBatchExport,
    handleBatchExportFiles,
    batchExportInputRef,
    exportCanvasAsPNGBlob,
  };
};

