/**
 * 書籍情報インターフェース
 * 外部APIから取得した書籍情報を表す
 */
export interface BookInfo {
  title: string;        // タイトル
  author: string;       // 著者
  isbn: string;         // ISBN番号
  coverImageUrl?: string; // 書影URL
}
