"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { Playlist } from "@/types";
import { motion } from "framer-motion";
import { memo, ReactNode, useCallback } from "react";
import { DURATIONS } from "@/constants";
import { twMerge } from "tailwind-merge";

type PlaylistCardAnimation = "rise" | "scale";

interface PlaylistCardProps {
  playlist: Playlist;
  /** クリック時の遷移先 */
  href: string;
  /** 入場アニメーションの遅延に使うインデックス */
  index?: number;
  /** 入場アニメーションの長さ */
  duration?: number;
  /** 1件ごとの遅延量 */
  delayStep?: number;
  /** 入場アニメーションの種類 */
  animation?: PlaylistCardAnimation;
  /** 外側ラッパーの追加クラス */
  className?: string;
  /** カード本体の追加クラス（余白・角丸・ホバー演出などの差分） */
  cardClassName?: string;
  /** アートワーク枠の追加クラス（余白・枠線などの差分） */
  artworkClassName?: string;
  /** アートワークのクラス（モノクロ→カラー等の差分） */
  imageClassName?: string;
  /** next/image の sizes */
  sizes?: string;
  /** アートワークに重ねる装飾（グラデーション等） */
  imageOverlay?: ReactNode;
  /** アートワークより上に差し込む要素（HUD のステータス行など） */
  header?: ReactNode;
  /** カード本体の末尾に差し込む要素（タイトル・メタ情報・HUD装飾など） */
  children?: ReactNode;
}

const GRID_SIZES =
  "(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw";

/**
 * プレイリストカードの共通シェル
 *
 * プレイリスト一覧 / 検索結果 / 公開プレイリストボードで重複していた
 * 「motion ラッパー + カード枠 + アートワーク」を共通化し、
 * 表示ごとに異なる装飾や情報ブロックはスロット(props)で差し込む。
 *
 * クラスは tailwind-merge で結合するため、呼び出し側のクラスで既定値を上書きできる。
 */
const PlaylistCard: React.FC<PlaylistCardProps> = memo(
  ({
    playlist,
    href,
    index = 0,
    duration = DURATIONS.NORMAL,
    delayStep = 0.05,
    animation = "rise",
    className,
    cardClassName,
    artworkClassName,
    imageClassName,
    sizes = GRID_SIZES,
    imageOverlay,
    header,
    children,
  }) => {
    const router = useRouter();
    // 横スクロール表示は拡大、グリッド表示は下からふわっと現れる
    const isScale = animation === "scale";

    const handleClick = useCallback(() => {
      router.push(href);
    }, [router, href]);

    return (
      <motion.div
        initial={isScale ? { opacity: 0, scale: 0.9 } : { opacity: 0, y: 20 }}
        animate={isScale ? { opacity: 1, scale: 1 } : { opacity: 1, y: 0 }}
        transition={{ duration, delay: index * delayStep }}
        className={twMerge("group relative cursor-pointer", className)}
        onClick={handleClick}
      >
        {/* Main Card Container */}
        <div
          className={twMerge(
            "relative bg-[#0a0a0f] border border-theme-500/20 p-4 transition-all duration-500 group-hover:border-theme-500/60",
            cardClassName
          )}
        >
          {header}

          {/* Image Container */}
          <div
            className={twMerge(
              "relative aspect-square w-full overflow-hidden mb-4 border border-theme-500/10",
              artworkClassName
            )}
          >
            <Image
              src={playlist.image_path || "/images/playlist.png"}
              alt={playlist.title}
              fill
              className={twMerge(
                "object-cover transition-transform duration-700 group-hover:scale-110",
                imageClassName
              )}
              sizes={sizes}
            />
            {imageOverlay}
          </div>

          {children}
        </div>
      </motion.div>
    );
  }
);

// displayName を設定
PlaylistCard.displayName = "PlaylistCard";

export default PlaylistCard;
