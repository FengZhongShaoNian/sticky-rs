
use log::info;
use xcap::Monitor;
use crate::image_io::ImageContent;

#[tauri::command]
pub fn capture_region(x: u32, y: u32, width: u32, height: u32) -> ImageContent {
    info!("Capture region x: {}, y: {}, width: {}, height: {}", x, y, width, height);
    let monitors = Monitor::all().expect("Failed to get list of available monitors");

    let monitor = monitors
        .into_iter()
        .find(|m| m.is_primary().unwrap_or(false))
        .expect("No primary monitor found");

    let monitor_width = monitor.width().unwrap();
    let monitor_height = monitor.height().unwrap();
    info!("Monitor width: {}, height: {}", monitor_width, monitor_height);

    let image = monitor.capture_region(x, y, width , height).unwrap();

    ImageContent::from(image)
}