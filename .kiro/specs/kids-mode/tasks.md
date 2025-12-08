# 実装タスクリスト: キッズモード

## タスク概要

このタスクリストは、キッズモード機能を段階的に実装するための具体的なコーディングタスクを定義します。各タスクは、前のタスクの成果物を基に構築され、最終的にすべての機能が統合されます。

## 実装状況の概要

**完了済み:**
- ModeContext（モード管理）
- textResource.ts（基本的なテキストリソース）
- Layout（モード切替ボタン、ナビゲーション表示制御）

**未完了:**
- RubyTextコンポーネント
- textResource.tsの拡張（全ページ用のテキストキー）
- UIコンポーネントのキッズモード対応（Button、Input、Table）
- 各ページのテキストリソース適用

---

## - [ ] 1. テキストリソースの拡張

textResource.tsファイルを拡張し、すべてのページとコンポーネントで使用するテキストキーを追加します。

**実装内容:**
- `src/renderer/utils/textResource.ts`を編集
- 書籍管理ページ用: `booksSubtitle`, `filterAvailableOnly`, `colCover`, `emptyBooks`, `loadingBooks`, `modalAddBook`, `modalEditBook`, `modalDeleteBook`, `confirmDelete`, `deleteWarning`, `btnCancel`, `btnAdd`, `btnUpdate`, `btnDelete`, `labelIsbn`, `labelTitle`, `labelAuthor`, `labelCoverUrl`, `btnFetchBookInfo`, `noImage`, `coverPreview`
- 貸出管理ページ用: `sectionLend`, `sectionReturn`, `labelMemberBarcode`, `labelBookBarcode`, `placeholderMemberBarcode`, `placeholderBookBarcode`, `btnClear`, `activeLoansTitle`, `colBookTitle`, `colBorrower`, `colBorrowDate`, `colDaysElapsed`, `emptyActiveLoans`, `loadingLoans`, `employeeInfo`, `bookInfo`, `loanCount`
- 社員管理ページ用: `employeesTitle`, `btnAddEmployee`, `colEmployeeId`, `colName`, `colEmail`, `colLoaned`, `emptyEmployees`, `modalAddEmployee`, `modalEditEmployee`, `modalDeleteEmployee`, `modalBarcode`, `labelEmployeeId`, `labelName`, `labelEmail`, `placeholderEmployeeId`, `placeholderName`, `placeholderEmail`, `btnBarcode`, `barcodeDescription`
- 履歴ページ用: `historyTitle`, `filterTitle`, `filterAllBooks`, `filterAllEmployees`, `filterAllStatus`, `filterActive`, `filterReturned`, `labelStartDate`, `labelEndDate`, `btnClearFilters`, `historyCount`, `colLoanPeriod`, `emptyHistory`, `loadingHistory`
- エラー・成功メッセージ: `errorLoadBooks`, `errorAddBook`, `errorUpdateBook`, `errorDeleteBook`, `errorLoadEmployees`, `errorAddEmployee`, `errorUpdateEmployee`, `errorDeleteEmployee`, `errorLoadLoans`, `errorBorrow`, `errorReturn`, `errorLoadHistory`, `errorNotFound`, `errorValidation`, `errorBarcode`, `successAddBook`, `successUpdateBook`, `successDeleteBook`, `successAddEmployee`, `successUpdateEmployee`, `successDeleteEmployee`, `successBorrow`, `successReturn`, `successBarcode`
- 各テキストキーに対して、通常モードとキッズモードの両方のテキストを定義
- キッズモードテキストには適切な`<ruby>`タグを含める

_要件: 1.1, 1.2, 1.3, 1.4, 1.5, 5.1, 5.2, 5.3, 5.4, 6.1, 6.2, 6.4, 6.5_

---

## - [ ] 2. RubyTextコンポーネントの作成

ふりがな付きテキストを安全にレンダリングするための専用コンポーネントを作成します。

**実装内容:**
- `src/renderer/components/RubyText.tsx`を新規作成
- `<ruby>`タグを含むテキストを`dangerouslySetInnerHTML`でレンダリング
- `<ruby>`タグを含まないテキストは通常のテキストとしてレンダリング
- エラーハンドリングを実装（不正なマークアップの場合はプレーンテキストにフォールバック）
- as propでレンダリングする要素タイプを指定可能にする（span, p, h1, h2など）
- `src/renderer/components/index.ts`にエクスポートを追加

_要件: 2.1, 2.2, 2.3, 2.4_

---

## - [ ] 3. UIコンポーネントのキッズモード対応

既存のButton、Input、Tableコンポーネントにキッズモード時のスタイル調整を追加します。

**実装内容:**
- **Button.tsx**: `useMode()`フックをインポート、キッズモード時にフォントサイズを大きくする（`text-xl`）、パディングを増やす（`px-8 py-4`）、デフォルトサイズを`lg`に変更
- **Input.tsx**: `useMode()`フックをインポート、キッズモード時にラベルのフォントサイズを大きくする（`text-lg`）、入力フィールドのフォントサイズを大きくする（`text-lg`）、ラベルにRubyTextコンポーネントを使用
- **Table.tsx**: `useMode()`フックをインポート、キッズモード時にヘッダーのフォントサイズを大きくする（`text-lg`）、セルのフォントサイズを大きくする（`text-base`）、行の高さを増やす

_要件: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6_

---

## - [ ] 4. BookManagementPageのテキストリソース適用

書籍管理ページのすべてのハードコードされたテキストをテキストリソースに置き換えます。

- `src/renderer/pages/BookManagementPage.tsx`を編集
- `useAppText()`フックをインポート
- RubyTextコンポーネントをインポート
- ページタイトル、サブタイトルをRubyTextコンポーネントで表示
- 検索プレースホルダー、フィルターラベルをテキストリソースから取得
- テーブルヘッダー（列名）をテキストリソースから取得
- ボタンテキストをテキストリソースから取得
- モーダルタイトル・本文をRubyTextコンポーネントで表示
- フォームラベル・プレースホルダーをテキストリソースから取得
- エラーメッセージ・成功メッセージをテキストリソースから取得
- _要件: 5.1, 6.1, 6.2_

---

## - [ ] 5. LoanManagementPageのテキストリソース適用

貸出管理ページのすべてのハードコードされたテキストをテキストリソースに置き換えます。

- `src/renderer/pages/LoanManagementPage.tsx`を編集
- `useAppText()`フックをインポート
- RubyTextコンポーネントをインポート
- ページタイトルをRubyTextコンポーネントで表示
- セクションタイトル（「貸出」「返却」）をRubyTextで表示
- ラベル・プレースホルダーをテキストリソースから取得
- ボタンテキストをテキストリソースから取得
- テーブルヘッダーをテキストリソースから取得
- エラーメッセージ・成功メッセージをテキストリソースから取得
- 情報表示テキスト（社員情報、書籍情報、貸出数）をテキストリソースから取得
- _要件: 5.2, 6.1, 6.2_

---

## - [ ] 6. EmployeeManagementPageのテキストリソース適用

社員管理ページのすべてのハードコードされたテキストをテキストリソースに置き換えます。

- `src/renderer/pages/EmployeeManagementPage.tsx`を編集
- `useAppText()`フックをインポート
- RubyTextコンポーネントをインポート
- ページタイトルをRubyTextコンポーネントで表示
- テーブルヘッダーをテキストリソースから取得
- ボタンテキストをテキストリソースから取得
- モーダルタイトル・本文をRubyTextコンポーネントで表示
- フォームラベル・プレースホルダーをテキストリソースから取得
- エラーメッセージ・成功メッセージをテキストリソースから取得
- _要件: 5.3, 6.1, 6.2_

---

## - [ ] 7. HistoryPageのテキストリソース適用

履歴ページのすべてのハードコードされたテキストをテキストリソースに置き換えます。

- `src/renderer/pages/HistoryPage.tsx`を編集
- `useAppText()`フックをインポート
- RubyTextコンポーネントをインポート
- ページタイトルをRubyTextコンポーネントで表示
- フィルターラベルをテキストリソースから取得
- テーブルヘッダーをテキストリソースから取得
- ボタンテキストをテキストリソースから取得
- エラーメッセージをテキストリソースから取得
- _要件: 5.4, 6.1_

---

## - [ ] 8. チェックポイント: すべてのテストが通ることを確認

すべてのページとコンポーネントの実装が完了したので、テストを実行して問題がないことを確認します。

- すべてのテストが通ることを確認
- 各ページでキッズモードと通常モードを切り替えて動作確認
- ユーザーに質問がある場合は確認
- _要件: すべて_

---

## - [ ]* 9. テキストリソースのプロパティテストを作成

テキストリソースの完全性と正確性を検証するプロパティテストを作成します。

### - [ ]* 9.1 プロパティ1: テキストリソースの完全性

- **Feature: kids-mode, Property 1: テキストリソースの完全性**
- すべてのテキストキーに通常モードとキッズモードの両方のバリアントが存在することをテスト
- fast-checkを使用してランダムなテキストキーでテスト
- **検証: 要件 1.1, 1.5, 6.5**
- _要件: 1.1, 1.5, 6.5_

### - [ ]* 9.2 プロパティ2: モード依存のテキスト取得

- **Feature: kids-mode, Property 2: モード依存のテキスト取得**
- キッズモードがアクティブな場合はキッズモードテキストが返されることをテスト
- 通常モードがアクティブな場合は通常モードテキストが返されることをテスト
- fast-checkを使用してランダムなテキストキーとモードでテスト
- **検証: 要件 1.2, 1.3**
- _要件: 1.2, 1.3_

### - [ ]* 9.3 プロパティ3: ふりがなマークアップの存在

- **Feature: kids-mode, Property 3: ふりがなマークアップの存在**
- キッズモードテキストに漢字が含まれている場合、`<ruby>`タグが含まれていることをテスト
- fast-checkを使用してランダムなテキストキーでテスト
- **検証: 要件 1.4, 3.2**
- _要件: 1.4, 3.2_

### - [ ]* 9.4 プロパティ4: ふりがなの正しいレンダリング

- **Feature: kids-mode, Property 4: ふりがなの正しいレンダリング**
- `<ruby>`タグを含むテキストをRubyTextコンポーネントでレンダリングしたときに、DOM内に正しい要素が存在することをテスト
- fast-checkを使用してランダムなテキストでテスト
- **検証: 要件 2.1, 2.3, 5.5**
- _要件: 2.1, 2.3, 5.5_

---

## - [ ]* 10. モード切替とナビゲーションのプロパティテストを作成

モード切替とナビゲーション表示制御の正確性を検証するプロパティテストを作成します。

### - [ ]* 10.1 プロパティ7: モード切替の動作

- **Feature: kids-mode, Property 7: モード切替の動作**
- モード切替ボタンをクリックしたときに、isKidsModeの状態が反転することをテスト
- すべての表示テキストとUIコンポーネントスタイルが即座に更新されることをテスト
- **検証: 要件 7.1, 7.2, 7.3**
- _要件: 7.1, 7.2, 7.3_

### - [ ]* 10.2 プロパティ8: ナビゲーション表示制御

- **Feature: kids-mode, Property 8: ナビゲーション表示制御**
- キッズモードがアクティブな場合、書籍管理と貸出管理のみが表示されることをテスト
- 通常モードがアクティブな場合、すべてのナビゲーション項目が表示されることをテスト
- **検証: 要件 8.1, 8.2, 8.3, 8.4, 8.5**
- _要件: 8.1, 8.2, 8.3, 8.4, 8.5_

### - [ ]* 10.3 プロパティ11: 状態の保持

- **Feature: kids-mode, Property 11: 状態の保持**
- モードを切り替えたときに、フォームデータ、検索フィルターなどのアプリケーション状態が保持されることをテスト
- **検証: 要件 7.5, 10.5**
- _要件: 7.5, 10.5_

---

## - [ ]* 11. 機能の同等性のプロパティテストを作成

キッズモードと通常モードで同じ機能が動作することを検証するプロパティテストを作成します。

### - [ ]* 11.1 プロパティ10: 機能の同等性

- **Feature: kids-mode, Property 10: 機能の同等性**
- キッズモードと通常モードで、書籍検索、貸出、返却、ビジネスルール適用が同じ動作をすることをテスト
- fast-checkを使用してランダムな入力でテスト
- **検証: 要件 10.1, 10.2, 10.3, 10.4**
- _要件: 10.1, 10.2, 10.3, 10.4_

---

## - [ ]* 12. ビジュアルテーマのプロパティテストを作成

キッズモード時のビジュアルテーマが正しく適用されることを検証するプロパティテストを作成します。

### - [ ]* 12.1 プロパティ9: ビジュアルテーマの適用

- **Feature: kids-mode, Property 9: ビジュアルテーマの適用**
- キッズモードがアクティブな場合、ヘッダー背景、ナビゲーションアイコン、モード切替ボタン、要素間スペーシング、カードパディングに適切なスタイルが適用されることをテスト
- **検証: 要件 9.1, 9.2, 9.3, 9.4, 9.5**
- _要件: 9.1, 9.2, 9.3, 9.4, 9.5_

---

## - [ ]* 13. メッセージのキッズモード対応のプロパティテストを作成

エラーメッセージ、成功メッセージ、バリデーションメッセージがキッズモードで正しく表示されることを検証するプロパティテストを作成します。

### - [ ]* 13.1 プロパティ6: メッセージのキッズモード対応

- **Feature: kids-mode, Property 6: メッセージのキッズモード対応**
- キッズモードがアクティブな場合、すべてのメッセージがキッズモードテキストバリアントを使用することをテスト
- fast-checkを使用してランダムなメッセージタイプでテスト
- **検証: 要件 6.1, 6.2, 6.3, 6.4**
- _要件: 6.1, 6.2, 6.3, 6.4_

---

## 実装完了

すべてのタスクが完了しました。キッズモード機能が正常に動作することを確認してください。
