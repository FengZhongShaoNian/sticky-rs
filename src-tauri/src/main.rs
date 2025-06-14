// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::info;
use std::path::Path;

use clap::Parser;
use tauri::menu::MenuBuilder;
use tauri::tray::TrayIconBuilder;
use tauri_plugin_log::{Target, TargetKind};

use crate::image_io::{read_image, write_image};
use crate::window::{create_main_window, set_fixed_size};

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

fn get_image_path_from_cmd_args(args: Args) -> String {
    let path = Path::new(&args.path);

    if !path.exists() {
        panic!(
            "The image \"{}\" does not exist! (If you are running an AppImage，\
        you need to specify the absolute path to the image.)",
            args.path
        );
    }
    args.path
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            info!("{}, {argv:?}, {cwd}", app.package_info().name);
            let args = Args::parse_from(argv);
            let image_path = get_image_path_from_cmd_args(args);
            create_main_window(app, image_path);
        }))
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    Target::new(TargetKind::Stdout),
                    Target::new(TargetKind::Webview),
                ])
                .build(),
        )
        .plugin(tauri_plugin_clipboard::init())
        .plugin(tauri_plugin_dialog::init())
        .setup(|app| {
            let args = Args::parse();
            let image_path = get_image_path_from_cmd_args(args);
            create_main_window(&app.handle(), image_path);

            let menu = MenuBuilder::new(app).text("quit", "quit").build()?;

            TrayIconBuilder::new()
                .menu(&menu)
                .on_menu_event(|_app_handle, event| match event.id().0.as_str() {
                    "quit" => {
                        std::process::exit(0);
                    }
                    _ => {}
                })
                .build(app)?;
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_fixed_size,
            read_image,
            write_image
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
