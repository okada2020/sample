import Foundation

/// プロジェクトを「持ち運べる」形で保存する。
///
/// v0.3.0 は画像・立ち絵・BGM・生成音声を絶対パスの文字列で保持していたため、
/// 素材を 1 つ移動しただけでプロジェクトが壊れていた。
///
/// 保存時に参照素材を `<プロジェクト名>.assets/` へ集めて相対パスへ書き換え、
/// 読み込み時に絶対パスへ戻す。これでプロジェクトフォルダごと移動・コピーできる。
enum ProjectPortability {

    private static let assetsFolderSuffix = ".assets"

    /// `~/Movies/sample.json` に対して `~/Movies/sample.assets/`
    static func assetsDirectory(for projectURL: URL) -> URL {
        let name = projectURL.deletingPathExtension().lastPathComponent
        return projectURL
            .deletingLastPathComponent()
            .appendingPathComponent(name + assetsFolderSuffix, isDirectory: true)
    }

    // MARK: - 保存

    /// 参照素材を集めてパスを相対化したプロジェクトを返す。保存直前に呼ぶ。
    ///
    /// 見つからない素材（リンク切れ）は元のパスのまま残し、保存を失敗させない。
    static func collectingAssets(of project: MovieProject, savingTo projectURL: URL) throws -> MovieProject {
        let directory = assetsDirectory(for: projectURL)
        try StudioStorage.ensure(directory)

        let folderName = directory.lastPathComponent
        var relocated: [String: String] = [:]   // 元の絶対パス -> 相対パス
        var usedNames: Set<String> = []

        func relocate(_ path: String?) -> String? {
            guard let path, !path.isEmpty else { return path }
            // すでに相対パス（= 収集済み）なら触らない
            guard path.hasPrefix("/") else { return path }
            if let done = relocated[path] { return done }

            let source = URL(fileURLWithPath: path)
            guard FileManager.default.fileExists(atPath: source.path) else {
                return path   // リンク切れはそのまま残す
            }

            var filename = source.lastPathComponent
            var suffix = 2
            while usedNames.contains(filename.lowercased()) {
                let base = source.deletingPathExtension().lastPathComponent
                let ext = source.pathExtension
                filename = ext.isEmpty ? "\(base)-\(suffix)" : "\(base)-\(suffix).\(ext)"
                suffix += 1
            }
            usedNames.insert(filename.lowercased())

            let target = directory.appendingPathComponent(filename)
            try? FileManager.default.removeItem(at: target)
            do {
                try FileManager.default.copyItem(at: source, to: target)
            } catch {
                return path   // コピーできなければ元のパスで保存
            }

            let relative = "\(folderName)/\(filename)"
            relocated[path] = relative
            return relative
        }

        var result = project
        for index in result.speakers.indices {
            result.speakers[index].standingImagePath = relocate(result.speakers[index].standingImagePath)
        }
        for index in result.dialogues.indices {
            result.dialogues[index].audioFilePath = relocate(result.dialogues[index].audioFilePath)
        }
        for index in result.images.indices {
            result.images[index].filePath = relocate(result.images[index].filePath) ?? result.images[index].filePath
        }
        for index in result.bgmClips.indices {
            result.bgmClips[index].filePath = relocate(result.bgmClips[index].filePath) ?? result.bgmClips[index].filePath
        }
        return result
    }

    // MARK: - 読み込み

    /// 相対パスを絶対パスへ復元する。読み込み直後に呼ぶ。
    static func resolvingAssets(of project: MovieProject, loadedFrom projectURL: URL) -> MovieProject {
        let base = projectURL.deletingLastPathComponent()

        func resolve(_ path: String?) -> String? {
            guard let path, !path.isEmpty, !path.hasPrefix("/") else { return path }
            return base.appendingPathComponent(path).standardizedFileURL.path
        }

        var result = project
        for index in result.speakers.indices {
            result.speakers[index].standingImagePath = resolve(result.speakers[index].standingImagePath)
        }
        for index in result.dialogues.indices {
            result.dialogues[index].audioFilePath = resolve(result.dialogues[index].audioFilePath)
        }
        for index in result.images.indices {
            result.images[index].filePath = resolve(result.images[index].filePath) ?? result.images[index].filePath
        }
        for index in result.bgmClips.indices {
            result.bgmClips[index].filePath = resolve(result.bgmClips[index].filePath) ?? result.bgmClips[index].filePath
        }
        return result
    }

    // MARK: - リンク切れの検出

    /// 参照先が存在しない素材のパス一覧。読み込み後に警告を出すのに使う。
    static func missingAssets(of project: MovieProject) -> [String] {
        var paths: [String] = []
        paths.append(contentsOf: project.speakers.compactMap { $0.standingImagePath })
        paths.append(contentsOf: project.dialogues.compactMap { $0.audioFilePath })
        paths.append(contentsOf: project.images.map { $0.filePath })
        paths.append(contentsOf: project.bgmClips.map { $0.filePath })

        let fileManager = FileManager.default
        var seen: Set<String> = []
        return paths.filter { path in
            guard !path.isEmpty, seen.insert(path).inserted else { return false }
            return !fileManager.fileExists(atPath: path)
        }
    }
}
