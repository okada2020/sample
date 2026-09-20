#!/usr/bin/env python3
"""Inject a scene JSON into the previz template and write a standalone HTML page.

Usage:
    python build.py <scene.json> <out.html>

The template lives next to this script at ../assets/previz-template.html and
contains two placeholders: __SCENE_JSON__ (the JSON object, inlined as a JS
literal) and __TITLE__ (the page <title>, taken from scene["title"]).
"""
import json
import pathlib
import sys


def main(argv: list[str]) -> int:
    if len(argv) != 3:
        print(__doc__, file=sys.stderr)
        return 2
    scene_path, out_path = pathlib.Path(argv[1]), pathlib.Path(argv[2])
    template = (pathlib.Path(__file__).resolve().parent.parent / "assets" / "previz-template.html").read_text(encoding="utf-8")
    scene = json.loads(scene_path.read_text(encoding="utf-8"))
    # `</script>` inside a string would end the inline script early; escape the slash.
    inline = json.dumps(scene, ensure_ascii=False).replace("</", "<\\/")
    html = template.replace("__SCENE_JSON__", inline).replace("__TITLE__", scene.get("title", "プリビズ"))
    out_path.write_text(html, encoding="utf-8")
    print(f"wrote {out_path} ({len(html):,} bytes, {len(scene.get('cuts', []))} cuts)")
    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv))
