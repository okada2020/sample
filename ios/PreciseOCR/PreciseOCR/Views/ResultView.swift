import CoreTransferable
import SwiftUI
import UIKit
import UniformTypeIdentifiers
#if canImport(Translation)
import Translation
#endif

/// 認識結果の確認・修正画面。
struct ResultView: View {
    @State var results: [ScanResult]
    var onSave: ((ScanResult) -> Void)?

    @State private var pageIndex = 0
    @State private var mode: Mode = .text
    @State private var selectedLineID: UUID?
    @State private var showCopiedToast = false
    @State private var showTranslation = false

    enum Mode: String, CaseIterable, Identifiable {
        case text = "テキスト"
        case lines = "行ごと"
        case image = "画像"
        var id: String { rawValue }
    }

    private var current: ScanResult { results[min(pageIndex, results.count - 1)] }

    var body: some View {
        VStack(spacing: 0) {
            if results.count > 1 {
                Picker("ページ", selection: $pageIndex) {
                    ForEach(results.indices, id: \.self) { index in
                        Text("\(index + 1) ページ").tag(index)
                    }
                }
                .pickerStyle(.segmented)
                .padding(.horizontal)
                .padding(.top, 8)
            }

            Picker("表示", selection: $mode) {
                ForEach(Mode.allCases) { Text($0.rawValue).tag($0) }
            }
            .pickerStyle(.segmented)
            .padding()

            switch mode {
            case .text: textEditor
            case .lines: lineList
            case .image: imagePreview
            }

            confidenceBar
        }
        .navigationTitle("読み取り結果")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItemGroup(placement: .topBarTrailing) {
                Menu {
                    ShareLink(item: allText) {
                        Label("テキストを共有", systemImage: "doc.plaintext")
                    }
                    ShareLink(item: SearchablePDFExport(results: results),
                              preview: SharePreview("スキャン結果.pdf")) {
                        Label("検索できるPDFを共有", systemImage: "doc.richtext")
                    }
                    if #available(iOS 17.4, *) {
                        Button {
                            showTranslation = true
                        } label: {
                            Label("翻訳", systemImage: "character.bubble")
                        }
                    }
                } label: {
                    Image(systemName: "square.and.arrow.up")
                }
                .accessibilityLabel("共有")
                Button {
                    UIPasteboard.general.string = allText
                    showCopiedToast = true
                } label: {
                    Image(systemName: "doc.on.doc")
                }
                .accessibilityLabel("すべてコピー")
                if let onSave {
                    Button {
                        results.forEach(onSave)
                    } label: {
                        Image(systemName: "tray.and.arrow.down")
                    }
                    .accessibilityLabel("保存")
                }
            }
        }
        .overlay(alignment: .top) {
            if showCopiedToast {
                Text("コピーしました")
                    .font(.footnote)
                    .padding(.horizontal, 14)
                    .padding(.vertical, 8)
                    .background(.ultraThinMaterial, in: Capsule())
                    .padding(.top, 8)
                    .transition(.opacity)
                    .task {
                        try? await Task.sleep(nanoseconds: 1_500_000_000)
                        showCopiedToast = false
                    }
            }
        }
        .animation(.easeInOut(duration: 0.2), value: showCopiedToast)
        .modifier(TranslationSheet(isPresented: $showTranslation, text: allText))
    }

    // MARK: - 各表示

    private var textEditor: some View {
        TextEditor(text: Binding(
            get: { current.document.plainText },
            set: { newValue in replaceText(newValue) }
        ))
        .font(.body)
        .padding(.horizontal, 12)
        .scrollContentBackground(.hidden)
    }

    /// 行ごとに信頼度と別候補を出す。誤認識はここでタップして差し替える。
    private var lineList: some View {
        List {
            ForEach(current.document.lines) { line in
                VStack(alignment: .leading, spacing: 6) {
                    Text(line.text)
                        .font(.body)
                    HStack(spacing: 8) {
                        Label(String(format: "%.0f%%", line.confidence * 100), systemImage: "gauge.medium")
                            .font(.caption2)
                            .foregroundStyle(line.confidence < 0.5 ? .red : .secondary)
                        ForEach(line.alternatives, id: \.self) { alternative in
                            Button(alternative) { replace(line: line, with: alternative) }
                                .font(.caption2)
                                .buttonStyle(.bordered)
                        }
                    }
                }
                .listRowBackground(line.id == selectedLineID ? Color.accentColor.opacity(0.12) : nil)
                .onTapGesture { selectedLineID = line.id }
            }
        }
        .listStyle(.plain)
    }

    private var imagePreview: some View {
        ScrollView([.horizontal, .vertical]) {
            Image(uiImage: current.image)
                .resizable()
                .scaledToFit()
                .overlay { TextBoxOverlay(lines: current.document.lines, selectedLineID: selectedLineID) }
                .padding(8)
        }
    }

    private var confidenceBar: some View {
        HStack {
            let confidence = current.document.averageConfidence
            Label(String(format: "平均信頼度 %.0f%%", confidence * 100),
                  systemImage: confidence >= 0.8 ? "checkmark.seal" : "exclamationmark.triangle")
                .foregroundStyle(confidence >= 0.8 ? .green : .orange)
            Spacer()
            Text("\(current.document.lines.count) 行 / \(current.document.plainText.count) 文字")
                .foregroundStyle(.secondary)
        }
        .font(.footnote)
        .padding(.horizontal)
        .padding(.vertical, 10)
        .background(.bar)
    }

    private var allText: String {
        results.map(\.document.plainText).joined(separator: "\n\n")
    }

    // MARK: - 編集

    private func replaceText(_ newValue: String) {
        let index = min(pageIndex, results.count - 1)
        let newTexts = newValue.components(separatedBy: .newlines)
        var lines = results[index].document.lines

        // 行数が変わらない限り、矩形と信頼度は元の行に紐づけたまま文字だけ差し替える。
        if newTexts.count == lines.count {
            for (offset, text) in newTexts.enumerated() {
                lines[offset].text = text
            }
        } else {
            // 行の挿入・削除があった場合も、文面が一致する行は元の幾何情報を引き継ぐ。
            // 空行もそのまま保持する（捨てると編集内容が勝手に変わってしまう）。
            var remaining = lines
            lines = newTexts.map { text in
                if let match = remaining.firstIndex(where: { $0.text == text }) {
                    let kept = remaining[match]
                    remaining.removeSubrange(0...match)
                    return kept
                }
                return RecognizedLine(text: text, confidence: 1, boundingBox: .null)
            }
            fillMissingBoxes(&lines)
        }
        results[index].document.lines = lines
    }

    /// 幾何情報を持たない行（手入力の新規行）に、前後の行から補間した矩形を与える。
    /// 検索できる PDF はこの矩形でテキストを配置するため、ゼロ矩形のままだと層から抜け落ちる。
    private func fillMissingBoxes(_ lines: inout [RecognizedLine]) {
        func placedBelow(_ box: CGRect) -> CGRect {
            let height = max(box.height, 0.03)
            return CGRect(x: box.minX,
                          y: max(box.minY - height * 1.2, 0),
                          width: max(box.width, 0.1),
                          height: height)
        }

        var previous: CGRect?
        for index in lines.indices {
            if lines[index].boundingBox.isNull || lines[index].boundingBox.isEmpty {
                if let previous {
                    lines[index].boundingBox = placedBelow(previous)
                } else if let next = lines[index...].first(where: { !$0.boundingBox.isNull && !$0.boundingBox.isEmpty }) {
                    // 先頭側に幾何情報がない場合は、最初の既知の行の 1 行ぶん上に置く。
                    let box = next.boundingBox
                    let height = max(box.height, 0.03)
                    lines[index].boundingBox = CGRect(x: box.minX,
                                                      y: min(box.maxY + height * 0.2, 1 - height),
                                                      width: max(box.width, 0.1),
                                                      height: height)
                } else {
                    // 既知の行が 1 つもない: 上から順に等間隔で並べる。
                    let height: CGFloat = 0.03
                    let y = max(0.95 - CGFloat(index) * height * 1.3, 0)
                    lines[index].boundingBox = CGRect(x: 0.05, y: y, width: 0.9, height: height)
                }
            }
            previous = lines[index].boundingBox
        }
    }

    private func replace(line: RecognizedLine, with alternative: String) {
        let index = min(pageIndex, results.count - 1)
        guard let lineIndex = results[index].document.lines.firstIndex(where: { $0.id == line.id }) else { return }
        var updated = results[index].document.lines[lineIndex]
        var alternatives = updated.alternatives
        alternatives.removeAll { $0 == alternative }
        alternatives.insert(updated.text, at: 0)
        updated.text = alternative
        updated.alternatives = alternatives
        results[index].document.lines[lineIndex] = updated
    }
}


/// 「検索できる PDF」の共有アイテム。共有シートで実際に選ばれたときに初めて書き出す。
struct SearchablePDFExport: Transferable {
    var results: [ScanResult]

    static var transferRepresentation: some TransferRepresentation {
        FileRepresentation(exportedContentType: .pdf) { export in
            SentTransferredFile(try PDFExporter.write(results: export.results))
        }
    }
}

/// システムの翻訳シート（iOS 17.4 以降）。オンデバイス翻訳に対応した端末では通信せずに翻訳できる。
struct TranslationSheet: ViewModifier {
    @Binding var isPresented: Bool
    var text: String

    func body(content: Content) -> some View {
        #if canImport(Translation)
        if #available(iOS 17.4, *) {
            content.translationPresentation(isPresented: $isPresented, text: text)
        } else {
            content
        }
        #else
        content
        #endif
    }
}
