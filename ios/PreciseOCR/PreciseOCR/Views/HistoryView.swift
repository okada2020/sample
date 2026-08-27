import SwiftUI

struct HistoryView: View {
    @ObservedObject var store: HistoryStore
    var settings: OCRSettings = .default

    var body: some View {
        List {
            ForEach(store.documents) { document in
                NavigationLink {
                    if let result = store.result(for: document) {
                        ResultView(results: [result], settings: settings) { store.update($0.document) }
                    } else {
                        // 画像だけ失われている場合でもテキストは読めるようにする。
                        ScrollView {
                            Text(document.plainText)
                                .frame(maxWidth: .infinity, alignment: .leading)
                                .padding()
                        }
                    }
                } label: {
                    VStack(alignment: .leading, spacing: 4) {
                        Text(document.plainText.prefix(60).replacingOccurrences(of: "\n", with: " "))
                            .lineLimit(2)
                        Text(document.createdAt.formatted(date: .abbreviated, time: .shortened))
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
            }
            .onDelete { store.delete(at: $0) }
        }
        .overlay {
            if store.documents.isEmpty {
                ContentUnavailableView("履歴はありません",
                                       systemImage: "clock",
                                       description: Text("読み取り結果を保存すると、ここに残ります。"))
            }
        }
        .navigationTitle("履歴")
        .navigationBarTitleDisplayMode(.inline)
    }
}
