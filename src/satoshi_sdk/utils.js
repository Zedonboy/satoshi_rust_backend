import { createActor as storageActor, canisterId } from "./declarations/satoshi_rust_backend/index.js";
import {createActor as registryActor} from "./declarations/satoshi_register/index.js"
import { HOST } from "./config.js";
export function get_storage_actor(identity, canister_id) {
    let agent = new HttpAgent({
        identity: identity,
        host: HOST,
    })
    return storageActor(canister_id, {
        agent
    })

}

export function get_registry_actor(identity, canister_id) {
    let agent = new HttpAgent({
        identity: identity,
        host: HOST,
    })
    return registryActor(canister_id, {
        agent
    })

}


export function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
}


export function chunkArrayBuffer(arrayBuffer, chunkSize) {
    const chunks = [];
    const byteSize = 1024 * 1024 * chunkSize; // chunkSize in MB
    for (let i = 0; i < arrayBuffer.byteLength; i += byteSize) {
      const end = Math.min(i + byteSize, arrayBuffer.byteLength);
      chunks.push(arrayBuffer.slice(i, end));
    }
    return chunks;
  }