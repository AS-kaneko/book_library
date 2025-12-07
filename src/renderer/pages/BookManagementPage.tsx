import React, { useState, useEffect, useRef } from 'react';
import { Book, BookStatus } from '../../models/Book';
import { Button, Input, Table, Modal, useToast } from '../components';
import { validateISBN, validateRequired, combineValidations } from '../../utils/validation';

const { ipcRenderer } = window.require('electron');

const BookManagementPage: React.FC = () => {
  const [books, setBooks] = useState<Book[]>([]);
  const [filteredBooks, setFilteredBooks] = useState<Book[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedBook, setSelectedBook] = useState<Book | null>(null);
  const [loading, setLoading] = useState(false);

  const { showSuccess, showError } = useToast();

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    author: '',
    isbn: '',
    coverImageUrl: '',
  });

  useEffect(() => {
    loadBooks();
  }, []);

  useEffect(() => {
    filterBooks();
  }, [books, searchQuery, showAvailableOnly]);

  const loadBooks = async () => {
    try {
      setLoading(true);
      const allBooks = await ipcRenderer.invoke('books:getAll');
      setBooks(allBooks);
    } catch (error: any) {
      showError(error.message || '書籍の読み込みに失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const filterBooks = () => {
    let filtered = [...books];

    // 検索フィルター
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (book) =>
          book.title.toLowerCase().includes(query) ||
          book.author.toLowerCase().includes(query) ||
          book.isbn.includes(query)
      );
    }

    // 利用可能のみフィルター
    if (showAvailableOnly) {
      filtered = filtered.filter((book) => book.status === BookStatus.AVAILABLE);
    }

    setFilteredBooks(filtered);
  };

  const handleAddBook = async () => {
    // バリデーション
    const titleValidation = validateRequired(formData.title, 'タイトル');
    const authorValidation = validateRequired(formData.author, '著者');
    const isbnValidation = validateISBN(formData.isbn);

    const validation = combineValidations(titleValidation, authorValidation, isbnValidation);

    if (!validation.isValid) {
      showError(validation.error || 'すべての項目を正しく入力してください');
      return;
    }

    try {
      setLoading(true);
      const newBook = await ipcRenderer.invoke('books:add', formData.title, formData.author, formData.isbn);

      // 書影URLがある場合は更新
      if (formData.coverImageUrl && newBook?.id) {
        await ipcRenderer.invoke('books:update', newBook.id, {
          coverImageUrl: formData.coverImageUrl,
        });
      }

      showSuccess('書籍を追加しました');
      setIsAddModalOpen(false);
      resetForm();
      await loadBooks();
    } catch (error: any) {
      showError(error.message || '書籍の追加に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = async () => {
    if (!selectedBook) {
      showError('書籍が選択されていません');
      return;
    }

    // バリデーション
    const titleValidation = validateRequired(formData.title, 'タイトル');
    const authorValidation = validateRequired(formData.author, '著者');
    const isbnValidation = validateISBN(formData.isbn);

    const validation = combineValidations(titleValidation, authorValidation, isbnValidation);

    if (!validation.isValid) {
      showError(validation.error || 'すべての項目を正しく入力してください');
      return;
    }

    try {
      setLoading(true);
      await ipcRenderer.invoke('books:update', selectedBook.id, {
        title: formData.title,
        author: formData.author,
        isbn: formData.isbn,
        coverImageUrl: formData.coverImageUrl,
      });
      showSuccess('書籍を更新しました');
      setIsEditModalOpen(false);
      setSelectedBook(null);
      resetForm();
      await loadBooks();
    } catch (error: any) {
      showError(error.message || '書籍の更新に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;

    try {
      setLoading(true);
      await ipcRenderer.invoke('books:delete', selectedBook.id);
      showSuccess('書籍を削除しました');
      setIsDeleteModalOpen(false);
      setSelectedBook(null);
      await loadBooks();
    } catch (error: any) {
      showError(error.message || '書籍の削除に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const openEditModal = (book: Book) => {
    setSelectedBook(book);
    setFormData({
      title: book.title,
      author: book.author,
      isbn: book.isbn,
      coverImageUrl: book.coverImageUrl || '',
    });
    setIsEditModalOpen(true);
  };

  const openDeleteModal = (book: Book) => {
    setSelectedBook(book);
    setIsDeleteModalOpen(true);
  };

  const resetForm = () => {
    setFormData({
      title: '',
      author: '',
      isbn: '',
      coverImageUrl: '',
    });
  };

  const columns = [
    {
      header: '書影',
      accessor: ((book: Book) => (
        <div className="flex items-center justify-center">
          {book.coverImageUrl ? (
            <img
              src={book.coverImageUrl}
              alt={`${book.title}の書影`}
              className="w-12 h-16 object-cover rounded shadow-sm"
              onError={(e) => {
                // 画像読み込みエラー時は非表示
                e.currentTarget.style.display = 'none';
              }}
            />
          ) : (
            <div className="w-12 h-16 bg-gray-200 rounded flex items-center justify-center text-xs text-gray-500">
              画像なし
            </div>
          )}
        </div>
      )) as any,
      width: '10%',
    },
    {
      header: 'タイトル',
      accessor: 'title' as keyof Book,
      width: '25%',
    },
    {
      header: '著者',
      accessor: 'author' as keyof Book,
      width: '20%',
    },
    {
      header: 'ISBN',
      accessor: 'isbn' as keyof Book,
      width: '15%',
    },
    {
      header: '状態',
      accessor: ((book: Book) => (
        <span
          className={`badge ${
            book.status === BookStatus.AVAILABLE
              ? 'badge-success'
              : 'badge-error'
          }`}
        >
          {book.status === BookStatus.AVAILABLE ? '利用可能' : '貸出中'}
        </span>
      )) as any,
      width: '15%',
    },
    {
      header: '操作',
      accessor: ((book: Book) => (
        <div className="flex space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e?.stopPropagation();
              openEditModal(book);
            }}
            ariaLabel={`${book.title}を編集`}
          >
            編集
          </Button>
          <Button
            variant="danger"
            size="sm"
            onClick={(e) => {
              e?.stopPropagation();
              openDeleteModal(book);
            }}
            ariaLabel={`${book.title}を削除`}
          >
            削除
          </Button>
        </div>
      )) as any,
      width: '10%',
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">書籍管理</h2>
          <p className="mt-1 text-sm text-gray-600">
            書籍の登録、編集、削除を行います
          </p>
        </div>
        <Button 
          onClick={() => setIsAddModalOpen(true)}
          ariaLabel="新しい書籍を追加"
        >
          <span className="mr-2" aria-hidden="true">➕</span>
          書籍を追加
        </Button>
      </div>

      {/* 検索とフィルター */}
      <div className="card">
        <div className="card-body space-y-4">
          <Input
            placeholder="タイトル、著者、ISBNで検索..."
            value={searchQuery}
            onChange={setSearchQuery}
            ariaLabel="書籍を検索"
            helperText="タイトル、著者名、またはISBN番号で検索できます"
          />
          <div className="flex items-center">
            <input
              type="checkbox"
              id="availableOnly"
              checked={showAvailableOnly}
              onChange={(e) => setShowAvailableOnly(e.target.checked)}
              className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
            />
            <label 
              htmlFor="availableOnly" 
              className="ml-2 text-sm text-gray-700 cursor-pointer select-none"
            >
              利用可能な書籍のみ表示
            </label>
          </div>
        </div>
      </div>

      {/* 書籍一覧テーブル */}
      {loading ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      ) : (
        <Table 
          columns={columns} 
          data={filteredBooks} 
          emptyMessage="書籍が見つかりません"
          caption="書籍一覧"
          striped
        />
      )}

      {/* 追加モーダル */}
      <Modal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          resetForm();
        }}
        title="書籍を追加"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsAddModalOpen(false);
                resetForm();
              }}
              ariaLabel="キャンセル"
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleAddBook} 
              loading={loading}
              ariaLabel="書籍を追加"
            >
              追加
            </Button>
          </>
        }
      >
        <BookForm formData={formData} setFormData={setFormData} />
      </Modal>

      {/* 編集モーダル */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedBook(null);
          resetForm();
        }}
        title="書籍を編集"
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedBook(null);
                resetForm();
              }}
              ariaLabel="キャンセル"
            >
              キャンセル
            </Button>
            <Button 
              onClick={handleEditBook} 
              loading={loading}
              ariaLabel="書籍を更新"
            >
              更新
            </Button>
          </>
        }
      >
        <BookForm formData={formData} setFormData={setFormData} />
      </Modal>

      {/* 削除確認モーダル */}
      <Modal
        isOpen={isDeleteModalOpen}
        onClose={() => {
          setIsDeleteModalOpen(false);
          setSelectedBook(null);
        }}
        title="書籍を削除"
        size="sm"
        closeOnOverlayClick={false}
        footer={
          <>
            <Button
              variant="secondary"
              onClick={() => {
                setIsDeleteModalOpen(false);
                setSelectedBook(null);
              }}
              ariaLabel="キャンセル"
            >
              キャンセル
            </Button>
            <Button 
              variant="danger" 
              onClick={handleDeleteBook} 
              loading={loading}
              ariaLabel="書籍を削除"
            >
              削除
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="flex-shrink-0">
              <svg 
                className="w-6 h-6 text-error-600" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={2} 
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" 
                />
              </svg>
            </div>
            <div className="flex-1">
              <p className="text-base text-gray-900 font-medium mb-2">
                本当に削除しますか？
              </p>
              <p className="text-sm text-gray-700">
                「{selectedBook?.title}」を削除します。
                この操作は取り消せません。
              </p>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// 書籍フォームコンポーネント
interface BookFormProps {
  formData: {
    title: string;
    author: string;
    isbn: string;
    coverImageUrl: string;
  };
  setFormData: React.Dispatch<
    React.SetStateAction<{
      title: string;
      author: string;
      isbn: string;
      coverImageUrl: string;
    }>
  >;
}

const BookForm: React.FC<BookFormProps> = ({ formData, setFormData }) => {
  const isbnInputRef = useRef<HTMLInputElement>(null);
  const [fetchingInfo, setFetchingInfo] = useState(false);
  const { showSuccess, showError } = useToast();

  const handleFetchBookInfo = async () => {
    const cleanISBN = formData.isbn.replace(/[-\s]/g, '');

    // ISBN形式チェック
    if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
      showError('ISBNは10桁または13桁である必要があります');
      return;
    }

    try {
      setFetchingInfo(true);
      const bookInfo = await ipcRenderer.invoke('books:fetchInfo', formData.isbn);

      // 取得した情報をフォームに反映
      setFormData({
        ...formData,
        title: bookInfo.title,
        author: bookInfo.author,
        coverImageUrl: bookInfo.coverImageUrl || '',
      });

      showSuccess('書籍情報を取得しました');
    } catch (error: any) {
      console.error('書籍情報の取得に失敗:', error);

      // エラーメッセージを表示（手動入力を促す）
      if (error.message.includes('見つかりませんでした')) {
        showError('ISBNに該当する書籍が見つかりませんでした。手動で入力してください');
      } else if (error.message.includes('タイムアウト')) {
        showError('書籍情報の取得がタイムアウトしました。手動で入力してください');
      } else if (error.message.includes('ネットワーク')) {
        showError('ネットワークエラーが発生しました。手動で入力してください');
      } else {
        showError('書籍情報の取得に失敗しました。手動で入力してください');
      }
    } finally {
      setFetchingInfo(false);
    }
  };

  const handleISBNKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    // バーコードスキャナーはEnterキーを送信するため、自動的に書籍情報を取得
    if (e.key === 'Enter') {
      e.preventDefault();
      handleFetchBookInfo();
    }
  };

  return (
    <div className="space-y-4">
      <Input
        ref={isbnInputRef}
        label="ISBN"
        value={formData.isbn}
        onChange={(value) => setFormData({ ...formData, isbn: value })}
        onKeyDown={handleISBNKeyDown}
        placeholder="ISBNバーコードをスキャン、またはEnterキーで自動取得"
        required
        id="isbn"
        helperText="ISBNを入力してEnterキーを押すと、自動的に書籍情報を取得します"
      />
      <div className="flex items-center space-x-2">
        <Button
          variant="secondary"
          size="sm"
          onClick={handleFetchBookInfo}
          loading={fetchingInfo}
          disabled={!formData.isbn || fetchingInfo}
          ariaLabel="書籍情報を自動取得"
        >
          <span className="mr-1" aria-hidden="true">🔍</span>
          書籍情報を自動取得
        </Button>
        {fetchingInfo && (
          <span className="text-sm text-gray-600">取得中...</span>
        )}
      </div>

      {/* 書影プレビュー */}
      {formData.coverImageUrl && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">書影プレビュー</p>
          <div className="flex items-start space-x-4">
            <img
              src={formData.coverImageUrl}
              alt="書影プレビュー"
              className="w-24 h-32 object-cover rounded shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex-1">
              <Input
                label="書影URL"
                value={formData.coverImageUrl}
                onChange={(value) => setFormData({ ...formData, coverImageUrl: value })}
                id="coverImageUrl"
                helperText="必要に応じて書影URLを編集できます"
              />
            </div>
          </div>
        </div>
      )}

      <Input
        label="タイトル"
        value={formData.title}
        onChange={(value) => setFormData({ ...formData, title: value })}
        required
        id="title"
        disabled={fetchingInfo}
      />
      <Input
        label="著者"
        value={formData.author}
        onChange={(value) => setFormData({ ...formData, author: value })}
        required
        id="author"
        disabled={fetchingInfo}
      />
    </div>
  );
};

export default BookManagementPage;
