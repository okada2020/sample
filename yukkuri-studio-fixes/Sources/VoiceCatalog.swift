import AVFoundation
import Foundation

/// 話者インスペクタのボイス選択メニューに並べる 1 件分。
struct VoiceOption: Identifiable, Hashable {
    /// `AVSpeechSynthesisVoice.identifier`
    let id: String
    let name: String
    let language: String
    let quality: AVSpeechSynthesisVoiceQuality

    var displayName: String {
        switch quality {
        case .premium:  return "\(name)（プレミアム）"
        case .enhanced: return "\(name)（拡張）"
        default:        return name
        }
    }
}

/// 利用可能な日本語音声を列挙する。
///
/// v0.3.0 は `AVSpeechSynthesisVoice(language:)` で既定音声を引くだけだったため、
/// 話者を何人作っても声が同一だった。話者ごとに identifier を持たせて差別化する。
enum VoiceCatalog {

    static let preferredLanguage = "ja-JP"

    /// 品質の高い順に並べた日本語音声の一覧。
    static func japaneseVoices() -> [VoiceOption] {
        AVSpeechSynthesisVoice.speechVoices()
            .filter { $0.language.hasPrefix("ja") }
            .map {
                VoiceOption(
                    id: $0.identifier,
                    name: $0.name,
                    language: $0.language,
                    quality: $0.quality
                )
            }
            .sorted { lhs, rhs in
                if lhs.quality.rawValue != rhs.quality.rawValue {
                    return lhs.quality.rawValue > rhs.quality.rawValue
                }
                return lhs.name.localizedStandardCompare(rhs.name) == .orderedAscending
            }
    }

    /// 日本語音声が 1 つも入っていない環境かどうか。
    static var isJapaneseVoiceAvailable: Bool {
        !japaneseVoices().isEmpty
    }

    /// 保存済み identifier から音声を復元する。
    ///
    /// 別の Mac でプロジェクトを開いた場合など、その identifier の音声が
    /// 入っていないことがあるため、既定の日本語音声へフォールバックする。
    static func voice(for identifier: String?) -> AVSpeechSynthesisVoice? {
        if let identifier, let voice = AVSpeechSynthesisVoice(identifier: identifier) {
            return voice
        }
        return AVSpeechSynthesisVoice(language: preferredLanguage)
    }

    /// 話者を追加したときに、既存の話者と重複しない声を割り当てる。
    static func suggestedIdentifier(excluding used: Set<String>) -> String? {
        let voices = japaneseVoices()
        return voices.first(where: { !used.contains($0.id) })?.id ?? voices.first?.id
    }
}
