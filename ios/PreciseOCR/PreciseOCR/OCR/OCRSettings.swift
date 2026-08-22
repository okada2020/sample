import Foundation

/// 認識結果の並べ替え方（読み順）。
enum ReadingOrder: String, Codable, CaseIterable, Identifiable {
    /// 横書き: 上から下へ、行内は左から右へ。
    case horizontal
    /// 縦書き: 右の列から左の列へ、列内は上から下へ。
    case verticalRightToLeft

    var id: String { rawValue }

    var label: String {
        switch self {
        case .horizontal: return "横書き"
        case .verticalRightToLeft: return "縦書き（右→左）"
        }
    }
}

/// 認識精度に関わる設定。既定値は「精度優先」。
struct OCRSettings: Codable, Equatable {
    /// 認識させたい言語。端末が対応していないものは自動で除外される。
    var preferredLanguages: [String] = ["ja-JP", "en-US"]
    /// true で .accurate（低速・高精度）、false で .fast。
    var useAccurateLevel: Bool = true
    /// 言語モデルによる補正。文章に強いが、型番や記号列では誤補正の原因にもなる。
    var usesLanguageCorrection: Bool = true
    /// 言語を自動判定させる（指定言語より優先される）。
    var automaticallyDetectsLanguage: Bool = false
    /// 固有名詞・専門用語を登録すると、その語に寄せて認識される。
    var customWords: [String] = []
    /// 画像の高さに対する最小文字高。0 なら制限なし（小さい文字も拾う）。
    var minimumTextHeight: Float = 0
    /// 書類の四隅を検出して、台形歪みを補正してから認識する。
    var cropToDocument: Bool = true
    /// コントラスト補正とアンシャープマスクで輪郭を立てる。
    var enhanceImage: Bool = true
    /// 4 方向を試して、最もよく読めた向きを採用する（横向き撮影の救済）。
    var autoRotate: Bool = true
    var readingOrder: ReadingOrder = .horizontal
    /// 日本語の文字間に入る余分な空白を取り除く。
    var cleansJapaneseSpacing: Bool = true

    static let `default` = OCRSettings()
}
