# 設計書

## 概要

社内図書管理システムは、TypeScriptで実装される小規模な図書館管理アプリケーションです。Electronを使用したデスクトップGUIアプリケーションとして提供し、書籍と社員の管理、貸出・返却処理、履歴管理を行います。データはJSONファイルで永続化し、シンプルで保守しやすい設計を目指します。

## アーキテクチャ

### システム構成

```
library-management-system/
├── src/
│   ├── main/           # Electronメインプロセス
│   │   └── index.ts    # アプリケーションエントリーポイント
│   ├── renderer/       # Electronレンダラープロセス（UI）
│   │   ├── pages/      # 画面コンポーネント
│   │   ├── components/ # 再利用可能なUIコンポーネント
│   │   ├── App.tsx     # ルートコンポーネント
│   │   └── index.html  # HTMLエントリーポイント
│   ├── models/         # データモデル
│   ├── services/       # ビジネスロジック
│   ├── repositories/   # データアクセス層
│   └── utils/          # ユーティリティ
├── data/               # データ保存ディレクトリ
│   ├── books.json
│   ├── employees.json
│   ├── loans.json
│   └── barcodes/       # バーコード画像
└── tests/              # テストファイル
```

### アーキテクチャパターン

レイヤードアーキテクチャを採用し、以下の層に分離します：

1. **プレゼンテーション層（GUI）**: Electron + Reactによるユーザーインターフェース
2. **サービス層**: ビジネスロジックとバリデーション
3. **リポジトリ層**: データアクセスと永続化
4. **モデル層**: データ構造の定義

Electronアーキテクチャ：
- **メインプロセス**: Node.js環境、ファイルシステムアクセス、ウィンドウ管理
- **レンダラープロセス**: ブラウザ環境、React UI、ユーザーインタラクション
- **IPC通信**: メインとレンダラー間のデータ通信

## コンポーネントとインターフェース

### データモデル

#### Book（書籍）

```typescript
interface Book {
  id: string;              // UUID
  title: string;           // タイトル
  author: string;          // 著者
  isbn: string;            // ISBN
  registeredAt: Date;      // 登録日
  status: BookStatus;      // 在庫状態
  currentBorrowerId?: string; // 現在の貸出者ID（貸出中の場合）
}

enum BookStatus {
  AVAILABLE = 'available',
  BORROWED = 'borrowed'
}
```

#### Employee（社員）

```typescript
interface Employee {
  id: string;              // 社員ID
  name: string;            // 名前
  email: string;           // メールアドレス
  barcode: string;         // 会員バーコード（社員IDベース）
  registeredAt: Date;      // 登録日
}
```

#### LoanRecord（貸出記録）

```typescript
interface LoanRecord {
  id: string;              // UUID
  bookId: string;          // 書籍ID
  employeeId: string;      // 社員ID
  borrowedAt: Date;        // 貸出日
  returnedAt?: Date;       // 返却日（返却済みの場合）
  status: LoanStatus;      // 貸出状態
}

enum LoanStatus {
  ACTIVE = 'active',       // 貸出中
  RETURNED = 'returned'    // 返却済み
}
```

### リポジトリ層

#### IRepository<T>

```typescript
interface IRepository<T> {
  findAll(): Promise<T[]>;
  findById(id: string): Promise<T | null>;
  save(entity: T): Promise<T>;
  update(id: string, entity: Partial<T>): Promise<T>;
  delete(id: string): Promise<boolean>;
}
```

#### BookRepository

```typescript
class BookRepository implements IRepository<Book> {
  private dataFile: string = 'data/books.json';
  
  // IRepositoryの実装
  // 追加メソッド
  findByTitle(title: string): Promise<Book[]>;
  findByAuthor(author: string): Promise<Book[]>;
  findAvailable(): Promise<Book[]>;
}
```

#### EmployeeRepository

```typescript
class EmployeeRepository implements IRepository<Employee> {
  private dataFile: string = 'data/employees.json';
  
  // IRepositoryの実装
  // 追加メソッド
  findByEmail(email: string): Promise<Employee | null>;
}
```

#### LoanRepository

```typescript
class LoanRepository implements IRepository<LoanRecord> {
  private dataFile: string = 'data/loans.json';
  
  // IRepositoryの実装
  // 追加メソッド
  findActiveLoans(): Promise<LoanRecord[]>;
  findByBookId(bookId: string): Promise<LoanRecord[]>;
  findByEmployeeId(employeeId: string): Promise<LoanRecord[]>;
  findActiveByEmployeeId(employeeId: string): Promise<LoanRecord[]>;
}
```

### サービス層

#### BookService

```typescript
class BookService {
  constructor(
    private bookRepository: BookRepository,
    private barcodeService: BarcodeService
  ) {}

  // 書籍管理
  addBook(title: string, author: string, isbn: string): Promise<Book>;
  updateBook(id: string, updates: Partial<Book>): Promise<Book>;
  deleteBook(id: string): Promise<void>;

  // 検索・一覧
  getAllBooks(): Promise<Book[]>;
  searchBooks(query: string): Promise<Book[]>;
  getAvailableBooks(): Promise<Book[]>;
  getBookById(id: string): Promise<Book>;
}
```

#### BookInfoService

```typescript
// 書籍情報取得サービス
interface BookInfo {
  title: string;
  author: string;
  isbn: string;
}

class BookInfoService {
  private readonly NDL_API_URL = 'https://iss.ndl.go.jp/api/opensearch';

  /**
   * ISBNから書籍情報を取得
   * @param isbn ISBN番号（10桁または13桁）
   * @returns 書籍情報（タイトル、著者、ISBN）
   */
  async fetchBookInfo(isbn: string): Promise<BookInfo>;

  /**
   * 国立国会図書館APIからデータを取得
   * @param isbn ISBN番号
   * @returns APIレスポンス
   */
  private async fetchFromNDL(isbn: string): Promise<any>;

  /**
   * APIレスポンスをパース
   * @param response APIレスポンス
   * @returns パース済み書籍情報
   */
  private parseNDLResponse(response: any): BookInfo;
}
```

#### EmployeeService

```typescript
class EmployeeService {
  constructor(
    private employeeRepository: EmployeeRepository,
    private barcodeService: BarcodeService
  ) {}
  
  // 社員管理
  addEmployee(id: string, name: string, email: string): Promise<Employee>;
  updateEmployee(id: string, updates: Partial<Employee>): Promise<Employee>;
  deleteEmployee(id: string): Promise<void>;
  generateEmployeeBarcode(employeeId: string): Promise<string>; // バーコード画像パス
  
  // 検索・一覧
  getAllEmployees(): Promise<Employee[]>;
  getEmployeeById(id: string): Promise<Employee>;
  getEmployeeByBarcode(barcode: string): Promise<Employee>;
}
```

#### LoanService

```typescript
class LoanService {
  constructor(
    private loanRepository: LoanRepository,
    private bookRepository: BookRepository,
    private employeeRepository: EmployeeRepository
  ) {}
  
  // 貸出・返却
  borrowBook(bookId: string, employeeId: string): Promise<LoanRecord>;
  returnBook(bookId: string): Promise<LoanRecord>;
  
  // 履歴・状態確認
  getLoanHistory(bookId?: string, employeeId?: string): Promise<LoanRecord[]>;
  getActiveLoans(): Promise<LoanRecord[]>;
  getEmployeeActiveLoans(employeeId: string): Promise<LoanRecord[]>;
}
```

### GUI層（Electron + React）

#### 画面構成

```typescript
// メイン画面（タブ構成）
interface MainWindow {
  tabs: [
    '書籍管理',
    '社員管理',
    '貸出・返却',
    '履歴'
  ]
}
```

#### 画面一覧

1. **書籍管理画面** (`BookManagementPage`)
   - 書籍一覧テーブル（タイトル、著者、ISBN、状態）
   - 検索バー（タイトル・著者で検索）
   - フィルター（利用可能のみ表示）
   - ボタン：書籍追加、編集、削除

2. **社員管理画面** (`EmployeeManagementPage`)
   - 社員一覧テーブル（社員ID、名前、メール、貸出中冊数）
   - ボタン：社員追加、編集、削除、バーコード発行

3. **貸出・返却画面** (`LoanManagementPage`)
   - 貸出セクション
     - 会員バーコード入力フィールド（スキャン対応）
     - ISBNバーコード入力フィールド（スキャン対応）
     - 貸出ボタン
   - 返却セクション
     - ISBNバーコード入力フィールド（スキャン対応）
     - 返却ボタン
   - 現在貸出中の書籍一覧

4. **履歴画面** (`HistoryPage`)
   - 貸出履歴テーブル（書籍名、社員名、貸出日、返却日、状態）
   - フィルター（書籍別、社員別、期間別）

#### Reactコンポーネント構造

```typescript
// メインアプリケーション
const App: React.FC = () => {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<BookManagementPage />} />
          <Route path="/employees" element={<EmployeeManagementPage />} />
          <Route path="/loans" element={<LoanManagementPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </Router>
  );
};

// レイアウトコンポーネント
const Layout: React.FC = ({ children }) => {
  return (
    <div>
      <Header />
      <Navigation />
      <main>{children}</main>
    </div>
  );
};
```

#### IPC通信インターフェース

```typescript
// メインプロセス → レンダラープロセス
interface IPCHandlers {
  // 書籍
  'books:getAll': () => Promise<Book[]>;
  'books:add': (book: Omit<Book, 'id'>) => Promise<Book>;
  'books:update': (id: string, updates: Partial<Book>) => Promise<Book>;
  'books:delete': (id: string) => Promise<void>;
  'books:search': (query: string) => Promise<Book[]>;
  'books:fetchInfo': (isbn: string) => Promise<BookInfo>; // 新規追加

  // 社員
  'employees:getAll': () => Promise<Employee[]>;
  'employees:add': (employee: Omit<Employee, 'id' | 'barcode'>) => Promise<Employee>;
  'employees:update': (id: string, updates: Partial<Employee>) => Promise<Employee>;
  'employees:delete': (id: string) => Promise<void>;
  'employees:generateBarcode': (id: string) => Promise<string>;

  // 貸出
  'loans:borrow': (bookId: string, employeeId: string) => Promise<LoanRecord>;
  'loans:return': (bookId: string) => Promise<LoanRecord>;
  'loans:getHistory': (filters?: LoanFilters) => Promise<LoanRecord[]>;
  'loans:getActive': () => Promise<LoanRecord[]>;
}
```

## データモデル詳細

### データ永続化

- **形式**: JSON
- **保存場所**: `data/` ディレクトリ
- **ファイル**:
  - `books.json`: 書籍データ
  - `employees.json`: 社員データ
  - `loans.json`: 貸出記録データ

### データファイル構造例

#### books.json
```json
[
  {
    "id": "uuid-1",
    "title": "TypeScript入門",
    "author": "山田太郎",
    "isbn": "978-4-1234-5678-9",
    "registeredAt": "2024-01-15T09:00:00.000Z",
    "status": "available"
  }
]
```

#### employees.json
```json
[
  {
    "id": "EMP001",
    "name": "佐藤花子",
    "email": "sato@company.com",
    "barcode": "EMP001",
    "registeredAt": "2024-01-10T09:00:00.000Z"
  }
]
```

#### loans.json
```json
[
  {
    "id": "uuid-loan-1",
    "bookId": "uuid-1",
    "employeeId": "EMP001",
    "borrowedAt": "2024-01-20T10:00:00.000Z",
    "returnedAt": "2024-01-25T15:00:00.000Z",
    "status": "returned"
  }
]
```

## エラーハンドリング

### カスタムエラークラス

```typescript
class LibraryError extends Error {
  constructor(message: string, public code: string) {
    super(message);
    this.name = 'LibraryError';
  }
}

// エラーコード定義
enum ErrorCode {
  BOOK_NOT_FOUND = 'BOOK_NOT_FOUND',
  BOOK_ALREADY_BORROWED = 'BOOK_ALREADY_BORROWED',
  BOOK_NOT_BORROWED = 'BOOK_NOT_BORROWED',
  EMPLOYEE_NOT_FOUND = 'EMPLOYEE_NOT_FOUND',
  LOAN_LIMIT_EXCEEDED = 'LOAN_LIMIT_EXCEEDED',
  CANNOT_DELETE_BORROWED_BOOK = 'CANNOT_DELETE_BORROWED_BOOK',
  CANNOT_DELETE_EMPLOYEE_WITH_LOANS = 'CANNOT_DELETE_EMPLOYEE_WITH_LOANS',
  DATA_SAVE_FAILED = 'DATA_SAVE_FAILED',
  DATA_LOAD_FAILED = 'DATA_LOAD_FAILED',
  INVALID_INPUT = 'INVALID_INPUT'
}
```

### エラーメッセージ

日本語のエラーメッセージを提供：

- `BOOK_NOT_FOUND`: "指定された書籍が見つかりません"
- `BOOK_ALREADY_BORROWED`: "この書籍は既に貸出中です"
- `LOAN_LIMIT_EXCEEDED`: "貸出上限（3冊）に達しています"
- `CANNOT_DELETE_BORROWED_BOOK`: "貸出中の書籍は削除できません"

### エラーハンドリング戦略

1. **バリデーションエラー**: サービス層で検証し、適切なエラーを投げる
2. **データアクセスエラー**: リポジトリ層でキャッチし、ラップして再スロー
3. **CLI層**: すべてのエラーをキャッチし、ユーザーフレンドリーなメッセージを表示

## テスト戦略

### テストレベル

1. **ユニットテスト**
   - 各サービスクラスのビジネスロジック
   - バリデーション機能
   - エラーハンドリング

2. **統合テスト**
   - サービス層とリポジトリ層の連携
   - データの永続化と読み込み

### テストツール

- **フレームワーク**: Jest
- **モック**: Jest のモック機能
- **カバレッジ**: 主要なビジネスロジックをカバー

### テストデータ

- テスト用の一時JSONファイルを使用
- 各テスト後にクリーンアップ

## 技術スタック

- **言語**: TypeScript 5.x
- **ランタイム**: Node.js 18.x以上
- **デスクトップフレームワーク**: Electron
- **UIフレームワーク**: React 18.x
- **ルーティング**: React Router
- **スタイリング**: Tailwind CSS
- **UUID生成**: uuid
- **日付処理**: 標準のDate API
- **書籍情報取得**: 国立国会図書館API (OpenSearch)
- **HTTP通信**: Electronの組み込みfetch API
- **バーコード生成**: bwip-js（バーコード画像生成ライブラリ）
- **バーコード入力**: USBバーコードスキャナー（キーボード入力として動作）
- **ビルドツール**: Vite
- **テスト**: Jest + React Testing Library
- **リンター**: ESLint
- **フォーマッター**: Prettier

## 設計上の決定事項と根拠

### 1. JSONファイルでのデータ永続化

**決定**: データベースではなくJSONファイルを使用

**根拠**:
- 小規模システム（社員20名、書籍30冊）のため、データベースは過剰
- セットアップが簡単で、依存関係が少ない
- データの可視性が高く、デバッグが容易
- バックアップが簡単

### 2. Electronデスクトップアプリ

**決定**: ElectronによるGUIアプリケーション

**根拠**:
- 直感的な操作が可能で、誰でも使いやすい
- バーコードスキャナーとの統合が容易
- クロスプラットフォーム対応（Windows、Mac、Linux）
- サーバー不要で運用が簡単
- オフラインで動作可能

### 3. レイヤードアーキテクチャ

**決定**: 明確な層分離を実装

**根拠**:
- ビジネスロジックとデータアクセスの分離
- テストが容易
- 将来的な拡張性（例：WebUI追加）に対応可能
- コードの保守性が高い

### 4. 貸出上限3冊

**決定**: 1人あたり3冊までの制限

**根拠**:
- 30冊を20名で共有するため、適度な制限が必要
- 書籍の循環を促進
- 管理の複雑さを抑える

### 5. UUIDの使用

**決定**: 書籍と貸出記録にUUIDを使用

**根拠**:
- 一意性が保証される
- 連番管理が不要
- 分散システムへの拡張が容易

## セキュリティ考慮事項

- **入力バリデーション**: すべてのユーザー入力を検証
- **ファイルアクセス**: dataディレクトリへのアクセスのみ許可
- **エラー情報**: 内部実装の詳細を露出しない

## パフォーマンス考慮事項

- **データ量**: 最大30冊、20名のため、パフォーマンス問題は発生しない
- **メモリ**: すべてのデータをメモリに読み込んでも問題ない規模
- **ファイルI/O**: 操作ごとにファイルを読み書きするシンプルな実装で十分

## バーコード機能詳細

### 会員バーコード生成

#### BarcodeService

```typescript
class BarcodeService {
  private outputDir: string = 'data/barcodes/';
  
  // 会員バーコード生成
  async generateEmployeeBarcode(employeeId: string): Promise<string> {
    // CODE128形式でバーコード画像を生成
    // ファイル名: {employeeId}.png
    // 保存先: data/barcodes/{employeeId}.png
    // 戻り値: 生成されたファイルパス
  }
  
  // ISBNバーコード検証
  validateISBN(isbn: string): boolean {
    // ISBN-10またはISBN-13の形式チェック
  }
}
```

#### バーコード画像仕様

- **形式**: PNG
- **バーコードタイプ**: CODE128（会員バーコード）、EAN-13（ISBNバーコード）
- **サイズ**: 幅300px、高さ100px
- **保存場所**: `data/barcodes/` ディレクトリ
- **ファイル名**: `{社員ID}.png`（例: `EMP001.png`）

### バーコード読み取り処理フロー

#### 貸出処理フロー（GUI）

1. 「貸出・返却」タブを開く
2. 「会員バーコード」入力フィールドにフォーカス
3. バーコードスキャナーで社員の会員バーコードをスキャン
4. スキャナーが自動的に社員ID（例: EMP001）を入力
5. システムが社員IDで社員を検索し、社員名と現在の貸出冊数を表示
6. 「ISBNバーコード」入力フィールドに自動フォーカス移動
7. バーコードスキャナーで書籍のISBNバーコードをスキャン
8. スキャナーが自動的にISBN番号（例: 9784123456789）を入力
9. システムがISBNで書籍を検索し、書籍情報を表示
10. 「貸出」ボタンをクリック（またはEnterキー）
11. 貸出処理が実行され、成功メッセージを表示
12. 入力フィールドがクリアされ、次の貸出に備える

#### 返却処理フロー（GUI）

1. 「貸出・返却」タブの返却セクションを開く
2. 「ISBNバーコード」入力フィールドにフォーカス
3. バーコードスキャナーで書籍のISBNバーコードをスキャン
4. スキャナーが自動的にISBN番号を入力
5. システムがISBNで書籍を検索し、貸出情報を表示
6. 「返却」ボタンをクリック（またはEnterキー）
7. 返却処理が実行され、成功メッセージを表示
8. 入力フィールドがクリアされ、次の返却に備える

#### 書籍追加処理フロー（GUI）

1. 「書籍管理」タブで「書籍追加」ボタンをクリック
2. モーダルダイアログが開く
3. タイトルと著者を入力
4. 「ISBNバーコード」入力フィールドにフォーカス
5. バーコードスキャナーでISBNバーコードをスキャン
6. スキャナーが自動的にISBN番号を入力
7. システムがISBNの形式を検証
8. 「登録」ボタンをクリック
9. 書籍が登録され、成功メッセージを表示
10. モーダルが閉じ、書籍一覧が更新される

#### 会員バーコード発行フロー（GUI）

1. 「社員管理」タブで社員を選択
2. 「バーコード発行」ボタンをクリック
3. バーコード画像が生成される
4. プレビューダイアログが表示される
5. 「保存」ボタンで画像をエクスポート、または「印刷」ボタンで直接印刷

### バーコードスキャナー仕様

#### 使用機器

- **機種**: NETUM バーコードリーダー NT-2012
- **タイプ**: ハンドヘルド レーザー スキャナー
- **接続方式**: USB有線接続（キーボードエミュレーション）
- **対応バーコード**: 1D バーコード（CODE128、EAN-13、JAN等）
- **用途**: POSシステム、スーパーマーケット向け

#### 動作原理

- USBバーコードスキャナーはキーボードとして認識される
- スキャンすると、バーコードの内容が文字列として自動入力される
- 最後にEnterキー（改行）が自動送信される
- 特別なドライバーやソフトウェアは不要
- CLIの入力プロンプトで直接使用可能

#### 設定

- **サフィックス**: Enter（改行）を自動送信
- **プレフィックス**: なし
- **文字コード**: ASCII/UTF-8

## UI/UXデザイン

### デザイン原則

1. **シンプル**: 必要な機能だけを表示
2. **直感的**: 説明なしで操作できる
3. **高速**: バーコードスキャンから処理完了まで3秒以内
4. **視認性**: 大きなフォント、明確な色分け

### カラースキーム

- **プライマリ**: 青系（#3B82F6）- ボタン、リンク
- **成功**: 緑系（#10B981）- 成功メッセージ、利用可能状態
- **警告**: 黄系（#F59E0B）- 警告メッセージ
- **エラー**: 赤系（#EF4444）- エラーメッセージ、貸出中状態
- **背景**: グレー系（#F3F4F6）- ページ背景
- **カード**: 白（#FFFFFF）- コンテンツ背景

### レイアウト

```
┌─────────────────────────────────────────────┐
│  社内図書管理システム                    [最小化][最大化][閉じる]│
├─────────────────────────────────────────────┤
│  [書籍管理] [社員管理] [貸出・返却] [履歴]  │
├─────────────────────────────────────────────┤
│                                             │
│  ┌───────────────────────────────────────┐  │
│  │                                       │  │
│  │         メインコンテンツエリア         │  │
│  │                                       │  │
│  │                                       │  │
│  └───────────────────────────────────────┘  │
│                                             │
└─────────────────────────────────────────────┘
```

### 画面サイズ

- **最小サイズ**: 1024x768px
- **推奨サイズ**: 1280x800px
- **最大化**: 可能

### フォント

- **見出し**: 18-24px、太字
- **本文**: 14-16px、通常
- **テーブル**: 14px、通常
- **ボタン**: 16px、太字

## 書籍情報自動取得機能

### 国立国会図書館API (OpenSearch)

#### API概要

- **エンドポイント**: `https://iss.ndl.go.jp/api/opensearch`
- **形式**: OpenSearch (RSS形式のXML)
- **認証**: 不要
- **レート制限**: なし（常識的な範囲内）
- **対応書籍**: 日本国内で出版された書籍（ISBN付き）

#### リクエスト仕様

```
GET https://iss.ndl.go.jp/api/opensearch?isbn={ISBN}
```

**パラメータ**:
- `isbn`: ISBN番号（10桁または13桁、ハイフンあり/なし両対応）

**リクエスト例**:
```
https://iss.ndl.go.jp/api/opensearch?isbn=9784873115658
```

#### レスポンス仕様

XMLで返却されます（RSS 2.0形式）：

```xml
<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>国立国会図書館サーチ</title>
    <item>
      <title>リーダブルコード : より良いコードを書くためのシンプルで実践的なテクニック</title>
      <author>Dustin Boswell, Trevor Foucher著 ; 角征典訳</author>
      <pubDate>2012</pubDate>
      <dc:identifier>ISBN:9784873115658</dc:identifier>
    </item>
  </channel>
</rss>
```

#### パース処理

1. XMLをパース
2. `<item>`タグを検索
3. 以下の要素を抽出:
   - `<title>`: 書籍タイトル
   - `<author>`: 著者名（複数著者の場合はカンマ区切り）
   - `<dc:identifier>`: ISBN情報

#### エラーハンドリング

| エラー | 原因 | 対処 |
|--------|------|------|
| 書籍が見つからない | ISBNが存在しないまたは国会図書館に未登録 | ユーザーに手動入力を促す |
| ネットワークエラー | インターネット接続なし | エラーメッセージ表示、手動入力に切り替え |
| APIタイムアウト | API応答が遅い（5秒以上） | エラーメッセージ表示、手動入力に切り替え |
| XML パースエラー | 予期しないレスポンス形式 | エラーログ記録、手動入力に切り替え |

#### UIフロー

##### 書籍追加時のISBN自動取得フロー

1. 「書籍追加」モーダルを開く
2. ISBNフィールドにバーコードをスキャン
3. Enter キー押下時（スキャン完了時）に自動取得を実行
4. ローディングインジケーター表示
5. API呼び出し（最大5秒タイムアウト）
6. 成功時：
   - タイトルと著者フィールドに自動入力
   - ユーザーは内容を確認・編集可能
   - 「登録」ボタンで確定
7. 失敗時：
   - エラーメッセージ表示
   - タイトルと著者フィールドは空のまま
   - ユーザーが手動入力

#### 実装上の注意点

1. **タイムアウト設定**: 5秒以内に応答がない場合はタイムアウト
2. **キャッシュ**: 同じISBNを短時間に複数回検索する場合はキャッシュを使用（オプション）
3. **データクレンジング**: 
   - タイトルから不要な副題を削除（必要に応じて）
   - 著者名から「著」「訳」などの肩書きを削除（オプション）
4. **ISBN正規化**: ハイフンありなし両方に対応
5. **エラーログ**: API呼び出し失敗時は詳細をログに記録
6. **ユーザビリティ**: 
   - 自動取得は補助機能であり、常に手動編集可能にする
   - 自動取得失敗時もワークフローを中断しない

### BookInfoService 実装詳細

```typescript
class BookInfoService {
  private readonly NDL_API_URL = 'https://iss.ndl.go.jp/api/opensearch';
  private readonly TIMEOUT_MS = 5000;

  async fetchBookInfo(isbn: string): Promise<BookInfo> {
    try {
      // ISBN正規化（ハイフン除去）
      const cleanISBN = isbn.replace(/-/g, '');
      
      // タイムアウト付きAPI呼び出し
      const response = await this.fetchWithTimeout(
        `${this.NDL_API_URL}?isbn=${cleanISBN}`,
        this.TIMEOUT_MS
      );
      
      // XMLパース
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(response, 'text/xml');
      
      // データ抽出
      const item = xmlDoc.querySelector('item');
      if (!item) {
        throw new LibraryError(
          'ISBNに該当する書籍が見つかりませんでした',
          ErrorCode.BOOK_INFO_NOT_FOUND
        );
      }
      
      const title = item.querySelector('title')?.textContent || '';
      const author = item.querySelector('author')?.textContent || '';
      
      // データクレンジング
      const cleanTitle = this.cleanTitle(title);
      const cleanAuthor = this.cleanAuthor(author);
      
      return {
        title: cleanTitle,
        author: cleanAuthor,
        isbn: cleanISBN,
      };
    } catch (error) {
      if (error instanceof LibraryError) {
        throw error;
      }
      throw new LibraryError(
        '書籍情報の取得に失敗しました',
        ErrorCode.BOOK_INFO_FETCH_FAILED
      );
    }
  }

  private async fetchWithTimeout(url: string, timeout: number): Promise<string> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);
    
    try {
      const response = await fetch(url, { signal: controller.signal });
      clearTimeout(timeoutId);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
    } catch (error) {
      clearTimeout(timeoutId);
      throw error;
    }
  }

  private cleanTitle(title: string): string {
    // 基本的なクレンジング（必要に応じて拡張）
    return title.trim();
  }

  private cleanAuthor(author: string): string {
    // 「著」「訳」などを削除（オプション）
    // 例: "Dustin Boswell, Trevor Foucher著 ; 角征典訳"
    //  → "Dustin Boswell, Trevor Foucher"
    return author
      .replace(/著.*$/, '')
      .replace(/訳.*$/, '')
      .replace(/;.*$/, '')
      .trim();
  }
}
```

### 新規エラーコード

```typescript
enum ErrorCode {
  // 既存のエラーコード...
  
  // 書籍情報取得関連
  BOOK_INFO_NOT_FOUND = 'BOOK_INFO_NOT_FOUND',           // ISBNに該当する書籍が見つからない
  BOOK_INFO_FETCH_FAILED = 'BOOK_INFO_FETCH_FAILED',     // API呼び出し失敗
  BOOK_INFO_TIMEOUT = 'BOOK_INFO_TIMEOUT',               // タイムアウト
  BOOK_INFO_NETWORK_ERROR = 'BOOK_INFO_NETWORK_ERROR',   // ネットワークエラー
}
```
