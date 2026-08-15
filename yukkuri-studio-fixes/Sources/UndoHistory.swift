import Foundation

/// 値型の状態をまるごとスナップショットして持つ Undo / Redo スタック。
///
/// `MovieProject` は Codable な値型なので、個々の変更を記録するより
/// 変更前の状態を丸ごと積むほうが安全で、記録漏れも起きない。
///
/// ドラッグのように 1 操作で何十回も値が変わるものは `token` を渡すことで
/// 1 ステップにまとめる（同じ token が連続している間は積み増さない）。
@MainActor
final class UndoHistory<State> {

    private struct Entry {
        let state: State
        let token: String?
    }

    private var past: [Entry] = []
    private var future: [State] = []
    private let limit: Int

    var canUndo: Bool { !past.isEmpty }
    var canRedo: Bool { !future.isEmpty }

    init(limit: Int = 100) {
        self.limit = max(1, limit)
    }

    /// 状態を変更する「直前」に呼び、変更前のスナップショットを積む。
    ///
    /// - Parameters:
    ///   - snapshot: 変更前の状態。
    ///   - token: 連続操作をまとめるための識別子。
    ///            例: 画像 ID ごとのドラッグなら `"drag-\(imageID)"`。
    ///            単発操作では nil。
    func record(_ snapshot: State, token: String? = nil) {
        if let token, let last = past.last, last.token == token {
            // 同一操作の続き。最初のスナップショットだけを残す。
            future.removeAll()
            return
        }

        past.append(Entry(state: snapshot, token: token))
        if past.count > limit {
            past.removeFirst(past.count - limit)
        }
        future.removeAll()
    }

    /// 直前の状態を取り出す。戻す状態が無ければ nil。
    ///
    /// - Parameter current: 現在の状態（Redo 用に積まれる）。
    func undo(current: State) -> State? {
        guard let entry = past.popLast() else { return nil }
        future.append(current)
        return entry.state
    }

    /// Undo で戻した状態をやり直す。
    func redo(current: State) -> State? {
        guard let next = future.popLast() else { return nil }
        past.append(Entry(state: current, token: nil))
        return next
    }

    /// 進行中の連続操作を確定し、次の変更が別ステップになるようにする。
    ///
    /// ドラッグ終了時（マウスアップ）に呼ぶ。
    func endCoalescing() {
        guard let last = past.last, last.token != nil else { return }
        past[past.count - 1] = Entry(state: last.state, token: nil)
    }

    /// プロジェクトを新規作成・読み込みしたときに履歴を捨てる。
    func reset() {
        past.removeAll()
        future.removeAll()
    }
}
