export function createPageUrl(
    path: string,
    params?: Record<string, string | number | boolean | null | undefined>
  ): string {
    if (!params || Object.keys(params).length === 0) {
      return `/${path}`;
    }
  
    const queryString = Object.entries(params)
      .filter(([, value]) => value !== undefined && value !== null)
      .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(String(value))}`)
      .join("&");
  
    return `/${path}?${queryString}`;
  }