import React from 'react';
import Modal from './Modal';
import Button from './Button';
import { RubyText } from './RubyText';
import { Book } from '../../models/Book';
import { Employee } from '../../models/Employee';

interface LoanConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  book: Book | null;
  employee: Employee | null;
  dueDate?: Date;
  isKidsMode?: boolean;
}

const LoanConfirmModal: React.FC<LoanConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  book,
  employee,
  dueDate,
  isKidsMode = false,
}) => {
  if (!book || !employee) return null;

  const dueDateStr = dueDate ? new Date(dueDate).toLocaleDateString('ja-JP') : '';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={isKidsMode ? 'かしだしかくにん' : '貸出確認'}>
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

        <div className={`p-4 rounded-lg ${isKidsMode ? 'bg-blue-50 border-4 border-blue-400' : 'bg-gray-50'}`}>
          <p className={`font-semibold mb-2 ${isKidsMode ? 'text-2xl text-blue-900' : 'text-gray-900'}`}>
            {isKidsMode ? <RubyText>かりるひと</RubyText> : '借りる人'}
          </p>
          <p className={`${isKidsMode ? 'text-xl text-blue-800' : 'text-gray-700'}`}>{employee.name}</p>
        </div>

        {dueDate && (
          <div className={`p-4 rounded-lg ${isKidsMode ? 'bg-green-50 border-4 border-green-400' : 'bg-gray-50'}`}>
            <p className={`font-semibold mb-2 ${isKidsMode ? 'text-2xl text-green-900' : 'text-gray-900'}`}>
              {isKidsMode ? <RubyText>かえすひ</RubyText> : '返却期限'}
            </p>
            <p className={`${isKidsMode ? 'text-xl text-green-800' : 'text-gray-700'}`}>{dueDateStr}</p>
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
            onClick={onConfirm}
            className={`flex-1 ${isKidsMode ? 'text-lg py-3 bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600' : ''}`}
          >
            {isKidsMode ? <RubyText>かくてい</RubyText> : '確定'}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default LoanConfirmModal;
