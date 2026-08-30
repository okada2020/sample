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

CAT_SLUGS = {
    "選び方": "guide",
    "これは要らん": "skip",
    "AIでやってみた": "ai-lab",
    "アプリ開発": "app-dev",
    "日用品": "daily-goods",
    "お知らせ": "news",
}


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


def _all_posts() -> list[tuple[str, dict]]:
    """公開済み記事を新しい順に (ファイル名, メタ) で返す。"""
    out = []
    for post in sorted(POSTS_DIR.glob("*.html"), reverse=True):
        m = META_RE.search(post.read_text(encoding="utf-8"))
        if m:
            out.append((post.name, json.loads(m.group(1))))
    return out


def _card(name: str, meta: dict) -> str:
    cat = meta.get("cat", "")
    label = f'{meta["date"]}　{cat}' if cat else meta["date"]
    return (
        '    <li class="card">\n'
        f'      <span class="date">{html.escape(label)}</span><br>\n'
        f'      <a class="title" href="/posts/{name}">{html.escape(meta["title"])}</a>\n'
        f'      <p>{html.escape(meta["desc"])}</p>\n'
        "    </li>"
    )


def _replace_posts(page: str, cards: list[str]) -> str:
    return re.sub(
        r"<!-- POSTS:START -->.*<!-- POSTS:END -->",
        "<!-- POSTS:START -->\n" + "\n".join(cards) + "\n<!-- POSTS:END -->",
        page,
        flags=re.DOTALL,
    )


def rebuild_index() -> None:
    """記事一覧(トップ)とカテゴリページを再生成する。"""
    posts = _all_posts()

    index_path = SITE_DIR / "index.html"
    index_path.write_text(
        _replace_posts(index_path.read_text(encoding="utf-8"), [_card(n, m) for n, m in posts]),
        encoding="utf-8",
    )

    # カテゴリページ(index.htmlを雛形に生成)
    template = index_path.read_text(encoding="utf-8")
    cats: dict[str, list] = {}
    for name, meta in posts:
        cats.setdefault(meta.get("cat", "その他"), []).append((name, meta))

    cat_dir = SITE_DIR / "category"
    cat_dir.mkdir(exist_ok=True)
    for cat, items in cats.items():
        slug = CAT_SLUGS.get(cat, "other")
        page = template.replace("<title>暮らしのショートカット", f"<title>{cat} | 暮らしのショートカット")
        page = page.replace("<h1>新着記事</h1>", f"<h1>{cat}</h1>")
        page = page.replace('href="/style.css"', 'href="/style.css"')
        page = _replace_posts(page, [_card(n, m) for n, m in items])
        (cat_dir / f"{slug}.html").write_text(page, encoding="utf-8")
    print(f"[publish] カテゴリページ {len(cats)}件 を生成")


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
