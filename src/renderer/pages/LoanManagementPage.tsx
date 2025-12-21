import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../../models/Book';
import { Employee } from '../../models/Employee';
import { LoanRecord } from '../../models/LoanRecord';
import { Button, Input, Table, useToast, RubyText, LoanConfirmModal, ReturnConfirmModal, SuccessModal } from '../components';
import { useAppText } from '../utils/textResource';
import { useMode } from '../contexts/ModeContext';

const { ipcRenderer } = window.require('electron');

interface ActiveLoanWithDetails extends LoanRecord {
  bookTitle?: string;
  employeeName?: string;
}

const LoanManagementPage: React.FC = () => {
  const [activeLoans, setActiveLoans] = useState<ActiveLoanWithDetails[]>([]);
  const [loading, setLoading] = useState(false);

  // 貸出フォーム
  const [employeeBarcode, setEmployeeBarcode] = useState('');
  const [bookISBN, setBookISBN] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [selectedBooks, setSelectedBooks] = useState<Book[]>([]);
  const [employeeLoanCount, setEmployeeLoanCount] = useState(0);

  // 返却フォーム
  const [returnISBN, setReturnISBN] = useState('');
  const [returnBooks, setReturnBooks] = useState<Book[]>([]);
  const [returnLoanInfos, setReturnLoanInfos] = useState<Map<string, LoanRecord>>(new Map());

  // モーダル状態
  const [showLoanConfirm, setShowLoanConfirm] = useState(false);
  const [showReturnConfirm, setShowReturnConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successType, setSuccessType] = useState<'loan' | 'return'>('loan');
  const [successBookTitle, setSuccessBookTitle] = useState('');

  const { showError } = useToast();
  const { getText } = useAppText();
  const { isKidsMode } = useMode();

  // Refs for auto-focus
  const employeeBarcodeRef = useRef<HTMLInputElement>(null);
  const bookISBNRef = useRef<HTMLInputElement>(null);
  const returnISBNRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadActiveLoans();
  }, []);

  // 全角数字を半角数字に変換
  const toHalfWidth = (str: string): string => {
    return str.replace(/[０-９]/g, (s) => {
      return String.fromCharCode(s.charCodeAt(0) - 0xFEE0);
    });
  };

  const loadActiveLoans = async () => {
    try {
      setLoading(true);
      const loans = await ipcRenderer.invoke('loans:getActive');
      
      // 書籍と社員の情報を取得
      const loansWithDetails = await Promise.all(
        loans.map(async (loan: LoanRecord) => {
          try {
            const book = await ipcRenderer.invoke('books:getById', loan.bookId);
            const employee = await ipcRenderer.invoke('employees:getById', loan.employeeId);
            return {
              ...loan,
              bookTitle: book?.title || '不明',
              employeeName: employee?.name || '不明',
            };
          } catch {
            return {
              ...loan,
              bookTitle: '不明',
              employeeName: '不明',
            };
          }
        })
      );
      
      setActiveLoans(loansWithDetails);
    } catch (error: any) {
      showError(error.message || getText('errorLoadLoans'));
    } finally {
      setLoading(false);
    }
  };

  // 社員バーコードスキャン・入力処理（Enterキー時に自動検索）
  const handleEmployeeBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && employeeBarcode) {
      e.preventDefault();
      await searchEmployeeByBarcode(employeeBarcode);
    }
  };

  // バーコードで社員を検索
  const searchEmployeeByBarcode = async (barcode: string) => {
    if (!barcode.trim()) {
      setSelectedEmployee(null);
      setEmployeeLoanCount(0);
      return;
    }
    try {
      // 全角数字を半角に変換
      const normalizedBarcode = toHalfWidth(barcode.trim());
      const employee = await ipcRenderer.invoke('employees:getByBarcode', normalizedBarcode);
      setSelectedEmployee(employee);

      // 貸出冊数を取得
      const count = await ipcRenderer.invoke('employees:getActiveLoanCount', employee.id);
      setEmployeeLoanCount(count);

      // 次のフィールドにフォーカス
      bookISBNRef.current?.focus();
    } catch (error: any) {
      showError(error.message || getText('errorNotFound'));
      setSelectedEmployee(null);
      setEmployeeLoanCount(0);
    }
  };

  // 書籍ISBNスキャン・入力処理（Enterキー時に自動検索）
  const handleBookISBNKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && bookISBN) {
      e.preventDefault();
      await searchBookByISBN(bookISBN);
    }
  };

  // ISBNで書籍を検索して追加
  const searchBookByISBN = async (isbn: string) => {
    if (!isbn.trim()) {
      return;
    }
    try {
      // 全角数字を半角に変換
      const normalizedISBN = toHalfWidth(isbn.trim());
      const book = await ipcRenderer.invoke('books:getByISBN', normalizedISBN);

      // 重複チェック
      const isDuplicate = selectedBooks.some(b => b.id === book.id);
      if (isDuplicate) {
        showError('この書籍は既に追加されています');
        setBookISBN('');
        bookISBNRef.current?.focus();
        return;
      }

      // リストに追加
      setSelectedBooks([...selectedBooks, book]);
      setBookISBN('');
      bookISBNRef.current?.focus();
    } catch (error: any) {
      showError(error.message || getText('errorNotFound'));
    }
  };

  // 書籍をリストから削除
  const removeBook = (bookId: string) => {
    setSelectedBooks(selectedBooks.filter(b => b.id !== bookId));
  };

  // 貸出確認ボタンクリック
  const handleBorrowClick = () => {
    if (!selectedEmployee || selectedBooks.length === 0) {
      showError(getText('errorValidation'));
      return;
    }
    setShowLoanConfirm(true);
  };

  // 貸出処理
  const handleBorrowConfirm = async () => {
    setShowLoanConfirm(false);

    try {
      setLoading(true);

      // 複数冊の貸出処理
      const bookISBNs = selectedBooks.map(book => book.isbn);
      await ipcRenderer.invoke('loans:borrowMultipleBooks', employeeBarcode, bookISBNs);

      // 成功モーダルを表示
      setSuccessType('loan');
      setSuccessBookTitle(selectedBooks.length === 1
        ? selectedBooks[0].title
        : `${selectedBooks.length}冊の書籍`);
      setShowSuccess(true);

      // フォームをリセット
      resetBorrowForm();

      // 貸出一覧を更新
      await loadActiveLoans();
    } catch (error: any) {
      showError(error.message || getText('errorBorrow'));
    } finally {
      setLoading(false);
    }
  };

  // 成功モーダル閉じた後の処理
  const handleSuccessClose = () => {
    setShowSuccess(false);
    // 最初のフィールドにフォーカス
    if (successType === 'loan') {
      employeeBarcodeRef.current?.focus();
    } else {
      returnISBNRef.current?.focus();
    }
  };

  // 返却ISBNスキャン・入力処理（Enterキー時に自動検索）
  const handleReturnISBNKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && returnISBN) {
      e.preventDefault();
      await searchReturnBookByISBN(returnISBN);
    }
  };

  // 返却書籍をISBNで検索して追加
  const searchReturnBookByISBN = async (isbn: string) => {
    if (!isbn.trim()) {
      return;
    }
    try {
      // 全角数字を半角に変換
      const normalizedISBN = toHalfWidth(isbn.trim());
      const book = await ipcRenderer.invoke('books:getByISBN', normalizedISBN);

      // 重複チェック
      const isDuplicate = returnBooks.some(b => b.id === book.id);
      if (isDuplicate) {
        showError('この書籍は既に追加されています');
        setReturnISBN('');
        returnISBNRef.current?.focus();
        return;
      }

      // 貸出情報を取得
      const loans = await ipcRenderer.invoke('loans:getHistory', book.id);
      const activeLoan = loans.find((loan: LoanRecord) => loan.status === 'active');

      if (activeLoan) {
        const employee = await ipcRenderer.invoke('employees:getById', activeLoan.employeeId);
        const loanInfo = { ...activeLoan, employeeName: employee?.name };

        // リストに追加
        setReturnBooks([...returnBooks, book]);
        setReturnLoanInfos(new Map(returnLoanInfos.set(book.id, loanInfo)));
        setReturnISBN('');
        returnISBNRef.current?.focus();
      } else {
        showError('この書籍は貸出中ではありません');
      }
    } catch (error: any) {
      showError(error.message || getText('errorNotFound'));
    }
  };

  // 返却書籍をリストから削除
  const removeReturnBook = (bookId: string) => {
    setReturnBooks(returnBooks.filter(b => b.id !== bookId));
    const newMap = new Map(returnLoanInfos);
    newMap.delete(bookId);
    setReturnLoanInfos(newMap);
  };

  // 返却確認ボタンクリック
  const handleReturnClick = () => {
    if (returnBooks.length === 0) {
      showError(getText('errorValidation'));
      return;
    }
    setShowReturnConfirm(true);
  };

  // 返却処理
  const handleReturnConfirm = async () => {
    setShowReturnConfirm(false);

    try {
      setLoading(true);

      // 複数冊の返却処理
      const bookISBNs = returnBooks.map(book => book.isbn);
      await ipcRenderer.invoke('loans:returnMultipleBooks', bookISBNs);

      // 成功モーダルを表示
      setSuccessType('return');
      setSuccessBookTitle(returnBooks.length === 1
        ? returnBooks[0].title
        : `${returnBooks.length}冊の書籍`);
      setShowSuccess(true);

      // フォームをリセット
      resetReturnForm();

      // 貸出一覧を更新
      await loadActiveLoans();
    } catch (error: any) {
      showError(error.message || getText('errorReturn'));
    } finally {
      setLoading(false);
    }
  };

  const resetBorrowForm = () => {
    setEmployeeBarcode('');
    setBookISBN('');
    setSelectedEmployee(null);
    setSelectedBooks([]);
    setEmployeeLoanCount(0);
  };

  const resetReturnForm = () => {
    setReturnISBN('');
    setReturnBooks([]);
    setReturnLoanInfos(new Map());
  };

  const columns = [
    {
      header: getText('colBookTitle'),
      accessor: 'bookTitle' as keyof ActiveLoanWithDetails,
    },
    {
      header: getText('colBorrower'),
      accessor: 'employeeName' as keyof ActiveLoanWithDetails,
    },
    {
      header: getText('colBorrowDate'),
      accessor: ((loan: ActiveLoanWithDetails) => {
        const date = new Date(loan.borrowedAt);
        return date.toLocaleDateString('ja-JP');
      }) as any,
    },
    {
      header: '返却期限',
      accessor: ((loan: ActiveLoanWithDetails) => {
        if (loan.dueDate) {
          const dueDate = new Date(loan.dueDate);
          return dueDate.toLocaleDateString('ja-JP');
        }
        return '-';
      }) as any,
    },
    {
      header: getText('colDaysElapsed'),
      accessor: ((loan: ActiveLoanWithDetails) => {
        const borrowDate = new Date(loan.borrowedAt);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - borrowDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} 日`;
      }) as any,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        <RubyText>{getText('loansTitle')}</RubyText>
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 貸出セクション */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            <RubyText>{getText('sectionLend')}</RubyText>
          </h3>

          <div className="space-y-4">
            <div>
              <Input
                ref={employeeBarcodeRef}
                label={getText('labelMemberBarcode')}
                value={employeeBarcode}
                onChange={setEmployeeBarcode}
                onKeyDown={handleEmployeeBarcodeKeyDown}
                placeholder={getText('placeholderMemberBarcode')}
                autoFocus
              />
              <Button
                onClick={() => searchEmployeeByBarcode(employeeBarcode)}
                disabled={!employeeBarcode}
                variant="secondary"
                className="w-full mt-2"
              >
                検索
              </Button>
            </div>

            {selectedEmployee && (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  {selectedEmployee.name}
                </p>
                <p className="text-xs text-blue-700">
                  <RubyText>{getText('employeeInfo')}</RubyText>: {selectedEmployee.id}
                </p>
                <p className="text-xs text-blue-700">
                  <RubyText>{getText('loanCount')}</RubyText>: {employeeLoanCount} / 10 冊
                </p>
              </div>
            )}

            <div>
              <Input
                ref={bookISBNRef}
                label={getText('labelBookBarcode')}
                value={bookISBN}
                onChange={setBookISBN}
                onKeyDown={handleBookISBNKeyDown}
                placeholder={getText('placeholderBookBarcode')}
              />
              <Button
                onClick={() => searchBookByISBN(bookISBN)}
                disabled={!bookISBN}
                variant="secondary"
                className="w-full mt-2"
              >
                検索
              </Button>
            </div>

            {selectedBooks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  選択した書籍 ({selectedBooks.length}冊)
                </p>
                {selectedBooks.map((book) => (
                  <div key={book.id} className="bg-green-50 p-3 rounded border border-green-200 flex justify-between items-start">
                    <div className="flex-1">
                      <p className="text-sm font-semibold text-green-900">
                        {book.title}
                      </p>
                      <p className="text-xs text-green-700">
                        <RubyText>{getText('labelAuthor')}</RubyText>: {book.author}
                      </p>
                      <p className="text-xs text-green-700">
                        <RubyText>{getText('labelIsbn')}</RubyText>: {book.isbn}
                      </p>
                    </div>
                    <button
                      onClick={() => removeBook(book.id)}
                      className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
                      title="削除"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}

            <Button
              onClick={handleBorrowClick}
              disabled={!selectedEmployee || selectedBooks.length === 0 || loading}
              className="w-full"
            >
              {getText('btnLend')}
              {selectedBooks.length > 0 && ` (${selectedBooks.length}冊)`}
            </Button>

            {(selectedEmployee || selectedBooks.length > 0) ? (
              <Button
                variant="secondary"
                onClick={resetBorrowForm}
                className="w-full"
              >
                {getText('btnClear')}
              </Button>
            ) : null}
          </div>
        </div>

        {/* 返却セクション */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">
            <RubyText>{getText('sectionReturn')}</RubyText>
          </h3>

          <div className="space-y-4">
            <div>
              <Input
                ref={returnISBNRef}
                label={getText('labelBookBarcode')}
                value={returnISBN}
                onChange={setReturnISBN}
                onKeyDown={handleReturnISBNKeyDown}
                placeholder={getText('placeholderBookBarcode')}
              />
              <Button
                onClick={() => searchReturnBookByISBN(returnISBN)}
                disabled={!returnISBN}
                variant="secondary"
                className="w-full mt-2"
              >
                検索
              </Button>
            </div>

            {returnBooks.length > 0 && (
              <div className="space-y-2">
                <p className="text-sm font-semibold text-gray-700">
                  選択した書籍 ({returnBooks.length}冊)
                </p>
                {returnBooks.map((book) => {
                  const loanInfo = returnLoanInfos.get(book.id);
                  return (
                    <div key={book.id} className="bg-yellow-50 p-3 rounded border border-yellow-200">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-yellow-900">
                            {book.title}
                          </p>
                          <p className="text-xs text-yellow-700">
                            <RubyText>{getText('labelAuthor')}</RubyText>: {book.author}
                          </p>
                          <p className="text-xs text-yellow-700">
                            <RubyText>{getText('labelIsbn')}</RubyText>: {book.isbn}
                          </p>
                          {loanInfo && (
                            <div className="mt-2 pt-2 border-t border-yellow-300">
                              <p className="text-xs text-yellow-800">
                                <RubyText>{getText('colBorrower')}</RubyText>: {(loanInfo as any).employeeName}
                              </p>
                              <p className="text-xs text-yellow-800">
                                <RubyText>{getText('colBorrowDate')}</RubyText>: {new Date(loanInfo.borrowedAt).toLocaleDateString('ja-JP')}
                              </p>
                            </div>
                          )}
                        </div>
                        <button
                          onClick={() => removeReturnBook(book.id)}
                          className="ml-2 text-red-600 hover:text-red-800 font-bold text-lg"
                          title="削除"
                        >
                          ×
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <Button
              onClick={handleReturnClick}
              disabled={returnBooks.length === 0 || loading}
              className="w-full"
              variant="success"
            >
              {getText('btnReturn')}
              {returnBooks.length > 0 && ` (${returnBooks.length}冊)`}
            </Button>

            {returnBooks.length > 0 ? (
              <Button
                variant="secondary"
                onClick={resetReturnForm}
                className="w-full"
              >
                {getText('btnClear')}
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 現在貸出中の書籍一覧 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">
          <RubyText>{getText('activeLoansTitle')}</RubyText>
        </h3>
        {loading ? (
          <div className="text-center py-8">{getText('loadingLoans')}</div>
        ) : (
          <Table
            columns={columns}
            data={activeLoans}
            emptyMessage={getText('emptyActiveLoans')}
          />
        )}
      </div>

      {/* 貸出確認モーダル */}
      <LoanConfirmModal
        isOpen={showLoanConfirm}
        onClose={() => setShowLoanConfirm(false)}
        onConfirm={handleBorrowConfirm}
        books={selectedBooks}
        employee={selectedEmployee}
        dueDate={selectedBooks.length > 0 ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined}
        isKidsMode={isKidsMode}
      />

      {/* 返却確認モーダル */}
      <ReturnConfirmModal
        isOpen={showReturnConfirm}
        onClose={() => setShowReturnConfirm(false)}
        onConfirm={handleReturnConfirm}
        books={returnBooks}
        loanInfos={returnLoanInfos}
        isKidsMode={isKidsMode}
      />

      {/* 成功モーダル */}
      <SuccessModal
        isOpen={showSuccess}
        onClose={handleSuccessClose}
        type={successType}
        bookTitle={successBookTitle}
        isKidsMode={isKidsMode}
      />
    </div>
  );
};

export default LoanManagementPage;
