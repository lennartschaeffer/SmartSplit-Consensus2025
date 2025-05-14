module testNewExpense::tests {
    use std::signer;
    use std::vector;
    use aptos_framework::aptos_coin;
    use botName::split_expense;

    
    #[test]
    public fun test_full_payment_flow(payer: &signer, member1: &signer, member2: &signer) {
        let payer_addr = signer::address_of(payer);
        let member1_addr = signer::address_of(member1);
        let member2_addr = signer::address_of(member2);

        // Deposit coins to test accounts
        aptos_coin::deposit(payer_addr, aptos_coin::zero());
        aptos_coin::deposit(member1_addr, aptos_coin::zero());
        aptos_coin::deposit(member2_addr, aptos_coin::zero());

        // Initialize store and create expense
        split_expense::init_store(payer);
        let members = vector::empty<address>();
        vector::push_back(&mut members, member1_addr);
        vector::push_back(&mut members, member2_addr);

        let owed = vector::empty<u64>();
        vector::push_back(&mut owed, 10);
        vector::push_back(&mut owed, 15);

        split_expense::CreateExpense(payer, 42, members, owed);

        // Members pay
        split_expense::PayExpense(member1, payer_addr, 42);
        split_expense::PayExpense(member2, payer_addr, 42);

        // Check final state
        let expense = split_expense::get_expense(payer_addr, 42);
        assert!(expense.is_paid, 900);
    }
}
