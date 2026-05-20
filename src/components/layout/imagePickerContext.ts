import { createContext, useContext } from 'react';

/**
 * パネル内から画像ファイルピッカーを開くためのコンテキスト。
 *
 * Provider は [Panel](./panel.tsx) が提供し、子コンポーネント（エントリ入力欄など）が
 * `useImagePicker()` を呼ぶことで「画像追加」ボタン経由でピッカーを起動できる。
 *
 * NOTE: 定数 / 関数とコンポーネントを同一ファイルから export すると Vite の Fast Refresh が
 * 効かなくなる（react-refresh/only-export-components 警告）ため、Context と hook はこちらに分離している。
 */
export const ImagePickerContext = createContext<(() => void) | null>(null);

export const useImagePicker = () => useContext(ImagePickerContext);
