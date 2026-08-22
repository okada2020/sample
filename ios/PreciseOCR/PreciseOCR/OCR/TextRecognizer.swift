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

            let lines = makeLines(from: observations, turns: turns, settings: settings)
            let document = RecognizedDocument(lines: sorted(lines, by: settings.readingOrder),
                                              languages: languages,
                                              rotationDegrees: turns * 90)
            return ScanResult(image: prepared, document: document)
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
        var best = (turns: 0, score: -1.0)
        for turns in 0..<4 {
            let candidate = ImagePreprocessor.rotated(image, quarterTurnsCCW: turns)
            let observations = (try? perform(on: candidate,
                                             languages: languages,
                                             accurate: false,
                                             settings: settings)) ?? []
            let score = observations.reduce(0.0) { partial, observation in
                guard let candidate = observation.topCandidates(1).first else { return partial }
                return partial + Double(candidate.confidence) * Double(candidate.string.count)
            }
            if score > best.score {
                best = (turns, score)
            }
        }
        return best.turns
    }

    // MARK: - 整形

    private static func makeLines(from observations: [VNRecognizedTextObservation],
                                  turns: Int,
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
                                  boundingBox: ImagePreprocessor.unrotate(observation.boundingBox, quarterTurnsCCW: turns),
                                  alternatives: Array(alternatives))
        }
    }

    /// Vision は必ずしも読み順に返さないので、矩形の位置関係から並べ直す。
    static func sorted(_ lines: [RecognizedLine], by order: ReadingOrder) -> [RecognizedLine] {
        guard lines.count > 1 else { return lines }

        switch order {
        case .horizontal:
            // 行の高さの半分までは「同じ行」とみなし、その中では左から右へ。
            let averageHeight = lines.map(\.boundingBox.height).reduce(0, +) / CGFloat(lines.count)
            let tolerance = max(averageHeight * 0.5, 0.005)
            return lines.sorted { a, b in
                if abs(a.boundingBox.midY - b.boundingBox.midY) > tolerance {
                    return a.boundingBox.midY > b.boundingBox.midY   // Vision の Y は下が 0
                }
                return a.boundingBox.minX < b.boundingBox.minX
            }
        case .verticalRightToLeft:
            let averageWidth = lines.map(\.boundingBox.width).reduce(0, +) / CGFloat(lines.count)
            let tolerance = max(averageWidth * 0.5, 0.005)
            return lines.sorted { a, b in
                if abs(a.boundingBox.midX - b.boundingBox.midX) > tolerance {
                    return a.boundingBox.midX > b.boundingBox.midX   // 右の列から
                }
                return a.boundingBox.midY > b.boundingBox.midY
            }
        }
    }
}
