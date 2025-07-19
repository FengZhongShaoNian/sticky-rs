use std::sync::atomic::{AtomicUsize, Ordering};
use tauri::{AppHandle, LogicalSize, PhysicalSize, WebviewWindow};

// A window counter whose value increments by 1 each time a window is created
static MAIN_WINDOW_COUNTER: AtomicUsize = AtomicUsize::new(0);

// Learn more about Tauri commands at https://tauri.app/v1/guides/features/command
#[tauri::command]
pub fn set_fixed_size(window: WebviewWindow, logical_size: LogicalSize<f64>) {
    set_fixed_size_ref(&window, logical_size);
}

#[tauri::command]
pub fn open_devtools(_window: WebviewWindow) {
    #[cfg(debug_assertions)] // only include this code on debug builds
    {
        _window.open_devtools();
    }
}

// 获取窗口的缩放因子
#[tauri::command]
pub fn get_scale_factor(window: WebviewWindow) -> Result<f64, String> {
    if let Ok(scale_factor_str) = std::env::var("STICKY_RS_SCALE_FACTOR") {
        println!("env STICKY_RS_SCALE_FACTOR: {}", scale_factor_str);
        match scale_factor_str.parse::<f64>() {
            Ok(scale_factor) => Ok(scale_factor),
            Err(_) => {
                println!(
                    "STICKY_RS_SCALE_FACTOR error. Failed to parse {} to f64",
                    scale_factor_str
                );
                Err("STICKY_RS_SCALE_FACTOR error".to_string())
            }
        }
    } else {
        match window.scale_factor() {
            Ok(scale_factor) => Ok(scale_factor),
            Err(e) => Err(e.to_string()),
        }
    }
}

fn set_fixed_size_ref(window: &WebviewWindow, logical_size: LogicalSize<f64>) {
    window.set_size(logical_size).unwrap();
    // 由于Linux上通过resizeable=false来限制窗口的大小存在bug（https://github.com/tauri-apps/tao/issues/561）
    // 所以这里通过设置最大尺寸和最小尺寸来避免调整窗口大小
    window.set_min_size(Some(logical_size)).unwrap();
    window.set_max_size(Some(logical_size)).unwrap();
}

pub fn create_main_window(
    handle: &AppHandle,
    initial_window_size: PhysicalSize<u32>,
) -> WebviewWindow {
    let window_label = format!(
        "main-{}",
        MAIN_WINDOW_COUNTER.fetch_add(1, Ordering::SeqCst)
    );

    let main_window = tauri::WebviewWindowBuilder::new(
        handle,
        &window_label,
        tauri::WebviewUrl::App("main.html".into()),
    )
    .decorations(false)
    .always_on_top(true)
    .skip_taskbar(true)
    .visible(false)
    
    .devtools(true)
    .center()
    .window_classname("sticky-rs-main")
    .build()
    .unwrap();

    if ! cfg!(target_os="linux") {
        main_window.set_resizable(false).unwrap();
    }

    let scale_factor = get_scale_factor(main_window.clone()).unwrap();
    let logical_size: LogicalSize<f64> = initial_window_size.to_logical(scale_factor);
    set_fixed_size_ref(&main_window, logical_size);
    main_window.show().unwrap();

    main_window
}
