/// Folders for organising files. A FileRecord points at its parent via
/// `folder_id`; a Folder points at its parent via `parent_id` (none = root).
/// Deletion does not cascade — the frontend resets children to root first.
module waldrive::folder {
    use std::string::String;
    use sui::clock::{Self, Clock};

    public struct Folder has key, store {
        id: UID,
        name: String,
        parent_id: Option<ID>, // none = root level
        owner: address,
        created_at_ms: u64,
    }

    public entry fun create(name: String, clock: &Clock, ctx: &mut TxContext) {
        transfer::transfer(new_folder(name, option::none(), clock, ctx), ctx.sender());
    }

    public entry fun create_nested(name: String, parent: ID, clock: &Clock, ctx: &mut TxContext) {
        transfer::transfer(new_folder(name, option::some(parent), clock, ctx), ctx.sender());
    }

    fun new_folder(name: String, parent_id: Option<ID>, clock: &Clock, ctx: &mut TxContext): Folder {
        Folder {
            id: object::new(ctx),
            name,
            parent_id,
            owner: ctx.sender(),
            created_at_ms: clock::timestamp_ms(clock),
        }
    }

    public entry fun rename(folder: &mut Folder, new_name: String) {
        folder.name = new_name;
    }

    public entry fun delete(folder: Folder) {
        let Folder { id, name: _, parent_id: _, owner: _, created_at_ms: _ } = folder;
        object::delete(id);
    }
}
