import SwiftUI
import UIKit

/// 読み取る範囲をドラッグで指定する画面。
/// 範囲を絞ると、周囲の余計な文字を拾わなくなるうえ、その部分の実効解像度が上がる。
struct CropView: View {
    let image: UIImage
    var onCancel: () -> Void
    var onConfirm: (UIImage) -> Void

    /// 表示座標系での選択範囲。
    @State private var selection: CGRect = .zero
    /// 画面の中で画像が実際に描かれている領域。
    @State private var imageFrame: CGRect = .zero
    /// ドラッグ開始時の選択範囲（相対移動の基準）。
    @State private var dragOrigin: CGRect?

    private enum Handle {
        case topLeft, topRight, bottomLeft, bottomRight
    }

    private let handleSize: CGFloat = 28
    private let minimumSide: CGFloat = 44

    var body: some View {
        NavigationStack {
            GeometryReader { geometry in
                ZStack {
                    Color.black.ignoresSafeArea()

                    Image(uiImage: image)
                        .resizable()
                        .scaledToFit()

                    if selection != .zero {
                        CropMask(hole: selection)
                            .fill(.black.opacity(0.55), style: FillStyle(eoFill: true))
                            .ignoresSafeArea()

                        Rectangle()
                            .stroke(.white, lineWidth: 2)
                            .frame(width: selection.width, height: selection.height)
                            .position(x: selection.midX, y: selection.midY)
                            .contentShape(Rectangle())
                            .gesture(moveGesture)

                        handle(.topLeft)
                        handle(.topRight)
                        handle(.bottomLeft)
                        handle(.bottomRight)
                    }
                }
                .onAppear { layout(in: geometry.size) }
                .onChange(of: geometry.size) { _, newSize in layout(in: newSize) }
            }
            .navigationTitle("範囲を指定")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("キャンセル", action: onCancel)
                }
                ToolbarItem(placement: .bottomBar) {
                    Button("全体に戻す") { selection = imageFrame }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("この範囲で読み取る") {
                        onConfirm(croppedImage() ?? image)
                    }
                    .fontWeight(.semibold)
                }
            }
        }
    }

    // MARK: - 配置

    private func layout(in size: CGSize) {
        guard size.width > 0, size.height > 0, image.size.width > 0, image.size.height > 0 else { return }
        let scale = min(size.width / image.size.width, size.height / image.size.height)
        let drawn = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        let frame = CGRect(x: (size.width - drawn.width) / 2,
                           y: (size.height - drawn.height) / 2,
                           width: drawn.width,
                           height: drawn.height)
        imageFrame = frame
        // 初期状態は少し内側。四隅の余白（影や机）を最初から外しておく。
        selection = frame.insetBy(dx: frame.width * 0.08, dy: frame.height * 0.08)
    }

    // MARK: - 操作

    private var moveGesture: some Gesture {
        DragGesture()
            .onChanged { value in
                if dragOrigin == nil { dragOrigin = selection }
                guard let origin = dragOrigin else { return }
                var moved = origin.offsetBy(dx: value.translation.width, dy: value.translation.height)
                moved.origin.x = min(max(moved.minX, imageFrame.minX), imageFrame.maxX - moved.width)
                moved.origin.y = min(max(moved.minY, imageFrame.minY), imageFrame.maxY - moved.height)
                selection = moved
            }
            .onEnded { _ in dragOrigin = nil }
    }

    private func handle(_ corner: Handle) -> some View {
        Circle()
            .fill(.white)
            .overlay(Circle().stroke(.black.opacity(0.25), lineWidth: 1))
            .frame(width: handleSize, height: handleSize)
            .position(position(of: corner))
            .gesture(
                DragGesture()
                    .onChanged { value in
                        if dragOrigin == nil { dragOrigin = selection }
                        guard let origin = dragOrigin else { return }
                        selection = resized(origin, corner: corner, by: value.translation)
                    }
                    .onEnded { _ in dragOrigin = nil }
            )
    }

    private func position(of corner: Handle) -> CGPoint {
        switch corner {
        case .topLeft: return CGPoint(x: selection.minX, y: selection.minY)
        case .topRight: return CGPoint(x: selection.maxX, y: selection.minY)
        case .bottomLeft: return CGPoint(x: selection.minX, y: selection.maxY)
        case .bottomRight: return CGPoint(x: selection.maxX, y: selection.maxY)
        }
    }

    private func resized(_ origin: CGRect, corner: Handle, by translation: CGSize) -> CGRect {
        var left = origin.minX
        var top = origin.minY
        var right = origin.maxX
        var bottom = origin.maxY

        switch corner {
        case .topLeft:
            left += translation.width
            top += translation.height
        case .topRight:
            right += translation.width
            top += translation.height
        case .bottomLeft:
            left += translation.width
            bottom += translation.height
        case .bottomRight:
            right += translation.width
            bottom += translation.height
        }

        // 画像からはみ出さず、つぶれてしまわない範囲に収める。
        left = min(max(left, imageFrame.minX), right - minimumSide)
        right = max(min(right, imageFrame.maxX), left + minimumSide)
        top = min(max(top, imageFrame.minY), bottom - minimumSide)
        bottom = max(min(bottom, imageFrame.maxY), top + minimumSide)

        return CGRect(x: left, y: top, width: right - left, height: bottom - top)
    }

    // MARK: - 切り出し

    private func croppedImage() -> UIImage? {
        guard let source = image.cgImage, imageFrame.width > 0, imageFrame.height > 0 else { return nil }

        let bounds = CGRect(x: 0, y: 0, width: source.width, height: source.height)
        // 表示座標 → 画像内の割合 → ピクセル。どちらも原点は左上なので、そのまま対応する。
        let pixels = CGRect(x: (selection.minX - imageFrame.minX) / imageFrame.width * bounds.width,
                            y: (selection.minY - imageFrame.minY) / imageFrame.height * bounds.height,
                            width: selection.width / imageFrame.width * bounds.width,
                            height: selection.height / imageFrame.height * bounds.height)
            .integral
            .intersection(bounds)

        guard pixels.width >= 16, pixels.height >= 16,
              let cropped = source.cropping(to: pixels) else { return nil }
        return UIImage(cgImage: cropped, scale: 1, orientation: .up)
    }
}

/// 指定した矩形だけをくり抜くための形（偶奇塗りつぶしで穴が開く）。
private struct CropMask: Shape {
    var hole: CGRect

    func path(in rect: CGRect) -> Path {
        var path = Path(rect)
        path.addRect(hole)
        return path
    }
}
