import { useState } from 'react';
import { Plus, Type, Image, Video } from 'lucide-react';
import { TextBlock } from './blocks/TextBlock';
import { ImageBlock } from './blocks/ImageBlock';
import { VideoBlock } from './blocks/VideoBlock';

export interface Block {
  id: string;
  type: 'text' | 'image' | 'video';
  content?: string;
  imageUrl?: string;
  caption?: string;
  videoUrl?: string;
}

interface BlockEditorProps {
  blocks: Block[];
  onBlocksChange: (blocks: Block[]) => void;
}

export function BlockEditor({ blocks, onBlocksChange }: BlockEditorProps) {
  const [showBlockMenu, setShowBlockMenu] = useState(false);

  const addBlock = (type: 'text' | 'image' | 'video') => {
    const newBlock: Block = {
      id: `block-${Date.now()}`,
      type,
      content: type === 'text' ? '' : undefined,
      imageUrl: type === 'image' ? undefined : undefined,
      videoUrl: type === 'video' ? undefined : undefined
    };
    onBlocksChange([...blocks, newBlock]);
    setShowBlockMenu(false);
  };

  const updateBlock = (id: string, data: any) => {
    onBlocksChange(
      blocks.map(block => 
        block.id === id ? { ...block, ...data } : block
      )
    );
  };

  const deleteBlock = (id: string) => {
    onBlocksChange(blocks.filter(block => block.id !== id));
  };

  const updateTextBlock = (id: string, content: string) => {
    updateBlock(id, { content });
  };

  const updateImageBlock = (id: string, data: { imageUrl?: string; caption?: string }) => {
    updateBlock(id, data);
  };

  const updateVideoBlock = (id: string, videoUrl: string) => {
    updateBlock(id, { videoUrl });
  };

  return (
    <div className="max-w-3xl">
      {/* ブロック一覧 */}
      <div className="mb-4">
        {blocks.map((block) => {
          switch (block.type) {
            case 'text':
              return (
                <TextBlock
                  key={block.id}
                  id={block.id}
                  content={block.content || ''}
                  onUpdate={updateTextBlock}
                  onDelete={deleteBlock}
                />
              );
            case 'image':
              return (
                <ImageBlock
                  key={block.id}
                  id={block.id}
                  imageUrl={block.imageUrl}
                  caption={block.caption}
                  onUpdate={updateImageBlock}
                  onDelete={deleteBlock}
                />
              );
            case 'video':
              return (
                <VideoBlock
                  key={block.id}
                  id={block.id}
                  videoUrl={block.videoUrl}
                  onUpdate={updateVideoBlock}
                  onDelete={deleteBlock}
                />
              );
            default:
              return null;
          }
        })}
      </div>

      {/* ブロック追加ボタン */}
      <div className="relative">
        <button
          onClick={() => setShowBlockMenu(!showBlockMenu)}
          className="flex items-center space-x-2 px-4 py-2 text-gray-600 border border-gray-300 border-dashed rounded-lg hover:border-blue-500 hover:text-blue-600 hover:bg-blue-50 transition-colors w-full"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">ブロックを追加</span>
        </button>

        {/* ブロックタイプメニュー */}
        {showBlockMenu && (
          <div className="absolute left-0 top-full mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-10">
            <button
              onClick={() => addBlock('text')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                <Type className="w-5 h-5 text-blue-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">テキスト</p>
                <p className="text-xs text-gray-500">段落テキストを追加</p>
              </div>
            </button>

            <button
              onClick={() => addBlock('image')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center">
                <Image className="w-5 h-5 text-green-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">画像</p>
                <p className="text-xs text-gray-500">画像をアップロード</p>
              </div>
            </button>

            <button
              onClick={() => addBlock('video')}
              className="w-full flex items-center space-x-3 px-4 py-3 hover:bg-gray-50 transition-colors"
            >
              <div className="w-10 h-10 bg-purple-50 rounded-lg flex items-center justify-center">
                <Video className="w-5 h-5 text-purple-600" />
              </div>
              <div className="text-left">
                <p className="font-medium text-gray-900">動画</p>
                <p className="text-xs text-gray-500">YouTube URLまたは動画ファイル</p>
              </div>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
