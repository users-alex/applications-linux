"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const convert_1 = require("../utils/convert");
const codeAction_1 = require("../utils/codeAction");
class TypeScriptCodeActionProvider {
    constructor(client, formattingConfigurationManager, mode) {
        this.client = client;
        this.formattingConfigurationManager = formattingConfigurationManager;
        this.commandId = `_typescript.applyCodeAction.${mode}`;
        vscode_1.commands.registerCommand(this.commandId, this.onCodeAction, this);
    }
    provideCodeActions(document, range, context, token) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!this.client.apiVersion.has213Features()) {
                return [];
            }
            const file = this.client.normalizePath(document.uri);
            if (!file) {
                return [];
            }
            const supportedActions = yield this.getSupportedActionsForContext(context);
            if (!supportedActions.size) {
                return [];
            }
            yield this.formattingConfigurationManager.ensureFormatOptionsForDocument(document, token);
            const args = Object.assign({}, convert_1.vsRangeToTsFileRange(file, range), { errorCodes: Array.from(supportedActions) });
            const response = yield this.client.execute('getCodeFixes', args, token);
            return (response.body || []).map(action => this.getCommandForAction(action, file));
        });
    }
    get supportedCodeActions() {
        if (!this._supportedCodeActions) {
            this._supportedCodeActions = this.client.execute('getSupportedCodeFixes', null, undefined)
                .then(response => response.body || [])
                .then(codes => codes.map(code => +code).filter(code => !isNaN(code)))
                .then(codes => codes.reduce((obj, code) => {
                obj[code] = true;
                return obj;
            }, Object.create(null)));
        }
        return this._supportedCodeActions;
    }
    getSupportedActionsForContext(context) {
        return __awaiter(this, void 0, void 0, function* () {
            const supportedActions = yield this.supportedCodeActions;
            return new Set(context.diagnostics
                .map(diagnostic => +diagnostic.code)
                .filter(code => supportedActions[code]));
        });
    }
    getCommandForAction(action, file) {
        return {
            title: action.description,
            command: this.commandId,
            arguments: [action, file]
        };
    }
    onCodeAction(action, file) {
        return codeAction_1.applyCodeAction(this.client, action, file);
    }
}
exports.default = TypeScriptCodeActionProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/typescript/out/features/codeActionProvider.js.map
