import AVFoundation
import Foundation

enum SpeechGenerationError: LocalizedError {
    case emptyText
    case voiceUnavailable
    case emptyAudio
    case writeFailed(String)

    var errorDescription: String? {
        switch self {
        case .emptyText:
            return "セリフが空です"
        case .voiceUnavailable:
            return "日本語の音声が見つかりません"
        case .emptyAudio:
            return "生成された音声が空でした"
        case .writeFailed(let reason):
            return "macOS音声合成に失敗しました: \(reason)"
        }
    }

    var recoverySuggestion: String? {
        switch self {
        case .emptyText:
            return "インスペクタでセリフの文章を入力してください。"
        case .voiceUnavailable, .emptyAudio:
            return """
            システム設定 →「アクセシビリティ」→「読み上げコンテンツ」→「システムの声」→「日本語」から \
            音声（Kyoko、Otoya など）をダウンロードしてください。
            """
        case .writeFailed:
            return "セリフの文字数を減らすか、話者の音声を別のものへ変更して再度お試しください。"
        }
    }
}

/// `AVSpeechSynthesizer.write(_:toBufferCallback:)` の出力を音声ファイルへ書き出す。
///
/// コールバックは合成エンジン側のスレッドから呼ばれるため、状態は自前で同期する。
/// 長さ 0 のバッファが終端の合図。
private final class SpeechBufferWriter: @unchecked Sendable {
    private let lock = NSLock()
    private let url: URL
    private let onFinish: (Result<AVAudioFramePosition, Error>) -> Void

    private var file: AVAudioFile?
    private var frameCount: AVAudioFramePosition = 0
    private var failure: Error?
    private var isFinished = false

    init(url: URL, onFinish: @escaping (Result<AVAudioFramePosition, Error>) -> Void) {
        self.url = url
        self.onFinish = onFinish
    }

    func handle(_ buffer: AVAudioBuffer) {
        lock.lock()
        defer { lock.unlock() }

        guard !isFinished, let pcm = buffer as? AVAudioPCMBuffer else { return }

        // 長さ 0 のバッファ = 合成完了
        guard pcm.frameLength > 0 else {
            isFinished = true
            file = nil  // ここでファイルが閉じられる
            if let failure {
                onFinish(.failure(failure))
            } else {
                onFinish(.success(frameCount))
            }
            return
        }

        do {
            if file == nil {
                file = try AVAudioFile(
                    forWriting: url,
                    settings: pcm.format.settings,
                    commonFormat: pcm.format.commonFormat,
                    interleaved: pcm.format.isInterleaved
                )
            }
            try file?.write(from: pcm)
            frameCount += AVAudioFramePosition(pcm.frameLength)
        } catch {
            failure = error
        }
    }
}

@MainActor
final class SpeechAudioGenerator {

    /// セリフを読み上げ音声ファイルへ書き出す。
    ///
    /// 生成が完全に成功するまで既存ファイルへ触れないため、
    /// 再生成が途中で失敗しても以前の音声は残る。
    func generate(
        text: String,
        voiceIdentifier: String?,
        rate: Float,
        pitch: Float,
        volume: Float,
        id: UUID
    ) async throws -> URL {

        let trimmed = text.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { throw SpeechGenerationError.emptyText }

        guard let voice = VoiceCatalog.voice(for: voiceIdentifier) else {
            throw SpeechGenerationError.voiceUnavailable
        }

        let directory = try StudioStorage.ensure(StudioStorage.generatedAudioDirectory)
        let finalURL = directory.appendingPathComponent("\(id.uuidString).caf")
        let workURL = directory.appendingPathComponent("\(id.uuidString)-\(UUID().uuidString).partial.caf")

        let utterance = AVSpeechUtterance(string: trimmed)
        utterance.voice = voice
        utterance.rate = rate
        utterance.pitchMultiplier = min(max(pitch, 0.5), 2.0)
        utterance.volume = min(max(volume, 0.0), 1.0)

        // AVSpeechSynthesizer は 1 インスタンスでの同時 write に対応しないため、
        // 生成ごとに使い捨てる（await 中に別のセリフの生成が始まっても衝突しない）。
        let synthesizer = AVSpeechSynthesizer()

        do {
            let frames: AVAudioFramePosition = try await withCheckedThrowingContinuation { continuation in
                let writer = SpeechBufferWriter(url: workURL) { result in
                    continuation.resume(with: result)
                }
                synthesizer.write(utterance) { buffer in
                    writer.handle(buffer)
                }
            }

            guard frames > 0 else {
                try? FileManager.default.removeItem(at: workURL)
                throw SpeechGenerationError.emptyAudio
            }

            try? FileManager.default.removeItem(at: finalURL)
            try FileManager.default.moveItem(at: workURL, to: finalURL)
            return finalURL

        } catch let error as SpeechGenerationError {
            throw error
        } catch {
            try? FileManager.default.removeItem(at: workURL)
            throw SpeechGenerationError.writeFailed(error.localizedDescription)
        }
    }

    /// 生成済み音声の実長（秒）。クリップ長へ反映するのに使う。
    static func duration(of url: URL) -> Double? {
        guard let file = try? AVAudioFile(forReading: url) else { return nil }
        let rate = file.fileFormat.sampleRate
        guard rate > 0 else { return nil }
        return Double(file.length) / rate
    }
}
