import SwiftUI
import UIKit
import VisionKit

/// リアルタイムに文字を検出しながら、シャッターで高解像度の静止画も撮れるカメラ。
/// 看板・ラベル・値札のように「紙ではないもの」を読むときはこちら。
struct LiveScannerView: UIViewControllerRepresentable {
    /// 画面内で検出できている文字（プレビュー表示用）。
    @Binding var liveText: String
    /// シャッターで撮ったフレーム。複数枚なら行ごとの多数決に使う。
    var onCapture: ([UIImage]) -> Void
    var onError: (Error) -> Void
    /// シャッターを押した合図。View 側から true にすると撮影する。
    @Binding var captureRequested: Bool

    var recognitionLanguages: [String]
    /// シャッター 1 回で撮る枚数。
    var frameCount: Int

    static var isAvailable: Bool {
        DataScannerViewController.isSupported && DataScannerViewController.isAvailable
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(liveText: $liveText, onCapture: onCapture, onError: onError)
    }

    func makeUIViewController(context: Context) -> DataScannerViewController {
        let languages = recognitionLanguages.filter {
            DataScannerViewController.supportedTextRecognitionLanguages.contains($0)
        }
        let controller = DataScannerViewController(
            recognizedDataTypes: [.text(languages: languages)],
            qualityLevel: .accurate,
            recognizesMultipleItems: true,
            isHighFrameRateTrackingEnabled: false,
            isPinchToZoomEnabled: true,
            isGuidanceEnabled: true,
            isHighlightingEnabled: true
        )
        controller.delegate = context.coordinator
        return controller
    }

    func updateUIViewController(_ controller: DataScannerViewController, context: Context) {
        if !context.coordinator.isScanning {
            do {
                try controller.startScanning()
                context.coordinator.isScanning = true
            } catch {
                onError(error)
            }
        }
        if captureRequested, !context.coordinator.isCapturing {
            context.coordinator.isCapturing = true
            Task { @MainActor in
                defer {
                    context.coordinator.isCapturing = false
                    captureRequested = false
                }
                do {
                    // 連写して手ブレの影響を平均化する。1 枚でも失敗したら、撮れた分だけ使う。
                    var frames: [UIImage] = []
                    for _ in 0..<max(frameCount, 1) {
                        frames.append(try await controller.capturePhoto())
                    }
                    onCapture(frames)
                } catch {
                    onError(error)
                }
            }
        }
    }

    static func dismantleUIViewController(_ controller: DataScannerViewController, coordinator: Coordinator) {
        controller.stopScanning()
        coordinator.isScanning = false
    }

    final class Coordinator: NSObject, DataScannerViewControllerDelegate {
        @Binding private var liveText: String
        private let onCapture: (UIImage) -> Void
        private let onError: (Error) -> Void
        var isScanning = false
        var isCapturing = false

        init(liveText: Binding<String>,
             onCapture: @escaping (UIImage) -> Void,
             onError: @escaping (Error) -> Void) {
            self._liveText = liveText
            self.onCapture = onCapture
            self.onError = onError
        }

        func dataScanner(_ dataScanner: DataScannerViewController,
                         didAdd addedItems: [RecognizedItem],
                         allItems: [RecognizedItem]) {
            update(with: allItems)
        }

        func dataScanner(_ dataScanner: DataScannerViewController,
                         didUpdate updatedItems: [RecognizedItem],
                         allItems: [RecognizedItem]) {
            update(with: allItems)
        }

        func dataScanner(_ dataScanner: DataScannerViewController,
                         didRemove removedItems: [RecognizedItem],
                         allItems: [RecognizedItem]) {
            update(with: allItems)
        }

        func dataScanner(_ dataScanner: DataScannerViewController, becameUnavailableWithError error: DataScannerViewController.ScanningUnavailable) {
            isScanning = false
            onError(error)
        }

        private func update(with items: [RecognizedItem]) {
            let strings = items.compactMap { item -> String? in
                if case let .text(text) = item { return text.transcript }
                return nil
            }
            liveText = strings.joined(separator: "\n")
        }
    }
}
