import AVFoundation
import Foundation

// MARK: - Models.swift の Speaker をこの内容へ置き換える
//
// v0.3.0 の Speaker は
//   id / name / colorHex / speechRate / standingImagePath
// のみを持ち、声を指定するフィールドが無かった。
// voiceIdentifier・pitchMultiplier・volume を追加して話者ごとに声を変えられるようにする。
//
// init(from:) を手書きしているのは、v0.3.0 で保存した既存プロジェクト
// （新しいキーを持たない JSON）をそのまま開けるようにするため。

struct Speaker: Identifiable, Codable, Hashable {
    var id: UUID
    var name: String
    var colorHex: String
    var speechRate: Float
    var standingImagePath: String?

    /// `AVSpeechSynthesisVoice.identifier`。nil なら既定の日本語音声。
    var voiceIdentifier: String?
    /// 声の高さ。0.5（低い）〜2.0（高い）。
    var pitchMultiplier: Float
    /// 読み上げ音量。0.0〜1.0。
    var volume: Float

    init(
        id: UUID = UUID(),
        name: String,
        colorHex: String,
        speechRate: Float = AVSpeechUtteranceDefaultSpeechRate,
        standingImagePath: String? = nil,
        voiceIdentifier: String? = nil,
        pitchMultiplier: Float = 1.0,
        volume: Float = 1.0
    ) {
        self.id = id
        self.name = name
        self.colorHex = colorHex
        self.speechRate = speechRate
        self.standingImagePath = standingImagePath
        self.voiceIdentifier = voiceIdentifier
        self.pitchMultiplier = pitchMultiplier
        self.volume = volume
    }

    private enum CodingKeys: String, CodingKey {
        case id, name, colorHex, speechRate, standingImagePath
        case voiceIdentifier, pitchMultiplier, volume
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(UUID.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        colorHex = try container.decode(String.self, forKey: .colorHex)
        speechRate = try container.decode(Float.self, forKey: .speechRate)
        standingImagePath = try container.decodeIfPresent(String.self, forKey: .standingImagePath)

        // v0.3.0 以前のプロジェクトには存在しないキー
        voiceIdentifier = try container.decodeIfPresent(String.self, forKey: .voiceIdentifier)
        pitchMultiplier = try container.decodeIfPresent(Float.self, forKey: .pitchMultiplier) ?? 1.0
        volume = try container.decodeIfPresent(Float.self, forKey: .volume) ?? 1.0
    }
}
