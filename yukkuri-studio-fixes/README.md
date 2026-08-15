# Yukkuri Studio v0.3.0 修正パッチ

レビューで指摘した問題に対する修正コードです。

> **注意:** 提供されたのはコンパイル済みの `.app`（arm64 Mach-O バイナリ）のみで、
> Swift ソースコードは含まれていませんでした。そのため以下のコードは、バイナリの
> Swift リフレクションメタデータから**復元したデータモデルに基づいて書いたもの**です。
> コンパイル検証は行えていません（レビュー環境は Linux で、AppKit / AVFoundation /
> SwiftUI が存在しないため）。実際のソースへ統合する際は調整が必要です。

## 復元したデータモデル（このパッチの前提）

```swift
MovieProject { title, canvasWidth, canvasHeight, framesPerSecond,
               speakers, dialogues, images, bgmClips, subtitleStyle }
Speaker      { id, name, colorHex, speechRate, standingImagePath }
Dialogue     { id, speakerID, text, startTime, duration, audioFilePath }
ImageClip    { id, filePath, layer, startTime, duration, … }
AudioClip    { id, filePath, startTime, duration, volume, isMuted }
```

`Dialogue` / `ImageClip` / `AudioClip` の `id` は `Identifiable` 準拠から推定したものです。
実際のフィールド名が異なる場合は、そこだけ読み替えてください。

---

## 修正内容

| # | 問題 | ファイル |
|---|---|---|
| 1 | 生成音声が一時ディレクトリに置かれ、保存済みプロジェクトが壊れる | `StudioStorage.swift` |
| 4 | 話者ごとに声を変えられない | `VoiceCatalog.swift` / `Speaker+Voice.swift` / `SpeechAudioGenerator.swift` |
| 5 | Undo / Redo が無い | `UndoHistory.swift` / `EditorStore+Undo.swift` |
| 6 | 自動保存が無い・素材が絶対パス参照 | `AutosaveController.swift` / `ProjectPortability.swift` |
| 2,3 | ad-hoc 署名・arm64 専用ビルド | `scripts/build_app.sh` |

---

### 1. 音声の保存先（最優先）

生成音声を `FileManager.temporaryDirectory` から
`~/Library/Application Support/YukkuriStudio/GeneratedAudio/` へ移します。
macOS が一時ディレクトリを自動削除するため、従来は再起動や数日の経過で
保存済みプロジェクトの音声が消えていました。

アプリ起動時に一度だけ以下を呼ぶと、まだ残っている旧データを引き継げます。

```swift
StudioStorage.migrateLegacyAudioIfNeeded()
```

### 4. 話者ごとのボイス

`Speaker` に `voiceIdentifier` / `pitchMultiplier` / `volume` を追加します。
`init(from:)` を手書きしてあるので、**v0.3.0 で保存した既存プロジェクトもそのまま開けます**。

インスペクタに追加するピッカー:

```swift
Picker("声", selection: $speaker.voiceIdentifier) {
    Text("既定").tag(String?.none)
    ForEach(VoiceCatalog.japaneseVoices()) { voice in
        Text(voice.displayName).tag(String?.some(voice.id))
    }
}
Slider(value: $speaker.pitchMultiplier, in: 0.5...2.0) { Text("声の高さ") }
```

話者を新規追加するときは、既存と重複しない声を自動で割り当てられます。

```swift
let used = Set(project.speakers.compactMap(\.voiceIdentifier))
newSpeaker.voiceIdentifier = VoiceCatalog.suggestedIdentifier(excluding: used)
```

なお、これは macOS 標準の日本語 TTS であり、AquesTalk 系の「ゆっくりボイス」とは
別物です。本家に近い音を出したい場合は別途 SoftTalk / AquesTalk 系エンジンの
組み込みを検討してください（ライセンス条件の確認が必要です）。

### 5. Undo / Redo

`MovieProject` は Codable な値型なので、変更前の状態を丸ごと積む
スナップショット方式にしています。個々の変更を記録する方式と違い、**記録漏れが起きません**。

`EditorStore` クラス本体へ次を追加してください（extension には格納プロパティを置けません）。

```swift
let undoHistory = UndoHistory<MovieProject>()
private let autosave = AutosaveController()
```

そのうえで `project` を直接書き換えている箇所を `mutate { }` 経由へ置き換えます。

```swift
// 変更前
project.images[index].startX = newValue

// 変更後
mutate { $0.images[index].startX = newValue }

// ドラッグ中（連続する変更を 1 ステップにまとめる）
mutate(token: "drag-image-\(id)") { $0.images[index].startX = newValue }
// マウスアップ時
endDrag()
```

`YukkuriStudioApp.swift` の Scene へ `.commands { UndoCommands(store: store) }` を追加すると
⌘Z / ⌘⇧Z がメニューバーに入ります。

### 6. 自動保存と素材パス

**自動保存** — 最後の変更から 3 秒後に 1 回だけ書き込みます。
起動時に `autosave.pendingRecovery()` が nil でなければ復元を提案してください。
明示保存が成功したら `autosave.clear()` を呼びます。

**素材パス** — 保存時に素材を `<プロジェクト名>.assets/` へ集めて相対パス化します。

```swift
// 保存時
let portable = try ProjectPortability.collectingAssets(of: project, savingTo: url)
try encoder.encode(portable).write(to: url, options: .atomic)
autosave.clear()

// 読み込み時
var loaded = try decoder.decode(MovieProject.self, from: data)
loaded = ProjectPortability.resolvingAssets(of: loaded, loadedFrom: url)

let missing = ProjectPortability.missingAssets(of: loaded)
if !missing.isEmpty {
    statusMessage = "見つからない素材が \(missing.count) 件あります"
}
```

これでプロジェクトファイルと `.assets` フォルダをセットで移動・コピーしても壊れません。

### 2 / 3. ビルドと配布

```bash
# 自分の Mac 用（ad-hoc 署名）
./scripts/build_app.sh

# 配布用（Developer ID 署名 + Hardened Runtime）
DEV_ID="Developer ID Application: Your Name (TEAMID)" ./scripts/build_app.sh
```

ユニバーサルバイナリ化（Intel 対応）、アイコン組み込み、`strip` による
ビルドパス（`/Users/<名前>/…`）の除去も含めています。
他人へ配布するには公証まで必要で、手順はスクリプトの出力に表示されます。

---

## 統合の進め方

1. `Sources/` のファイルを `Sources/YukkuriStudio/` へコピー
2. 既存の `SpeechAudioGenerator.swift` を差し替え、`Models.swift` の `Speaker` を置換
3. `EditorStore` へ 2 つの格納プロパティを追加
4. `project` の直接書き換えを `mutate { }` へ置換
5. `swift build` でコンパイルを通す

**ソース一式（`Sources/` と `Package.swift`）を push していただければ、
統合まで済ませた状態でコミットできます。**
