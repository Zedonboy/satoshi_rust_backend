"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RegistryCanister = exports.UserStorageCanister = void 0;
const auth_client_1 = require("@dfinity/auth-client");
const utils_1 = require("./utils");
class UserStorageCanister {
    constructor(canister_id, identity) {
        this.backend_actor = (0, utils_1.get_storage_actor)(identity, canister_id);
    }
    upload_file(file, path) {
        return __awaiter(this, void 0, void 0, function* () {
            let auth = yield auth_client_1.AuthClient.create();
            let authenticated = yield auth.isAuthenticated();
            if (!authenticated) {
                throw new Error("You are not authenticated");
            }
            if (file.size > 1000000) {
                let chunks = (0, utils_1.chunkArrayBuffer)(yield file.arrayBuffer(), 1);
                let fd = -1;
                for (let index = 0; index < chunks.length; index++) {
                    const element = chunks[index];
                    if (index == 0) {
                        let v = yield this.backend_actor.create_file({
                            name: file.name,
                            id: BigInt(0),
                            owner: "",
                            data: new Uint8Array(element),
                        }, [path]);
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
                    name: file.name,
                    id: BigInt(0),
                    owner: "",
                    data: new Uint8Array(yield file.arrayBuffer()),
                }, [path]);
                if ("Err" in rxt) {
                    throw new Error("Could not create File");
                }
                return Number(rxt.Ok);
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
}
exports.UserStorageCanister = UserStorageCanister;
class RegistryCanister {
    constructor(canister_id, identity) {
        this.backend_actor = (0, utils_1.get_registry_actor)(identity, canister_id);
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
exports.RegistryCanister = RegistryCanister;
