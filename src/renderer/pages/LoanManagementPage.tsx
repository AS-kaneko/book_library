import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../../models/Book';
import { Employee } from '../../models/Employee';
import { LoanRecord } from '../../models/LoanRecord';
import { Button, Input, Table, useToast, RubyText } from '../components';
import { useAppText } from '../utils/textResource';

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

  const { showSuccess, showError } = useToast();
  const { getText } = useAppText();

  // Refs for auto-focus
  const employeeBarcodeRef = useRef<HTMLInputElement>(null);
  const bookISBNRef = useRef<HTMLInputElement>(null);
  const returnISBNRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadActiveLoans();
  }, []);

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

  // 社員バーコードスキャン処理
  const handleEmployeeBarcodeKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && employeeBarcode) {
      e.preventDefault();
      try {
        const employee = await ipcRenderer.invoke('employees:getByBarcode', employeeBarcode);
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
    }
  };

  // 書籍ISBNスキャン処理
  const handleBookISBNKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && bookISBN) {
      e.preventDefault();
      try {
        const book = await ipcRenderer.invoke('books:getByISBN', bookISBN);
        setSelectedBook(book);
      } catch (error: any) {
        showError(error.message || getText('errorNotFound'));
        setSelectedBook(null);
      }
    }
  };

  // 貸出処理
  const handleBorrow = async () => {
    if (!selectedEmployee || !selectedBook) {
      showError(getText('errorValidation'));
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('loans:borrowByBarcodes', bookISBN, employeeBarcode);
      showSuccess(getText('successBorrow'));

      // フォームをリセット
      resetBorrowForm();

      // 貸出一覧を更新
      await loadActiveLoans();

      // 最初のフィールドにフォーカス
      employeeBarcodeRef.current?.focus();
    } catch (error: any) {
      showError(error.message || getText('errorBorrow'));
    } finally {
      setLoading(false);
    }
  };

  // 返却ISBNスキャン処理
  const handleReturnISBNKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && returnISBN) {
      e.preventDefault();
      try {
        const book = await ipcRenderer.invoke('books:getByISBN', returnISBN);
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
    }
  };

  // 返却処理
  const handleReturn = async () => {
    if (!returnBook) {
      showError(getText('errorValidation'));
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('loans:returnByISBN', returnISBN);
      showSuccess(getText('successReturn'));

      // フォームをリセット
      resetReturnForm();

      // 貸出一覧を更新
      await loadActiveLoans();

      // 返却フィールドにフォーカス
      returnISBNRef.current?.focus();
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
            <Input
              ref={employeeBarcodeRef}
              label={getText('labelMemberBarcode')}
              value={employeeBarcode}
              onChange={setEmployeeBarcode}
              onKeyDown={handleEmployeeBarcodeKeyDown}
              placeholder={getText('placeholderMemberBarcode')}
              autoFocus
            />

            {selectedEmployee && (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  {selectedEmployee.name}
                </p>
                <p className="text-xs text-blue-700">
                  <RubyText>{getText('employeeInfo')}</RubyText>: {selectedEmployee.id}
                </p>
                <p className="text-xs text-blue-700">
                  <RubyText>{getText('loanCount')}</RubyText>: {employeeLoanCount} / 3 冊
                </p>
              </div>
            )}

            <Input
              ref={bookISBNRef}
              label={getText('labelBookBarcode')}
              value={bookISBN}
              onChange={setBookISBN}
              onKeyDown={handleBookISBNKeyDown}
              placeholder={getText('placeholderBookBarcode')}
              disabled={!selectedEmployee}
            />

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
              onClick={handleBorrow}
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
            <Input
              ref={returnISBNRef}
              label={getText('labelBookBarcode')}
              value={returnISBN}
              onChange={setReturnISBN}
              onKeyDown={handleReturnISBNKeyDown}
              placeholder={getText('placeholderBookBarcode')}
            />

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
              onClick={handleReturn}
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
    </div>
  );
};

export default LoanManagementPage;
