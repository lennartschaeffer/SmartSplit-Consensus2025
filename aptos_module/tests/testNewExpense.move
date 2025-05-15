#[test_only]
module testNewExpense::tests {
    use std::signer;
    use std::vector;
    use botName::split_expense;
    use aptos_framework::aptos_coin;
    use aptos_framework::coin;
    use std::string::{String, utf8};

    #[test(payer = @0x1, member1 = @0x2, member2 = @0x3)]
    public fun test_full_payment_flow(payer: &signer, member1: &signer, member2: &signer) {

        coin::register<aptos_coin::AptosCoin>(payer);
        coin::register<aptos_coin::AptosCoin>(member1);
        coin::register<aptos_coin::AptosCoin>(member2);

        let (freeze, burn, mint_cap) = aptos_coin::claim_mint_capability(payer);


        coin::mint<aptos_coin::AptosCoin>(1_000_000, mint_cap);

        let payer_addr = signer::address_of(payer);
        let member1_addr = signer::address_of(member1);
        let member2_addr = signer::address_of(member2);

        // Deposit coins to test accounts
        coin::deposit<aptos_coin::AptosCoin>(payer_addr, coin::zero<aptos_coin::AptosCoin>());
        coin::deposit<aptos_coin::AptosCoin>(member1_addr, coin::zero<aptos_coin::AptosCoin>());
        coin::deposit<aptos_coin::AptosCoin>(member2_addr, coin::zero<aptos_coin::AptosCoin>());



        // Initialize store and create expense
        split_expense::InitStore(payer);
        let members = vector::empty<address>();
        vector::push_back(&mut members, member1_addr);
        vector::push_back(&mut members, member2_addr);

        let owed = vector::empty<u64>();
        vector::push_back(&mut owed, 10);
        vector::push_back(&mut owed, 15);

        split_expense::CreateExpense(
            payer,  // Payer Address
            42,     // Unique ID
            members,  
            owed, // Amount owed
            vector::empty<u8>(),  // empty description
            0u64    // Date place holder
        );

        // Members pay
        split_expense::PayExpense(member1, payer_addr, 42);
        split_expense::PayExpense(member2, payer_addr, 42);

        // // Check final state
        // let expense = split_expense::get_expense(payer_addr, 42);
        // assert!(expense.is_paid, 900);
    }
}
