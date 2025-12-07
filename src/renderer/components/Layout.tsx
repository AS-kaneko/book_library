import React from 'react';
import { Link, useLocation } from 'react-router-dom';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const navItems = [
    { path: '/', label: '書籍管理', icon: '📚' },
    { path: '/employees', label: '社員管理', icon: '👥' },
    { path: '/loans', label: '貸出・返却', icon: '🔄' },
    { path: '/history', label: '履歴', icon: '📋' },
  ];

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
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto py-5 px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <span className="mr-3 text-primary-600">📖</span>
            社内図書管理システム
          </h1>
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
                  ${
                    isActive(item.path)
                      ? 'border-primary-500 text-primary-600 bg-primary-50'
                      : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300 hover:bg-gray-50'
                  }
                `}
              >
                <span aria-hidden="true">{item.icon}</span>
                <span>{item.label}</span>
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
            © 2024 社内図書管理システム
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
