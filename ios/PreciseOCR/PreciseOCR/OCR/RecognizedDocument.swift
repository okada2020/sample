import CoreGraphics
import Foundation
import UIKit

/// 1 行分の認識結果。
struct RecognizedLine: Identifiable, Hashable, Codable {
    var id: UUID = UUID()
    /// 採用中のテキスト（候補の差し替え・手修正が反映される）。
    var text: String
    /// Vision が返した信頼度 (0.0 〜 1.0)。
    var confidence: Float
    /// 前処理後の画像に対する正規化矩形。原点は左下（Vision 座標系）。
    var boundingBox: CGRect
    /// Vision の第 2 候補以降。誤認識をタップで差し替えるために保持する。
    var alternatives: [String] = []
}

/// 1 枚の画像から得られた認識結果。
struct RecognizedDocument: Identifiable, Codable {
    var id: UUID = UUID()
    var createdAt: Date = Date()
    var lines: [RecognizedLine]
    /// 実際に認識に使われた言語。
    var languages: [String]
    /// 認識に使われた画像の向き（0/90/180/270 度・反時計回り）。
    var rotationDegrees: Int = 0

    var plainText: String {
        lines.map(\.text).joined(separator: "\n")
    }

    /// 文字数で重み付けした平均信頼度。短い誤検出に引きずられないようにする。
    var averageConfidence: Float {
        let weights = lines.map { Double($0.text.count) }
        let total = weights.reduce(0, +)
        guard total > 0 else { return 0 }
        let sum = zip(lines, weights).reduce(0.0) { $0 + Double($1.0.confidence) * $1.1 }
        return Float(sum / total)
    }
}

/// 画面表示用に、前処理後の画像と認識結果をまとめたもの。
struct ScanResult: Identifiable {
    var id: UUID { document.id }
    /// 認識に使った画像（傾き補正・切り出し済み）。矩形オーバーレイはこの画像に対応する。
    var image: UIImage
    var document: RecognizedDocument
}
