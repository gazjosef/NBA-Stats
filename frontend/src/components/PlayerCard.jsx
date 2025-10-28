import { useState } from "react";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

export default function PlayerCard({
  // title,
  name,
  onNameChange,
  onFetch,
  loading,
  error,
  player,
  accent = "blue",
}) {
  const [input, setInput] = useState(name);

  const handleSubmit = (e) => {
    e.preventDefault();
    onNameChange(input);
    onFetch();
  };

  return (
    <motion.div
      className={`px-4 bg-white rounded-2xl shadow border-t-4`}
      style={{ borderTopColor: accent }}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* <h3 className="font-semibold text-slate-700 mb-3">{title}</h3> */}

      {/* Player image + details */}
      {player && (
        <div className="flex items-center justify-center gap-3 mb-4">
          <div className="w-16 h-16 rounded-full overflow-hidden border border-slate-200 bg-slate-100 flex-shrink-0">
            <img
              src={player.image}
              alt={player.player}
              className="w-full h-full object-cover"
              onError={(e) => {
                e.target.src =
                  "https://cdn.nba.com/headshots/nba/latest/1040x760/placeholder.png";
              }}
            />
          </div>
          <div>
            <div className="font-bold text-slate-800 text-lg">
              {player.player}
            </div>
            <div className="text-sm text-slate-500">
              {player.team} — {player.season}
            </div>
          </div>
        </div>
      )}

      {/* Input form */}
      <form onSubmit={handleSubmit} className="flex flex-col gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Enter NBA player name"
          className="border border-slate-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-slate-400 focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading}
          className={`px-3 py-2 text-white font-medium rounded-lg transition ${
            loading
              ? "bg-slate-400 cursor-not-allowed"
              : `bg-${accent}-600 hover:bg-${accent}-700`
          }`}
        >
          {loading ? "Loading..." : "Fetch Player"}
        </button>
      </form>

      {/* Error message */}
      {error && (
        <div className="mt-2 text-sm text-red-600 bg-red-50 p-2 rounded">
          {error}
        </div>
      )}
    </motion.div>
  );
}
