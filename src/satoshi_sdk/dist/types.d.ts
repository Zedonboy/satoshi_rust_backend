import { Identity } from "@dfinity/agent";
import { Result, Result_1 } from "./declarations/satoshi_register/satoshi_register.did";
export declare class UserStorageCanister {
    backend_actor: import("@dfinity/agent").ActorSubclass<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did")._SERVICE>;
    constructor(canister_id: string, identity: Identity, host?: string);
    create_file(name: string, content: string, path?: string): Promise<number>;
    truncate_and_update(file_id: number, content: string): Promise<void>;
    add_file_chunks(file_id: number, file_bytes: Uint8Array): Promise<number | true>;
    get_files(): Promise<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did").ICPFileStat[]>;
    get_status(): Promise<bigint>;
    get_paths(path?: string): Promise<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did").Result_3>;
    get_file(file_id: number): Promise<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did").Result_2>;
}
export declare class RegistryCanister {
    backend_actor: import("@dfinity/agent").ActorSubclass<import("./declarations/satoshi_register/satoshi_register.did")._SERVICE>;
    constructor(canister_id: string, identity: Identity, host?: string);
    create_user(): Promise<Result>;
    get_deposit_address(): Promise<string>;
    get_user_canister(): Promise<Result>;
    top_up(): Promise<Result_1>;
}
