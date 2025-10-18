import "./App.css";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import PlayerCard from "./components/PlayerCard";
import RadarCompare from "./components/RadarCompare";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";

const DEFAULT_SEASON = "2023-24";
const DEFAULT_PLAYER_1 = "LeBron James";
const DEFAULT_PLAYER_2 = "Stephen Curry";

export default function App() {
  const [season, setSeason] = useState(DEFAULT_SEASON);

  // Player inputs
  const [p1Name, setP1Name] = useState(DEFAULT_PLAYER_1);
  const [p2Name, setP2Name] = useState(DEFAULT_PLAYER_2);

  // Player data + loading/error states
  const [p1, setP1] = useState(null);
  const [p2, setP2] = useState(null);
  const [loading1, setLoading1] = useState(false);
  const [loading2, setLoading2] = useState(false);
  const [err1, setErr1] = useState(null);
  const [err2, setErr2] = useState(null);

  // Keys we display and include in radar
  // const statKeys = [
  //   { key: "points", label: "Points" },
  //   { key: "rebounds", label: "Rebounds" },
  //   { key: "assists", label: "Assists" },
  //   { key: "steals", label: "Steals" },
  //   { key: "blocks", label: "Blocks" },
  //   { key: "turnovers", label: "Turnovers" }, // will invert for radar
  //   { key: "fantasy_score", label: "Fantasy" },
  // ];

  // Fetch helper
  const fetchPlayer = async (name, season, setPlayer, setLoading, setErr) => {
    if (!name) return;
    setLoading(true);
    setErr(null);
    try {
      const res = await axios.get("http://127.0.0.1:5000/api/stats", {
        params: { name, season },
      });
      setPlayer(res.data);
    } catch (e) {
      setPlayer(null);
      setErr(e.response?.data?.error || "Failed to fetch");
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch on mount
  useEffect(() => {
    fetchPlayer(p1Name, season, setP1, setLoading1, setErr1);
    fetchPlayer(p2Name, season, setP2, setLoading2, setErr2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when season changes
  useEffect(() => {
    if (p1Name) fetchPlayer(p1Name, season, setP1, setLoading1, setErr1);
    if (p2Name) fetchPlayer(p2Name, season, setP2, setLoading2, setErr2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [season]);

  // Compare / reload
  const handleCompare = () => {
    fetchPlayer(p1Name, season, setP1, setLoading1, setErr1);
    fetchPlayer(p2Name, season, setP2, setLoading2, setErr2);
  };

  // Build radar data (normalised 0-1 per stat across both players).
  // Turnovers inverted: lower turnover -> higher radar value.
  const radarData = useMemo(() => {
    if (!p1 && !p2) return [];

    // Define statKeys here so it doesn't trigger dependency warnings
    const statKeys = [
      { key: "points", label: "Points" },
      { key: "rebounds", label: "Rebounds" },
      { key: "assists", label: "Assists" },
      { key: "steals", label: "Steals" },
      { key: "blocks", label: "Blocks" },
      { key: "turnovers", label: "Turnovers" },
      { key: "fantasy_score", label: "Fantasy" },
    ];

    // For each stat compute raw values
    const rows = statKeys.map(({ key, label }) => {
      const a = p1 ? Number(p1[key] ?? 0) : 0;
      const b = p2 ? Number(p2[key] ?? 0) : 0;
      return { key, label, a, b };
    });

    // For turnovers we invert values so smaller is better
    const transformed = rows.map((r) => {
      if (r.key === "turnovers") {
        // To invert while normalising later, we'll still keep values but mark invert flag
        return { ...r, invert: true };
      }
      return { ...r, invert: false };
    });

    // Compute max (consider both players) for each stat
    const maxes = {};
    transformed.forEach((r) => {
      // Use a small floor to avoid divide-by-zero
      const rawMax = Math.max(r.a, r.b, 1e-6);
      maxes[r.key] = rawMax;
    });

    // Build final radar data array in shape expected by Recharts:
    // [{ stat: 'Points', A: 0.9, B: 0.8 }, ...]
    const radar = transformed.map((r) => {
      const max = maxes[r.key] || 1;
      let aNorm = r.a / max;
      let bNorm = r.b / max;

      if (r.invert) {
        // invert so that smaller value becomes larger score
        // first normalise, then invert by (1 - value)
        aNorm = 1 - aNorm;
        bNorm = 1 - bNorm;
      }

      // Clamp 0..1
      aNorm = Math.max(0, Math.min(1, aNorm));
      bNorm = Math.max(0, Math.min(1, bNorm));

      return {
        stat: r.label,
        A: +aNorm.toFixed(3),
        B: +bNorm.toFixed(3),
      };
    });

    return radar;
  }, [p1, p2]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-sky-50 p-6 md:p-10">
      <motion.header
        className="max-w-6xl mx-auto mb-6"
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h1 className="text-3xl md:text-4xl font-extrabold text-slate-800">
          🏀 Player Comparison — LeBron vs Curry (default)
        </h1>
        <p className="text-slate-600 mt-2">
          Compare all key stats including turnovers and fantasy score. Use the
          inputs to swap either player.
        </p>
      </motion.header>

      <main className="max-w-6xl mx-auto grid gap-6">
        {/* Controls & player inputs */}
        <section className="grid md:grid-cols-3 gap-4 items-end">
          <div className="md:col-span-2 grid md:grid-cols-2 gap-4">
            <PlayerCard
              title="Player 1"
              name={p1Name}
              onNameChange={setP1Name}
              onFetch={() =>
                fetchPlayer(p1Name, season, setP1, setLoading1, setErr1)
              }
              loading={loading1}
              error={err1}
              player={p1}
              accent="blue"
            />
            <PlayerCard
              title="Player 2"
              name={p2Name}
              onNameChange={setP2Name}
              onFetch={() =>
                fetchPlayer(p2Name, season, setP2, setLoading2, setErr2)
              }
              loading={loading2}
              error={err2}
              player={p2}
              accent="orange"
            />
          </div>

          <div className="flex flex-col gap-3 items-start">
            <label className="text-sm text-slate-600">Season</label>
            <select
              value={season}
              onChange={(e) => setSeason(e.target.value)}
              className="border rounded px-3 py-2"
            >
              <option>2024-25</option>
              <option>2023-24</option>
              <option>2022-23</option>
              <option>2021-22</option>
            </select>

            <button
              onClick={() => {
                handleCompare();
              }}
              className="mt-2 px-4 py-2 bg-slate-800 text-white rounded hover:bg-slate-900"
            >
              Refresh both
            </button>
          </div>
        </section>

        {/* All-stats display side-by-side */}
        <section className="grid md:grid-cols-2 gap-4">
          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-3">
              All stats — {p1?.player ?? "Player 1"}
            </h3>
            {p1 ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2">
                  <span className="text-slate-600">Team</span>
                  <div className="font-medium">{p1.team}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Season</span>
                  <div className="font-medium">{p1.season}</div>
                </div>

                <div className="p-2">
                  <span className="text-slate-600">Points</span>
                  <div className="font-medium">{p1.points}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Rebounds</span>
                  <div className="font-medium">{p1.rebounds}</div>
                </div>

                <div className="p-2">
                  <span className="text-slate-600">Assists</span>
                  <div className="font-medium">{p1.assists}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Steals</span>
                  <div className="font-medium">{p1.steals}</div>
                </div>

                <div className="p-2">
                  <span className="text-slate-600">Blocks</span>
                  <div className="font-medium">{p1.blocks}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Turnovers</span>
                  <div className="font-medium">{p1.turnovers}</div>
                </div>

                <div className="p-2 col-span-2">
                  <span className="text-slate-600">Fantasy Score</span>
                  <div className="text-xl font-bold text-blue-600">
                    {p1.fantasy_score}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                No data yet — search and fetch.
              </div>
            )}
          </div>

          <div className="bg-white rounded-xl shadow p-4">
            <h3 className="font-semibold mb-3">
              All stats — {p2?.player ?? "Player 2"}
            </h3>
            {p2 ? (
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div className="p-2">
                  <span className="text-slate-600">Team</span>
                  <div className="font-medium">{p2.team}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Season</span>
                  <div className="font-medium">{p2.season}</div>
                </div>

                <div className="p-2">
                  <span className="text-slate-600">Points</span>
                  <div className="font-medium">{p2.points}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Rebounds</span>
                  <div className="font-medium">{p2.rebounds}</div>
                </div>

                <div className="p-2">
                  <span className="text-slate-600">Assists</span>
                  <div className="font-medium">{p2.assists}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Steals</span>
                  <div className="font-medium">{p2.steals}</div>
                </div>

                <div className="p-2">
                  <span className="text-slate-600">Blocks</span>
                  <div className="font-medium">{p2.blocks}</div>
                </div>
                <div className="p-2">
                  <span className="text-slate-600">Turnovers</span>
                  <div className="font-medium">{p2.turnovers}</div>
                </div>

                <div className="p-2 col-span-2">
                  <span className="text-slate-600">Fantasy Score</span>
                  <div className="text-xl font-bold text-orange-600">
                    {p2.fantasy_score}
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-sm text-slate-500">
                No data yet — search and fetch.
              </div>
            )}
          </div>
        </section>

        {/* Radar chart */}
        <section className="bg-white rounded-xl shadow p-4">
          <h3 className="font-semibold mb-3">Radar comparison (normalised)</h3>
          <div style={{ width: "100%", height: 420 }}>
            <RadarCompare
              data={radarData}
              p1Name={p1?.player ?? "Player 1"}
              p2Name={p2?.player ?? "Player 2"}
            />
          </div>
        </section>
      </main>

      <footer className="max-w-6xl mx-auto mt-6 text-sm text-slate-500">
        Tip: try swapping players and seasons. Turnovers are inverted on the
        radar so lower turnover improves the profile.
      </footer>
    </div>
  );
}
