import { useState } from 'react';
import { GripVertical, Trash2, Video as VideoIcon } from 'lucide-react';

interface VideoBlockProps {
  id: string;
  videoUrl?: string;
  onUpdate: (id: string, videoUrl: string) => void;
  onDelete: (id: string) => void;
}

export function VideoBlock({ id, videoUrl, onUpdate, onDelete }: VideoBlockProps) {
  const [isHovered, setIsHovered] = useState(false);
  const [url, setUrl] = useState(videoUrl || '');

  const handleUrlChange = (newUrl: string) => {
    setUrl(newUrl);
    onUpdate(id, newUrl);
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
        {url ? (
          <div>
            <div className="relative aspect-video bg-gray-900 rounded-lg overflow-hidden mb-3">
              {url.includes('youtube.com') || url.includes('youtu.be') ? (
                <iframe
                  src={url.replace('watch?v=', 'embed/')}
                  className="w-full h-full"
                  allowFullScreen
                />
              ) : (
                <video src={url} controls className="w-full h-full" />
              )}
            </div>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="動画のURLを入力..."
              className="w-full p-2 text-sm text-gray-600 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mb-3">
              <VideoIcon className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-sm font-medium text-gray-700 mb-3">動画を追加</p>
            <input
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="YouTube URL または 動画ファイルのURLを入力..."
              className="w-full max-w-md p-2 text-sm text-gray-600 border border-gray-200 rounded outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        )}
      </div>
    </div>
  );
}
