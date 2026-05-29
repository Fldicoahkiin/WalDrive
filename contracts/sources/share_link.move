/// Wallet-free share links. The ShareLink object's own ID is the share URL:
/// `/drive/{objectId}`. The frontend resolves a share by `getObject(objectId)` —
/// no ShareRegistry, no share_code lookup, no wallet needed to read.
///
/// `blob_id` / `file_name` are denormalized onto the link so the public share page
/// renders from a single `getObject` + an aggregator read.
///
/// Roadmap: short codes / expiry. Short codes belong in an off-chain indexer, NOT a
/// singleton on-chain registry (which would serialize every create through consensus).
module waldrive::share_link {
    use std::string::String;
    use sui::clock::{Self, Clock};

    /// Owned by the creator. Anyone can `getObject` it for wallet-free reads
    /// (reading does not require ownership). Creator deletes it to revoke.
    public struct ShareLink has key {
        id: UID,
        file_id: ID,           // the FileRecord this link points at
        blob_id: String,       // denormalized for wallet-free reads
        file_name: String,
        owner: address,
        created_at_ms: u64,
    }

    public entry fun create(
        file_id: ID,
        blob_id: String,
        file_name: String,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let link = ShareLink {
            id: object::new(ctx),
            file_id,
            blob_id,
            file_name,
            owner: ctx.sender(),
            created_at_ms: clock::timestamp_ms(clock),
        };
        transfer::transfer(link, ctx.sender());
    }

    /// Delete the ShareLink to revoke the share.
    public entry fun revoke(link: ShareLink) {
        let ShareLink {
            id,
            file_id: _,
            blob_id: _,
            file_name: _,
            owner: _,
            created_at_ms: _,
        } = link;
        object::delete(id);
    }
}
