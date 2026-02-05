import { Facebook, Twitter, Instagram, Linkedin, Github } from 'lucide-react';

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300 mt-12 sm:mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8">
          {/* ブランドセクション */}
          <div className="sm:col-span-2 md:col-span-1">
            <h2 className="text-white text-lg sm:text-xl font-bold mb-3 sm:mb-4">MyBlog</h2>
            <p className="text-sm sm:text-base text-gray-400 mb-3 sm:mb-4">
              日々の学びや発見を共有する、モダンなブログプラットフォーム
            </p>
            {/* SNSリンク */}
            <div className="flex space-x-3 sm:space-x-4">
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors touch-manipulation p-1"
                aria-label="Facebook"
              >
                <Facebook className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors touch-manipulation p-1"
                aria-label="Twitter"
              >
                <Twitter className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors touch-manipulation p-1"
                aria-label="Instagram"
              >
                <Instagram className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors touch-manipulation p-1"
                aria-label="LinkedIn"
              >
                <Linkedin className="w-5 h-5" />
              </a>
              <a
                href="#"
                className="text-gray-400 hover:text-white transition-colors touch-manipulation p-1"
                aria-label="GitHub"
              >
                <Github className="w-5 h-5" />
              </a>
            </div>
          </div>

          {/* クイックリンク */}
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">クイックリンク</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation inline-block py-1">
                  ホーム
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation inline-block py-1">
                  About
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation inline-block py-1">
                  Contact
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation inline-block py-1">
                  記事一覧
                </a>
              </li>
            </ul>
          </div>

          {/* リーガル */}
          <div>
            <h3 className="text-white font-semibold mb-3 sm:mb-4 text-sm sm:text-base">リーガル</h3>
            <ul className="space-y-2">
              <li>
                <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation inline-block py-1">
                  プライバシーポリシー
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation inline-block py-1">
                  利用規約
                </a>
              </li>
              <li>
                <a href="#" className="text-sm sm:text-base text-gray-400 hover:text-white transition-colors touch-manipulation inline-block py-1">
                  Cookie ポリシー
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* コピーライト */}
        <div className="border-t border-gray-800 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
          <p className="text-gray-400 text-xs sm:text-sm">
            © 2026 MyBlog. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}