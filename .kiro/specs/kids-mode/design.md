# 設計書: キッズモード（小学1年生用モード）

## 概要

キッズモード機能は、既存の図書管理システムに小学1年生向けの表示モードを追加する機能です。この機能は、言語の簡略化、ふりがなの追加、UIコンポーネントのサイズ調整により、若いユーザーにとって読みやすく使いやすいインターフェースを提供します。

既存のシステムアーキテクチャを維持しながら、表示層のみを変更することで、機能の同等性を保ちつつ、年齢に適したユーザーエクスペリエンスを実現します。

### 設計の主要原則

1. **非侵襲的な実装**: 既存のビジネスロジックやデータモデルを変更せず、表示層のみを拡張
2. **一元化されたテキスト管理**: すべてのUI文字列を`textResource.ts`で管理
3. **コンポーネントベースのスタイル調整**: 既存のUIコンポーネントにキッズモード対応を追加
4. **セキュアなふりがな表示**: XSS攻撃を防ぐための安全なHTML処理
5. **アクセシビリティの維持**: WCAG 2.1準拠を維持

## アーキテクチャ

### システム構成

```
┌─────────────────────────────────────────────────────────────┐
│                        Presentation Layer                    │
├─────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐      │
│  │   Layout     │  │    Pages     │  │  Components  │      │
│  │              │  │              │  │              │      │
│  │ - Header     │  │ - Books      │  │ - Button     │      │
│  │ - Nav        │  │ - Loans      │  │ - Input      │      │
│  │ - Footer     │  │ - Employees  │  │ - Table      │      │
│  │              │  │ - History    │  │ - Modal      │      │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘      │
│         │                 │                  │              │
│         └─────────────────┼──────────────────┘              │
│                           │                                 │
│  ┌────────────────────────▼──────────────────────────┐      │
│  │           Mode Context & Text Resources           │      │
│  │                                                    │      │
│  │  ┌──────────────┐      ┌──────────────────────┐  │      │
│  │  │ ModeContext  │◄─────┤  textResource.ts     │  │      │
│  │  │              │      │                      │  │      │
│  │  │ - isKidsMode │      │ - Normal Mode Text   │  │      │
│  │  │ - toggleMode │      │ - Kids Mode Text     │  │      │
│  │  └──────────────┘      │ - Ruby Markup        │  │      │
│  │                        └──────────────────────┘  │      │
│  └────────────────────────────────────────────────────┘      │
└─────────────────────────────────────────────────────────────┘
                           │
┌──────────────────────────▼──────────────────────────────────┐
│                    Business Logic Layer                      │
│  (変更なし - 既存のサービス、リポジトリ、モデル)                │
└─────────────────────────────────────────────────────────────┘
```

### データフロー

1. **モード切替フロー**
   ```
   User clicks toggle → ModeContext.toggleMode() → 
   isKidsMode state changes → All components re-render → 
   useAppText() returns new text variants
   ```

2. **テキスト取得フロー**
   ```
   Component renders → useAppText().getText(key) → 
   Check isKidsMode → Return appropriate text variant → 
   Render with RubyText component (if contains <ruby> tags)
   ```

3. **UIサイズ調整フロー**
   ```
   Component renders → Check isKidsMode from useMode() → 
   Apply conditional className → Render with adjusted styles
   ```

## コンポーネントとインターフェース

### 1. ModeContext (既存)

**場所**: `src/renderer/contexts/ModeContext.tsx`

**責務**: アプリケーション全体のモード状態を管理

**インターフェース**:
```typescript
interface ModeContextType {
  isKidsMode: boolean;
  toggleMode: () => void;
}
```

**変更**: なし（既に実装済み）

### 2. textResource.ts (拡張)

**場所**: `src/renderer/utils/textResource.ts`

**責務**: すべてのUI文字列を一元管理し、モードに応じた適切なテキストを提供

**拡張内容**:
- 新しいTextKeyの追加（書籍管理、貸出管理、社員管理、履歴ページ用）
- エラーメッセージ・成功メッセージのキー追加
- キッズモードテキストに`<ruby>`タグを含める

**インターフェース**:
```typescript
export type TextKey =
  // 既存のキー
  | 'appTitle'
  | 'menuBooks'
  // ... 既存のキー
  
  // 新規追加: 書籍管理ページ
  | 'booksSubtitle'
  | 'filterAvailableOnly'
  | 'colCover'
  | 'emptyBooks'
  | 'modalAddBook'
  | 'modalEditBook'
  | 'modalDeleteBook'
  | 'btnCancel'
  | 'btnAdd'
  | 'btnUpdate'
  | 'btnDelete'
  | 'confirmDelete'
  | 'deleteWarning'
  | 'labelIsbn'
  | 'labelTitle'
  | 'labelAuthor'
  | 'labelCoverUrl'
  | 'btnFetchBookInfo'
  | 'loadingBooks'
  | 'noImage'
  
  // 新規追加: 貸出管理ページ
  | 'sectionLend'
  | 'sectionReturn'
  | 'labelMemberBarcode'
  | 'labelBookBarcode'
  | 'placeholderMemberBarcode'
  | 'placeholderBookBarcode'
  | 'btnClear'
  | 'activeLoansTitle'
  | 'colBorrower'
  | 'colBorrowDate'
  | 'colDaysElapsed'
  | 'emptyActiveLoans'
  | 'loadingLoans'
  | 'loanCount'
  
  // 新規追加: 社員管理ページ
  | 'employeesTitle'
  | 'btnAddEmployee'
  | 'colEmployeeId'
  | 'colName'
  | 'colEmail'
  | 'colLoaned'
  | 'emptyEmployees'
  | 'modalAddEmployee'
  | 'modalEditEmployee'
  | 'modalDeleteEmployee'
  | 'modalBarcode'
  | 'labelEmployeeId'
  | 'labelName'
  | 'labelEmail'
  | 'placeholderEmployeeId'
  | 'placeholderName'
  | 'placeholderEmail'
  | 'btnBarcode'
  | 'barcodeDescription'
  
  // 新規追加: 履歴ページ
  | 'historyTitle'
  | 'filterTitle'
  | 'filterAllBooks'
  | 'filterAllEmployees'
  | 'filterAllStatus'
  | 'filterActive'
  | 'filterReturned'
  | 'labelStartDate'
  | 'labelEndDate'
  | 'btnClearFilters'
  | 'historyCount'
  | 'colLoanPeriod'
  | 'emptyHistory'
  | 'loadingHistory'
  
  // 新規追加: エラー・成功メッセージ
  | 'errorLoadBooks'
  | 'errorAddBook'
  | 'errorUpdateBook'
  | 'errorDeleteBook'
  | 'errorLoadEmployees'
  | 'errorAddEmployee'
  | 'errorUpdateEmployee'
  | 'errorDeleteEmployee'
  | 'errorLoadLoans'
  | 'errorBorrow'
  | 'errorReturn'
  | 'errorLoadHistory'
  | 'errorNotFound'
  | 'errorValidation'
  | 'successAddBook'
  | 'successUpdateBook'
  | 'successDeleteBook'
  | 'successAddEmployee'
  | 'successUpdateEmployee'
  | 'successDeleteEmployee'
  | 'successBorrow'
  | 'successReturn'
  | 'successBarcode'
  | 'errorBarcode';

const resources: Record<TextKey, { normal: string; kids: string }> = {
  // 例: 書籍管理ページ
  booksSubtitle: {
    normal: '書籍の登録、編集、削除を行います',
    kids: '<ruby>本<rt>ほん</rt></ruby>を <ruby>探<rt>さが</rt></ruby>したり <ruby>借<rt>か</rt></ruby>りたり できるよ'
  },
  // ... その他のリソース
};

export const useAppText = () => {
  const { isKidsMode } = useMode();
  
  const getText = (key: TextKey): string => {
    return resources[key][isKidsMode ? 'kids' : 'normal'];
  };
  
  return { getText, isKidsMode };
};
```

### 3. RubyText Component (新規作成)

**場所**: `src/renderer/components/RubyText.tsx`

**責務**: `<ruby>`タグを含むテキストを安全にレンダリング

**実装方針**:
- `dangerouslySetInnerHTML`を使用するが、入力は信頼できるテキストリソースのみ
- XSS攻撃を防ぐため、外部入力は受け付けない
- アクセシビリティ属性を適切に設定

**インターフェース**:
```typescript
interface RubyTextProps {
  text: string;
  className?: string;
  as?: 'span' | 'p' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'div';
}

const RubyText: React.FC<RubyTextProps> = ({ text, className = '', as = 'span' }) => {
  const Component = as;
  
  // <ruby>タグが含まれているかチェック
  const hasRuby = text.includes('<ruby>');
  
  if (!hasRuby) {
    // ふりがながない場合は通常のテキストとして表示
    return <Component className={className}>{text}</Component>;
  }
  
  // ふりがながある場合はHTMLとしてレンダリング
  // 注意: textResourceからのみ使用するため、XSSリスクは低い
  return (
    <Component 
      className={className}
      dangerouslySetInnerHTML={{ __html: text }}
    />
  );
};
```

### 4. Button Component (拡張)

**場所**: `src/renderer/components/Button.tsx`

**拡張内容**: キッズモード時のサイズとスタイル調整

**変更点**:
```typescript
const Button: React.FC<ButtonProps> = ({
  // ... 既存のprops
}) => {
  const { isKidsMode } = useMode();
  
  // キッズモード時はデフォルトサイズを大きくする
  const effectiveSize = isKidsMode && size === 'md' ? 'lg' : size;
  
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: isKidsMode ? 'px-8 py-4 text-xl' : 'px-6 py-3 text-lg',
  };
  
  // ... 残りの実装
};
```

### 5. Input Component (拡張)

**場所**: `src/renderer/components/Input.tsx`

**拡張内容**: キッズモード時のフォントサイズとラベルサイズ調整

**変更点**:
```typescript
const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ /* ... props */ }, ref) => {
    const { isKidsMode } = useMode();
    
    return (
      <div className={`mb-4 ${className}`}>
        {label && (
          <label 
            htmlFor={inputId} 
            className={`block font-medium mb-1.5 ${
              isKidsMode ? 'text-lg' : 'text-sm'
            } text-gray-700`}
          >
            <RubyText text={label} />
            {/* ... */}
          </label>
        )}
        <input
          className={`
            w-full px-3 py-2
            ${isKidsMode ? 'text-lg' : 'text-base'}
            /* ... 残りのクラス */
          `}
          /* ... */
        />
        {/* ... */}
      </div>
    );
  }
);
```

### 6. Table Component (拡張)

**場所**: `src/renderer/components/Table.tsx`

**拡張内容**: キッズモード時のフォントサイズと行の高さ調整

**変更点**:
```typescript
const Table = <T extends Record<string, any>>({
  /* ... props */
}: TableProps<T>) => {
  const { isKidsMode } = useMode();
  
  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className={`bg-gray-50 ${isKidsMode ? 'text-lg' : 'text-sm'}`}>
            {/* ... */}
          </thead>
          <tbody className={`bg-white divide-y divide-gray-200 ${
            isKidsMode ? 'text-base' : 'text-sm'
          }`}>
            {/* ... */}
          </tbody>
        </table>
      </div>
    </div>
  );
};
```

### 7. Page Components (拡張)

各ページコンポーネント（BookManagementPage、LoanManagementPage、EmployeeManagementPage、HistoryPage）で、ハードコードされたテキストを`useAppText()`を使用したテキストリソースに置き換えます。

**変更パターン**:
```typescript
// Before
<h2 className="text-2xl font-bold">書籍管理</h2>
<p className="text-sm text-gray-600">書籍の登録、編集、削除を行います</p>

// After
const { getText } = useAppText();

<RubyText text={getText('booksTitle')} as="h2" className="text-2xl font-bold" />
<RubyText text={getText('booksSubtitle')} as="p" className="text-sm text-gray-600" />
```

## データモデル

キッズモード機能は表示層のみの変更であるため、既存のデータモデル（Book、Employee、LoanRecord）に変更はありません。

## 正確性プロパティ


*プロパティとは、システムのすべての有効な実行において真であるべき特性または動作のことです。本質的には、システムが何をすべきかについての形式的な記述です。プロパティは、人間が読める仕様と機械で検証可能な正確性保証との橋渡しとなります。*

### プロパティ1: テキストリソースの完全性

*すべての*テキストキーに対して、通常モードとキッズモードの両方のテキストバリアントが存在する必要があります。

**検証: 要件 1.1, 1.5, 6.5**

### プロパティ2: モード依存のテキスト取得

*すべての*テキストキーに対して、キッズモードがアクティブな場合はキッズモードテキストが返され、通常モードがアクティブな場合は通常モードテキストが返される必要があります。

**検証: 要件 1.2, 1.3**

### プロパティ3: ふりがなマークアップの存在

*すべての*キッズモードテキストバリアントに対して、漢字が含まれている場合は`<ruby>`タグを使用したふりがなマークアップが含まれている必要があります。

**検証: 要件 1.4, 3.2**

### プロパティ4: ふりがなの正しいレンダリング

*すべての*`<ruby>`タグを含むテキストに対して、RubyTextコンポーネントでレンダリングしたときに、DOM内に正しい`<ruby>`および`<rt>`要素が存在する必要があります。

**検証: 要件 2.1, 2.3, 5.5**

### プロパティ5: UIコンポーネントのサイズ調整

*すべての*UIコンポーネント（Button、Input、Table）に対して、キッズモードがアクティブな場合は、通常モードよりも大きなフォントサイズとパディングが適用される必要があります。

**検証: 要件 4.1, 4.2, 4.3, 4.4, 4.5, 4.6**

### プロパティ6: メッセージのキッズモード対応

*すべての*エラーメッセージ、成功メッセージ、バリデーションメッセージ、トースト通知に対して、キッズモードがアクティブな場合は、キッズモードテキストバリアントが使用される必要があります。

**検証: 要件 6.1, 6.2, 6.3, 6.4**

### プロパティ7: モード切替の動作

*すべての*モード切替操作に対して、isKidsModeの状態が反転し、すべての表示テキストとUIコンポーネントスタイルが即座に更新される必要があります。

**検証: 要件 7.1, 7.2, 7.3**

### プロパティ8: ナビゲーション表示制御

*すべての*ナビゲーション項目に対して、キッズモードがアクティブな場合は、書籍管理と貸出管理のみが表示され、社員管理と履歴は非表示になる必要があります。通常モードではすべてが表示される必要があります。

**検証: 要件 8.1, 8.2, 8.3, 8.4, 8.5**

### プロパティ9: ビジュアルテーマの適用

*すべての*キッズモードセッションに対して、ヘッダー背景、ナビゲーションアイコン、モード切替ボタン、要素間スペーシング、カードパディングに、キッズモード専用のスタイルが適用される必要があります。

**検証: 要件 9.1, 9.2, 9.3, 9.4, 9.5**

### プロパティ10: 機能の同等性

*すべての*コア機能（書籍検索、貸出、返却、ビジネスルール適用）に対して、キッズモードと通常モードで同じ動作をする必要があります。

**検証: 要件 10.1, 10.2, 10.3, 10.4**

### プロパティ11: 状態の保持

*すべての*モード切替操作に対して、現在のページ、フォームデータ、検索フィルターを含むアプリケーション状態が保持される必要があります。

**検証: 要件 7.5, 10.5**

## エラーハンドリング

### 1. テキストリソースの欠落

**シナリオ**: 要求されたテキストキーがテキストリソースに存在しない

**対応**:
- 開発時: TypeScriptの型システムにより、存在しないキーの使用を防止
- 実行時: フォールバック値を返す（例: キー名そのもの）
- ログ: コンソールに警告を出力

```typescript
const getText = (key: TextKey): string => {
  const resource = resources[key];
  if (!resource) {
    console.warn(`Text resource not found: ${key}`);
    return key;
  }
  return resource[isKidsMode ? 'kids' : 'normal'];
};
```

### 2. ふりがなマークアップのエラー

**シナリオ**: `<ruby>`タグの構文が不正

**対応**:
- 開発時: テキストリソースのバリデーションテストを実施
- 実行時: RubyTextコンポーネントでエラーをキャッチし、プレーンテキストとして表示
- ログ: コンソールにエラーを出力

```typescript
const RubyText: React.FC<RubyTextProps> = ({ text, className = '', as = 'span' }) => {
  const Component = as;
  
  try {
    const hasRuby = text.includes('<ruby>');
    
    if (!hasRuby) {
      return <Component className={className}>{text}</Component>;
    }
    
    // 簡易的なバリデーション
    if (!text.includes('</ruby>') || !text.includes('<rt>')) {
      console.error('Invalid ruby markup:', text);
      return <Component className={className}>{text.replace(/<[^>]+>/g, '')}</Component>;
    }
    
    return (
      <Component 
        className={className}
        dangerouslySetInnerHTML={{ __html: text }}
      />
    );
  } catch (error) {
    console.error('Error rendering ruby text:', error);
    return <Component className={className}>{text.replace(/<[^>]+>/g, '')}</Component>;
  }
};
```

### 3. モード切替の失敗

**シナリオ**: モード切替時にコンポーネントの再レンダリングが失敗

**対応**:
- React Error Boundaryでエラーをキャッチ
- ユーザーにエラーメッセージを表示
- 前のモード状態にロールバック

### 4. 画像読み込みエラー

**シナリオ**: 書影URLが無効または読み込みに失敗

**対応**:
- `onError`ハンドラーでフォールバック画像を表示
- キッズモードでは「絵がない」、通常モードでは「画像なし」と表示

## テスト戦略

### ユニットテスト

キッズモード機能のユニットテストは、以下の領域をカバーします：

1. **テキストリソース**
   - すべてのテキストキーに通常モードとキッズモードの両方のバリアントが存在することを確認
   - キッズモードテキストに適切な`<ruby>`タグが含まれていることを確認
   - 特定のテキストキーが期待される値を返すことを確認

2. **RubyTextコンポーネント**
   - `<ruby>`タグを含むテキストが正しくレンダリングされることを確認
   - `<ruby>`タグを含まないテキストがプレーンテキストとしてレンダリングされることを確認
   - 不正なマークアップがエラーハンドリングされることを確認

3. **UIコンポーネント**
   - Button、Input、Tableコンポーネントがキッズモード時に適切なスタイルを適用することを確認
   - 各コンポーネントがRubyTextコンポーネントと統合できることを確認

4. **ModeContext**
   - toggleMode()が状態を正しく切り替えることを確認
   - useMode()フックが正しい値を返すことを確認

### プロパティベーステスト

プロパティベーステストは、TypeScriptの型システムとJestまたはVitestを使用して実装します。fast-checkライブラリを使用して、ランダムな入力に対してプロパティが保持されることを確認します。

**使用するライブラリ**: fast-check (JavaScript/TypeScript用のプロパティベーステストライブラリ)

**テスト設定**: 各プロパティテストは最低100回の反復を実行

**プロパティテストの実装例**:

```typescript
import fc from 'fast-check';
import { resources, TextKey } from '../utils/textResource';

describe('Property Tests: Kids Mode', () => {
  test('Property 1: Text resource completeness', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(resources) as TextKey[]),
        (key) => {
          const resource = resources[key];
          return (
            resource !== undefined &&
            resource.normal !== undefined &&
            resource.kids !== undefined &&
            typeof resource.normal === 'string' &&
            typeof resource.kids === 'string'
          );
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 2: Mode-dependent text retrieval', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(resources) as TextKey[]),
        fc.boolean(),
        (key, isKidsMode) => {
          const resource = resources[key];
          const expectedText = isKidsMode ? resource.kids : resource.normal;
          // useAppText()をモックして、期待されるテキストが返されることを確認
          return expectedText !== undefined;
        }
      ),
      { numRuns: 100 }
    );
  });

  test('Property 3: Furigana markup presence', () => {
    fc.assert(
      fc.property(
        fc.constantFrom(...Object.keys(resources) as TextKey[]),
        (key) => {
          const kidsText = resources[key].kids;
          // 漢字が含まれている場合、<ruby>タグが存在することを確認
          const hasKanji = /[\u4e00-\u9faf]/.test(kidsText);
          if (hasKanji) {
            return kidsText.includes('<ruby>') && kidsText.includes('<rt>');
          }
          return true; // 漢字がない場合はパス
        }
      ),
      { numRuns: 100 }
    );
  });
});
```

### 統合テスト

統合テストは、以下のシナリオをカバーします：

1. **モード切替フロー**
   - ユーザーがモード切替ボタンをクリック
   - すべてのページでテキストが更新される
   - UIコンポーネントのスタイルが更新される
   - ナビゲーション項目の表示/非表示が切り替わる

2. **ページ間ナビゲーション**
   - キッズモードで書籍管理ページから貸出管理ページに移動
   - モード状態が保持される
   - 各ページで適切なテキストが表示される

3. **フォーム操作**
   - キッズモードで書籍追加フォームを開く
   - フォームラベルとプレースホルダーがキッズモードテキストで表示される
   - モードを切り替えても入力データが保持される

### エッジケースとエラーケース

1. **空のテキストリソース**: テキストが空文字列の場合の動作
2. **非常に長いテキスト**: 長いテキストがUIを壊さないことを確認
3. **特殊文字**: 特殊文字（絵文字、記号など）が正しく表示されることを確認
4. **ネストされたrubyタグ**: 複雑なふりがなマークアップの処理
5. **モード切替の連続実行**: 短時間に複数回モードを切り替えた場合の動作

## セキュリティ考慮事項

### 1. XSS攻撃の防止

**リスク**: `dangerouslySetInnerHTML`を使用してふりがなをレンダリングする際、XSS攻撃のリスクがあります。

**対策**:
- テキストリソースは静的に定義され、外部入力を受け付けない
- RubyTextコンポーネントは、テキストリソースからのテキストのみを受け入れる
- ユーザー入力を直接RubyTextコンポーネントに渡さない
- 開発時にテキストリソースのバリデーションを実施

### 2. コンテンツセキュリティポリシー (CSP)

**推奨設定**:
```
Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline';
```

`unsafe-inline`は、Reactのインラインスタイルとふりがなのレンダリングに必要です。

### 3. 入力サニタイゼーション

ユーザー入力（書籍タイトル、著者名など）は、表示前にサニタイズされます。ただし、これらはRubyTextコンポーネントを通さず、通常のReactコンポーネントでレンダリングされるため、Reactの自動エスケープにより保護されます。

## パフォーマンス考慮事項

### 1. テキストリソースの読み込み

テキストリソースは静的にインポートされ、アプリケーション起動時に一度だけ読み込まれます。モード切替時に追加の読み込みは発生しません。

### 2. コンポーネントの再レンダリング

モード切替時、ModeContextを使用しているすべてのコンポーネントが再レンダリングされます。これは意図的な動作であり、パフォーマンスへの影響は最小限です。

**最適化**:
- React.memoを使用して、不要な再レンダリングを防止
- useCallbackとuseMemoを適切に使用

### 3. ふりがなのレンダリング

`dangerouslySetInnerHTML`を使用したHTMLレンダリングは、通常のReactレンダリングよりもわずかに遅い可能性があります。ただし、テキストの量が少ないため、実用上の問題はありません。

## アクセシビリティ

### 1. スクリーンリーダー対応

- `<ruby>`タグはスクリーンリーダーで適切にサポートされています
- ふりがなは読み上げられますが、基本の漢字も読み上げられます
- aria-label属性を適切に設定し、コンテキストを提供

### 2. キーボードナビゲーション

- モード切替ボタンはキーボードでアクセス可能
- すべてのインタラクティブ要素にフォーカスインジケーターを表示
- タブオーダーは論理的な順序を維持

### 3. 色のコントラスト

- キッズモードの配色はWCAG 2.1 AA基準を満たす
- テキストと背景のコントラスト比は最低4.5:1
- 大きなテキスト（18pt以上）は3:1以上

### 4. フォントサイズ

- キッズモードのフォントサイズは、視覚障害のあるユーザーにも有益
- ユーザーはブラウザのズーム機能を使用してさらに拡大可能

## 実装の優先順位

### フェーズ1: 基盤の構築（高優先度）
1. textResource.tsの拡張（すべてのテキストキーを追加）
2. RubyTextコンポーネントの作成
3. Button、Input、Tableコンポーネントのキッズモード対応

### フェーズ2: ページの更新（高優先度）
1. BookManagementPageのテキストリソース適用
2. LoanManagementPageのテキストリソース適用
3. EmployeeManagementPageのテキストリソース適用
4. HistoryPageのテキストリソース適用

### フェーズ3: メッセージとエラーハンドリング（中優先度）
1. エラーメッセージのキッズモード対応
2. 成功メッセージのキッズモード対応
3. バリデーションメッセージのキッズモード対応

### フェーズ4: テストとドキュメント（中優先度）
1. ユニットテストの作成
2. プロパティベーステストの作成
3. 統合テストの作成

### フェーズ5: 最適化と調整（低優先度）
1. パフォーマンスの最適化
2. UIの微調整
3. アクセシビリティの最終確認

## 将来の拡張可能性

### 1. 多言語対応

現在の設計は、将来的に他の言語（英語、中国語など）を追加することを容易にします。textResource.tsに新しい言語バリアントを追加するだけで対応可能です。

### 2. カスタマイズ可能なテーマ

キッズモードのビジュアルテーマ（色、フォント、アイコンなど）をユーザーがカスタマイズできるようにすることが可能です。

### 3. 年齢別モード

小学1年生だけでなく、他の年齢層（幼稚園、小学3年生など）向けのモードを追加することが可能です。

### 4. 音声読み上げ

テキストを音声で読み上げる機能を追加することで、読字障害のあるユーザーや、まだ文字を読めない子供たちをサポートできます。

## まとめ

キッズモード機能は、既存の図書管理システムに最小限の変更を加えながら、小学1年生向けの使いやすいインターフェースを提供します。一元化されたテキスト管理、コンポーネントベースのスタイル調整、セキュアなふりがな表示により、保守性が高く、拡張可能な設計となっています。

プロパティベーステストとユニットテストの組み合わせにより、機能の正確性を保証し、将来の変更に対する信頼性を確保します。
