"""Claude APIでチャネル別コンテンツを生成する。

ANTHROPIC_API_KEY 未設定または DRY_RUN=true のときはテンプレート生成にフォールバック。
ペルソナ定義(docs/persona.md)をそのままシステムプロンプトに使う。
"""
import json
import os
import re
from pathlib import Path

PERSONA_PATH = Path(__file__).resolve().parent.parent / "docs" / "persona.md"

USER_PROMPT = """以下の楽天商品について、各チャネル向けのコンテンツをJSONで生成してください。

商品情報:
- 商品名: {name}
- 価格: {price}円(執筆時点)
- レビュー: {review_count}件 / 平均{review_average}
- 商品説明: {caption}

次のキーを持つJSONオブジェクトだけを出力してください(前後の説明文は不要):
{{
  "room_comment": "楽天ROOM用の紹介文。300字以内。何がどれだけラクになるかを具体的に。正直な注意点も1行",
  "x_posts": ["X用投稿を3パターン。各110字以内。互いに文面を変える。各投稿の末尾に #PR を含める"],
  "instagram_caption": "Instagram用キャプション。冒頭1行で惹きつけ、改行を使い読みやすく。ハッシュタグ5個と #PR を含める",
  "blog_title": "ブログ記事タイトル(32字以内)",
  "blog_slug": "英小文字とハイフンのみのURLスラッグ",
  "blog_html": "ブログ記事本文のHTML断片(h2/h3とpタグ、1200〜2000字)。冒頭に【PR】この記事にはアフィリエイト広告を含みます、の一文を入れる"
}}

制約(必ず守る): 実体験を捏造しない(「使ってみた」禁止、レビューや仕様ベースで書く)。
誇大表現禁止。価格は執筆時点と明記。"""


def _load_persona() -> str:
    return PERSONA_PATH.read_text(encoding="utf-8")


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "item"


def _template(product: dict) -> dict:
    """APIキーなしでの動作確認用のテンプレート生成。"""
    name = product["name"]
    price = product["price"]
    tail = f"({price:,}円・執筆時点)\n{product['url']}\n#PR"
    return {
        "room_comment": (
            f"⌨️{name}\nレビュー{product['review_count']}件・平均{product['review_average']}。"
            f"{product['caption'][:80]}\n価格は{price:,}円(執筆時点)です。※紹介にはPRを含みます"
        ),
        "x_posts": [
            f"きょうの「暮らしのショートカット」⌨️\n{name[:40]} {tail}",
            f"手間をひとつ減らす道具です。\n{name[:40]} {tail}",
            f"レビュー{product['review_count']}件の定番でした。{name[:40]} {tail}",
        ],
        "instagram_caption": (
            f"⌨️きょうの、手間が減るモノ\n\n{name}\n{product['caption'][:100]}\n\n"
            f"価格: {price:,}円(執筆時点)\n\n#PR #時短家電 #便利グッズ #家事分担 #楽天room #暮らしのショートカット"
        ),
        "blog_title": f"{name[:24]}の注目ポイント",
        "blog_slug": _slugify(name)[:40],
        "blog_html": (
            "<p>【PR】この記事にはアフィリエイト広告を含みます。</p>"
            f"<h2>{name}</h2><p>{product['caption']}</p>"
            f"<p>価格は{price:,}円(執筆時点)、レビューは{product['review_count']}件で平均{product['review_average']}です。</p>"
        ),
    }


def _extract_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"JSONが見つかりません: {text[:200]}")
    return json.loads(text[start : end + 1])


def generate_for_product(product: dict, cfg: dict) -> dict:
    if os.environ.get("DRY_RUN", "").lower() == "true" or not os.environ.get("ANTHROPIC_API_KEY"):
        print(f"[generate] テンプレート生成: {product['name'][:30]}")
        return _template(product)

    import anthropic

    client = anthropic.Anthropic()
    try:
        response = client.messages.create(
            model="claude-opus-5",
            max_tokens=16000,
            system=[
                {
                    "type": "text",
                    "text": _load_persona(),
                    "cache_control": {"type": "ephemeral"},
                }
            ],
            messages=[{"role": "user", "content": USER_PROMPT.format(**product)}],
        )
        if response.stop_reason == "refusal":
            print(f"[generate] モデルが生成を辞退したためテンプレートで代替: {product['name'][:30]}")
            return _template(product)
        text = "".join(b.text for b in response.content if b.type == "text")
        result = _extract_json(text)
    except Exception as e:  # 日次cronを止めないため、失敗時はテンプレートで継続
        print(f"[generate] 生成失敗({e})。テンプレートで代替: {product['name'][:30]}")
        return _template(product)

    # PR表記の最終保証
    result["x_posts"] = [p if "#PR" in p else f"{p}\n#PR" for p in result.get("x_posts", [])]
    if "#PR" not in result.get("instagram_caption", ""):
        result["instagram_caption"] = result.get("instagram_caption", "") + "\n#PR"
    result.setdefault("blog_slug", _slugify(product["name"])[:40])
    print(f"[generate] Claude生成完了: {product['name'][:30]}")
    return result
