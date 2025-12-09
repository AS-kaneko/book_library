import React, { useState, useEffect } from 'react';
import { LoanRecord, LoanStatus } from '../../models/LoanRecord';
import { Book } from '../../models/Book';
import { Employee } from '../../models/Employee';
import { Table, useToast, RubyText } from '../components';
import { useAppText } from '../utils/textResource';

const { ipcRenderer } = window.require('electron');

interface LoanHistoryWithDetails extends LoanRecord {
  bookTitle?: string;
  employeeName?: string;
}

type SortField = 'borrowedAt' | 'returnedAt' | 'bookTitle' | 'employeeName';
type SortOrder = 'asc' | 'desc';

const HistoryPage: React.FC = () => {
  const [history, setHistory] = useState<LoanHistoryWithDetails[]>([]);
  const [filteredHistory, setFilteredHistory] = useState<LoanHistoryWithDetails[]>([]);
  const [books, setBooks] = useState<Book[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);

  // フィルター状態
  const [selectedBookId, setSelectedBookId] = useState<string>('');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // ソート状態
  const [sortField, setSortField] = useState<SortField>('borrowedAt');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const { showError } = useToast();
  const { getText } = useAppText();

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    filterAndSortHistory();
  }, [history, selectedBookId, selectedEmployeeId, statusFilter, startDate, endDate, sortField, sortOrder]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // 貸出履歴を取得
      const allHistory = await ipcRenderer.invoke('loans:getHistory');
      
      // 書籍と社員の情報を取得
      const [allBooks, allEmployees] = await Promise.all([
        ipcRenderer.invoke('books:getAll'),
        ipcRenderer.invoke('employees:getAll'),
      ]);
      
      setBooks(allBooks);
      setEmployees(allEmployees);
      
      // 履歴に書籍と社員の情報を追加
      const historyWithDetails = allHistory.map((loan: LoanRecord) => {
        const book = allBooks.find((b: Book) => b.id === loan.bookId);
        const employee = allEmployees.find((e: Employee) => e.id === loan.employeeId);
        
        return {
          ...loan,
          bookTitle: book?.title || '不明',
          employeeName: employee?.name || '不明',
        };
      });
      
      setHistory(historyWithDetails);
    } catch (error: any) {
      showError(error.message || getText('errorLoadHistory'));
    } finally {
      setLoading(false);
    }
  };

  const filterAndSortHistory = () => {
    let filtered = [...history];

    // 書籍フィルター
    if (selectedBookId) {
      filtered = filtered.filter((loan) => loan.bookId === selectedBookId);
    }

    // 社員フィルター
    if (selectedEmployeeId) {
      filtered = filtered.filter((loan) => loan.employeeId === selectedEmployeeId);
    }

    // 状態フィルター
    if (statusFilter !== 'all') {
      filtered = filtered.filter((loan) => loan.status === statusFilter);
    }

    // 期間フィルター
    if (startDate) {
      const start = new Date(startDate);
      filtered = filtered.filter((loan) => new Date(loan.borrowedAt) >= start);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      filtered = filtered.filter((loan) => new Date(loan.borrowedAt) <= end);
    }

    // ソート
    filtered.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'borrowedAt':
          aValue = new Date(a.borrowedAt).getTime();
          bValue = new Date(b.borrowedAt).getTime();
          break;
        case 'returnedAt':
          aValue = a.returnedAt ? new Date(a.returnedAt).getTime() : 0;
          bValue = b.returnedAt ? new Date(b.returnedAt).getTime() : 0;
          break;
        case 'bookTitle':
          aValue = a.bookTitle || '';
          bValue = b.bookTitle || '';
          break;
        case 'employeeName':
          aValue = a.employeeName || '';
          bValue = b.employeeName || '';
          break;
        default:
          aValue = 0;
          bValue = 0;
      }

      if (aValue < bValue) return sortOrder === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    setFilteredHistory(filtered);
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  const clearFilters = () => {
    setSelectedBookId('');
    setSelectedEmployeeId('');
    setStatusFilter('all');
    setStartDate('');
    setEndDate('');
  };

  const SortIcon: React.FC<{ field: SortField }> = ({ field }) => {
    if (sortField !== field) return <span className="text-gray-400">↕</span>;
    return <span>{sortOrder === 'asc' ? '↑' : '↓'}</span>;
  };

  const columns = [
    {
      header: (
        <button
          onClick={() => handleSort('bookTitle')}
          className="flex items-center space-x-1 hover:text-blue-600"
        >
          <span>{getText('colBookTitle')}</span>
          <SortIcon field="bookTitle" />
        </button>
      ) as any,
      accessor: 'bookTitle' as keyof LoanHistoryWithDetails,
    },
    {
      header: (
        <button
          onClick={() => handleSort('employeeName')}
          className="flex items-center space-x-1 hover:text-blue-600"
        >
          <span>{getText('colBorrower')}</span>
          <SortIcon field="employeeName" />
        </button>
      ) as any,
      accessor: 'employeeName' as keyof LoanHistoryWithDetails,
    },
    {
      header: (
        <button
          onClick={() => handleSort('borrowedAt')}
          className="flex items-center space-x-1 hover:text-blue-600"
        >
          <span>{getText('colBorrowDate')}</span>
          <SortIcon field="borrowedAt" />
        </button>
      ) as any,
      accessor: ((loan: LoanHistoryWithDetails) => {
        const date = new Date(loan.borrowedAt);
        return date.toLocaleDateString('ja-JP');
      }) as any,
    },
    {
      header: (
        <button
          onClick={() => handleSort('returnedAt')}
          className="flex items-center space-x-1 hover:text-blue-600"
        >
          <span>{getText('colBorrowDate')}</span>
          <SortIcon field="returnedAt" />
        </button>
      ) as any,
      accessor: ((loan: LoanHistoryWithDetails) => {
        if (!loan.returnedAt) return '-';
        const date = new Date(loan.returnedAt);
        return date.toLocaleDateString('ja-JP');
      }) as any,
    },
    {
      header: getText('colStatus'),
      accessor: ((loan: LoanHistoryWithDetails) => (
        <span
          className={`px-2 py-1 rounded text-xs font-semibold ${
            loan.status === LoanStatus.ACTIVE
              ? 'bg-yellow-100 text-yellow-800'
              : 'bg-gray-100 text-gray-800'
          }`}
        >
          {loan.status === LoanStatus.ACTIVE ? getText('filterActive') : getText('filterReturned')}
        </span>
      )) as any,
    },
    {
      header: getText('colLoanPeriod'),
      accessor: ((loan: LoanHistoryWithDetails) => {
        const borrowDate = new Date(loan.borrowedAt);
        const returnDate = loan.returnedAt ? new Date(loan.returnedAt) : new Date();
        const diffTime = Math.abs(returnDate.getTime() - borrowDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return `${diffDays} 日`;
      }) as any,
    },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">
        <RubyText>{getText('historyTitle')}</RubyText>
      </h2>

      {/* フィルターセクション */}
      <div className="bg-white p-6 rounded-lg shadow space-y-4">
        <h3 className="text-lg font-semibold text-gray-900">
          <RubyText>{getText('filterTitle')}</RubyText>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* 書籍フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RubyText>{getText('colBookTitle')}</RubyText>
            </label>
            <select
              value={selectedBookId}
              onChange={(e) => setSelectedBookId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{getText('filterAllBooks')}</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title}
                </option>
              ))}
            </select>
          </div>

          {/* 社員フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RubyText>{getText('colBorrower')}</RubyText>
            </label>
            <select
              value={selectedEmployeeId}
              onChange={(e) => setSelectedEmployeeId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">{getText('filterAllEmployees')}</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          {/* 状態フィルター */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RubyText>{getText('colStatus')}</RubyText>
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="all">{getText('filterAllStatus')}</option>
              <option value={LoanStatus.ACTIVE}>{getText('filterActive')}</option>
              <option value={LoanStatus.RETURNED}>{getText('filterReturned')}</option>
            </select>
          </div>

          {/* 開始日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RubyText>{getText('labelStartDate')}</RubyText>
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* 終了日 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              <RubyText>{getText('labelEndDate')}</RubyText>
            </label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          {/* クリアボタン */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500"
            >
              {getText('btnClearFilters')}
            </button>
          </div>
        </div>

        <div className="text-sm text-gray-600">
          {filteredHistory.length} {getText('historyCount')}
        </div>
      </div>

      {/* 履歴テーブル */}
      {loading ? (
        <div className="text-center py-8">{getText('loadingHistory')}</div>
      ) : (
        <Table
          columns={columns}
          data={filteredHistory}
          emptyMessage={getText('emptyHistory')}
        />
      )}
    </div>
  );
};

export default HistoryPage;
