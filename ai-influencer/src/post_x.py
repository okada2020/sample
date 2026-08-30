"""X(Twitter) API v2への投稿。既定はドライラン(X_POST_ENABLED=true で実投稿)。

最新のキューから、まだ投稿していない商品を1件だけ投稿する(スパム回避のため控えめに)。
文面は3パターンから日替わりで選び、同一文面の連投を避ける。
"""
import json
import os
from datetime import date
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
QUEUE_DIR = ROOT / "data" / "queue"
POSTED_PATH = ROOT / "data" / "posted_x.json"
TWEET_URL = "https://api.twitter.com/2/tweets"


def _latest_queue() -> list[dict]:
    files = sorted(QUEUE_DIR.glob("queue_*.json"))
    if not files:
        raise SystemExit("キューがありません。先に `python -m src.pipeline` を実行してください。")
    return json.loads(files[-1].read_text(encoding="utf-8"))


def _load_posted() -> set[str]:
    if POSTED_PATH.exists():
        return set(json.loads(POSTED_PATH.read_text(encoding="utf-8")))
    return set()


def _save_posted(posted: set[str]) -> None:
    POSTED_PATH.write_text(json.dumps(sorted(posted), ensure_ascii=False), encoding="utf-8")


def main() -> None:
    entries = _latest_queue()
    posted = _load_posted()
    target = next((e for e in entries if e["product"]["url"] not in posted), None)
    if target is None:
        print("[post_x] 未投稿の商品がありません")
        return

    variants = target["content"]["x_posts"]
    text = variants[date.today().toordinal() % len(variants)]
    url = target["product"]["url"]
    if url not in text:
        text = f"{text}\n{url}"

    if os.environ.get("X_POST_ENABLED", "").lower() != "true":
        print("[post_x] ドライラン(X_POST_ENABLED=true で実投稿)。投稿予定の文面:")
        print(text)
        return

    from requests_oauthlib import OAuth1Session

    session = OAuth1Session(
        os.environ["X_API_KEY"],
        os.environ["X_API_SECRET"],
        os.environ["X_ACCESS_TOKEN"],
        os.environ["X_ACCESS_TOKEN_SECRET"],
    )
    res = session.post(TWEET_URL, json={"text": text}, timeout=30)
    if res.status_code != 201:
        raise SystemExit(f"[post_x] 投稿失敗 HTTP {res.status_code}: {res.text}")

    posted.add(url)
    _save_posted(posted)
    print(f"[post_x] 投稿完了: {res.json()['data']['id']}")


if __name__ == "__main__":
    main()
