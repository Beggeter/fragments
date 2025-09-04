const BASE_URL = "";

interface FetchOptions extends Omit<RequestInit, "headers"> {
  headers?: Record<string, string>;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers || {}),
  };

  const res = await fetch(`${BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "API request failed");
  }
  return res.json();
}
