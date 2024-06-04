use std::{ cell::RefCell, collections::{BTreeMap, HashSet}, str::FromStr};

use candid::{candid_method, Principal};
use ic_cdk::{api::{is_controller, management_canister::main::{canister_status, CanisterIdRecord, CanisterInfoRequest, CanisterStatusResponse}}, caller, id, query, update};
use types::{ICPFile, ICPFileError, ICPFileStat, Path, PathNode, Rcbytes, FD};
mod types;
use sha2::{Sha256, Sha512, Digest};

#[ic_cdk::query]
fn greet(name: String) -> String {
    format!("Hello, {}!", name)
}


thread_local! {
    pub static CONTROLLERS : RefCell<HashSet<String>> = RefCell::new(HashSet::new());
    pub static FILE_STORE : RefCell<BTreeMap<FD, ICPFile>> = RefCell::new(BTreeMap::new());
    pub static NEXT_FD : RefCell<u128> = RefCell::new(1);
    pub static USER_FILES : RefCell<BTreeMap<String, Vec<u128>>> = RefCell::new(BTreeMap::new());
    pub static PATH_NODES : RefCell<Vec<Option<PathNode>>> = RefCell::new(vec![Some(PathNode {
        id: 0,
        children: vec![],
        node_type: types::Path::Path("/".to_string())
    })])
}

fn get_node_paths(node : &PathNode) -> Vec<PathNode> {
    let mut path_type = vec![];
    for idx in &node.children {
        PATH_NODES.with_borrow(|store| {
            let c = &store[*idx];
            if c.is_none() {
                return;
            }
            path_type.push(c.clone().unwrap())
        });
    }

    path_type
}

fn path_resolution(vec : Vec<&str>) -> Result<PathNode, ICPFileError> {
    let mut current_node = PATH_NODES.with_borrow(|store| {
        let c = &store[0];
        c.clone().unwrap()
    });

    for path in vec {
        let opt = is_path_in_node(path.to_string(), &current_node);
        if opt.is_some() {
            let opt_current_node = PATH_NODES.with_borrow(|store| {
                let c = &store[opt.unwrap()];
                c.clone()
            });

            if opt_current_node.is_none() {
                return Err(ICPFileError::InvalidPath(path.to_string()));
            } else {
                current_node = opt_current_node.unwrap()
            }
            continue;
        } else {
            return Err(ICPFileError::NotFound);
        }
    };
    Ok(current_node)
}

fn sync_node_to_store(node : &PathNode) {
    PATH_NODES.with_borrow_mut(|store|{
        store[node.id] = Some(node.clone())
    });
}

fn build_path(vec : Vec<&str>) -> PathNode {

    let mut current_node = PATH_NODES.with_borrow(|store| {
        let c = &store[0];
        c.clone().unwrap()
    });

    for path in vec {
        let opt = is_path_in_node(path.to_string(), &current_node);
        if opt.is_some() {
            current_node = PATH_NODES.with_borrow(|store| {
                let c = &store[opt.unwrap()];
                c.clone().unwrap()
            });

            continue;
        } else {
            let next_idx = PATH_NODES.with_borrow(|store| {
               store.len()
            });

            let node = PathNode{
                id: next_idx,
                node_type: Path::Path(path.to_string()),
                children: vec![],
            };

            PATH_NODES.with_borrow_mut(|store| {
                store.push(Some(node.clone()))
            });

            current_node.children.push(next_idx);

            sync_node_to_store(&current_node);

            current_node = node
        }

    }

    return current_node;
}

fn is_path_in_node(path: String, node : &PathNode) -> Option<usize> {
    for idx in &node.children {
        let c = PATH_NODES.with_borrow(|store| {
            let c = &store[*idx];
            c.clone()
        });

        if c.is_none() {
            return None;
        }

        match c.unwrap().node_type {
            types::Path::Path(name) => {
                if name == path {
                    return Some(*idx);
                }
            },
            types::Path::File(name, _) => {
                if name == path {
                    return Some(*idx);
                }
            },
        }
    };

    return None;
}

#[query]
async fn get_status() -> CanisterStatusResponse {
    let arg = CanisterIdRecord { canister_id: id() };
    let (c_resp, ) = canister_status(arg).await.unwrap();
    c_resp
}

#[update(guard = "not_anonymous")]
async fn end_file_upload(id : FD) {
    FILE_STORE.with_borrow_mut(|store| {
       let file_opt = store.get_mut(&id);
       if file_opt.is_none() {
           return;
       }

       let file = file_opt.unwrap();
       let mut hasher = Sha256::new();
       let Rcbytes(g) = &file.data;
       let v = g.borrow_mut();
       hasher.update(v.to_vec());
       let result = hasher.finalize();
       let hash_str = hex::encode(result);
       file.hash = Some(hash_str)

    })
}

#[update(guard = "not_anonymous")]
async fn create_file(mut file : ICPFile, path : Option<String>) -> Result<FD, ICPFileError> {
    let fd = get_id();
    file.id = fd;
    file.owner = caller().to_text();
    let stat : ICPFileStat = file.get_stat();
    let filename = file.name.clone();
    FILE_STORE.with_borrow_mut(|store| {
        store.insert(fd, file)
    });

    // USER_FILES.with_borrow_mut(|store| {
    //     let vectr = store.get_mut(&caller().to_text());
    //     if vectr.is_none() {
    //         let v_store = vec![fd];
    //         store.insert(caller().to_text(), v_store);
    //     } else {
    //         let v_store = vectr.unwrap();
    //         v_store.push(fd);
    //     }
    // });

    if path.is_none() || "/" == path.as_ref().unwrap() {
        let idx = PATH_NODES.with_borrow(|store| {
            store.len()
        });

        let root_node = PATH_NODES.with_borrow_mut(|store|{
            let v = &mut store[0];
            let child = PathNode { id: idx, node_type: Path::File(filename, stat), children: vec![] };
            let mut root_node = v.clone().unwrap();
            root_node.children.push(idx);
            store.push(Some(child));
            root_node
        });

        sync_node_to_store(&root_node)
    } else {
        let path_str = path.unwrap();
        let path_vec = path_str.split("/").collect();
        let mut final_node = build_path(path_vec);
        let last_idx = PATH_NODES.with_borrow(|store| {
            store.len()
        });
        let file_node = PathNode { id: last_idx, node_type: Path::File(filename, stat), children: vec![] };
        PATH_NODES.with_borrow_mut(|store|{
            store.push(Some(file_node))
        });

        final_node.children.push(last_idx);
        sync_node_to_store(&final_node)
    }

    Ok(fd)
}

#[update(guard = "not_anonymous")]
async fn add_chunk(id : FD, chunk : Vec<u8>) -> Result<(), ICPFileError> {
    // checking file ownwership
     FILE_STORE.with_borrow_mut(|store| {
        let file_opt = store.get_mut(&id);
        if file_opt.is_none() {
            return Err(ICPFileError::NotFound);
        }
    
        let file_ref = file_opt.unwrap();
        let owner_principal = Principal::from_str(file_ref.owner.as_str()).unwrap();
        if caller() != owner_principal {
            return Err(ICPFileError::NotAuthorized);
        }

        let f = file_ref.data.0.as_ref();
        let mut v = f.borrow_mut();
        v.extend(chunk);
        Ok(())

    })
}

#[update(guard = "not_anonymous")]
async fn truncate_file(id : FD) -> Result<(), ICPFileError> {
    // checking file ownwership
    FILE_STORE.with_borrow_mut(|store| {
        let file_opt = store.get_mut(&id);
        if file_opt.is_none() {
            return Err(ICPFileError::NotFound);
        }
    
        let file_ref = file_opt.unwrap();
        let owner_principal = Principal::from_str(file_ref.owner.as_str()).unwrap();
        if caller() != owner_principal {
            return Err(ICPFileError::NotAuthorized);
        }

        let f = file_ref.data.0.as_ref();
        let mut v = f.borrow_mut();

        v.clear();
        Ok(())

    })
}

#[update(guard = "not_anonymous")]
async fn delete_file(file_node : PathNode) -> Result<u128, ICPFileError> {

    let mut id = 0;
    // checking file ownwership
    match file_node.node_type {
    Path::Path(_) => {
        PATH_NODES.with_borrow_mut(|store| {
            store[file_node.id] = None
        });

        return Ok(file_node.id as u128);
    },
    Path::File(_, stat) => {
        PATH_NODES.with_borrow_mut(|store| {
            store[file_node.id] = None
        });

        id = stat.id
    },
    };

    // USER_FILES.with_borrow_mut(|store| {
    //     let user_store_opt = store.get_mut(&caller().to_text());
    //     if user_store_opt.is_some() {
    //         let vector = user_store_opt.unwrap();
    //         let indx = vector.iter().position(|x|{if *x == id {
    //             return true;
    //         } else {return false;}});

    //         if indx.is_some() {
    //             vector.remove(indx.unwrap());
    //         }
    //     };
    // });

    FILE_STORE.with_borrow_mut(|store| {
        let file_opt = store.get_mut(&id);
        if file_opt.is_none() {
            return Err(ICPFileError::NotFound);
        }
    
        let file_ref = file_opt.unwrap();
        let owner_principal = Principal::from_str(file_ref.owner.as_str()).unwrap();
        if caller() != owner_principal {
            return Err(ICPFileError::NotAuthorized);
        }
    
        store.remove(&id);
        Ok(id)
    })

}

#[query(guard = "not_anonymous")]
async fn get_files() -> Vec<ICPFileStat> {
    let vecc_id = USER_FILES.with_borrow(|store| store.get(&caller().to_text()).cloned().unwrap());
    let mut vec_stat = vec![];
    for fd in vecc_id {
        let file_result = FILE_STORE.with_borrow(|store| {
            let file_ref_opt = store.get(&fd);
            if file_ref_opt.is_none() {
                return Err(())
            }

            let file_ref = file_ref_opt.unwrap();
            Ok(file_ref.get_stat())
        });

        if file_result.is_err() {
            continue;
        }

        vec_stat.push(file_result.unwrap());
        
    }

    vec_stat
}

#[query(guard = "not_anonymous")]
async fn get_file(id : FD) -> Result<ICPFile, ICPFileError> {
    FILE_STORE.with_borrow_mut(|store| {
        let file_opt = store.get_mut(&id).cloned();
        if file_opt.is_none() {
            return Err(ICPFileError::NotFound);
        }
    
        let file_ref = file_opt.unwrap();
        let owner_principal = Principal::from_str(file_ref.owner.as_str()).unwrap();
        if caller() != owner_principal {
            return Err(ICPFileError::NotAuthorized);
        }

        Ok(file_ref)
        
    })
}

#[query(guard = "not_anonymous")]
fn get_path_contents(path : Option<String>) -> Result<Vec<PathNode>, ICPFileError> {
    if path.is_none() || path.clone().unwrap() == "/" {
        // geting path content of root
        let x = PATH_NODES.with_borrow(|store|{
            let r = &store[0];
            let root_node = r.clone().unwrap();
            get_node_paths(&root_node)
        });

        return Ok(x);

    } else {
        let path_str = path.unwrap();

        let paths_str_vec : Vec<&str> = path_str.split("/").collect();
        let rslt = path_resolution(paths_str_vec);
        if rslt.is_ok() {
            let pn = rslt.unwrap();
            return Ok(get_node_paths(&pn));
        } else {
            return Err(rslt.expect_err("Error"));
        }
    }
}


fn not_anonymous() -> Result<(), String> {
    // if !is_controller(&caller()) {
    //     return Err("You are not the controller".to_string());
    // }

    Ok(())
}

fn get_id() -> u128 {
    
    NEXT_FD.with(|counter_ref| {
        let mut writer = counter_ref.borrow_mut();
        *writer += 1;
        *writer
    })
}

#[query]
#[candid_method(query)]
fn export_candid() -> String {
    ic_cdk::export_candid!();
    __export_service()
}
