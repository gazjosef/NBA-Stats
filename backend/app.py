from flask import Flask, jsonify, request
from flask_cors import CORS
import requests

app = Flask(__name__)
CORS(app, resources={r"/api/*": {"origins": "http://localhost:5173"}})

def get_headers():
    """Headers to make NBA API requests work"""
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
    try:
        return float(value)
    except (TypeError, ValueError):
        return 0.0

@app.route("/api/stats", methods=["GET"])
def get_player_stats():
    player_name = request.args.get("name", "").strip()
    season = request.args.get("season", "2023-24")

    if not player_name:
        return jsonify({"error": "Player name required"}), 400

    print(f"Fetching NBA stats for: {player_name} ({season})")

    def fetch_player(is_current_season="1"):
        url = "https://stats.nba.com/stats/commonallplayers"
        params = {"LeagueID": "00", "Season": season, "IsOnlyCurrentSeason": is_current_season}
        res = requests.get(url, headers=get_headers(), params=params)
        res.raise_for_status()
        data = res.json()
        headers = data["resultSets"][0]["headers"]
        rows = data["resultSets"][0]["rowSet"]
        return [dict(zip(headers, row)) for row in rows]

    try:
        # Try current players first
        players = fetch_player("1")
        player = next((p for p in players if player_name.lower() in p["DISPLAY_FIRST_LAST"].lower()), None)

        # If not found, retry with all players (including retired)
        if not player:
            print("Retrying with IsOnlyCurrentSeason=0...")
            players = fetch_player("0")
            player = next((p for p in players if player_name.lower() in p["DISPLAY_FIRST_LAST"].lower()), None)

        if not player:
            return jsonify({"error": f"Player '{player_name}' not found"}), 404

        player_id = player["PERSON_ID"]

        # Get player career stats
        career_url = "https://stats.nba.com/stats/playercareerstats"
        params = {"PerMode": "PerGame", "PlayerID": player_id}
        stats_res = requests.get(career_url, headers=get_headers(), params=params)
        stats_res.raise_for_status()
        stats_data = stats_res.json()

        headers = stats_data["resultSets"][0]["headers"]
        rows = stats_data["resultSets"][0]["rowSet"]
        stats_list = [dict(zip(headers, row)) for row in rows]

        # Match season by first two digits (e.g. "2023-24" → "23")
        target_year = season.split("-")[0][-2:]
        current_stats = next(
            (s for s in stats_list if s["SEASON_ID"].endswith(target_year)),
            None,
        )

        if not current_stats:
            return jsonify({"error": "No stats found for this season"}), 404

        def safe_float(value):
            try:
                return float(value)
            except (TypeError, ValueError):
                return 0.0

        fantasy_score = (
            safe_float(current_stats.get("PTS"))
            + 1.2 * safe_float(current_stats.get("REB"))
            + 1.5 * safe_float(current_stats.get("AST"))
            + 3 * safe_float(current_stats.get("STL"))
            + 3 * safe_float(current_stats.get("BLK"))
            - safe_float(current_stats.get("TOV"))
        )

        return jsonify({
            "player": player["DISPLAY_FIRST_LAST"],
            "team": current_stats.get("TEAM_ABBREVIATION", "N/A"),
            "season": season,
            "points": current_stats.get("PTS"),
            "rebounds": current_stats.get("REB"),
            "assists": current_stats.get("AST"),
            "steals": current_stats.get("STL"),
            "blocks": current_stats.get("BLK"),
            "turnovers": current_stats.get("TOV"),
            "fantasy_score": round(fantasy_score, 2),
        })

    except Exception as e:
        print("🔥 Error fetching NBA stats:", e)
        return jsonify({"error": "Failed to fetch NBA stats"}), 500


if __name__ == "__main__":
    app.run(debug=True)
