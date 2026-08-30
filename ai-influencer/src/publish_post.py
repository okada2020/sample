"""キューのブログドラフトをサイト(site/)に記事として公開し、トップページを再構築する。

使い方:
  python -m src.publish_post          # 最新キューの1商品目を記事化
  python -m src.publish_post 2        # 最新キューの2商品目を記事化

公開後の内容確認は必須(コミット前に site/posts/ の生成ファイルを読むこと)。
"""
import html
import json
import re
import sys
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUEUE_DIR = ROOT / "data" / "queue"
SITE_DIR = ROOT / "site"
POSTS_DIR = SITE_DIR / "posts"
TEMPLATE = (ROOT / "src" / "templates" / "post.html").read_text(encoding="utf-8")

META_RE = re.compile(r"<!--meta\s+(\{.*?\})\s*-->", re.DOTALL)


def _latest_queue() -> list[dict]:
    files = sorted(QUEUE_DIR.glob("queue_*.json"))
    if not files:
        raise SystemExit("キューがありません。先に `python -m src.pipeline` を実行してください。")
    return json.loads(files[-1].read_text(encoding="utf-8"))


def write_post(entry: dict) -> Path:
    product, content = entry["product"], entry["content"]
    today = date.today().isoformat()
    title = content["blog_title"]
    desc = re.sub(r"<[^>]+>", "", content["blog_html"])[:110].replace("\n", " ")

    page = (
        TEMPLATE.replace("{{meta_json}}", json.dumps({"title": title, "date": today, "desc": desc}, ensure_ascii=False))
        .replace("{{title}}", html.escape(title))
        .replace("{{desc}}", html.escape(desc))
        .replace("{{date}}", today)
        .replace("{{body}}", content["blog_html"])
        .replace("{{product_url}}", product["url"])
        .replace("{{price}}", f"{product['price']:,}")
    )
    POSTS_DIR.mkdir(parents=True, exist_ok=True)
    path = POSTS_DIR / f"{today}-{content['blog_slug']}.html"
    path.write_text(page, encoding="utf-8")
    return path


def rebuild_index() -> None:
    """site/posts/ のメタ情報から index.html の記事一覧を再生成する。"""
    cards = []
    for post in sorted(POSTS_DIR.glob("*.html"), reverse=True):
        m = META_RE.search(post.read_text(encoding="utf-8"))
        if not m:
            continue
        meta = json.loads(m.group(1))
        cards.append(
            '    <li class="card">\n'
            f'      <span class="date">{meta["date"]}</span><br>\n'
            f'      <a class="title" href="/posts/{post.name}">{html.escape(meta["title"])}</a>\n'
            f'      <p>{html.escape(meta["desc"])}</p>\n'
            "    </li>"
        )
    index_path = SITE_DIR / "index.html"
    index = index_path.read_text(encoding="utf-8")
    index = re.sub(
        r"<!-- POSTS:START -->.*<!-- POSTS:END -->",
        "<!-- POSTS:START -->\n" + "\n".join(cards) + "\n<!-- POSTS:END -->",
        index,
        flags=re.DOTALL,
    )
    index_path.write_text(index, encoding="utf-8")


def main() -> None:
    idx = int(sys.argv[1]) - 1 if len(sys.argv) > 1 else 0
    entries = _latest_queue()
    if not (0 <= idx < len(entries)):
        raise SystemExit(f"商品番号は1〜{len(entries)}で指定してください")
    path = write_post(entries[idx])
    rebuild_index()
    print(f"[publish] 記事を作成しました: {path.relative_to(ROOT)}")
    print("[publish] 内容を確認してから git commit / push してください(Cloudflare Pagesが自動デプロイ)")


if __name__ == "__main__":
    main()
