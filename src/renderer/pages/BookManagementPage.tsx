import React, { useState, useEffect, useRef } from 'react';
import { Book, BookStatus } from '../../models/Book';
import { Button, Input, Table, Modal, useToast, RubyText } from '../components';
import { validateISBN, validateRequired, combineValidations } from '../../utils/validation';
import { useAppText } from '../utils/textResource';

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
  const { getText } = useAppText();

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
      showError(error.message || getText('errorLoadBooks'));
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
      showError(validation.error || getText('errorValidation'));
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

      showSuccess(getText('successAddBook'));
      setIsAddModalOpen(false);
      resetForm();
      await loadBooks();
    } catch (error: any) {
      showError(error.message || getText('errorAddBook'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditBook = async () => {
    if (!selectedBook) {
      showError(getText('errorNotFound'));
      return;
    }

    // バリデーション
    const titleValidation = validateRequired(formData.title, 'タイトル');
    const authorValidation = validateRequired(formData.author, '著者');
    const isbnValidation = validateISBN(formData.isbn);

    const validation = combineValidations(titleValidation, authorValidation, isbnValidation);

    if (!validation.isValid) {
      showError(validation.error || getText('errorValidation'));
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
      showSuccess(getText('successUpdateBook'));
      setIsEditModalOpen(false);
      setSelectedBook(null);
      resetForm();
      await loadBooks();
    } catch (error: any) {
      showError(error.message || getText('errorUpdateBook'));
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBook = async () => {
    if (!selectedBook) return;

    try {
      setLoading(true);
      await ipcRenderer.invoke('books:delete', selectedBook.id);
      showSuccess(getText('successDeleteBook'));
      setIsDeleteModalOpen(false);
      setSelectedBook(null);
      await loadBooks();
    } catch (error: any) {
      showError(error.message || getText('errorDeleteBook'));
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
      header: getText('colCover'),
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
              {getText('noImage')}
            </div>
          )}
        </div>
      )) as any,
      width: '10%',
    },
    {
      header: getText('colTitle'),
      accessor: 'title' as keyof Book,
      width: '25%',
    },
    {
      header: getText('colAuthor'),
      accessor: 'author' as keyof Book,
      width: '20%',
    },
    {
      header: getText('colIsbn'),
      accessor: 'isbn' as keyof Book,
      width: '15%',
    },
    {
      header: getText('colStatus'),
      accessor: ((book: Book) => (
        <span
          className={`badge ${
            book.status === BookStatus.AVAILABLE
              ? 'badge-success'
              : 'badge-error'
          }`}
        >
          {book.status === BookStatus.AVAILABLE ? getText('statusAvailable') : getText('statusLent')}
        </span>
      )) as any,
      width: '15%',
    },
    {
      header: getText('colActions'),
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
            {getText('actionEdit')}
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
            {getText('actionDelete')}
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
          <h2 className="text-2xl font-bold text-gray-900">
            <RubyText>{getText('booksTitle')}</RubyText>
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            <RubyText>{getText('booksSubtitle')}</RubyText>
          </p>
        </div>
        <Button
          onClick={() => setIsAddModalOpen(true)}
          ariaLabel="新しい書籍を追加"
        >
          <span className="mr-2" aria-hidden="true">➕</span>
          {getText('btnAddBook')}
        </Button>
      </div>

      {/* 検索とフィルター */}
      <div className="card">
        <div className="card-body space-y-4">
          <Input
            placeholder={getText('searchPlaceholder')}
            value={searchQuery}
            onChange={setSearchQuery}
            ariaLabel="書籍を検索"
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
              <RubyText>{getText('filterAvailableOnly')}</RubyText>
            </label>
          </div>
        </div>
      </div>

      {/* 書籍一覧テーブル */}
      {loading ? (
        <div className="card">
          <div className="card-body text-center py-12">
            <div className="spinner mx-auto mb-4"></div>
            <p className="text-gray-600">{getText('loadingBooks')}</p>
          </div>
        </div>
      ) : (
        <Table
          columns={columns}
          data={filteredBooks}
          emptyMessage={getText('emptyBooks')}
          caption={getText('booksTitle')}
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
        title={getText('modalAddBook')}
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
              {getText('btnCancel')}
            </Button>
            <Button
              onClick={handleAddBook}
              loading={loading}
              ariaLabel="書籍を追加"
            >
              {getText('btnAdd')}
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
        title={getText('modalEditBook')}
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
              {getText('btnCancel')}
            </Button>
            <Button
              onClick={handleEditBook}
              loading={loading}
              ariaLabel="書籍を更新"
            >
              {getText('btnUpdate')}
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
        title={getText('modalDeleteBook')}
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
              {getText('btnCancel')}
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteBook}
              loading={loading}
              ariaLabel="書籍を削除"
            >
              {getText('btnDelete')}
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
                <RubyText>{getText('confirmDelete')}</RubyText>
              </p>
              <p className="text-sm text-gray-700">
                「{selectedBook?.title}」を削除します。
                <RubyText>{getText('deleteWarning')}</RubyText>
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
  const { getText } = useAppText();

  const handleFetchBookInfo = async () => {
    const cleanISBN = formData.isbn.replace(/[-\s]/g, '');

    // ISBN形式チェック
    if (cleanISBN.length !== 10 && cleanISBN.length !== 13) {
      showError(getText('errorValidation'));
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

      showSuccess(getText('successBarcode'));
    } catch (error: any) {
      console.error('書籍情報の取得に失敗:', error);
      showError(getText('errorNotFound'));
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
        label={getText('labelIsbn')}
        value={formData.isbn}
        onChange={(value) => setFormData({ ...formData, isbn: value })}
        onKeyDown={handleISBNKeyDown}
        placeholder={getText('labelIsbn')}
        required
        id="isbn"
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
          {getText('btnFetchBookInfo')}
        </Button>
        {fetchingInfo && (
          <span className="text-sm text-gray-600">{getText('loadingBooks')}</span>
        )}
      </div>

      {/* 書影プレビュー */}
      {formData.coverImageUrl && (
        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <p className="text-sm font-medium text-gray-700 mb-2">
            <RubyText>{getText('coverPreview')}</RubyText>
          </p>
          <div className="flex items-start space-x-4">
            <img
              src={formData.coverImageUrl}
              alt={getText('coverPreview')}
              className="w-24 h-32 object-cover rounded shadow-sm"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
              }}
            />
            <div className="flex-1">
              <Input
                label={getText('labelCoverUrl')}
                value={formData.coverImageUrl}
                onChange={(value) => setFormData({ ...formData, coverImageUrl: value })}
                id="coverImageUrl"
              />
            </div>
          </div>
        </div>
      )}

      <Input
        label={getText('labelTitle')}
        value={formData.title}
        onChange={(value) => setFormData({ ...formData, title: value })}
        required
        id="title"
        disabled={fetchingInfo}
      />
      <Input
        label={getText('labelAuthor')}
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
