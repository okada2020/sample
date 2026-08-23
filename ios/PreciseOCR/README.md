# 高精度 OCR カメラ（PreciseOCR）

iPhone のカメラで撮った文字を、できるだけ正確にテキスト化するネイティブ iOS アプリです。
認識は Apple の **Vision** フレームワーク（`VNRecognizeTextRequest`）によるオンデバイス処理で、
画像もテキストも一切外部へ送信しません。オフラインでも動きます。

## できること

| 入力方法 | 用途 | 使っている仕組み |
| --- | --- | --- |
| 書類をスキャン | 紙の資料・帳票・本 | `VNDocumentCameraViewController`（四隅の自動検出・影除去・複数ページ） |
| カメラで撮影 | 看板・ラベル・値札 | `DataScannerViewController`（ライブ検出 + 高解像度シャッター） |
| 写真から読み取り | 撮影済み画像・スクリーンショット | PhotosPicker |

読み取り後の画面では、

- **テキスト**タブでそのまま編集・コピー・共有
- **行ごと**タブで行単位の信頼度を確認し、Vision の第 2・第 3 候補にワンタップで差し替え
- **画像**タブで認識位置を矩形表示（信頼度が低い行は赤・橙で表示）
- **検索できる PDF** の書き出し（画像の上に透明なテキスト層を重ねた PDF。ビューアで検索・選択・コピー可能）
- **翻訳**（iOS 17.4 以降。システムの翻訳シートを表示。オンデバイス翻訳対応端末では通信不要）
- 端末内の履歴に保存（画像は JPEG、テキストは JSON）

## 精度のために入れてある工夫

OCR の精度は「Vision に何を渡すか」でほぼ決まります。このアプリでは認識前に次の処理を挟んでいます。

1. **台形補正** — `VNDetectDocumentSegmentationRequest` で書類の四隅を検出し、斜めから撮った紙を正面から見た形に直す（`CIPerspectiveCorrection`）。
2. **解像度の正規化** — 長辺が 1600px 未満なら Lanczos で拡大、4032px を超えるなら縮小。文字が小さすぎると Vision は取りこぼし、大きすぎても遅くなるだけなので、有効な範囲に寄せる。
3. **輪郭の強調** — 控えめなコントラスト補正 + アンシャープマスク。かけすぎると細い線が飛ぶので弱め。
4. **向きの自動判定** — 0/90/180/270 度を `.fast` で試し、`信頼度 × 文字数` の合計が最大の向きを選んでから、本命の `.accurate` を 1 回だけ走らせる。横向きに撮った写真が丸ごと読めない事故を防ぎます。
5. **読み順の復元** — Vision は必ずしも読み順に返さないため、まず行（縦書きでは列）にクラスタリングしてから、その中を整列して並べ直す。縦書きは右の列から左へ。さらに矩形の形状（縦長の断片が 7 割以上）から縦書きらしさを自動判定して読み順を切り替えます（設定で無効化可）。
6. **日本語の空白除去** — 全角文字どうしに挟まれた空白だけを削除（「東京 都」→「東京都」、`Tokyo Station` はそのまま）。

設定画面では、認識言語、精度優先/速度優先、言語補正の ON/OFF、ユーザー辞書（社名・薬剤名・型番などを 1 行 1 語で登録）を変更できます。
**型番や英数字の羅列が多い書類では「言語補正」を切ると誤補正が減ります。**

## ビルド方法

- 必要環境: macOS + Xcode 16 以降、iOS 17 以降の実機
- Apple ID があれば無料の Personal Team で実機インストールできます（有料の Developer Program は不要）

1. `ios/PreciseOCR/PreciseOCR.xcodeproj` を Xcode で開く
2. TARGETS → PreciseOCR → Signing & Capabilities で **Team** を自分のアカウントに設定
3. `PRODUCT_BUNDLE_IDENTIFIER` を自分用に変更（例: `com.yourname.PreciseOCR`）
4. iPhone を接続して ⌘R

> **シミュレータでは動作確認できません。** カメラと `DataScannerViewController` は実機（A12 Bionic 以降）が必要です。
> プロジェクトファイルを作り直したい場合は、`xcodegen generate`（`project.yml` 同梱）でも同じ構成を生成できます。

## ディレクトリ構成

```
ios/PreciseOCR/
├── PreciseOCR.xcodeproj
├── project.yml                 # XcodeGen 用（任意）
└── PreciseOCR/
    ├── PreciseOCRApp.swift
    ├── ContentView.swift       # ホーム画面と認識フロー
    ├── OCR/
    │   ├── TextRecognizer.swift    # Vision 呼び出し・向き判定・読み順の復元
    │   ├── ImagePreprocessor.swift # 台形補正・拡大縮小・輪郭強調・回転
    │   ├── JapaneseTextCleaner.swift
    │   ├── OCRSettings.swift
    │   └── RecognizedDocument.swift
    ├── Export/
    │   └── PDFExporter.swift       # 検索できる PDF の書き出し
    ├── Camera/
    │   ├── DocumentScannerView.swift
    │   └── LiveScannerView.swift
    ├── Views/                  # 結果・設定・履歴・オーバーレイ
    └── Store/                  # 設定と履歴の永続化
```

## 精度が出ないときのコツ

- 文字が画面いっぱいになるまで寄る（Vision は文字の高さが 32px 以上あると安定します）
- 影を作らない。斜め上からの照明よりも、真上からの拡散光が有利
- 光沢紙は少し角度をつけて反射を避ける
- 使わない言語は設定から外す（候補が減るほど誤認識が減ります）
- 縦書きの文書は自動判定されますが、うまくいかない場合は設定の読み順を「縦書き（右→左）」に固定する

## 制限

- 手書き文字は Vision の対応範囲外です（活字向けの精度になります）
- 縦書きは、読み順の復元には対応していますが、Vision 自体の縦書き認識精度に依存します
- iOS 17 以降が必要です
