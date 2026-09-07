import PhotosUI
import SwiftUI
import UIKit

struct ContentView: View {
    @StateObject private var settingsStore = SettingsStore()
    @StateObject private var historyStore = HistoryStore()

    @State private var showDocumentScanner = false
    @State private var showLiveScanner = false
    @State private var showSettings = false
    @State private var photoItems: [PhotosPickerItem] = []

    @State private var results: [ScanResult] = []
    /// 範囲指定の確認待ちになっている画像。
    @State private var cropRequest: CropRequest?
    @State private var showResults = false
    @State private var isProcessing = false
    @State private var progressText = ""
    @State private var errorMessage: String?

    var body: some View {
        NavigationStack {
            List {
                Section {
                    actionRow(title: "書類をスキャン",
                              subtitle: "紙の資料に最適。四隅の検出と影の除去まで自動",
                              systemImage: "doc.viewfinder") {
                        if DocumentScannerView.isSupported {
                            showDocumentScanner = true
                        } else {
                            errorMessage = "この端末では書類スキャナを利用できません。"
                        }
                    }

                    actionRow(title: "カメラで撮影",
                              subtitle: "看板・ラベル・値札など。撮る前に文字を確認できる",
                              systemImage: "camera.viewfinder") {
                        if LiveScannerView.isAvailable {
                            showLiveScanner = true
                        } else {
                            errorMessage = "この端末ではライブ認識を利用できません。「書類をスキャン」をお使いください。"
                        }
                    }

                    PhotosPicker(selection: $photoItems,
                                 maxSelectionCount: 20,
                                 selectionBehavior: .ordered,
                                 matching: .images,
                                 photoLibrary: .shared()) {
                        rowLabel(title: "写真から読み取り",
                                 subtitle: "撮影済みの画像やスクリーンショット（最大 20 枚まで複数選択可）",
                                 systemImage: "photo.on.rectangle.angled")
                    }
                }

                Section {
                    NavigationLink {
                        HistoryView(store: historyStore, settings: settingsStore.settings)
                    } label: {
                        rowLabel(title: "履歴",
                                 subtitle: "\(historyStore.documents.count) 件を端末内に保存中",
                                 systemImage: "clock.arrow.circlepath")
                    }
                }

                Section {
                    LabeledContent("認識言語", value: settingsStore.settings.preferredLanguages.joined(separator: ", "))
                    LabeledContent("モード", value: settingsStore.settings.useAccurateLevel ? "精度優先" : "速度優先")
                } header: {
                    Text("現在の設定")
                } footer: {
                    Text("認識はすべて端末内（Apple Vision）で行われます。画像もテキストも外部へ送信しません。")
                }
            }
            .navigationTitle("高精度 OCR")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        showSettings = true
                    } label: {
                        Image(systemName: "gearshape")
                    }
                    .accessibilityLabel("設定")
                }
            }
            .navigationDestination(isPresented: $showResults) {
                if !results.isEmpty {
                    ResultView(results: results,
                               settings: settingsStore.settings) { historyStore.add($0) }
                }
            }
        }
        .fullScreenCover(isPresented: $showDocumentScanner) {
            DocumentScannerView { pages in
                showDocumentScanner = false
                start(with: pages, fromCamera: true)
            } onCancel: {
                showDocumentScanner = false
            } onError: { error in
                showDocumentScanner = false
                errorMessage = error.localizedDescription
            }
            .ignoresSafeArea()
        }
        .fullScreenCover(isPresented: $showLiveScanner) {
            LiveScannerScreen(languages: liveScannerLanguages,
                              frameCount: settingsStore.settings.burstFrameCount) { frames in
                showLiveScanner = false
                start(with: frames, fromCamera: true, burst: true)
            } onCancel: {
                showLiveScanner = false
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(store: settingsStore)
        }
        .fullScreenCover(item: $cropRequest) { request in
            CropView(image: request.image) {
                cropRequest = nil
            } onConfirm: { cropped in
                cropRequest = nil
                // 手で切り出した範囲に対して、さらに書類の四隅を探すと二重に切れてしまう。
                var settings = settingsStore.settings
                settings.cropToDocument = false
                recognize([cropped], settings: settings)
            }
        }
        .onChange(of: photoItems) { _, items in
            guard !items.isEmpty else { return }
            Task {
                defer { photoItems = [] }
                var images: [UIImage] = []
                for item in items {
                    if let data = try? await item.loadTransferable(type: Data.self),
                       let image = UIImage(data: data) {
                        images.append(image)
                    }
                }
                guard !images.isEmpty else {
                    errorMessage = "写真を読み込めませんでした。"
                    return
                }
                if images.count < items.count {
                    errorMessage = "\(items.count - images.count) 枚の写真を読み込めなかったため、読み込めた \(images.count) 枚のみ解析します。"
                }
                start(with: images)
            }
        }
        .overlay {
            if isProcessing {
                ProcessingOverlay(text: progressText)
            }
        }
        .alert("エラー", isPresented: Binding(get: { errorMessage != nil },
                                          set: { if !$0 { errorMessage = nil } })) {
            Button("閉じる") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }

    // MARK: - 認識

    /// 撮影・選択の直後に呼ぶ入口。設定に応じて、先に範囲指定の画面を挟む。
    /// fromCamera: カメラ由来なら、設定に応じて画像を写真アプリにも保存する
    /// （ライブラリから選んだ写真は重複保存になるため対象外）。
    /// burst: 連写した同じ被写体なら、複数ページではなく行ごとの多数決として扱う。
    @MainActor
    private func start(with images: [UIImage], fromCamera: Bool = false, burst: Bool = false) {
        guard !images.isEmpty else { return }

        // 範囲指定は 1 枚のときだけ。複数ページで毎回聞くと手数が増えすぎる。
        if settingsStore.settings.asksForCropRegion, images.count == 1, !burst {
            cropRequest = CropRequest(image: ImagePreprocessor.normalizedUp(images[0]))
            return
        }
        recognize(images, settings: settingsStore.settings, fromCamera: fromCamera, burst: burst)
    }

    @MainActor
    private func recognize(_ images: [UIImage],
                           settings: OCRSettings,
                           fromCamera: Bool = false,
                           burst: Bool = false) {
        guard !images.isEmpty else { return }
        isProcessing = true
        results = []

        Task {
            var recognized: [ScanResult] = []
            var failure: Error?

            if burst, images.count > 1 {
                progressText = "\(images.count) 枚を突き合わせています…"
                do {
                    recognized.append(try await TextRecognizer.recognize(images: images, settings: settings))
                } catch {
                    failure = error
                }
            } else {
                for (index, image) in images.enumerated() {
                    progressText = images.count > 1 ? "\(index + 1) / \(images.count) ページを解析中…" : "解析中…"
                    do {
                        recognized.append(try await TextRecognizer.recognize(image: image, settings: settings))
                    } catch {
                        failure = error
                    }
                }
            }

            isProcessing = false
            if recognized.isEmpty {
                errorMessage = (failure ?? OCRError.noTextFound).localizedDescription
            } else {
                // 読み取り結果は保存操作なしで履歴に残す。以後の編集も自動で反映される。
                recognized.forEach { historyStore.add($0) }
                if fromCamera, settings.savesScansToPhotos {
                    recognized.forEach {
                        UIImageWriteToSavedPhotosAlbum($0.image, nil, nil, nil)
                    }
                }
                results = recognized
                showResults = true
            }
        }
    }

    private var liveScannerLanguages: [String] {
        TextRecognizer.resolveLanguages(settingsStore.settings.preferredLanguages,
                                        accurate: settingsStore.settings.useAccurateLevel)
    }

    // MARK: - 部品

    private func actionRow(title: String,
                           subtitle: String,
                           systemImage: String,
                           action: @escaping () -> Void) -> some View {
        Button(action: action) {
            rowLabel(title: title, subtitle: subtitle, systemImage: systemImage)
        }
        .foregroundStyle(.primary)
    }

    private func rowLabel(title: String, subtitle: String, systemImage: String) -> some View {
        HStack(spacing: 14) {
            Image(systemName: systemImage)
                .font(.title2)
                .frame(width: 34)
                .foregroundStyle(.tint)
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.headline)
                Text(subtitle).font(.caption).foregroundStyle(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

/// fullScreenCover(item:) に渡すための、範囲指定待ちの画像。
private struct CropRequest: Identifiable {
    let id = UUID()
    let image: UIImage
}

private struct ProcessingOverlay: View {
    var text: String

    var body: some View {
        ZStack {
            Color.black.opacity(0.35).ignoresSafeArea()
            VStack(spacing: 12) {
                ProgressView()
                Text(text.isEmpty ? "解析中…" : text)
                    .font(.footnote)
            }
            .padding(24)
            .background(.regularMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
    }
}

#Preview {
    ContentView()
}
