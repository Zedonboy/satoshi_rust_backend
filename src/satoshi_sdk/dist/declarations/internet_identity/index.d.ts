export { idlFactory } from "./internet_identity.did.js";
export const canisterId: string | undefined;
export function createActor(canisterId: any, options?: {}): import("@dfinity/agent").ActorSubclass<Record<string, import("@dfinity/agent").ActorMethod<unknown[], unknown>>>;
export const internet_identity: import("@dfinity/agent").ActorSubclass<Record<string, import("@dfinity/agent").ActorMethod<unknown[], unknown>>> | undefined;
