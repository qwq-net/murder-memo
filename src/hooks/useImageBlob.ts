import { useEffect, useState } from 'react';

import { getImage } from '@/lib/idb';

/**
 * IndexedDB から画像 blob を読み込み、Object URL として返すフック。
 * アンマウント時に URL.revokeObjectURL() で適切にクリーンアップする。
 */
export function useImageBlob(blobKey?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);

  useEffect(() => {
    if (!blobKey) return;
    let revoked = false;

    getImage(blobKey).then((blob) => {
      if (revoked || !blob) return;
      setUrl(URL.createObjectURL(blob));
    });

    return () => {
      revoked = true;
      setUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
    };
  }, [blobKey]);

  return url;
}
