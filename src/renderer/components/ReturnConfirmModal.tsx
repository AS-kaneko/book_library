import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { RubyText } from './RubyText';
import { Book } from '../../models/Book';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  book: Book | null;
  borrowerName?: string;
  borrowedDate?: Date;
  isKidsMode?: boolean;
}

const ReturnConfirmModal: React.FC<ReturnConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  book,
  borrowerName,
  borrowedDate,
  isKidsMode = false,
}) => {
  if (!book) return null;

  const borrowedDateStr = borrowedDate ? new Date(borrowedDate).toLocaleDateString('ja-JP') : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isKidsMode ? 'へんきゃくかくにん' : '返却確認'}>
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isKidsMode ? 'bg-yellow-50 border-4 border-yellow-400' : 'bg-gray-50'}`}>
          <p className={`font-semibold mb-2 ${isKidsMode ? 'text-2xl text-yellow-900' : 'text-gray-900'}`}>
            {isKidsMode ? <RubyText>ほんのなまえ</RubyText> : '書籍'}
          </p>
          <p className={`${isKidsMode ? 'text-xl text-yellow-800' : 'text-gray-700'}`}>{book.title}</p>
          <p className={`text-sm ${isKidsMode ? 'text-yellow-700' : 'text-gray-600'}`}>
            {isKidsMode ? <RubyText>かいたひと</RubyText> : '著者'}: {book.author}
          </p>
        </div>

        {borrowerName && (
          <div className={`p-4 rounded-lg ${isKidsMode ? 'bg-blue-50 border-4 border-blue-400' : 'bg-gray-50'}`}>
            <p className={`font-semibold mb-2 ${isKidsMode ? 'text-2xl text-blue-900' : 'text-gray-900'}`}>
              {isKidsMode ? <RubyText>かりたひと</RubyText> : '借りた人'}
            </p>
            <p className={`${isKidsMode ? 'text-xl text-blue-800' : 'text-gray-700'}`}>{borrowerName}</p>
          </div>
        )}

        {borrowedDate && (
          <div className={`p-4 rounded-lg ${isKidsMode ? 'bg-purple-50 border-4 border-purple-400' : 'bg-gray-50'}`}>
            <p className={`font-semibold mb-2 ${isKidsMode ? 'text-2xl text-purple-900' : 'text-gray-900'}`}>
              {isKidsMode ? <RubyText>かりたひ</RubyText> : '貸出日'}
            </p>
            <p className={`${isKidsMode ? 'text-xl text-purple-800' : 'text-gray-700'}`}>{borrowedDateStr}</p>
          </div>
        )}

        <div className="flex gap-3 mt-6">
          <Button
            variant="secondary"
            onClick={onClose}
            className={`flex-1 ${isKidsMode ? 'text-lg py-3' : ''}`}
          >
            {isKidsMode ? <RubyText>キャンセル</RubyText> : 'キャンセル'}
          </Button>
          <Button
            variant="success"
            onClick={onConfirm}
            className={`flex-1 ${isKidsMode ? 'text-lg py-3 bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600' : ''}`}
          >
            {isKidsMode ? <RubyText>かくてい</RubyText> : '確定'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ReturnConfirmModal;
