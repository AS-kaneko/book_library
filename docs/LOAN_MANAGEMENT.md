# 貸出・返却管理機能

このドキュメントでは、図書管理システムの貸出・返却管理機能について詳しく説明します。

## 概要

貸出・返却機能は、バーコードスキャンによる簡易操作と、管理画面からの詳細操作の両方に対応しています。

## 複数冊同時処理

### 貸出画面（LoanManagementPage）

#### 基本操作
1. **社員バーコードをスキャン**: 社員情報と現在の貸出冊数を表示
2. **書籍バーコードを連続スキャン**: 書籍がリストに追加される
3. **確認ボタンをクリック**: 確認モーダルが表示される
4. **確定**: 全ての書籍が一括で貸出処理される

#### 機能詳細
- **重複チェック**: 同じ書籍を複数回追加できないようチェック
- **リストから削除**: 各書籍の「×」ボタンで削除可能
- **貸出冊数表示**: 社員の現在貸出冊数/上限冊数を表示
- **返却期限**: デフォルト14日間（変更可能）

### 返却画面

#### 基本操作
1. **書籍バーコードを連続スキャン**: 返却する書籍をリストに追加
2. **確認ボタンをクリック**: 確認モーダルが表示される
3. **確定**: 全ての書籍が一括で返却処理される

#### 機能詳細
- **貸出情報表示**: 各書籍の借りた人と貸出日を表示
- **重複チェック**: 同じ書籍を複数回追加できない
- **リストから削除**: 個別に削除可能

## 管理画面機能（履歴ページ）

履歴ページでは、バーコードスキャンなしで貸出・返却の管理が可能です。

### 新規貸出作成

#### 使用方法
1. **「新規貸出作成」ボタンをクリック**
2. **書籍を選択**: ドロップダウンから選択（利用可能/貸出中の状態を表示）
3. **社員を選択**: ドロップダウンから選択
4. **貸出期間を指定**: 7日、14日、30日のプリセット、または1〜365日で指定
5. **作成ボタンをクリック**: 貸出記録が作成される

#### 特徴
- 既に貸出中の書籍でも強制的に貸出可能
- 社員の貸出上限（10冊）はチェックされる
- 返却期限のプレビュー表示

### 返却期限の変更

#### 使用方法
1. **貸出中の行の「期間変更」ボタンをクリック**
2. **変更方法を選択**:
   - **日数で変更**: -7、-3、+7、+14、+30日のプリセット、または-365〜+365日で指定
   - **日付で指定**: カレンダーから直接日付を選択
3. **変更ボタンをクリック**: 返却期限が更新される

#### 機能詳細
- **延長**: 正の値で期間延長
- **短縮**: 負の値で期間短縮
- **直接指定**: 特定の日付を指定可能
- **プレビュー表示**: 新しい返却期限を事前に確認

### 強制返却

#### 使用方法
1. **貸出中の行の「強制返却」ボタンをクリック**
2. **確認モーダルで確認**
3. **返却ボタンをクリック**: バーコードスキャンなしで返却処理

#### 使用ケース
- 書籍が紛失した場合
- バーコードが読み取れない場合
- 管理者による一括返却処理

### 延滞表示

- **返却期限列**: 期限を過ぎた貸出は赤字で「(延滞)」と表示
- **フィルタリング**: 延滞のみを抽出可能
- **ソート**: 返却期限でソート可能

## 確認モーダル

### 貸出確認モーダル（LoanConfirmModal）

表示内容:
- **書籍リスト**: タイトル、著者（複数冊の場合はスクロール可能）
- **借りる人**: 社員名
- **返却期限**: 14日後の日付

### 返却確認モーダル（ReturnConfirmModal）

表示内容:
- **書籍リスト**: タイトル、著者、借りた人（複数冊の場合はスクロール可能）
- **貸出情報**: 各書籍の貸出日と借りた人

### 成功モーダル（SuccessModal）

処理完了時に表示:
- 貸出完了/返却完了メッセージ
- 処理した書籍のタイトル（複数冊の場合は「X冊の書籍」）
- 自動フォーカス: モーダルを閉じると次の操作にフォーカス

## データモデル

### LoanRecord

```typescript
interface LoanRecord {
  id: string;              // UUID
  bookId: string;          // 書籍ID
  employeeId: string;      // 社員ID
  borrowedAt: Date;        // 貸出日時
  dueDate?: Date;          // 返却期限
  returnedAt?: Date;       // 返却日時
  status: LoanStatus;      // ACTIVE | RETURNED
}
```

### 新規追加フィールド
- `dueDate`: 返却期限（全ての貸出に設定される）

## サービス層API

### LoanService

#### 複数冊処理
- `borrowMultipleBooks(barcode: string, isbns: string[]): Promise<LoanRecord[]>`
- `returnMultipleBooks(isbns: string[]): Promise<LoanRecord[]>`

#### 期間管理
- `extendDueDate(loanId: string, days: number): Promise<LoanRecord>`
  - 正の値: 延長、負の値: 短縮
- `setDueDate(loanId: string, dueDate: string): Promise<LoanRecord>`
  - 日付を直接指定

#### 手動貸出
- `createManualLoan(bookId: string, employeeId: string, loanDays: number): Promise<LoanRecord>`
  - 既存の貸出を上書き可能

## IPC通信

### 新規追加ハンドラ

```typescript
// 複数冊貸出
ipcMain.handle('loans:borrowMultipleBooks', async (_, barcode, isbns) => {...})

// 複数冊返却
ipcMain.handle('loans:returnMultipleBooks', async (_, isbns) => {...})

// 期間延長・短縮
ipcMain.handle('loans:extend', async (_, loanId, days) => {...})

// 期限の直接指定
ipcMain.handle('loans:setDueDate', async (_, loanId, dueDate) => {...})

// 手動貸出作成
ipcMain.handle('loans:createManual', async (_, bookId, employeeId, loanDays) => {...})
```

## エラーハンドリング

### 新規エラーコード

- `VALIDATION_ERROR`: バリデーションエラー（日数範囲、日付形式等）

### エラーメッセージ

複数冊処理時のエラー:
- 一部失敗時: 失敗した書籍のISBNとエラー内容を表示
- 全体ロールバックはしない（成功した分は処理される）

## 使用例

### 複数冊貸出の例

```typescript
// フロントエンド
const bookISBNs = selectedBooks.map(book => book.isbn);
await ipcRenderer.invoke('loans:borrowMultipleBooks', employeeBarcode, bookISBNs);
```

### 期限変更の例

```typescript
// 7日延長
await ipcRenderer.invoke('loans:extend', loanId, 7);

// 3日短縮
await ipcRenderer.invoke('loans:extend', loanId, -3);

// 直接日付指定
await ipcRenderer.invoke('loans:setDueDate', loanId, '2024-12-31');
```

## 制限事項

- **貸出上限**: 1人あたり10冊まで
- **期間変更範囲**: -365日〜+365日
- **貸出期間**: 1日〜365日

## 今後の拡張案

- 延滞通知機能
- 自動督促メール
- 貸出統計レポート
- 書籍の予約機能
