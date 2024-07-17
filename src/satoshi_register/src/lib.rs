use std::{cell::RefCell, collections::HashMap, io::Read, rc::Rc};

use candid::{candid_method, Nat, Principal};
use ic_cdk::{
    api::{
        call::call_with_payment,
        management_canister::{
            http_request::{
                self, http_request, CanisterHttpRequestArgument, HttpMethod, HttpResponse,
                TransformArgs, TransformContext, TransformFunc,
            },
            main::{
                canister_status, create_canister, install_code, CanisterIdRecord, CanisterSettings, CanisterStatusResponse, CreateCanisterArgument, InstallCodeArgument
            },
        },
    },
    call, caller, id, query, update,
};
use ic_ledger_types::{
    account_balance, transfer, AccountBalanceArgs, AccountIdentifier, Memo, Subaccount, Tokens,
    TransferArgs, MAINNET_CYCLES_MINTING_CANISTER_ID, MAINNET_LEDGER_CANISTER_ID,
};
use ic_xrc_types::{Asset, AssetClass, GetExchangeRateRequest, GetExchangeRateResult};
use satoshi_types::{ReadOnlyRcbytes, RegistryError};
use serde_bytes::ByteBuf;
use serde_json::Value;
use types::{NotifyTopUpArg, NotifyTopUpResult};
mod types;
pub const TRANSACTION_FEE: Tokens = Tokens::from_e8s(10000);
pub const MEMO_MINT_CYCLES: u64 = 0x544e494d;
pub const MEMO_TOP_UP : u64 = 1347768404;
pub const MEMO_TRANSFER_TO_PURSE : u64 = 0x644e494d;
const NOTIFY_TOP_UP_METHOD: &str = "notify_top_up";
const NOTIFY_MINT_METHOD : &str = "notify_mint_cycles";
const EXCHANGE_RATE_MAINNET_CANISTER: &str = "uf6dk-hyaaa-aaaaq-qaaaq-cai";

#[cfg(network = "ic")]
const LEDGER_CANISTER_ID : Principal = MAINNET_LEDGER_CANISTER_ID;

#[cfg(network = "ic")]
const CMC_CANISTER_ID : Principal = MAINNET_CYCLES_MINTING_CANISTER_ID;

pub fn add(left: usize, right: usize) -> usize {
    left + right
}

thread_local! {
    // key is principal id and value is storage canister
    static PREMIUM_USERS : RefCell<HashMap<String, String>> = RefCell::new(HashMap::new());
    static USER_STORAGE : ReadOnlyRcbytes = ReadOnlyRcbytes(Rc::new(ByteBuf::from(include_bytes!("satoshi_rust_backend.wasm"))))
}

#[update]
async fn create_user() -> Result<String, RegistryError> {
    let user_exists = PREMIUM_USERS.with_borrow(|store| store.contains_key(&caller().to_text()));

    if user_exists {
        return Err(RegistryError::UserIdExists);
    }

    // check if user has deposited ICP.
    let account = AccountIdentifier::new(&id(), &Subaccount::from(caller()));

    let balance_args = AccountBalanceArgs { account };

    #[cfg(network = "local")]
    let LEDGER_CANISTER_ID = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();

    let user_balance_tokens = account_balance(LEDGER_CANISTER_ID, balance_args)
        .await
        .unwrap();

    let amount = user_balance_tokens.e8s();

    if amount < 50000 {
        return Err(RegistryError::AmountBelowMin);
    }

    #[cfg(network = "local")]
    let CMC_CANISTER_ID = Principal::from_text("rkp4c-7iaaa-aaaaa-aaaca-cai").unwrap();

    let cycles_acc =
        AccountIdentifier::new(&CMC_CANISTER_ID, &Subaccount::from(id()));

    let amount_result = get_price_of_icp().await;

    if amount_result.is_err() {
        return Err(RegistryError::SystemError("Error getting Exchange rate data".to_string()));
    }

    let amount_of_icp_per_dollar = Tokens::from_e8s(amount_result.unwrap() * 3);

    if amount_of_icp_per_dollar >= user_balance_tokens {
        return Err(RegistryError::AmountBelowMin);
    }
    let transger_args = TransferArgs {
        memo: Memo(MEMO_TOP_UP),
        amount: user_balance_tokens - amount_of_icp_per_dollar,
        fee: TRANSACTION_FEE,
        from_subaccount: Some(Subaccount::from(caller())),
        to: cycles_acc,
        created_at_time: None,
    };

    let block_height = transfer(LEDGER_CANISTER_ID, transger_args)
        .await
        .unwrap()
        .unwrap();

    let notify_args = NotifyTopUpArg {
        block_index: block_height,
        canister_id: id(),
    };

    let (rslt,): (NotifyTopUpResult,) = call(
        CMC_CANISTER_ID,
        NOTIFY_TOP_UP_METHOD,
        (notify_args,),
    )
    .await
    .unwrap();

    let deposited_cycles = rslt.unwrap();

    let settings = CanisterSettings {
        controllers: Some(vec![caller(), id()]),
        compute_allocation: None,
        memory_allocation: None,
        freezing_threshold: None,
        reserved_cycles_limit: None,
    };

    let create_arg = CreateCanisterArgument {
        settings: Some(settings),
    };

    let (id_record,) = create_canister(create_arg, deposited_cycles).await.unwrap();

    let ReadOnlyRcbytes(wasm_bytes) = USER_STORAGE.with(|f| f.clone());

    let install_arg = InstallCodeArgument {
        mode: ic_cdk::api::management_canister::main::CanisterInstallMode::Install,
        canister_id: id_record.canister_id,
        wasm_module: wasm_bytes.to_vec(),
        arg: vec![],
    };

    install_code(install_arg).await.unwrap();

    PREMIUM_USERS
        .with_borrow_mut(|store| store.insert(caller().to_text(), id_record.canister_id.to_text()));

    Ok(id_record.canister_id.to_text())
}

#[update]
async fn top_up_user_canister() -> Result<u128, RegistryError> {
    let user_canister_id_opt = PREMIUM_USERS.with_borrow(|store| {
        store.get(&caller().to_text()).cloned()
    });

    if user_canister_id_opt.is_none() {
        return Err(RegistryError::UserNotFound);
    }

    let user_canister = Principal::from_text(user_canister_id_opt.unwrap()).unwrap();

    let user_balance = check_user_balance(caller()).await;

    let price_of_icp_rslt = get_price_of_icp().await;

    if price_of_icp_rslt.is_err() {
        return Err(RegistryError::SystemError("Could not get the current exchange rate".to_string()));
    }

    // amt * 10^8
    let scaled_icp_token = price_of_icp_rslt.unwrap();

    if scaled_icp_token >= user_balance {
        return Err(RegistryError::AmountBelowMin)
    }

    // substract $1 worth of ICP from user balance.
    let amount_to_use_as_topup = user_balance - scaled_icp_token;

    let amount_of_cycles_deposited = top_up_canister(amount_to_use_as_topup, user_canister).await;

    // transfer remaining to our purse.
    transfer_to_purse(scaled_icp_token, caller()).await;

    Ok(amount_of_cycles_deposited)
    
}

#[query]
async fn get_user_canister() -> Result<String, RegistryError> {
    let canister_id_opt = PREMIUM_USERS.with_borrow(|store| {
        store.get(&caller().to_text()).cloned()
    });

    if canister_id_opt.is_none() {
        return Err(RegistryError::UserNotFound);
    }

    return Ok(canister_id_opt.unwrap());
}

async fn check_user_balance(user : Principal) -> u64 {
     // check if user has deposited ICP.
     let account = AccountIdentifier::new(&id(), &Subaccount::from(user));

     let balance_args = AccountBalanceArgs { account };
 
     let user_balance_tokens = account_balance(MAINNET_LEDGER_CANISTER_ID, balance_args)
         .await
         .unwrap();
 
     let amount = user_balance_tokens.e8s();

     amount
}

async fn transfer_to_purse(amt_to_transfer : u64, subaccount : Principal) {
    let canister_purse = AccountIdentifier::new(&id(), &Subaccount([0; 32]));

    let transfer_args =TransferArgs {
        memo: Memo(MEMO_TRANSFER_TO_PURSE),
        amount: Tokens::from_e8s(amt_to_transfer),
        fee: TRANSACTION_FEE,
        from_subaccount: Some(Subaccount::from(subaccount)),
        to: canister_purse,
        created_at_time: None,
    };

    #[cfg(network = "local")]
    let LEDGER_CANISTER_ID = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();

    let _ = transfer(LEDGER_CANISTER_ID, transfer_args).await;
}

async fn top_up_canister(topup_amt: u64, canister_id : Principal) -> u128 {

    #[cfg(network = "local")]
    let CMC_CANISTER_ID = Principal::from_text("rkp4c-7iaaa-aaaaa-aaaca-cai").unwrap();

    #[cfg(network = "local")]
    let LEDGER_CANISTER_ID = Principal::from_text("ryjl3-tyaaa-aaaaa-aaaba-cai").unwrap();

    let cycles_acc =
        AccountIdentifier::new(&CMC_CANISTER_ID, &Subaccount::from(canister_id));

    let transger_args = TransferArgs {
        memo: Memo(MEMO_TOP_UP),
        amount: Tokens::from_e8s(topup_amt),
        fee: TRANSACTION_FEE,
        from_subaccount: Some(Subaccount::from(caller())),
        to: cycles_acc,
        created_at_time: None,
    };

    let block_height = transfer(LEDGER_CANISTER_ID, transger_args)
        .await
        .unwrap()
        .unwrap();

    let notify_args = NotifyTopUpArg {
        block_index: block_height,
        canister_id,
    };

    let (rslt,): (NotifyTopUpResult,) = call(
        CMC_CANISTER_ID,
        NOTIFY_TOP_UP_METHOD,
        (notify_args,),
    )
    .await
    .unwrap();

    let deposited_cycles = rslt.unwrap();

    deposited_cycles
}


fn round_up(num: f64, decimal_places: u32) -> f64 {
    let multiplier = 10_f64.powi(decimal_places as i32);
    (num * multiplier).ceil() / multiplier
}

#[cfg(network = "local")]
async fn get_price_of_icp() -> Result<u64, ()> {
    Ok(100_000_000)
}


#[cfg(network = "ic")]
async fn get_price_of_icp() -> Result<u64, ()> {
    let arg = GetExchangeRateRequest {
        base_asset: Asset {
            symbol: "USD".to_string(),
            class: ic_xrc_types::AssetClass::FiatCurrency,
        },
        quote_asset: Asset {
            symbol: "ICP".to_string(),
            class: AssetClass::Cryptocurrency,
        },
        timestamp: None,
    };
    let (result,): (GetExchangeRateResult,) = call_with_payment(
        Principal::from_text(EXCHANGE_RATE_MAINNET_CANISTER).unwrap(),
        "get_exchange_rate",
        (arg,),
        50_000_000,
    )
    .await
    .unwrap();

    if result.is_err() {
        return Err(());
    } else {
        let rate = result.unwrap();
        let rate_num = rate.rate;
        // used 8 because ICP is 10^8
        let f_num = multiply_u64_with_power_of_10(rate_num, 8 - rate.metadata.decimals as i32 );
        return Ok(f_num);
    }
}

fn multiply_u64_with_power_of_10(value: u64, power: i32) -> u64 {
    if power >= 0 {
        // Multiply by 10^power
        value.saturating_mul(10u64.saturating_pow(power as u32))
    } else {
        // Divide by 10^(-power)
        value / 10u64.saturating_pow((-power) as u32)
    }
}

#[query(guard = "is_not_anonymous")]
fn generate_deposit_address() -> String {
    ic_cdk::print("generate_deposit_address: received");
    let acc_id = AccountIdentifier::new(&id(), &Subaccount::from(caller()));
    acc_id.to_hex()
}


fn is_not_anonymous() -> Result<(), String> {
    if caller() == Principal::anonymous() {
        return Err("You are not authenticated".to_string());
    }

    Ok(())
}

#[query]
#[candid_method(query)]
fn export_candid() -> String {
    ic_cdk::export_candid!();
    __export_service()
}
