cargo build --release --target wasm32-unknown-unknown --package satoshi_rust_backend && cp target/wasm32-unknown-unknown/release/satoshi_rust_backend.wasm src/satoshi_register/src && candid-extractor target/wasm32-unknown-unknown/release/satoshi_rust_backend.wasm > src/satoshi_rust_backend/satoshi_rust_backend.did
cargo build --release --target wasm32-unknown-unknown --package satoshi_register && candid-extractor target/wasm32-unknown-unknown/release/satoshi_register.wasm > src/satoshi_register/satoshi_register.did