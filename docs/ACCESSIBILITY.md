# アクセシビリティガイド

## 概要

図書管理システムは、すべてのユーザーが快適に利用できるよう、アクセシビリティに配慮して設計されています。

## 実装されたアクセシビリティ機能

### 1. キーボードナビゲーション

#### 基本操作
- **Tab**: 次の要素にフォーカス移動
- **Shift + Tab**: 前の要素にフォーカス移動
- **Enter / Space**: ボタンやリンクの実行
- **Escape**: モーダルを閉じる

#### スキップリンク
- ページ上部に「メインコンテンツへスキップ」リンクを配置
- キーボードフォーカス時のみ表示
- メインコンテンツに直接ジャンプ可能

#### モーダルのフォーカス管理
- モーダルが開くと自動的にフォーカスが移動
- モーダル内でTabキーによる循環フォーカス
- モーダルを閉じると元の要素にフォーカスが戻る
- Escapeキーでモーダルを閉じる

#### テーブルのキーボード操作
- クリック可能な行はTabキーでフォーカス可能
- EnterキーまたはSpaceキーで行を選択

### 2. フォーカスインジケーター

#### 視覚的なフォーカス表示
- すべてのインタラクティブ要素に明確なフォーカスリング
- プライマリカラー（青）のリング（2px幅）
- エラー状態の要素は赤いフォーカスリング
- 2pxのオフセットで要素との間隔を確保

#### カスタムフォーカススタイル
```css
*:focus-visible {
  @apply ring-2 ring-primary-500 ring-offset-2;
}
```

### 3. ARIAラベルと役割

#### セマンティックHTML
- 適切なHTML要素の使用（button, nav, main, header, footer）
- ランドマーク要素による構造化

#### ARIAラベル
- すべてのボタンに`aria-label`属性
- フォーム入力に`aria-describedby`でヘルプテキストを関連付け
- エラーメッセージに`aria-invalid`と`role="alert"`

#### モーダル
- `role="dialog"`
- `aria-modal="true"`
- `aria-labelledby`でタイトルを参照

#### ナビゲーション
- `role="navigation"`
- `aria-label="メインナビゲーション"`
- アクティブなタブに`aria-current="page"`

#### テーブル
- `<caption>`要素でテーブルの説明
- `scope="col"`で列ヘッダーを明示

### 4. カラーコントラスト

#### WCAG AA準拠
- テキストと背景のコントラスト比: 最低4.5:1
- 大きなテキスト（18px以上）: 最低3:1

#### カラーパレット
```javascript
primary: '#3B82F6'   // 青 - ボタン、リンク
success: '#10B981'   // 緑 - 成功メッセージ、利用可能状態
warning: '#F59E0B'   // 黄 - 警告メッセージ
error: '#EF4444'     // 赤 - エラーメッセージ、貸出中状態
```

#### 状態表示
- 色だけでなくアイコンやテキストでも状態を表現
- バッジに適切なコントラストの背景色と文字色

### 5. スクリーンリーダー対応

#### 視覚的に隠された要素
```css
.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border-width: 0;
}
```

#### 装飾的な要素
- アイコンに`aria-hidden="true"`
- 重要な情報は代替テキストで提供

#### ライブリージョン
- トースト通知に`aria-live="polite"`
- エラーメッセージに`role="alert"`

### 6. フォームのアクセシビリティ

#### ラベルの関連付け
- すべての入力フィールドに`<label>`要素
- `htmlFor`と`id`で明示的に関連付け

#### 必須フィールド
- 視覚的な`*`マーク
- `required`属性
- `aria-label="必須"`で読み上げ対応

#### エラー表示
- エラーメッセージに`role="alert"`
- `aria-invalid="true"`でエラー状態を通知
- `aria-describedby`でエラーメッセージを関連付け

#### ヘルプテキスト
- `aria-describedby`で入力フィールドと関連付け
- 入力のヒントや形式を説明

### 7. レスポンシブデザイン

#### ブレークポイント
- モバイル: 320px以上
- タブレット: 768px以上
- デスクトップ: 1024px以上

#### タッチターゲット
- 最小サイズ: 44x44px（WCAG 2.1 AAA）
- ボタン間の適切な間隔

#### フォントサイズ
- 基本フォントサイズ: 16px
- 相対単位（rem）の使用
- ズーム対応（200%まで）

### 8. アニメーションと動き

#### 控えめなアニメーション
- トランジション時間: 200-300ms
- イージング: ease-out, ease-in

#### モーションの削減
```css
@media (prefers-reduced-motion: reduce) {
  * {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

## テスト方法

### キーボードナビゲーションテスト
1. マウスを使わずにTabキーで全ての要素にアクセス
2. フォーカスが視覚的に明確か確認
3. モーダルのフォーカストラップが機能するか確認

### スクリーンリーダーテスト
- macOS: VoiceOver（Cmd + F5）
- Windows: NVDA（無料）またはJAWS

### カラーコントラストテスト
- ブラウザの開発者ツール
- WebAIM Contrast Checker

### キーボードショートカット
- すべての機能がキーボードで操作可能か確認
- ショートカットキーの衝突がないか確認

## ベストプラクティス

### 新しいコンポーネントを追加する際
1. セマンティックHTMLを使用
2. 適切なARIA属性を追加
3. キーボード操作をサポート
4. フォーカス管理を実装
5. カラーコントラストを確認
6. スクリーンリーダーでテスト

### 避けるべきこと
- 色だけで情報を伝える
- 小さすぎるクリック領域
- 自動再生される音声や動画
- 時間制限のある操作（必要な場合は延長可能に）
- フォーカスの強制移動

## 参考資料

- [WCAG 2.1 ガイドライン](https://www.w3.org/WAI/WCAG21/quickref/)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [MDN Accessibility](https://developer.mozilla.org/ja/docs/Web/Accessibility)
