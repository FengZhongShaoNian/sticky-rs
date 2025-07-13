// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

use log::{info, warn};
use std::error::Error;
use std::path::Path;
use tauri::Listener;

use clap::Parser;
use tauri::menu::MenuBuilder;
use tauri::tray::TrayIconBuilder;
use tauri::Emitter;
use tauri_plugin_clipboard_manager::ClipboardExt;

use crate::image_io::{read_image, write_image, DataURL, ImageContent};
use crate::window::{create_main_window, get_scale_factor, open_devtools, set_fixed_size};

mod common;
mod events;
mod image_io;
mod window;

/// Command line args
#[derive(Parser, Debug)]
#[command(version, about, long_about = None)]
struct Args {
    /// Path of image to open
    #[arg(short, long)]
    path: Option<String>,
}

fn get_image_from_args(args: Args) -> Option<ImageContent> {
    let image_path = args.path.as_ref()?;

    let path = Path::new(image_path);
    if !path.exists() {
        warn!(
            "The image \"{}\" does not exist! (If you are running an AppImage, \
            you need to specify the absolute path to the image.)",
            image_path
        );
        return None;
    }

    read_image(image_path)
        .inspect_err(|e| warn!("Failed to read image from file: {}", e))
        .ok()
}

fn get_image_from_clipboard(app: &tauri::AppHandle) -> Option<ImageContent> {
    app.clipboard()
        .read_image()
        .map(|x| ImageContent::from(x))
        .inspect_err(|e| warn!("Failed to read image from clipboard: {}", e))
        .ok()
}

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_log::Builder::new().build())
        .plugin(tauri_plugin_single_instance::init(|app, argv, cwd| {
            info!("{}, {argv:?}, {cwd}", app.package_info().name);
            let args = Args::parse_from(argv);
            open_image_if_present(&app, args);
        }))
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_notification::init())
        .setup(|app| {
            let args = Args::parse();

            create_tray_icon(app)?;
            open_image_if_present(app.handle(), args);

            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            set_fixed_size,
            open_devtools,
            write_image,
            get_scale_factor
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

fn create_tray_icon(app: &mut tauri::App) -> Result<(), Box<dyn Error>> {
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
}

fn open_image_if_present(app: &tauri::AppHandle, args: Args) {
    let image = get_image_from_args(args).or_else(|| get_image_from_clipboard(app));

    if let Some(image) = image {
        let size = image.size;
        let data_url: DataURL = image.to_data_url();
        let initial_window_size = size.into();
        let main_window = create_main_window(&app, initial_window_size);

        let window_label = main_window.label().to_string();

        // Set up a listener to receive events from the front-end,
        // and upon completion of the front-end page loading, notify the window to open the specified image.
        app.listen("page-loaded", move |event| {
            let payload = event.payload();

            let page_loaded_event_payload: events::PageLoadedEventPayload =
                serde_json::from_str(payload).unwrap();
            if page_loaded_event_payload.send_from == window_label {
                info!("[{window_label}] receive page-loaded event");

                main_window
                    .emit_to(window_label.clone(), "open-image", data_url.clone())
                    .unwrap();
            }
        });
    }
}
