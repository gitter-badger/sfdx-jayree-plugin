"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.preretrieve = void 0;
const kit_1 = require("@salesforce/kit");
const hookUtils_1 = require("../utils/hookUtils");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const debug = require('debug')('jayree:hooks');
// eslint-disable-next-line @typescript-eslint/require-await
exports.preretrieve = async function (options) {
    debug(`called 'preretrieve' by: ${options.Command.id}`);
    if (!hookUtils_1.runHook) {
        debug('jayree hooks disabled');
        return;
    }
    kit_1.env.setBoolean('SFDX_DISABLE_PRETTIERPOSTRUN', true);
    debug('set: SFDX_DISABLE_PRETTIERPOSTRUN=true');
};
//# sourceMappingURL=preretrieve.js.map