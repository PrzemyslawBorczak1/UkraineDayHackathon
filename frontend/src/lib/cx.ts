/** Joins truthy class fragments — a tiny local alternative to clsx. */
export function cx(...parts: Array<string | false | null | undefined>): string {
  return parts.filter(Boolean).join(" ");
}
