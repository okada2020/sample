"""パイプライン本体: 商品取得 → コンテンツ生成 → 投稿キュー出力。

出力:
  data/queue/queue_YYYY-MM-DD.json  (post_x.py / publish_post.py が読む)
  data/queue/queue_YYYY-MM-DD.md    (人間がコピペ投稿に使う)
"""
import json
from datetime import date
from pathlib import Path

import yaml

from .fetch_products import fetch_candidates
from .generate_content import generate_for_product

ROOT = Path(__file__).resolve().parent.parent
QUEUE_DIR = ROOT / "data" / "queue"


def load_config() -> dict:
    with open(ROOT / "config.yaml", encoding="utf-8") as f:
        return yaml.safe_load(f)


def build_markdown(entries: list[dict], today: str, phase: str) -> str:
    label = "信頼構築期(リンクなし・PR表記なし)" if phase == "trust" else "収益化期(リンクあり・PR表記あり)"
    lines = [f"# 投稿キュー {today}", "", f"**フェーズ: {label}**", ""]
    for i, e in enumerate(entries, 1):
        p, c = e["product"], e["content"]
        lines += [
            f"## {i}. {p['name']}",
            f"- 価格: {p['price']:,}円 / レビュー: {p['review_count']}件(平均{p['review_average']})",
        ]
        if phase == "monetize":
            lines.append(f"- リンク: {p['url']}")
            lines += [
                "",
                "### 楽天ROOM(手動でコピペ投稿)",
                "```",
                c["room_comment"],
                "```",
            ]
        else:
            lines += ["- ※信頼構築期のため、商品リンクは貼りません(カテゴリの選び方として発信)", ""]

        lines.append("### X(自動投稿対象・3パターン)")
        for j, post in enumerate(c["x_posts"], 1):
            lines += [f"**案{j}**", "```", post, "```"]
        lines += [
            "### Instagram",
            "```",
            c["instagram_caption"],
            "```",
            "### Threads",
            "```",
            c["threads_post"],
            "```",
            f"### ブログドラフト: {c['blog_title']}",
            "`python -m src.publish_post` でサイトに反映できます。",
            "",
        ]
    return "\n".join(lines)


def main() -> None:
    cfg = load_config()
    products = fetch_candidates(cfg)[: cfg["max_products_per_run"]]
    if not products:
        print("[pipeline] 条件に合う商品がありませんでした")
        return

    entries = [{"product": p, "content": generate_for_product(p, cfg)} for p in products]

    today = date.today().isoformat()
    QUEUE_DIR.mkdir(parents=True, exist_ok=True)
    (QUEUE_DIR / f"queue_{today}.json").write_text(
        json.dumps(entries, ensure_ascii=False, indent=2), encoding="utf-8"
    )
    (QUEUE_DIR / f"queue_{today}.md").write_text(build_markdown(entries, today, cfg.get("phase", "trust")), encoding="utf-8")
    print(f"[pipeline] キュー出力完了({cfg.get('phase', 'trust')}): "
          f"data/queue/queue_{today}.md ({len(entries)}件)")


if __name__ == "__main__":
    main()
