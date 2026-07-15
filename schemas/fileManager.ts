export interface FMFile {
  name: string;
  isDirectory: boolean;
  path: string;
  size?: number;
  updatedAt: string;
}

export interface LaravelFile {
  type: string;
  path: string;
  basename: string;
  dirname: string;
  extension?: string;
  size?: number;
  timestamp?: number;
}

export interface LaravelDirectory {
  type: string;
  path: string;
  basename: string;
  dirname: string;
  timestamp?: number;
}

export interface LaravelContentResponse {
  result: { status: string; message: string | null };
  directories: LaravelDirectory[];
  files: LaravelFile[];
}