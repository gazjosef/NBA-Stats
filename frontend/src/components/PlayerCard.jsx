import React from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function PlayerCard({
  title,
  name,
  onNameChange,
  onFetch,
  loading,
  error,
  player,
  accent = "blue",
}) {
  const accentBg =
    accent === "orange"
      ? "bg-orange-50 border-orange-200"
      : "bg-blue-50 border-blue-200";
  const accentText = accent === "orange" ? "text-orange-700" : "text-blue-700";

  return (
    <motion.div layout className={`rounded-xl border p-4 ${accentBg}`}>
      <div className="flex items-center justify-between mb-3">
        <h4 className={`font-semibold ${accentText}`}>{title}</h4>
        <button
          onClick={onFetch}
          disabled={loading}
          className="px-3 py-1 bg-slate-800 text-white rounded hover:bg-slate-900"
        >
          {loading ? "..." : "Fetch"}
        </button>
      </div>

      <input
        value={name}
        onChange={(e) => onNameChange(e.target.value)}
        placeholder="Full name (e.g. LeBron James)"
        className="w-full rounded px-3 py-2 mb-3 border focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {error && <div className="text-sm text-red-600 mb-2">{error}</div>}

      {player ? (
        <div className="text-sm text-slate-700 space-y-1">
          <div className="font-medium">{player.player}</div>
          <div className="text-slate-500 text-xs">
            Team: {player.team} • Season: {player.season}
          </div>
          <div className="mt-2 text-sm">
            <div>
              PTS: <strong>{player.points}</strong>
            </div>
            <div>
              REB: <strong>{player.rebounds}</strong>
            </div>
            <div>
              AST: <strong>{player.assists}</strong>
            </div>
            <div>
              Fantasy: <strong>{player.fantasy_score}</strong>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-sm text-slate-500">No player loaded</div>
      )}
    </motion.div>
  );
}
