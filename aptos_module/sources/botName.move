module botName::split_expense{
    //Import external modules
    use std::signer;
    use std::vector;
    use aptos_framework::coin;
    use aptos_framework::aptos_coin;

    // Each indivdual member involved in the payment will have there own struct  (excluding the payer)
    public struct MemberExpense {
    addr: address,
    owed: u64,
    member_paid: bool,

    }

    // Final struct for one split payment
    public struct ExpenseToSplit has key{ 
        id: u64,
        payer: address,
        members: vector<MemberExpense>,
        is_paid: bool,
        date_created: u64,
        description: vector<u8>
    }

    public entry fun CreateExpense(
        account: &signer,
        id: u64,
        member_addresses: vector<address>,
        amounts_owed: vector<u64>,
        description: vector<u8>,
        date_created: u64
    ) {

        let payer = signer::address_of(account);

        assert!(vector::length(member_addresses) == vector::length(amounts_owed), 100); //Throw error if there is more amounts than members or vice versa

        let members = vector::empty<MemberExpense>();
        let len = vector::length(member_addresses);
        let mut i = 0;

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
        //Move the contract under the payers account
        move_to(account, expense);
    }

    /* 
    Gets a references to the expense, then checks that the member who is attempting to pay is actually shared on the expense. 
    Once member is confirmed to be on the expense checks if this member has paid or not if they have not send the money in APT coin
    Then check to see if this person is the last to pay the expense. Do this buy looping through members and checking the status of member_paid
    If all member_paid is true then mark the ExpenseToSplit struct is_paid as true. 
    */

    public fun PayExpense: (
        &signer,
        payer_address: address,
        expense_id: u64
    ) {
        let sender = signer::address_of(account);

        // Borrow the expense from the payer's storage
        let expense_ref = &mut borrow_global_mut<ExpenseToSplit>(payer_address);

        // Ensure the expense ID matches
        assert!(expense_ref.id == expense_id, 101);

        // Go through the members list and find the sender
        let mut found = false;
        let mut i = 0;
        let len = vector::length(&expense_ref.members);

        while (i < len) {
            let member_ref = &mut vector::borrow_mut(&mut expense_ref.members, i);

            if (member_ref.addr == sender) {
                found = true;
                assert!(!member_ref.member_paid, 102); // Already paid

                // Transfer the owed amount from sender to payer
                let coins = aptos_coin::withdraw(account, member_ref.owed);
                aptos_coin::deposit(payer_address, coins);

                // Mark as paid
                member_ref.member_paid = true;

                // Check if all members have paid
                let mut all_paid = true;
                let mut j = 0;
                while (j < len) {
                    let member = &vector::borrow(&expense_ref.members, j);
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
    }

    public fun get_expense(expense_id: u64): Option<ExpenseToSplit> {
        let expense_ref = borrow_global<ExpenseToSplit>(expense_id);
        return Some(expense_ref);
    }

    public fun get_member_status(expense_id: u64, member_address: address): Option<MemberExpense> {
        let expense_ref = borrow_global<ExpenseToSplit>(expense_id);
        let len = vector::length(&expense_ref.members);
        let mut i = 0;
        while (i < len) {
            let member = &vector::borrow(&expense_ref.members, i);
            if (member.addr == member_address) {
                return Some(*member);
            };
             i = i + 1;
        };
        return None;
    }

}