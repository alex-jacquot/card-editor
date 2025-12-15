import { useEffect, useRef, useState } from 'react';
import { hexToRgb, colorMatches } from '../utils/helpers';

interface TransparentImageProps {
  src: string;
  transparencyColors?: [string | null, string | null];
  alt: string;
}

export const TransparentImage = ({
  src,
  transparencyColors,
  alt,
}: TransparentImageProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [processedSrc, setProcessedSrc] = useState<string | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Reset processed src if no transparency colors
    if (!transparencyColors || transparencyColors.every((c) => !c)) {
      setProcessedSrc(null);
      return;
    }

    const img = new Image();
    // Only set crossOrigin for external URLs
    if (src.startsWith('http://') || src.startsWith('https://')) {
      img.crossOrigin = 'anonymous';
    }

    img.onload = () => {
      try {
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Get RGB values for transparency colors
        const colorsToRemove: Array<[number, number, number]> = [];
        for (const color of transparencyColors) {
          if (color) {
            const rgb = hexToRgb(color);
            if (rgb) {
              colorsToRemove.push(rgb);
            }
          }
        }

        // Process pixels - preserve original PNG transparency and apply color-based transparency
        if (colorsToRemove.length > 0) {
          for (let i = 0; i < data.length; i += 4) {
            const r = data[i];
            const g = data[i + 1];
            const b = data[i + 2];
            const originalAlpha = data[i + 3]; // Preserve original PNG alpha channel

            // Only process if pixel is not already transparent
            if (originalAlpha > 0) {
              // Check if pixel matches any transparency color
              for (const [tr, tg, tb] of colorsToRemove) {
                if (colorMatches(r, g, b, tr, tg, tb, 10)) {
                  data[i + 3] = 0; // Set alpha to 0 (transparent)
                  break;
                }
              }
            }
          }

          ctx.putImageData(imageData, 0, 0);
          setProcessedSrc(canvas.toDataURL());
        } else {
          setProcessedSrc(null);
        }
      } catch (error) {
        console.error('[TransparentImage] Error processing image for transparency', {
          error,
          errorMessage: error instanceof Error ? error.message : 'Unknown error',
          errorStack: error instanceof Error ? error.stack : undefined,
          src,
          transparencyColors,
        });
        setProcessedSrc(null);
      }
    };

    img.onerror = (error) => {
      console.error('[TransparentImage] Error loading image', {
        src,
        error,
        alt,
      });
      setProcessedSrc(null);
    };

    img.src = src;
  }, [src, transparencyColors]);

  if (!transparencyColors || transparencyColors.every((c) => !c)) {
    return <img src={src} alt={alt} />;
  }

  return (
    <>
      {processedSrc ? (
        <img src={processedSrc} alt={alt} />
      ) : (
        <img src={src} alt={alt} />
      )}
      <canvas ref={canvasRef} style={{ display: 'none' }} />
    </>
  );
};

