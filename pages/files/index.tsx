'use client';

import AdminLayout from '@/components/Layout/AdminLayout';
import api from '@/lib/axios';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import CmsModuleShell from '@/components/Modules/CmsModuleShell';

const DISK = 'public' as const;

interface FMFile {
  name: string;
  isDirectory: boolean;
  path: string;
  size?: number;
  updatedAt?: string;
  timestamp?: number;
}

interface LaravelContentResponse {
  directories: { basename: string; path: string; timestamp?: number }[];
  files: { basename: string; path: string; size?: number; timestamp?: number }[];
}

const toIso = (timestamp?: number) =>
  timestamp ? new Date(timestamp * 1000).toISOString() : new Date().toISOString();

const formatSize = (bytes?: number) => {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

const formatDate = (iso?: string) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
};

const getFileIcon = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  if (['jpg','jpeg','png','gif','webp','svg','avif'].includes(ext)) return '🖼️';
  if (['mp4','mov','avi','mkv','webm'].includes(ext)) return '🎬';
  if (['mp3','wav','ogg','flac'].includes(ext)) return '🎵';
  if (['pdf'].includes(ext)) return '📄';
  if (['zip','rar','tar','gz'].includes(ext)) return '🗜️';
  if (['doc','docx'].includes(ext)) return '📝';
  if (['xls','xlsx','csv'].includes(ext)) return '📊';
  if (['js','ts','jsx','tsx','php','py','html','css','json'].includes(ext)) return '💻';
  return '📄';
};

const isImage = (name: string) => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return ['jpg','jpeg','png','gif','webp','svg','avif'].includes(ext);
};

const getExtension = (name: string) => name.split('.').pop()?.toLowerCase() ?? '';
const isVideo = (name: string) => ['mp4','mov','avi','mkv','webm'].includes(getExtension(name));
const isAudio = (name: string) => ['mp3','wav','ogg','flac'].includes(getExtension(name));
const isPdf = (name: string) => getExtension(name) === 'pdf';
const isTextPreview = (name: string) =>
  ['txt','csv','json','js','ts','jsx','tsx','php','py','html','css','md','xml'].includes(getExtension(name));

type ViewMode = 'grid' | 'list';
type SortKey  = 'name' | 'size' | 'date';

// ── Portal Modal ────────────────────────────────────────────────
function PortalModal({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;
  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        background: 'rgba(15,23,42,0.45)', backdropFilter: 'blur(4px)',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 12, padding: 28,
          minWidth: 360, maxWidth: '92vw',
          boxShadow: '0 20px 60px rgba(0,0,0,0.2)',
        }}
      >
        {children}
      </div>
    </div>,
    document.body
  );
}

// ── Image Preview Portal ────────────────────────────────────────
function FilePreviewPortal({
  file,
  url,
  onClose,
  onDownload,
}: {
  file: FMFile;
  url: string;
  onClose: () => void;
  onDownload: () => void;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  if (!mounted) return null;

  const content = isImage(file.name) ? (
    <img
      src={url}
      alt={file.name}
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '88vw', maxHeight: '80vh', borderRadius: 10, objectFit: 'contain', boxShadow: '0 25px 80px rgba(0,0,0,0.5)' }}
    />
  ) : isVideo(file.name) ? (
    <video
      src={url}
      controls
      onClick={(e) => e.stopPropagation()}
      style={{ maxWidth: '88vw', maxHeight: '80vh', borderRadius: 10, background: '#000' }}
    />
  ) : isAudio(file.name) ? (
    <div className="bg-white rounded p-4" onClick={(e) => e.stopPropagation()} style={{ width: 'min(560px, 88vw)' }}>
      <audio src={url} controls style={{ width: '100%' }} />
    </div>
  ) : isPdf(file.name) || isTextPreview(file.name) ? (
    <iframe
      src={url}
      title={file.name}
      onClick={(e) => e.stopPropagation()}
      style={{ width: '88vw', height: '80vh', border: 0, borderRadius: 10, background: '#fff' }}
    />
  ) : (
    <div className="bg-white rounded p-4 text-center" onClick={(e) => e.stopPropagation()} style={{ width: 'min(520px, 88vw)' }}>
      <h5 className="mb-2">{file.name}</h5>
      <p className="text-muted mb-3">This file type may not preview in the browser.</p>
      <button type="button" className="btn btn-primary" onClick={onDownload}>Download</button>
    </div>
  );

  return createPortal(
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, zIndex: 999999,
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', gap: 14,
        background: 'rgba(0,0,0,0.78)', backdropFilter: 'blur(6px)',
      }}
    >
      <div className="d-flex justify-content-between align-items-center px-3 w-100"
        style={{ maxWidth: '90vw' }} onClick={(e) => e.stopPropagation()}>
        <span className="text-white fw-semibold">{file.name}</span>
        <div className="d-flex gap-2">
          <button className="btn btn-sm btn-light" onClick={onDownload}>Download</button>
          <button className="btn btn-sm btn-light" onClick={onClose}>Close</button>
        </div>
      </div>
      {content}
    </div>,
    document.body
  );
}

// ── Main Page ───────────────────────────────────────────────────
export default function FileManagerPage() {
  const [files, setFiles]                   = useState<FMFile[]>([]);
  const [currentPath, setCurrentPath]       = useState('');
  const [breadcrumbs, setBreadcrumbs]       = useState<string[]>([]);
  const [loading, setLoading]               = useState(true);
  const [error, setError]                   = useState<string | null>(null);
  const [viewMode, setViewMode]             = useState<ViewMode>('grid');
  const [sortKey, setSortKey]               = useState<SortKey>('name');
  const [selected, setSelected]             = useState<Set<string>>(new Set());
  const [renaming, setRenaming]             = useState<FMFile | null>(null);
  const [renameValue, setRenameValue]       = useState('');
  const [creatingFolder, setCreatingFolder] = useState(false);
  const [newFolderName, setNewFolderName]   = useState('');
  const [preview, setPreview]               = useState<FMFile | null>(null);
  const [uploading, setUploading]           = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOver, setDragOver]             = useState(false);
  const [confirmDelete, setConfirmDelete]   = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchContent = useCallback(async (path: string) => {
    setLoading(true);
    setError(null);
    setSelected(new Set());
    try {
      const res = await api.get<LaravelContentResponse>('/file-manager/content', {
        params: { disk: DISK, path },
      });
      const dirs: FMFile[] = (res.data.directories ?? []).map((d) => ({
        name: d.basename, isDirectory: true, path: d.path, updatedAt: toIso(d.timestamp),
      }));
      const fileList: FMFile[] = (res.data.files ?? [])
        .filter((f) => !f.basename.startsWith('.'))
        .map((f) => ({
          name: f.basename, isDirectory: false, path: f.path,
          size: f.size, updatedAt: toIso(f.timestamp),
        }));
      setFiles([...dirs, ...fileList]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to load files');
    } finally {
      setLoading(false);
    }
  }, []);

  const [contextMenu, setContextMenu] = useState<{ x: number; y: number; file: FMFile } | null>(null);
  // Close context menu on outside click
  useEffect(() => {
    const close = () => setContextMenu(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, []);

  useEffect(() => { fetchContent(''); }, [fetchContent]);

  const navigate = (path: string) => {
    setCurrentPath(path);
    setBreadcrumbs(path ? path.split('/').filter(Boolean) : []);
    fetchContent(path);
  };

  const sorted = [...files].sort((a, b) => {
    if (a.isDirectory !== b.isDirectory) return a.isDirectory ? -1 : 1;
    if (sortKey === 'name') return a.name.localeCompare(b.name);
    if (sortKey === 'size') return (a.size ?? 0) - (b.size ?? 0);
    if (sortKey === 'date') return (a.updatedAt ?? '').localeCompare(b.updatedAt ?? '');
    return 0;
  });

  const getFileUrl = (file: FMFile) => {
    const encodedPath = file.path.split('/').map(encodeURIComponent).join('/');
    return `${process.env.NEXT_PUBLIC_API_URL}/storage/${encodedPath}`;
  };

  const selectedFiles = files.filter((file) => selected.has(file.path));
  const selectedDownloadableFiles = selectedFiles.filter((file) => !file.isDirectory);
  const singleSelectedFile = selectedFiles.length === 1 ? selectedFiles[0] : null;

  const handlePreview = (file: FMFile) => {
    if (file.isDirectory) {
      navigate(file.path);
      return;
    }
    setPreview(file);
  };

  const handleDownload = async (file: FMFile) => {
    if (file.isDirectory) return;
    const url = getFileUrl(file);
    const link = document.createElement('a');
    link.href = `/api/file-download?url=${encodeURIComponent(url)}&filename=${encodeURIComponent(file.name)}`;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
  };

  const handleDownloadSelected = async () => {
    for (const file of selectedDownloadableFiles) {
      await handleDownload(file);
    }
  };

  const toggleSelect = (path: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = new Set(selected);
    next.has(path) ? next.delete(path) : next.add(path);
    setSelected(next);
  };

  const handleUpload = async (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploading(true);
    setUploadProgress(0);
    try {
      const formData = new FormData();
      formData.append('disk', DISK);
      formData.append('path', currentPath);
      formData.append('overwrite', '0');
      Array.from(fileList).forEach((f) => formData.append('files[]', f));
      await api.post('/file-manager/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setUploadProgress(Math.round((e.loaded / e.total) * 100));
        },
      });
      await fetchContent(currentPath);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed');
    } finally {
      setUploading(false);
      setUploadProgress(0);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleDelete = async () => {
    const paths = Array.from(selected);
    if (!paths.length) return;
    try {
      const items = paths.map((path) => {
        const file = files.find((f) => f.path === path);
        return { type: file?.isDirectory ? 'dir' : 'file', path };
      });

      // POST instead of DELETE — avoids the wildcard catch-all issue
      await api.post('/file-manager/delete', {
        disk: DISK,
        items,
      });

      setSelected(new Set());
      setConfirmDelete(false);
      await fetchContent(currentPath);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  const handleRename = async () => {
    if (!renaming || !renameValue.trim()) return;
    try {
      const oldPath = renaming.path;
      const parent  = oldPath.includes('/') ? oldPath.substring(0, oldPath.lastIndexOf('/')) : '';
      const newPath = parent ? `${parent}/${renameValue}` : renameValue;
      await api.post('/file-manager/rename', {
        disk: DISK, oldName: oldPath, newName: newPath,
        type: renaming.isDirectory ? 'dir' : 'file',
      });
      setRenaming(null);
      setRenameValue('');
      await fetchContent(currentPath);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Rename failed');
    }
  };

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return;
    try {
      await api.post('/file-manager/create-directory', {
        disk: DISK, path: currentPath, name: newFolderName.trim(),
      });
      setCreatingFolder(false);
      setNewFolderName('');
      await fetchContent(currentPath);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Create folder failed');
    }
  };

  const previewUrl = preview ? getFileUrl(preview) : '';
  const folderCount = useMemo(() => sorted.filter((file) => file.isDirectory).length, [sorted]);
  const fileCount = useMemo(() => sorted.filter((file) => !file.isDirectory).length, [sorted]);

  return (
    <CmsModuleShell
      title="Manage Files"
      description="Browse, upload, and organize files in your storage."
      icon="fa-solid fa-folder-open"
      actions={(
        <div className="btn-group cms-file-manager__view-toggle" role="group" aria-label="View mode">
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'grid' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('grid')}
          >
            <i className="fa-solid fa-grip me-1" aria-hidden="true" />
            Grid
          </button>
          <button
            type="button"
            className={`btn btn-sm ${viewMode === 'list' ? 'btn-primary' : 'btn-outline-secondary'}`}
            onClick={() => setViewMode('list')}
          >
            <i className="fa-solid fa-list me-1" aria-hidden="true" />
            List
          </button>
        </div>
      )}
      stats={[
        { label: 'Items', value: sorted.length },
        { label: 'Folders', value: folderCount, tone: 'accent' },
        { label: 'Files', value: fileCount },
        { label: 'Selected', value: selected.size },
      ]}
      toolbar={(
        <div className="cms-file-manager__toolbar d-flex align-items-center gap-2 flex-wrap">
        {/* Breadcrumbs */}
        <nav className="cms-file-manager__breadcrumbs d-flex align-items-center gap-1 flex-grow-1 flex-wrap">
          <button
            type="button"
            className="btn btn-sm btn-link text-decoration-none p-1 text-secondary fw-medium"
            onClick={() => navigate('')}>
            <i className="fa-solid fa-house me-1" aria-hidden="true" />
            Home
          </button>
          {breadcrumbs.map((crumb, i) => {
            const path  = breadcrumbs.slice(0, i + 1).join('/');
            const isLast = i === breadcrumbs.length - 1;
            return (
              <span key={path} className="d-flex align-items-center gap-1">
                <span className="text-muted">/</span>
                <button
                  type="button"
                  className={`btn btn-sm btn-link text-decoration-none p-1 fw-medium ${isLast ? 'text-dark' : 'text-secondary'}`}
                  onClick={() => navigate(path)}>
                  {crumb}
                </button>
              </span>
            );
          })}
        </nav>

        <div className="vr d-none d-md-block" />

        <select
          className="form-select form-select-sm cms-file-manager__sort"
          value={sortKey}
          onChange={(e) => setSortKey(e.target.value as SortKey)}>
          <option value="name">Sort: Name</option>
          <option value="size">Sort: Size</option>
          <option value="date">Sort: Date</option>
        </select>

        <button type="button" className="btn btn-sm btn-outline-secondary cms-module__toolbar-btn"
          onClick={() => setCreatingFolder(true)}>
          <i className="fa-solid fa-folder-plus me-1" aria-hidden="true" />
          New Folder
        </button>

        <button type="button" className="btn btn-sm btn-primary cms-module__toolbar-btn"
          onClick={() => fileInputRef.current?.click()}>
          <i className="fa-solid fa-upload me-1" aria-hidden="true" />
          Upload
        </button>

        {singleSelectedFile && !singleSelectedFile.isDirectory && (
          <button type="button" className="btn btn-sm btn-outline-secondary cms-module__toolbar-btn"
            onClick={() => handlePreview(singleSelectedFile)}>
            Preview
          </button>
        )}

        {selectedDownloadableFiles.length > 0 && (
          <button type="button" className="btn btn-sm btn-outline-secondary cms-module__toolbar-btn"
            onClick={handleDownloadSelected}>
            Download ({selectedDownloadableFiles.length})
          </button>
        )}

        {selected.size > 0 && (
          <button type="button" className="btn btn-sm btn-outline-danger cms-module__toolbar-btn"
            onClick={() => setConfirmDelete(true)}>
            Delete ({selected.size})
          </button>
        )}

        <div className="vr d-none d-md-block" />

        <button type="button" className="btn btn-sm btn-outline-secondary cms-module__toolbar-btn"
          onClick={() => fetchContent(currentPath)} title="Refresh">
          <i className="fa-solid fa-rotate-right" aria-hidden="true" />
        </button>
        </div>
      )}
    >
      {/* ── Upload Progress ── */}
      {uploading && (
        <div className="px-4 py-2 bg-primary bg-opacity-10 border-bottom border-primary border-opacity-25">
          <div className="d-flex justify-content-between mb-1">
            <small className="text-primary fw-semibold">Uploading...</small>
            <small className="text-primary fw-semibold">{uploadProgress}%</small>
          </div>
          <div className="progress" style={{ height: 5 }}>
            <div
              className="progress-bar progress-bar-striped progress-bar-animated"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* ── Error ── */}
      {error && (
        <div className="alert alert-danger alert-dismissible mx-4 mt-3 mb-0 py-2" role="alert">
          ❌ {error}
          <button type="button" className="btn-close" onClick={() => setError(null)} />
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        style={{ display: 'none' }}
        onChange={(e) => handleUpload(e.target.files)}
      />

      {/* ── Content area ── */}
      <div
        className="cms-file-manager__content"
        style={{
          minHeight: 'calc(100vh - 160px)',
          border: dragOver ? '2.5px dashed #0d6efd' : '2.5px solid transparent',
          borderRadius: 8,
          background: dragOver ? 'rgba(13,110,253,0.03)' : undefined,
          transition: 'border 0.15s, background 0.15s',
        }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDragOver(false); }}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleUpload(e.dataTransfer.files); }}
      >
        {/* Loading */}
        {loading ? (
          <div className="d-flex flex-column align-items-center justify-content-center" style={{ height: 300 }}>
            <div className="spinner-border text-primary mb-3" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
            <p className="text-muted">Loading files...</p>
          </div>

        /* Empty state */
        ) : sorted.length === 0 ? (
          <div className="d-flex flex-column align-items-center justify-content-center text-muted" style={{ height: 300 }}>
            <span style={{ fontSize: 52 }}>📂</span>
            <p className="mt-3 mb-1 fw-semibold fs-6">This folder is empty</p>
            <p className="small mb-0">Drop files here or click Upload</p>
          </div>

        /* Grid view */
        ) : viewMode === 'grid' ? (
          <div className="cms-file-manager__grid row g-3">
            {sorted.map((file) => (
              <div key={file.path} className="col-6 col-sm-4 col-md-3 col-xl-2">
                <div
                  className={`card h-100 text-center position-relative fm-card ${selected.has(file.path) ? 'border-primary' : 'border'}`}
                  style={{
                    cursor: 'pointer',
                    background: selected.has(file.path) ? '#eff6ff' : '#fff',
                    transition: 'all 0.12s',
                  }}
                  onClick={(e) => file.isDirectory ? navigate(file.path) : toggleSelect(file.path, e)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    setContextMenu({ x: e.clientX, y: e.clientY, file });
                  }}
                >
                  {/* Checkbox */}
                  <div className="position-absolute top-0 start-0 p-2"
                    onClick={(e) => toggleSelect(file.path, e)}>
                    <input
                      type="checkbox"
                      className="form-check-input"
                      checked={selected.has(file.path)}
                      onChange={() => {}}
                    />
                  </div>

                  {/* Rename btn — visible on hover via CSS */}
                  <button
                    type="button"
                    className="btn btn-sm btn-light position-absolute top-0 end-0 m-1 px-1 py-0 fm-rename-btn"
                    style={{ fontSize: 12, lineHeight: '1.8' }}
                    onClick={(e) => { e.stopPropagation(); setRenaming(file); setRenameValue(file.name); }}>
                    ✎
                  </button>

                  <div className="card-body d-flex flex-column align-items-center justify-content-center gap-2 p-3 pt-4">
                    {/* Image thumbnail or emoji icon */}
                    {!file.isDirectory && isImage(file.name) ? (
                      <div
                        style={{ width: 60, height: 60, borderRadius: 8, overflow: 'hidden', border: '1px solid #dee2e6', cursor: 'zoom-in' }}
                        onClick={(e) => { e.stopPropagation(); setPreview(file); }}>
                        <img
                          src={getFileUrl(file)}
                          alt={file.name}
                          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                        />
                      </div>
                    ) : (
                      <span style={{ fontSize: 38 }}>{file.isDirectory ? '📁' : getFileIcon(file.name)}</span>
                    )}

                    <div>
                      <p className="mb-0 small fw-medium text-truncate" style={{ maxWidth: 110 }} title={file.name}>
                        {file.name}
                      </p>
                      {!file.isDirectory && (
                        <p className="mb-0 text-muted" style={{ fontSize: 11 }}>{formatSize(file.size)}</p>
                      )}
                    </div>
                    {!file.isDirectory && (
                      <div className="d-flex gap-1 justify-content-center flex-wrap" onClick={(e) => e.stopPropagation()}>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-0 px-2"
                          onClick={() => handlePreview(file)}
                        >
                          Preview
                        </button>
                        <button
                          type="button"
                          className="btn btn-sm btn-outline-secondary py-0 px-2"
                          onClick={() => handleDownload(file)}
                        >
                          Download
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

        /* List view */
        ) : (
          <div className="cms-table-wrap">
            <div className="table-responsive">
              <table className="dt-enhanced-table mb-0">
                <thead>
                  <tr>
                    <th style={{ width: 44 }}></th>
                    <th>Name</th>
                    <th style={{ width: 100 }} className="text-end">Size</th>
                    <th style={{ width: 150 }} className="text-end">Modified</th>
                    <th style={{ width: 230 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((file) => (
                    <tr
                      key={file.path}
                      className={selected.has(file.path) ? 'table-primary' : ''}
                      style={{ cursor: file.isDirectory ? 'pointer' : 'default' }}
                      onClick={() => file.isDirectory && navigate(file.path)}
                    >
                      <td onClick={(e) => toggleSelect(file.path, e)} style={{ cursor: 'pointer' }}>
                        <input
                          type="checkbox"
                          className="form-check-input"
                          checked={selected.has(file.path)}
                          onChange={() => {}}
                        />
                      </td>
                      <td>
                        <div className="d-flex align-items-center gap-2">
                          <span style={{ fontSize: 18 }}>{file.isDirectory ? '📁' : getFileIcon(file.name)}</span>
                          <span className={`fw-medium ${file.isDirectory ? 'text-primary' : 'text-dark'}`}>
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="text-muted small text-end">{formatSize(file.size)}</td>
                      <td className="text-muted small text-end">{formatDate(file.updatedAt)}</td>
                      <td>
                        <div className="d-flex gap-1 justify-content-end">
                          {!file.isDirectory && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              onClick={(e) => { e.stopPropagation(); handlePreview(file); }}
                              title="Preview">Preview</button>
                          )}
                          {!file.isDirectory && (
                            <button
                              type="button"
                              className="btn btn-sm btn-outline-secondary py-0 px-2"
                              onClick={(e) => { e.stopPropagation(); handleDownload(file); }}
                              title="Download">Download</button>
                          )}
                          <button
                            type="button"
                            className="btn btn-sm btn-outline-secondary py-0 px-2"
                            onClick={(e) => { e.stopPropagation(); setRenaming(file); setRenameValue(file.name); }}
                            title="Rename">✎</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Drag-over hint */}
        {dragOver && (
          <div style={{ position: 'fixed', inset: 0, zIndex: 9000, display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
            <div className="alert alert-primary shadow-lg px-5 py-4 fs-5 fw-semibold mb-0">
              ↑ Drop files to upload
            </div>
          </div>
        )}
      </div>

      {/* Hover CSS for grid cards */}
      <style>{`
        .fm-card:hover { box-shadow: 0 2px 12px rgba(0,0,0,0.1) !important; }
        .fm-rename-btn { opacity: 0; transition: opacity 0.15s; }
        .fm-card:hover .fm-rename-btn { opacity: 1; }
      `}</style>

      {/* ══ PORTAL MODALS ═══════════════════════════════════════ */}

      {/* Create Folder */}
      {creatingFolder && (
        <PortalModal onClose={() => { setCreatingFolder(false); setNewFolderName(''); }}>
          <h5 className="fw-bold mb-1">📁 New Folder</h5>
          <p className="text-muted small mb-3">Enter a name for the new folder.</p>
          <input
            autoFocus
            className="form-control"
            placeholder="e.g. images, documents..."
            value={newFolderName}
            onChange={(e) => setNewFolderName(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleCreateFolder()}
          />
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-secondary btn-sm"
              onClick={() => { setCreatingFolder(false); setNewFolderName(''); }}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleCreateFolder}>
              Create
            </button>
          </div>
        </PortalModal>
      )}

      {/* Rename */}
      {renaming && (
        <PortalModal onClose={() => setRenaming(null)}>
          <h5 className="fw-bold mb-1">✎ Rename</h5>
          <p className="text-muted small mb-3">
            Renaming <strong className="text-dark">{renaming.name}</strong>
          </p>
          <input
            autoFocus
            className="form-control"
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
          />
          <div className="d-flex justify-content-end gap-2 mt-3">
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => setRenaming(null)}>
              Cancel
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleRename}>
              Save
            </button>
          </div>
        </PortalModal>
      )}

      {/* Confirm Delete */}
      {confirmDelete && (
        <PortalModal onClose={() => setConfirmDelete(false)}>
          <div className="text-center">
            <span style={{ fontSize: 44 }}>🗑️</span>
            <h5 className="fw-bold mt-2 mb-1">
              Delete {selected.size} item{selected.size > 1 ? 's' : ''}?
            </h5>
            <p className="text-muted small mb-4">This action cannot be undone.</p>
            <div className="d-flex justify-content-center gap-2">
              <button type="button" className="btn btn-secondary btn-sm px-4"
                onClick={() => setConfirmDelete(false)}>Cancel</button>
              <button type="button" className="btn btn-danger btn-sm px-4"
                onClick={handleDelete}>Delete</button>
            </div>
          </div>
        </PortalModal>
      )}

      {/* Image Preview */}
      {preview && (
        <FilePreviewPortal
          file={preview}
          url={previewUrl}
          onClose={() => setPreview(null)}
          onDownload={() => handleDownload(preview)}
        />
      )}

      {/* Context Menu */}
{contextMenu && createPortal(
  <div
    style={{
      position: 'fixed',
      top: contextMenu.y,
      left: contextMenu.x,
      zIndex: 999999,
      background: '#fff',
      border: '1px solid #dee2e6',
      borderRadius: 8,
      boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
      minWidth: 180,
      overflow: 'hidden',
    }}
    onClick={(e) => e.stopPropagation()}
  >
    <div style={{ padding: '6px 0' }}>
      {/* Select / Deselect */}
      <button
        className="btn btn-sm btn-link text-dark text-decoration-none w-100 text-start px-3 py-2"
        style={{ borderRadius: 0 }}
        onClick={() => {
          const next = new Set(selected);
          next.has(contextMenu.file.path)
            ? next.delete(contextMenu.file.path)
            : next.add(contextMenu.file.path);
          setSelected(next);
          setContextMenu(null);
        }}>
        {selected.has(contextMenu.file.path) ? '☐ Deselect' : '☑ Select'}
      </button>

      {/* Rename */}
      <button
        className="btn btn-sm btn-link text-dark text-decoration-none w-100 text-start px-3 py-2"
        style={{ borderRadius: 0 }}
        onClick={() => {
          setRenaming(contextMenu.file);
          setRenameValue(contextMenu.file.name);
          setContextMenu(null);
        }}>
        ✎ Rename
      </button>

      {/* Preview / Download */}
        {!contextMenu.file.isDirectory && (
          <button
            className="btn btn-sm btn-link text-dark text-decoration-none w-100 text-start px-3 py-2"
            style={{ borderRadius: 0 }}
            onClick={() => { handlePreview(contextMenu.file); setContextMenu(null); }}>
            Preview
          </button>
        )}

        {!contextMenu.file.isDirectory && (
          <button
            className="btn btn-sm btn-link text-dark text-decoration-none w-100 text-start px-3 py-2"
            style={{ borderRadius: 0 }}
            onClick={() => { handleDownload(contextMenu.file); setContextMenu(null); }}>
            Download
          </button>
        )}

        <hr className="my-1" />

        {/* Delete */}
        <button
          className="btn btn-sm btn-link text-danger text-decoration-none w-100 text-start px-3 py-2"
          style={{ borderRadius: 0 }}
          onClick={() => {
            setSelected(new Set([contextMenu.file.path]));
            setConfirmDelete(true);
            setContextMenu(null);
          }}>
          🗑 Delete
        </button>
      </div>
    </div>,
    document.body
  )}
    </CmsModuleShell>
  );
}

FileManagerPage.Layout = AdminLayout;
