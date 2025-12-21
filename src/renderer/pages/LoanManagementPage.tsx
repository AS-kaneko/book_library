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
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [employeeLoanCount, setEmployeeLoanCount] = useState(0);

  // 返却フォーム
  const [returnISBN, setReturnISBN] = useState('');
  const [returnBook, setReturnBook] = useState<Book | null>(null);
  const [returnLoanInfo, setReturnLoanInfo] = useState<LoanRecord | null>(null);

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

  // ISBNで書籍を検索
  const searchBookByISBN = async (isbn: string) => {
    if (!isbn.trim()) {
      setSelectedBook(null);
      return;
    }
    try {
      // 全角数字を半角に変換
      const normalizedISBN = toHalfWidth(isbn.trim());
      const book = await ipcRenderer.invoke('books:getByISBN', normalizedISBN);
      setSelectedBook(book);
    } catch (error: any) {
      showError(error.message || getText('errorNotFound'));
      setSelectedBook(null);
    }
  };

  // 貸出確認ボタンクリック
  const handleBorrowClick = () => {
    if (!selectedEmployee || !selectedBook) {
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
      await ipcRenderer.invoke('loans:borrowByBarcodes', bookISBN, employeeBarcode);

      // 成功モーダルを表示
      setSuccessType('loan');
      setSuccessBookTitle(selectedBook?.title || '');
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

  // 返却書籍をISBNで検索
  const searchReturnBookByISBN = async (isbn: string) => {
    if (!isbn.trim()) {
      setReturnBook(null);
      setReturnLoanInfo(null);
      return;
    }
    try {
      // 全角数字を半角に変換
      const normalizedISBN = toHalfWidth(isbn.trim());
      const book = await ipcRenderer.invoke('books:getByISBN', normalizedISBN);
      setReturnBook(book);

      // 貸出情報を取得
      const loans = await ipcRenderer.invoke('loans:getHistory', book.id);
      const activeLoan = loans.find((loan: LoanRecord) => loan.status === 'active');

      if (activeLoan) {
        const employee = await ipcRenderer.invoke('employees:getById', activeLoan.employeeId);
        setReturnLoanInfo({ ...activeLoan, employeeName: employee?.name });
      } else {
        setReturnLoanInfo(null);
        showError(getText('errorNotFound'));
      }
    } catch (error: any) {
      showError(error.message || getText('errorNotFound'));
      setReturnBook(null);
      setReturnLoanInfo(null);
    }
  };

  // 返却確認ボタンクリック
  const handleReturnClick = () => {
    if (!returnBook || !returnLoanInfo) {
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
      await ipcRenderer.invoke('loans:returnByISBN', returnISBN);

      // 成功モーダルを表示
      setSuccessType('return');
      setSuccessBookTitle(returnBook?.title || '');
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
    setSelectedBook(null);
    setEmployeeLoanCount(0);
  };

  const resetReturnForm = () => {
    setReturnISBN('');
    setReturnBook(null);
    setReturnLoanInfo(null);
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

            {selectedBook && (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-sm font-semibold text-green-900">
                  {selectedBook.title}
                </p>
                <p className="text-xs text-green-700">
                  <RubyText>{getText('labelAuthor')}</RubyText>: {selectedBook.author}
                </p>
                <p className="text-xs text-green-700">
                  <RubyText>{getText('labelIsbn')}</RubyText>: {selectedBook.isbn}
                </p>
              </div>
            )}

            <Button
              onClick={handleBorrowClick}
              disabled={!selectedEmployee || !selectedBook || loading}
              className="w-full"
            >
              {getText('btnLend')}
            </Button>

            {selectedEmployee || selectedBook ? (
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

            {returnBook && (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900">
                  {returnBook.title}
                </p>
                <p className="text-xs text-yellow-700">
                  <RubyText>{getText('labelAuthor')}</RubyText>: {returnBook.author}
                </p>
                <p className="text-xs text-yellow-700">
                  <RubyText>{getText('labelIsbn')}</RubyText>: {returnBook.isbn}
                </p>
              </div>
            )}

            {returnLoanInfo && (
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  <RubyText>{getText('colBorrower')}</RubyText>: {(returnLoanInfo as any).employeeName}
                </p>
                <p className="text-xs text-gray-700">
                  <RubyText>{getText('colBorrowDate')}</RubyText>: {new Date(returnLoanInfo.borrowedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}

            <Button
              onClick={handleReturnClick}
              disabled={!returnBook || !returnLoanInfo || loading}
              className="w-full"
              variant="success"
            >
              {getText('btnReturn')}
            </Button>

            {returnBook ? (
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
        book={selectedBook}
        employee={selectedEmployee}
        dueDate={selectedBook ? new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) : undefined}
        isKidsMode={isKidsMode}
      />

      {/* 返却確認モーダル */}
      <ReturnConfirmModal
        isOpen={showReturnConfirm}
        onClose={() => setShowReturnConfirm(false)}
        onConfirm={handleReturnConfirm}
        book={returnBook}
        borrowerName={(returnLoanInfo as any)?.employeeName}
        borrowedDate={returnLoanInfo?.borrowedAt}
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
