declare module '@ray-solutions/react-file-manager/dist/react-file-manager.es.js' {
  import { FC, ReactNode } from 'react';

  export interface FileItem {
    name: string;
    isDirectory: boolean;
    path: string;
    size?: number;
    updatedAt?: string;
  }

  export interface Permission {
    path: string;
    applyTo?: 'file' | 'folder' | 'both';
    read?: boolean;
    create?: boolean;
    delete?: boolean;
    rename?: boolean;
    upload?: boolean;
    download?: boolean;
    copy?: boolean;
    move?: boolean;
  }

  export interface FileManagerProps {
    files: FileItem[];
    initialPath?: string;
    filePreviewPath?: string;        // ✅ add this
    onFolderChange?: (path: unknown) => void;
    onCreateFolder?: (folderName: string, parentPath: unknown) => void;
    onFileUpload?: (files: File[], path: string) => void;
    onDelete?: (items: FileItem[]) => void;
    onRename?: (file: FileItem, newName: string) => void;
    permissions?: Permission[];
    filePreviewComponent?: (file: FileItem) => ReactNode;
  }

  export const FileManager: FC<FileManagerProps>;
}

declare module '@ray-solutions/react-file-manager/dist/react-file-manager.css' {
  const content: string;
  export default content;
}