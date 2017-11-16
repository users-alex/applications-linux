/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
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
const git_1 = require("./git");
const util_1 = require("./util");
class AutoFetcher {
    constructor(repository) {
        this.repository = repository;
        this._onDidChange = new vscode_1.EventEmitter();
        this.onDidChange = this._onDidChange.event;
        this._enabled = false;
        this.disposables = [];
        vscode_1.workspace.onDidChangeConfiguration(this.onConfiguration, this, this.disposables);
        this.onConfiguration();
    }
    get enabled() { return this._enabled; }
    set enabled(enabled) { this._enabled = enabled; this._onDidChange.fire(enabled); }
    onConfiguration() {
        const gitConfig = vscode_1.workspace.getConfiguration('git');
        if (gitConfig.get('autofetch') === false) {
            this.disable();
        }
        else {
            this.enable();
        }
    }
    enable() {
        if (this.enabled) {
            return;
        }
        this.enabled = true;
        this.run();
    }
    disable() {
        this.enabled = false;
    }
    run() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.enabled) {
                yield this.repository.whenIdleAndFocused();
                if (!this.enabled) {
                    return;
                }
                try {
                    yield this.repository.fetch();
                }
                catch (err) {
                    if (err.gitErrorCode === git_1.GitErrorCodes.AuthenticationFailed) {
                        this.disable();
                    }
                }
                if (!this.enabled) {
                    return;
                }
                const timeout = new Promise(c => setTimeout(c, AutoFetcher.Period));
                const whenDisabled = util_1.eventToPromise(util_1.filterEvent(this.onDidChange, enabled => !enabled));
                yield Promise.race([timeout, whenDisabled]);
            }
        });
    }
    dispose() {
        this.disable();
        this.disposables.forEach(d => d.dispose());
    }
}
AutoFetcher.Period = 3 * 60 * 1000 /* three minutes */;
exports.AutoFetcher = AutoFetcher;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/git/out/autofetch.js.map
