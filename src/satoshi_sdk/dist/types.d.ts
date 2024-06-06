import { Identity } from "@dfinity/agent";
import { Result, Result_1 } from "./declarations/satoshi_register/satoshi_register.did";
export declare class UserStorageCanister {
    backend_actor: import("@dfinity/agent").ActorSubclass<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did")._SERVICE>;
    constructor(canister_id: string, identity: Identity);
    upload_file(file: File, path: string): Promise<number>;
    get_files(): Promise<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did").ICPFileStat[]>;
    get_status(): Promise<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did").CanisterStatusResponse>;
    get_paths(path?: string): Promise<import("./declarations/satoshi_rust_backend/satoshi_rust_backend.did").Result_3>;
}
export declare class RegistryCanister {
    backend_actor: import("@dfinity/agent").ActorSubclass<import("./declarations/satoshi_register/satoshi_register.did")._SERVICE>;
    constructor(canister_id: string, identity: Identity);
    create_user(): Promise<Result>;
    get_deposit_address(): Promise<string>;
    get_user_canister(): Promise<Result>;
    top_up(): Promise<Result_1>;
}
