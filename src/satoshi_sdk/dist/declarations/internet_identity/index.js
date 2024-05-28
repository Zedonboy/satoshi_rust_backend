"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.internet_identity = exports.createActor = exports.canisterId = exports.idlFactory = void 0;
const agent_1 = require("@dfinity/agent");
// Imports and re-exports candid interface
const internet_identity_did_js_1 = require("./internet_identity.did.js");
var internet_identity_did_js_2 = require("./internet_identity.did.js");
Object.defineProperty(exports, "idlFactory", { enumerable: true, get: function () { return internet_identity_did_js_2.idlFactory; } });
/* CANISTER_ID is replaced by webpack based on node environment
 * Note: canister environment variable will be standardized as
 * process.env.CANISTER_ID_<CANISTER_NAME_UPPERCASE>
 * beginning in dfx 0.15.0
 */
exports.canisterId = process.env.CANISTER_ID_INTERNET_IDENTITY ||
    process.env.INTERNET_IDENTITY_CANISTER_ID;
const createActor = (canisterId, options = {}) => {
    const agent = options.agent || new agent_1.HttpAgent(Object.assign({}, options.agentOptions));
    if (options.agent && options.agentOptions) {
        console.warn("Detected both agent and agentOptions passed to createActor. Ignoring agentOptions and proceeding with the provided agent.");
    }
    // Fetch root key for certificate validation during development
    if (process.env.DFX_NETWORK !== "ic") {
        agent.fetchRootKey().catch((err) => {
            console.warn("Unable to fetch root key. Check to ensure that your local replica is running");
            console.error(err);
        });
    }
    // Creates an actor with using the candid interface and the HttpAgent
    return agent_1.Actor.createActor(internet_identity_did_js_1.idlFactory, Object.assign({ agent,
        canisterId }, options.actorOptions));
};
exports.createActor = createActor;
exports.internet_identity = exports.canisterId ? (0, exports.createActor)(exports.canisterId) : undefined;
