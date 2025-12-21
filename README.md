# 図書管理システム

Electron + React + TypeScript + Vite で構築された図書管理システムです。

## 機能

### 基本機能
- **書籍管理**: 追加、編集、削除、検索
- **社員管理**: 追加、編集、削除、バーコード発行
- **貸出・返却処理**: バーコードスキャン対応、複数冊一括処理
- **貸出履歴管理**: フィルタリング、ソート、期間検索

### 高度な管理機能
- **複数冊同時処理**: 一回の操作で複数書籍の貸出・返却が可能
- **管理画面からの操作**:
  - 新規貸出作成（バーコードスキャン不要）
  - 返却期限の変更（延長・短縮、日付指定）
  - 強制返却処理
  - 延滞状況の可視化

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
