"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const vscode = require("vscode");
const util_1 = require("./util");
function fetchEditPoint(direction) {
    let editor = vscode.window.activeTextEditor;
    if (!util_1.validate()) {
        return;
    }
    let newSelections = [];
    editor.selections.forEach(selection => {
        let updatedSelection = direction === 'next' ? nextEditPoint(selection.anchor, editor) : prevEditPoint(selection.anchor, editor);
        newSelections.push(updatedSelection ? updatedSelection : selection);
    });
    editor.selections = newSelections;
    editor.revealRange(editor.selections[editor.selections.length - 1]);
}
exports.fetchEditPoint = fetchEditPoint;
function nextEditPoint(position, editor) {
    for (let lineNum = position.line; lineNum < editor.document.lineCount; lineNum++) {
        let updatedSelection = findEditPoint(lineNum, editor, position, 'next');
        if (updatedSelection) {
            return updatedSelection;
        }
    }
}
function prevEditPoint(position, editor) {
    for (let lineNum = position.line; lineNum >= 0; lineNum--) {
        let updatedSelection = findEditPoint(lineNum, editor, position, 'prev');
        if (updatedSelection) {
            return updatedSelection;
        }
    }
}
function findEditPoint(lineNum, editor, position, direction) {
    let line = editor.document.lineAt(lineNum);
    let lineContent = line.text;
    if (lineNum !== position.line && line.isEmptyOrWhitespace) {
        return new vscode.Selection(lineNum, lineContent.length, lineNum, lineContent.length);
    }
    if (lineNum === position.line && direction === 'prev') {
        lineContent = lineContent.substr(0, position.character);
    }
    let emptyAttrIndex = direction === 'next' ? lineContent.indexOf('""', lineNum === position.line ? position.character : 0) : lineContent.lastIndexOf('""');
    let emptyTagIndex = direction === 'next' ? lineContent.indexOf('><', lineNum === position.line ? position.character : 0) : lineContent.lastIndexOf('><');
    let winner = -1;
    if (emptyAttrIndex > -1 && emptyTagIndex > -1) {
        winner = direction === 'next' ? Math.min(emptyAttrIndex, emptyTagIndex) : Math.max(emptyAttrIndex, emptyTagIndex);
    }
    else if (emptyAttrIndex > -1) {
        winner = emptyAttrIndex;
    }
    else {
        winner = emptyTagIndex;
    }
    if (winner > -1) {
        return new vscode.Selection(lineNum, winner + 1, lineNum, winner + 1);
    }
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/emmet/out/editPoint.js.map
