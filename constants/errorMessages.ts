/**
 * 汎用エラーメッセージ定数
 * アプリケーション全体で使用するエラーメッセージを一元管理
 */

export const ERROR_MESSAGES = {
  // 認証・権限
  ADMIN_REQUIRED: "管理者権限が必要です",
  USER_ID_REQUIRED: "ユーザーIDが必要です",
  LOGIN_REQUIRED: "ログインが必要です",
  UNAUTHORIZED: "認証されていません",

  // 入力バリデーション
  TITLE_REQUIRED: "タイトルを入力してください",
  GENRE_REQUIRED: "ジャンルを入力してください",
  PASSWORD_MIN_LENGTH: "パスワードは8文字以上で入力してください",
  PASSWORD_MISMATCH: "パスワードが一致しません",
  REQUIRED_FIELDS: "必須フィールドが未入力です",
  LYRICS_REQUIRED: "歌詞を入力してください",
  AUDIO_FILE_REQUIRED: "音声ファイルを選択してください",
  VIDEO_FILE_REQUIRED: "動画ファイルを選択してください",
  SONG_FILE_NOT_FOUND: "音声ファイルが見つかりません",
  UNSUPPORTED_FILE_FORMAT: "サポートされていないファイル形式です",
  NO_SONGS: "曲がありません",

  // アップロード
  UPLOAD_FAILED: "ファイルのアップロードに失敗しました",
  AUDIO_UPLOAD_FAILED: "音声のアップロードに失敗しました",
  VIDEO_UPLOAD_FAILED: "動画のアップロードに失敗しました",
  IMAGE_UPLOAD_FAILED: "画像のアップロードに失敗しました",
  SONG_UPLOAD_FAILED: "曲のアップロードに失敗しました",

  // 操作エラー
  DELETE_FAILED: "削除に失敗しました",
  EDIT_FAILED: "編集に失敗しました",
  UPDATE_FAILED: "更新に失敗しました",
  UPDATE_PROFILE_FAILED: "プロフィールの更新に失敗しました",
  UPDATE_AVATAR_FAILED: "アバターの更新に失敗しました",
  UPDATE_PASSWORD_FAILED: "パスワードの更新に失敗しました",
  LOGOUT_FAILED: "ログアウトに失敗しました",
  SYNC_FAILED: "同期に失敗しました",
  HOME_SYNC_FAILED: "ホーム同期に失敗しました",
  POST_FAILED: "投稿に失敗しました",
  SONG_ID_REQUIRED: "曲のIDが必要です",
  USER_ID_AND_IMAGE_REQUIRED: "ユーザーIDと画像が必要です",

  // プレイリスト
  PLAYLIST_UPDATE_FAILED: "プレイリスト名の更新に失敗しました",
  PLAYLIST_VISIBILITY_UPDATE_FAILED: "プレイリストの公開設定の更新に失敗しました",
  PLAYLIST_DELETE_FAILED: "プレイリストの削除に失敗しました",
  PLAYLIST_DELETE_SONG_FAILED: "プレイリストから曲の削除に失敗しました",
  PLAYLIST_ADD_SONG_FAILED: "プレイリストへの曲の追加に失敗しました",
  PLAYLIST_ALREADY_ADDED: "既にプレイリストに追加されています。",

  // ダウンロード
  DOWNLOAD_FAILED: "ダウンロードに失敗しました",
  DOWNLOAD_DELETE_FAILED: "ダウンロードデータの削除に失敗しました",
  NO_DOWNLOAD_ENVIRONMENT: "ダウンロード機能が利用できません（Electron APIが見つかりません）",

  // 汎用エラー
  GENERIC_ERROR: "エラーが発生しました",
  GENERIC_ERROR_RETRY: "エラーが発生しました。もう一度お試しください。",
  COPY_LYRICS_FAILED: "Failed to copy lyrics.",

  // オフライン
  OFFLINE_PLAYLIST_EDIT: "オフライン時はプレイリストの編集操作ができません",
  OFFLINE_LIKE: "オフライン時はいいね操作ができません",

  // ローカル曲
  LOCAL_SONG_CANNOT_DELETE: "ローカル曲はプレイリストから削除できません",
  LOCAL_SONG_CANNOT_ADD: "ローカル曲はプレイリストに追加できません",
  LOCAL_SONG_CANNOT_LIKE: "ローカル曲にはいいねできません",

  // Electron
  NOT_IN_ELECTRON: "Not in Electron environment",
} as const;

export type ErrorMessageKey = keyof typeof ERROR_MESSAGES;
