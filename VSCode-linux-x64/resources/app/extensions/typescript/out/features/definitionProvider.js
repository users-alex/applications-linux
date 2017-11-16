"use strict";
/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/
Object.defineProperty(exports, "__esModule", { value: true });
const definitionProviderBase_1 = require("./definitionProviderBase");
class TypeScriptDefinitionProvider extends definitionProviderBase_1.default {
    provideDefinition(document, position, token) {
        return this.getSymbolLocations('definition', document, position, token);
    }
}
exports.default = TypeScriptDefinitionProvider;
//# sourceMappingURL=https://ticino.blob.core.windows.net/sourcemaps/929bacba01ef658b873545e26034d1a8067445e9/extensions/typescript/out/features/definitionProvider.js.map
