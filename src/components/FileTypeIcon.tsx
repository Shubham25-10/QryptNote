import React from 'react';
import {
  FileArchive,
  Image as ImageIcon,
  FileVideo,
  FileAudio,
  FileText,
  FileCode,
  FolderArchive,
  File as GenericFileIcon,
  MessageSquareText,
  FileSpreadsheet,
} from 'lucide-react';

export type FileCategory =
  | 'zip'
  | 'img'
  | 'vid'
  | 'folder'
  | 'audio'
  | 'pdf'
  | 'doc'
  | 'code'
  | 'file'
  | 'text';

export interface FileTypeInfo {
  category: FileCategory;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
  bgClass: string;
  borderClass: string;
  glowClass: string;
}

/**
 * Determines file category and styling based on MIME type, filename extension, or folder flag.
 */
export function getFileTypeInfo(
  fileType?: string | null,
  fileName?: string | null,
  isFolder?: boolean,
  hasFile?: boolean
): FileTypeInfo {
  // If explicitly not a file attachment (or no file metadata provided), treat as text secret
  if (hasFile === false || (!fileType && !fileName && !isFolder && hasFile !== true)) {
    return {
      category: 'text',
      label: 'NOTE',
      icon: MessageSquareText,
      colorClass: 'text-violet-400',
      bgClass: 'bg-violet-500/10',
      borderClass: 'border-violet-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(124,92,255,0.2)]',
    };
  }

  if (isFolder) {
    return {
      category: 'folder',
      label: 'FOLDER',
      icon: FolderArchive,
      colorClass: 'text-teal-400',
      bgClass: 'bg-teal-500/10',
      borderClass: 'border-teal-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(45,212,191,0.2)]',
    };
  }

  const type = (fileType || '').toLowerCase();
  const name = (fileName || '').toLowerCase();
  const ext = name.split('.').pop() || '';

  // ZIP / Archives
  if (
    type.includes('zip') ||
    type.includes('tar') ||
    type.includes('rar') ||
    type.includes('compressed') ||
    type.includes('7z') ||
    type.includes('gzip') ||
    ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz', 'iso', 'dmg'].includes(ext)
  ) {
    return {
      category: 'zip',
      label: 'ZIP',
      icon: FileArchive,
      colorClass: 'text-amber-400',
      bgClass: 'bg-amber-500/10',
      borderClass: 'border-amber-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(251,191,36,0.2)]',
    };
  }

  // Images
  if (
    type.startsWith('image/') ||
    ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg', 'bmp', 'ico', 'tiff', 'raw', 'avif'].includes(ext)
  ) {
    return {
      category: 'img',
      label: 'IMG',
      icon: ImageIcon,
      colorClass: 'text-emerald-400',
      bgClass: 'bg-emerald-500/10',
      borderClass: 'border-emerald-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(52,211,153,0.2)]',
    };
  }

  // Videos
  if (
    type.startsWith('video/') ||
    ['mp4', 'mov', 'mkv', 'webm', 'avi', 'flv', 'wmv', 'm4v', '3gp'].includes(ext)
  ) {
    return {
      category: 'vid',
      label: 'VID',
      icon: FileVideo,
      colorClass: 'text-rose-400',
      bgClass: 'bg-rose-500/10',
      borderClass: 'border-rose-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(251,113,133,0.2)]',
    };
  }

  // Audio
  if (
    type.startsWith('audio/') ||
    ['mp3', 'wav', 'ogg', 'flac', 'aac', 'm4a', 'wma'].includes(ext)
  ) {
    return {
      category: 'audio',
      label: 'AUD',
      icon: FileAudio,
      colorClass: 'text-sky-400',
      bgClass: 'bg-sky-500/10',
      borderClass: 'border-sky-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(56,189,248,0.2)]',
    };
  }

  // Documents / PDF
  if (type === 'application/pdf' || ext === 'pdf') {
    return {
      category: 'pdf',
      label: 'PDF',
      icon: FileText,
      colorClass: 'text-red-400',
      bgClass: 'bg-red-500/10',
      borderClass: 'border-red-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(248,113,113,0.2)]',
    };
  }

  if (['xlsx', 'xls', 'csv'].includes(ext) || type.includes('spreadsheet') || type.includes('csv')) {
    return {
      category: 'doc',
      label: 'SHEET',
      icon: FileSpreadsheet,
      colorClass: 'text-green-400',
      bgClass: 'bg-green-500/10',
      borderClass: 'border-green-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(74,222,128,0.2)]',
    };
  }

  if (
    ['doc', 'docx', 'txt', 'rtf', 'odt', 'md'].includes(ext) ||
    type.startsWith('text/') ||
    type.includes('document')
  ) {
    return {
      category: 'doc',
      label: 'DOC',
      icon: FileText,
      colorClass: 'text-indigo-400',
      bgClass: 'bg-indigo-500/10',
      borderClass: 'border-indigo-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(129,140,248,0.2)]',
    };
  }

  // Code
  if (
    ['ts', 'tsx', 'js', 'jsx', 'html', 'css', 'json', 'py', 'rs', 'go', 'java', 'cpp', 'c', 'sh', 'sql', 'yaml', 'yml'].includes(ext) ||
    type.includes('javascript') ||
    type.includes('json') ||
    type.includes('html') ||
    type.includes('code')
  ) {
    return {
      category: 'code',
      label: 'CODE',
      icon: FileCode,
      colorClass: 'text-fuchsia-400',
      bgClass: 'bg-fuchsia-500/10',
      borderClass: 'border-fuchsia-500/30',
      glowClass: 'shadow-[0_0_12px_rgba(232,121,249,0.2)]',
    };
  }

  // Generic File fallback
  return {
    category: 'file',
    label: ext ? ext.substring(0, 4).toUpperCase() : 'FILE',
    icon: GenericFileIcon,
    colorClass: 'text-slate-300',
    bgClass: 'bg-slate-500/10',
    borderClass: 'border-slate-500/30',
    glowClass: 'shadow-[0_0_12px_rgba(148,163,184,0.15)]',
  };
}

export interface FileTypeIconProps {
  fileType?: string | null;
  fileName?: string | null;
  isFolder?: boolean;
  hasFile?: boolean;
  fileSize?: number | null;
  size?: 'sm' | 'md' | 'lg';
  showBadge?: boolean;
  showName?: boolean;
  className?: string;
}

/**
 * FileTypeIcon helper component that displays visual icons and badges based on the uploaded file type
 * (e.g. zip, img, vid, folder, pdf, audio, code, or text note).
 */
export const FileTypeIcon: React.FC<FileTypeIconProps> = ({
  fileType,
  fileName,
  isFolder,
  hasFile,
  fileSize,
  size = 'md',
  showBadge = true,
  showName = false,
  className = '',
}) => {
  const info = getFileTypeInfo(fileType, fileName, isFolder, hasFile);
  const IconComponent = info.icon;

  const sizeClasses = {
    sm: {
      box: 'w-7 h-7 rounded-lg',
      icon: 'w-3.5 h-3.5',
      badge: 'text-[10px] px-1.5 py-0.5',
    },
    md: {
      box: 'w-8 h-8 rounded-lg',
      icon: 'w-4 h-4',
      badge: 'text-[11px] px-2 py-0.5',
    },
    lg: {
      box: 'w-10 h-10 rounded-xl',
      icon: 'w-5 h-5',
      badge: 'text-xs px-2.5 py-1',
    },
  }[size];

  const formatSize = (bytes?: number | null) => {
    if (!bytes) return null;
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    if (bytes < 1024 * 1024 * 1024) return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
    return (bytes / (1024 * 1024 * 1024)).toFixed(2) + ' GB';
  };

  const formattedSize = formatSize(fileSize);

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* Icon Badge container */}
      <div
        className={`flex items-center justify-center border transition-transform duration-200 group-hover:scale-105 ${sizeClasses.box} ${info.bgClass} ${info.borderClass} ${info.colorClass} ${info.glowClass}`}
        title={fileName ? `${fileName} (${info.label})` : info.label}
      >
        <IconComponent className={sizeClasses.icon} />
      </div>

      {/* Optional Badge & Name */}
      {(showBadge || showName) && (
        <div className="flex flex-col text-left overflow-hidden">
          <div className="flex items-center gap-1.5">
            {showBadge && (
              <span
                className={`font-mono font-bold tracking-wider rounded border ${sizeClasses.badge} ${info.bgClass} ${info.borderClass} ${info.colorClass}`}
              >
                {info.label}
              </span>
            )}
            {formattedSize && (
              <span className="text-[11px] font-mono text-text-muted">
                {formattedSize}
              </span>
            )}
          </div>
          {showName && fileName && (
            <span
              className="text-xs font-sans text-text-secondary truncate max-w-[140px] sm:max-w-[200px] mt-0.5"
              title={fileName}
            >
              {fileName}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default FileTypeIcon;
