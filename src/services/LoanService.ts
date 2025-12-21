import { v4 as uuidv4 } from 'uuid';
import { LoanRecord, LoanStatus, BookStatus, LibraryError, ErrorCode } from '../models';
import { LoanRepository } from '../repositories/LoanRepository';
import { BookRepository } from '../repositories/BookRepository';
import { EmployeeRepository } from '../repositories/EmployeeRepository';

/**
 * 貸出サービス
 * 書籍の貸出・返却のビジネスロジックを提供
 */
export class LoanService {
  private readonly MAX_LOANS_PER_EMPLOYEE = 10; // 1人あたりの貸出上限冊数
  private readonly LOAN_PERIOD_DAYS = 14; // 貸出期間（日数）

  constructor(
    private loanRepository: LoanRepository,
    private bookRepository: BookRepository,
    private employeeRepository: EmployeeRepository
  ) {}

  /**
   * 書籍を貸し出す
   * @param bookId 書籍ID
   * @param employeeId 社員ID
   * @returns 作成された貸出記録
   */
  async borrowBook(bookId: string, employeeId: string): Promise<LoanRecord> {
    // 書籍の存在確認
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new LibraryError(
        '指定された書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    // 社員の存在確認
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new LibraryError(
        '指定された社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }

    // 書籍が貸出可能かチェック
    if (book.status === BookStatus.BORROWED) {
      // 同じ社員が借りようとしている場合は専用メッセージ
      if (book.currentBorrowerId === employeeId) {
        throw new LibraryError(
          'この書籍は既にあなたが借りています',
          ErrorCode.BOOK_ALREADY_BORROWED
        );
      }
      throw new LibraryError(
        'この書籍は既に貸出中です',
        ErrorCode.BOOK_ALREADY_BORROWED
      );
    }

    // 社員の貸出上限チェック
    const activeLoans = await this.loanRepository.findActiveByEmployeeId(employeeId);
    if (activeLoans.length >= this.MAX_LOANS_PER_EMPLOYEE) {
      throw new LibraryError(
        `貸出上限（${this.MAX_LOANS_PER_EMPLOYEE}冊）に達しています`,
        ErrorCode.LOAN_LIMIT_EXCEEDED
      );
    }

    // 返却期限を計算（貸出日から14日後）
    const borrowedAt = new Date();
    const dueDate = new Date(borrowedAt);
    dueDate.setDate(dueDate.getDate() + this.LOAN_PERIOD_DAYS);

    // 貸出記録を作成
    const loanRecord: LoanRecord = {
      id: uuidv4(),
      bookId,
      employeeId,
      borrowedAt,
      dueDate,
      status: LoanStatus.ACTIVE,
    };

    // 貸出記録を保存
    const savedLoan = await this.loanRepository.save(loanRecord);

    // 書籍の状態を更新
    await this.bookRepository.update(bookId, {
      status: BookStatus.BORROWED,
      currentBorrowerId: employeeId,
    });

    return savedLoan;
  }

  /**
   * 書籍を返却する
   * @param bookId 書籍ID
   * @returns 更新された貸出記録
   */
  async returnBook(bookId: string): Promise<LoanRecord> {
    // 書籍の存在確認
    const book = await this.bookRepository.findById(bookId);
    if (!book) {
      throw new LibraryError(
        '指定された書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    // アクティブな貸出記録を取得
    const activeLoan = await this.loanRepository.findActiveByBookId(bookId);
    if (!activeLoan) {
      throw new LibraryError(
        'この書籍は貸出中ではありません',
        ErrorCode.BOOK_NOT_BORROWED
      );
    }

    // 貸出記録を更新
    const updatedLoan = await this.loanRepository.update(activeLoan.id, {
      returnedAt: new Date(),
      status: LoanStatus.RETURNED,
    });

    // 書籍の状態を更新
    await this.bookRepository.update(bookId, {
      status: BookStatus.AVAILABLE,
      currentBorrowerId: undefined,
    });

    return updatedLoan;
  }

  /**
   * 貸出履歴を取得
   * @param bookId 書籍ID（オプション）
   * @param employeeId 社員ID（オプション）
   * @returns 貸出履歴
   */
  async getLoanHistory(bookId?: string, employeeId?: string): Promise<LoanRecord[]> {
    if (bookId && employeeId) {
      // 書籍と社員の両方で絞り込み
      const bookLoans = await this.loanRepository.findByBookId(bookId);
      return bookLoans.filter((loan) => loan.employeeId === employeeId);
    } else if (bookId) {
      // 書籍で絞り込み
      return await this.loanRepository.findByBookId(bookId);
    } else if (employeeId) {
      // 社員で絞り込み
      return await this.loanRepository.findByEmployeeId(employeeId);
    } else {
      // すべての貸出履歴
      return await this.loanRepository.findAll();
    }
  }

  /**
   * 現在貸出中の書籍一覧を取得
   * @returns アクティブな貸出記録
   */
  async getActiveLoans(): Promise<LoanRecord[]> {
    return await this.loanRepository.findActiveLoans();
  }

  /**
   * 社員の現在貸出中の書籍を取得
   * @param employeeId 社員ID
   * @returns 社員のアクティブな貸出記録
   */
  async getEmployeeActiveLoans(employeeId: string): Promise<LoanRecord[]> {
    // 社員の存在確認
    const employee = await this.employeeRepository.findById(employeeId);
    if (!employee) {
      throw new LibraryError(
        '指定された社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }

    return await this.loanRepository.findActiveByEmployeeId(employeeId);
  }

  /**
   * ISBNで書籍を貸し出す
   * @param isbn ISBN
   * @param employeeId 社員ID
   * @returns 作成された貸出記録
   */
  async borrowBookByISBN(isbn: string, employeeId: string): Promise<LoanRecord> {
    // ISBNで書籍を検索
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    const book = await this.bookRepository.findByISBN(cleanISBN);
    if (!book) {
      throw new LibraryError(
        '指定されたISBNの書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    return await this.borrowBook(book.id, employeeId);
  }

  /**
   * ISBNで書籍を返却する
   * @param isbn ISBN
   * @returns 更新された貸出記録
   */
  async returnBookByISBN(isbn: string): Promise<LoanRecord> {
    // ISBNで書籍を検索
    const cleanISBN = isbn.replace(/[-\s]/g, '');
    const book = await this.bookRepository.findByISBN(cleanISBN);
    if (!book) {
      throw new LibraryError(
        '指定されたISBNの書籍が見つかりません',
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    return await this.returnBook(book.id);
  }

  /**
   * バーコードで社員を特定して書籍を貸し出す
   * @param isbn ISBN
   * @param barcode 社員バーコード
   * @returns 作成された貸出記録
   */
  async borrowBookByBarcodes(isbn: string, barcode: string): Promise<LoanRecord> {
    // バーコードで社員を検索
    const employee = await this.employeeRepository.findByBarcode(barcode);
    if (!employee) {
      throw new LibraryError(
        '指定されたバーコードの社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }

    return await this.borrowBookByISBN(isbn, employee.id);
  }

  /**
   * 複数の書籍を一括で貸し出す
   * @param barcode 社員バーコード
   * @param isbns ISBN配列
   * @returns 作成された貸出記録の配列
   */
  async borrowMultipleBooks(barcode: string, isbns: string[]): Promise<LoanRecord[]> {
    // バーコードで社員を検索
    const employee = await this.employeeRepository.findByBarcode(barcode);
    if (!employee) {
      throw new LibraryError(
        '指定されたバーコードの社員が見つかりません',
        ErrorCode.EMPLOYEE_NOT_FOUND
      );
    }

    // 現在の貸出冊数を確認
    const activeLoans = await this.loanRepository.findActiveByEmployeeId(employee.id);
    const totalBooks = activeLoans.length + isbns.length;

    if (totalBooks > this.MAX_LOANS_PER_EMPLOYEE) {
      throw new LibraryError(
        `貸出上限（${this.MAX_LOANS_PER_EMPLOYEE}冊）を超えます（現在${activeLoans.length}冊、追加${isbns.length}冊）`,
        ErrorCode.LOAN_LIMIT_EXCEEDED
      );
    }

    // 各書籍を貸し出し
    const loanRecords: LoanRecord[] = [];
    const errors: { isbn: string; error: string }[] = [];

    for (const isbn of isbns) {
      try {
        const loanRecord = await this.borrowBookByISBN(isbn, employee.id);
        loanRecords.push(loanRecord);
      } catch (error: any) {
        errors.push({
          isbn,
          error: error.message || '貸出に失敗しました'
        });
      }
    }

    // エラーがあった場合は詳細を含めて例外を投げる
    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.isbn}: ${e.error}`).join('\n');
      throw new LibraryError(
        `一部の書籍の貸出に失敗しました:\n${errorMessages}`,
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    return loanRecords;
  }

  /**
   * 複数の書籍を一括で返却する
   * @param isbns ISBN配列
   * @returns 更新された貸出記録の配列
   */
  async returnMultipleBooks(isbns: string[]): Promise<LoanRecord[]> {
    const loanRecords: LoanRecord[] = [];
    const errors: { isbn: string; error: string }[] = [];

    for (const isbn of isbns) {
      try {
        const loanRecord = await this.returnBookByISBN(isbn);
        loanRecords.push(loanRecord);
      } catch (error: any) {
        errors.push({
          isbn,
          error: error.message || '返却に失敗しました'
        });
      }
    }

    // エラーがあった場合は詳細を含めて例外を投げる
    if (errors.length > 0) {
      const errorMessages = errors.map(e => `${e.isbn}: ${e.error}`).join('\n');
      throw new LibraryError(
        `一部の書籍の返却に失敗しました:\n${errorMessages}`,
        ErrorCode.BOOK_NOT_FOUND
      );
    }

    return loanRecords;
  }
}
