/**
 * IPC チャンネル名の一元管理。
 *
 * preload (許可リスト) / ipcMain.handle (登録) / renderer (invoke・on・send) の
 * すべてがこのファイルを参照することで、チャンネル名の重複・誤字を防ぐ。
 * 値は変更しないこと（既存の preload 検証と互換性を保つ）。
 */
export const CHANNELS = {
  // Window
  WINDOW_MINIMIZE: "window-minimize",
  WINDOW_MAXIMIZE: "window-maximize",
  WINDOW_CLOSE: "window-close",

  // Store
  GET_STORE_VALUE: "get-store-value",
  SET_STORE_VALUE: "set-store-value",

  // File
  SELECT_DIRECTORY: "handle-select-directory",
  SCAN_MP3_FILES: "handle-scan-mp3-files",
  GET_MP3_METADATA: "handle-get-mp3-metadata",
  GET_SAVED_MUSIC_LIBRARY: "handle-get-saved-music-library",
  CHECK_FILE_EXISTS: "check-file-exists",
  CHECK_LOCAL_FILE_EXISTS: "check-local-file-exists",
  GET_LOCAL_FILE_PATH: "get-local-file-path",
  GET_CACHED_FILES_WITH_METADATA: "handle-get-cached-files-with-metadata",

  // Offline
  DOWNLOAD_SONG: "download-song",
  DELETE_SONG: "delete-song",
  GET_OFFLINE_SONGS: "get-offline-songs",
  DELETE_OFFLINE_SONG: "delete-offline-song",
  CHECK_OFFLINE_STATUS: "check-offline-status",
  TOGGLE_OFFLINE_SIMULATION: "toggle-offline-simulation",
  GET_OFFLINE_SIMULATION_STATUS: "get-offline-simulation-status",
  SET_OFFLINE_SIMULATION: "set-offline-simulation",

  // Cache
  SYNC_SONGS_METADATA: "sync-songs-metadata",
  SYNC_PLAYLISTS: "sync-playlists",
  SYNC_PLAYLIST_SONGS: "sync-playlist-songs",
  SYNC_LIKED_SONGS: "sync-liked-songs",
  SYNC_SPOTLIGHTS_METADATA: "sync-spotlights-metadata",
  SYNC_SECTION: "sync-section",
  GET_SECTION_DATA: "get-section-data",
  GET_CACHED_PLAYLISTS: "get-cached-playlists",
  GET_CACHED_LIKED_SONGS: "get-cached-liked-songs",
  GET_CACHED_PLAYLIST_SONGS: "get-cached-playlist-songs",
  GET_SONG_BY_ID: "get-song-by-id",
  GET_PLAYLIST_BY_ID: "get-playlist-by-id",
  GET_SONGS_PAGINATED: "get-songs-paginated",
  GET_SONGS_TOTAL_COUNT: "get-songs-total-count",
  DEBUG_DUMP_DB: "debug-dump-db",

  // Mutation (local-first)
  ADD_LIKED_SONG: "add-liked-song",
  REMOVE_LIKED_SONG: "remove-liked-song",
  GET_LIKE_STATUS: "get-like-status",
  ADD_PLAYLIST_SONG: "add-playlist-song",
  REMOVE_PLAYLIST_SONG: "remove-playlist-song",

  // Auth
  SAVE_CACHED_USER: "save-cached-user",
  GET_CACHED_USER: "get-cached-user",
  CLEAR_CACHED_USER: "clear-cached-user",
  START_GOOGLE_OAUTH: "auth:start-google-oauth",
  OPEN_OAUTH_WINDOW: "auth:open-oauth-window",

  // External services
  DISCORD_SET_ACTIVITY: "discord:set-activity",
  DISCORD_CLEAR_ACTIVITY: "discord:clear-activity",

  // Transcribe
  GENERATE_LRC: "transcribe:generate-lrc",

  // MiniPlayer
  MINI_PLAYER_OPEN: "mini-player:open",
  MINI_PLAYER_CLOSE: "mini-player:close",
  MINI_PLAYER_UPDATE_STATE: "mini-player:update-state",
  MINI_PLAYER_CONTROL: "mini-player:control",
  MINI_PLAYER_IS_OPEN: "mini-player:is-open",
  MINI_PLAYER_READY: "mini-player:ready",

  // 受信 (on) チャンネル
  MEDIA_CONTROL: "media-control",
  DOWNLOAD_PROGRESS: "download-progress",
  OFFLINE_SIMULATION_CHANGED: "offline-simulation-changed",
  SCAN_PROGRESS: "scan-progress",
  MINI_PLAYER_STATE_CHANGED: "mini-player:state-changed",
  MINI_PLAYER_REQUEST_STATE: "mini-player:request-state",
  AUTH_CALLBACK: "auth-callback",
  AUTH_WINDOW_CLOSED: "auth-window-closed",

  // 送信 (send) チャンネル
  LOG: "log",
  PLAYER_STATE_CHANGE: "player-state-change",
} as const;

/** invoke 許可チャンネル（preload のセキュリティ検証用） */
export const INVOKE_CHANNELS = [
  CHANNELS.WINDOW_MINIMIZE,
  CHANNELS.WINDOW_MAXIMIZE,
  CHANNELS.WINDOW_CLOSE,
  CHANNELS.GET_STORE_VALUE,
  CHANNELS.SET_STORE_VALUE,
  CHANNELS.SELECT_DIRECTORY,
  CHANNELS.SCAN_MP3_FILES,
  CHANNELS.GET_MP3_METADATA,
  CHANNELS.GET_SAVED_MUSIC_LIBRARY,
  CHANNELS.CHECK_FILE_EXISTS,
  CHANNELS.CHECK_LOCAL_FILE_EXISTS,
  CHANNELS.GET_LOCAL_FILE_PATH,
  CHANNELS.GET_CACHED_FILES_WITH_METADATA,
  CHANNELS.DOWNLOAD_SONG,
  CHANNELS.DELETE_SONG,
  CHANNELS.GET_OFFLINE_SONGS,
  CHANNELS.DELETE_OFFLINE_SONG,
  CHANNELS.CHECK_OFFLINE_STATUS,
  CHANNELS.TOGGLE_OFFLINE_SIMULATION,
  CHANNELS.GET_OFFLINE_SIMULATION_STATUS,
  CHANNELS.SET_OFFLINE_SIMULATION,
  CHANNELS.SYNC_SONGS_METADATA,
  CHANNELS.SYNC_PLAYLISTS,
  CHANNELS.SYNC_PLAYLIST_SONGS,
  CHANNELS.SYNC_LIKED_SONGS,
  CHANNELS.SYNC_SPOTLIGHTS_METADATA,
  CHANNELS.SYNC_SECTION,
  CHANNELS.GET_SECTION_DATA,
  CHANNELS.GET_CACHED_PLAYLISTS,
  CHANNELS.GET_CACHED_LIKED_SONGS,
  CHANNELS.GET_CACHED_PLAYLIST_SONGS,
  CHANNELS.GET_SONG_BY_ID,
  CHANNELS.GET_PLAYLIST_BY_ID,
  CHANNELS.GET_SONGS_PAGINATED,
  CHANNELS.GET_SONGS_TOTAL_COUNT,
  CHANNELS.DEBUG_DUMP_DB,
  CHANNELS.ADD_LIKED_SONG,
  CHANNELS.REMOVE_LIKED_SONG,
  CHANNELS.GET_LIKE_STATUS,
  CHANNELS.ADD_PLAYLIST_SONG,
  CHANNELS.REMOVE_PLAYLIST_SONG,
  CHANNELS.SAVE_CACHED_USER,
  CHANNELS.GET_CACHED_USER,
  CHANNELS.CLEAR_CACHED_USER,
  CHANNELS.START_GOOGLE_OAUTH,
  CHANNELS.OPEN_OAUTH_WINDOW,
  CHANNELS.DISCORD_SET_ACTIVITY,
  CHANNELS.DISCORD_CLEAR_ACTIVITY,
  CHANNELS.GENERATE_LRC,
  CHANNELS.MINI_PLAYER_OPEN,
  CHANNELS.MINI_PLAYER_CLOSE,
  CHANNELS.MINI_PLAYER_UPDATE_STATE,
  CHANNELS.MINI_PLAYER_CONTROL,
  CHANNELS.MINI_PLAYER_IS_OPEN,
  CHANNELS.MINI_PLAYER_READY,
] as const;

/** on (受信) 許可チャンネル */
export const ON_CHANNELS = [
  CHANNELS.MEDIA_CONTROL,
  CHANNELS.DOWNLOAD_PROGRESS,
  CHANNELS.OFFLINE_SIMULATION_CHANGED,
  CHANNELS.SCAN_PROGRESS,
  CHANNELS.MINI_PLAYER_STATE_CHANGED,
  CHANNELS.MINI_PLAYER_REQUEST_STATE,
  CHANNELS.AUTH_CALLBACK,
  CHANNELS.AUTH_WINDOW_CLOSED,
] as const;

/** send (送信) 許可チャンネル */
export const SEND_CHANNELS = [CHANNELS.LOG, CHANNELS.PLAYER_STATE_CHANGE] as const;
