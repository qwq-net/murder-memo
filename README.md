# マダめもくん

マーダーミステリー・TRPG 向けの調査メモ Web アプリ。
セッション中に自由メモ・個人メモ・タイムラインを 3 パネルで同時に管理できます。
表示・非表示、レイアウト変更、検索など機能充実。日本語・英語対応。

[memo.qwqb.net](https://memo.qwqb.net/)

## 開発

```bash
npm install
npm run dev      # 開発サーバー
npm run build    # 型チェック + ビルド → dist/
npm run test     # テスト
npm run check    # 型チェック + Lint + フォーマット確認
```

## ドキュメント

- 開発ガイド（アーキテクチャ・設計原則・デプロイ）: [CLAUDE.md](CLAUDE.md)
- IndexedDB スキーマ: [docs/idb-schema.md](docs/idb-schema.md)

## ライセンス

個人プロジェクトです。転載・再利用は想定していません。
