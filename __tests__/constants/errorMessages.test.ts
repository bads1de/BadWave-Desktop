import { ERROR_MESSAGES } from "@/constants/errorMessages";

describe("constants/errorMessages", () => {
  it("should have auth-related messages", () => {
    expect(ERROR_MESSAGES.ADMIN_REQUIRED).toBe("管理者権限が必要です");
    expect(ERROR_MESSAGES.LOGIN_REQUIRED).toBe("ログインが必要です");
    expect(ERROR_MESSAGES.UNAUTHORIZED).toBe("認証されていません");
  });

  it("should have validation messages", () => {
    expect(ERROR_MESSAGES.TITLE_REQUIRED).toBe("タイトルを入力してください");
    expect(ERROR_MESSAGES.PASSWORD_MIN_LENGTH).toBe(
      "パスワードは8文字以上で入力してください",
    );
  });

  it("should have upload messages", () => {
    expect(ERROR_MESSAGES.UPLOAD_FAILED).toBe("ファイルのアップロードに失敗しました");
    expect(ERROR_MESSAGES.SONG_UPLOAD_FAILED).toBe("曲のアップロードに失敗しました");
  });

  it("should have playlist messages", () => {
    expect(ERROR_MESSAGES.PLAYLIST_UPDATE_FAILED).toBe(
      "プレイリスト名の更新に失敗しました",
    );
    expect(ERROR_MESSAGES.PLAYLIST_ALREADY_ADDED).toBe(
      "既にプレイリストに追加されています。",
    );
  });

  it("should have download messages", () => {
    expect(ERROR_MESSAGES.DOWNLOAD_FAILED).toBe("ダウンロードに失敗しました");
    expect(ERROR_MESSAGES.NO_DOWNLOAD_ENVIRONMENT).toBe(
      "ダウンロード機能が利用できません（Electron APIが見つかりません）",
    );
  });

  it("should have offline messages", () => {
    expect(ERROR_MESSAGES.OFFLINE_PLAYLIST_EDIT).toBe(
      "オフライン時はプレイリストの編集操作ができません",
    );
  });

  it("should have local song messages", () => {
    expect(ERROR_MESSAGES.LOCAL_SONG_CANNOT_DELETE).toBe(
      "ローカル曲はプレイリストから削除できません",
    );
  });

  it("should have generic messages", () => {
    expect(ERROR_MESSAGES.GENERIC_ERROR).toBe("エラーが発生しました");
    expect(ERROR_MESSAGES.NOT_IN_ELECTRON).toBe("Not in Electron environment");
  });

  it("all values should be non-empty strings", () => {
    const values = Object.values(ERROR_MESSAGES);
    values.forEach((v) => {
      expect(typeof v).toBe("string");
      expect(v.length).toBeGreaterThan(0);
    });
  });
});
