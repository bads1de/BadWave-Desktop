import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const getRandomColor = () => {
  const colors = [
    "#00ff87",
    "#60efff",
    "#0061ff",
    "#ff00a0",
    "#ff1700",
    "#fff700",
    "#a6ff00",
    "#00ffa3",
    "#00ffff",
    "#ff00ff",
  ];
  return colors[Math.floor(Math.random() * colors.length)];
};

export const splitTags = (tagString?: string): string[] => {
  return (
    tagString
      ?.split(/\s*,\s*/)
      .map((tag) => tag.trim())
      .filter(Boolean) || []
  );
};

/** 英数字・-_以外を含むタイトルはランダム文字列に置き換える */
export const sanitizeTitle = (title: string) => {
  const regex = /^[a-zA-Z0-9-_]+$/;

  if (!regex.test(title)) {
    return generateRandomString(10);
  }

  return title;
};

/** 指定長のランダム文字列を生成する */
export const generateRandomString = (length: number): string => {
  const characters =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_";

  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }

  return result;
};

/** 秒数を「分:秒」形式にフォーマットする (例: "3:25") */
export const formatTime = (seconds: number) => {
  // 不正値（NaN・Infinity・負値）は 0:00 として扱う
  if (!Number.isFinite(seconds) || seconds < 0) {
    return "0:00";
  }

  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
};

/**
 * ルートパラメータを安全にデコードする。
 *
 * Next.js はルートパラメータをデコード済みで渡すことがあり、
 * その状態で decodeURIComponent を再度呼ぶと "100%" のような
 * 不正なエスケープシーケンスで URIError になりページが落ちる。
 * デコードできない場合は元の値をそのまま使う。
 */
export const safeDecodeURIComponent = (value: string): string => {
  try {
    return decodeURIComponent(value);
  } catch {
    return value;
  }
};

/** URLからファイルをダウンロードする */
export const downloadFile = async (url: string, filename: string) => {
  try {
    const response = await fetch(url, {
      mode: "cors",
    });

    if (!response.ok) {
      throw new Error("Network response was not ok");
    }

    const blob = await response.blob();
    const blobURL = window.URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = blobURL;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobURL);
  } catch (error) {
    console.error("ダウンロードに失敗しました:", error);
  }
};
