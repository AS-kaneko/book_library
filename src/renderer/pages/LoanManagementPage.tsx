import React, { useState, useEffect, useRef } from 'react';
import { Book } from '../../models/Book';
import { Employee } from '../../models/Employee';
import { LoanRecord } from '../../models/LoanRecord';
import { Button, Input, Table, useToast } from '../components';

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
      showError(error.message || '貸出情報の読み込みに失敗しました');
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
        showError(error.message || '社員が見つかりません');
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
        showError(error.message || '書籍が見つかりません');
        setSelectedBook(null);
      }
    }
  };

  // 貸出処理
  const handleBorrow = async () => {
    if (!selectedEmployee || !selectedBook) {
      showError('社員と書籍を選択してください');
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('loans:borrowByBarcodes', bookISBN, employeeBarcode);
      showSuccess(`「${selectedBook.title}」を貸し出しました`);
      
      // フォームをリセット
      resetBorrowForm();
      
      // 貸出一覧を更新
      await loadActiveLoans();
      
      // 最初のフィールドにフォーカス
      employeeBarcodeRef.current?.focus();
    } catch (error: any) {
      showError(error.message || '貸出処理に失敗しました');
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
          showError('この書籍は貸出中ではありません');
        }
      } catch (error: any) {
        showError(error.message || '書籍が見つかりません');
        setReturnBook(null);
        setReturnLoanInfo(null);
      }
    }
  };

  // 返却処理
  const handleReturn = async () => {
    if (!returnBook) {
      showError('書籍を選択してください');
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('loans:returnByISBN', returnISBN);
      showSuccess(`「${returnBook.title}」を返却しました`);
      
      // フォームをリセット
      resetReturnForm();
      
      // 貸出一覧を更新
      await loadActiveLoans();
      
      // 返却フィールドにフォーカス
      returnISBNRef.current?.focus();
    } catch (error: any) {
      showError(error.message || '返却処理に失敗しました');
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
      header: '書籍タイトル',
      accessor: 'bookTitle' as keyof ActiveLoanWithDetails,
    },
    {
      header: '借りた人',
      accessor: 'employeeName' as keyof ActiveLoanWithDetails,
    },
    {
      header: '貸出日',
      accessor: ((loan: ActiveLoanWithDetails) => {
        const date = new Date(loan.borrowedAt);
        return date.toLocaleDateString('ja-JP');
      }) as any,
    },
    {
      header: '経過日数',
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
      <h2 className="text-2xl font-bold text-gray-900">貸出・返却</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* 貸出セクション */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">貸出</h3>
          
          <div className="space-y-4">
            <Input
              ref={employeeBarcodeRef}
              label="会員バーコード"
              value={employeeBarcode}
              onChange={setEmployeeBarcode}
              onKeyDown={handleEmployeeBarcodeKeyDown}
              placeholder="会員バーコードをスキャン"
              autoFocus
            />

            {selectedEmployee && (
              <div className="bg-blue-50 p-4 rounded border border-blue-200">
                <p className="text-sm font-semibold text-blue-900">
                  {selectedEmployee.name}
                </p>
                <p className="text-xs text-blue-700">
                  社員ID: {selectedEmployee.id}
                </p>
                <p className="text-xs text-blue-700">
                  現在の貸出: {employeeLoanCount} / 3 冊
                </p>
              </div>
            )}

            <Input
              ref={bookISBNRef}
              label="ISBNバーコード"
              value={bookISBN}
              onChange={setBookISBN}
              onKeyDown={handleBookISBNKeyDown}
              placeholder="ISBNバーコードをスキャン"
              disabled={!selectedEmployee}
            />

            {selectedBook && (
              <div className="bg-green-50 p-4 rounded border border-green-200">
                <p className="text-sm font-semibold text-green-900">
                  {selectedBook.title}
                </p>
                <p className="text-xs text-green-700">
                  著者: {selectedBook.author}
                </p>
                <p className="text-xs text-green-700">
                  ISBN: {selectedBook.isbn}
                </p>
              </div>
            )}

            <Button
              onClick={handleBorrow}
              disabled={!selectedEmployee || !selectedBook || loading}
              className="w-full"
            >
              貸出
            </Button>

            {selectedEmployee || selectedBook ? (
              <Button
                variant="secondary"
                onClick={resetBorrowForm}
                className="w-full"
              >
                クリア
              </Button>
            ) : null}
          </div>
        </div>

        {/* 返却セクション */}
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-xl font-semibold text-gray-900 mb-4">返却</h3>
          
          <div className="space-y-4">
            <Input
              ref={returnISBNRef}
              label="ISBNバーコード"
              value={returnISBN}
              onChange={setReturnISBN}
              onKeyDown={handleReturnISBNKeyDown}
              placeholder="ISBNバーコードをスキャン"
            />

            {returnBook && (
              <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
                <p className="text-sm font-semibold text-yellow-900">
                  {returnBook.title}
                </p>
                <p className="text-xs text-yellow-700">
                  著者: {returnBook.author}
                </p>
                <p className="text-xs text-yellow-700">
                  ISBN: {returnBook.isbn}
                </p>
              </div>
            )}

            {returnLoanInfo && (
              <div className="bg-gray-50 p-4 rounded border border-gray-200">
                <p className="text-sm font-semibold text-gray-900">
                  借りた人: {(returnLoanInfo as any).employeeName}
                </p>
                <p className="text-xs text-gray-700">
                  貸出日: {new Date(returnLoanInfo.borrowedAt).toLocaleDateString('ja-JP')}
                </p>
              </div>
            )}

            <Button
              onClick={handleReturn}
              disabled={!returnBook || !returnLoanInfo || loading}
              className="w-full"
              variant="success"
            >
              返却
            </Button>

            {returnBook ? (
              <Button
                variant="secondary"
                onClick={resetReturnForm}
                className="w-full"
              >
                クリア
              </Button>
            ) : null}
          </div>
        </div>
      </div>

      {/* 現在貸出中の書籍一覧 */}
      <div className="bg-white p-6 rounded-lg shadow">
        <h3 className="text-xl font-semibold text-gray-900 mb-4">現在貸出中の書籍</h3>
        {loading ? (
          <div className="text-center py-8">読み込み中...</div>
        ) : (
          <Table
            columns={columns}
            data={activeLoans}
            emptyMessage="現在貸出中の書籍はありません"
          />
        )}
      </div>
    </div>
  );
};

export default LoanManagementPage;
