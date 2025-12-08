import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useMode } from '../contexts/ModeContext';
import { useAppText } from '../utils/textResource';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();
  const { isKidsMode, toggleMode } = useMode();
  const { getText } = useAppText();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: getText('menuBooks'), icon: '📚' },
    { path: '/employees', label: getText('menuEmployees'), icon: '👥', hiddenInKids: true },
    { path: '/loans', label: getText('menuLoans'), icon: '🔄' },
    { path: '/history', label: getText('menuHistory'), icon: '📋', hiddenInKids: true },
  ].filter(item => !isKidsMode || !item.hiddenInKids);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Skip to main content link for accessibility */}
      <a
        href="#main-content"
        className="skip-link focus:top-4"
      >
        メインコンテンツへスキップ
      </a>

      {/* Header */}
      <header className={`${isKidsMode ? 'bg-orange-100' : 'bg-white'} shadow-sm border-b border-gray-200 transition-colors duration-300`}>
        <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="mr-3 text-primary-600">📖</span>
            {getText('appTitle')}
          </h1>

          <button
            onClick={toggleMode}
            className={`
              flex items-center gap-2 px-4 py-2 rounded-full font-bold text-sm transition-all shadow-sm
              ${isKidsMode
                ? 'bg-yellow-400 text-yellow-900 hover:bg-yellow-500 ring-2 ring-yellow-200'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 ring-1 ring-gray-200'}
            `}
            aria-label={isKidsMode ? '通常モードに切り替え' : 'キッズモードに切り替え'}
          >
            <span>{isKidsMode ? '👶' : '👨‍💼'}</span>
            <span>{isKidsMode ? getText('modeToggleKids') : getText('modeToggleNormal')}</span>
          </button>
        </div>
      </header>

      {/* Navigation */}
      <nav
        className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-40"
        role="navigation"
        aria-label="メインナビゲーション"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-1 sm:space-x-4" role="tablist">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                role="tab"
                aria-selected={isActive(item.path)}
                aria-current={isActive(item.path) ? 'page' : undefined}
                className={`
                  py-4 px-3 sm:px-4 border-b-2 font-medium text-sm sm:text-base
                  transition-all duration-200 ease-in-out
                  focus:outline-none focus:ring-2 focus:ring-inset focus:ring-primary-500
                  flex items-center gap-2
                  ${isActive(item.path)
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span aria-hidden="true" className={isKidsMode ? 'text-2xl' : ''}>{item.icon}</span>
                <span className={isKidsMode ? 'text-lg font-bold' : ''}>{item.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main
        id="main-content"
        className="flex-1 max-w-7xl w-full mx-auto py-6 px-4 sm:px-6 lg:px-8"
        role="main"
      >
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-500">
            © 2024 {getText('footerCopy')}
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
