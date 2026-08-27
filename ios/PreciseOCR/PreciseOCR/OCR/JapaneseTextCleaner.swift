import Foundation

/// Vision は日本語の文字間に空白を挟むことがあるため、その後始末をする。
enum JapaneseTextCleaner {

    /// 全角文字（かな・漢字・全角記号）かどうか。
    static func isCJK(_ character: Character) -> Bool {
        guard let scalar = character.unicodeScalars.first, character.unicodeScalars.count == 1 else {
            return false
        }
        switch scalar.value {
        case 0x3000...0x303F,   // CJK 記号・句読点
             0x3040...0x309F,   // ひらがな
             0x30A0...0x30FF,   // カタカナ
             0x3400...0x4DBF,   // CJK 拡張 A
             0x4E00...0x9FFF,   // CJK 統合漢字
             0xF900...0xFAFF,   // 互換漢字
             0xFF00...0xFFEF:   // 全角英数・半角カナ
            return true
        default:
            return false
        }
    }

    /// 全角文字どうしに挟まれた空白のみを削除する。
    /// 「東京 都」→「東京都」、「Tokyo Station」はそのまま。
    static func clean(_ text: String) -> String {
        var output = ""
        output.reserveCapacity(text.count)
        var pendingSpaces = 0

        for character in text {
            if character == " " || character == "\u{3000}" {
                pendingSpaces += 1
                continue
            }
            if pendingSpaces > 0 {
                let previous = output.last
                let dropsSpace = previous.map { isCJK($0) && isCJK(character) } ?? true
                if !dropsSpace {
                    output.append(" ")
                }
                pendingSpaces = 0
            }
            output.append(character)
        }
        return output.trimmingCharacters(in: .whitespacesAndNewlines)
    }
}
