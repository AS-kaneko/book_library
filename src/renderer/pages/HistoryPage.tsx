import React, { useState, useEffect } from 'react';
import { LoanRecord, LoanStatus } from '../../models/LoanRecord';
import { Book } from '../../models/Book';
import { Employee } from '../../models/Employee';
import { Table, useToast, RubyText, Button, Modal } from '../components';
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

  // モーダル状態
  const [selectedLoan, setSelectedLoan] = useState<LoanHistoryWithDetails | null>(null);
  const [showExtendModal, setShowExtendModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [showCreateLoanModal, setShowCreateLoanModal] = useState(false);
  const [extendDays, setExtendDays] = useState<number>(7);
  const [newDueDate, setNewDueDate] = useState<string>('');

  // 新規貸出用
  const [selectedBookForLoan, setSelectedBookForLoan] = useState<string>('');
  const [selectedEmployeeForLoan, setSelectedEmployeeForLoan] = useState<string>('');
  const [loanDays, setLoanDays] = useState<number>(14);

  const { showError, showSuccess } = useToast();
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

  // 期間変更処理
  const handleExtend = (loan: LoanHistoryWithDetails) => {
    setSelectedLoan(loan);
    setExtendDays(7);
    // 現在の返却期限を設定
    if (loan.dueDate) {
      const dueDate = new Date(loan.dueDate);
      setNewDueDate(dueDate.toISOString().split('T')[0]);
    }
    setShowExtendModal(true);
  };

  const handleExtendConfirm = async () => {
    if (!selectedLoan) return;

    try {
      setLoading(true);

      // 日数指定の場合
      if (extendDays !== 0) {
        await ipcRenderer.invoke('loans:extend', selectedLoan.id, extendDays);
        showSuccess(`返却期限を${extendDays > 0 ? extendDays + '日延長' : Math.abs(extendDays) + '日短縮'}しました`);
      }
      // 日付指定の場合
      else if (newDueDate) {
        await ipcRenderer.invoke('loans:setDueDate', selectedLoan.id, newDueDate);
        showSuccess('返却期限を変更しました');
      }

      setShowExtendModal(false);
      await loadData();
    } catch (error: any) {
      showError(error.message || '期間変更に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 強制返却処理
  const handleForceReturn = (loan: LoanHistoryWithDetails) => {
    setSelectedLoan(loan);
    setShowReturnModal(true);
  };

  const handleForceReturnConfirm = async () => {
    if (!selectedLoan) return;

    try {
      setLoading(true);
      await ipcRenderer.invoke('loans:return', selectedLoan.bookId);
      showSuccess('強制返却しました');
      setShowReturnModal(false);
      await loadData();
    } catch (error: any) {
      showError(error.message || '返却処理に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  // 新規貸出作成処理
  const handleCreateLoan = () => {
    setSelectedBookForLoan('');
    setSelectedEmployeeForLoan('');
    setLoanDays(14);
    setShowCreateLoanModal(true);
  };

  const handleCreateLoanConfirm = async () => {
    if (!selectedBookForLoan || !selectedEmployeeForLoan) {
      showError('書籍と社員を選択してください');
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('loans:createManual', selectedBookForLoan, selectedEmployeeForLoan, loanDays);
      showSuccess('貸出を作成しました');
      setShowCreateLoanModal(false);
      await loadData();
    } catch (error: any) {
      showError(error.message || '貸出作成に失敗しました');
    } finally {
      setLoading(false);
    }
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
      header: '返却期限',
      accessor: ((loan: LoanHistoryWithDetails) => {
        if (!loan.dueDate) return '-';
        const dueDate = new Date(loan.dueDate);
        const today = new Date();
        const isOverdue = loan.status === LoanStatus.ACTIVE && dueDate < today;
        return (
          <span className={isOverdue ? 'text-red-600 font-semibold' : ''}>
            {dueDate.toLocaleDateString('ja-JP')}
            {isOverdue && ' (延滞)'}
          </span>
        );
      }) as any,
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
    {
      header: '操作',
      accessor: ((loan: LoanHistoryWithDetails) => {
        if (loan.status === LoanStatus.RETURNED) {
          return <span className="text-gray-400">-</span>;
        }
        return (
          <div className="flex gap-2">
            <button
              onClick={() => handleExtend(loan)}
              className="px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
            >
              期間延長
            </button>
            <button
              onClick={() => handleForceReturn(loan)}
              className="px-3 py-1 bg-green-500 text-white text-xs rounded hover:bg-green-600"
            >
              強制返却
            </button>
          </div>
        );
      }) as any,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900">
          <RubyText>{getText('historyTitle')}</RubyText>
        </h2>
        <Button onClick={handleCreateLoan}>
          新規貸出作成
        </Button>
      </div>

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

      {/* 期間変更モーダル */}
      <Modal
        isOpen={showExtendModal}
        onClose={() => setShowExtendModal(false)}
        title="返却期限変更"
      >
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded">
            <p className="font-semibold text-gray-900">{selectedLoan?.bookTitle}</p>
            <p className="text-sm text-gray-600">借りた人: {selectedLoan?.employeeName}</p>
            <p className="text-sm text-gray-600">
              現在の期限: {selectedLoan?.dueDate ? new Date(selectedLoan.dueDate).toLocaleDateString('ja-JP') : '-'}
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              日数で変更（延長・短縮）
            </label>
            <div className="flex gap-2 mb-2">
              {[-7, -3, 7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setExtendDays(days)}
                  className={`px-3 py-2 rounded text-sm ${
                    extendDays === days
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {days > 0 ? '+' : ''}{days}日
                </button>
              ))}
            </div>
            <input
              type="number"
              value={extendDays}
              onChange={(e) => setExtendDays(Number(e.target.value))}
              min="-365"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              placeholder="正の値で延長、負の値で短縮"
            />
          </div>

          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              または直接日付で指定
            </label>
            <input
              type="date"
              value={newDueDate}
              onChange={(e) => {
                setNewDueDate(e.target.value);
                setExtendDays(0);
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="bg-blue-50 p-3 rounded">
            <p className="text-sm text-blue-800">
              新しい期限: {
                extendDays !== 0 && selectedLoan?.dueDate
                  ? new Date(new Date(selectedLoan.dueDate).getTime() + extendDays * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')
                  : newDueDate
                    ? new Date(newDueDate).toLocaleDateString('ja-JP')
                    : '-'
              }
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowExtendModal(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleExtendConfirm}
              className="flex-1"
            >
              変更する
            </Button>
          </div>
        </div>
      </Modal>

      {/* 強制返却モーダル */}
      <Modal
        isOpen={showReturnModal}
        onClose={() => setShowReturnModal(false)}
        title="強制返却"
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 p-4 rounded border border-yellow-200">
            <p className="font-semibold text-yellow-900">{selectedLoan?.bookTitle}</p>
            <p className="text-sm text-yellow-700">借りた人: {selectedLoan?.employeeName}</p>
            <p className="text-sm text-yellow-700">
              貸出日: {selectedLoan?.borrowedAt ? new Date(selectedLoan.borrowedAt).toLocaleDateString('ja-JP') : '-'}
            </p>
          </div>

          <p className="text-gray-700">
            この書籍を強制的に返却処理しますか？
          </p>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowReturnModal(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              variant="success"
              onClick={handleForceReturnConfirm}
              className="flex-1"
            >
              返却する
            </Button>
          </div>
        </div>
      </Modal>

      {/* 新規貸出作成モーダル */}
      <Modal
        isOpen={showCreateLoanModal}
        onClose={() => setShowCreateLoanModal(false)}
        title="新規貸出作成"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              書籍を選択
            </label>
            <select
              value={selectedBookForLoan}
              onChange={(e) => setSelectedBookForLoan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- 書籍を選択 --</option>
              {books.map((book) => (
                <option key={book.id} value={book.id}>
                  {book.title} ({book.status === 'available' ? '利用可能' : '貸出中'})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              借りる人を選択
            </label>
            <select
              value={selectedEmployeeForLoan}
              onChange={(e) => setSelectedEmployeeForLoan(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- 社員を選択 --</option>
              {employees.map((employee) => (
                <option key={employee.id} value={employee.id}>
                  {employee.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              貸出期間（日数）
            </label>
            <div className="flex gap-2 mb-2">
              {[7, 14, 30].map((days) => (
                <button
                  key={days}
                  onClick={() => setLoanDays(days)}
                  className={`px-4 py-2 rounded ${
                    loanDays === days
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                  }`}
                >
                  {days}日
                </button>
              ))}
            </div>
            <input
              type="number"
              value={loanDays}
              onChange={(e) => setLoanDays(Number(e.target.value))}
              min="1"
              max="365"
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
            />
          </div>

          <div className="bg-green-50 p-3 rounded">
            <p className="text-sm text-green-800">
              返却期限: {new Date(Date.now() + loanDays * 24 * 60 * 60 * 1000).toLocaleDateString('ja-JP')}
            </p>
          </div>

          <div className="flex gap-3">
            <Button
              variant="secondary"
              onClick={() => setShowCreateLoanModal(false)}
              className="flex-1"
            >
              キャンセル
            </Button>
            <Button
              onClick={handleCreateLoanConfirm}
              className="flex-1"
            >
              作成する
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default HistoryPage;
