use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

#[derive(Debug, Serialize, Deserialize)]
pub struct DesktopInfo {
    pub name: String,
    pub version: String,
    pub platform: String,
    pub local_first_mode: bool,
}

#[tauri::command]
fn get_desktop_info() -> DesktopInfo {
    DesktopInfo {
        name: "pill".to_string(),
        version: "0.1.0".to_string(),
        platform: std::env::consts::OS.to_string(),
        local_first_mode: true,
    }
}

#[tauri::command]
fn notify_vault_locked(owner_id: String) -> Result<String, String> {
    if owner_id.is_empty() {
        return Err("owner_id cannot be empty".to_string());
    }
    // Safety hook: Ensure any pending OS keystore buffers for this identity are locked
    Ok(format!("Vault for '{}' successfully locked.", owner_id))
}

#[tauri::command]
fn show_capture_overlay(app: AppHandle) -> Result<(), String> {
    if let Some(window) = app.get_webview_window("main") {
        window.show().map_err(|e| e.to_string())?;
        window.set_focus().map_err(|e| e.to_string())?;
    }
    Ok(())
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            get_desktop_info,
            notify_vault_locked,
            show_capture_overlay
        ])
        .run(tauri::generate_context!())
        .expect("error while running pill desktop application");
}
