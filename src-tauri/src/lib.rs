// Window config (title, size, vibrancy, overlay titlebar, remember size/position)
// lives in tauri.conf.json. On macOS we inset the native traffic lights so they
// sit vertically centered in the 48px (h-12) custom title bar instead of the
// default position, which reads as misaligned against our header content.
#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_window_state::Builder::default().build())
        .plugin(tauri_plugin_decorum::init())
        .setup(|app| {
            #[cfg(target_os = "macos")]
            {
                use tauri::Manager;
                use tauri_plugin_decorum::WebviewWindowExt;
                if let Some(window) = app.get_webview_window("main") {
                    let _ = window.set_traffic_lights_inset(16.0, 18.0);
                    // The custom React header already shows the WalDrive wordmark;
                    // clear the native window title so it isn't drawn twice.
                    let _ = window.set_title("");
                }
            }
            Ok(())
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
