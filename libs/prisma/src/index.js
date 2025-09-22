"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getPrisma = getPrisma;
// Server-side only: get a PrismaClient singleton.
// Do NOT import or call this from the browser code.
let prismaSingleton;
function getPrisma() {
    if (!prismaSingleton) {
        // Use require to keep compatibility with CommonJS in API
        // and avoid accidental static bundling in the browser.
        // This function should only be called on the server.
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        const { PrismaClient } = require('@prisma/client');
        prismaSingleton = new PrismaClient();
    }
    return prismaSingleton;
}
