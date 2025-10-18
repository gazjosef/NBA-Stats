from flask import Flask, jsonify, request
from flask_cors import CORS
import requests
from nba_api.stats.static import players  # ✅ Added

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})


def get_headers():
    """Headers required for NBA Stats API requests."""
    return {
        "Host": "stats.nba.com",
        "User-Agent": (
            "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) "
            "AppleWebKit/537.36 (KHTML, like Gecko) "
            "Chrome/118.0.5993.70 Safari/537.36"
        ),
        "Accept": "application/json, text/plain, */*",
        "Referer": "https://www.nba.com/",
        "Origin": "https://www.nba.com",
    }


def safe_float(value):
    """Safely convert values to float."""
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0


def get_player_id(player_name):
    """Use nba_api to find a player's ID."""
    player_results = players.find_players_by_full_name(player_name)
    if player_results:
        return player_results[0]["id"], player_results[0]["full_name"]
    return None, None


@app.route("/api/stats", methods=["GET"])
def get_player_stats():
    player_name = request.args.get("name", "").strip()
    season = request.args.get("season", "2023-24")

    if not player_name:
        return jsonify({"error": "Player name required"}), 400

    print(f"Fetching NBA stats for: {player_name} ({season})")

    player_id, full_name = get_player_id(player_name)
    if not player_id:
        return jsonify({"error": f"Player '{player_name}' not found"}), 404

    try:
        # Get player career stats
        url = "https://stats.nba.com/stats/playercareerstats"
        params = {"PerMode": "PerGame", "PlayerID": player_id}
        res = requests.get(url, headers=get_headers(), params=params)
        res.raise_for_status()
        data = res.json()

        headers = data["resultSets"][0]["headers"]
        rows = data["resultSets"][0]["rowSet"]
        stats_list = [dict(zip(headers, row)) for row in rows]

        # Match the correct season (NBA format uses "2023-24" → "2023-24")
        current_stats = next(
            (s for s in stats_list if season in s["SEASON_ID"]), None
        )

        if not current_stats:
            return jsonify({"error": "No stats found for this season"}), 404

        # Compute fantasy score
        fantasy_score = (
            safe_float(current_stats.get("PTS"))
            + 1.2 * safe_float(current_stats.get("REB"))
            + 1.5 * safe_float(current_stats.get("AST"))
            + 3 * safe_float(current_stats.get("STL"))
            + 3 * safe_float(current_stats.get("BLK"))
            - safe_float(current_stats.get("TOV"))
        )

        # Construct image URL
        image_url = f"https://cdn.nba.com/headshots/nba/latest/1040x760/{player_id}.png"

        return jsonify({
            "player": full_name,
            "team": current_stats.get("TEAM_ABBREVIATION", "N/A"),
            "season": season,
            "points": current_stats.get("PTS"),
            "rebounds": current_stats.get("REB"),
            "assists": current_stats.get("AST"),
            "steals": current_stats.get("STL"),
            "blocks": current_stats.get("BLK"),
            "turnovers": current_stats.get("TOV"),
            "fantasy_score": round(fantasy_score, 2),
            "image": image_url,  # ✅ added
        })

    except Exception as e:
        print("🔥 Error fetching NBA stats:", e)
        return jsonify({"error": "Failed to fetch NBA stats"}), 500


if __name__ == "__main__":
    app.run(debug=True)
