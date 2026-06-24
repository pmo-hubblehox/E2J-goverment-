import api from './api';

const BACKEND_ORIGIN = 'http://localhost:8081';

/**
 * Convert a stored relative doc URL (/api/files/...) to a full absolute URL
 * that the browser can open directly without React Router intercepting it.
 */
export function toAbsoluteDocUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return BACKEND_ORIGIN + url;
}

/**
 * Upload a file to: uploads/{userType}/{entityName}/{docType}/{originalFilename}
 * Served at:        /api/files/{userType}/{entityName}/{docType}/{originalFilename}
 *
 * @returns { url, name } where url is the served path and name is the original filename
 */
export async function uploadFile(
  file: File,
  userType: string,
  entityName: string,
  docType: string,
): Promise<{ url: string; name: string }> {
  const fd = new FormData();
  fd.append('file', file);
  fd.append('userType', userType);
  fd.append('entityName', entityName || 'unknown');
  fd.append('docType', docType);
  const res = await api.post('/upload', fd, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return { url: res.data.data.url, name: res.data.data.name };
}
