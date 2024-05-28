"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.idlFactory = void 0;
const idlFactory = ({ IDL }) => {
    const RegistryError = IDL.Variant({
        'UserIdExists': IDL.Null,
        'AmountBelowMin': IDL.Null,
        'SystemError': IDL.Text,
        'UserNotFound': IDL.Null,
    });
    const Result = IDL.Variant({ 'Ok': IDL.Text, 'Err': RegistryError });
    const Result_1 = IDL.Variant({ 'Ok': IDL.Nat, 'Err': RegistryError });
    return IDL.Service({
        'create_user': IDL.Func([], [Result], []),
        'export_candid': IDL.Func([], [IDL.Text], ['query']),
        'generate_deposit_address': IDL.Func([], [IDL.Text], ['query']),
        'get_user_canister': IDL.Func([], [Result], ['query']),
        'top_up_user_canister': IDL.Func([], [Result_1], []),
    });
};
exports.idlFactory = idlFactory;
const init = ({ IDL }) => { return []; };
exports.init = init;
