import React, { useEffect, useState, useCallback } from 'react';
import {
  FolderIcon, FileTextIcon, RefreshCwIcon, ChevronRightIcon,
  HomeIcon, ImageIcon, CodeIcon, FileIcon, Loader2Icon, ChevronDownIcon
} from 'lucide-react';
import useStore from '../store/useStore.js';
import { listFiles } from '../api/client.js';

function getFileIcon(item) {
  if (item.type === 'directory') return <FolderIcon size={13} style={{ color: '#F59E0B', flexShrink: 0 }} />;
  const ext = item.extension || '';
  if (['.pdf'].includes(ext))                  return <FileTextIcon size={13} style={{ color: '#EF4444', flexShrink: 0 }} />;
  if (['.docx', '.doc'].includes(ext))         return <FileTextIcon size={13} style={{ color: '#3B82F6', flexShrink: 0 }} />;
  if (['.txt', '.md'].includes(ext))           return <FileTextIcon size={13} style={{ color: '#9CA3AF', flexShrink: 0 }} />;
  if (['.jpg','.jpeg','.png','.gif','.webp','.svg'].includes(ext))
                                               return <ImageIcon    size={13} style={{ color: '#22C55E', flexShrink: 0 }} />;
  if (['.js','.ts','.jsx','.tsx','.py','.go','.rs','.java','.cpp','.cs'].includes(ext))
                                               return <CodeIcon     size={13} style={{ color: '#8B5CF6', flexShrink: 0 }} />;
  return <FileIcon size={13} style={{ color: '#D1D5DB', flexShrink: 0 }} />;
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
  const [selectedPath, setSelectedPath] = useState(null);

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
      setSelectedPath(selectedPath === item.path ? null : item.path);
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

  function closeContextMenu() { setContextMenu(null); }

  function handleContextAction(action) {
    const { item } = contextMenu;
    closeContextMenu();
    if (action === 'ask')    addMessage({ role: 'user', content: `What is in ${item.path}?` });
    if (action === 'delete') addMessage({ role: 'user', content: `Delete ${item.path}` });
    if (action === 'info')   addMessage({ role: 'user', content: `Get file info for ${item.path}` });
  }

  const breadcrumbs = getBreadcrumbs();
  const currentFolder = breadcrumbs[breadcrumbs.length - 1]?.label || 'Files';

  return (
    <div className="fb-root" onClick={closeContextMenu}>

      {/* Section header */}
      <div className="fb-header">
        <div className="fb-header-row">
          <span className="fb-section-label">Files</span>
          <div className="fb-header-actions">
            <button className="icon-btn" onClick={() => setWorkingDirectory('/home/runner')} title="Home">
              <HomeIcon size={12} />
            </button>
            <button className="icon-btn" onClick={() => loadFiles(workingDirectory)} title="Refresh">
              <RefreshCwIcon size={12} />
            </button>
          </div>
        </div>

        {/* Breadcrumb */}
        {breadcrumbs.length > 0 && (
          <div className="fb-breadcrumb">
            {breadcrumbs.map((crumb, i) => (
              <React.Fragment key={crumb.path}>
                {i > 0 && <ChevronRightIcon size={9} style={{ color: '#D1D5DB', flexShrink: 0 }} />}
                <button className="crumb-btn" onClick={() => setWorkingDirectory(crumb.path)} title={crumb.path}>
                  {crumb.label}
                </button>
              </React.Fragment>
            ))}
          </div>
        )}
      </div>

      {/* File list */}
      <div className="fb-list">
        {loading && (
          <div className="fb-state">
            <Loader2Icon size={14} className="animate-spin" style={{ color: '#9CA3AF' }} />
            <span>Loading…</span>
          </div>
        )}
        {error && <div className="fb-error">{error}</div>}
        {!loading && !error && files.length === 0 && (
          <div className="fb-state"><span>Empty folder</span></div>
        )}

        {!loading && files.map(item => (
          <div key={item.path}
            onClick={() => handleFileClick(item)}
            onDoubleClick={() => handleFileDoubleClick(item)}
            onContextMenu={e => handleContextMenu(e, item)}
            className={`fb-item ${selectedPath === item.path ? 'fb-item-selected' : ''}`}
          >
            {getFileIcon(item)}
            <span className="fb-item-name">{item.name}</span>
            {item.type !== 'directory' && item.size > 0 && (
              <span className="fb-item-size">{formatSize(item.size)}</span>
            )}
          </div>
        ))}
      </div>

      {/* Footer count */}
      <div className="fb-footer">
        <span>{files.length} item{files.length !== 1 ? 's' : ''}</span>
      </div>

      {/* Context menu */}
      {contextMenu && (
        <div className="ctx-menu" style={{ left: contextMenu.x, top: contextMenu.y }}
          onClick={e => e.stopPropagation()}>
          <button onClick={() => handleContextAction('ask')} className="ctx-item">Ask AI about this</button>
          <button onClick={() => handleContextAction('info')} className="ctx-item">Get file info</button>
          <hr className="ctx-divider" />
          <button onClick={() => handleContextAction('delete')} className="ctx-item ctx-item-danger">Delete</button>
        </div>
      )}
    </div>
  );
}
