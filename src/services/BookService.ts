import { v4 as uuidv4 } from 'uuid';
import { Book, BookStatus, LibraryError, ErrorCode } from '../models';
import { BookRepository } from '../repositories/BookRepository';
import { BarcodeService } from './BarcodeService';

/**
 * 書籍サービス
 * 書籍管理のビジネスロジックを提供
 */
export class BookService {
  constructor(
    private bookRepository: BookRepository,
    private barcodeService: BarcodeService
  ) {}

  /**
   * 書籍を追加
   * @param title タイトル
   * @param author 著者
   * @param isbn ISBN
   * @returns 追加された書籍
   */
  async addBook(title: string, author: string, isbn: string): Promise<Book> {
    // 入力バリデーション
    if (!title || !author || !isbn) {
      throw new LibraryError(
        '書籍のタイトル、著者、ISBNは必須です',
        ErrorCode.INVALID_INPUT
      );
    }

    // ISBN形式の検証
    if (!this.barcodeService.validateISBN(isbn)) {
      throw new LibraryError(
        '無効なISBN形式です',
        ErrorCode.INVALID_INPUT
      );
    }

    // 同じISBNの書籍が既に存在するかチェック
    const existingBook = await this.bookRepository.findByISBN(isbn);
    if (existingBook) {
      throw new LibraryError(
        'このISBNの書籍は既に登録されています',
        ErrorCode.INVALID_INPUT
      );
    }

    // 新しい書籍を作成
    const newBook: Book = {
      id: uuidv4(),
      title: title.trim(),
      author: author.trim(),
      isbn: isbn.replace(/[-\s]/g, ''), // ハイフンとスペースを除去して保存
      registeredAt: new Date(),
      status: BookStatus.AVAILABLE,
    };

    return await this.bookRepository.save(newBook);
  }

  /**
   * 書籍を更新
   * @param id 書籍ID
   * @param updates 更新内容
   * @returns 更新された書籍
   */
  async updateBook(id: string, updates: Partial<Book>): Promise<Book> {
    // 書籍の存在確認
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new LibraryError(
        '指定された書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    // ISBNが更新される場合は検証
    if (updates.isbn && updates.isbn !== book.isbn) {
      if (!this.barcodeService.validateISBN(updates.isbn)) {
        throw new LibraryError(
          '無効なISBN形式です',
          ErrorCode.INVALID_INPUT
        );
      }

      // 同じISBNの書籍が既に存在するかチェック
      const existingBook = await this.bookRepository.findByISBN(updates.isbn);
      if (existingBook && existingBook.id !== id) {
        throw new LibraryError(
          'このISBNの書籍は既に登録されています',
          ErrorCode.INVALID_INPUT
        );
      }

      // ISBNのハイフンとスペースを除去
      updates.isbn = updates.isbn.replace(/[-\s]/g, '');
    }

    // タイトルと著者をトリム
    if (updates.title) {
      updates.title = updates.title.trim();
    }
    if (updates.author) {
      updates.author = updates.author.trim();
    }

    // id、registeredAt、statusは更新させない（statusは別のメソッドで管理）
    const { id: _, registeredAt: __, status: ___, ...safeUpdates } = updates;

    return await this.bookRepository.update(id, safeUpdates);
  }

  /**
   * 書籍を削除
   * @param id 書籍ID
   */
  async deleteBook(id: string): Promise<void> {
    // 書籍の存在確認
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new LibraryError(
        '指定された書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    // 貸出中の書籍は削除できない
    if (book.status === BookStatus.BORROWED) {
      throw new LibraryError(
        '貸出中の書籍は削除できません',
        ErrorCode.CANNOT_DELETE_BORROWED_BOOK
      );
    }

    const deleted = await this.bookRepository.delete(id);
    if (!deleted) {
      throw new LibraryError(
        '書籍の削除に失敗しました',
        ErrorCode.DATA_SAVE_FAILED
      );
    }
  }

  /**
   * すべての書籍を取得
   * @returns すべての書籍
   */
  async getAllBooks(): Promise<Book[]> {
    return await this.bookRepository.findAll();
  }

  /**
   * 書籍を検索（タイトルまたは著者）
   * @param query 検索クエリ
   * @returns 検索結果
   */
  async searchBooks(query: string): Promise<Book[]> {
    if (!query || query.trim() === '') {
      return await this.getAllBooks();
    }

    const trimmedQuery = query.trim();

    // タイトルと著者の両方で検索
    const booksByTitle = await this.bookRepository.findByTitle(trimmedQuery);
    const booksByAuthor = await this.bookRepository.findByAuthor(trimmedQuery);

    // 重複を除去してマージ
    const bookMap = new Map<string, Book>();
    [...booksByTitle, ...booksByAuthor].forEach((book) => {
      bookMap.set(book.id, book);
    });

    return Array.from(bookMap.values());
  }

  /**
   * 利用可能な書籍を取得
   * @returns 利用可能な書籍のリスト
   */
  async getAvailableBooks(): Promise<Book[]> {
    return await this.bookRepository.findAvailable();
  }

  /**
   * IDで書籍を取得
   * @param id 書籍ID
   * @returns 書籍
   */
  async getBookById(id: string): Promise<Book> {
    const book = await this.bookRepository.findById(id);
    if (!book) {
      throw new LibraryError(
        '指定された書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }
    return book;
  }

  /**
   * ISBNで書籍を取得
   * @param isbn ISBN
   * @returns 書籍
   */
  async getBookByISBN(isbn: string): Promise<Book> {
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    const book = await this.bookRepository.findByISBN(cleanISBN);
    if (!book) {
      throw new LibraryError(
        '指定されたISBNの書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }
    return book;
  }
}
