/// File metadata on Sui. The blob bytes live on Walrus; this record points at them
/// via `blob_id` and is owned by the uploader.
///
/// MVP scope: register / rename / set_visibility / delete (hard).
/// Roadmap (intentionally omitted here): versioning, soft-delete, tags, move_to_folder.
module waldrive::file_record {
    use std::string::String;
    use sui::clock::{Self, Clock};

    public struct FileRecord has key, store {
        id: UID,
        blob_id: String,          // Walrus blob ID
        name: String,             // display filename
        mime_type: String,
        size: u64,                // bytes
        folder_id: Option<ID>,    // parent Folder; none = root (folders are Roadmap)
        owner: address,
        uploaded_at_ms: u64,      // unix ms from Clock
        expiry_epoch: u64,        // Walrus expiry epoch number (for countdown UI)
        is_public: bool,
    }

    /// Register file metadata after the blob is on Walrus. Wallet signs this (the only
    /// on-chain tx in the MVP upload flow — the publisher fronts the WAL cost).
    public entry fun register(
        blob_id: String,
        name: String,
        mime_type: String,
        size: u64,
        expiry_epoch: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let record = FileRecord {
            id: object::new(ctx),
            blob_id,
            name,
            mime_type,
            size,
            folder_id: option::none(),
            owner: ctx.sender(),
            uploaded_at_ms: clock::timestamp_ms(clock),
            expiry_epoch,
            is_public: false,
        };
        transfer::transfer(record, ctx.sender());
    }

    public entry fun rename(record: &mut FileRecord, new_name: String) {
        record.name = new_name;
    }

    public entry fun set_visibility(record: &mut FileRecord, is_public: bool) {
        record.is_public = is_public;
    }

    /// Hard delete (MVP). Soft-delete + trash is Roadmap.
    public entry fun delete(record: FileRecord) {
        let FileRecord {
            id,
            blob_id: _,
            name: _,
            mime_type: _,
            size: _,
            folder_id: _,
            owner: _,
            uploaded_at_ms: _,
            expiry_epoch: _,
            is_public: _,
        } = record;
        object::delete(id);
    }
}
