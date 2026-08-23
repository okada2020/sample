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

    /// 画像 1 枚を認識する。前処理・向き判定・整形まで含む。
    static func recognize(image: UIImage, settings: OCRSettings) async throws -> ScanResult {
        try await Task.detached(priority: .userInitiated) { () -> ScanResult in
            let prepared = ImagePreprocessor.prepare(image, settings: settings)
            guard let ciImage = CIImage(image: prepared) else { throw OCRError.invalidImage }

            let languages = resolveLanguages(settings.preferredLanguages, accurate: settings.useAccurateLevel)
            let turns = settings.autoRotate
                ? bestRotation(for: ciImage, languages: languages, settings: settings)
                : 0

            let target = ImagePreprocessor.rotated(ciImage, quarterTurnsCCW: turns)
            let observations = try perform(on: target,
                                           languages: languages,
                                           accurate: settings.useAccurateLevel,
                                           settings: settings)
            guard !observations.isEmpty else { throw OCRError.noTextFound }

            // 矩形は回転後（実際に認識した向き）の座標のまま扱う。読み順の判定・整列を
            // 元の向きに戻した座標でやると、180 度回転時に行順が逆転してしまう。
            // 結果画像も回転後のものにして、オーバーレイ・PDF と座標系を一致させる。
            let lines = makeLines(from: observations, settings: settings)
            let order = settings.autoDetectVerticalText
                ? detectedReadingOrder(for: lines, fallback: settings.readingOrder)
                : settings.readingOrder
            let finalImage = turns == 0
                ? prepared
                : (ImagePreprocessor.render(target) ?? prepared)
            let document = RecognizedDocument(lines: sorted(lines, by: order),
                                              languages: languages,
                                              rotationDegrees: turns * 90)
            return ScanResult(image: finalImage, document: document)
        }.value
    }

    // MARK: - Vision 呼び出し

    private static func perform(on image: CIImage,
                                languages: [String],
                                accurate: Bool,
                                settings: OCRSettings) throws -> [VNRecognizedTextObservation] {
        let request = VNRecognizeTextRequest()
        request.recognitionLevel = accurate ? .accurate : .fast
        request.usesLanguageCorrection = settings.usesLanguageCorrection
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

            let text = settings.cleansJapaneseSpacing ? JapaneseTextCleaner.clean(top.string) : top.string
            guard !text.isEmpty else { return nil }

            let alternatives = candidates.dropFirst().map {
                settings.cleansJapaneseSpacing ? JapaneseTextCleaner.clean($0.string) : $0.string
            }
            return RecognizedLine(text: text,
                                  confidence: top.confidence,
                                  boundingBox: observation.boundingBox,
                                  alternatives: Array(alternatives))
        }
    }

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
}
