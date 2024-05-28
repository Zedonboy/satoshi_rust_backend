"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.chunkArrayBuffer = exports.formatBytes = exports.get_registry_actor = exports.get_storage_actor = void 0;
const index_js_1 = require("./declarations/satoshi_rust_backend/index.js");
const index_js_2 = require("./declarations/satoshi_register/index.js");
const config_js_1 = require("./config.js");
function get_storage_actor(identity, canister_id) {
    let agent = new HttpAgent({
        identity: identity,
        host: config_js_1.HOST,
    });
    return (0, index_js_1.createActor)(canister_id, {
        agent
    });
}
exports.get_storage_actor = get_storage_actor;
function get_registry_actor(identity, canister_id) {
    let agent = new HttpAgent({
        identity: identity,
        host: config_js_1.HOST,
    });
    return (0, index_js_2.createActor)(canister_id, {
        agent
    });
}
exports.get_registry_actor = get_registry_actor;
function formatBytes(bytes, decimals = 2) {
    if (bytes === 0)
        return '0 Bytes';
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}
exports.formatBytes = formatBytes;
function chunkArrayBuffer(arrayBuffer, chunkSize) {
    const chunks = [];
    const byteSize = 1024 * 1024 * chunkSize; // chunkSize in MB
    for (let i = 0; i < arrayBuffer.byteLength; i += byteSize) {
        const end = Math.min(i + byteSize, arrayBuffer.byteLength);
        chunks.push(arrayBuffer.slice(i, end));
    }
    return chunks;
}
exports.chunkArrayBuffer = chunkArrayBuffer;
