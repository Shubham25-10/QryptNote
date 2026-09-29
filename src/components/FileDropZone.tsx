import React, { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  UploadCloud,
  FolderUp,
  Paperclip,
  Trash2,
  RefreshCw,
  Sparkles,
  Loader2,
  ArrowDownCircle,
  FolderArchive,
  Layers,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { FileTypeIcon } from './FileTypeIcon';

export interface FileEntryItem {
  file: File;
  relativePath: string;
}

export interface AttachedFileState {
  name: string;
  type: string;
  size: number;
  data: string;
  isFolder?: boolean;
  itemCount?: number;
}

export interface FileDropZoneProps {
  file: AttachedFileState | null;
  onFilesSelected: (files: FileEntryItem[], isFolder: boolean, folderName?: string) => void;
  onRemoveFile: () => void;
  isProcessing: boolean;
  processingStatus: string;
  disabled?: boolean;
  formatFileSize: (bytes?: number) => string;
  className?: string;
}

/**
 * FileDropZone provides an interactive drag-and-drop area for uploading
 * any file types (images, videos, zips, folders, documents, etc.) up to 1GB free.
 */
export const FileDropZone: React.FC<FileDropZoneProps> = ({
  file,
  onFilesSelected,
  onRemoveFile,
  isProcessing,
  processingStatus,
  disabled = false,
  formatFileSize,
  className = '',
}) => {
  const { t } = useTranslation();
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const folderInputRef = useRef<HTMLInputElement>(null);

  /**
   * Recursively extract files from dropped items (handles folders dropped from Finder/Explorer)
   */
  const extractDroppedItems = async (
    dataTransfer: DataTransfer
  ): Promise<{ files: FileEntryItem[]; isFolder: boolean; folderName?: string }> => {
    const items = dataTransfer.items;

    // Check if webkitGetAsEntry is supported for directory traversal
    if (items && items.length > 0 && typeof items[0].webkitGetAsEntry === 'function') {
      const entries: any[] = [];
      for (let i = 0; i < items.length; i++) {
        const entry = items[i].webkitGetAsEntry();
        if (entry) entries.push(entry);
      }

      const hasDirectory = entries.some((e) => e.isDirectory);
      if (hasDirectory || entries.length > 1) {
        const collected: FileEntryItem[] = [];
        let detectedFolderName = '';

        const scanEntry = async (entry: any, currentPath: string): Promise<void> => {
          if (entry.isFile) {
            await new Promise<void>((resolve, reject) => {
              entry.file((f: File) => {
                collected.push({
                  file: f,
                  relativePath: currentPath ? `${currentPath}/${f.name}` : f.name,
                });
                resolve();
              }, reject);
            });
          } else if (entry.isDirectory) {
            if (!detectedFolderName) detectedFolderName = entry.name;
            const dirReader = entry.createReader();
            const readBatch = (): Promise<any[]> =>
              new Promise((resolve, reject) => dirReader.readEntries(resolve, reject));

            let batch = await readBatch();
            while (batch.length > 0) {
              for (const child of batch) {
                await scanEntry(child, currentPath ? `${currentPath}/${entry.name}` : entry.name);
              }
              batch = await readBatch();
            }
          }
        };

        for (const entry of entries) {
          await scanEntry(entry, '');
        }

        return {
          files: collected,
          isFolder: true,
          folderName: detectedFolderName || (entries.length > 1 ? 'bundle' : 'folder_archive'),
        };
      } else if (entries.length === 1 && entries[0].isFile) {
        const singleFile = await new Promise<File>((resolve, reject) =>
          entries[0].file(resolve, reject)
        );
        return {
          files: [{ file: singleFile, relativePath: singleFile.name }],
          isFolder: false,
        };
      }
    }

    // Standard fallback for dataTransfer.files
    const fallbackList: FileEntryItem[] = [];
    const files = dataTransfer.files;
    for (let i = 0; i < files.length; i++) {
      const f = files[i];
      fallbackList.push({ file: f, relativePath: (f as any).webkitRelativePath || f.name });
    }

    const isFolder = files.length > 1 || !!(files[0] as any)?.webkitRelativePath;
    const folderName = (files[0] as any)?.webkitRelativePath
      ? (files[0] as any).webkitRelativePath.split('/')[0]
      : 'folder_archive';

    return {
      files: fallbackList,
      isFolder,
      folderName,
    };
  };

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current += 1;
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounter.current = 0;
      setIsDragging(false);

      if (disabled || isProcessing) return;

      try {
        const { files, isFolder, folderName } = await extractDroppedItems(e.dataTransfer);
        if (files.length > 0) {
          onFilesSelected(files, isFolder, folderName);
        }
      } catch (err) {
        console.error('Error handling dropped files:', err);
      }
    },
    [disabled, isProcessing, onFilesSelected]
  );

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;

    const files: FileEntryItem[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      files.push({ file: f, relativePath: f.name });
    }

    onFilesSelected(files, false);
    e.target.value = '';
  };

  const handleFolderInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const list = e.target.files;
    if (!list || list.length === 0) return;

    const files: FileEntryItem[] = [];
    for (let i = 0; i < list.length; i++) {
      const f = list[i];
      files.push({ file: f, relativePath: f.webkitRelativePath || f.name });
    }

    const folderName = list[0].webkitRelativePath
      ? list[0].webkitRelativePath.split('/')[0]
      : 'folder_archive';

    onFilesSelected(files, true, folderName);
    e.target.value = '';
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Hidden inputs */}
      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        onChange={handleFileInputChange}
        disabled={disabled || isProcessing}
      />
      <input
        type="file"
        ref={folderInputRef}
        className="hidden"
        onChange={handleFolderInputChange}
        disabled={disabled || isProcessing}
        {...({ webkitdirectory: '', directory: '', multiple: true } as any)}
      />

      {/* Main Drag-and-Drop Container */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`relative w-full rounded-2xl transition-all duration-300 select-none ${
          isDragging
            ? 'border-2 border-dashed border-violet bg-violet/15 shadow-[0_0_35px_rgba(124,92,255,0.4)] scale-[1.01]'
            : file
            ? 'border border-hairline bg-panel/60'
            : 'border-2 border-dashed border-hairline/80 hover:border-violet/40 bg-ink/40 hover:bg-panel/40'
        } ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}
      >
        {/* Active Dragging Overlay Banner */}
        <AnimatePresence>
          {isDragging && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute inset-0 z-30 flex flex-col items-center justify-center p-6 bg-ink/90 backdrop-blur-md rounded-2xl border-2 border-violet shadow-[0_0_40px_rgba(124,92,255,0.5)] pointer-events-none"
            >
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
                className="w-16 h-16 rounded-2xl bg-violet/20 border border-violet/40 flex items-center justify-center text-violet shadow-[0_0_25px_rgba(124,92,255,0.6)] mb-3"
              >
                <ArrowDownCircle className="w-8 h-8" />
              </motion.div>
              <p className="text-base font-display font-bold text-white tracking-wide">
                {t('create.drop_active', 'Drop to attach & encrypt securely')}
              </p>
              <p className="text-xs font-mono text-violet-300 mt-1">
                {t('create.drop_hint', 'Up to 1GB free • Images, Videos, ZIP, Folders, Audio & Documents')}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Processing State */}
        {isProcessing && (
          <div className="p-6 flex flex-col items-center justify-center gap-3">
            <div className="relative">
              <div className="w-12 h-12 rounded-xl bg-violet/10 border border-violet/30 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-violet animate-spin" />
              </div>
            </div>
            <div className="text-center">
              <p className="text-sm font-medium text-text-primary">
                {processingStatus || t('create.folder_packaging', 'Packaging folder into secure ZIP archive...')}
              </p>
              <p className="text-xs text-text-muted mt-0.5 font-mono">
                Encrypting with client-side AES-GCM
              </p>
            </div>
          </div>
        )}

        {/* Attached File Preview Card */}
        {file && !isProcessing && (
          <div className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5 overflow-hidden w-full sm:w-auto">
              <FileTypeIcon
                fileType={file.type}
                fileName={file.name}
                isFolder={file.isFolder}
                hasFile={true}
                fileSize={null}
                size="lg"
                showBadge={false}
              />
              <div className="overflow-hidden flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p
                    className="font-sans font-medium text-text-primary text-sm truncate max-w-[220px] sm:max-w-[340px]"
                    title={file.name}
                  >
                    {file.name}
                  </p>
                  <FileTypeIcon
                    fileType={file.type}
                    fileName={file.name}
                    isFolder={file.isFolder}
                    hasFile={true}
                    size="sm"
                    showBadge={true}
                    className="[&>div:first-child]:hidden"
                  />
                </div>
                <div className="flex flex-wrap items-center gap-2 text-xs text-text-muted mt-1 font-sans">
                  <span className="font-mono text-text-secondary font-medium">
                    {formatFileSize(file.size)}
                  </span>
                  <span>•</span>
                  <span className="text-teal font-medium">1GB Free</span>
                  {file.isFolder && file.itemCount && (
                    <>
                      <span>•</span>
                      <span className="text-violet font-mono">{file.itemCount} files (ZIP)</span>
                    </>
                  )}
                  <span className="hidden sm:inline-block text-text-muted/60">• Drag another file to replace</span>
                </div>
              </div>
            </div>

            {/* Actions for attached file */}
            <div className="flex items-center gap-2 self-end sm:self-center flex-shrink-0">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-ink border border-hairline hover:border-violet/40 hover:bg-panel text-text-secondary hover:text-white rounded-lg text-xs font-medium transition-all"
                title="Replace file"
              >
                <RefreshCw className="w-3.5 h-3.5 text-violet" />
                <span>{t('create.replace_file', 'Replace')}</span>
              </button>

              <button
                type="button"
                onClick={onRemoveFile}
                disabled={disabled}
                className="cursor-pointer p-1.5 text-text-muted hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                title="Remove attachment"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Empty / Idle Drop Zone Prompt */}
        {!file && !isProcessing && (
          <div className="p-6 sm:p-8 flex flex-col items-center justify-center text-center">
            {/* Center animated graphic */}
            <motion.div
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fileInputRef.current?.click()}
              className="cursor-pointer w-14 h-14 rounded-2xl bg-violet/10 border border-violet/20 hover:border-violet/40 flex items-center justify-center text-violet mb-3.5 shadow-[0_0_20px_rgba(124,92,255,0.15)] group transition-all"
            >
              <UploadCloud className="w-7 h-7 group-hover:scale-110 transition-transform duration-300" />
            </motion.div>

            {/* Primary message */}
            <h4 className="text-sm sm:text-base font-sans font-medium text-text-primary">
              <span className="font-semibold text-white">
                {t('create.drop_title', 'Drag & drop any file or folder here')}
              </span>
            </h4>

            {/* Browse Buttons */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={disabled}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-ink border border-hairline hover:border-violet/40 hover:bg-panel text-text-primary rounded-xl font-sans text-xs font-medium transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <Paperclip className="w-3.5 h-3.5 text-violet" />
                <span>{t('create.browse_files', 'Browse Files')}</span>
              </button>

              <span className="text-xs text-text-muted font-sans">{t('create.drop_or', 'or')}</span>

              <button
                type="button"
                onClick={() => folderInputRef.current?.click()}
                disabled={disabled}
                className="cursor-pointer inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-ink border border-hairline hover:border-teal/40 hover:bg-panel text-text-primary rounded-xl font-sans text-xs font-medium transition-all shadow-sm hover:scale-[1.02] active:scale-[0.98]"
              >
                <FolderUp className="w-3.5 h-3.5 text-teal" />
                <span>{t('create.browse_folder', 'Browse Folder')}</span>
              </button>
            </div>

            {/* Type Pills & 1GB Free Badge */}
            <div className="flex flex-wrap items-center justify-center gap-2 mt-4 pt-3 border-t border-hairline/50 w-full max-w-md">
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-mono bg-violet/10 text-violet border border-violet/20 font-bold">
                <Sparkles className="w-3 h-3 text-amber" />
                1GB Free
              </span>
              <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded bg-white/[0.03] border border-hairline">
                ZIP & Archives
              </span>
              <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded bg-white/[0.03] border border-hairline">
                Images & Video
              </span>
              <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded bg-white/[0.03] border border-hairline">
                Folders
              </span>
              <span className="text-[11px] font-mono text-text-muted px-2 py-0.5 rounded bg-white/[0.03] border border-hairline">
                PDF & Docs
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileDropZone;
