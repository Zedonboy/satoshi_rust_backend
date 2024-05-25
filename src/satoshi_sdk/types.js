import { AuthClient } from "@dfinity/auth-client";
import { get_registry_actor, get_storage_actor } from "./utils";

export class UserStorageCanister {
  backend_actor
  constructor(canister_id, client) {
    this.backend_actor = get_storage_actor(client.getIdentity(), id);
  }

  async upload_file(file, path) {
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
              id: 0,
              owner: "",
              data: new Uint8Array(element),
            },
            [path]
          );

          if (v.Err) {
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
        if (rst.Err) {
          throw new Error("Error Adding Chunks");
        }
      }

      return fd;
    } else {
      let rxt = await this.backend_actor.create_file({
        name: file.name,
        id: 0,
        owner: "",
        data: new Uint8Array(await file.arrayBuffer()),
      });

      if (rxt.Err) {
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

  async get_paths() {
    return await this.backend_actor.get_path_contents()
  }
}

export class RegistryCanister {
    backend_actor
  constructor(canister_id, client) {
    this.backend_actor = get_registry_actor(client.getIdentity(), id);
  }

  async create_user() {
    return await this.backend_actor.create_user()
  }

  async get_deposit_address() {
    return await this.backend_actor.generate_deposit_address()
  }

  async get_user_canister() {
    return await this.backend_actor.get_user_canister()
  }

  async top_up() {
    return await this.backend_actor.top_up_user_canister()
  }
}
