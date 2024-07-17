var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { AuthClient } from "@dfinity/auth-client";
import { identityProvider } from './config';
export * from "./types";
export * from "./config";
export function logout() {
    return __awaiter(this, void 0, void 0, function* () {
        let auth = yield AuthClient.create();
        auth.logout();
    });
}
export function authenticate() {
    return __awaiter(this, void 0, void 0, function* () {
        let auth = yield AuthClient.create();
        yield auth.login({
            identityProvider: identityProvider,
            maxTimeToLive: BigInt(3600000000000)
        });
    });
}
export function is_authenticated() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = yield AuthClient.create();
        return yield client.isAuthenticated();
    });
}
