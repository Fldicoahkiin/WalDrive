// Window config (title, size, vibrancy, overlay titlebar, remember size/position)
// lives in tauri.conf.json. This keeps the entry point minimal until backend
// commands (local-keypair signing, file IO) are added.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
