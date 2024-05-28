export { idlFactory } from "./satoshi_rust_backend.did.js";
export const canisterId: string | undefined;
export function createActor(canisterId: any, options?: {}): import("@dfinity/agent").ActorSubclass<Record<string, import("@dfinity/agent").ActorMethod<unknown[], unknown>>>;
export const satoshi_rust_backend: import("@dfinity/agent").ActorSubclass<Record<string, import("@dfinity/agent").ActorMethod<unknown[], unknown>>> | undefined;
