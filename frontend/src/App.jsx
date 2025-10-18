import { useState } from "react";
import axios from "axios";
// eslint-disable-next-line no-unused-vars
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

function App() {
  const [playerName, setPlayerName] = useState("");
  const [season, setSeason] = useState("2023-24");
  const [stats, setStats] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);

  const fetchStats = async () => {
    try {
      setError(null);
      setLoading(true);
      const res = await axios.get("http://127.0.0.1:5000/api/stats", {
        params: { name: playerName, season },
      });
      setStats(res.data);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to fetch stats");
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  const chartData = stats
    ? [
        { name: "Points", value: stats.points },
        { name: "Rebounds", value: stats.rebounds },
        { name: "Assists", value: stats.assists },
        { name: "Fantasy", value: stats.fantasy_score },
      ]
    : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-8 flex flex-col items-center">
      <motion.h1
        className="text-4xl font-bold mb-8 text-gray-800"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        🏀 NBA Player Stats Dashboard
      </motion.h1>

      {/* Search Section */}
      <Card className="w-full max-w-2xl mb-8">
        <CardHeader>
          <CardTitle>Search Player Stats</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col sm:flex-row gap-4">
          <input
            type="text"
            placeholder="Enter player name (e.g. LeBron James)"
            value={playerName}
            onChange={(e) => setPlayerName(e.target.value)}
            className="flex-1 border border-gray-300 rounded px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={season}
            onChange={(e) => setSeason(e.target.value)}
            className="border border-gray-300 rounded px-3 py-2"
          >
            <option>2024-25</option>
            <option>2023-24</option>
            <option>2022-23</option>
            <option>2021-22</option>
          </select>
          <Button onClick={fetchStats} disabled={loading}>
            {loading ? "Fetching..." : "Fetch Stats"}
          </Button>
        </CardContent>
      </Card>

      {error && (
        <motion.p
          className="text-red-500 font-medium"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          {error}
        </motion.p>
      )}

      {/* Player Info & Stats */}
      {stats && (
        <motion.div
          className="grid gap-6 w-full max-w-4xl sm:grid-cols-2"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <Card>
            <CardHeader>
              <CardTitle>{stats.player}</CardTitle>
            </CardHeader>
            <CardContent className="text-gray-700 space-y-1">
              <p>
                <strong>Team:</strong> {stats.team}
              </p>
              <p>
                <strong>Season:</strong> {stats.season}
              </p>
              <p>
                <strong>Position:</strong> {stats.position || "N/A"}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key Stats</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-1 text-gray-700">
                <p>Points: {stats.points}</p>
                <p>Rebounds: {stats.rebounds}</p>
                <p>Assists: {stats.assists}</p>
                <p className="font-bold text-blue-600">
                  Fantasy Score: {stats.fantasy_score}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="sm:col-span-2">
            <CardHeader>
              <CardTitle>Performance Chart</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="value" radius={[8, 8, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}

export default App;
