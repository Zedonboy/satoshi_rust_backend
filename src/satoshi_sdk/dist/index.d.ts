export * from "./types";
export * from "./config";
export declare function logout(): Promise<void>;
export declare function authenticate(): Promise<void>;
export declare function is_authenticated(): Promise<boolean>;
