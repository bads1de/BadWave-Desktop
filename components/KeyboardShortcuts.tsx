"use client";

import useKeyboardShortcuts, {
  KEYBOARD_SHORTCUTS,
} from "@/hooks/useKeyboardShortcuts";

/**
 * グローバルキーボードショートカットを有効化し、
 * "?" キーでショートカット一覧を表示するコンポーネント
 */
const KeyboardShortcuts: React.FC = () => {
  const { showHelp, setShowHelp } = useKeyboardShortcuts();

  if (!showHelp) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={() => setShowHelp(false)}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="mx-4 w-full max-w-md rounded-lg border border-white/15 bg-[#0a0a0f]/95 p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 text-lg font-bold text-white">
          キーボードショートカット
        </h2>
        <ul className="space-y-2">
          {KEYBOARD_SHORTCUTS.map((s) => (
            <li
              key={s.keys}
              className="flex items-center justify-between gap-4 text-sm"
            >
              <kbd className="rounded bg-white/10 px-2 py-0.5 font-mono text-white/90">
                {s.keys}
              </kbd>
              <span className="flex-1 text-right text-white/80">
                {s.description}
              </span>
            </li>
          ))}
        </ul>
        <button
          className="mt-6 w-full rounded bg-white/10 py-2 text-sm text-white transition-colors hover:bg-white/20"
          onClick={() => setShowHelp(false)}
        >
          閉じる (Esc)
        </button>
      </div>
    </div>
  );
};

export default KeyboardShortcuts;
