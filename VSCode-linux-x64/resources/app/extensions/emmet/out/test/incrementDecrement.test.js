"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const assert = require("assert");
const vscode_1 = require("vscode");
const testUtils_1 = require("./testUtils");
const incrementDecrement_1 = require("../incrementDecrement");
suite('Tests for Increment/Decrement Emmet Commands', () => {
    teardown(testUtils_1.closeAllEditors);
    const contents = `
	hello 123.43 there
	hello 999.9 there
	hello 100 there
	`;
    test('incrementNumberByOne', function () {
        return testUtils_1.withRandomFileEditor(contents, 'txt', (editor, doc) => {
            editor.selections = [new vscode_1.Selection(1, 7, 1, 10), new vscode_1.Selection(2, 7, 2, 10)];
            return incrementDecrement_1.incrementDecrement(1).then(() => {
                assert.equal(doc.getText(), contents.replace('123', '124').replace('999', '1000'));
                return Promise.resolve();
            });
        });
    });
    test('incrementNumberByTen', function () {
        return testUtils_1.withRandomFileEditor(contents, 'txt', (editor, doc) => {
            editor.selections = [new vscode_1.Selection(1, 7, 1, 10), new vscode_1.Selection(2, 7, 2, 10)];
            return incrementDecrement_1.incrementDecrement(10).then(() => {
                assert.equal(doc.getText(), contents.replace('123', '133').replace('999', '1009'));
                return Promise.resolve();
            });
        });
    });
    test('incrementNumberByOneTenth', function () {
        return testUtils_1.withRandomFileEditor(contents, 'txt', (editor, doc) => {
            editor.selections = [new vscode_1.Selection(1, 7, 1, 13), new vscode_1.Selection(2, 7, 2, 12)];
            return incrementDecrement_1.incrementDecrement(0.1).then(() => {
                assert.equal(doc.getText(), contents.replace('123.43', '123.53').replace('999.9', '1000'));
                return Promise.resolve();
            });
        });
    });
    test('decrementNumberByOne', function () {
        return testUtils_1.withRandomFileEditor(contents, 'txt', (editor, doc) => {
            editor.selections = [new vscode_1.Selection(1, 7, 1, 10), new vscode_1.Selection(3, 7, 3, 10)];
            return incrementDecrement_1.incrementDecrement(-1).then(() => {
                assert.equal(doc.getText(), contents.replace('123', '122').replace('100', '99'));
                return Promise.resolve();
            });
        });
    });
    test('decrementNumberByTen', function () {
        return testUtils_1.withRandomFileEditor(contents, 'txt', (editor, doc) => {
            editor.selections = [new vscode_1.Selection(1, 7, 1, 10), new vscode_1.Selection(3, 7, 3, 10)];
            return incrementDecrement_1.incrementDecrement(-10).then(() => {
                assert.equal(doc.getText(), contents.replace('123', '113').replace('100', '90'));
                return Promise.resolve();
            });
        });
    });
    test('decrementNumberByOneTenth', function () {
        return testUtils_1.withRandomFileEditor(contents, 'txt', (editor, doc) => {
            editor.selections = [new vscode_1.Selection(1, 7, 1, 13), new vscode_1.Selection(3, 7, 3, 10)];
            return incrementDecrement_1.incrementDecrement(-0.1).then(() => {
                assert.equal(doc.getText(), contents.replace('123.43', '123.33').replace('100', '99.9'));
                return Promise.resolve();
            });
        });
    });
});
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/emmet/out/test/incrementDecrement.test.js.map
