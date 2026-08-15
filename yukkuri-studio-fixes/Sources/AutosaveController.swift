import Foundation

/// 自動保存されたスナップショット。
struct AutosaveSnapshot: Codable {
    var project: MovieProject
    /// 「保存」済みプロジェクトなら、その保存先。未保存の新規プロジェクトなら nil。
    var originalPath: String?
    var savedAt: Date

    var originalURL: URL? {
        originalPath.map { URL(fileURLWithPath: $0) }
    }
}

/// 編集内容を一定間隔で自動保存し、クラッシュ後に復元できるようにする。
///
/// v0.3.0 には自動保存が無く、クラッシュや強制終了で作業内容が失われていた。
@MainActor
final class AutosaveController {

    private var pendingTask: Task<Void, Never>?
    private let debounce: Duration

    private var fileURL: URL {
        StudioStorage.autosaveDirectory.appendingPathComponent("current.json")
    }

    init(debounce: Duration = .seconds(3)) {
        self.debounce = debounce
    }

    /// 変更のたびに呼ぶ。最後の変更から `debounce` 秒経ってから 1 回だけ書き込む。
    func schedule(project: MovieProject, originalURL: URL?) {
        pendingTask?.cancel()
        pendingTask = Task { [weak self] in
            guard let self else { return }
            try? await Task.sleep(for: self.debounce)
            guard !Task.isCancelled else { return }
            self.writeNow(project: project, originalURL: originalURL)
        }
    }

    /// 即座に書き込む（アプリ終了時など）。
    func writeNow(project: MovieProject, originalURL: URL?) {
        let snapshot = AutosaveSnapshot(
            project: project,
            originalPath: originalURL?.path,
            savedAt: Date()
        )
        do {
            try StudioStorage.ensure(StudioStorage.autosaveDirectory)
            let encoder = JSONEncoder()
            encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
            encoder.dateEncodingStrategy = .iso8601
            let data = try encoder.encode(snapshot)
            try data.write(to: fileURL, options: .atomic)
        } catch {
            // 自動保存の失敗で編集を止めない
        }
    }

    /// 未復元の自動保存データがあれば読み出す。
    ///
    /// 起動時に呼び、nil でなければ「前回の作業内容を復元しますか？」を提示する。
    func pendingRecovery() -> AutosaveSnapshot? {
        guard FileManager.default.fileExists(atPath: fileURL.path),
              let data = try? Data(contentsOf: fileURL) else { return nil }

        let decoder = JSONDecoder()
        decoder.dateDecodingStrategy = .iso8601
        return try? decoder.decode(AutosaveSnapshot.self, from: data)
    }

    /// 明示的に保存された、または復元済み・破棄された時点で自動保存データを消す。
    func clear() {
        pendingTask?.cancel()
        pendingTask = nil
        try? FileManager.default.removeItem(at: fileURL)
    }
}
