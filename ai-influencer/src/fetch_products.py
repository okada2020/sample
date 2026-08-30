"""楽天ランキング/商品検索APIから候補商品を取得する。

RAKUTEN_APP_ID 未設定または DRY_RUN=true のときはサンプルデータを返すので、
キーなしでもパイプライン全体の動作確認ができる。
"""
import os
import time

import requests

RANKING_URL = "https://app.rakuten.co.jp/services/api/IchibaItem/Ranking/20220601"
SEARCH_URL = "https://app.rakuten.co.jp/services/api/IchibaItem/Search/20220601"

SAMPLE_ITEMS = [
    {
        "name": "急速充電器 Type-C PD20W対応 ACアダプター(サンプルデータ)",
        "price": 1280,
        "url": "https://item.rakuten.co.jp/sample/quick-charger/",
        "shop": "サンプルストア",
        "review_count": 1200,
        "review_average": 4.5,
        "caption": "PD20W対応でスマホを約30分で50%まで充電。小型軽量で持ち運びにも。",
        "image": "",
    },
    {
        "name": "ワイヤレス充電器 15W 3in1スタンド(サンプルデータ)",
        "price": 2650,
        "url": "https://item.rakuten.co.jp/sample/wireless-charger/",
        "shop": "サンプルストア",
        "review_count": 800,
        "review_average": 4.3,
        "caption": "置くだけでスマホ・イヤホン・ウォッチを同時充電。ケーブルの抜き差しが不要に。",
        "image": "",
    },
    {
        "name": "キッチン シンク下 スライド収納ラック(サンプルデータ)",
        "price": 3480,
        "url": "https://item.rakuten.co.jp/sample/sink-rack/",
        "shop": "サンプルストア",
        "review_count": 450,
        "review_average": 4.4,
        "caption": "奥のものが引き出して取れるスライド式。デッドスペースを収納に変える。",
        "image": "",
    },
]


def _is_dry_run() -> bool:
    return os.environ.get("DRY_RUN", "").lower() == "true"


def _normalize(entry: dict) -> dict:
    it = entry["Item"]
    return {
        "name": it["itemName"],
        "price": int(it["itemPrice"]),
        # affiliateId をリクエストに渡していれば affiliateUrl が返る
        "url": it.get("affiliateUrl") or it["itemUrl"],
        "shop": it.get("shopName", ""),
        "review_count": int(it.get("reviewCount", 0) or 0),
        "review_average": float(it.get("reviewAverage", 0.0) or 0.0),
        "caption": (it.get("itemCaption") or "")[:400],
        "image": (it.get("mediumImageUrls") or [{}])[0].get("imageUrl", ""),
    }


def _get(url: str, params: dict) -> list[dict]:
    res = requests.get(url, params=params, timeout=30)
    time.sleep(1)  # 楽天APIのレート制限(1req/秒)
    if res.status_code != 200:
        print(f"[fetch] {url} -> HTTP {res.status_code}: {res.text[:200]}")
        return []
    return [_normalize(e) for e in res.json().get("Items", [])]


def fetch_candidates(cfg: dict) -> list[dict]:
    """設定に従って候補商品を取得し、条件でフィルタして返す。"""
    app_id = os.environ.get("RAKUTEN_APP_ID")
    if _is_dry_run() or not app_id:
        print("[fetch] DRY RUN(またはRAKUTEN_APP_ID未設定): サンプルデータを使用")
        return list(SAMPLE_ITEMS)

    base = {"format": "json", "applicationId": app_id}
    affiliate_id = os.environ.get("RAKUTEN_AFFILIATE_ID")
    if affiliate_id:
        base["affiliateId"] = affiliate_id

    items: list[dict] = []
    for genre_id in cfg["rakuten"].get("genre_ids", []):
        items += _get(RANKING_URL, {**base, "genreId": genre_id})
    for keyword in cfg["rakuten"].get("keywords", []):
        items += _get(SEARCH_URL, {**base, "keyword": keyword, "hits": 10, "sort": "standard"})

    seen: set[str] = set()
    picked = []
    for it in items:
        if it["url"] in seen:
            continue
        seen.add(it["url"])
        if not (cfg["price_min"] <= it["price"] <= cfg["price_max"]):
            continue
        if it["review_count"] < cfg["min_review_count"]:
            continue
        if it["review_average"] < cfg["min_review_average"]:
            continue
        picked.append(it)

    picked.sort(key=lambda x: x["review_count"], reverse=True)
    print(f"[fetch] 候補 {len(items)} 件 → 条件通過 {len(picked)} 件")
    return picked
