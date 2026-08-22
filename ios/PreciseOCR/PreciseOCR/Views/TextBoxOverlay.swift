import SwiftUI

/// 認識した行の位置を画像の上に重ねて描く。
/// Vision の正規化座標（原点は左下）を SwiftUI の座標（原点は左上）へ変換する。
struct TextBoxOverlay: View {
    var lines: [RecognizedLine]
    var selectedLineID: UUID?

    var body: some View {
        GeometryReader { geometry in
            ForEach(lines) { line in
                let rect = convert(line.boundingBox, in: geometry.size)
                RoundedRectangle(cornerRadius: 2)
                    .stroke(color(for: line), lineWidth: line.id == selectedLineID ? 3 : 1.5)
                    .background(
                        RoundedRectangle(cornerRadius: 2)
                            .fill(color(for: line).opacity(line.id == selectedLineID ? 0.25 : 0.08))
                    )
                    .frame(width: rect.width, height: rect.height)
                    .position(x: rect.midX, y: rect.midY)
            }
        }
        .allowsHitTesting(false)
    }

    private func convert(_ box: CGRect, in size: CGSize) -> CGRect {
        CGRect(x: box.minX * size.width,
               y: (1 - box.maxY) * size.height,
               width: box.width * size.width,
               height: box.height * size.height)
    }

    /// 信頼度が低い行ほど赤寄りにして、見直すべき箇所が一目で分かるようにする。
    private func color(for line: RecognizedLine) -> Color {
        switch line.confidence {
        case ..<0.5: return .red
        case ..<0.8: return .orange
        default: return .green
        }
    }
}
