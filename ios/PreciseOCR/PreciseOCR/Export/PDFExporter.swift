import UIKit

/// スキャン画像の上に透明なテキスト層を重ねた「検索できる PDF」を書き出す。
/// 見た目は撮影した画像そのままで、PDF ビューアでの検索・選択・コピーができる。
enum PDFExporter {

    /// 72dpi 換算のページ幅の上限（レターサイズ幅）。ピクセル等倍だと巨大なページになるため縮める。
    private static let maxPageWidth: CGFloat = 612

    static func write(results: [ScanResult]) throws -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("スキャン結果")
            .appendingPathExtension("pdf")
        try? FileManager.default.removeItem(at: url)

        let renderer = UIGraphicsPDFRenderer(bounds: .zero)
        try renderer.writePDF(to: url) { context in
            for result in results {
                addPage(for: result, in: context)
            }
        }
        return url
    }

    private static func addPage(for result: ScanResult, in context: UIGraphicsPDFRendererContext) {
        let image = result.image
        guard image.size.width > 0, image.size.height > 0 else { return }

        let scale = min(1, maxPageWidth / image.size.width)
        let pageRect = CGRect(x: 0, y: 0,
                              width: image.size.width * scale,
                              height: image.size.height * scale)
        context.beginPage(withBounds: pageRect, pageInfo: [:])
        image.draw(in: pageRect)

        for line in result.document.lines where !line.text.isEmpty {
            let box = line.boundingBox
            guard box.width > 0, box.height > 0 else { continue }

            // Vision の正規化座標（原点は左下）を PDF ページ座標（原点は左上）へ。
            let rect = CGRect(x: box.minX * pageRect.width,
                              y: (1 - box.maxY) * pageRect.height,
                              width: box.width * pageRect.width,
                              height: box.height * pageRect.height)
            let font = fittedFont(for: line.text, in: rect)
            (line.text as NSString).draw(in: rect, withAttributes: [
                .font: font,
                .foregroundColor: UIColor.clear
            ])
        }
    }

    /// 行の矩形に収まるフォントサイズを求める。検索位置と画像の文字位置を概ね一致させるため。
    private static func fittedFont(for text: String, in rect: CGRect) -> UIFont {
        var size = max(rect.height * 0.9, 4)
        let ns = text as NSString
        for _ in 0..<4 {
            let width = ns.size(withAttributes: [.font: UIFont.systemFont(ofSize: size)]).width
            if width <= rect.width || size <= 4 { break }
            size = max(size * rect.width / width, 4)
        }
        return UIFont.systemFont(ofSize: size)
    }
}
