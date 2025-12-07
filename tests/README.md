# テスト実行ガイド

このディレクトリには、図書管理システムの各機能のテストファイルが含まれています。

## 前提条件

- Node.js がインストールされていること
- プロジェクトの依存関係がインストールされていること

```bash
npm install
```

## テストの実行方法

### 個別のテストを実行

各テストファイルは `tsx` を使用して実行できます：

```bash
# BarcodeServiceのテスト
npx tsx tests/barcode-service.test.ts
```

### すべてのテストを実行

プロジェクトルートから以下のコマンドで全テストを実行できます：

```bash
# testsディレクトリ内のすべての.test.tsファイルを実行
for file in tests/*.test.ts; do npx tsx "$file"; done
```

## テストファイル一覧

### barcode-service.test.ts
BarcodeServiceの機能をテストします：
- ISBN-10形式の検証
- ISBN-13形式の検証
- 会員バーコード画像の生成（CODE128形式）
- バーコード画像の保存と削除

**実行例：**
```bash
npx tsx tests/barcode-service.test.ts
```

**期待される出力：**
```
=== BarcodeService Test ===

Test 1: ISBN Validation
------------------------
Valid ISBN-13 tests:
  978-0-306-40615-7: ✓ PASS
  9780306406157: ✓ PASS
  978-1-86197-876-9: ✓ PASS

Valid ISBN-10 tests:
  0-306-40615-2: ✓ PASS
  0306406152: ✓ PASS

Invalid ISBN tests (should all be false):
  123-456-789: ✓ PASS
  978-0-000-00000-0: ✓ PASS
  not-an-isbn: ✓ PASS
  12345: ✓ PASS


Test 2: Barcode Generation
---------------------------
Generating barcode for EMP001...
✓ Barcode generated successfully: data/barcodes/EMP001.png
✓ Barcode exists: true
✓ Barcode deleted successfully
✓ Barcode no longer exists: true

=== All Tests Complete ===
```

## トラブルシューティング

### tsxがインストールされていない場合

初回実行時に `tsx` のインストールを求められた場合は、`y` を入力してインストールしてください：

```bash
Need to install the following packages:
tsx@4.20.6
Ok to proceed? (y) y
```

### モジュールが見つからないエラー

TypeScriptの型定義が不足している場合は、以下を実行してください：

```bash
npm install --save-dev @types/bwip-js @types/node @types/uuid
```

### バーコード画像が生成されない

`data/barcodes` ディレクトリが自動的に作成されますが、権限エラーが発生する場合は手動で作成してください：

```bash
mkdir -p data/barcodes
```

## 注意事項

- テストは開発環境でのみ実行してください
- バーコード画像は `data/barcodes/` ディレクトリに保存されます
- テスト実行後、一時的に生成されたバーコード画像は自動的に削除されます
