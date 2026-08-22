import SwiftUI
import UIKit

/// ライブ検出のプレビューとシャッターを載せたカメラ画面。
struct LiveScannerScreen: View {
    var languages: [String]
    var onCapture: (UIImage) -> Void
    var onCancel: () -> Void

    @State private var liveText = ""
    @State private var captureRequested = false
    @State private var errorMessage: String?

    var body: some View {
        ZStack(alignment: .bottom) {
            LiveScannerView(liveText: $liveText,
                            onCapture: onCapture,
                            onError: { errorMessage = $0.localizedDescription },
                            captureRequested: $captureRequested,
                            recognitionLanguages: languages)
                .ignoresSafeArea()

            VStack(spacing: 16) {
                if !liveText.isEmpty {
                    ScrollView {
                        Text(liveText)
                            .font(.callout)
                            .foregroundStyle(.white)
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .padding(12)
                    }
                    .frame(maxHeight: 120)
                    .background(.black.opacity(0.55), in: RoundedRectangle(cornerRadius: 12))
                    .padding(.horizontal)
                }

                Text("シャッターを押すと高解像度で撮影し、精度優先で読み取ります")
                    .font(.caption)
                    .foregroundStyle(.white.opacity(0.85))

                HStack {
                    Button("キャンセル", action: onCancel)
                        .foregroundStyle(.white)
                        .frame(maxWidth: .infinity)

                    Button {
                        captureRequested = true
                    } label: {
                        Circle()
                            .fill(.white)
                            .frame(width: 72, height: 72)
                            .overlay(Circle().stroke(.white.opacity(0.6), lineWidth: 4).padding(-6))
                    }
                    .accessibilityLabel("撮影")

                    Color.clear.frame(maxWidth: .infinity)
                }
                .padding(.bottom, 24)
                .padding(.horizontal)
            }
        }
        .background(.black)
        .alert("カメラのエラー", isPresented: Binding(get: { errorMessage != nil },
                                                set: { if !$0 { errorMessage = nil } })) {
            Button("閉じる") { errorMessage = nil }
        } message: {
            Text(errorMessage ?? "")
        }
    }
}
