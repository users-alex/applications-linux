/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
var vscode = require("vscode");
var path = require("path");
function normalizeLink(document, link, base) {
    var uri = vscode.Uri.parse(link);
    if (uri.scheme) {
        return uri;
    }
    // assume it must be a file
    var resourcePath = uri.path;
    if (!uri.path) {
        resourcePath = document.uri.path;
    }
    else if (uri.path[0] === '/') {
        var root = vscode.workspace.getWorkspaceFolder(document.uri);
        if (root) {
            resourcePath = path.join(root.uri.fsPath, uri.path);
        }
    }
    else {
        resourcePath = path.join(base, uri.path);
    }
    return vscode.Uri.parse("command:_markdown.openDocumentLink?" + encodeURIComponent(JSON.stringify({ fragment: uri.fragment, path: resourcePath })));
}
function matchAll(pattern, text) {
    var out = [];
    pattern.lastIndex = 0;
    var match;
    while ((match = pattern.exec(text))) {
        out.push(match);
    }
    return out;
}
var LinkProvider = /** @class */ (function () {
    function LinkProvider() {
        this.linkPattern = /(\[[^\]]*\]\(\s*?)(((((?=.*\)\)+)|(?=.*\)\]+))[^\s\)]+?)|([^\s]+)))\)/g;
        this.referenceLinkPattern = /(\[([^\]]+)\]\[\s*?)([^\s\]]*?)\]/g;
        this.definitionPattern = /^([\t ]*\[([^\]]+)\]:\s*)(\S+)/gm;
    }
    LinkProvider.prototype.provideDocumentLinks = function (document, _token) {
        var base = path.dirname(document.uri.fsPath);
        var text = document.getText();
        return this.providerInlineLinks(text, document, base)
            .concat(this.provideReferenceLinks(text, document, base));
    };
    LinkProvider.prototype.providerInlineLinks = function (text, document, base) {
        var results = [];
        for (var _i = 0, _a = matchAll(this.linkPattern, text); _i < _a.length; _i++) {
            var match = _a[_i];
            var pre = match[1];
            var link = match[2];
            var offset = (match.index || 0) + pre.length;
            var linkStart = document.positionAt(offset);
            var linkEnd = document.positionAt(offset + link.length);
            try {
                results.push(new vscode.DocumentLink(new vscode.Range(linkStart, linkEnd), normalizeLink(document, link, base)));
            }
            catch (e) {
                // noop
            }
        }
        return results;
    };
    LinkProvider.prototype.provideReferenceLinks = function (text, document, base) {
        var results = [];
        var definitions = this.getDefinitions(text, document);
        for (var _i = 0, _a = matchAll(this.referenceLinkPattern, text); _i < _a.length; _i++) {
            var match = _a[_i];
            var linkStart = void 0;
            var linkEnd = void 0;
            var reference = match[3];
            if (reference) {
                var pre = match[1];
                var offset = (match.index || 0) + pre.length;
                linkStart = document.positionAt(offset);
                linkEnd = document.positionAt(offset + reference.length);
            }
            else if (match[2]) {
                reference = match[2];
                var offset = (match.index || 0) + 1;
                linkStart = document.positionAt(offset);
                linkEnd = document.positionAt(offset + match[2].length);
            }
            else {
                continue;
            }
            try {
                var link = definitions.get(reference);
                if (link) {
                    results.push(new vscode.DocumentLink(new vscode.Range(linkStart, linkEnd), vscode.Uri.parse("command:_markdown.moveCursorToPosition?" + encodeURIComponent(JSON.stringify([link.linkRange.start.line, link.linkRange.start.character])))));
                }
            }
            catch (e) {
                // noop
            }
        }
        for (var _b = 0, _c = Array.from(definitions.values()); _b < _c.length; _b++) {
            var definition = _c[_b];
            try {
                results.push(new vscode.DocumentLink(definition.linkRange, normalizeLink(document, definition.link, base)));
            }
            catch (e) {
                // noop
            }
        }
        return results;
    };
    LinkProvider.prototype.getDefinitions = function (text, document) {
        var out = new Map();
        for (var _i = 0, _a = matchAll(this.definitionPattern, text); _i < _a.length; _i++) {
            var match = _a[_i];
            var pre = match[1];
            var reference = match[2];
            var link = match[3].trim();
            var offset = (match.index || 0) + pre.length;
            var linkStart = document.positionAt(offset);
            var linkEnd = document.positionAt(offset + link.length);
            out.set(reference, {
                link: link,
                linkRange: new vscode.Range(linkStart, linkEnd)
            });
        }
        return out;
    };
    return LinkProvider;
}());
exports.default = LinkProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/markdown/out/documentLinkProvider.js.map
