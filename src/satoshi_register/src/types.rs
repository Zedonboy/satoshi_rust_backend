use candid::{CandidType, Principal};
use ic_ledger_types::BlockIndex;
use serde::Deserialize;

pub type NotifyTopUpResult = Result<u128, NotifyError>;
#[derive(CandidType, Deserialize, Debug)]
pub enum NotifyError {
    Refunded {
        reason: String,
        block_index: Option<BlockIndex>,
    },
    Processing,
    TransactionTooOld(BlockIndex),
    InvalidTransaction(String),
    Other {
        error_code: u64,
        error_message: String,
    },
}

#[derive(CandidType)]
pub struct NotifyTopUpArg {
    pub block_index: BlockIndex,
    pub canister_id: Principal,
}


