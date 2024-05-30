// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use std::path::Path;
use std::sync::atomic::{AtomicUsize};
use log::{info, trace, warn};

use clap::Parser;
use tauri::{CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu};
use tauri_plugin_log::LogTarget;

use crate::image_io::{read_image, write_image};
use crate::window::{create_main_window, open_devtools, set_fixed_size};

mod events;
mod image_io;
mod window;

/// Command line args
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Path of image to open
    #[arg(short, long)]
    path: String,
}

fn get_image_path_from_cmd_args(args: Args) -> String{
    let path = Path::new(&args.path);

    if !path.exists() {
        panic!("Image {} not exits!", args.path);
    }
    args.path
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            info!("{}, {argv:?}, {cwd}", app.package_info().name);
            let args = Args::parse_from(argv);
            let image_path = get_image_path_from_cmd_args(args);
            create_main_window(app, image_path);
        }))
        .plugin(tauri_plugin_log::Builder::default().targets([
            LogTarget::LogDir,
            LogTarget::Stdout,
            LogTarget::Webview,
        ]).build())
        .plugin(tauri_plugin_clipboard::init())
        .setup(|app|{
            let args = Args::parse();
            let image_path = get_image_path_from_cmd_args(args);
            create_main_window(&app.handle(),  image_path);
            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(
            SystemTrayMenu::new()
                .add_item(CustomMenuItem::new("quit", "Quit"))
        ))
        .on_system_tray_event(|_app, event| {
            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => {
                    match id.as_str() {
                        "quit" => {
                            std::process::exit(0);
                        }
                        _ => {}
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![open_devtools,set_fixed_size,read_image,write_image])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
