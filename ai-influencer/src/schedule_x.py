"""X の予約投稿。キューの先頭から1本ずつ投稿する。

GitHub Actions が週3回(月・水・金 6:30 JST)に実行し、
data/x_queue.yaml の未投稿の先頭を1本だけ投稿する。
reply があれば30秒後にぶら下げる(滞在時間が伸びて初速が上がるため)。

既定はドライラン。実投稿するには X_POST_ENABLED=true。

  python -m src.schedule_x           # ドライラン(次に何が投稿されるか確認)
  python -m src.schedule_x --status  # 残り本数と次の投稿を表示するだけ
"""
import argparse
import json
import os
import sys
import time
from datetime import datetime, timezone
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
QUEUE_PATH = ROOT / "data" / "x_queue.yaml"
STATE_PATH = ROOT / "data" / "x_posted.json"
TWEET_URL = "https://api.twitter.com/2/tweets"
REPLY_DELAY_SEC = 30


def load_queue() -> list[dict]:
    if not QUEUE_PATH.exists():
        raise SystemExit(f"キューがありません: {QUEUE_PATH}")
    items = yaml.safe_load(QUEUE_PATH.read_text(encoding="utf-8")) or []
    for i, it in enumerate(items):
        if not isinstance(it, dict) or not it.get("text", "").strip():
            raise SystemExit(f"キューの{i + 1}件目に text がありません")
    return items


def load_state() -> dict:
    if STATE_PATH.exists():
        return json.loads(STATE_PATH.read_text(encoding="utf-8"))
    return {"posted": 0, "history": []}


def save_state(state: dict) -> None:
    STATE_PATH.parent.mkdir(parents=True, exist_ok=True)
    STATE_PATH.write_text(json.dumps(state, ensure_ascii=False, indent=2), encoding="utf-8")


def _session():
    from requests_oauthlib import OAuth1Session

    missing = [k for k in ("X_API_KEY", "X_API_SECRET", "X_ACCESS_TOKEN", "X_ACCESS_TOKEN_SECRET")
               if not os.environ.get(k)]
    if missing:
        raise SystemExit(f"環境変数が未設定です: {', '.join(missing)}")
    return OAuth1Session(
        os.environ["X_API_KEY"], os.environ["X_API_SECRET"],
        os.environ["X_ACCESS_TOKEN"], os.environ["X_ACCESS_TOKEN_SECRET"],
    )


def _tweet(session, text: str, reply_to: str | None = None) -> str:
    payload: dict = {"text": text}
    if reply_to:
        payload["reply"] = {"in_reply_to_tweet_id": reply_to}
    res = session.post(TWEET_URL, json=payload, timeout=30)
    if res.status_code != 201:
        raise SystemExit(f"投稿失敗 HTTP {res.status_code}: {res.text[:300]}")
    return res.json()["data"]["id"]


def main() -> None:
    ap = argparse.ArgumentParser(description="Xの予約投稿(キューの先頭を1本投稿)")
    ap.add_argument("--status", action="store_true", help="投稿せず残数と次の内容だけ表示")
    args = ap.parse_args()

    queue, state = load_queue(), load_state()
    idx = state["posted"]
    remaining = len(queue) - idx

    print(f"[schedule_x] キュー {len(queue)}本 / 投稿済み {idx}本 / 残り {remaining}本")
    if remaining <= 3:
        print("⚠ 残りが3本以下です。post-bank.md から data/x_queue.yaml に補充してください。")
    if remaining <= 0:
        print("[schedule_x] 投稿できるものがありません。終了します。")
        return

    item = queue[idx]
    text, reply = item["text"].strip(), (item.get("reply") or "").strip()

    if args.status:
        print("\n--- 次に投稿される内容 ---\n" + text)
        if reply:
            print("\n--- ぶら下げる補足 ---\n" + reply)
        return

    if os.environ.get("X_POST_ENABLED", "").lower() != "true":
        print("[schedule_x] ドライラン(X_POST_ENABLED=true で実投稿)\n")
        print("--- 本文 ---\n" + text)
        if reply:
            print("\n--- 補足(30秒後にぶら下げ) ---\n" + reply)
        return

    session = _session()
    tweet_id = _tweet(session, text)
    print(f"[schedule_x] 投稿しました: https://x.com/aishow_yoshioka/status/{tweet_id}")

    if reply:
        time.sleep(REPLY_DELAY_SEC)
        reply_id = _tweet(session, reply, reply_to=tweet_id)
        print(f"[schedule_x] 補足をぶら下げました: {reply_id}")

    state["posted"] = idx + 1
    state["history"].append({
        "index": idx,
        "tweet_id": tweet_id,
        "at": datetime.now(timezone.utc).isoformat(timespec="seconds"),
    })
    save_state(state)
    print(f"[schedule_x] 残り {len(queue) - state['posted']}本")


if __name__ == "__main__":
    main()
