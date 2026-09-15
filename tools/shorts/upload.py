#!/usr/bin/env python3
"""Upload the built Shorts to YouTube.

Reads titles, descriptions and tags from clips.json and uploads the matching
MP4 from out/. The first run opens a browser for Google sign-in and stores the
refresh token in token.json; later runs need no interaction.

    python3 upload.py kettle                  # upload one, private
    python3 upload.py                         # upload every built topic
    python3 upload.py kettle --privacy public
    python3 upload.py kettle --publish-at 2026-09-20T09:00:00Z

Set up credentials once, see README.md. Nothing here is uploaded until you ask:
the default privacy is private, so a bad take never goes out publicly.
"""

from __future__ import annotations

import argparse
import json
from pathlib import Path

from google.auth.transport.requests import Request
from google.oauth2.credentials import Credentials
from google_auth_oauthlib.flow import InstalledAppFlow
from googleapiclient.discovery import build
from googleapiclient.http import MediaFileUpload

HERE = Path(__file__).resolve().parent
OUT = HERE / "out"
CLIENT_SECRET = HERE / "client_secret.json"
TOKEN = HERE / "token.json"
SCOPES = ["https://www.googleapis.com/auth/youtube.upload"]


def get_service():
    if not CLIENT_SECRET.exists():
        raise SystemExit(
            f"{CLIENT_SECRET.name} not found. Follow the OAuth setup in README.md first."
        )
    creds = None
    if TOKEN.exists():
        creds = Credentials.from_authorized_user_file(str(TOKEN), SCOPES)
    if not creds or not creds.valid:
        if creds and creds.expired and creds.refresh_token:
            creds.refresh(Request())
        else:
            flow = InstalledAppFlow.from_client_secrets_file(str(CLIENT_SECRET), SCOPES)
            creds = flow.run_local_server(port=0)
        TOKEN.write_text(creds.to_json(), encoding="utf-8")
        TOKEN.chmod(0o600)
    return build("youtube", "v3", credentials=creds)


def upload_one(service, topic: dict, defaults: dict, privacy: str, publish_at: str | None) -> str:
    path = OUT / f"{topic['id']}.mp4"
    if not path.exists():
        raise SystemExit(f"{path} not found. Run build.py first.")

    status: dict[str, object] = {
        "privacyStatus": privacy,
        "selfDeclaredMadeForKids": False,
    }
    if publish_at:
        # Scheduling requires the video to start private.
        status["privacyStatus"] = "private"
        status["publishAt"] = publish_at

    body = {
        "snippet": {
            "title": topic["title"],
            "description": topic["description"],
            "tags": topic.get("tags", defaults.get("tags", [])),
            "categoryId": topic.get("category_id", defaults.get("category_id", "27")),
        },
        "status": status,
    }

    media = MediaFileUpload(str(path), chunksize=4 * 1024 * 1024, resumable=True, mimetype="video/mp4")
    request = service.videos().insert(part="snippet,status", body=body, media_body=media)

    print(f"[{topic['id']}] uploading {path.name}")
    response = None
    while response is None:
        progress, response = request.next_chunk()
        if progress:
            print(f"  {int(progress.progress() * 100)}%")

    video_id = response["id"]
    print(f"  done: https://www.youtube.com/watch?v={video_id}")
    return video_id


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("topics", nargs="*", help="topic ids to upload (default: all built)")
    parser.add_argument("--privacy", default=None, choices=["private", "unlisted", "public"])
    parser.add_argument("--publish-at", default=None,
                        help="RFC3339 UTC time to go public, e.g. 2026-09-20T09:00:00Z")
    parser.add_argument("--manifest", default=str(HERE / "clips.json"))
    args = parser.parse_args()

    manifest = json.loads(Path(args.manifest).read_text(encoding="utf-8"))
    defaults = manifest.get("defaults", {})
    privacy = args.privacy or defaults.get("privacy", "private")

    wanted = set(args.topics)
    topics = [t for t in manifest["topics"] if not wanted or t["id"] in wanted]
    unknown = wanted - {t["id"] for t in manifest["topics"]}
    if unknown:
        raise SystemExit(f"unknown topic id(s): {', '.join(sorted(unknown))}")
    if not wanted:
        topics = [t for t in topics if (OUT / f"{t['id']}.mp4").exists()]
        if not topics:
            raise SystemExit("nothing built yet. Run build.py first.")

    service = get_service()
    for topic in topics:
        upload_one(service, topic, defaults, privacy, args.publish_at)


if __name__ == "__main__":
    main()
