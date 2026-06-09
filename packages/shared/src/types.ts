export type UploadStatus = "idle" | "uploading" | "saving_meta" | "done" | "failed";

export type ViewMode = "grid" | "list";

export interface BlobFile {
  /** Sui object id of the FileRecord. */
  objectId: string;
  /** Walrus blob id. */
  blobId: string;
  name: string;
  mimeType: string;
  size: number;
  folderId: string | null;
  tags: string[];
  owner: string;
  /** Unix milliseconds from on-chain Clock. */
  uploadedAtMs: number;
  /** Walrus expiry epoch number (not a timestamp). */
  expiryEpoch: number;
  isPublic: boolean;
  /** Soft-delete flag — trashed files are filtered out of the main view. */
  isDeleted?: boolean;
  /** 1-based version number (bumped by create_version). */
  version?: number;
  /** Local UI state only — never persisted on chain. */
  status: UploadStatus;
}

export interface SuiFolder {
  objectId: string;
  name: string;
  parentId: string | null;
  createdAtMs: number;
}
