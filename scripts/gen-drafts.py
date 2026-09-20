import json, re, csv, pathlib

SRC = pathlib.Path("sns/x-drafts.md")
text = SRC.read_text(encoding="utf-8")

def weighted_len(s: str) -> int:
    """X (twitter-text) weighted length: CJK etc. count as 2."""
    n = 0
    for ch in s:
        c = ord(ch)
        if (0x0000 <= c <= 0x10FF or 0x2000 <= c <= 0x200D
                or 0x2010 <= c <= 0x201F or 0x2032 <= c <= 0x2037):
            n += 1
        else:
            n += 2
    return n

# parse "### <id> <title>" blocks
blocks = re.split(r"\n### ", text)[1:]
posts = []
for b in blocks:
    head, _, body = b.partition("\n")
    head = head.strip()
    m = re.match(r"^([A-D]-\d+)\s*(.*)$", head)
    if not m:
        continue
    pid, title = m.group(1), m.group(2).strip()
    # body ends at the next "---" separator line
    body = body.split("\n---")[0]
    # drop trailing "#### ... continued" noise and notes
    body = re.sub(r"\n※.*", "", body, flags=re.S)
    body = body.strip()
    if not body:
        continue
    platform = "threads" if pid.startswith("D") else "x"
    cat = {"A": "claim-check", "B": "series-launch",
           "C": "template", "D": "threads-variant"}[pid[0]]
    wl = weighted_len(body)
    limit = 500 if platform == "threads" else 280
    posts.append({
        "id": pid,
        "title": title,
        "platform": platform,
        "category": cat,
        "body": body,
        "weighted_length": wl,
        "limit": limit,
        "over_limit": wl > limit,
        "has_placeholder": "◯" in body,
        "status": "draft",
    })

pathlib.Path("sns/x-drafts.json").write_text(
    json.dumps({"posts": posts}, ensure_ascii=False, indent=2) + "\n",
    encoding="utf-8")

with open("sns/x-drafts.csv", "w", encoding="utf-8-sig", newline="") as f:
    w = csv.DictWriter(f, fieldnames=["id","platform","category","body",
                                      "weighted_length","over_limit","has_placeholder","status"])
    w.writeheader()
    for p in posts:
        w.writerow({k: p[k] for k in w.fieldnames})

print(f"{len(posts)} posts")
for p in posts:
    flag = "OVER" if p["over_limit"] else "ok  "
    print(f'{flag} {p["id"]:5} {p["platform"]:7} {p["weighted_length"]:4}/{p["limit"]}  {p["title"]}')
