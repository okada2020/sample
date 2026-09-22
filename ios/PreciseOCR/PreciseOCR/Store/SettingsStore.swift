import Foundation
import SwiftUI

/// OCRSettings を UserDefaults に永続化する。
final class SettingsStore: ObservableObject {
    private static let key = "OCRSettings"

    @Published var settings: OCRSettings {
        didSet { save() }
    }

    init() {
        if let data = UserDefaults.standard.data(forKey: Self.key),
           let decoded = try? JSONDecoder().decode(OCRSettings.self, from: data) {
            settings = decoded
        } else {
            settings = .default
        }
    }

    private func save() {
        guard let data = try? JSONEncoder().encode(settings) else { return }
        UserDefaults.standard.set(data, forKey: Self.key)
    }

    func reset() {
        settings = .default
    }
}
