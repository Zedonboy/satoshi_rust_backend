import { AuthClient } from "@dfinity/auth-client";
import { chunkArrayBuffer, get_registry_actor, get_storage_actor } from "./utils";
import { Identity } from "@dfinity/agent";

export class UserStorageCanister {
  backend_actor
  constructor(canister_id : string, identity : Identity) {
    this.backend_actor = get_storage_actor(identity, canister_id);
  }

  async upload_file(file : File, path : string) {
    let auth = await AuthClient.create();
    let authenticated = await auth.isAuthenticated();
    if (!authenticated) {
      throw new Error("You are not authenticated");
    }

    if (file.size > 1000000) {
      let chunks = chunkArrayBuffer(await file.arrayBuffer(), 1);
      let fd = -1;
      for (let index = 0; index < chunks.length; index++) {
        const element = chunks[index];
        if (index == 0) {
          let v = await this.backend_actor.create_file(
            {
              name: file.name,
              id: BigInt(0),
              owner: "",
              data: new Uint8Array(element),
            },
            [path]
          );

          if ("Err" in v) {
            throw new Error("Could not create File");
          }

          fd = Number(v.Ok);
        }

        if (fd == -1) {
          throw new Error("File Descriptor is invalid");
        }

        let rst = await this.backend_actor.add_chunk(
          BigInt(fd),
          new Uint8Array(element)
        );
        if ("Err" in rst) {
          throw new Error("Error Adding Chunks");
        }
      }

      return fd;
    } else {
      let rxt = await this.backend_actor.create_file({
        name: file.name,
        id: BigInt(0),
        owner: "",
        data: new Uint8Array(await file.arrayBuffer()),
      }, [path]);

      if ("Err" in rxt) {
        throw new Error("Could not create File");
      }

      return Number(rxt.Ok);
    }
  }

  async get_files() {
    return await this.backend_actor.get_files();
  }

  async get_status() {
    return await this.backend_actor.get_status()
  }

  async get_paths(path ?: string) {
    return await this.backend_actor.get_path_contents(path ? [path] : [])
  }
}

export class RegistryCanister {
    backend_actor
  constructor(canister_id : string, identity : Identity) {
    this.backend_actor = get_registry_actor(identity, canister_id);
  }

  create_user() {
    return this.backend_actor.create_user()
  }

  get_deposit_address() {
    return this.backend_actor.generate_deposit_address()
  }

  get_user_canister() {
    return this.backend_actor.get_user_canister()
  }

  top_up() {
    return this.backend_actor.top_up_user_canister()
  }
}
