"""Claude APIでチャネル別コンテンツを生成する。

ANTHROPIC_API_KEY 未設定または DRY_RUN=true のときはテンプレート生成にフォールバック。
ペルソナ定義(docs/persona.md)をそのままシステムプロンプトに使う。

フェーズ(config.yaml の phase)で生成物が変わる:
  trust    … アフィリエイトリンクなし/PR表記なし。役立つ情報だけ(信頼構築期)
  monetize … 商品リンクあり/PR表記必須(収益化期)
"""
import json
import os
import re
from pathlib import Path

PERSONA_PATH = Path(__file__).resolve().parent.parent / "docs" / "persona.md"

COMMON_KEYS = """  "x_posts": ["X用投稿を3パターン。各110字以内。互いに文面を大きく変える"],
  "instagram_caption": "Instagram用キャプション。冒頭1行で惹きつけ、改行を使い読みやすく。ハッシュタグ5個",
  "threads_post": "Threads用投稿。280字以内。Xより少しゆるく、独り言のようなトーンで",
  "blog_title": "ブログ記事タイトル(32字以内)",
  "blog_slug": "英小文字とハイフンのみのURLスラッグ","""

TRUST_PROMPT = """いまは【信頼構築期(フェーズ1)】です。**商品を売り込まないでください。**
アフィリエイトリンクは貼らず、PR表記も入れません。読んだ人の役に立つ情報だけを書きます。

参考にする商品カテゴリ:
- 商品名: {name}
- 価格帯の参考: {price}円前後
- 商品説明: {caption}

この商品「そのもの」を売るのではなく、**このカテゴリの「選び方」や「注意点」**を扱ってください。
特定商品の購入誘導はしないこと。

次のキーを持つJSONオブジェクトだけを出力してください(前後の説明文は不要):
{{
{common}
  "blog_html": "ブログ記事本文のHTML断片(h2/h3とpタグ、1200〜2000字)。このカテゴリの選び方・失敗しないポイント・要らないケースを扱う。特定商品へのリンクや購入誘導は入れない"
}}

制約(必ず守る): 一人称は「俺」。若者言葉は1投稿に1〜2個まで。
実体験を捏造しない(「使ってみた」禁止、レビューや仕様ベースで書く)。誇大表現禁止。
価格に触れるときは「執筆時点」と明記。**PR表記は入れない**(広告ではないため)。"""

MONETIZE_PROMPT = """いまは【収益化期(フェーズ2)】です。商品を紹介し、リンクを貼ります。

商品情報:
- 商品名: {name}
- 価格: {price}円(執筆時点)
- レビュー: {review_count}件 / 平均{review_average}
- 商品説明: {caption}

次のキーを持つJSONオブジェクトだけを出力してください(前後の説明文は不要):
{{
  "room_comment": "楽天ROOM用の紹介文。300字以内。何がどれだけラクになるかを具体的に。正直な注意点も1行",
{common}
  "blog_html": "ブログ記事本文のHTML断片(h2/h3とpタグ、1200〜2000字)。冒頭に【PR】この記事にはアフィリエイト広告を含みます、の一文を入れる"
}}

制約(必ず守る): 一人称は「俺」。若者言葉は1投稿に1〜2個まで。
実体験を捏造しない(「使ってみた」禁止、レビューや仕様ベースで書く)。誇大表現禁止。
価格は執筆時点と明記。**x_posts・instagram_caption・threads_post には必ず #PR を含める**。"""


def _load_persona() -> str:
    return PERSONA_PATH.read_text(encoding="utf-8")


def _slugify(name: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")
    return slug or "item"


def _template(product: dict, phase: str) -> dict:
    """APIキーなしでの動作確認用のテンプレート生成。"""
    name = product["name"]
    price = product["price"]
    short = name[:40]

    if phase == "trust":
        return {
            "x_posts": [
                f"{short}まわり、選ぶときは「W数」「規格」「置き場所」だけ見ればだいたい外さない。スペック表の細かい数字はぶっちゃけ見なくていい ⌨️",
                f"{short}の話。レビュー{product['review_count']}件くらい積まれてる定番は、だいたい理由がある。奇をてらわないほうが勝ち確だと思ってる",
                f"買う前にサイズ測らずに詰むやつ、俺だけじゃないはず。{short}を検討してる人はメジャー先に出しとこう",
            ],
            "instagram_caption": (
                f"⌨️{short}を選ぶときに見るところ\n\n"
                "・数字より「何が減るか」\n・置き場所は先に測る\n・レビュー件数が積まれてる定番は理由がある\n\n"
                "一人暮らしだと置き場所がいちばんの制約。ここ外すとまじで詰む。\n\n"
                "#暮らしのショートカット #時短家電 #便利グッズ #一人暮らし #家事の時短"
            ),
            "threads_post": (
                f"{short}、スペック比べだすとキリないんだけど、\n"
                "結局「これで自分の手間が何分減るか」だけなんだよな。\n"
                "数字で選ぶと満足度バグるから気をつけたい。知らんけど。"
            ),
            "blog_title": f"{name[:20]}の選び方",
            "blog_slug": _slugify(name)[:40],
            "blog_html": (
                f"<h2>{name[:24]}を選ぶときに見るところ</h2>"
                f"<p>{product['caption']}</p>"
                "<h2>先に置き場所を測る</h2><p>一人暮らしだと設置スペースが最大の制約になる。買う前にメジャーを出しておくと失敗が減る。</p>"
                "<h2>こういう人は要らない</h2><p>使う頻度が週1未満なら、無理に買わなくていい。手間が減らないなら意味がない。</p>"
            ),
        }

    tail = f"({price:,}円・執筆時点)\n{product['url']}\n#PR"
    return {
        "room_comment": (
            f"⌨️{name}\nレビュー{product['review_count']}件・平均{product['review_average']}。"
            f"{product['caption'][:80]}\n価格は{price:,}円(執筆時点)。※紹介にはPRを含みます"
        ),
        "x_posts": [
            f"きょうの「暮らしのショートカット」⌨️\n{short} {tail}",
            f"手間をひとつ減らす道具。{short} {tail}",
            f"レビュー{product['review_count']}件の定番だった。{short} {tail}",
        ],
        "instagram_caption": (
            f"⌨️きょうの、手間が減るモノ\n\n{name}\n{product['caption'][:100]}\n\n"
            f"価格: {price:,}円(執筆時点)\n\n#PR #時短家電 #便利グッズ #一人暮らし #楽天room #暮らしのショートカット"
        ),
        "threads_post": (
            f"{short}\n{product['caption'][:80]}\n"
            f"{price:,}円(執筆時点)。置き場所だけ先に測っといたほうがいい。\n#PR\n{product['url']}"
        ),
        "blog_title": f"{name[:24]}の注目ポイント",
        "blog_slug": _slugify(name)[:40],
        "blog_html": (
            "<p>【PR】この記事にはアフィリエイト広告を含みます。</p>"
            f"<h2>{name}</h2><p>{product['caption']}</p>"
            f"<p>価格は{price:,}円(執筆時点)、レビューは{product['review_count']}件で平均{product['review_average']}。</p>"
        ),
    }


def _extract_json(text: str) -> dict:
    text = re.sub(r"^```(?:json)?|```$", "", text.strip(), flags=re.MULTILINE)
    start, end = text.find("{"), text.rfind("}")
    if start == -1 or end == -1:
        raise ValueError(f"JSONが見つかりません: {text[:200]}")
    return json.loads(text[start : end + 1])


def generate_for_product(product: dict, cfg: dict) -> dict:
    phase = cfg.get("phase", "trust")

    if os.environ.get("DRY_RUN", "").lower() == "true" or not os.environ.get("ANTHROPIC_API_KEY"):
        print(f"[generate] テンプレート生成({phase}): {product['name'][:30]}")
        return _template(product, phase)

    import anthropic

    prompt = (TRUST_PROMPT if phase == "trust" else MONETIZE_PROMPT).format(
        common=COMMON_KEYS, **product
    )
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
            messages=[{"role": "user", "content": prompt}],
        )
        if response.stop_reason == "refusal":
            print(f"[generate] モデルが生成を辞退したためテンプレートで代替: {product['name'][:30]}")
            return _template(product, phase)
        text = "".join(b.text for b in response.content if b.type == "text")
        result = _extract_json(text)
    except Exception as e:  # 日次cronを止めないため、失敗時はテンプレートで継続
        print(f"[generate] 生成失敗({e})。テンプレートで代替: {product['name'][:30]}")
        return _template(product, phase)

    if phase == "monetize":
        # PR表記の最終保証(リンクを貼るフェーズのみ)
        result["x_posts"] = [p if "#PR" in p else f"{p}\n#PR" for p in result.get("x_posts", [])]
        for key in ("instagram_caption", "threads_post"):
            if "#PR" not in result.get(key, ""):
                result[key] = result.get(key, "") + "\n#PR"

    result.setdefault("blog_slug", _slugify(product["name"])[:40])
    print(f"[generate] Claude生成完了({phase}): {product['name'][:30]}")
    return result
