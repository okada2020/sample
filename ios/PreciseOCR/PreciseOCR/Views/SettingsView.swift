import SwiftUI

struct SettingsView: View {
    @ObservedObject var store: SettingsStore
    @Environment(\.dismiss) private var dismiss
    @State private var customWordsText = ""

    private var supportedLanguages: [String] {
        TextRecognizer.supportedLanguages(accurate: store.settings.useAccurateLevel)
    }

    var body: some View {
        NavigationStack {
            Form {
                Section("認識モード") {
                    Toggle("精度優先（低速）", isOn: $store.settings.useAccurateLevel)
                    Toggle("言語補正を使う", isOn: $store.settings.usesLanguageCorrection)
                    Toggle("言語を自動判定", isOn: $store.settings.automaticallyDetectsLanguage)
                    Picker("読み順", selection: $store.settings.readingOrder) {
                        ForEach(ReadingOrder.allCases) { Text($0.label).tag($0) }
                    }
                    Toggle("縦書きを自動判定", isOn: $store.settings.autoDetectVerticalText)
                } footer: {
                    Text("型番や英数字の羅列が多い場合は「言語補正」を切ると誤補正が減ります。")
                }

                Section("言語") {
                    ForEach(supportedLanguages, id: \.self) { language in
                        let isOn = store.settings.preferredLanguages.contains(language)
                        Button {
                            toggle(language)
                        } label: {
                            HStack {
                                Text(displayName(for: language))
                                Spacer()
                                if isOn { Image(systemName: "checkmark").foregroundStyle(.tint) }
                            }
                        }
                        .foregroundStyle(.primary)
                    }
                } footer: {
                    Text("選んだ順に優先されます。使わない言語を外すほど精度は上がります。")
                }

                Section("前処理") {
                    Toggle("書類の四隅を検出して台形補正", isOn: $store.settings.cropToDocument)
                    Toggle("コントラスト・輪郭を補正", isOn: $store.settings.enhanceImage)
                    Toggle("向きを自動判定", isOn: $store.settings.autoRotate)
                    Toggle("日本語の余分な空白を削除", isOn: $store.settings.cleansJapaneseSpacing)
                }

                Section("辞書") {
                    TextEditor(text: $customWordsText)
                        .frame(minHeight: 80)
                        .onChange(of: customWordsText) { _, newValue in
                            store.settings.customWords = newValue
                                .components(separatedBy: .newlines)
                                .map { $0.trimmingCharacters(in: .whitespaces) }
                                .filter { !$0.isEmpty }
                        }
                } footer: {
                    Text("社名・薬剤名・型番などを 1 行に 1 語ずつ登録すると、その語に寄せて認識されます。")
                }

                Section {
                    Button("既定値に戻す", role: .destructive) {
                        store.reset()
                        customWordsText = ""
                    }
                }
            }
            .navigationTitle("設定")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button("完了") { dismiss() }
                }
            }
            .onAppear {
                customWordsText = store.settings.customWords.joined(separator: "\n")
            }
        }
    }

    private func toggle(_ language: String) {
        var languages = store.settings.preferredLanguages
        if let index = languages.firstIndex(of: language) {
            languages.remove(at: index)
        } else {
            languages.append(language)
        }
        // すべて外すと Vision の既定（英語）に戻ってしまうので、最低 1 つは残す。
        store.settings.preferredLanguages = languages.isEmpty ? [language] : languages
    }

    private func displayName(for identifier: String) -> String {
        let name = Locale.current.localizedString(forIdentifier: identifier) ?? identifier
        return "\(name)（\(identifier)）"
    }
}
