import { AuthClient } from "@dfinity/auth-client";
import { HttpAgent } from '@dfinity/agent';
import { HOST, identityProvider } from './config';
export * from "./types"
export * from "./config"

export async function logout () {
    let auth = await AuthClient.create()
    auth.logout()
}

export async function authenticate() {
    let auth = await AuthClient.create()

    await auth.login({
        identityProvider: identityProvider,
        maxTimeToLive: BigInt(3_600_000_000_000)
    })

}

export async function is_authenticated() {
    let client = await AuthClient.create()

    return await client.isAuthenticated()
}