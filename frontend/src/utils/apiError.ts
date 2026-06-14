import axios from 'axios';

export const getApiErrorMessage = (
  error: unknown,
  fallback: string,
  forbiddenMessage?: string
) => {
  if (axios.isAxiosError(error)) {
    const detail = error.response?.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail)) {
      return detail
        .map((item) =>
          typeof item === 'object' && item && 'msg' in item
            ? String(item.msg)
            : String(item)
        )
        .join('. ');
    }
    if (error.response?.status === 403 && forbiddenMessage) {
      return forbiddenMessage;
    }
  }
  return fallback;
};
