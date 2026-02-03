import { ArrowLeft, Save, Eye, Upload } from 'lucide-react';

interface EditorHeaderProps {
  isNewArticle?: boolean;
  onSaveDraft?: () => void;
  onPublish?: () => void;
  onPreview?: () => void;
  onBack?: () => void;
}

export function EditorHeader({ 
  isNewArticle = true,
  onSaveDraft,
  onPublish,
  onPreview,
  onBack
}: EditorHeaderProps) {
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-40">
      <div className="flex items-center justify-between h-16 px-6">
        {/* 左側：タイトルと戻るボタン */}
        <div className="flex items-center space-x-4">
          <button 
            onClick={onBack}
            className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
            <span className="font-medium">戻る</span>
          </button>
          <div className="border-l border-gray-300 h-6"></div>
          <h1 className="text-xl font-bold text-gray-900">
            {isNewArticle ? '新規記事作成' : '記事を編集'}
          </h1>
        </div>

        {/* 右側：アクションボタン */}
        <div className="flex items-center space-x-3">
          <button
            onClick={onPreview}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            <span className="font-medium">プレビュー</span>
          </button>
          
          <button
            onClick={onSaveDraft}
            className="flex items-center space-x-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            <span className="font-medium">下書き保存</span>
          </button>

          <button
            onClick={onPublish}
            className="flex items-center space-x-2 px-6 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
          >
            <Upload className="w-4 h-4" />
            <span className="font-medium">公開</span>
          </button>
        </div>
      </div>
    </header>
  );
}
