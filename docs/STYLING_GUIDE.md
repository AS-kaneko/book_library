# スタイリングガイド

## 概要

このドキュメントは、図書管理システムのUIスタイリングに関するガイドラインを提供します。

## デザインシステム

### カラーパレット

#### プライマリカラー（青）
```javascript
primary: {
  50: '#EFF6FF',   // 最も薄い
  100: '#DBEAFE',
  200: '#BFDBFE',
  300: '#93C5FD',
  400: '#60A5FA',
  500: '#3B82F6',  // デフォルト
  600: '#2563EB',
  700: '#1D4ED8',
  800: '#1E40AF',
  900: '#1E3A8A',  // 最も濃い
}
```

#### 成功カラー（緑）
```javascript
success: {
  500: '#10B981',  // デフォルト
  100: '#D1FAE5',  // バッジ背景
  800: '#065F46',  // バッジテキスト
}
```

#### 警告カラー（黄）
```javascript
warning: {
  500: '#F59E0B',  // デフォルト
  100: '#FEF3C7',  // バッジ背景
  800: '#92400E',  // バッジテキスト
}
```

#### エラーカラー（赤）
```javascript
error: {
  500: '#EF4444',  // デフォルト
  100: '#FEE2E2',  // バッジ背景
  800: '#991B1B',  // バッジテキスト
}
```

#### グレースケール
```javascript
gray: {
  50: '#F9FAFB',   // 背景
  100: '#F3F4F6',  // カード背景
  200: '#E5E7EB',  // ボーダー
  300: '#D1D5DB',  // 入力ボーダー
  500: '#6B7280',  // セカンダリテキスト
  700: '#374151',  // ラベル
  900: '#111827',  // メインテキスト
}
```

### タイポグラフィ

#### フォントファミリー
```css
font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 
             'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 
             'Droid Sans', 'Helvetica Neue', sans-serif;
```

#### フォントサイズ
```javascript
'xs': '0.75rem',    // 12px - 小さなラベル
'sm': '0.875rem',   // 14px - テーブル、補助テキスト
'base': '1rem',     // 16px - 本文
'lg': '1.125rem',   // 18px - 小見出し
'xl': '1.25rem',    // 20px - モーダルタイトル
'2xl': '1.5rem',    // 24px - ページタイトル
'3xl': '1.875rem',  // 30px - メインヘッダー
```

#### フォントウェイト
- `font-normal`: 400 - 本文
- `font-medium`: 500 - ラベル
- `font-semibold`: 600 - ボタン、小見出し
- `font-bold`: 700 - 見出し

### スペーシング

#### マージン・パディング
```javascript
0: '0px',
1: '0.25rem',  // 4px
2: '0.5rem',   // 8px
3: '0.75rem',  // 12px
4: '1rem',     // 16px
5: '1.25rem',  // 20px
6: '1.5rem',   // 24px
8: '2rem',     // 32px
```

#### コンポーネント間のスペース
- セクション間: `space-y-6` (24px)
- カード内の要素: `space-y-4` (16px)
- ボタングループ: `space-x-3` (12px)

### シャドウ

```javascript
'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',           // カード
'DEFAULT': '0 1px 3px 0 rgb(0 0 0 / 0.1)',       // ボタン
'md': '0 4px 6px -1px rgb(0 0 0 / 0.1)',         // ホバー
'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1)',       // モーダル
'2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',    // 強調
```

### ボーダー半径

```javascript
'none': '0px',
'sm': '0.125rem',   // 2px
'DEFAULT': '0.25rem', // 4px
'md': '0.375rem',   // 6px
'lg': '0.5rem',     // 8px
'full': '9999px',   // 完全な円形
```

## コンポーネントスタイル

### ボタン

#### サイズ
```javascript
sm: 'px-3 py-1.5 text-sm',      // 小
md: 'px-4 py-2 text-base',      // 中（デフォルト）
lg: 'px-6 py-3 text-lg',        // 大
```

#### バリアント
```javascript
primary: 'bg-primary-500 hover:bg-primary-600'
secondary: 'bg-gray-500 hover:bg-gray-600'
danger: 'bg-error-500 hover:bg-error-600'
success: 'bg-success-500 hover:bg-success-600'
```

#### 使用例
```tsx
<Button variant="primary" size="md">
  保存
</Button>
```

### 入力フィールド

#### 基本スタイル
```css
w-full px-3 py-2 text-base
border border-gray-300 rounded-md
focus:ring-2 focus:ring-primary-500
```

#### 状態
- **通常**: `border-gray-300`
- **フォーカス**: `border-primary-500 ring-primary-500`
- **エラー**: `border-error-500 ring-error-500`
- **無効**: `bg-gray-100 cursor-not-allowed`

### カード

#### 基本構造
```tsx
<div className="card">
  <div className="card-body">
    {/* コンテンツ */}
  </div>
</div>
```

#### スタイル
```css
.card {
  @apply bg-white rounded-lg shadow-sm border border-gray-200;
}

.card-body {
  @apply p-6;
}
```

### バッジ

#### バリアント
```tsx
<span className="badge badge-success">利用可能</span>
<span className="badge badge-error">貸出中</span>
<span className="badge badge-warning">警告</span>
<span className="badge badge-info">情報</span>
```

#### スタイル
```css
.badge {
  @apply inline-flex items-center px-2.5 py-0.5 
         rounded-full text-xs font-medium;
}
```

### テーブル

#### 構造
```tsx
<Table
  columns={columns}
  data={data}
  striped={true}
  hoverable={true}
  caption="データ一覧"
/>
```

#### スタイル
- ヘッダー: `bg-gray-50 font-semibold text-xs uppercase`
- 行: `hover:bg-gray-100 transition-colors`
- セル: `px-6 py-4 text-sm`

### モーダル

#### サイズ
```javascript
sm: 'max-w-md',    // 小（確認ダイアログ）
md: 'max-w-lg',    // 中（フォーム）
lg: 'max-w-2xl',   // 大
xl: 'max-w-4xl',   // 特大
```

#### 構造
```tsx
<Modal
  isOpen={isOpen}
  onClose={onClose}
  title="タイトル"
  size="md"
  footer={<>ボタン</>}
>
  {/* コンテンツ */}
</Modal>
```

## レイアウトパターン

### ページレイアウト
```tsx
<div className="space-y-6">
  {/* ページヘッダー */}
  <div className="flex justify-between items-center">
    <h2 className="text-2xl font-bold">タイトル</h2>
    <Button>アクション</Button>
  </div>

  {/* フィルター/検索 */}
  <div className="card">
    <div className="card-body">
      {/* フィルターコンテンツ */}
    </div>
  </div>

  {/* メインコンテンツ */}
  <Table {...props} />
</div>
```

### フォームレイアウト
```tsx
<div className="space-y-4">
  <Input label="ラベル1" {...props} />
  <Input label="ラベル2" {...props} />
  
  <div className="flex justify-end space-x-3">
    <Button variant="secondary">キャンセル</Button>
    <Button variant="primary">保存</Button>
  </div>
</div>
```

## アニメーション

### トランジション
```css
transition-colors duration-200    /* 色の変化 */
transition-all duration-200       /* すべてのプロパティ */
```

### アニメーション
```css
animate-fade-in      /* フェードイン */
animate-slide-in     /* スライドイン（右から） */
animate-scale-in     /* スケールイン */
```

### 使用例
```tsx
<div className="animate-fade-in">
  {/* コンテンツ */}
</div>
```

## レスポンシブデザイン

### ブレークポイント
```javascript
sm: '640px',   // スマートフォン（横）
md: '768px',   // タブレット
lg: '1024px',  // デスクトップ
xl: '1280px',  // 大画面
```

### 使用例
```tsx
<div className="flex flex-col sm:flex-row gap-4">
  {/* モバイルは縦、デスクトップは横 */}
</div>
```

## ベストプラクティス

### 1. 一貫性
- 同じ目的のコンポーネントには同じスタイルを使用
- カラーパレットを守る
- スペーシングシステムを使用

### 2. アクセシビリティ
- 十分なコントラスト比を確保
- フォーカス状態を明確に
- タッチターゲットは44x44px以上

### 3. パフォーマンス
- 不要なアニメーションを避ける
- CSSクラスを再利用
- Tailwindのユーティリティクラスを活用

### 4. メンテナンス性
- カスタムCSSは最小限に
- コンポーネントを再利用
- デザイントークンを使用

## カスタマイズ

### Tailwind設定の拡張
```javascript
// tailwind.config.js
export default {
  theme: {
    extend: {
      colors: {
        // カスタムカラーを追加
      },
    },
  },
}
```

### カスタムユーティリティ
```css
/* src/renderer/index.css */
@layer utilities {
  .custom-utility {
    /* カスタムスタイル */
  }
}
```

## トラブルシューティング

### スタイルが適用されない
1. Tailwindのコンテンツパスを確認
2. クラス名のスペルを確認
3. ブラウザのキャッシュをクリア

### レスポンシブが機能しない
1. ビューポートメタタグを確認
2. ブレークポイントの順序を確認（小→大）

### アニメーションがカクつく
1. `will-change`プロパティを使用
2. `transform`と`opacity`のみをアニメーション
3. `prefers-reduced-motion`を考慮
