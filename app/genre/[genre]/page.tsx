"use client";

import React, { use } from "react";
import GenreHeader from "@/components/Genre/GenreHeader";
import GenreContent from "@/components/Genre/GenreContent";

interface genreProps {
  params: Promise<{
    genre: string;
  }>;
}

const GenrePage = (props: genreProps) => {
  const params = use(props.params);
  const { genre } = params;
  const decodedGenre = decodeURIComponent(genre);

  return (
    <div className="bg-[#0a0a0f] w-full h-full overflow-hidden overflow-y-auto custom-scrollbar relative">
      {/* 背景装飾 */}
      <div className="fixed inset-0 opacity-[0.03] pointer-events-none z-0 bg-[length:40px_40px] bg-[linear-gradient(to_right,rgba(var(--theme-500),0.3)_1px,transparent_1px),linear-gradient(to_bottom,rgba(var(--theme-500),0.3)_1px,transparent_1px)]" />

      <div className="relative z-10">
        <GenreHeader genre={decodedGenre} />
        <GenreContent genre={decodedGenre} />
      </div>
    </div>
  );
};

export default GenrePage;
