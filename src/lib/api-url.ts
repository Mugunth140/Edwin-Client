const DEFAULT_API_URL = 'http://localhost:3001/api/v1';

export function getApiBaseUrl() {
  return (process.env.API_URL || DEFAULT_API_URL).replace(/\/$/, '');
}
