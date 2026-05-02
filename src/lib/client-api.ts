export class ClientApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ClientApiError';
    this.status = status;
  }
}

export async function clientApiFetch<T>(path: string, options: RequestInit = {}): Promise<T> {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const response = await fetch(`/api/backend${normalizedPath}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      ...options.headers,
    },
    credentials: 'same-origin',
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ClientApiError(
      payload?.message || payload?.error || `Request failed with status ${response.status}`,
      response.status,
    );
  }

  return payload as T;
}
