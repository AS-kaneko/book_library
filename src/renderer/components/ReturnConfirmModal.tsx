import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { RubyText } from './RubyText';
import { Book } from '../../models/Book';
import { LoanRecord } from '../../models/LoanRecord';

interface ReturnConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  books: Book[];
  loanInfos: Map<string, LoanRecord>;
  isKidsMode?: boolean;
}

const ReturnConfirmModal: React.FC<ReturnConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  books,
  loanInfos,
  isKidsMode = false,
}) => {
  if (books.length === 0) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isKidsMode ? 'へんきゃくかくにん' : '返却確認'}>
      <div className="space-y-4">
        <div className={`p-4 rounded-lg ${isKidsMode ? 'bg-yellow-50 border-4 border-yellow-400' : 'bg-gray-50'}`}>
          <p className={`font-semibold mb-2 ${isKidsMode ? 'text-2xl text-yellow-900' : 'text-gray-900'}`}>
            {isKidsMode ? <RubyText>ほんのなまえ</RubyText> : '書籍'} ({books.length}冊)
          </p>
          <div className="space-y-2 max-h-60 overflow-y-auto">
            {books.map((book, index) => {
              const loanInfo = loanInfos.get(book.id);
              return (
                <div key={book.id} className={`p-2 rounded ${isKidsMode ? 'bg-yellow-100' : 'bg-white'}`}>
                  <p className={`font-semibold ${isKidsMode ? 'text-lg text-yellow-900' : 'text-sm text-gray-900'}`}>
                    {index + 1}. {book.title}
                  </p>
                  <p className={`text-xs ${isKidsMode ? 'text-yellow-700' : 'text-gray-600'}`}>
                    {isKidsMode ? <RubyText>かいたひと</RubyText> : '著者'}: {book.author}
                  </p>
                  {loanInfo && (
                    <p className={`text-xs ${isKidsMode ? 'text-yellow-700' : 'text-gray-600'}`}>
                      {isKidsMode ? <RubyText>かりたひと</RubyText> : '借りた人'}: {(loanInfo as any).employeeName}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

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
