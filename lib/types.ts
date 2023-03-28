export type ApiResult<T> = { value: T } | { error: string };
export function isError<T>(result: ApiResult<T>): result is { error: string } {
  return "error" in result;
}
