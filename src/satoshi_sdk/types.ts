import {
  chunkArrayBuffer,
  get_registry_actor,
  get_storage_actor,
} from "./utils";
import {
  HttpAgentRequest,
  Identity,
} from "@dfinity/agent";
import {
  Result,
  Result_1,
} from "./declarations/satoshi_register/satoshi_register.did";
import { createActor } from "./declarations/satoshi_register";
import {createActor as createActorForFileBackend} from "./declarations/satoshi_rust_backend"

export class UserStorageCanister {
  backend_actor;
  constructor(canister_id: string, identity: Identity, host ?: string) {
    this.backend_actor = createActorForFileBackend(canister_id, {
      agentOptions: {
        identity,
        host
      }
    })
  }

  async create_file(name: string, content: string, path?: string) {
    let textencoder = new TextEncoder();
    let byte_array = textencoder.encode(content);
    let chunks = chunkArrayBuffer(byte_array, 1);
    let fd = -1;
    if (byte_array.byteLength > 1000000) {
      for (let index = 0; index < chunks.length; index++) {
        const element = chunks[index];
        if (index == 0) {
          let v = await this.backend_actor.create_file(
            {
              name,
              id: BigInt(0),
              owner: "",
              data: new Uint8Array(element),
              hash: []
            },
            path ? [path] : []
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
      let rxt = await this.backend_actor.create_file(
        {
          name,
          id: BigInt(0),
          owner: "",
          data: byte_array,
          hash: []
        },
        path ? [path] : []
      );

      if ("Err" in rxt) {
        throw new Error("Could not create File");
      }

      return Number(rxt.Ok);
    }
  }

  async truncate_and_update(file_id: number, content: string) {
    await this.backend_actor.truncate_file(BigInt(file_id));
    // this.backend_actor.add_chunk(BigInt(file_id), )
    let encoder = new TextEncoder();
    let file_bytes = encoder.encode(content);
    this.add_file_chunks(file_id, file_bytes);
  }

  async add_file_chunks(file_id: number, file_bytes: Uint8Array) {
    if (file_bytes.byteLength > 1000000) {
      let chunks = chunkArrayBuffer(file_bytes, 1);
      for (let index = 0; index < chunks.length; index++) {
        const element = chunks[index];

        let rst = await this.backend_actor.add_chunk(
          BigInt(file_id),
          new Uint8Array(element)
        );
        if ("Err" in rst) {
          throw new Error("Error Adding Chunks");
        }
      }

      return true;
    } else {
      let rst = await this.backend_actor.add_chunk(BigInt(file_id), file_bytes);

      if ("Err" in rst) {
        throw new Error("Could not create File");
      }

      return Number(rst.Ok);
    }
  }

  async get_files() {
    return await this.backend_actor.get_files();
  }

  async get_status() {
    return await this.backend_actor.get_status();
  }

  async get_paths(path?: string) {
    return await this.backend_actor.get_path_contents(path ? [path] : []);
  }

  async get_file(file_id : number) {
    return await this.backend_actor.get_file(BigInt(file_id))
  }

}

export class RegistryCanister {
  backend_actor;
  constructor(canister_id: string, identity: Identity, host?: string) {
    this.backend_actor = createActor(canister_id, {
      agentOptions: {
        identity,
        host,
      },
    });
  }

  create_user(): Promise<Result> {
    return this.backend_actor.create_user();
  }

  get_deposit_address() {
    return this.backend_actor.generate_deposit_address();
  }

  get_user_canister(): Promise<Result> {
    return this.backend_actor.get_user_canister();
  }

  top_up(): Promise<Result_1> {
    return this.backend_actor.top_up_user_canister();
  }
}
