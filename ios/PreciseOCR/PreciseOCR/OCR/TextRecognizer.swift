import CoreImage
import Foundation
import UIKit
import Vision

enum OCRError: LocalizedError {
    case invalidImage
    case noTextFound

    var errorDescription: String? {
        switch self {
        case .invalidImage: return "画像を読み込めませんでした。"
        case .noTextFound: return "文字を検出できませんでした。明るい場所で、文字が画面いっぱいになるように撮り直してください。"
        }
    }
}

/// Vision の VNRecognizeTextRequest を使ったオンデバイス OCR。
enum TextRecognizer {

    // MARK: - 言語

    /// 端末がこのビルドの Vision で対応している言語の一覧。
    static func supportedLanguages(accurate: Bool = true) -> [String] {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = accurate ? .accurate : .fast
        return (try? request.supportedRecognitionLanguages()) ?? []
    }

    /// 希望言語を、端末が実際に受け付ける識別子へ寄せる。
    /// Vision の識別子は OS により "ja" だったり "ja-JP" だったりするので、主要サブタグで突き合わせる。
    static func resolveLanguages(_ preferred: [String], accurate: Bool) -> [String] {
        let supported = supportedLanguages(accurate: accurate)
        guard !supported.isEmpty else { return [] }

        var resolved: [String] = []
        for language in preferred {
            let primary = language.split(separator: "-").first.map(String.init)?.lowercased() ?? language.lowercased()
            let match = supported.first { $0.caseInsensitiveCompare(language) == .orderedSame }
                ?? supported.first { ($0.split(separator: "-").first.map(String.init)?.lowercased() ?? "") == primary }
            if let match, !resolved.contains(match) {
                resolved.append(match)
            }
        }
        return resolved
    }

    // MARK: - 入口

    /// 画像 1 枚を認識する。前処理・向き判定・整形まで含む。
    static func recognize(image: UIImage, settings: OCRSettings) async throws -> ScanResult {
        try await Task.detached(priority: .userInitiated) {
            try analyze(image, settings: settings)
        }.value
    }

    /// 連写した複数フレームを認識し、行ごとに多数決を取る。手ブレによる誤認識に強くなる。
    static func recognize(images: [UIImage], settings: OCRSettings) async throws -> ScanResult {
        guard images.count > 1 else {
            guard let first = images.first else { throw OCRError.invalidImage }
            return try await recognize(image: first, settings: settings)
        }

        return try await Task.detached(priority: .userInitiated) { () -> ScanResult in
            var results: [ScanResult] = []
            var failure: Error?
            for image in images {
                do {
                    results.append(try analyze(image, settings: settings))
                } catch {
                    failure = error
                }
            }
            guard !results.isEmpty else { throw failure ?? OCRError.noTextFound }
            return voted(results)
        }.value
    }

    // MARK: - 本体

    private static func analyze(_ image: UIImage, settings: OCRSettings) throws -> ScanResult {
        let prepared = ImagePreprocessor.prepare(image, settings: settings)
        guard let ciImage = CIImage(image: prepared) else { throw OCRError.invalidImage }

        let languages = resolveLanguages(settings.preferredLanguages, accurate: settings.useAccurateLevel)
        let turns = settings.autoRotate
            ? bestRotation(for: ciImage, languages: languages, settings: settings)
            : 0

        let target = ImagePreprocessor.rotated(ciImage, quarterTurnsCCW: turns)

        // 矩形は回転後（実際に認識した向き）の座標のまま扱う。読み順の判定・整列を
        // 元の向きに戻した座標でやると、180 度回転時に行順が逆転してしまう。
        // 結果画像も回転後のものにして、オーバーレイ・PDF と座標系を一致させる。
        let recognized = settings.usesTiledRecognition
            ? try tiledLines(in: target, languages: languages, settings: settings)
            : try lines(in: target, languages: languages, settings: settings)
        guard !recognized.isEmpty else { throw OCRError.noTextFound }

        let order = settings.autoDetectVerticalText
            ? detectedReadingOrder(for: recognized, fallback: settings.readingOrder)
            : settings.readingOrder
        let finalImage = turns == 0 ? prepared : (ImagePreprocessor.render(target) ?? prepared)

        let document = RecognizedDocument(lines: sorted(recognized, by: order),
                                          languages: languages,
                                          rotationDegrees: turns * 90,
                                          medianTextHeightPixels: medianTextHeight(of: recognized,
                                                                                   imageSize: finalImage.size))
        return ScanResult(image: finalImage, document: document)
    }

    /// 1 枚（またはタイル 1 枚）ぶんの認識。設定に応じて言語補正あり・なしの結果を突き合わせる。
    private static func lines(in image: CIImage,
                              languages: [String],
                              settings: OCRSettings) throws -> [RecognizedLine] {
        if settings.mergesCorrectionVariants {
            // 文章は補正ありが強く、型番や数字の羅列は補正なしが強い。
            // 両方を走らせて、行ごとに信頼度の高い方を採用する。
            let corrected = makeLines(from: try perform(on: image,
                                                        languages: languages,
                                                        accurate: settings.useAccurateLevel,
                                                        usesLanguageCorrection: true,
                                                        settings: settings),
                                      settings: settings)
            let raw = makeLines(from: try perform(on: image,
                                                  languages: languages,
                                                  accurate: settings.useAccurateLevel,
                                                  usesLanguageCorrection: false,
                                                  settings: settings),
                                settings: settings)
            return mergedByConfidence(corrected, raw)
        }

        return makeLines(from: try perform(on: image,
                                           languages: languages,
                                           accurate: settings.useAccurateLevel,
                                           usesLanguageCorrection: settings.usesLanguageCorrection,
                                           settings: settings),
                         settings: settings)
    }

    /// 画像を少しずつ重ねながら分割して認識する。
    /// Vision は内部で大きな画像を縮小するため、分割すると細かい文字の実効解像度が上がる。
    private static func tiledLines(in image: CIImage,
                                   languages: [String],
                                   settings: OCRSettings) throws -> [RecognizedLine] {
        let extent = image.extent
        guard extent.width > 0, extent.height > 0 else { return [] }

        let longSide = max(extent.width, extent.height)
        let divisions = longSide >= 2_400 ? 3 : (longSide >= 1_200 ? 2 : 1)
        guard divisions > 1 else {
            return try lines(in: image, languages: languages, settings: settings)
        }

        let overlap: CGFloat = 0.12
        let tileWidth = extent.width / CGFloat(divisions)
        let tileHeight = extent.height / CGFloat(divisions)
        var collected: [RecognizedLine] = []

        for row in 0..<divisions {
            for column in 0..<divisions {
                let base = CGRect(x: extent.minX + CGFloat(column) * tileWidth,
                                  y: extent.minY + CGFloat(row) * tileHeight,
                                  width: tileWidth,
                                  height: tileHeight)
                let rect = base.insetBy(dx: -tileWidth * overlap, dy: -tileHeight * overlap).intersection(extent)
                guard rect.width > 1, rect.height > 1 else { continue }

                // 切り出した画像の原点を 0 に揃えてから渡す（Vision の正規化座標をタイル基準にするため）。
                let tile = image.cropped(to: rect)
                    .transformed(by: CGAffineTransform(translationX: -rect.minX, y: -rect.minY))

                let tileLines = (try? lines(in: tile, languages: languages, settings: settings)) ?? []
                for line in tileLines {
                    var moved = line
                    moved.boundingBox = globalBox(line.boundingBox, tile: rect, in: extent)
                    collected.append(moved)
                }
            }
        }

        // 重なり部分では同じ行が複数のタイルから出てくるので、まとめる。
        return deduplicated(collected)
    }

    /// タイル内の正規化矩形を、画像全体の正規化矩形へ変換する。
    private static func globalBox(_ box: CGRect, tile: CGRect, in extent: CGRect) -> CGRect {
        CGRect(x: ((tile.minX - extent.minX) + box.minX * tile.width) / extent.width,
               y: ((tile.minY - extent.minY) + box.minY * tile.height) / extent.height,
               width: box.width * tile.width / extent.width,
               height: box.height * tile.height / extent.height)
    }

    // MARK: - Vision 呼び出し

    private static func perform(on image: CIImage,
                                languages: [String],
                                accurate: Bool,
                                usesLanguageCorrection: Bool,
                                settings: OCRSettings) throws -> [VNRecognizedTextObservation] {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = accurate ? .accurate : .fast
        request.usesLanguageCorrection = usesLanguageCorrection
        request.minimumTextHeight = settings.minimumTextHeight
        if !languages.isEmpty {
            request.recognitionLanguages = languages
        }
        if !settings.customWords.isEmpty {
            request.customWords = settings.customWords
        }
        request.automaticallyDetectsLanguage = settings.automaticallyDetectsLanguage

        let handler = VNImageRequestHandler(ciImage: image, options: [:])
        try handler.perform([request])
        return request.results ?? []
    }

    /// 4 方向を .fast で試して、いちばん読めた向きを返す。
    /// 本番の .accurate は 1 回だけ走らせたいので、判定はあえて低コストな方で行う。
    private static func bestRotation(for image: CIImage, languages: [String], settings: OCRSettings) -> Int {
        func score(turns: Int) -> Double {
            let candidate = ImagePreprocessor.rotated(image, quarterTurnsCCW: turns)
            let observations = (try? perform(on: candidate,
                                             languages: languages,
                                             accurate: false,
                                             usesLanguageCorrection: settings.usesLanguageCorrection,
                                             settings: settings)) ?? []
            return observations.reduce(0.0) { partial, observation in
                guard let top = observation.topCandidates(1).first else { return partial }
                return partial + Double(top.confidence) * Double(top.string.count)
            }
        }

        let baseline = score(turns: 0)
        var best = (turns: 0, score: baseline)
        for turns in 1..<4 {
            let value = score(turns: turns)
            if value > best.score {
                best = (turns, value)
            }
        }

        // 数字や記号は逆さまでもそれなりに「読めて」しまい、僅差で 180 度が勝つことがある。
        // 誤って回す害の方が大きいので、そのままで十分読めているなら回さず、
        // 明確に（3 割以上）良くなる場合だけ回転を採用する。
        if best.turns != 0, baseline > 0, best.score < baseline * 1.3 {
            return 0
        }
        return best.turns
    }

    // MARK: - 整形

    private static func makeLines(from observations: [VNRecognizedTextObservation],
                                  settings: OCRSettings) -> [RecognizedLine] {
        observations.compactMap { observation in
            let candidates = observation.topCandidates(3)
            guard let top = candidates.first else { return nil }

            let text = refined(top.string, settings: settings)
            guard !text.isEmpty else { return nil }

            let alternatives = candidates.dropFirst().map { refined($0.string, settings: settings) }
            return RecognizedLine(text: text,
                                  confidence: top.confidence,
                                  boundingBox: observation.boundingBox,
                                  alternatives: Array(alternatives))
        }
    }

    private static func refined(_ text: String, settings: OCRSettings) -> String {
        var value = settings.cleansJapaneseSpacing ? JapaneseTextCleaner.clean(text) : text
        if settings.normalizesStructuredFields {
            value = TextNormalizer.normalize(value)
        }
        return value
    }

    // MARK: - 突き合わせ

    private static func intersectionOverUnion(_ a: CGRect, _ b: CGRect) -> CGFloat {
        let intersection = a.intersection(b)
        guard !intersection.isNull, intersection.width > 0, intersection.height > 0 else { return 0 }
        let overlap = intersection.width * intersection.height
        let union = a.width * a.height + b.width * b.height - overlap
        return union > 0 ? overlap / union : 0
    }

    /// 同じ場所を指す行をまとめ、いちばん内容の多いものを残す。
    private static func deduplicated(_ lines: [RecognizedLine]) -> [RecognizedLine] {
        var kept: [RecognizedLine] = []
        // タイルの境目で切れた断片より、丸ごと読めた行を優先したいので長い順に見る。
        for line in lines.sorted(by: { $0.text.count > $1.text.count }) {
            if let index = kept.firstIndex(where: { intersectionOverUnion($0.boundingBox, line.boundingBox) > 0.3 }) {
                if line.text.count == kept[index].text.count, line.confidence > kept[index].confidence {
                    kept[index] = line
                }
                continue
            }
            kept.append(line)
        }
        return kept
    }

    /// 同じ画像に対する 2 通りの認識結果を、行ごとに信頼度で選び直す。
    private static func mergedByConfidence(_ primary: [RecognizedLine],
                                           _ secondary: [RecognizedLine]) -> [RecognizedLine] {
        var merged: [RecognizedLine] = []
        var usedSecondary = Set<Int>()

        for line in primary {
            var best = line
            var bestIndex: Int?
            var bestOverlap: CGFloat = 0.5

            for (index, other) in secondary.enumerated() where !usedSecondary.contains(index) {
                let overlap = intersectionOverUnion(line.boundingBox, other.boundingBox)
                if overlap > bestOverlap {
                    bestOverlap = overlap
                    bestIndex = index
                }
            }

            if let bestIndex {
                usedSecondary.insert(bestIndex)
                let other = secondary[bestIndex]
                if other.confidence > line.confidence {
                    best = other
                }
                // 採用しなかった方も候補として残し、手動で戻せるようにする。
                let rejected = other.confidence > line.confidence ? line.text : other.text
                if rejected != best.text, !best.alternatives.contains(rejected) {
                    best.alternatives.insert(rejected, at: 0)
                }
            }
            merged.append(best)
        }

        for (index, other) in secondary.enumerated() where !usedSecondary.contains(index) {
            merged.append(other)
        }
        return merged
    }

    /// 連写した各フレームの結果を突き合わせ、行ごとに多数決を取る。
    private static func voted(_ results: [ScanResult]) -> ScanResult {
        func totalScore(_ result: ScanResult) -> Double {
            result.document.lines.reduce(0.0) { $0 + Double($1.confidence) * Double($1.text.count) }
        }

        // いちばんよく読めたフレームを土台にして、そこへ他フレームの票を反映する。
        guard var base = results.max(by: { totalScore($0) < totalScore($1) }) else { return results[0] }
        let others = results.filter { $0.document.id != base.document.id }
        guard !others.isEmpty else { return base }

        var lines = base.document.lines
        for index in lines.indices {
            let target = lines[index]
            var tally: [String: (count: Int, confidence: Float)] = [
                target.text: (1, target.confidence)
            ]

            for other in others {
                guard let match = other.document.lines
                    .filter({ intersectionOverUnion($0.boundingBox, target.boundingBox) > 0.35 })
                    .max(by: { $0.confidence < $1.confidence }) else { continue }
                let existing = tally[match.text] ?? (0, 0)
                tally[match.text] = (existing.count + 1, max(existing.confidence, match.confidence))
            }

            guard tally.count > 1 else { continue }
            let winner = tally.max { left, right in
                left.value.count != right.value.count
                    ? left.value.count < right.value.count
                    : left.value.confidence < right.value.confidence
            }
            guard let winner, winner.key != target.text,
                  winner.value.count > (tally[target.text]?.count ?? 0) else { continue }

            var updated = target
            updated.alternatives = ([target.text] + updated.alternatives).filter { $0 != winner.key }
            updated.text = winner.key
            updated.confidence = max(updated.confidence, winner.value.confidence)
            lines[index] = updated
        }

        base.document.lines = lines
        return base
    }

    // MARK: - 読み順

    /// 縦書きの文書では、Vision が返す矩形が縦長の断片（1 列ぶんの短冊）に偏る。
    /// その形状の偏りから縦書きらしさを判定する。判定が弱いときは指定された読み順に従う。
    static func detectedReadingOrder(for lines: [RecognizedLine], fallback: ReadingOrder) -> ReadingOrder {
        guard lines.count >= 4 else { return fallback }
        let tallCount = lines.filter { $0.boundingBox.height > $0.boundingBox.width * 1.8 }.count
        if Double(tallCount) >= Double(lines.count) * 0.7 {
            return .verticalRightToLeft
        }
        return fallback
    }

    /// Vision は必ずしも読み順に返さないので、矩形の位置関係から並べ直す。
    /// まず行（または列）にクラスタリングしてから、その中を整列する。
    /// ペア比較の許容差だけで並べると比較関数が推移律を満たさず、順序が壊れることがある。
    static func sorted(_ lines: [RecognizedLine], by order: ReadingOrder) -> [RecognizedLine] {
        guard lines.count > 1 else { return lines }

        switch order {
        case .horizontal:
            let averageHeight = lines.map(\.boundingBox.height).reduce(0, +) / CGFloat(lines.count)
            let clusters = clustered(lines,
                                     position: { $0.boundingBox.midY },
                                     descending: true,   // Vision の Y は下が 0 なので、上の行ほど大きい
                                     tolerance: max(averageHeight * 0.6, 0.008))
            return clusters.flatMap { row in
                row.sorted { $0.boundingBox.minX < $1.boundingBox.minX }
            }
        case .verticalRightToLeft:
            let averageWidth = lines.map(\.boundingBox.width).reduce(0, +) / CGFloat(lines.count)
            let clusters = clustered(lines,
                                     position: { $0.boundingBox.midX },
                                     descending: true,   // 右の列から
                                     tolerance: max(averageWidth * 0.6, 0.008))
            return clusters.flatMap { column in
                column.sorted { $0.boundingBox.midY > $1.boundingBox.midY }   // 列内は上から下
            }
        }
    }

    /// 1 次元の座標で並べたうえで、近接するものを同じ束にまとめる。
    /// 束の中心は逐次更新するので、緩やかな傾きにも追従する。
    private static func clustered(_ lines: [RecognizedLine],
                                  position: (RecognizedLine) -> CGFloat,
                                  descending: Bool,
                                  tolerance: CGFloat) -> [[RecognizedLine]] {
        let ordered = lines.sorted {
            descending ? position($0) > position($1) : position($0) < position($1)
        }
        var clusters: [[RecognizedLine]] = []
        var current: [RecognizedLine] = []
        var center: CGFloat = 0

        for line in ordered {
            let value = position(line)
            if current.isEmpty || abs(center - value) <= tolerance {
                current.append(line)
                center = current.map(position).reduce(0, +) / CGFloat(current.count)
            } else {
                clusters.append(current)
                current = [line]
                center = value
            }
        }
        if !current.isEmpty {
            clusters.append(current)
        }
        return clusters
    }

    // MARK: - 撮影距離の判定

    /// 文字の大きさ（ピクセル）の中央値。
    /// 行の矩形は横書きなら高さ、縦書きなら幅が文字の大きさにあたるので、短い方の辺を見る。
    private static func medianTextHeight(of lines: [RecognizedLine], imageSize: CGSize) -> Double {
        guard !lines.isEmpty, imageSize.width > 0, imageSize.height > 0 else { return 0 }
        let sizes = lines.map {
            min(Double($0.boundingBox.height) * Double(imageSize.height),
                Double($0.boundingBox.width) * Double(imageSize.width))
        }.sorted()
        let middle = sizes.count / 2
        return sizes.count % 2 == 0 ? (sizes[middle - 1] + sizes[middle]) / 2 : sizes[middle]
    }
}
