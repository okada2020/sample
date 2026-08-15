import Combine
import Foundation
import SwiftUI

// MARK: - EditorStore への追加が必要な stored property
//
// Swift の extension には格納プロパティを追加できないため、
// EditorStore クラス本体へ次の 2 行を足してから、このファイルを追加する。
//
//     let undoHistory = UndoHistory<MovieProject>()
//     private let autosave = AutosaveController()
//
// そのうえで、`project` を書き換えている既存コードを
// すべて `mutate { ... }` 経由へ置き換える。
//
//   変更前:  project.images[index].startX = newValue
//   変更後:  mutate { $0.images[index].startX = newValue }
//
//   ドラッグ中（連続変更）:
//            mutate(token: "drag-image-\(id)") { $0.images[index].startX = newValue }
//            …マウスアップ時に endDrag() を呼ぶ

extension EditorStore {

    // MARK: 変更の入口

    /// プロジェクトを変更する唯一の経路。Undo 記録と自動保存を自動で行う。
    ///
    /// - Parameters:
    ///   - token: ドラッグなど連続する変更を 1 ステップにまとめる識別子。
    ///   - body: 変更内容。
    func mutate(token: String? = nil, _ body: (inout MovieProject) -> Void) {
        undoHistory.record(project, token: token)
        body(&project)
        scheduleAutosave()
    }

    /// ドラッグ・ピンチなどの連続操作の終わりに呼ぶ。
    func endDrag() {
        undoHistory.endCoalescing()
    }

    // MARK: Undo / Redo

    var canUndo: Bool { undoHistory.canUndo }
    var canRedo: Bool { undoHistory.canRedo }

    func undo() {
        guard let restored = undoHistory.undo(current: project) else { return }
        project = restored
        pruneSelectionAfterHistoryChange()
        scheduleAutosave()
        statusMessage = "元に戻しました"
    }

    func redo() {
        guard let restored = undoHistory.redo(current: project) else { return }
        project = restored
        pruneSelectionAfterHistoryChange()
        scheduleAutosave()
        statusMessage = "やり直しました"
    }

    /// Undo で消えたアイテムを選択したままにしない。
    private func pruneSelectionAfterHistoryChange() {
        if let id = selectedDialogueID, !project.dialogues.contains(where: { $0.id == id }) {
            selectedDialogueID = nil
        }
        if let id = selectedImageID, !project.images.contains(where: { $0.id == id }) {
            selectedImageID = nil
        }
        if let id = selectedBGMID, !project.bgmClips.contains(where: { $0.id == id }) {
            selectedBGMID = nil
        }
        playhead = min(playhead, project.dialogues.map { $0.startTime + $0.duration }.max() ?? playhead)
    }
}

// MARK: - メニューバーへ ⌘Z / ⌘⇧Z を登録する
//
// YukkuriStudioApp.swift の Scene へ `.commands { UndoCommands(store: store) }` として追加する。

struct UndoCommands: Commands {
    @ObservedObject var store: EditorStore

    var body: some Commands {
        CommandGroup(replacing: .undoRedo) {
            Button("元に戻す") { store.undo() }
                .keyboardShortcut("z", modifiers: .command)
                .disabled(!store.canUndo)

            Button("やり直す") { store.redo() }
                .keyboardShortcut("z", modifiers: [.command, .shift])
                .disabled(!store.canRedo)
        }
    }
}
