var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { chunkArrayBuffer, } from "./utils";
import { createActor } from "./declarations/satoshi_register";
import { createActor as createActorForFileBackend } from "./declarations/satoshi_rust_backend";
export class UserStorageCanister {
    constructor(canister_id, identity, host) {
        this.backend_actor = createActorForFileBackend(canister_id, {
            agentOptions: {
                identity,
                host
            }
        });
    }
    create_file(name, content, path) {
        return __awaiter(this, void 0, void 0, function* () {
            let textencoder = new TextEncoder();
            let byte_array = textencoder.encode(content);
            let chunks = chunkArrayBuffer(byte_array, 1);
            let fd = -1;
            if (byte_array.byteLength > 1000000) {
                for (let index = 0; index < chunks.length; index++) {
                    const element = chunks[index];
                    if (index == 0) {
                        let v = yield this.backend_actor.create_file({
                            name,
                            id: BigInt(0),
                            owner: "",
                            data: new Uint8Array(element),
                            hash: []
                        }, path ? [path] : []);
                        if ("Err" in v) {
                            throw new Error("Could not create File");
                        }
                        fd = Number(v.Ok);
                    }
                    if (fd == -1) {
                        throw new Error("File Descriptor is invalid");
                    }
                    let rst = yield this.backend_actor.add_chunk(BigInt(fd), new Uint8Array(element));
                    if ("Err" in rst) {
                        throw new Error("Error Adding Chunks");
                    }
                }
                return fd;
            }
            else {
                let rxt = yield this.backend_actor.create_file({
                    name,
                    id: BigInt(0),
                    owner: "",
                    data: byte_array,
                    hash: []
                }, path ? [path] : []);
                if ("Err" in rxt) {
                    throw new Error("Could not create File");
                }
                return Number(rxt.Ok);
            }
        });
    }
    truncate_and_update(file_id, content) {
        return __awaiter(this, void 0, void 0, function* () {
            yield this.backend_actor.truncate_file(BigInt(file_id));
            // this.backend_actor.add_chunk(BigInt(file_id), )
            let encoder = new TextEncoder();
            let file_bytes = encoder.encode(content);
            this.add_file_chunks(file_id, file_bytes);
        });
    }
    add_file_chunks(file_id, file_bytes) {
        return __awaiter(this, void 0, void 0, function* () {
            if (file_bytes.byteLength > 1000000) {
                let chunks = chunkArrayBuffer(file_bytes, 1);
                for (let index = 0; index < chunks.length; index++) {
                    const element = chunks[index];
                    let rst = yield this.backend_actor.add_chunk(BigInt(file_id), new Uint8Array(element));
                    if ("Err" in rst) {
                        throw new Error("Error Adding Chunks");
                    }
                }
                return true;
            }
            else {
                let rst = yield this.backend_actor.add_chunk(BigInt(file_id), file_bytes);
                if ("Err" in rst) {
                    throw new Error("Could not create File");
                }
                return Number(rst.Ok);
            }
        });
    }
    get_files() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.backend_actor.get_files();
        });
    }
    get_status() {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.backend_actor.get_status();
        });
    }
    get_paths(path) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.backend_actor.get_path_contents(path ? [path] : []);
        });
    }
    get_file(file_id) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.backend_actor.get_file(BigInt(file_id));
        });
    }
}
export class RegistryCanister {
    constructor(canister_id, identity, host) {
        this.backend_actor = createActor(canister_id, {
            agentOptions: {
                identity,
                host,
            },
        });
    }
    create_user() {
        return this.backend_actor.create_user();
    }
    get_deposit_address() {
        return this.backend_actor.generate_deposit_address();
    }
    get_user_canister() {
        return this.backend_actor.get_user_canister();
    }
    top_up() {
        return this.backend_actor.top_up_user_canister();
    }
}
