import React, { useEffect, useState } from 'react';
import Modal from './Modal';
import Button from './Button';
import { RubyText } from './RubyText';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  type: 'loan' | 'return';
  bookTitle?: string;
  isKidsMode?: boolean;
}

const SuccessModal: React.FC<SuccessModalProps> = ({
  isOpen,
  onClose,
  type,
  bookTitle,
  isKidsMode = false,
}) => {
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    if (isOpen && isKidsMode) {
      setShowConfetti(true);
      const timer = setTimeout(() => setShowConfetti(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, isKidsMode]);

  const title = type === 'loan'
    ? (isKidsMode ? 'かしだしかんりょう！' : '貸出完了')
    : (isKidsMode ? 'へんきゃくかんりょう！' : '返却完了');

  const message = type === 'loan'
    ? (isKidsMode ? 'ほんをかりました！' : '書籍を貸し出しました')
    : (isKidsMode ? 'ほんをかえしました！' : '書籍を返却しました');

  const emoji = type === 'loan' ? '📚' : '✨';

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="text-center space-y-6 py-6">
        {isKidsMode && (
          <div className="relative">
            {/* アニメーション付き絵文字 */}
            <div className="text-8xl animate-bounce">
              {emoji}
            </div>

            {/* 紙吹雪エフェクト */}
            {showConfetti && (
              <div className="absolute inset-0 pointer-events-none overflow-hidden">
                {[...Array(20)].map((_, i) => (
                  <div
                    key={i}
                    className="absolute animate-confetti"
                    style={{
                      left: `${Math.random() * 100}%`,
                      top: '-10%',
                      animationDelay: `${Math.random() * 0.5}s`,
                      animationDuration: `${2 + Math.random() * 2}s`,
                    }}
                  >
                    {['🎉', '⭐', '✨', '🌟', '💫'][Math.floor(Math.random() * 5)]}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {!isKidsMode && (
          <div className="text-6xl">{emoji}</div>
        )}

        <div className={isKidsMode ? 'space-y-4' : 'space-y-2'}>
          <p className={`font-bold ${isKidsMode ? 'text-3xl text-transparent bg-clip-text bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500' : 'text-xl text-gray-900'}`}>
            {message}
          </p>

          {bookTitle && (
            <p className={`${isKidsMode ? 'text-xl text-gray-700' : 'text-gray-600'}`}>
              {bookTitle}
            </p>
          )}

          {isKidsMode && type === 'loan' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-yellow-100 to-orange-100 rounded-lg border-4 border-yellow-400">
              <p className="text-2xl font-bold text-orange-800">
                <RubyText>2しゅうかんで かえしてね！</RubyText>
              </p>
            </div>
          )}

          {isKidsMode && type === 'return' && (
            <div className="mt-6 p-4 bg-gradient-to-r from-green-100 to-teal-100 rounded-lg border-4 border-green-400">
              <p className="text-2xl font-bold text-green-800">
                <RubyText>ありがとう！</RubyText>
              </p>
            </div>
          )}
        </div>

        <Button
          onClick={onClose}
          className={`${
            isKidsMode
              ? 'text-2xl py-4 px-8 bg-gradient-to-r from-green-500 to-blue-500 hover:from-green-600 hover:to-blue-600 animate-pulse'
              : 'mt-4'
          }`}
        >
          {isKidsMode ? <RubyText>OK！</RubyText> : 'OK'}
        </Button>
      </div>

      <style>{`
        @keyframes confetti {
          0% {
            transform: translateY(0) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(100vh) rotate(720deg);
            opacity: 0;
          }
        }
        .animate-confetti {
          animation: confetti linear forwards;
        }
      `}</style>
    </Modal>
  );
};

export default SuccessModal;
