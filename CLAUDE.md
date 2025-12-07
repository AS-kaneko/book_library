# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## コマンド

### 開発
- `npm run dev` - 開発モード起動（Viteサーバー + Electronウィンドウ）
- `npm run electron:dev` - Viteとelectronを並行起動

### ビルド・リリース
- `npm run build` - TypeScriptコンパイル + Viteビルド + electron-builderでパッケージング
- `npm run electron:build` - Viteビルド + electron-builderでパッケージング

### コード品質
- `npm run lint` - ESLintでコードチェック
- `npm run format` - Prettierでコード整形

### テスト
- テストは`tests/`ディレクトリに配置
- `barcode-service.test.ts` - バーコードサービスのテスト
- `service-layer-verification.ts` - サービス層の検証
- `main-process-verification.ts` - メインプロセスの検証

## アーキテクチャ

### レイヤード構造

このプロジェクトは3層アーキテクチャを採用:

1. **Repository層** (`src/repositories/`) - データアクセス
   - JSONファイルベースの永続化
   - 各エンティティ(Book, Employee, LoanRecord)に対応するリポジトリ
   - BookRepositoryはファイルパス引数を受け取る（通常は`data/books.json`）

2. **Service層** (`src/services/`) - ビジネスロジック
   - BookService: 書籍管理（追加、更新、削除、検索）
   - EmployeeService: 社員管理（追加、更新、削除、バーコード生成）
   - LoanService: 貸出管理（貸出、返却、履歴管理）
   - BarcodeService: バーコード生成・検証（bwip-js使用）

3. **IPC通信** (`src/main/index.ts`) - Electronメインプロセス
   - レンダラープロセスとの通信ハンドラー
   - サービス層の初期化と依存注入
   - エラーのシリアライゼーション処理

### データフロー

```
Renderer (React)
  ↓ ipcRenderer.invoke
Main Process (IPC Handlers)
  ↓
Service Layer
  ↓
Repository Layer
  ↓
JSON Files (data/)
```

### 主要な実装パターン

- **依存注入**: サービスはコンストラクタでリポジトリを受け取る
- **エラーハンドリング**: カスタムLibraryErrorクラスでエラーコード管理
- **バリデーション**: サービス層で入力検証（ISBN形式、重複チェック等）
- **データクリーニング**: ISBN保存時にハイフン・スペース除去
- **状態管理**: 書籍ステータス(AVAILABLE/BORROWED)はLoanServiceで管理

### データ保存

- 開発時: `app.getPath('userData')/data/` (通常 `~/Library/Application Support/library-management-system/data/`)
- JSONファイル: `books.json`, `employees.json`, `loans.json`
- バーコード画像: `data/barcodes/` にPNG形式で保存
- 初回起動時: サンプル書籍5冊、サンプル社員3名、バーコード画像を自動生成

### フロントエンド構成

- React Router v6でページ管理
- ToastContextでグローバル通知管理
- Tailwind CSSでスタイリング
- 再利用可能なコンポーネント: Button, Input, Modal, Table, Layout
