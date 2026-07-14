export function parseJson(jsonString: string): any[] | null {
  try {
    const data = JSON.parse(jsonString);
    if (!Array.isArray(data)) return null;
    return data;
  } catch {
    return null;
  }
}
