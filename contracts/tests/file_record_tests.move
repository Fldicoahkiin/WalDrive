#[test_only]
module waldrive::file_record_tests {
    use std::string;
    use sui::clock;
    use sui::test_scenario as ts;
    use waldrive::file_record::{Self, FileRecord};

    const USER: address = @0xA11CE;

    // register → defaults: version 1, not deleted, no tags, root, fields stored.
    #[test]
    fun register_sets_defaults() {
        let mut sc = ts::begin(USER);
        {
            let clk = clock::create_for_testing(ts::ctx(&mut sc));
            file_record::register(
                string::utf8(b"blob-1"),
                string::utf8(b"hello.txt"),
                string::utf8(b"text/plain"),
                42,
                10,
                false,
                &clk,
                ts::ctx(&mut sc),
            );
            clock::destroy_for_testing(clk);
        };

        ts::next_tx(&mut sc, USER);
        {
            let rec = ts::take_from_sender<FileRecord>(&sc);
            assert!(file_record::version(&rec) == 1, 0);
            assert!(!file_record::is_deleted(&rec), 1);
            assert!(!file_record::is_public(&rec), 2);
            assert!(file_record::tags(&rec).is_empty(), 3);
            assert!(file_record::folder_id(&rec).is_none(), 4);
            assert!(file_record::parent_version_id(&rec).is_none(), 5);
            assert!(file_record::name(&rec) == string::utf8(b"hello.txt"), 6);
            ts::return_to_sender(&sc, rec);
        };
        ts::end(sc);
    }

    // rename + set_visibility toggle.
    #[test]
    fun rename_and_visibility() {
        let mut sc = ts::begin(USER);
        register_one(&mut sc);

        ts::next_tx(&mut sc, USER);
        {
            let mut rec = ts::take_from_sender<FileRecord>(&sc);
            file_record::rename(&mut rec, string::utf8(b"renamed.txt"));
            assert!(file_record::name(&rec) == string::utf8(b"renamed.txt"), 0);

            file_record::set_visibility(&mut rec, true);
            assert!(file_record::is_public(&rec), 1);
            file_record::set_visibility(&mut rec, false);
            assert!(!file_record::is_public(&rec), 2);

            ts::return_to_sender(&sc, rec);
        };
        ts::end(sc);
    }

    // add_tag, duplicate add (no double), then remove_tag back to empty.
    #[test]
    fun tags_add_dedupe_remove() {
        let mut sc = ts::begin(USER);
        register_one(&mut sc);

        ts::next_tx(&mut sc, USER);
        {
            let mut rec = ts::take_from_sender<FileRecord>(&sc);
            let tag = string::utf8(b"work");

            file_record::add_tag(&mut rec, tag);
            assert!(file_record::tags(&rec).length() == 1, 0);

            // duplicate add is a no-op
            file_record::add_tag(&mut rec, tag);
            assert!(file_record::tags(&rec).length() == 1, 1);
            assert!(file_record::tags(&rec).contains(&tag), 2);

            file_record::remove_tag(&mut rec, tag);
            assert!(file_record::tags(&rec).is_empty(), 3);

            ts::return_to_sender(&sc, rec);
        };
        ts::end(sc);
    }

    // soft_delete → is_deleted; restore → not deleted.
    #[test]
    fun soft_delete_then_restore() {
        let mut sc = ts::begin(USER);
        register_one(&mut sc);

        ts::next_tx(&mut sc, USER);
        {
            let mut rec = ts::take_from_sender<FileRecord>(&sc);
            let clk = clock::create_for_testing(ts::ctx(&mut sc));

            file_record::soft_delete(&mut rec, &clk);
            assert!(file_record::is_deleted(&rec), 0);

            file_record::restore(&mut rec);
            assert!(!file_record::is_deleted(&rec), 1);

            clock::destroy_for_testing(clk);
            ts::return_to_sender(&sc, rec);
        };
        ts::end(sc);
    }

    // move_to_folder(dummy id) → some; remove_from_folder → none.
    #[test]
    fun move_and_remove_from_folder() {
        let mut sc = ts::begin(USER);
        register_one(&mut sc);

        ts::next_tx(&mut sc, USER);
        {
            let mut rec = ts::take_from_sender<FileRecord>(&sc);
            let folder = object::id_from_address(@0xF01DE5);

            file_record::move_to_folder(&mut rec, folder);
            assert!(file_record::folder_id(&rec).is_some(), 0);
            assert!(*file_record::folder_id(&rec).borrow() == folder, 1);

            file_record::remove_from_folder(&mut rec);
            assert!(file_record::folder_id(&rec).is_none(), 2);

            ts::return_to_sender(&sc, rec);
        };
        ts::end(sc);
    }

    // create_version: v1 stays, new record has version 2 and parent_version_id == id(v1).
    #[test]
    fun create_version_links_to_parent() {
        let mut sc = ts::begin(USER);
        register_one(&mut sc);

        let v1_id;
        ts::next_tx(&mut sc, USER);
        {
            let rec1 = ts::take_from_sender<FileRecord>(&sc);
            v1_id = object::id(&rec1);
            let clk = clock::create_for_testing(ts::ctx(&mut sc));
            file_record::create_version(
                &rec1,
                string::utf8(b"blob-2"),
                100,
                20,
                &clk,
                ts::ctx(&mut sc),
            );
            clock::destroy_for_testing(clk);
            ts::return_to_sender(&sc, rec1);
        };

        // Sender now owns 2 FileRecords; drain and match by version.
        ts::next_tx(&mut sc, USER);
        {
            let mut ids = ts::ids_for_sender<FileRecord>(&sc);
            assert!(ids.length() == 2, 0);

            let mut saw_v1 = false;
            let mut saw_v2 = false;
            let mut recs = vector::empty<FileRecord>();
            while (!ids.is_empty()) {
                let id = ids.pop_back();
                let rec = ts::take_from_sender_by_id<FileRecord>(&sc, id);
                let v = file_record::version(&rec);
                if (v == 1) {
                    saw_v1 = true;
                    assert!(file_record::parent_version_id(&rec).is_none(), 1);
                } else {
                    assert!(v == 2, 2);
                    saw_v2 = true;
                    assert!(file_record::parent_version_id(&rec).is_some(), 3);
                    assert!(*file_record::parent_version_id(&rec).borrow() == v1_id, 4);
                };
                recs.push_back(rec);
            };
            assert!(saw_v1 && saw_v2, 5);

            while (!recs.is_empty()) {
                ts::return_to_sender(&sc, recs.pop_back());
            };
            recs.destroy_empty();
        };
        ts::end(sc);
    }

    // delete consumes the object: sender has no FileRecord afterwards.
    #[test]
    fun delete_consumes_record() {
        let mut sc = ts::begin(USER);
        register_one(&mut sc);

        ts::next_tx(&mut sc, USER);
        {
            let rec = ts::take_from_sender<FileRecord>(&sc);
            file_record::delete(rec);
        };

        ts::next_tx(&mut sc, USER);
        {
            assert!(!ts::has_most_recent_for_sender<FileRecord>(&sc), 0);
        };
        ts::end(sc);
    }

    // --- helpers ---

    // Register one default FileRecord owned by USER in its own tx.
    fun register_one(sc: &mut ts::Scenario) {
        let clk = clock::create_for_testing(ts::ctx(sc));
        file_record::register(
            string::utf8(b"blob-1"),
            string::utf8(b"hello.txt"),
            string::utf8(b"text/plain"),
            42,
            10,
            false,
            &clk,
            ts::ctx(sc),
        );
        clock::destroy_for_testing(clk);
    }
}
