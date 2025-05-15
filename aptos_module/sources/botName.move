module botName::split_expense{
    //Import external modules
    use std::signer;
    use std::vector;
    use std::table::Table;
    use aptos_std::table;
    use 0x1::aptos_coin::{Self, AptosCoin};
    use 0x1::coin;
    //use aptos_std::option; Helpers? 

    // Each indivdual member involved in the payment will have there own struct  (excluding the payer)
    public struct MemberExpense has copy, drop, store {
        addr: address,
        owed: u64,
        member_paid: bool,
    }

    // Main data struct for one single expense
    public struct ExpenseToSplit has copy, drop, store{ 
        id: u64,
        payer: address,
        members: vector<MemberExpense>,
        is_paid: bool,
        date_created: u64,
        description: vector<u8>
    }

    /// Storage container that maps expense_id ExpenseToSplit
    struct ExpenseStore has key {
        expenses: Table<u64, ExpenseToSplit>
    }

    // Initialize store for a user
    public entry fun InitStore(account: &signer) {
        let expense_table = table::new<u64, ExpenseToSplit>();
        move_to(account, ExpenseStore { expenses: expense_table });
    }

    fun EnsureExpenseStoreExists(account: &signer) {
        let addr = signer::address_of(account);
        if (!exists<ExpenseStore>(addr)) {
            move_to(account, ExpenseStore { expenses: table::new() });
        };
    }

    // Create a new expense and store it in the users ExpenseStore
    public entry fun CreateExpense(
        account: &signer,
        id: u64,
        member_addresses: vector<address>,
        amounts_owed: vector<u64>,
        description: vector<u8>,
        date_created: u64
    ) acquires ExpenseStore {

        EnsureExpenseStoreExists(account);

        let payer = signer::address_of(account);
        assert!(vector::length(&member_addresses) == vector::length(&amounts_owed), 100); //Throw error if there is more amounts than members or vice versa

        let members = vector::empty<MemberExpense>();
        let len = vector::length(&member_addresses);
        let i = 0;

        //Create an member expense for each 
        while(i < len){
            let member = MemberExpense {
                addr: *vector::borrow(&member_addresses, i),
                owed: *vector::borrow(&amounts_owed, i),
                member_paid: false,
            };
            vector::push_back(&mut members, member);
            i = i + 1;
        };
        
        let expense = ExpenseToSplit {
            id,
            payer,
            members,
            is_paid: false,
            date_created,
            description,
        };

        let store = borrow_global_mut<ExpenseStore>(payer);
        table::add(&mut store.expenses, id, expense);
    }

    /* 
    Gets a references to the expense, then checks that the member who is attempting to pay is actually shared on the expense. 
    Once member is confirmed to be on the expense checks if this member has paid or not if they have not send the money in APT coin
    Then check to see if this person is the last to pay the expense. Do this buy looping through members and checking the status of member_paid
    If all member_paid is true then mark the ExpenseToSplit struct is_paid as true. 
    */

    public entry fun PayExpense (
        account: &signer,
        payer_address: address,
        expense_id: u64
    ) acquires ExpenseStore {

        let sender = signer::address_of(account);
        let store = borrow_global_mut<ExpenseStore>(payer_address);
        let expense_ref = table::borrow_mut(&mut store.expenses, expense_id);


        // Ensure the expense ID matches   
        assert!(expense_ref.id == expense_id, 101);

        // Go through the members list and find the sender
        let i = 0;
        let len = vector::length(&expense_ref.members);

        while (i < len) {
            let member_ref = &mut expense_ref.members[i];

            if (member_ref.addr == sender) {
                assert!(!member_ref.member_paid, 102); // Already paid

                // Transfer the owed amount from sender to payer
                let coins = coin::withdraw<AptosCoin>(account, member_ref.owed);
                coin::deposit<AptosCoin>(payer_address, coins);    

                // Mark as paid
                member_ref.member_paid = true;

                // Check if all members have paid
                let all_paid = true;
                let j = 0;
                while (j < len) {
                    let member = &mut expense_ref.members[j];
                    if (!member.member_paid) {
                        all_paid = false;
                        break;
                    };
                    j = j + 1;
                };

                //If all paid set the main expense as is_paid true
                if (all_paid) {
                    expense_ref.is_paid = true;
                };
                return;

            };
            i = i + 1;
        };
        assert!(false, 103);// Member not part of this expense
    }

       // View a specific expense by payer and id
    // public fun GetExpense(payer_address: address, expense_id: u64): Option<ExpenseToSplit> {
    //     if (!exists<ExpenseStore>(payer_address)) return option::none();
    //     let store = borrow_global<ExpenseStore>(payer_address);
    //     if (!table::contains(&store.expenses, expense_id)) return option::none();
    //     option::some(table::borrow(&store.expenses, expense_id))
    // }

    // // Check a specific members status in an expense
    // public fun GetMemberStatus(payer_address: address, expense_id: u64, member_address: address): Option<MemberExpense> {
    //     if (!exists<ExpenseStore>(payer_address)) return option::none();
    //     let store = borrow_global<ExpenseStore>(payer_address);
    //     if (!table::contains(&store.expenses, expense_id)) return option::none();
    //     let expense = table::borrow(&store.expenses, expense_id);

    //     let len = vector::length(&expense.members);
    //     let i = 0;
    //     while (i < len) {
    //         let m = &vector::borrow(&expense.members, i);
    //         if (m.addr == member_address) return option::some(*m);
    //         i = i + 1;
    //     };
    //     return option::none();
    // }

}