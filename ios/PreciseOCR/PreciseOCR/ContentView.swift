import PhotosUI
import SwiftUI
import UIKit

struct ContentView: View {
    @StateObject private var settingsStore = SettingsStore()
    @StateObject private var historyStore = HistoryStore()

    @State private var showDocumentScanner = false
    @State private var showLiveScanner = false
    @State private var showSettings = false
    @State private var photoItem: PhotosPickerItem?

    @State private var results: [ScanResult] = []
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

                    PhotosPicker(selection: $photoItem, matching: .images, photoLibrary: .shared()) {
                        rowLabel(title: "写真から読み取り",
                                 subtitle: "撮影済みの画像やスクリーンショット",
                                 systemImage: "photo.on.rectangle.angled")
                    }
                }

                Section {
                    NavigationLink {
                        HistoryView(store: historyStore)
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
                    ResultView(results: results) { historyStore.add($0) }
                }
            }
        }
        .fullScreenCover(isPresented: $showDocumentScanner) {
            DocumentScannerView { pages in
                showDocumentScanner = false
                recognize(pages)
            } onCancel: {
                showDocumentScanner = false
            } onError: { error in
                showDocumentScanner = false
                errorMessage = error.localizedDescription
            }
            .ignoresSafeArea()
        }
        .fullScreenCover(isPresented: $showLiveScanner) {
            LiveScannerScreen(languages: liveScannerLanguages) { image in
                showLiveScanner = false
                recognize([image])
            } onCancel: {
                showLiveScanner = false
            }
        }
        .sheet(isPresented: $showSettings) {
            SettingsView(store: settingsStore)
        }
        .onChange(of: photoItem) { _, item in
            guard let item else { return }
            Task {
                defer { photoItem = nil }
                guard let data = try? await item.loadTransferable(type: Data.self),
                      let image = UIImage(data: data) else {
                    errorMessage = "写真を読み込めませんでした。"
                    return
                }
                recognize([image])
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

    @MainActor
    private func recognize(_ images: [UIImage]) {
        guard !images.isEmpty else { return }
        isProcessing = true
        results = []

        Task {
            var recognized: [ScanResult] = []
            var failure: Error?

            for (index, image) in images.enumerated() {
                progressText = images.count > 1 ? "\(index + 1) / \(images.count) ページを解析中…" : "解析中…"
                do {
                    recognized.append(try await TextRecognizer.recognize(image: image, settings: settingsStore.settings))
                } catch {
                    failure = error
                }
            }

            isProcessing = false
            if recognized.isEmpty {
                errorMessage = (failure ?? OCRError.noTextFound).localizedDescription
            } else {
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
