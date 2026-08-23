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
    /// 矩形の形状から縦書きらしさを判定し、読み順を自動で縦書きに切り替える。
    var autoDetectVerticalText: Bool = true
    /// 日本語の文字間に入る余分な空白を取り除く。
    var cleansJapaneseSpacing: Bool = true
    /// カメラで読み取った画像を写真アプリにも保存する（iCloud 写真経由で Mac にも同期される）。
    var savesScansToPhotos: Bool = true

    static let `default` = OCRSettings()

    init() {}

    // 設定項目を後から増やしても、保存済みの設定が読めなくならないように
    // 欠けているキーは既定値で埋める。
    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        let defaults = OCRSettings()
        preferredLanguages = try container.decodeIfPresent([String].self, forKey: .preferredLanguages) ?? defaults.preferredLanguages
        useAccurateLevel = try container.decodeIfPresent(Bool.self, forKey: .useAccurateLevel) ?? defaults.useAccurateLevel
        usesLanguageCorrection = try container.decodeIfPresent(Bool.self, forKey: .usesLanguageCorrection) ?? defaults.usesLanguageCorrection
        automaticallyDetectsLanguage = try container.decodeIfPresent(Bool.self, forKey: .automaticallyDetectsLanguage) ?? defaults.automaticallyDetectsLanguage
        customWords = try container.decodeIfPresent([String].self, forKey: .customWords) ?? defaults.customWords
        minimumTextHeight = try container.decodeIfPresent(Float.self, forKey: .minimumTextHeight) ?? defaults.minimumTextHeight
        cropToDocument = try container.decodeIfPresent(Bool.self, forKey: .cropToDocument) ?? defaults.cropToDocument
        enhanceImage = try container.decodeIfPresent(Bool.self, forKey: .enhanceImage) ?? defaults.enhanceImage
        autoRotate = try container.decodeIfPresent(Bool.self, forKey: .autoRotate) ?? defaults.autoRotate
        readingOrder = try container.decodeIfPresent(ReadingOrder.self, forKey: .readingOrder) ?? defaults.readingOrder
        autoDetectVerticalText = try container.decodeIfPresent(Bool.self, forKey: .autoDetectVerticalText) ?? defaults.autoDetectVerticalText
        cleansJapaneseSpacing = try container.decodeIfPresent(Bool.self, forKey: .cleansJapaneseSpacing) ?? defaults.cleansJapaneseSpacing
        savesScansToPhotos = try container.decodeIfPresent(Bool.self, forKey: .savesScansToPhotos) ?? defaults.savesScansToPhotos
    }

    private enum CodingKeys: String, CodingKey {
        case preferredLanguages, useAccurateLevel, usesLanguageCorrection,
             automaticallyDetectsLanguage, customWords, minimumTextHeight,
             cropToDocument, enhanceImage, autoRotate, readingOrder,
             autoDetectVerticalText, cleansJapaneseSpacing, savesScansToPhotos
    }
}
