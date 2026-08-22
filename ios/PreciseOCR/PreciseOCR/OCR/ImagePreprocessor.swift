import CoreImage
import CoreImage.CIFilterBuiltins
import UIKit
import Vision

/// 認識前に画像を整える。ここでの下処理が Vision の精度をいちばん大きく左右する。
enum ImagePreprocessor {

    /// GPU コンテキストは生成コストが高いので使い回す。
    static let context = CIContext(options: [.useSoftwareRenderer: false])

    /// Vision が安定して読める長辺の下限・上限（ピクセル）。
    private static let minimumLongSide: CGFloat = 1_600
    private static let maximumLongSide: CGFloat = 4_032

    /// 台形補正 → 拡大縮小 → 輪郭強調 の順に適用する。
    static func prepare(_ image: UIImage, settings: OCRSettings) -> UIImage {
        let upright = normalizedUp(image)
        guard var ciImage = CIImage(image: upright) else { return upright }

        if settings.cropToDocument, let cropped = documentCropped(ciImage) {
            ciImage = cropped
        }
        ciImage = resizedForRecognition(ciImage)
        if settings.enhanceImage {
            ciImage = enhanced(ciImage)
        }
        return render(ciImage) ?? upright
    }

    // MARK: - 各処理

    /// UIImage の imageOrientation を実ピクセルに焼き込み、以降の座標計算を単純にする。
    static func normalizedUp(_ image: UIImage) -> UIImage {
        guard image.imageOrientation != .up || image.scale != 1 else { return image }
        let pixelSize = CGSize(width: image.size.width * image.scale,
                               height: image.size.height * image.scale)
        let format = UIGraphicsImageRendererFormat.default()
        format.scale = 1
        format.opaque = true
        return UIGraphicsImageRenderer(size: pixelSize, format: format).image { _ in
            image.draw(in: CGRect(origin: .zero, size: pixelSize))
        }
    }

    /// 書類の四隅を検出し、斜めから撮った紙を正面から見た形に直す。
    private static func documentCropped(_ image: CIImage) -> CIImage? {
        let request = VNDetectDocumentSegmentationRequest()
        let handler = VNImageRequestHandler(ciImage: image, options: [:])
        do {
            try handler.perform([request])
        } catch {
            return nil
        }
        guard let observation = request.results?.first, observation.confidence > 0.5 else {
            return nil
        }

        // 検出領域が画像の大半、あるいは極端に小さいときは触らない方が安全。
        let box = observation.boundingBox
        let coverage = box.width * box.height
        guard coverage > 0.2, coverage < 0.99 else { return nil }

        let extent = image.extent
        func point(_ normalized: CGPoint) -> CGPoint {
            CGPoint(x: extent.origin.x + normalized.x * extent.width,
                    y: extent.origin.y + normalized.y * extent.height)
        }

        let filter = CIFilter.perspectiveCorrection()
        filter.inputImage = image
        filter.topLeft = point(observation.topLeft)
        filter.topRight = point(observation.topRight)
        filter.bottomLeft = point(observation.bottomLeft)
        filter.bottomRight = point(observation.bottomRight)
        filter.crop = true
        return filter.outputImage
    }

    /// 文字が小さすぎると Vision は取りこぼす。逆に大きすぎると遅いだけなので上限も設ける。
    private static func resizedForRecognition(_ image: CIImage) -> CIImage {
        let longSide = max(image.extent.width, image.extent.height)
        guard longSide > 0 else { return image }

        let scale: CGFloat
        if longSide < minimumLongSide {
            scale = minimumLongSide / longSide
        } else if longSide > maximumLongSide {
            scale = maximumLongSide / longSide
        } else {
            return image
        }

        let filter = CIFilter.lanczosScaleTransform()
        filter.inputImage = image
        filter.scale = Float(scale)
        filter.aspectRatio = 1
        return filter.outputImage ?? image
    }

    /// 印刷物のかすれや低コントラストを補う。強くかけすぎると細い線が飛ぶので控えめに。
    private static func enhanced(_ image: CIImage) -> CIImage {
        let controls = CIFilter.colorControls()
        controls.inputImage = image
        controls.contrast = 1.08
        controls.brightness = 0.0
        controls.saturation = 0.85
        guard let adjusted = controls.outputImage else { return image }

        let sharpen = CIFilter.unsharpMask()
        sharpen.inputImage = adjusted
        sharpen.radius = 2.0
        sharpen.intensity = 0.6
        return sharpen.outputImage ?? adjusted
    }

    private static func render(_ image: CIImage) -> UIImage? {
        let rect = image.extent.isInfinite ? CGRect(x: 0, y: 0, width: 2_000, height: 2_000) : image.extent
        guard let cgImage = context.createCGImage(image, from: rect) else { return nil }
        return UIImage(cgImage: cgImage, scale: 1, orientation: .up)
    }

    // MARK: - 回転

    /// 反時計回りに 90 度 × n 回転させる（CIImage は Y 軸が上向きなので正の角度が反時計回り）。
    static func rotated(_ image: CIImage, quarterTurnsCCW turns: Int) -> CIImage {
        let normalizedTurns = ((turns % 4) + 4) % 4
        guard normalizedTurns != 0 else { return image }
        let rotated = image.transformed(by: CGAffineTransform(rotationAngle: CGFloat(normalizedTurns) * .pi / 2))
        return rotated.transformed(by: CGAffineTransform(translationX: -rotated.extent.origin.x,
                                                         y: -rotated.extent.origin.y))
    }

    /// 回転後の画像で得た正規化矩形を、回転前の座標系へ戻す。
    static func unrotate(_ rect: CGRect, quarterTurnsCCW turns: Int) -> CGRect {
        let normalizedTurns = ((turns % 4) + 4) % 4
        guard normalizedTurns != 0 else { return rect }

        func inverse(_ point: CGPoint) -> CGPoint {
            switch normalizedTurns {
            case 1: return CGPoint(x: point.y, y: 1 - point.x)
            case 2: return CGPoint(x: 1 - point.x, y: 1 - point.y)
            default: return CGPoint(x: 1 - point.y, y: point.x)
            }
        }

        let corners = [
            inverse(CGPoint(x: rect.minX, y: rect.minY)),
            inverse(CGPoint(x: rect.maxX, y: rect.minY)),
            inverse(CGPoint(x: rect.minX, y: rect.maxY)),
            inverse(CGPoint(x: rect.maxX, y: rect.maxY))
        ]
        let xs = corners.map(\.x)
        let ys = corners.map(\.y)
        return CGRect(x: xs.min() ?? 0,
                      y: ys.min() ?? 0,
                      width: (xs.max() ?? 0) - (xs.min() ?? 0),
                      height: (ys.max() ?? 0) - (ys.min() ?? 0))
    }
}
