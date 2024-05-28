export const idlFactory = ({ IDL }) => {
  const ICPFileError = IDL.Variant({
    'Error' : IDL.Text,
    'NotFound' : IDL.Null,
    'NotAuthorized' : IDL.Null,
    'InvalidPath' : IDL.Text,
  });
  const Result = IDL.Variant({ 'Ok' : IDL.Null, 'Err' : ICPFileError });
  const ICPFile = IDL.Record({
    'id' : IDL.Nat,
    'owner' : IDL.Text,
    'data' : IDL.Vec(IDL.Nat8),
    'name' : IDL.Text,
  });
  const Result_1 = IDL.Variant({ 'Ok' : IDL.Nat, 'Err' : ICPFileError });
  const ICPFileStat = IDL.Record({
    'id' : IDL.Nat,
    'name' : IDL.Text,
    'size' : IDL.Nat64,
  });
  const Path = IDL.Variant({
    'File' : IDL.Tuple(IDL.Text, ICPFileStat),
    'Path' : IDL.Text,
  });
  const PathNode = IDL.Record({
    'id' : IDL.Nat64,
    'node_type' : Path,
    'children' : IDL.Vec(IDL.Nat64),
  });
  const Result_2 = IDL.Variant({ 'Ok' : ICPFile, 'Err' : ICPFileError });
  const Result_3 = IDL.Variant({
    'Ok' : IDL.Vec(PathNode),
    'Err' : ICPFileError,
  });
  const CanisterStatusType = IDL.Variant({
    'stopped' : IDL.Null,
    'stopping' : IDL.Null,
    'running' : IDL.Null,
  });
  const DefiniteCanisterSettings = IDL.Record({
    'freezing_threshold' : IDL.Nat,
    'controllers' : IDL.Vec(IDL.Principal),
    'reserved_cycles_limit' : IDL.Nat,
    'memory_allocation' : IDL.Nat,
    'compute_allocation' : IDL.Nat,
  });
  const QueryStats = IDL.Record({
    'response_payload_bytes_total' : IDL.Nat,
    'num_instructions_total' : IDL.Nat,
    'num_calls_total' : IDL.Nat,
    'request_payload_bytes_total' : IDL.Nat,
  });
  const CanisterStatusResponse = IDL.Record({
    'status' : CanisterStatusType,
    'memory_size' : IDL.Nat,
    'cycles' : IDL.Nat,
    'settings' : DefiniteCanisterSettings,
    'query_stats' : QueryStats,
    'idle_cycles_burned_per_day' : IDL.Nat,
    'module_hash' : IDL.Opt(IDL.Vec(IDL.Nat8)),
    'reserved_cycles' : IDL.Nat,
  });
  return IDL.Service({
    'add_chunk' : IDL.Func([IDL.Nat, IDL.Vec(IDL.Nat8)], [Result], []),
    'create_file' : IDL.Func([ICPFile, IDL.Opt(IDL.Text)], [Result_1], []),
    'delete_file' : IDL.Func([PathNode], [Result_1], []),
    'export_candid' : IDL.Func([], [IDL.Text], ['query']),
    'get_file' : IDL.Func([IDL.Nat], [Result_2], ['query']),
    'get_files' : IDL.Func([], [IDL.Vec(ICPFileStat)], ['query']),
    'get_path_contents' : IDL.Func([IDL.Opt(IDL.Text)], [Result_3], ['query']),
    'get_status' : IDL.Func([], [CanisterStatusResponse], ['query']),
    'greet' : IDL.Func([IDL.Text], [IDL.Text], ['query']),
    'truncate_file' : IDL.Func([IDL.Nat], [Result], []),
  });
};
export const init = ({ IDL }) => { return []; };
