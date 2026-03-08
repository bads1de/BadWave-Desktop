import useAuthModal from "@/hooks/auth/useAuthModal";
import { useUser } from "@/hooks/auth/useUser";
import useLikeStatus from "@/hooks/data/useLikeStatus";
import useLikeMutation from "@/hooks/mutations/useLikeMutation";
import { AiFillHeart, AiOutlineHeart } from "react-icons/ai";
import { memo, useCallback } from "react";

interface LikeButtonProps {
  songId: string;
  songType: "regular";
  size?: number;
  showText?: boolean;
  disabled?: boolean;
}

const LikeButton: React.FC<LikeButtonProps> = memo(
  ({ songId, songType, size, showText = false, disabled = false }) => {
    const { user } = useUser();
    const authModal = useAuthModal();

    // いいね状態を取得
    const { isLiked } = useLikeStatus(songId, user?.id);

    // いいね操作のミューテーション
    const likeMutation = useLikeMutation(songId, user?.id);

    const Icon = isLiked ? AiFillHeart : AiOutlineHeart;

    // いいねボタンのクリックハンドラーをメモ化
    const handleLike = useCallback(() => {
      if (disabled) return;

      if (!user) {
        return authModal.onOpen();
      }

      likeMutation.mutate(isLiked);
    }, [authModal, likeMutation, user, isLiked, disabled]);

    return (
      <button
        onClick={handleLike}
        className={`text-theme-500/60 transition-all duration-500 drop-shadow-[0_0_5px_rgba(var(--theme-500),0.5)] font-mono uppercase tracking-widest cyber-glitch outline-none group ${
          disabled ? "cursor-not-allowed opacity-50" : "cursor-pointer hover:text-white"
        }`}
        aria-label={isLiked ? "Remove like" : "Add like"}
        disabled={likeMutation.isPending || disabled}
      >
        <div className="flex items-center gap-2">
          <Icon 
            className={isLiked ? "text-theme-500 animate-pulse" : "text-theme-500/40 group-hover:text-theme-500"} 
            size={size || 22} 
          />
          {showText && (
            <span className="text-[10px] font-black">
              {isLiked ? "// AFFINITY_SYNCED" : "// INITIALIZE_SYNC"}
            </span>
          )}
        </div>
      </button>
    );
  }
);

// 表示名を設定
LikeButton.displayName = "LikeButton";

export default LikeButton;
