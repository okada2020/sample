import Foundation

/// 形式が決まっているフィールド（日付・電話番号・郵便番号・金額）に限って、
/// OCR の典型的な取り違え（O↔0、l↔1、S↔5 など）を数字に寄せる。
///
/// 無条件に置き換えると英単語が壊れるため、
/// 「〒がある」「0 で始まる」「年月が付く」「¥ が付く」といった強い手がかりがある箇所だけを対象にする。
enum TextNormalizer {

    /// 数字と間違えられやすい文字 → 数字。
    private static let confusables: [Character: Character] = [
        "O": "0", "o": "0",
        "l": "1", "I": "1", "i": "1", "|": "1", "ｌ": "1",
        "S": "5", "s": "5",
        "B": "8",
        "G": "6",
        "Z": "2", "z": "2"
    ]

    /// 数字、または数字と紛らわしい文字の集合（正規表現用）。
    private static let digitClass = "[0-9OoIiLlSsBGZz|ｌ]"

    private struct Rule {
        let pattern: String
        /// 置換前に、その並びが本当にそのフィールドかを確かめる。
        let validate: (String) -> Bool
    }

    private static let rules: [Rule] = [
        // 郵便番号: 〒 が付いているものだけ
        Rule(pattern: "〒\\s*\(digitClass){3}\\s*[-–—]\\s*\(digitClass){4}",
             validate: { _ in true }),

        // 電話番号: 日本の市外局番は必ず 0 で始まる
        Rule(pattern: "(?<![0-9])\(digitClass){2,4}[-–—]\(digitClass){1,4}[-–—]\(digitClass){4}(?![0-9])",
             validate: { converted in converted.hasPrefix("0") }),

        // 日付: 年月日の漢字か、1900〜2099 年らしい 4 桁で始まるもの
        Rule(pattern: "\(digitClass){4}\\s*[年/.\\-]\\s*\(digitClass){1,2}\\s*[月/.\\-]\\s*\(digitClass){1,2}\\s*[日]?",
             validate: { converted in
                 converted.contains("年") || converted.hasPrefix("19") || converted.hasPrefix("20")
             }),

        // 金額: ¥ が付いているものだけ
        Rule(pattern: "[¥￥]\\s*\(digitClass){1,3}(?:,\(digitClass){3})*",
             validate: { _ in true })
    ]

    private static let compiled: [(NSRegularExpression, (String) -> Bool)] = rules.compactMap { rule in
        guard let expression = try? NSRegularExpression(pattern: rule.pattern) else { return nil }
        return (expression, rule.validate)
    }

    /// 紛らわしい文字だけを数字へ置き換える。数字以外（区切り記号や漢字）はそのまま残す。
    private static func digitized(_ text: String) -> String {
        String(text.map { confusables[$0] ?? $0 })
    }

    static func normalize(_ text: String) -> String {
        var result = text

        for (expression, validate) in compiled {
            let range = NSRange(result.startIndex..., in: result)
            let matches = expression.matches(in: result, range: range)

            // 後ろから置換して、前方のインデックスがずれないようにする。
            for match in matches.reversed() {
                guard let matchRange = Range(match.range, in: result) else { continue }
                let original = String(result[matchRange])
                let converted = digitized(original)
                guard converted != original, validate(converted) else { continue }
                result.replaceSubrange(matchRange, with: converted)
            }
        }
        return result
    }
}
