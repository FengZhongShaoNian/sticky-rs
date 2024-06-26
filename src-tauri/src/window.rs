use std::sync::atomic::{AtomicUsize, Ordering};
use log::{info};
use tauri::{AppHandle, LogicalSize, Manager, PhysicalSize, Window};
use crate::events;
use crate::events::OpenImageEventPayload;
use crate::image_io::get_image_size;

// A window counter whose value increments by 1 each time a window is created
static MAIN_WINDOW_COUNTER: AtomicUsize = AtomicUsize::new(0);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
pub fn open_devtools(window: tauri::Window) {
    #[cfg(debug_assertions)]
    window.open_devtools();
}

#[tauri::command]
pub fn set_fixed_size(window: tauri::Window, logical_size: LogicalSize<f64>){
    set_fixed_size_with_ref(&window, logical_size);
}

fn set_fixed_size_with_ref(window: &Window, logical_size: LogicalSize<f64>) {
    window.set_size(logical_size).unwrap();
    // 由于通过resizeable=false来限制窗口的大小存在bug（https://github.com/tauri-apps/tao/issues/561）
    // 所以这里通过设置最大尺寸和最小尺寸来避免调整窗口大小
    window.set_min_size(Some(logical_size)).unwrap();
    window.set_max_size(Some(logical_size)).unwrap();
}

pub fn create_main_window(handle: &AppHandle, image_path: String) {
    let image_size = get_image_size(&image_path)
        .expect(&format!("Failed to get the size of image {}", image_path));

    let initial_window_size: PhysicalSize<f64> = PhysicalSize {
        width: image_size.width as f64,
        height: image_size.height as f64,
    };
    create_main_window_with_initial_window_size(handle, image_path, initial_window_size)
}

fn create_main_window_with_initial_window_size(handle: &AppHandle, image_path: String, initial_window_size: PhysicalSize<f64>) {
    let window_label = format!("main-{}", MAIN_WINDOW_COUNTER.fetch_add(1, Ordering::SeqCst));

    let main_window = tauri::WindowBuilder::new(
        handle,
        &window_label,
        tauri::WindowUrl::App("main.html".into()),
    )
        .decorations(false)
        .always_on_top(true)
        .skip_taskbar(true)
        .visible(false)
        .center()
        .build()
        .unwrap();

    let scale_factor = main_window.scale_factor().unwrap();
    let logical_size: LogicalSize<f64> = initial_window_size.to_logical(scale_factor);
    set_fixed_size_with_ref(&main_window, logical_size);
    main_window.show().unwrap();

    // Set up a listener to receive events from the front-end,
    // and upon completion of the front-end page loading, notify the window to open the specified image.
    handle.listen_global("page-loaded", move |event| {
        let payload = event.payload();
        if let Some(data) = payload {
            let page_loaded_event_payload: events::PageLoadedEventPayload = serde_json::from_str(data).unwrap();
            if page_loaded_event_payload.send_from == window_label {
                info!("[{window_label}] receive page-loaded event");

                main_window.emit("open-image", OpenImageEventPayload {
                    send_to: window_label.clone(),
                    image_path: image_path.clone()
                }).unwrap();
            }
        }
    });
}