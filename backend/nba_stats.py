import requests

def get_headers():
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

def fetch_player_stats(player_name: str, season: str = "2023-24"):
    players_url = "https://stats.nba.com/stats/commonallplayers"
    params = {"LeagueID": "00", "Season": season, "IsOnlyCurrentSeason": "1"}
    res = requests.get(players_url, headers=get_headers(), params=params)
    res.raise_for_status()
    data = res.json()

    headers = data["resultSets"][0]["headers"]
    rows = data["resultSets"][0]["rowSet"]
    players = [dict(zip(headers, row)) for row in rows]

    player = next(
        (p for p in players if player_name.lower() in p["DISPLAY_FIRST_LAST"].lower()),
        None,
    )

    if not player:
        return None

    player_id = player["PERSON_ID"]

    career_url = "https://stats.nba.com/stats/playercareerstats"
    params = {"PerMode": "PerGame", "PlayerID": player_id}
    stats_res = requests.get(career_url, headers=get_headers(), params=params)
    stats_res.raise_for_status()
    stats_data = stats_res.json()

    headers = stats_data["resultSets"][0]["headers"]
    rows = stats_data["resultSets"][0]["rowSet"]
    stats_list = [dict(zip(headers, row)) for row in rows]

    target_year = season.split("-")[0][-2:]
    current_stats = next(
        (s for s in stats_list if s["SEASON_ID"].endswith(target_year)),
        None,
    )

    if not current_stats:
        return None

    fantasy_score = (
        safe_float(current_stats.get("PTS"))
        + 1.2 * safe_float(current_stats.get("REB"))
        + 1.5 * safe_float(current_stats.get("AST"))
        + 3 * safe_float(current_stats.get("STL"))
        + 3 * safe_float(current_stats.get("BLK"))
        - safe_float(current_stats.get("TOV"))
    )

    return {
        "player": player["DISPLAY_FIRST_LAST"],
        "team": current_stats.get("TEAM_ABBREVIATION", "N/A"),
        "season": season,
        "points": current_stats.get("PTS"),
        "rebounds": current_stats.get("REB"),
        "assists": current_stats.get("AST"),
        "fantasy_score": round(fantasy_score, 2),
    }

if __name__ == "__main__":
    print(fetch_player_stats("LeBron James", "2023-24"))
