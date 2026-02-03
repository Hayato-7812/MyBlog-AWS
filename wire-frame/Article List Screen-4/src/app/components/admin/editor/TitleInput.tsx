interface TitleInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function TitleInput({ value, onChange, placeholder = '記事のタイトルを入力...' }: TitleInputProps) {
  return (
    <div className="mb-8">
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full text-4xl font-bold border-none outline-none focus:ring-0 placeholder-gray-300"
        style={{ caretColor: '#3b82f6' }}
      />
    </div>
  );
}
