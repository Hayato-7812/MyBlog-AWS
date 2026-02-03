import { useState } from 'react';
import { GripVertical, Trash2, Upload, Image as ImageIcon } from 'lucide-react';
import { ImageWithFallback } from '@/app/components/figma/ImageWithFallback';

interface ImageBlockProps {
  id: string;
  imageUrl?: string;
  caption?: string;
  onUpdate: (id: string, data: { imageUrl?: string; caption?: string }) => void;
  onDelete: (id: string) => void;
}

export function ImageBlock({ id, imageUrl, caption, onUpdate, onDelete }: ImageBlockProps) {
  const [isHovered, setIsHovered] = useState(false);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // ここでは仮のURLを設定（実際はファイルアップロード処理）
      const fakeUrl = URL.createObjectURL(file);
      onUpdate(id, { imageUrl: fakeUrl, caption });
    }
  };

  return (
    <div 
      className="relative group mb-4"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ブロックコントロール */}
      {isHovered && (
        <div className="absolute -left-12 top-2 flex items-center space-x-1 z-10">
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

      <div className="border border-gray-200 rounded-lg p-4">
        {imageUrl ? (
          <div>
            <div className="relative rounded-lg overflow-hidden mb-3">
              <ImageWithFallback
                src={imageUrl}
                alt={caption || '画像'}
                className="w-full h-auto"
              />
            </div>
            <input
              type="text"
              value={caption || ''}
              onChange={(e) => onUpdate(id, { imageUrl, caption: e.target.value })}
              placeholder="画像のキャプションを入力..."
              className="w-full p-2 text-sm text-gray-600 border-none outline-none focus:ring-0"
            />
          </div>
        ) : (
          <label className="flex flex-col items-center justify-center py-12 cursor-pointer hover:bg-gray-50 rounded-lg transition-colors">
            <input
              type="file"
              accept="image/*"
              onChange={handleImageUpload}
              className="hidden"
            />
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <ImageIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-1">画像をアップロード</p>
            <p className="text-xs text-gray-500">クリックまたはドラッグ&ドロップ</p>
          </label>
        )}
      </div>
    </div>
  );
}
