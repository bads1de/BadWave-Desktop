import { FileMetadata } from "./index";

export interface LocalFile {
  path: string;
  metadata?: FileMetadata;
  error?: string;
  lastModified?: number;
}
