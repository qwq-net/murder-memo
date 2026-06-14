import { nanoid } from 'nanoid';

import { deleteImage, putImage } from './idb';
import { resizeImage } from './imageResize';

/**
 * 画像保存フローのどの段階で失敗したかを表すステージ識別子。
 * 呼び手（フック）が段階ごとに異なるトースト・ログを出し分けるために使う。
 * - 'resize':  リサイズに失敗（まだ何も保存していない）
 * - 'persist': IDB への putImage に失敗（保存自体が成立していない）
 * - 'attach':  エントリ追加（attach）に失敗（保存済み blob は後始末で削除済み）
 */
export type ImagePersistStage = 'resize' | 'persist' | 'attach';

/**
 * {@link persistResizedImage} が投げる、失敗ステージ付きエラー。
 * 元のエラーは {@link ImagePersistError.cause} に保持する。
 */
export class ImagePersistError extends Error {
  readonly stage: ImagePersistStage;
  // 元の例外（呼び手が console.error 等でそのまま出すために保持）
  override readonly cause: unknown;

  constructor(stage: ImagePersistStage, cause: unknown) {
    super(`画像保存に失敗しました (${stage})`);
    this.name = 'ImagePersistError';
    this.stage = stage;
    this.cause = cause;
  }
}

/**
 * 画像 blob をリサイズして IDB へ保存し、attach（エントリ追加等）まで行う。
 * attach が失敗した場合は保存済み blob を後始末して孤児化を防ぐ
 * （「画像 blob のライフサイクル（GC 方式）」の前段の契約。
 * useImageDrop / useClipboardPaste で二重実装されていた保存フローを集約）。
 *
 * 失敗時は {@link ImagePersistError}（stage 付き）を throw する。呼び手側で stage を見て
 * トースト・ログを出し分けられるよう、UI 固有の文言・通知はこの関数では一切行わない。
 *
 * @param blob   保存対象の画像 Blob（リサイズ前）
 * @param attach 保存済み blobKey をエントリ等へ結びつける処理（失敗したら blob を後始末して再 throw）
 */
export async function persistResizedImage(
  blob: Blob,
  attach: (blobKey: string) => Promise<void>,
): Promise<void> {
  let resized: Blob;
  try {
    resized = await resizeImage(blob);
  } catch (err) {
    throw new ImagePersistError('resize', err);
  }

  const blobKey = nanoid();
  try {
    await putImage(blobKey, resized);
  } catch (err) {
    throw new ImagePersistError('persist', err);
  }

  try {
    await attach(blobKey);
  } catch (err) {
    // エントリ追加に失敗したら保存済み blob を削除して孤児化を防ぐ（後始末の失敗は黙認）
    await deleteImage(blobKey).catch(() => {});
    throw new ImagePersistError('attach', err);
  }
}
