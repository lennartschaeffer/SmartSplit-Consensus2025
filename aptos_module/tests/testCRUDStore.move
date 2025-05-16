#[test_only]
module testCRUDStore::testCRUD {
    use std::vector;
    use std::string;
    use std::signer;
    use botName::split_expense;

    #[test(payer = @0xA, member1 = @0xB, member2 = @0xC,)]
    public fun testCRUDStore(payer: &signer, member1: &signer, member2: &signer) {

        split_expense::InitStore(payer);

         // Call CreateExpense
        let member_addresses = vector::empty<address>();
        vector::push_back(&mut member_addresses, signer::address_of(member1));
        vector::push_back(&mut member_addresses, signer::address_of(member2));

        let amounts_owed = vector::empty<u64>();
        vector::push_back(&mut amounts_owed, 100);
        vector::push_back(&mut amounts_owed, 200);

        let description = b"My first group expense";

        let expense_id = 1747332524;
        let date = 123456789;

        split_expense::CreateExpense(
            payer,
            expense_id,
            member_addresses,
            amounts_owed,
            description,
            date
        );

        let owed = split_expense::GetOwedMembers(signer::address_of(payer), expense_id);


        //Step 5: Assert two members are owed
        assert!(vector::length(&owed) == 2, 1000);
        
        let owed1 = vector::borrow(&owed, 0);
        let owed2 = vector::borrow(&owed, 1);

        let addr1 = split_expense::get_owed_member_addr(owed1);
        let addr2 = split_expense::get_owed_member_addr(owed2);

        // assert!(addr1 == signer::address_of(member1) || addr1 == signer::address_of(member2), 1001);
        // assert!(addr2 == signer::address_of(member1) || addr2 == signer::address_of(member2), 1002);

        let expense = split_expense::get_expense(signer::address_of(payer), expense_id);
        assert!(!split_expense::is_expense_paid(&expense), 9001); // should be false initially

    }
}