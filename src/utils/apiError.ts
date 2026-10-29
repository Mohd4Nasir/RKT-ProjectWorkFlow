import axios from 'axios';

type ApiErrorBody = {
  message?: unknown;
  error?: unknown;
  detail?: unknown;
};

function messageText(value: unknown): string | undefined {
  if (typeof value === 'string' && value.trim()) return value.trim();
  if (Array.isArray(value)) {
    const messages = value.map(messageText).filter(Boolean);
    if (messages.length) return messages.join(' ');
  }
  return undefined;
}

export function getApiErrorMessage(error: unknown, fallback: string): string {
  if (axios.isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | string | undefined;
    const serverMessage = typeof body === 'string'
      ? messageText(body)
      : messageText(body?.message) ?? messageText(body?.error) ?? messageText(body?.detail);

    if (serverMessage) return serverMessage;
  }

  return error instanceof Error && error.message ? error.message : fallback;
}

export function isUnauthorizedApiError(error: unknown): boolean {
  return axios.isAxiosError(error) && error.response?.status === 401;
}
