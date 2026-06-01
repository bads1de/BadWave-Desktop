PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_section_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`item_ids` text,
	`updated_at` integer DEFAULT '"2026-06-01T09:04:46.646Z"'
);
--> statement-breakpoint
INSERT INTO `__new_section_cache`("key", "item_ids", "updated_at") SELECT "key", "item_ids", "updated_at" FROM `section_cache`;--> statement-breakpoint
DROP TABLE `section_cache`;--> statement-breakpoint
ALTER TABLE `__new_section_cache` RENAME TO `section_cache`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `playlist_songs_playlist_id_idx` ON `playlist_songs` (`playlist_id`);--> statement-breakpoint
CREATE INDEX `playlist_songs_song_id_idx` ON `playlist_songs` (`song_id`);--> statement-breakpoint
CREATE INDEX `songs_user_id_idx` ON `songs` (`user_id`);--> statement-breakpoint
CREATE INDEX `songs_genre_idx` ON `songs` (`genre`);--> statement-breakpoint
CREATE INDEX `songs_play_count_idx` ON `songs` (`play_count`);--> statement-breakpoint
CREATE INDEX `songs_like_count_idx` ON `songs` (`like_count`);