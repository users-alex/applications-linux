/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
const vscode_1 = require("vscode");
const decorators_1 = require("./decorators");
const util_1 = require("./util");
class GitIgnoreDecorationProvider {
    constructor(repository) {
        this.repository = repository;
        this._onDidChangeDecorations = new vscode_1.EventEmitter();
        this.onDidChangeDecorations = this._onDidChangeDecorations.event;
        this.checkIgnoreQueue = new Map();
        this.disposables = [];
        this.disposables.push(vscode_1.window.registerDecorationProvider(this), util_1.filterEvent(vscode_1.workspace.onDidSaveTextDocument, e => e.fileName.endsWith('.gitignore'))(_ => this._onDidChangeDecorations.fire())
        //todo@joh -> events when the ignore status actually changes, not only when the file changes
        );
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
        this.checkIgnoreQueue.clear();
    }
    provideDecoration(uri) {
        return new Promise((resolve, reject) => {
            this.checkIgnoreQueue.set(uri.fsPath, { resolve, reject });
            this.checkIgnoreSoon();
        }).then(ignored => {
            if (ignored) {
                return {
                    priority: 3,
                    color: new vscode_1.ThemeColor('gitDecoration.ignoredResourceForeground')
                };
            }
        });
    }
    checkIgnoreSoon() {
        const queue = new Map(this.checkIgnoreQueue.entries());
        this.checkIgnoreQueue.clear();
        this.repository.checkIgnore([...queue.keys()]).then(ignoreSet => {
            for (const [key, value] of queue.entries()) {
                value.resolve(ignoreSet.has(key));
            }
        }, err => {
            console.error(err);
            for (const [, value] of queue.entries()) {
                value.reject(err);
            }
        });
    }
}
__decorate([
    decorators_1.debounce(500)
], GitIgnoreDecorationProvider.prototype, "checkIgnoreSoon", null);
class GitDecorationProvider {
    constructor(repository) {
        this.repository = repository;
        this._onDidChangeDecorations = new vscode_1.EventEmitter();
        this.onDidChangeDecorations = this._onDidChangeDecorations.event;
        this.disposables = [];
        this.decorations = new Map();
        this.disposables.push(vscode_1.window.registerDecorationProvider(this), repository.onDidRunOperation(this.onDidRunOperation, this));
    }
    onDidRunOperation() {
        let newDecorations = new Map();
        this.collectDecorationData(this.repository.indexGroup, newDecorations);
        this.collectDecorationData(this.repository.workingTreeGroup, newDecorations);
        this.collectDecorationData(this.repository.mergeGroup, newDecorations);
        let uris = [];
        newDecorations.forEach((value, uriString) => {
            if (this.decorations.has(uriString)) {
                this.decorations.delete(uriString);
            }
            else {
                uris.push(vscode_1.Uri.parse(uriString));
            }
        });
        this.decorations.forEach((value, uriString) => {
            uris.push(vscode_1.Uri.parse(uriString));
        });
        this.decorations = newDecorations;
        this._onDidChangeDecorations.fire(uris);
    }
    collectDecorationData(group, bucket) {
        group.resourceStates.forEach(r => {
            if (r.resourceDecoration) {
                bucket.set(r.original.toString(), r.resourceDecoration);
            }
        });
    }
    provideDecoration(uri) {
        return this.decorations.get(uri.toString());
    }
    dispose() {
        this.disposables.forEach(d => d.dispose());
    }
}
class GitDecorations {
    constructor(model) {
        this.model = model;
        this.modelListener = [];
        this.providers = new Map();
        this.configListener = vscode_1.workspace.onDidChangeConfiguration(e => e.affectsConfiguration('git.decorations.enabled') && this.update());
        this.update();
    }
    update() {
        const enabled = vscode_1.workspace.getConfiguration('git').get('decorations.enabled');
        if (enabled) {
            this.enable();
        }
        else {
            this.disable();
        }
    }
    enable() {
        this.modelListener = [];
        this.model.onDidOpenRepository(this.onDidOpenRepository, this, this.modelListener);
        this.model.onDidCloseRepository(this.onDidCloseRepository, this, this.modelListener);
        this.model.repositories.forEach(this.onDidOpenRepository, this);
    }
    disable() {
        this.modelListener.forEach(d => d.dispose());
        this.providers.forEach(value => value.dispose());
        this.providers.clear();
    }
    onDidOpenRepository(repository) {
        const provider = new GitDecorationProvider(repository);
        const ignoreProvider = new GitIgnoreDecorationProvider(repository);
        this.providers.set(repository, vscode_1.Disposable.from(provider, ignoreProvider));
    }
    onDidCloseRepository(repository) {
        const provider = this.providers.get(repository);
        if (provider) {
            provider.dispose();
            this.providers.delete(repository);
        }
    }
    dispose() {
        this.configListener.dispose();
        this.modelListener.forEach(d => d.dispose());
        this.providers.forEach(value => value.dispose);
        this.providers.clear();
    }
}
exports.GitDecorations = GitDecorations;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/git/out/decorationProvider.js.map
