import Foundation

/// アプリが生成したファイルの永続的な保存先。
///
/// v0.3.0 は生成音声を `FileManager.default.temporaryDirectory` 配下
/// (`/var/folders/…/T/YukkuriStudio/GeneratedAudio`) へ書き出していた。
/// macOS は一時ディレクトリを再起動時および一定期間未アクセスのファイルに対して
/// 自動削除するため、保存済みプロジェクトを開き直すと音声が失われていた。
/// 保存先を Application Support へ移し、旧データは初回起動時に引き継ぐ。
enum StudioStorage {

    /// ~/Library/Application Support/YukkuriStudio
    static var rootDirectory: URL {
        let base = FileManager.default
            .urls(for: .applicationSupportDirectory, in: .userDomainMask)
            .first
            ?? FileManager.default.homeDirectoryForCurrentUser
                .appendingPathComponent("Library/Application Support", isDirectory: true)
        return base.appendingPathComponent("YukkuriStudio", isDirectory: true)
    }

    /// 生成した読み上げ音声の置き場所。
    static var generatedAudioDirectory: URL {
        rootDirectory.appendingPathComponent("GeneratedAudio", isDirectory: true)
    }

    /// 自動保存データの置き場所。
    static var autosaveDirectory: URL {
        rootDirectory.appendingPathComponent("Autosave", isDirectory: true)
    }

    /// v0.3.0 までの保存先（削除されうる一時ディレクトリ）。
    private static var legacyAudioDirectory: URL {
        FileManager.default.temporaryDirectory
            .appendingPathComponent("YukkuriStudio", isDirectory: true)
            .appendingPathComponent("GeneratedAudio", isDirectory: true)
    }

    /// ディレクトリの存在を保証して返す。
    @discardableResult
    static func ensure(_ url: URL) throws -> URL {
        try FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }

    /// 旧バージョンが一時ディレクトリへ残した音声を新しい保存先へ引き継ぐ。
    ///
    /// アプリ起動時に一度だけ呼ぶ。まだ削除されていない音声だけが救済対象になる。
    static func migrateLegacyAudioIfNeeded() {
        let fm = FileManager.default
        let legacy = legacyAudioDirectory
        guard fm.fileExists(atPath: legacy.path) else { return }

        do {
            let destination = try ensure(generatedAudioDirectory)
            let files = try fm.contentsOfDirectory(
                at: legacy,
                includingPropertiesForKeys: nil,
                options: [.skipsHiddenFiles]
            )
            for source in files {
                let target = destination.appendingPathComponent(source.lastPathComponent)
                guard !fm.fileExists(atPath: target.path) else { continue }
                try? fm.moveItem(at: source, to: target)
            }
            try? fm.removeItem(at: legacy)
        } catch {
            // 引き継ぎに失敗しても起動は妨げない
        }
    }

    /// どのセリフからも参照されていない音声ファイルを削除する。
    ///
    /// - Parameter keeping: 現在も使われている音声ファイルの絶対パス。
    static func removeUnreferencedAudio(keeping referenced: Set<String>) {
        let fm = FileManager.default
        guard let files = try? fm.contentsOfDirectory(
            at: generatedAudioDirectory,
            includingPropertiesForKeys: nil,
            options: [.skipsHiddenFiles]
        ) else { return }

        for file in files where !referenced.contains(file.path) {
            try? fm.removeItem(at: file)
        }
    }
}
