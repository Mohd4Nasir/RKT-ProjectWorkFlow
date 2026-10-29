import axios from "axios";
import axiosInstance from "./axiosInstance";

export interface UploadUrlRequest {
  ownerType: "PROJECT" | string;
  ownerId: number;
  filename: string;
  contentType: string;
  fileSize: number;
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

export interface FileRecord {
  fileId: string;
  ownerType: string;
  ownerId: number;
  filename: string;
  contentType: string;
  fileSize: number;
  uploadedBy: number;
  uploadedAt: string;
}

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
  ): Promise<CompleteUploadData> => {
    const contentType = file.type || "application/octet-stream";
    const { fileId, uploadUrl, method } = await fileApiService.getUploadUrl({
      ownerType,
      ownerId,
      filename: file.name,
      contentType,
      fileSize: file.size,
    });
    await fileApiService.uploadToStorage(uploadUrl, method, file, contentType, onProgress);
    return fileApiService.completeUpload(fileId);
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

const attUrl = (commentId: number | string) => `/task/comment/${commentId}/attachments`;

export const commentAttachmentApi = {
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
};
