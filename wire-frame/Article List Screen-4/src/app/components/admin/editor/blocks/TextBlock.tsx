import { useState } from 'react';
import { GripVertical, Trash2 } from 'lucide-react';

interface TextBlockProps {
  id: string;
  content: string;
  onUpdate: (id: string, content: string) => void;
  onDelete: (id: string) => void;
}

export function TextBlock({ id, content, onUpdate, onDelete }: TextBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div 
      className="relative group mb-2"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ブロックコントロール */}
      {isHovered && (
        <div className="absolute -left-12 top-2 flex items-center space-x-1">
          <button 
            className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded cursor-move"
            aria-label="ドラッグして移動"
          >
            <GripVertical className="w-4 h-4" />
          </button>
          <button
            onClick={() => onDelete(id)}
            className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
            aria-label="削除"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* テキストエリア */}
      <textarea
        value={content}
        onChange={(e) => onUpdate(id, e.target.value)}
        placeholder="テキストを入力するか、/ でコマンドを表示..."
        className="w-full min-h-[100px] p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
        style={{ lineHeight: '1.75' }}
      />
    </div>
  );
}
