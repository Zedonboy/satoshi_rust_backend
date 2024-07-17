import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export type RegistryError = { 'UserIdExists' : null } |
  { 'AmountBelowMin' : null } |
  { 'SystemError' : string } |
  { 'UserNotFound' : null };
export type Result = { 'Ok' : string } |
  { 'Err' : RegistryError };
export type Result_1 = { 'Ok' : bigint } |
  { 'Err' : RegistryError };
export interface _SERVICE {
  'create_user' : ActorMethod<[], Result>,
  'export_candid' : ActorMethod<[], string>,
  'generate_deposit_address' : ActorMethod<[], string>,
  'get_user_canister' : ActorMethod<[], Result>,
  'top_up_user_canister' : ActorMethod<[], Result_1>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
