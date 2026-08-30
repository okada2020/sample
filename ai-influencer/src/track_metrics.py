"""フォロワー数とブログ記事数を記録し、成長を可視化する。

各SNSのAPIは無料枠で数値を取れないことが多いので、手入力で記録する方式にしている。
週1回、各アカウントの数字を見て打ち込むだけ(1分)。

使い方:
  python -m src.track_metrics record x 120          # Xのフォロワーを120で記録
  python -m src.track_metrics record instagram 45 --note "初投稿"
  python -m src.track_metrics report                # 成長レポートを表示
  python -m src.track_metrics report --weeks 8      # 直近8週間ぶん
"""
import argparse
import csv
import subprocess
from datetime import date, timedelta
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
METRICS = ROOT / "data" / "metrics.csv"
POSTS_DIR = ROOT / "site" / "posts"

CHANNELS = ["x", "instagram", "threads", "blog", "room"]
HEADER = ["date", "channel", "followers", "note"]

# strategy.md の3ヶ月目標
TARGETS = {"x": 1000, "instagram": 800, "threads": 600, "blog": 30, "room": 0}


def _rows() -> list[dict]:
    if not METRICS.exists():
        return []
    with open(METRICS, encoding="utf-8", newline="") as f:
        return list(csv.DictReader(f))


def record(channel: str, value: int, note: str) -> None:
    METRICS.parent.mkdir(parents=True, exist_ok=True)
    is_new = not METRICS.exists()
    with open(METRICS, "a", encoding="utf-8", newline="") as f:
        w = csv.writer(f)
        if is_new:
            w.writerow(HEADER)
        w.writerow([date.today().isoformat(), channel, value, note])
    print(f"[track] {date.today()} {channel}: {value} を記録しました")


def count_articles() -> int:
    return len(list(POSTS_DIR.glob("*.html"))) if POSTS_DIR.exists() else 0


def _series(rows: list[dict], channel: str) -> list[tuple[str, int]]:
    pts = [(r["date"], int(r["followers"])) for r in rows if r["channel"] == channel]
    return sorted(pts)


def report(weeks: int) -> None:
    rows = _rows()
    cutoff = (date.today() - timedelta(weeks=weeks)).isoformat()

    print(f"\n=== 成長レポート ({date.today()}) ===\n")
    print(f"{'チャネル':<12} {'現在':>7} {'期間増':>7} {'週平均':>7} {'3ヶ月目標':>10}  進捗")
    print("-" * 62)

    for ch in CHANNELS:
        pts = _series(rows, ch)
        if ch == "blog":
            latest = count_articles()  # 記事数はファイルから自動計測
        elif pts:
            latest = pts[-1][1]
        else:
            latest = 0

        in_range = [p for p in pts if p[0] >= cutoff]
        growth = (in_range[-1][1] - in_range[0][1]) if len(in_range) >= 2 else 0
        per_week = growth / weeks if weeks else 0
        target = TARGETS.get(ch, 0)
        pct = f"{latest / target * 100:.0f}%" if target else "—"
        bar = "█" * min(int(latest / target * 20), 20) if target else ""
        print(f"{ch:<12} {latest:>7} {growth:>+7} {per_week:>7.1f} {target:>10}  {pct:>4} {bar}")

    print(f"\n記事数はファイルから自動計測: {count_articles()}本")

    # 直近の記録から所感を出す
    x_pts = _series(rows, "x")
    if len(x_pts) >= 2 and x_pts[-1][1] == x_pts[-2][1]:
        print("⚠ Xのフォロワーが前回から変化なし。投稿が止まっていないか確認を。")
    if count_articles() < 5:
        print("→ まずはブログ記事を増やすのが最優先(A8提携審査には20本以上が目安)")
    print()


def main() -> None:
    ap = argparse.ArgumentParser(description="フォロワー数と記事数を記録・可視化する")
    sub = ap.add_subparsers(dest="cmd", required=True)

    rec = sub.add_parser("record", help="数値を記録する")
    rec.add_argument("channel", choices=CHANNELS)
    rec.add_argument("value", type=int)
    rec.add_argument("--note", default="")

    rep = sub.add_parser("report", help="成長レポートを表示する")
    rep.add_argument("--weeks", type=int, default=4)

    args = ap.parse_args()
    if args.cmd == "record":
        record(args.channel, args.value, args.note)
    else:
        report(args.weeks)


if __name__ == "__main__":
    main()
