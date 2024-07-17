export const idlFactory = ({ IDL }) => {
    const ICPFileError = IDL.Variant({
        'Error': IDL.Text,
        'NotFound': IDL.Null,
        'NotAuthorized': IDL.Null,
        'InvalidPath': IDL.Text,
    });
    const Result = IDL.Variant({ 'Ok': IDL.Null, 'Err': ICPFileError });
    const ICPFile = IDL.Record({
        'id': IDL.Nat,
        'owner': IDL.Text,
        'data': IDL.Vec(IDL.Nat8),
        'hash': IDL.Opt(IDL.Text),
        'name': IDL.Text,
    });
    const Result_1 = IDL.Variant({ 'Ok': IDL.Nat, 'Err': ICPFileError });
    const ICPFileStat = IDL.Record({
        'id': IDL.Nat,
        'hash': IDL.Opt(IDL.Text),
        'name': IDL.Text,
        'size': IDL.Nat64,
    });
    const Path = IDL.Variant({
        'File': IDL.Tuple(IDL.Text, ICPFileStat),
        'Path': IDL.Text,
    });
    const PathNode = IDL.Record({
        'id': IDL.Nat64,
        'node_type': Path,
        'children': IDL.Vec(IDL.Nat64),
    });
    const Result_2 = IDL.Variant({ 'Ok': ICPFile, 'Err': ICPFileError });
    const Result_3 = IDL.Variant({
        'Ok': IDL.Vec(PathNode),
        'Err': ICPFileError,
    });
    return IDL.Service({
        'add_chunk': IDL.Func([IDL.Nat, IDL.Vec(IDL.Nat8)], [Result], []),
        'create_file': IDL.Func([ICPFile, IDL.Opt(IDL.Text)], [Result_1], []),
        'delete_file': IDL.Func([PathNode], [Result_1], []),
        'end_file_upload': IDL.Func([IDL.Nat], [], []),
        'export_candid': IDL.Func([], [IDL.Text], ['query']),
        'get_file': IDL.Func([IDL.Nat], [Result_2], ['query']),
        'get_files': IDL.Func([], [IDL.Vec(ICPFileStat)], ['query']),
        'get_path_contents': IDL.Func([IDL.Opt(IDL.Text)], [Result_3], ['query']),
        'get_status': IDL.Func([], [IDL.Nat64], ['query']),
        'greet': IDL.Func([IDL.Text], [IDL.Text], ['query']),
        'truncate_file': IDL.Func([IDL.Nat], [Result], []),
    });
};
export const init = ({ IDL }) => { return []; };
