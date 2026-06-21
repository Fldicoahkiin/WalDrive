/// Seal access policy. A Seal key server dry-runs `seal_approve` before it
/// releases a decryption key, and the call must abort when access is denied.
/// WalDrive encrypts each blob under the owner's address as the Seal identity,
/// so only that address — proven by a session key — can unseal its own files.
module waldrive::access {
    const ENoAccess: u64 = 0;

    entry fun seal_approve(id: vector<u8>, ctx: &TxContext) {
        assert!(id == ctx.sender().to_bytes(), ENoAccess);
    }
}
