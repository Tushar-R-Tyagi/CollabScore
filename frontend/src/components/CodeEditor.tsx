'use client';

import Editor from '@monaco-editor/react';
import { useEffect, useRef } from 'react';

interface CodeEditorProps {
  filename: string;
  code: string;
  onChange: (filename: string, newCode: string) => void;
}

export default function CodeEditor({ filename, code, onChange }: CodeEditorProps) {
  const editorRef = useRef<any>(null);

  function handleEditorDidMount(editor: any) {
    editorRef.current = editor;
  }

  function handleChange(value: string | undefined) {
    if (value !== undefined) {
      onChange(filename, value);
    }
  }

  return (
    <div className="h-full flex flex-col bg-[#1e1e1e]">
      {filename ? (
        <>
          <div className="px-4 py-2 text-sm text-[#bbbbbb] border-b border-[#3e3e3e] bg-[#2d2d2d] flex items-center gap-2">
            <span>{filename}</span>
            <span className="w-2 h-2 rounded-full bg-yellow-500" title="Unsaved changes" />
          </div>
          <div className="flex-1">
            <Editor
              height="100%"
              defaultLanguage="python"
              theme="vs-dark"
              value={code}
              onChange={handleChange}
              onMount={handleEditorDidMount}
              options={{
                minimap: { enabled: false },
                fontSize: 14,
                lineNumbers: 'on',
                scrollBeyondLastLine: false,
                wordWrap: 'on',
                padding: { top: 8 },
              }}
            />
          </div>
        </>
      ) : (
        <div className="flex-1 flex items-center justify-center text-[#6a6a6a]">
          Select a file to edit
        </div>
      )}
    </div>
  );
}