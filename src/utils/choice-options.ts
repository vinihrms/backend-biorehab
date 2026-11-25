export function parseVariableOptions(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed
          .map((item) => String(item).trim())
          .filter((item) => item.length > 0);
      }
    } catch {
      // Fallback para formato legado separado por vírgula
    }
  }

  return trimmed
    .split(',')
    .map((item) => item.trim())
    .filter((item) => item.length > 0);
}

export function serializeVariableOptions(
  input: string | string[] | null | undefined
): string | null {
  if (input === null || input === undefined) return null;

  const list = Array.isArray(input)
    ? input.map((item) => item.trim()).filter((item) => item.length > 0)
    : parseVariableOptions(input);

  const unique = Array.from(new Set(list));
  if (unique.length === 0) return null;

  return JSON.stringify(unique);
}

export function parseMultiChoiceAnswer(raw: string | null | undefined): string[] {
  if (!raw) return [];
  const trimmed = raw.trim();
  if (!trimmed) return [];

  if (trimmed.startsWith('[')) {
    try {
      const parsed = JSON.parse(trimmed);
      if (Array.isArray(parsed)) {
        return parsed.map((item) => String(item).trim()).filter(Boolean);
      }
    } catch {
      // fallback
    }
  }

  return [trimmed];
}

export function serializeMultiChoiceAnswer(values: string[]): string {
  const unique = Array.from(new Set(values.map((v) => v.trim()).filter(Boolean)));
  return JSON.stringify(unique);
}
