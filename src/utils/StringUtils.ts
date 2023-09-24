import { PostStatusType } from "data/types";

export function upperCaseFirstLetterEachWord(param: string): string {
  if (!param) return param;

  const parts: string[] = param.split(" ");
  for (let i = 0; i < parts.length; i++) {
    if (parts[i].length === 1) {
      parts[i] = parts[i].toUpperCase();
    } else {
      parts[i] =
        parts[i].charAt(0).toUpperCase() + parts[i].slice(1).toLowerCase();
    }
  }

  return parts.join(" ");
}

export function formatPostStatus(status: PostStatusType): string {
  if (!status) return "";
  const parts = status.split("_");
  for (let i = 0; i < parts.length; i++) {
    parts[i] = upperCaseFirstLetterEachWord(parts[i]);
  }

  return parts.join(" ");
}
