import Foundation
import SwiftUI
import UIKit

/// 認識結果を端末内に保存する。テキストは JSON、画像は JPEG。
/// 外部には一切送信しない。
final class HistoryStore: ObservableObject {
    @Published private(set) var documents: [RecognizedDocument] = []

    private let directory: URL
    private var indexURL: URL { directory.appendingPathComponent("index.json") }

    init() {
        let base = FileManager.default.urls(for: .applicationSupportDirectory, in: .userDomainMask)[0]
        directory = base.appendingPathComponent("Scans", isDirectory: true)
        try? FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        load()
    }

    func load() {
        guard let data = try? Data(contentsOf: indexURL),
              let decoded = try? JSONDecoder().decode([RecognizedDocument].self, from: data) else {
            documents = []
            return
        }
        documents = decoded.sorted { $0.createdAt > $1.createdAt }
    }

    func add(_ result: ScanResult) {
        if let data = result.image.jpegData(compressionQuality: 0.85) {
            try? data.write(to: imageURL(for: result.document.id), options: .atomic)
        }
        documents.removeAll { $0.id == result.document.id }
        documents.insert(result.document, at: 0)
        persist()
    }

    func update(_ document: RecognizedDocument) {
        guard let index = documents.firstIndex(where: { $0.id == document.id }) else { return }
        documents[index] = document
        persist()
    }

    func delete(at offsets: IndexSet) {
        let removed = offsets.map { documents[$0] }
        documents.remove(atOffsets: offsets)
        for document in removed {
            try? FileManager.default.removeItem(at: imageURL(for: document.id))
        }
        persist()
    }

    func image(for id: UUID) -> UIImage? {
        UIImage(contentsOfFile: imageURL(for: id).path)
    }

    func result(for document: RecognizedDocument) -> ScanResult? {
        guard let image = image(for: document.id) else { return nil }
        return ScanResult(image: image, document: document)
    }

    private func imageURL(for id: UUID) -> URL {
        directory.appendingPathComponent("\(id.uuidString).jpg")
    }

    private func persist() {
        guard let data = try? JSONEncoder().encode(documents) else { return }
        try? data.write(to: indexURL, options: .atomic)
    }
}
