"""検証連載の週次レポート下書きを生成する。

data/metrics.csv の実測値を拾って、記事のHTML下書きを作る。
「やったこと」「わかったこと」だけ人間が埋めれば記事になる。

  python -m src.weekly_report            # 今週分を生成
  python -m src.weekly_report --week 3   # 週番号を指定
  python -m src.weekly_report --revenue 240   # 収益額を指定(既定0円)
"""
import argparse
import csv
import html
import json
import re
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
METRICS = ROOT / "data" / "metrics.csv"
POSTS_DIR = ROOT / "site" / "posts"
TEMPLATE = (ROOT / "src" / "templates" / "post.html").read_text(encoding="utf-8")

START = date(2026, 9, 9)          # 検証開始日
GOAL_YEN = 10000                  # 3ヶ月後の目標
CHANNELS = [("x", "X"), ("instagram", "Instagram"), ("threads", "Threads")]


def latest(channel: str, field: str = "followers") -> int:
    """指定チャネルの最新の数値を返す。無ければ0。"""
    if not METRICS.exists():
        return 0
    with open(METRICS, encoding="utf-8", newline="") as f:
        rows = [r for r in csv.DictReader(f) if r["channel"] == channel and r.get(field)]
    return int(rows[-1][field]) if rows else 0


def count_articles() -> int:
    return len(list(POSTS_DIR.glob("*.html"))) if POSTS_DIR.exists() else 0


def build(week: int, revenue: int) -> Path:
    today = date.today()
    rows = "".join(
        f"    <tr><td>{label}フォロワー</td><td>{latest(key)}</td></tr>\n"
        for key, label in CHANNELS
    )
    pv = latest("blog", "impressions")
    pct = revenue / GOAL_YEN * 100

    title = f"【検証{week}週目】AIブログは稼げるのか|今週の数字"
    desc = (f"検証{week}週目。収益{revenue:,}円、ブログPV{pv}。"
            "数字をそのまま公開しています。")
    body = f"""  <p>AIキャラのアフィリエイトブログは本当に稼げるのか、
  0円・フォロワー0から3ヶ月やってみる検証の{week}週目です。</p>
  <p>数字はそのまま出します。ダメだったらダメと書く、が唯一のルールなので。</p>

  <h2>今週の数字</h2>
  <table>
    <tr><th>項目</th><th>現在</th></tr>
{rows}    <tr><td>ブログPV(週)</td><td>{pv}</td></tr>
    <tr><td>ブログ記事数</td><td>{count_articles()}本</td></tr>
    <tr><td><strong>収益</strong></td><td><strong>{revenue:,}円</strong></td></tr>
  </table>
  <p>目標の月1万円に対して {pct:.1f}% です。</p>

  <h2>今週やったこと</h2>
  <ul>
    <li>【ここを埋める】</li>
    <li>【ここを埋める】</li>
    <li>【ここを埋める】</li>
  </ul>

  <h2>わかったこと</h2>
  <p>【ここを埋める。うまくいかなかったことを優先して書く】</p>

  <h2>来週やること</h2>
  <ul>
    <li>【ここを埋める】</li>
  </ul>

  <p>また来週、数字を出します。</p>"""

    page = (TEMPLATE
            .replace("<!--meta {{meta_json}}-->",
                     "<!--meta " + json.dumps(
                         {"title": title, "date": today.isoformat(), "desc": desc, "cat": "検証"},
                         ensure_ascii=False) + "-->")
            .replace("{{title}}", html.escape(title))
            .replace("{{desc}}", html.escape(desc))
            .replace("{{date}} / ショウさん ⌨️", f"{today.isoformat()} / 検証 / ショウさん ⌨️")
            .replace("{{body}}", body))
    page = re.sub(r'  <p><a class="btn-rakuten".*?</p>\n', "", page, flags=re.DOTALL)
    page = page.replace(f"<h1>{html.escape(title)}</h1>\n",
                        f"<h1>{html.escape(title)}</h1>\n"
                        '  <p class="pr-note">数字は実測値です。この記事に広告リンクは含みません。</p>\n\n')

    path = POSTS_DIR / f"{today.isoformat()}-verify-{week:02d}.html"
    path.write_text(page, encoding="utf-8")
    return path


def main() -> None:
    ap = argparse.ArgumentParser(description="検証連載の週次レポート下書きを生成")
    ap.add_argument("--week", type=int, help="週番号(省略時は開始日から自動計算)")
    ap.add_argument("--revenue", type=int, default=0, help="今週までの収益額(円)")
    args = ap.parse_args()

    week = args.week if args.week is not None else max((date.today() - START).days // 7, 0)
    path = build(week, args.revenue)

    from src.publish_post import rebuild_index
    rebuild_index()

    print(f"[weekly] 下書きを作成: {path.relative_to(ROOT)}")
    print("[weekly] 【ここを埋める】の3箇所を書いてから push してください")


if __name__ == "__main__":
    main()
