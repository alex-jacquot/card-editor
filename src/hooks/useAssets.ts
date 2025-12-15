import { useMemo } from 'react';
import type { AssetDescriptor } from '../types';
import { textAsset } from '../utils/constants';

const assetModules = import.meta.glob('../../assets/**/*.{png,jpg,jpeg,svg}', {
  eager: true,
  import: 'default',
}) as Record<string, string>;

const buildAssetList = (): AssetDescriptor[] => {
  try {
    const parsedAssets = Object.entries(assetModules).map<AssetDescriptor>(
      ([path, src]) => {
        try {
          const [, relativePath = ''] = path.split('/assets/');
          const segments = relativePath.split('/');
          const fileName = segments.pop() ?? '';
          const category =
            segments.length > 0
              ? segments
                  .map((segment) => segment.replace(/[-_]/g, ' '))
                  .map(
                    (segment) =>
                      segment.charAt(0).toUpperCase() + segment.slice(1),
                  )
                  .join(' / ')
              : 'Uncategorized';

          return {
            id: path,
            name: fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' '),
            category,
            type: 'image',
            src,
          };
        } catch (error) {
          console.error('[Assets] Error parsing asset', {
            error,
            errorMessage: error instanceof Error ? error.message : 'Unknown error',
            path,
            src,
          });
          // Return a fallback asset
          return {
            id: path,
            name: 'Unknown Asset',
            category: 'Uncategorized',
            type: 'image',
            src,
          };
        }
      },
    );

    console.log('[Assets] Assets loaded', { count: parsedAssets.length + 1 });
    return [textAsset, ...parsedAssets];
  } catch (error) {
    console.error('[Assets] Error building asset list', {
      error,
      errorMessage: error instanceof Error ? error.message : 'Unknown error',
      errorStack: error instanceof Error ? error.stack : undefined,
    });
    return [textAsset]; // Return at least the text asset
  }
};

const groupAssets = (assets: AssetDescriptor[]) => {
  return assets.reduce<Record<string, AssetDescriptor[]>>((acc, asset) => {
    acc[asset.category] = acc[asset.category] ?? [];
    acc[asset.category].push(asset);
    return acc;
  }, {});
};

export const useAssets = () => {
  const assets = useMemo(() => buildAssetList(), []);
  const assetsByCategory = useMemo(() => groupAssets(assets), [assets]);

  return {
    assets,
    assetsByCategory,
  };
};

