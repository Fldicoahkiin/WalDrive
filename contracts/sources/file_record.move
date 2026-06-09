/// File metadata on Sui. The blob bytes live on Walrus; this record points at them
/// via `blob_id` and is owned by the uploader. Folders, tags, versioning and
/// soft-delete live on chain so the file tree is verifiable, not just local state.
module waldrive::file_record {
    use std::string::String;
    use sui::clock::{Self, Clock};

    public struct FileRecord has key, store {
        id: UID,
        blob_id: String,                 // Walrus blob ID
        name: String,                    // display filename
        mime_type: String,
        size: u64,                       // bytes
        folder_id: Option<ID>,           // parent Folder; none = root
        tags: vector<String>,
        owner: address,
        uploaded_at_ms: u64,             // unix ms from Clock
        expiry_epoch: u64,               // Walrus expiry epoch (countdown UI)
        is_public: bool,
        version: u64,                    // 1-based; bumped by create_version
        parent_version_id: Option<ID>,   // previous version's object id
        is_deleted: bool,                // soft-delete flag (trash)
        deleted_at_ms: Option<u64>,
    }

    /// Register file metadata after the blob is on Walrus. Wallet signs this.
    public entry fun register(
        blob_id: String,
        name: String,
        mime_type: String,
        size: u64,
        expiry_epoch: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        transfer::transfer(
            new_record(blob_id, name, mime_type, size, expiry_epoch, 1, option::none(), clock, ctx),
            ctx.sender(),
        );
    }

    fun new_record(
        blob_id: String,
        name: String,
        mime_type: String,
        size: u64,
        expiry_epoch: u64,
        version: u64,
        parent_version_id: Option<ID>,
        clock: &Clock,
        ctx: &mut TxContext,
    ): FileRecord {
        FileRecord {
            id: object::new(ctx),
            blob_id,
            name,
            mime_type,
            size,
            folder_id: option::none(),
            tags: vector::empty(),
            owner: ctx.sender(),
            uploaded_at_ms: clock::timestamp_ms(clock),
            expiry_epoch,
            is_public: false,
            version,
            parent_version_id,
            is_deleted: false,
            deleted_at_ms: option::none(),
        }
    }

    public entry fun rename(record: &mut FileRecord, new_name: String) {
        record.name = new_name;
    }

    public entry fun set_visibility(record: &mut FileRecord, is_public: bool) {
        record.is_public = is_public;
    }

    public entry fun move_to_folder(record: &mut FileRecord, folder: ID) {
        record.folder_id = option::some(folder);
    }

    public entry fun remove_from_folder(record: &mut FileRecord) {
        record.folder_id = option::none();
    }

    public entry fun add_tag(record: &mut FileRecord, tag: String) {
        if (!record.tags.contains(&tag)) record.tags.push_back(tag);
    }

    public entry fun remove_tag(record: &mut FileRecord, tag: String) {
        let (found, i) = record.tags.index_of(&tag);
        if (found) {
            record.tags.remove(i);
        };
    }

    /// Soft-delete: move to trash (kept on chain, filtered out client-side).
    public entry fun soft_delete(record: &mut FileRecord, clock: &Clock) {
        record.is_deleted = true;
        record.deleted_at_ms = option::some(clock::timestamp_ms(clock));
    }

    public entry fun restore(record: &mut FileRecord) {
        record.is_deleted = false;
        record.deleted_at_ms = option::none();
    }

    /// Create a new version pointing at a fresh blob, linked to the old record.
    public entry fun create_version(
        old: &FileRecord,
        new_blob_id: String,
        new_size: u64,
        new_expiry_epoch: u64,
        clock: &Clock,
        ctx: &mut TxContext,
    ) {
        let mut next = new_record(
            new_blob_id,
            old.name,
            old.mime_type,
            new_size,
            new_expiry_epoch,
            old.version + 1,
            option::some(object::id(old)),
            clock,
            ctx,
        );
        next.folder_id = old.folder_id;
        next.tags = old.tags;
        next.is_public = old.is_public;
        transfer::transfer(next, ctx.sender());
    }

    /// Hard delete — permanently destroys the record (empties trash).
    public entry fun delete(record: FileRecord) {
        let FileRecord {
            id,
            blob_id: _,
            name: _,
            mime_type: _,
            size: _,
            folder_id: _,
            tags: _,
            owner: _,
            uploaded_at_ms: _,
            expiry_epoch: _,
            is_public: _,
            version: _,
            parent_version_id: _,
            is_deleted: _,
            deleted_at_ms: _,
        } = record;
        object::delete(id);
    }

    // === test-only accessors ===
    // Struct fields are module-private; expose read-only views for unit tests.

    #[test_only]
    public fun name(record: &FileRecord): String { record.name }

    #[test_only]
    public fun version(record: &FileRecord): u64 { record.version }

    #[test_only]
    public fun is_deleted(record: &FileRecord): bool { record.is_deleted }

    #[test_only]
    public fun is_public(record: &FileRecord): bool { record.is_public }

    #[test_only]
    public fun tags(record: &FileRecord): vector<String> { record.tags }

    #[test_only]
    public fun folder_id(record: &FileRecord): Option<ID> { record.folder_id }

    #[test_only]
    public fun parent_version_id(record: &FileRecord): Option<ID> { record.parent_version_id }
}
