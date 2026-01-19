"use client";

import { useState, useEffect } from "react";
import { useForm, SubmitHandler } from "react-hook-form";
import Image from "next/image";

import { Song } from "@/types";
import Modal from "./Modal";
import Input from "../common/Input";
import { Textarea } from "../ui/textarea";
import GenreSelect from "../Genre/GenreSelect";
import Button from "../common/Button";
import useEditSongMutation from "@/hooks/mutations/useEditSongMutation";
import { toast } from "react-hot-toast";
import { Sparkles } from "lucide-react";

interface EditFormValues extends Partial<Song> {
  video?: FileList;
  song?: FileList;
  image?: FileList;
}

interface EditModalProps {
  song: Song;
  isOpen: boolean;
  onClose: () => void;
}

const EditModal = ({ song, isOpen, onClose }: EditModalProps) => {
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // TanStack Queryを使用したミューテーション
  const { mutateAsync, isPending: isLoading } = useEditSongMutation({
    onClose,
  });

  const { register, handleSubmit, reset, setValue, watch, getValues } =
    useForm<EditFormValues>({
      defaultValues: {
        id: song.id,
        user_id: song.user_id,
        title: song.title,
        author: song.author,
        lyrics: song.lyrics,
        image_path: song.image_path,
        video_path: song.video_path || "",
        song_path: song.song_path,
        genre: song.genre || "All",
      },
    });

  const handleAiSync = async () => {
    const lyrics = getValues("lyrics");
    if (!lyrics) {
      toast.error("歌詞を入力してください");
      return;
    }

    if (!song.song_path) {
      toast.error("音声ファイルが見つかりません");
      return;
    }

    setIsGenerating(true);
    const toastId = toast.loading("AI同期中... (初回は数分かかります)");

    try {
      // 1. ローカルパスの取得
      // protocol (supabase://) を物理パスに変換するか、URLを指定
      const electron = (window as any).electron;
      let localPath = "";

      // song_pathが既にローカルパスの場合とURLの場合がある
      if (song.song_path.startsWith("http")) {
        // httpの場合はキャッシュを探すか、ダウンロードが必要
        // 今回は簡略化のため get-local-file-path に委ねる
        localPath = await electron.ipc.invoke(
          "get-local-file-path",
          song.song_path,
        );
      } else {
        localPath = song.song_path;
      }

      const result = await electron.ai.generateLrc(localPath, lyrics);

      if (result.status === "success") {
        setValue("lyrics", result.lrc);
        toast.success("AI同期が完了しました", { id: toastId });
      } else {
        toast.error(result.message || "同期に失敗しました", { id: toastId });
      }
    } catch (error) {
      console.error("AI Sync Error:", error);
      toast.error("エラーが発生しました", { id: toastId });
    } finally {
      setIsGenerating(false);
    }
  };

  const watchVideo = watch("video");
  const watchSong = watch("song");
  const watchImage = watch("image");

  useEffect(() => {
    if (isOpen) {
      reset({
        id: song.id,
        user_id: song.user_id,
        title: song.title,
        author: song.author,
        lyrics: song.lyrics,
        image_path: song.image_path,
        song_path: song.song_path,
        genre: song.genre || "All",
        video_path: song.video_path || "",
        video: undefined,
        song: undefined,
        image: undefined,
      });
      setSelectedGenres(song.genre ? song.genre.split(", ") : []);
    }
  }, [isOpen, song, reset]);

  const onSubmit: SubmitHandler<EditFormValues> = async (values) => {
    try {
      // TanStack Queryのミューテーションを使用
      await mutateAsync({
        id: song.id,
        title: values.title!,
        author: values.author!,
        lyrics: values.lyrics,
        genre: selectedGenres,
        videoFile: values.video?.[0] || null,
        songFile: values.song?.[0] || null,
        imageFile: values.image?.[0] || null,
        currentSong: song,
      });

      // 成功時の処理はミューテーションのonSuccessで行われる
    } catch (error) {
      // エラー処理はミューテーション内で行われる
      console.error("Edit error:", error);
    }
  };

  return (
    <Modal
      title="曲を編集"
      description="曲の情報を編集します。"
      isOpen={isOpen}
      onChange={() => onClose()}
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-y-4">
        <Input
          disabled={isLoading}
          {...register("title", { required: true })}
          placeholder="曲のタイトル"
        />
        <Input
          disabled={isLoading}
          {...register("author", { required: true })}
          placeholder="曲の作者"
        />
        <div className="flex items-center justify-between">
          <label className="text-sm font-medium">歌詞</label>
          {song.song_path && (
            <button
              type="button"
              disabled={isLoading || isGenerating}
              onClick={handleAiSync}
              className="flex items-center gap-x-1 text-xs text-primary hover:underline disabled:text-neutral-500 disabled:no-underline transition"
            >
              <Sparkles className="h-3 w-3" />
              {isGenerating ? "生成中..." : "AI同期"}
            </button>
          )}
        </div>
        <Textarea
          disabled={isLoading || isGenerating}
          {...register("lyrics")}
          placeholder="歌詞"
          className="bg-neutral-700 min-h-[150px]"
        />
        <GenreSelect
          onGenreChange={(genres: string) => setSelectedGenres([genres])}
        />

        <div>
          <div className="pb-1">曲を選択（50MB以下）</div>
          <Input
            disabled={isLoading}
            type="file"
            accept="audio/*"
            {...register("song")}
          />
          {song.song_path && (
            <div className="mt-2">
              <audio controls className="w-full mt-2">
                <source src={song.song_path} type="audio/mpeg" />
              </audio>
            </div>
          )}
        </div>

        <div>
          <div className="pb-1">画像を選択（5MB以下）</div>
          <Input
            disabled={isLoading}
            type="file"
            accept="image/*"
            {...register("image")}
          />
          {song.image_path && (
            <div className="mt-2 relative w-32 h-32">
              <Image
                src={song.image_path}
                alt="現在の画像"
                fill
                className="object-cover rounded-md"
                sizes="(max-width: 640px) 100vw, (max-width: 768px) 50vw, (max-width: 1024px) 33vw, (max-width:1280px) 25vw, 20vw"
              />
            </div>
          )}
        </div>

        <div>
          <div className="pb-1">ビデオを選択（5MB以下）</div>
          <Input
            disabled={isLoading}
            type="file"
            accept="video/*"
            {...register("video")}
          />
          {song.video_path && (
            <div className="mt-2">
              <a
                href={song.video_path}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 underline"
              >
                既存のビデオを確認
              </a>
            </div>
          )}
        </div>

        <Button disabled={isLoading} type="submit">
          {isLoading ? "編集中..." : "編集"}
        </Button>
      </form>
    </Modal>
  );
};

export default EditModal;
