import React, { useEffect, useState, useCallback } from 'react';
import {
  FolderIcon, FileTextIcon, RefreshCwIcon, ChevronRightIcon,
  HomeIcon, ImageIcon, CodeIcon, FileIcon, Loader2Icon
} from 'lucide-react';
import useStore from '../store/useStore.js';
import { listFiles } from '../api/client.js';

function getFileIcon(item) {
  if (item.type === 'directory') return <FolderIcon size={15} className="text-yellow-500 flex-shrink-0" />;
  const ext = item.extension || '';
  if (['.pdf'].includes(ext)) return <FileTextIcon size={15} className="text-red-500 flex-shrink-0" />;
  if (['.docx', '.doc'].includes(ext)) return <FileTextIcon size={15} className="text-blue-500 flex-shrink-0" />;
  if (['.txt', '.md'].includes(ext)) return <FileTextIcon size={15} className="text-gray-500 flex-shrink-0" />;
  if (['.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg'].includes(ext)) return <ImageIcon size={15} className="text-green-500 flex-shrink-0" />;
  if (['.js', '.ts', '.jsx', '.tsx', '.py', '.go', '.rs', '.java', '.cpp', '.cs'].includes(ext)) return <CodeIcon size={15} className="text-purple-500 flex-shrink-0" />;
  return <FileIcon size={15} className="text-gray-400 flex-shrink-0" />;
}

function formatSize(bytes) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes}B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)}KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)}MB`;
}

export default function FileBrowser() {
  const { workingDirectory, setWorkingDirectory, addMessage } = useStore();
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [contextMenu, setContextMenu] = useState(null);
  const [tooltip, setTooltip] = useState(null);

  const loadFiles = useCallback(async (dir) => {
    if (!dir) return;
    setLoading(true);
    setError(null);
    try {
      const data = await listFiles(dir);
      setFiles(data.files || []);
    } catch (err) {
      setError(err.response?.data?.error || err.message);
      setFiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (workingDirectory) loadFiles(workingDirectory);
  }, [workingDirectory, loadFiles]);

  function getBreadcrumbs() {
    if (!workingDirectory) return [];
    const parts = workingDirectory.split('/').filter(Boolean);
    return parts.map((part, i) => ({
      label: part,
      path: '/' + parts.slice(0, i + 1).join('/')
    }));
  }

  function handleFileClick(item) {
    if (item.type === 'directory') {
      setWorkingDirectory(item.path);
    } else {
      setTooltip(tooltip?.path === item.path ? null : item);
    }
  }

  function handleFileDoubleClick(item) {
    if (item.type !== 'directory') {
      addMessage({ role: 'user', content: `Read ${item.path}` });
    }
  }

  function handleContextMenu(e, item) {
    e.preventDefault();
    setContextMenu({ x: e.clientX, y: e.clientY, item });
  }

  function closeContextMenu() {
    setContextMenu(null);
  }

  function handleContextAction(action) {
    const { item } = contextMenu;
    closeContextMenu();
    if (action === 'ask') {
      addMessage({ role: 'user', content: `What is in ${item.path}?` });
    } else if (action === 'delete') {
      addMessage({ role: 'user', content: `Delete ${item.path}` });
    } else if (action === 'info') {
      addMessage({ role: 'user', content: `Get file info for ${item.path}` });
    }
  }

  const breadcrumbs = getBreadcrumbs();

  return (
    <div className="flex flex-col h-full bg-gray-50 text-sm" onClick={closeContextMenu}>
      <div className="px-3 py-2 border-b border-gray-200 bg-white">
        <div className="flex items-center justify-between mb-1">
          <span className="font-medium text-gray-700 text-xs uppercase tracking-wide">Files</span>
          <button
            onClick={() => loadFiles(workingDirectory)}
            className="p-1 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
            title="Refresh"
          >
            <RefreshCwIcon size={13} />
          </button>
        </div>
        <div className="flex items-center gap-1 flex-wrap">
          <button
            onClick={() => setWorkingDirectory('/home/runner')}
            className="p-0.5 hover:bg-gray-100 rounded text-gray-400 hover:text-gray-600"
          >
            <HomeIcon size={13} />
          </button>
          {breadcrumbs.map((crumb, i) => (
            <React.Fragment key={crumb.path}>
              <ChevronRightIcon size={11} className="text-gray-300" />
              <button
                onClick={() => setWorkingDirectory(crumb.path)}
                className="text-xs text-gray-600 hover:text-blue-600 truncate max-w-20"
                title={crumb.path}
              >
                {crumb.label}
              </button>
            </React.Fragment>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-1">
        {loading && (
          <div className="flex items-center justify-center p-4 text-gray-400">
            <Loader2Icon size={16} className="animate-spin mr-2" />
            <span className="text-xs">Loading...</span>
          </div>
        )}

        {error && (
          <div className="p-3 text-xs text-red-600 bg-red-50 rounded-lg m-2">
            {error}
          </div>
        )}

        {!loading && !error && files.length === 0 && (
          <div className="p-4 text-xs text-gray-400 text-center">Empty folder</div>
        )}

        {!loading && files.map(item => (
          <div
            key={item.path}
            onClick={() => handleFileClick(item)}
            onDoubleClick={() => handleFileDoubleClick(item)}
            onContextMenu={e => handleContextMenu(e, item)}
            className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-white hover:shadow-sm cursor-pointer group transition-all"
          >
            {getFileIcon(item)}
            <span className="flex-1 truncate text-gray-700 text-xs">{item.name}</span>
            {item.type !== 'directory' && item.size > 0 && (
              <span className="text-xs text-gray-300 group-hover:text-gray-400 flex-shrink-0">
                {formatSize(item.size)}
              </span>
            )}
          </div>
        ))}
      </div>

      {tooltip && (
        <div className="border-t border-gray-200 bg-white p-3 text-xs text-gray-600">
          <p className="font-medium truncate">{tooltip.name}</p>
          <p className="text-gray-400">{formatSize(tooltip.size)}</p>
          {tooltip.modified && (
            <p className="text-gray-400">{new Date(tooltip.modified).toLocaleDateString()}</p>
          )}
          <button
            onClick={() => { addMessage({ role: 'user', content: `Read ${tooltip.path}` }); setTooltip(null); }}
            className="mt-1 text-blue-600 hover:underline"
          >
            Ask AI about this
          </button>
        </div>
      )}

      <div className="px-3 py-1.5 border-t border-gray-200 bg-white">
        <span className="text-xs text-gray-400">{files.length} item{files.length !== 1 ? 's' : ''}</span>
      </div>

      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-xl shadow-lg py-1 z-50 text-sm"
          style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}
        >
          <button onClick={() => handleContextAction('ask')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">
            Ask AI about this
          </button>
          <button onClick={() => handleContextAction('info')} className="w-full text-left px-4 py-2 hover:bg-gray-50 text-gray-700">
            Get file info
          </button>
          <hr className="border-gray-100 my-1" />
          <button onClick={() => handleContextAction('delete')} className="w-full text-left px-4 py-2 hover:bg-red-50 text-red-600">
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
