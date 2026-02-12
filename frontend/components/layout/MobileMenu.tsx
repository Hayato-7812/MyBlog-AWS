'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';

export function MobileMenu() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const closeMenu = () => {
    setIsOpen(false);
  };

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={toggleMenu}
        className="md:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
        aria-label={isOpen ? 'メニューを閉じる' : 'メニューを開く'}
      >
        {isOpen ? (
          <X className="w-6 h-6 text-gray-700" />
        ) : (
          <Menu className="w-6 h-6 text-gray-700" />
        )}
      </button>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed top-16 left-0 right-0 bottom-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={closeMenu}
          />

          {/* Menu Panel */}
          <div className="fixed top-16 right-0 w-64 h-[calc(100vh-4rem)] bg-white shadow-lg z-50 md:hidden overflow-y-auto">
            <nav className="flex flex-col p-4 space-y-2">
              <Link
                href="/"
                onClick={closeMenu}
                className="px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                ホーム
              </Link>
              <Link
                href="/about"
                onClick={closeMenu}
                className="px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                About
              </Link>
              <Link
                href="/contact"
                onClick={closeMenu}
                className="px-4 py-3 text-gray-700 hover:bg-gray-100 rounded-lg font-medium transition-colors"
              >
                Contact
              </Link>
              
              {/* Divider */}
              <div className="border-t border-gray-200 my-2" />
              
              {/* Categories */}
              <div className="px-4 py-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
                  カテゴリー
                </p>
                <div className="space-y-1">
                  <Link
                    href="/category/テクノロジー"
                    onClick={closeMenu}
                    className="block px-2 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    テクノロジー
                  </Link>
                  <Link
                    href="/category/ライフスタイル"
                    onClick={closeMenu}
                    className="block px-2 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    ライフスタイル
                  </Link>
                  <Link
                    href="/category/ビジネス"
                    onClick={closeMenu}
                    className="block px-2 py-2 text-sm text-gray-600 hover:text-blue-600 transition-colors"
                  >
                    ビジネス
                  </Link>
                </div>
              </div>
            </nav>
          </div>
        </>
      )}
    </>
  );
}
