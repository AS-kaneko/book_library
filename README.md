# 社内図書管理システム

Electron + React + TypeScript + Vite で構築された社内図書管理システムです。

## 機能

- 書籍管理（追加、編集、削除、検索）
- 社員管理（追加、編集、削除、バーコード発行）
- 貸出・返却処理（バーコードスキャン対応）
- 貸出履歴管理

## 技術スタック

- **フレームワーク**: Electron
- **UI**: React 18
- **言語**: TypeScript
- **ビルドツール**: Vite
- **スタイリング**: Tailwind CSS
- **ルーティング**: React Router
- **バーコード生成**: bwip-js

## セットアップ

```bash
# 依存関係のインストール
npm install

# 開発サーバーの起動
npm run dev

# ビルド
npm run build
```

## プロジェクト構造

```
library-management-system/
├── src/
│   ├── main/           # Electronメインプロセス
│   ├── renderer/       # React UI
│   ├── models/         # データモデル
│   ├── services/       # ビジネスロジック
│   ├── repositories/   # データアクセス層
│   └── utils/          # ユーティリティ
├── data/               # データ保存ディレクトリ
└── tests/              # テストファイル
```

## 開発

- `npm run dev` - 開発モードで起動
- `npm run build` - プロダクションビルド
- `npm run lint` - ESLintでコードチェック
- `npm run format` - Prettierでコード整形
