import { BookInfo, LibraryError, ErrorCode } from '../models';

/**
 * 書籍情報取得サービス
 * 国立国会図書館APIから書籍情報と書影を取得する
 */
export class BookInfoService {
  private readonly NDL_API_URL = 'https://iss.ndl.go.jp/api/opensearch';
  private readonly NDL_THUMBNAIL_URL = 'https://ndlsearch.ndl.go.jp/thumbnail';
  private readonly TIMEOUT_MS = 5000;

  /**
   * ISBNから書籍情報を取得
   * @param isbn ISBN番号（10桁または13桁、ハイフンあり/なし両対応）
   * @returns 書籍情報（タイトル、著者、ISBN、書影URL）
   */
  async fetchBookInfo(isbn: string): Promise<BookInfo> {
    try {
      // ISBN正規化（全角→半角変換、ハイフン・スペース除去）
      const halfWidthISBN = isbn.replace(/[０-９]/g, (s) =>
        String.fromCharCode(s.charCodeAt(0) - 0xFEE0)
      );
      const cleanISBN = halfWidthISBN.replace(/[-\s]/g, '');

      console.log(`書籍情報を取得中: ISBN=${cleanISBN}`);

      // 国立国会図書館APIから基本情報を取得
      const response = await this.fetchWithTimeout(
        `${this.NDL_API_URL}?isbn=${cleanISBN}`,
        this.TIMEOUT_MS
      );

      // XMLパース
      const bookInfo = this.parseNDLResponse(response, cleanISBN);

      // 国立国会図書館書影APIから書影URLを取得
      const coverImageUrl = this.fetchCoverImage(cleanISBN);
      if (coverImageUrl) {
        bookInfo.coverImageUrl = coverImageUrl;
      }

      console.log(`書籍情報を取得しました: ${bookInfo.title}`);

      return bookInfo;
    } catch (error) {
      if (error instanceof LibraryError) {
        throw error;
      }

      // その他のエラー
      console.error('書籍情報の取得に失敗しました:', error);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new LibraryError(
          '書籍情報の取得がタイムアウトしました（5秒）',
          ErrorCode.BOOK_INFO_TIMEOUT
        );
      }

      throw new LibraryError(
        '書籍情報の取得に失敗しました',
        ErrorCode.BOOK_INFO_FETCH_FAILED
      );
    }
  }

  /**
   * 国立国会図書館書影APIから書影URLを取得
   * @param isbn ISBN番号（正規化済み、13桁）
   * @returns 書影URL（常にURLを返す。画像が存在しない場合は404となる）
   */
  private fetchCoverImage(isbn: string): string | undefined {
    try {
      // 国立国会図書館書影APIは13桁のISBNが必要
      if (isbn.length !== 13) {
        console.warn('書影取得にはISBN-13が必要です');
        return undefined;
      }

      // 国立国会図書館書影API
      // https://ndlsearch.ndl.go.jp/thumbnail/[ISBN].jpg
      const coverUrl = `${this.NDL_THUMBNAIL_URL}/${isbn}.jpg`;

      console.log(`書影URLを生成しました: ${coverUrl}`);
      return coverUrl;
    } catch (error) {
      console.warn('書影URLの生成に失敗:', error);
      return undefined;
    }
  }

  /**
   * タイムアウト付きでfetchを実行
   * @param url リクエストURL
   * @param timeout タイムアウト時間（ミリ秒）
   * @returns レスポンステキスト
   */
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

      if (error instanceof Error && error.name === 'AbortError') {
        throw error; // タイムアウトエラーをそのまま投げる
      }

      // ネットワークエラー
      throw new LibraryError(
        'ネットワークエラーが発生しました',
        ErrorCode.BOOK_INFO_NETWORK_ERROR
      );
    }
  }

  /**
   * 国立国会図書館APIのレスポンス（XML）をパース
   * @param xmlText XMLテキスト
   * @param isbn ISBN番号
   * @returns 書籍情報
   */
  private parseNDLResponse(xmlText: string, isbn: string): BookInfo {
    try {
      // XMLパーサーを使用（ブラウザ環境とNode.js環境で異なる）
      let xmlDoc: Document;

      if (typeof DOMParser !== 'undefined') {
        // ブラウザ環境
        const parser = new DOMParser();
        xmlDoc = parser.parseFromString(xmlText, 'text/xml');
      } else {
        // Node.js環境 - Electronのメインプロセスでは使えないため、正規表現でパース
        return this.parseXMLWithRegex(xmlText, isbn);
      }

      // <item>タグを検索
      const item = xmlDoc.querySelector('item');
      if (!item) {
        throw new LibraryError(
          'ISBNに該当する書籍が見つかりませんでした',
          ErrorCode.BOOK_INFO_NOT_FOUND
        );
      }

      // データ抽出
      const title = item.querySelector('title')?.textContent || '';
      const author = item.querySelector('author')?.textContent || '';

      // データクレンジング
      const cleanTitle = this.cleanTitle(title);
      const cleanAuthor = this.cleanAuthor(author);

      return {
        title: cleanTitle,
        author: cleanAuthor,
        isbn: isbn,
      };
    } catch (error) {
      if (error instanceof LibraryError) {
        throw error;
      }

      console.error('XMLパースエラー:', error);
      throw new LibraryError(
        'レスポンスの解析に失敗しました',
        ErrorCode.BOOK_INFO_FETCH_FAILED
      );
    }
  }

  /**
   * 正規表現を使用してXMLをパース（Node.js環境用）
   * @param xmlText XMLテキスト
   * @param isbn ISBN番号
   * @returns 書籍情報
   */
  private parseXMLWithRegex(xmlText: string, isbn: string): BookInfo {
    // <item>...</item> の内容を抽出
    const itemMatch = xmlText.match(/<item>([\s\S]*?)<\/item>/);
    if (!itemMatch) {
      throw new LibraryError(
        'ISBNに該当する書籍が見つかりませんでした',
        ErrorCode.BOOK_INFO_NOT_FOUND
      );
    }

    const itemContent = itemMatch[1];

    // <title>...</title> を抽出
    const titleMatch = itemContent.match(/<title>(.*?)<\/title>/);
    const title = titleMatch ? titleMatch[1] : '';

    // <author>...</author> を抽出
    const authorMatch = itemContent.match(/<author>(.*?)<\/author>/);
    const author = authorMatch ? authorMatch[1] : '';

    if (!title) {
      throw new LibraryError(
        '書籍情報が不完全です',
        ErrorCode.BOOK_INFO_FETCH_FAILED
      );
    }

    // データクレンジング
    const cleanTitle = this.cleanTitle(title);
    const cleanAuthor = this.cleanAuthor(author);

    return {
      title: cleanTitle,
      author: cleanAuthor,
      isbn: isbn,
    };
  }

  /**
   * タイトルをクレンジング
   * @param title 元のタイトル
   * @returns クレンジング後のタイトル
   */
  private cleanTitle(title: string): string {
    // 基本的なトリミング
    return title.trim();
  }

  /**
   * 著者名をクレンジング
   * @param author 元の著者名
   * @returns クレンジング後の著者名
   */
  private cleanAuthor(author: string): string {
    // 「著」「訳」などを削除
    // 例: "Dustin Boswell, Trevor Foucher著 ; 角征典訳"
    //  → "Dustin Boswell, Trevor Foucher"
    return author
      .replace(/著.*$/, '')
      .replace(/訳.*$/, '')
      .replace(/;.*$/, '')
      .trim();
  }
}
