import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface ICPFile {
  'id' : bigint,
  'owner' : string,
  'data' : Uint8Array | number[],
  'hash' : [] | [string],
  'name' : string,
}
export type ICPFileError = { 'Error' : string } |
  { 'NotFound' : null } |
  { 'NotAuthorized' : null } |
  { 'InvalidPath' : string };
export interface ICPFileStat {
  'id' : bigint,
  'hash' : [] | [string],
  'name' : string,
  'size' : bigint,
}
export type Path = { 'File' : [string, ICPFileStat] } |
  { 'Path' : string };
export interface PathNode {
  'id' : bigint,
  'node_type' : Path,
  'children' : BigUint64Array | bigint[],
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
  'end_file_upload' : ActorMethod<[bigint], undefined>,
  'export_candid' : ActorMethod<[], string>,
  'get_file' : ActorMethod<[bigint], Result_2>,
  'get_files' : ActorMethod<[], Array<ICPFileStat>>,
  'get_path_contents' : ActorMethod<[[] | [string]], Result_3>,
  'get_status' : ActorMethod<[], bigint>,
  'greet' : ActorMethod<[string], string>,
  'truncate_file' : ActorMethod<[bigint], Result>,
}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: (args: { IDL: typeof IDL }) => IDL.Type[];
