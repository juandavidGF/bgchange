type TextOutputProps = {
  title?: string;
  placeholder?: string;
  value?: string;
};

export function TextOutput({ title, placeholder, value }: TextOutputProps) {
  return (
    <div className="w-80 p-4 rounded-lg border border-gray-600 bg-slate-800">
      <div className="text-sm font-medium text-gray-300 mb-2">
        {title || 'Text Output'}
      </div>
      <div className="text-lg text-gray-100 break-words">
        {value || placeholder || ''}
      </div>
    </div>
  );
}