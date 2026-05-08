'use client';

interface FileTreeProps {
  files: Record<string, string>;
  selectedFile: string;
  onSelectFile: (filename: string) => void;
}

export default function FileTree({ files, selectedFile, onSelectFile }: FileTreeProps) {
  const filenames = Object.keys(files).sort();

  return (
    <div className="h-full bg-[#252526] border-r border-[#3e3e3e] flex flex-col">
      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-wider text-[#bbbbbb] border-b border-[#3e3e3e]">
        Files
      </div>
      <div className="flex-1 overflow-y-auto py-1">
        {filenames.map((filename) => (
          <div
            key={filename}
            onClick={() => onSelectFile(filename)}
            className={`px-4 py-1.5 text-sm cursor-pointer flex items-center gap-2 ${
              selectedFile === filename
                ? 'bg-[#37373d] text-white'
                : 'text-[#cccccc] hover:bg-[#2a2d2e]'
            }`}
          >
            <span className="text-xs">{getFileIcon(filename)}</span>
            <span>{filename.split('/').pop()}</span>
            {filename.includes('/') && (
              <span className="text-xs text-[#6a6a6a] ml-auto">
                {filename.split('/')[0]}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function getFileIcon(filename: string): string {
  if (filename.includes('test')) return '🧪';
  if (filename.includes('__init__')) return '📦';
  return '🐍';
}