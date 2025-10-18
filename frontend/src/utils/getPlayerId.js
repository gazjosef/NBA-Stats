// src/utils/getPlayerId.js
import axios from "axios";

let cachedPlayers = null;

export async function getPlayerIdByName(name) {
  if (!name) return null;

  // Load player list once and cache
  if (!cachedPlayers) {
    const res = await axios.get(
      "https://data.nba.net/data/10s/prod/v1/2024/players.json"
    );
    cachedPlayers = res.data.league.standard;
  }

  const player = cachedPlayers.find((p) => {
    const fullName = `${p.firstName} ${p.lastName}`.toLowerCase();
    return fullName === name.toLowerCase();
  });

  return player ? player.personId : null;
}
