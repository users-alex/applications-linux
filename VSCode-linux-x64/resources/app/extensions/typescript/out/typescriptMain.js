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
/* --------------------------------------------------------------------------------------------
 * Includes code from typescript-sublime-plugin project, obtained from
 * https://github.com/Microsoft/TypeScript-Sublime-Plugin/blob/master/TypeScript%20Indent.tmPreferences
 * ------------------------------------------------------------------------------------------ */
const vscode_1 = require("vscode");
// This must be the first statement otherwise modules might got loaded with
// the wrong locale.
const nls = require("vscode-nls");
nls.config({ locale: vscode_1.env.language });
const localize = nls.loadMessageBundle(__filename);
const path_1 = require("path");
const PConst = require("./protocol.const");
const typescriptServiceClient_1 = require("./typescriptServiceClient");
const bufferSyncSupport_1 = require("./features/bufferSyncSupport");
const jsDocCompletionProvider_1 = require("./features/jsDocCompletionProvider");
const taskProvider_1 = require("./features/taskProvider");
const ProjectStatus = require("./utils/projectStatus");
const typingsStatus_1 = require("./utils/typingsStatus");
const versionStatus_1 = require("./utils/versionStatus");
const plugins_1 = require("./utils/plugins");
const tsconfig_1 = require("./utils/tsconfig");
const convert_1 = require("./utils/convert");
const formattingConfigurationManager_1 = require("./features/formattingConfigurationManager");
const languageModeIds = require("./utils/languageModeIds");
var ProjectConfigAction;
(function (ProjectConfigAction) {
    ProjectConfigAction[ProjectConfigAction["None"] = 0] = "None";
    ProjectConfigAction[ProjectConfigAction["CreateConfig"] = 1] = "CreateConfig";
    ProjectConfigAction[ProjectConfigAction["LearnMore"] = 2] = "LearnMore";
})(ProjectConfigAction || (ProjectConfigAction = {}));
const standardLanguageDescriptions = [
    {
        id: 'typescript',
        diagnosticSource: 'ts',
        modeIds: [languageModeIds.typescript, languageModeIds.typescriptreact],
        configFile: 'tsconfig.json'
    }, {
        id: 'javascript',
        diagnosticSource: 'js',
        modeIds: [languageModeIds.javascript, languageModeIds.javascriptreact],
        configFile: 'jsconfig.json'
    }
];
function activate(context) {
    const plugins = plugins_1.getContributedTypeScriptServerPlugins();
    const lazyClientHost = (() => {
        let clientHost;
        return () => {
            if (!clientHost) {
                clientHost = new TypeScriptServiceClientHost(standardLanguageDescriptions, context.workspaceState, plugins);
                context.subscriptions.push(clientHost);
                const host = clientHost;
                clientHost.serviceClient.onReady().then(() => {
                    context.subscriptions.push(ProjectStatus.create(host.serviceClient, path => new Promise(resolve => setTimeout(() => resolve(host.handles(path)), 750)), context.workspaceState));
                }, () => {
                    // Nothing to do here. The client did show a message;
                });
            }
            return clientHost;
        };
    })();
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.reloadProjects', () => {
        lazyClientHost().reloadProjects();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('javascript.reloadProjects', () => {
        lazyClientHost().reloadProjects();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.selectTypeScriptVersion', () => {
        lazyClientHost().serviceClient.onVersionStatusClicked();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.openTsServerLog', () => {
        lazyClientHost().serviceClient.openTsServerLogFile();
    }));
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.restartTsServer', () => {
        lazyClientHost().serviceClient.restartTsServer();
    }));
    context.subscriptions.push(new taskProvider_1.default(() => lazyClientHost().serviceClient));
    const goToProjectConfig = (isTypeScript) => {
        const editor = vscode_1.window.activeTextEditor;
        if (editor) {
            lazyClientHost().goToProjectConfig(isTypeScript, editor.document.uri);
        }
    };
    context.subscriptions.push(vscode_1.commands.registerCommand('typescript.goToProjectConfig', goToProjectConfig.bind(null, true)));
    context.subscriptions.push(vscode_1.commands.registerCommand('javascript.goToProjectConfig', goToProjectConfig.bind(null, false)));
    const jsDocCompletionCommand = new jsDocCompletionProvider_1.TryCompleteJsDocCommand(() => lazyClientHost().serviceClient);
    context.subscriptions.push(vscode_1.commands.registerCommand(jsDocCompletionProvider_1.TryCompleteJsDocCommand.COMMAND_NAME, jsDocCompletionCommand.tryCompleteJsDoc, jsDocCompletionCommand));
    const EMPTY_ELEMENTS = ['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'keygen', 'link', 'menuitem', 'meta', 'param', 'source', 'track', 'wbr'];
    context.subscriptions.push(vscode_1.languages.setLanguageConfiguration('jsx-tags', {
        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\$\^\&\*\(\)\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\s]+)/g,
        onEnterRules: [
            {
                beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))([_:\\w][_:\\w-.\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                afterText: /^<\/([_:\w][_:\w-.\d]*)\s*>$/i,
                action: { indentAction: vscode_1.IndentAction.IndentOutdent }
            },
            {
                beforeText: new RegExp(`<(?!(?:${EMPTY_ELEMENTS.join('|')}))(\\w[\\w\\d]*)([^/>]*(?!/)>)[^<]*$`, 'i'),
                action: { indentAction: vscode_1.IndentAction.Indent }
            }
        ],
    }));
    const supportedLanguage = [].concat.apply([], standardLanguageDescriptions.map(x => x.modeIds).concat(plugins.map(x => x.languages)));
    function didOpenTextDocument(textDocument) {
        if (supportedLanguage.indexOf(textDocument.languageId) >= 0) {
            openListener.dispose();
            // Force activation
            void lazyClientHost();
            return true;
        }
        return false;
    }
    ;
    const openListener = vscode_1.workspace.onDidOpenTextDocument(didOpenTextDocument);
    for (let textDocument of vscode_1.workspace.textDocuments) {
        if (didOpenTextDocument(textDocument)) {
            break;
        }
    }
}
exports.activate = activate;
const validateSetting = 'validate.enable';
class LanguageProvider {
    constructor(client, description) {
        this.client = client;
        this.description = description;
        this.toUpdateOnConfigurationChanged = [];
        this._validate = true;
        this.disposables = [];
        this.versionDependentDisposables = [];
        this.formattingOptionsManager = new formattingConfigurationManager_1.default(client);
        this.bufferSyncSupport = new bufferSyncSupport_1.default(client, description.modeIds, {
            delete: (file) => {
                this.currentDiagnostics.delete(client.asUrl(file));
            }
        }, this._validate);
        this.syntaxDiagnostics = Object.create(null);
        this.semanticDiagnostics = Object.create(null);
        this.currentDiagnostics = vscode_1.languages.createDiagnosticCollection(description.id);
        this.typingsStatus = new typingsStatus_1.default(client);
        this.ataProgressReporter = new typingsStatus_1.AtaProgressReporter(client);
        vscode_1.workspace.onDidChangeConfiguration(this.configurationChanged, this, this.disposables);
        this.configurationChanged();
        client.onReady().then(() => __awaiter(this, void 0, void 0, function* () {
            yield this.registerProviders(client);
            this.bufferSyncSupport.listen();
        }), () => {
            // Nothing to do here. The client did show a message;
        });
    }
    dispose() {
        while (this.disposables.length) {
            const obj = this.disposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        while (this.versionDependentDisposables.length) {
            const obj = this.versionDependentDisposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
        this.typingsStatus.dispose();
        this.ataProgressReporter.dispose();
        this.currentDiagnostics.dispose();
        this.bufferSyncSupport.dispose();
    }
    registerProviders(client) {
        return __awaiter(this, void 0, void 0, function* () {
            const selector = this.description.modeIds;
            const config = vscode_1.workspace.getConfiguration(this.id);
            const completionItemProvider = new (yield Promise.resolve().then(function () { return require('./features/completionItemProvider'); })).default(client, this.description.id, this.typingsStatus);
            this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, completionItemProvider, '.', '"', '\'', '/', '@'));
            this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/directiveCommentCompletionProvider'); })).default(client), '@'));
            const { TypeScriptFormattingProvider, FormattingProviderManager } = yield Promise.resolve().then(function () { return require('./features/formattingProvider'); });
            const formattingProvider = new TypeScriptFormattingProvider(client, this.formattingOptionsManager);
            formattingProvider.updateConfiguration(config);
            this.disposables.push(vscode_1.languages.registerOnTypeFormattingEditProvider(selector, formattingProvider, ';', '}', '\n'));
            const formattingProviderManager = new FormattingProviderManager(this.description.id, formattingProvider, selector);
            formattingProviderManager.updateConfiguration();
            this.disposables.push(formattingProviderManager);
            this.toUpdateOnConfigurationChanged.push(formattingProviderManager);
            this.disposables.push(vscode_1.languages.registerCompletionItemProvider(selector, new jsDocCompletionProvider_1.JsDocCompletionProvider(client), '*'));
            this.disposables.push(vscode_1.languages.registerHoverProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/hoverProvider'); })).default(client)));
            this.disposables.push(vscode_1.languages.registerDefinitionProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/definitionProvider'); })).default(client)));
            this.disposables.push(vscode_1.languages.registerDocumentHighlightProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/documentHighlightProvider'); })).default(client)));
            this.disposables.push(vscode_1.languages.registerReferenceProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/referenceProvider'); })).default(client)));
            this.disposables.push(vscode_1.languages.registerDocumentSymbolProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/documentSymbolProvider'); })).default(client)));
            this.disposables.push(vscode_1.languages.registerSignatureHelpProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/signatureHelpProvider'); })).default(client), '(', ','));
            this.disposables.push(vscode_1.languages.registerRenameProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/renameProvider'); })).default(client)));
            this.disposables.push(vscode_1.languages.registerCodeActionsProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/codeActionProvider'); })).default(client, this.formattingOptionsManager, this.description.id)));
            this.disposables.push(vscode_1.languages.registerCodeActionsProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/refactorProvider'); })).default(client, this.formattingOptionsManager, this.description.id)));
            this.registerVersionDependentProviders();
            for (const modeId of this.description.modeIds) {
                this.disposables.push(vscode_1.languages.registerWorkspaceSymbolProvider(new (yield Promise.resolve().then(function () { return require('./features/workspaceSymbolProvider'); })).default(client, modeId)));
                const referenceCodeLensProvider = new (yield Promise.resolve().then(function () { return require('./features/referencesCodeLensProvider'); })).default(client, modeId);
                referenceCodeLensProvider.updateConfiguration();
                this.toUpdateOnConfigurationChanged.push(referenceCodeLensProvider);
                this.disposables.push(vscode_1.languages.registerCodeLensProvider(selector, referenceCodeLensProvider));
                const implementationCodeLensProvider = new (yield Promise.resolve().then(function () { return require('./features/implementationsCodeLensProvider'); })).default(client, modeId);
                implementationCodeLensProvider.updateConfiguration();
                this.toUpdateOnConfigurationChanged.push(implementationCodeLensProvider);
                this.disposables.push(vscode_1.languages.registerCodeLensProvider(selector, implementationCodeLensProvider));
                if (!this.description.isExternal) {
                    this.disposables.push(vscode_1.languages.setLanguageConfiguration(modeId, {
                        indentationRules: {
                            // ^(.*\*/)?\s*\}.*$
                            decreaseIndentPattern: /^((?!.*?\/\*).*\*\/)?\s*[\}\]\)].*$/,
                            // ^.*\{[^}"']*$
                            increaseIndentPattern: /^((?!\/\/).)*(\{[^}"'`]*|\([^)"'`]*|\[[^\]"'`]*)$/
                        },
                        wordPattern: /(-?\d*\.\d\w*)|([^\`\~\!\@\#\%\^\&\*\(\)\-\=\+\[\{\]\}\\\|\;\:\'\"\,\.\<\>\/\?\s]+)/g,
                        onEnterRules: [
                            {
                                // e.g. /** | */
                                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                                afterText: /^\s*\*\/$/,
                                action: { indentAction: vscode_1.IndentAction.IndentOutdent, appendText: ' * ' }
                            }, {
                                // e.g. /** ...|
                                beforeText: /^\s*\/\*\*(?!\/)([^\*]|\*(?!\/))*$/,
                                action: { indentAction: vscode_1.IndentAction.None, appendText: ' * ' }
                            }, {
                                // e.g.  * ...|
                                beforeText: /^(\t|(\ \ ))*\ \*(\ ([^\*]|\*(?!\/))*)?$/,
                                action: { indentAction: vscode_1.IndentAction.None, appendText: '* ' }
                            }, {
                                // e.g.  */|
                                beforeText: /^(\t|(\ \ ))*\ \*\/\s*$/,
                                action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
                            },
                            {
                                // e.g.  *-----*/|
                                beforeText: /^(\t|(\ \ ))*\ \*[^/]*\*\/\s*$/,
                                action: { indentAction: vscode_1.IndentAction.None, removeText: 1 }
                            }
                        ]
                    }));
                }
            }
        });
    }
    configurationChanged() {
        const config = vscode_1.workspace.getConfiguration(this.id);
        this.updateValidate(config.get(validateSetting, true));
        for (const toUpdate of this.toUpdateOnConfigurationChanged) {
            toUpdate.updateConfiguration();
        }
    }
    handles(file, doc) {
        if (doc && this.description.modeIds.indexOf(doc.languageId) >= 0) {
            return true;
        }
        if (this.bufferSyncSupport.handles(file)) {
            return true;
        }
        const base = path_1.basename(file);
        return !!base && base === this.description.configFile;
    }
    get id() {
        return this.description.id;
    }
    get diagnosticSource() {
        return this.description.diagnosticSource;
    }
    updateValidate(value) {
        if (this._validate === value) {
            return;
        }
        this._validate = value;
        this.bufferSyncSupport.validate = value;
        if (value) {
            this.triggerAllDiagnostics();
        }
        else {
            this.syntaxDiagnostics = Object.create(null);
            this.semanticDiagnostics = Object.create(null);
            this.currentDiagnostics.clear();
        }
    }
    reInitialize() {
        this.currentDiagnostics.clear();
        this.syntaxDiagnostics = Object.create(null);
        this.semanticDiagnostics = Object.create(null);
        this.bufferSyncSupport.reOpenDocuments();
        this.bufferSyncSupport.requestAllDiagnostics();
        this.formattingOptionsManager.reset();
        this.registerVersionDependentProviders();
    }
    registerVersionDependentProviders() {
        return __awaiter(this, void 0, void 0, function* () {
            while (this.versionDependentDisposables.length) {
                const obj = this.versionDependentDisposables.pop();
                if (obj) {
                    obj.dispose();
                }
            }
            this.versionDependentDisposables = [];
            if (!this.client) {
                return;
            }
            const selector = this.description.modeIds;
            if (this.client.apiVersion.has220Features()) {
                this.versionDependentDisposables.push(vscode_1.languages.registerImplementationProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/implementationProvider'); })).default(this.client)));
            }
            if (this.client.apiVersion.has213Features()) {
                this.versionDependentDisposables.push(vscode_1.languages.registerTypeDefinitionProvider(selector, new (yield Promise.resolve().then(function () { return require('./features/typeDefinitionProvider'); })).default(this.client)));
            }
        });
    }
    triggerAllDiagnostics() {
        this.bufferSyncSupport.requestAllDiagnostics();
    }
    syntaxDiagnosticsReceived(file, syntaxDiagnostics) {
        if (!this._validate) {
            return;
        }
        this.syntaxDiagnostics[file] = syntaxDiagnostics;
        const semanticDianostics = this.semanticDiagnostics[file] || [];
        this.currentDiagnostics.set(this.client.asUrl(file), semanticDianostics.concat(syntaxDiagnostics));
    }
    semanticDiagnosticsReceived(file, semanticDiagnostics) {
        if (!this._validate) {
            return;
        }
        this.semanticDiagnostics[file] = semanticDiagnostics;
        const syntaxDiagnostics = this.syntaxDiagnostics[file] || [];
        this.currentDiagnostics.set(this.client.asUrl(file), semanticDiagnostics.concat(syntaxDiagnostics));
    }
    configFileDiagnosticsReceived(file, diagnostics) {
        this.currentDiagnostics.set(this.client.asUrl(file), diagnostics);
    }
}
class TypeScriptServiceClientHost {
    constructor(descriptions, workspaceState, plugins) {
        this.languages = [];
        this.disposables = [];
        const handleProjectCreateOrDelete = () => {
            this.client.execute('reloadProjects', null, false);
            this.triggerAllDiagnostics();
        };
        const handleProjectChange = () => {
            setTimeout(() => {
                this.triggerAllDiagnostics();
            }, 1500);
        };
        const configFileWatcher = vscode_1.workspace.createFileSystemWatcher('**/[tj]sconfig.json');
        this.disposables.push(configFileWatcher);
        configFileWatcher.onDidCreate(handleProjectCreateOrDelete, this, this.disposables);
        configFileWatcher.onDidDelete(handleProjectCreateOrDelete, this, this.disposables);
        configFileWatcher.onDidChange(handleProjectChange, this, this.disposables);
        this.versionStatus = new versionStatus_1.default();
        this.disposables.push(this.versionStatus);
        this.client = new typescriptServiceClient_1.default(this, workspaceState, this.versionStatus, plugins);
        this.disposables.push(this.client);
        this.languagePerId = new Map();
        for (const description of descriptions) {
            const manager = new LanguageProvider(this.client, description);
            this.languages.push(manager);
            this.disposables.push(manager);
            this.languagePerId.set(description.id, manager);
        }
        this.client.onReady().then(() => {
            if (!this.client.apiVersion.has230Features()) {
                return;
            }
            const languages = new Set();
            for (const plugin of plugins) {
                for (const language of plugin.languages) {
                    languages.add(language);
                }
            }
            if (languages.size) {
                const description = {
                    id: 'typescript-plugins',
                    modeIds: Array.from(languages.values()),
                    diagnosticSource: 'ts-plugins',
                    isExternal: true
                };
                const manager = new LanguageProvider(this.client, description);
                this.languages.push(manager);
                this.disposables.push(manager);
                this.languagePerId.set(description.id, manager);
            }
        });
        this.client.onTsServerStarted(() => {
            this.triggerAllDiagnostics();
        });
    }
    dispose() {
        while (this.disposables.length) {
            const obj = this.disposables.pop();
            if (obj) {
                obj.dispose();
            }
        }
    }
    get serviceClient() {
        return this.client;
    }
    reloadProjects() {
        this.client.execute('reloadProjects', null, false);
        this.triggerAllDiagnostics();
    }
    handles(file) {
        return !!this.findLanguage(file);
    }
    goToProjectConfig(isTypeScriptProject, resource) {
        return __awaiter(this, void 0, void 0, function* () {
            const rootPath = this.client.getWorkspaceRootForResource(resource);
            if (!rootPath) {
                vscode_1.window.showInformationMessage(localize(0, null));
                return;
            }
            const file = this.client.normalizePath(resource);
            // TSServer errors when 'projectInfo' is invoked on a non js/ts file
            if (!file || !this.handles(file)) {
                vscode_1.window.showWarningMessage(localize(1, null));
                return;
            }
            let res = undefined;
            try {
                res = yield this.client.execute('projectInfo', { file, needFileNameList: false });
            }
            catch (_a) {
                // noop
            }
            if (!res || !res.body) {
                vscode_1.window.showWarningMessage(localize(2, null));
                return;
            }
            const { configFileName } = res.body;
            if (configFileName && !tsconfig_1.isImplicitProjectConfigFile(configFileName)) {
                const doc = yield vscode_1.workspace.openTextDocument(configFileName);
                vscode_1.window.showTextDocument(doc, vscode_1.window.activeTextEditor ? vscode_1.window.activeTextEditor.viewColumn : undefined);
                return;
            }
            const selected = yield vscode_1.window.showInformationMessage((isTypeScriptProject
                ? localize(3, null)
                : localize(4, null)), {
                title: isTypeScriptProject
                    ? localize(5, null)
                    : localize(6, null),
                id: ProjectConfigAction.CreateConfig
            }, {
                title: localize(7, null),
                id: ProjectConfigAction.LearnMore
            });
            switch (selected && selected.id) {
                case ProjectConfigAction.CreateConfig:
                    tsconfig_1.openOrCreateConfigFile(isTypeScriptProject, rootPath, this.client.configuration);
                    return;
                case ProjectConfigAction.LearnMore:
                    if (isTypeScriptProject) {
                        vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://go.microsoft.com/fwlink/?linkid=841896'));
                    }
                    else {
                        vscode_1.commands.executeCommand('vscode.open', vscode_1.Uri.parse('https://go.microsoft.com/fwlink/?linkid=759670'));
                    }
                    return;
            }
        });
    }
    findLanguage(file) {
        return vscode_1.workspace.openTextDocument(this.client.asUrl(file)).then((doc) => {
            for (const language of this.languages) {
                if (language.handles(file, doc)) {
                    return language;
                }
            }
            return null;
        }, () => null);
    }
    triggerAllDiagnostics() {
        for (const language of this.languagePerId.values()) {
            language.triggerAllDiagnostics();
        }
    }
    /* internal */ populateService() {
        // See https://github.com/Microsoft/TypeScript/issues/5530
        vscode_1.workspace.saveAll(false).then(() => {
            for (const language of this.languagePerId.values()) {
                language.reInitialize();
            }
        });
    }
    /* internal */ syntaxDiagnosticsReceived(event) {
        const body = event.body;
        if (body && body.diagnostics) {
            this.findLanguage(body.file).then(language => {
                if (language) {
                    language.syntaxDiagnosticsReceived(body.file, this.createMarkerDatas(body.diagnostics, language.diagnosticSource));
                }
            });
        }
    }
    /* internal */ semanticDiagnosticsReceived(event) {
        const body = event.body;
        if (body && body.diagnostics) {
            this.findLanguage(body.file).then(language => {
                if (language) {
                    language.semanticDiagnosticsReceived(body.file, this.createMarkerDatas(body.diagnostics, language.diagnosticSource));
                }
            });
        }
    }
    /* internal */ configFileDiagnosticsReceived(event) {
        // See https://github.com/Microsoft/TypeScript/issues/10384
        const body = event.body;
        if (!body || !body.diagnostics || !body.configFile) {
            return;
        }
        (this.findLanguage(body.configFile)).then(language => {
            if (!language) {
                return;
            }
            if (body.diagnostics.length === 0) {
                language.configFileDiagnosticsReceived(body.configFile, []);
            }
            else if (body.diagnostics.length >= 1) {
                vscode_1.workspace.openTextDocument(vscode_1.Uri.file(body.configFile)).then((document) => {
                    let curly = undefined;
                    let nonCurly = undefined;
                    let diagnostic;
                    for (let index = 0; index < document.lineCount; index++) {
                        const line = document.lineAt(index);
                        const text = line.text;
                        const firstNonWhitespaceCharacterIndex = line.firstNonWhitespaceCharacterIndex;
                        if (firstNonWhitespaceCharacterIndex < text.length) {
                            if (text.charAt(firstNonWhitespaceCharacterIndex) === '{') {
                                curly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + 1];
                                break;
                            }
                            else {
                                const matches = /\s*([^\s]*)(?:\s*|$)/.exec(text.substr(firstNonWhitespaceCharacterIndex));
                                if (matches && matches.length >= 1) {
                                    nonCurly = [index, firstNonWhitespaceCharacterIndex, firstNonWhitespaceCharacterIndex + matches[1].length];
                                }
                            }
                        }
                    }
                    const match = curly || nonCurly;
                    if (match) {
                        diagnostic = new vscode_1.Diagnostic(new vscode_1.Range(match[0], match[1], match[0], match[2]), body.diagnostics[0].text);
                    }
                    else {
                        diagnostic = new vscode_1.Diagnostic(new vscode_1.Range(0, 0, 0, 0), body.diagnostics[0].text);
                    }
                    if (diagnostic) {
                        diagnostic.source = language.diagnosticSource;
                        language.configFileDiagnosticsReceived(body.configFile, [diagnostic]);
                    }
                }, _error => {
                    language.configFileDiagnosticsReceived(body.configFile, [new vscode_1.Diagnostic(new vscode_1.Range(0, 0, 0, 0), body.diagnostics[0].text)]);
                });
            }
        });
    }
    createMarkerDatas(diagnostics, source) {
        const result = [];
        for (let diagnostic of diagnostics) {
            const { start, end, text } = diagnostic;
            const range = new vscode_1.Range(convert_1.tsLocationToVsPosition(start), convert_1.tsLocationToVsPosition(end));
            const converted = new vscode_1.Diagnostic(range, text);
            converted.severity = this.getDiagnosticSeverity(diagnostic);
            converted.source = diagnostic.source || source;
            if (diagnostic.code) {
                converted.code = diagnostic.code;
            }
            result.push(converted);
        }
        return result;
    }
    getDiagnosticSeverity(diagnostic) {
        switch (diagnostic.category) {
            case PConst.DiagnosticCategory.error:
                return vscode_1.DiagnosticSeverity.Error;
            case PConst.DiagnosticCategory.warning:
                return vscode_1.DiagnosticSeverity.Warning;
            default:
                return vscode_1.DiagnosticSeverity.Error;
        }
    }
}
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/typescript/out/typescriptMain.js.map
