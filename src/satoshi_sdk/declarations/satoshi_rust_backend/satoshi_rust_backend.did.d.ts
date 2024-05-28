import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface CanisterStatusResponse {
  'status' : CanisterStatusType,
  'memory_size' : bigint,
  'cycles' : bigint,
  'settings' : DefiniteCanisterSettings,
  'query_stats' : QueryStats,
  'idle_cycles_burned_per_day' : bigint,
  'module_hash' : [] | [Uint8Array | number[]],
  'reserved_cycles' : bigint,
}
export type CanisterStatusType = { 'stopped' : null } |
  { 'stopping' : null } |
  { 'running' : null };
export interface DefiniteCanisterSettings {
  'freezing_threshold' : bigint,
  'controllers' : Array<Principal>,
  'reserved_cycles_limit' : bigint,
  'memory_allocation' : bigint,
  'compute_allocation' : bigint,
}
export interface ICPFile {
  'id' : bigint,
  'owner' : string,
  'data' : Uint8Array | number[],
  'name' : string,
}
export type ICPFileError = { 'Error' : string } |
  { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'InvalidPath' : string };
export interface ICPFileStat { 'id' : bigint, 'name' : string, 'size' : bigint }
export type Path = { 'File' : [string, ICPFileStat] } |
  { 'Path' : string };
export interface PathNode {
  'id' : bigint,
  'node_type' : Path,
  'children' : BigUint64Array | bigint[],
}
export interface QueryStats {
  'response_payload_bytes_total' : bigint,
  'num_instructions_total' : bigint,
  'num_calls_total' : bigint,
  'request_payload_bytes_total' : bigint,
}
export type Result = { 'Ok' : null } |
  { 'Err' : ICPFileError };
export type Result_1 = { 'Ok' : bigint } |
  { 'Err' : ICPFileError };
export type Result_2 = { 'Ok' : ICPFile } |
  { 'Err' : ICPFileError };
export type Result_3 = { 'Ok' : Array<PathNode> } |
  { 'Err' : ICPFileError };
export interface _SERVICE {
  'add_chunk' : ActorMethod<[bigint, Uint8Array | number[]], Result>,
  'create_file' : ActorMethod<[ICPFile, [] | [string]], Result_1>,
  'delete_file' : ActorMethod<[PathNode], Result_1>,
  'export_candid' : ActorMethod<[], string>,
  'get_file' : ActorMethod<[bigint], Result_2>,
  'get_files' : ActorMethod<[], Array<ICPFileStat>>,
  'get_path_contents' : ActorMethod<[[] | [string]], Result_3>,
  'get_status' : ActorMethod<[], CanisterStatusResponse>,
  'greet' : ActorMethod<[string], string>,
  'truncate_file' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
