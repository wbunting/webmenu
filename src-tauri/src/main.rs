#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

mod cmd;

fn main() {
  tauri::AppBuilder::new()
    .invoke_handler(|_webview, arg| {
      use cmd::Cmd::*;

      match serde_json::from_str(arg) {
        Err(e) => Err(e.to_string()),
        Ok(command) => match command {
          SendToStandardOutAndExit { output } => {
            println!("{}", output);
            std::process::exit(0);
          }
        },
      }
    })
    .build()
    .run();
}
