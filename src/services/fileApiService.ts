import axios from "axios";
import axiosInstance from "./axiosInstance";

export interface UploadUrlRequest {
  ownerType: "PROJECT" | string;
  ownerId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  /** optional, max 1000 chars */
  description?: string;
  /** PROJECT files only; omit = project root */
  folderId?: string | null;
}

interface ApiEnvelope<T> {
  endpoint: string;
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  data: T;
  timeStamp: string;
}

export interface UploadUrlData {
  fileId: string;
  uploadUrl: string;
  method: string;
  expiresAt: string;
}

/** User object returned by the backend; name/email are null if the user was deleted */
export interface UserRef {
  userId: number;
  name: string | null;
  email: string | null;
}

/** Display name for a UserRef (falls back to the id when the user no longer exists) */
export const userLabel = (u?: UserRef | null): string =>
  u ? (u.name || u.email || `User #${u.userId}`) : '—';

export interface FileRecord {
  fileId: string;
  ownerType: string;
  ownerId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedBy: UserRef;
  uploadedAt: string;
  description?: string | null;
  /** null = project root (always null for task / issue files) */
  folderId?: string | null;
  documentId?: string;
  versionNo?: number;
}

export interface DocumentFolder {
  folderId: string;
  projectId: number;
  parentFolderId: string | null;
  name: string;
  description: string | null;
  /** 1 at root, 3 is the deepest allowed */
  depth: number;
  createdBy: UserRef;
  createdAt: string;
  updatedAt: string;
}

export interface BreadcrumbItem { folderId: string; name: string }

export interface ProjectDocuments {
  folderId: string | null;
  breadcrumb: BreadcrumbItem[];
  folders: DocumentFolder[];
  files: FileRecord[];
  taskFiles: FileRecord[] | null;
}

export const MAX_FOLDER_DEPTH = 3;
export const MAX_DESCRIPTION = 1000;

export interface ViewUrlData {
  fileId: string;
  filename: string;
  contentType: string;
  viewUrl: string;
  inline: boolean;
  expiresAt: string;
}

export interface DownloadUrlData {
  fileId: string;
  filename: string;
  contentType: string;
  downloadUrl: string;
  expiresAt: string;
}

export interface CompleteUploadData {
  fileId: string;
  status: string;
}

export const fileApiService = {
  // Step 1: ask backend for a presigned object-store URL
  getUploadUrl: async (body: UploadUrlRequest): Promise<UploadUrlData> => {
    const res = await axiosInstance.post<ApiEnvelope<UploadUrlData>>(
      "/file/upload-url",
      body,
    );
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  // Step 2: PUT the file straight to the object store.
  // Plain axios on purpose: no baseURL, no Authorization header (presigned URL
  // carries its own signature) and Content-Type must match what was signed.
  uploadToStorage: async (
    uploadUrl: string,
    method: string,
    file: File,
    contentType: string,
    onProgress?: (percent: number) => void,
  ): Promise<void> => {
    await axios.request({
      url: uploadUrl,
      method: (method || "PUT").toUpperCase(),
      data: file,
      headers: { "Content-Type": contentType },
      timeout: 0,
      onUploadProgress: (e) => {
        if (onProgress && e.total) onProgress(Math.round((e.loaded / e.total) * 100));
      },
    });
  },

  // Step 3: tell backend the upload finished
  completeUpload: async (fileId: string): Promise<CompleteUploadData> => {
    const res = await axiosInstance.post<ApiEnvelope<CompleteUploadData>>(
      `/file/${fileId}/complete`,
    );
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  // GET /file/project/{id}, GET /file/task/{id}
  listByOwner: async (ownerType: string, ownerId: number): Promise<FileRecord[]> => {
    const res = await axiosInstance.get<ApiEnvelope<FileRecord[]>>(
      `/file/${ownerType.toLowerCase()}/${ownerId}`,
    );
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data ?? [];
  },

  // GET /file/project/{id}?folderId=&includeTaskFiles=  -> contents of ONE folder
  listProject: async (
    projectId: number | string,
    opts: { folderId?: string | null; includeTaskFiles?: boolean } = {},
  ): Promise<ProjectDocuments> => {
    const res = await axiosInstance.get<ApiEnvelope<ProjectDocuments>>(`/file/project/${projectId}`, {
      params: {
        ...(opts.folderId ? { folderId: opts.folderId } : {}),
        ...(opts.includeTaskFiles ? { includeTaskFiles: true } : {}),
      },
    });
    if (!res.data.success) throw new Error(res.data.message);
    const d = res.data.data;
    return { folderId: d?.folderId ?? null, breadcrumb: d?.breadcrumb ?? [], folders: d?.folders ?? [], files: d?.files ?? [], taskFiles: d?.taskFiles ?? null };
  },

  // PATCH /file/{id}: partial. description "" clears, undefined keeps. folderId moves, moveToRoot moves to root.
  updateFile: async (
    fileId: string,
    body: { description?: string; folderId?: string; moveToRoot?: boolean },
  ): Promise<FileRecord> => {
    const res = await axiosInstance.patch<ApiEnvelope<FileRecord>>(`/file/${fileId}`, body);
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  // Presigned URL to view a file inline (GET assumed)
  getViewUrl: async (fileId: string): Promise<ViewUrlData> => {
    const res = await axiosInstance.get<ApiEnvelope<ViewUrlData>>(
      `/file/${fileId}/view-url`,
    );
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  // Presigned URL that downloads the file (GET assumed)
  getDownloadUrl: async (fileId: string): Promise<DownloadUrlData> => {
    const res = await axiosInstance.get<ApiEnvelope<DownloadUrlData>>(
      `/file/${fileId}/download-url`,
    );
    if (!res.data.success) throw new Error(res.data.message);
    return res.data.data;
  },

  deleteFile: async (fileId: string): Promise<void> => {
    const res = await axiosInstance.delete<ApiEnvelope<unknown>>(`/file/${fileId}`);
    if (res.data && res.data.success === false) throw new Error(res.data.message);
  },

  // Runs all 3 steps in order
  uploadFile: async (
    ownerType: UploadUrlRequest["ownerType"],
    ownerId: number,
    file: File,
    onProgress?: (percent: number) => void,
    extra: { description?: string; folderId?: string | null } = {},
  ): Promise<CompleteUploadData> => {
    const contentType = file.type || "application/octet-stream";
    const description = extra.description?.trim();
    const { fileId, uploadUrl, method } = await fileApiService.getUploadUrl({
      ownerType,
      ownerId,
      filename: file.name,
      contentType,
      fileSize: file.size,
      ...(description ? { description } : {}),
      ...(extra.folderId ? { folderId: extra.folderId } : {}),
    });
    await fileApiService.uploadToStorage(uploadUrl, method, file, contentType, onProgress);
    return fileApiService.completeUpload(fileId);
  },
};

/* ───────── project document folders ───────── */

const folderUrl = (projectId: number | string) => `/file/project/${projectId}/folders`;

export const folderApiService = {
  create: async (projectId: number | string, body: { name: string; description?: string; parentFolderId?: string | null }): Promise<DocumentFolder> => {
    const res = await axiosInstance.post<ApiEnvelope<DocumentFolder>>(folderUrl(projectId), body);
    return res.data.data;
  },
  // name / description are partial; description "" clears it
  update: async (projectId: number | string, folderId: string, body: { name?: string; description?: string }): Promise<DocumentFolder> => {
    const res = await axiosInstance.patch<ApiEnvelope<DocumentFolder>>(`${folderUrl(projectId)}/${folderId}`, body);
    return res.data.data;
  },
  move: async (projectId: number | string, folderId: string, parentFolderId: string | null): Promise<DocumentFolder> => {
    const res = await axiosInstance.patch<ApiEnvelope<DocumentFolder>>(`${folderUrl(projectId)}/${folderId}/move`, { parentFolderId });
    return res.data.data;
  },
  // force=false only deletes an empty folder (409 otherwise); force=true moves the contents up to the parent
  remove: async (projectId: number | string, folderId: string, force = false): Promise<void> => {
    await axiosInstance.delete(`${folderUrl(projectId)}/${folderId}`, { params: { force } });
  },
};

/* ───────── task-comment-attachment-controller ───────── */

export interface TaskCommentAttachment {
  fileId: string;
  commentId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedBy: number;
  uploadedAt: string;
}

type AttUrl = (commentId: number | string) => string;

const createCommentAttachmentApi = (attUrl: AttUrl) => ({
  list: async (commentId: number): Promise<TaskCommentAttachment[]> => {
    const res = await axiosInstance.get<ApiEnvelope<TaskCommentAttachment[]>>(attUrl(commentId));
    return res.data.data ?? [];
  },

  // same 3 steps as fileApiService.uploadFile: presigned URL -> PUT to object store -> complete
  upload: async (commentId: number, file: File, onProgress?: (percent: number) => void): Promise<void> => {
    const contentType = file.type || "application/octet-stream";
    const res = await axiosInstance.post<ApiEnvelope<UploadUrlData>>(`${attUrl(commentId)}/upload-url`, {
      filename: file.name,
      contentType,
      fileSize: file.size,
    });
    if (!res.data.success) throw new Error(res.data.message);
    const { fileId, uploadUrl, method } = res.data.data;
    await fileApiService.uploadToStorage(uploadUrl, method, file, contentType, onProgress);
    const done = await axiosInstance.post<ApiEnvelope<CompleteUploadData>>(`${attUrl(commentId)}/${fileId}/complete`);
    if (!done.data.success) throw new Error(done.data.message);
  },

  viewUrl: async (commentId: number, fileId: string): Promise<ViewUrlData> => {
    const res = await axiosInstance.get<ApiEnvelope<ViewUrlData>>(`${attUrl(commentId)}/${fileId}/view-url`);
    return res.data.data;
  },

  downloadUrl: async (commentId: number, fileId: string): Promise<DownloadUrlData> => {
    const res = await axiosInstance.get<ApiEnvelope<DownloadUrlData>>(`${attUrl(commentId)}/${fileId}/download-url`);
    return res.data.data;
  },

  remove: async (commentId: number, fileId: string): Promise<void> => {
    const res = await axiosInstance.delete<ApiEnvelope<unknown>>(`${attUrl(commentId)}/${fileId}`);
    if (res.data && res.data.success === false) throw new Error(res.data.message);
  },
});

// task comments: /task/comment/{id}/attachments
export const commentAttachmentApi = createCommentAttachmentApi((id) => `/task/comment/${id}/attachments`);

// issue comments: /task/issue/comment/{id}/attachments  (task-issue-comment-attachment-controller)
export const issueCommentAttachmentApi = createCommentAttachmentApi((id) => `/task/issue/comment/${id}/attachments`);

export type CommentAttachmentApi = typeof commentAttachmentApi;
