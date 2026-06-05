import { useEffect, useRef, useState } from 'react';

import { getImage } from '@/lib/idb';

/**
 * IndexedDB から画像 blob を読み込み、Object URL として返すフック。
 * blobKey 変更時・アンマウント時に URL.revokeObjectURL() で確実にクリーンアップする。
 */
export function useImageBlob(blobKey?: string): string | null {
  const [url, setUrl] = useState<string | null>(null);
  // revoke 対象の URL を保持する（状態更新関数に副作用を持たせないため ref で管理）
  const urlRef = useRef<string | null>(null);

  useEffect(() => {
    if (!blobKey) return;
    let revoked = false;

    getImage(blobKey).then((blob) => {
      if (revoked || !blob) return;
      const objectUrl = URL.createObjectURL(blob);
      urlRef.current = objectUrl;
      setUrl(objectUrl);
    });

    return () => {
      revoked = true;
      if (urlRef.current) {
        URL.revokeObjectURL(urlRef.current);
        urlRef.current = null;
      }
      setUrl(null);
    };
  }, [blobKey]);

  return url;
}
