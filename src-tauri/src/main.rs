#![cfg_attr(
  all(not(debug_assertions), target_os = "windows"),
  windows_subsystem = "windows"
)]

use std::process::Command;

use serde_json::json;
use x11::xlib;

mod cmd;

fn window_id_string_to_hex(window_id: String) -> u64 {
  let this_x_window_id = u64::from_str_radix(window_id.trim_start_matches("0x").trim_end(), 16)
    .expect("failed parse window id");

  this_x_window_id
}

fn main() {
  let mut parent_x_window_string_id: Option<String> = None;

  match tauri::cli::get_matches() {
    Some(matches) => {
      let data = json!(&matches);
      let winvalue = data.get("args").and_then(|arg| arg.get("windowid"));
      match winvalue {
        Some(win) => match win.get("value") {
          Some(serde_json::Value::Bool(_bool)) => {
            //            println!("No argument")
          }
          Some(serde_json::Value::String(argument)) => {
            parent_x_window_string_id = Some(argument.to_owned());
          }
          _ => {
            println!("bad config 2")
          }
        },
        None => {
          println!("bad config")
        }
      }
    }
    None => {
      println!("None!")
    }
  }

  tauri::AppBuilder::new()
    .invoke_handler(move |_webview, arg| {
      use cmd::Cmd::*;

      match serde_json::from_str(arg) {
        Err(e) => Err(e.to_string()),
        Ok(command) => match command {
          Init {} => {
            match &parent_x_window_string_id {
              Some(parent_id) => {
                let query_xwindow = Command::new("sh")
                  .arg("-c")
                  .arg("wmctrl -lx | grep \"webmenu.Webmenu\" | cut -d ' ' -f 1")
                  .output()
                  .expect("failed to get this xwindow");

                let this_x_window_string_id = String::from_utf8(query_xwindow.stdout)
                  .expect("failed to parse this xwindow id string");

                let this_x_window_id = window_id_string_to_hex(this_x_window_string_id);
                let parent_x_window_id = window_id_string_to_hex(parent_id.to_string());

                unsafe {
                  let display = xlib::XOpenDisplay(std::ptr::null());
                  xlib::XMapWindow(display, parent_x_window_id);

                  xlib::XReparentWindow(display, this_x_window_id, parent_x_window_id, 0, 0);
                  xlib::XFlush(display);
                };
              }
              None => {}
            }
            Ok(())
          }
          SendToStandardOutAndExit { output } => {
            println!("{}", output);
            std::process::exit(0);
          }
          Exit {} => {
            std::process::exit(0);
          }
        },
      }
    })
    .build()
    .run();
}
