use tauri::PhysicalSize;

#[derive(Clone, Copy, Debug)]
pub struct Size<T> {
    pub width: T,
    pub height: T,
}

impl Into<Size<f64>> for Size<u32> {
    fn into(self) -> Size<f64> {
        Size {
            width: self.width as f64,
            height: self.height as f64,
        }
    }
}

impl Into<PhysicalSize<u32>> for Size<u32> {
    fn into(self) -> PhysicalSize<u32> {
        PhysicalSize {
            width: self.width,
            height: self.height,
        }
    }
}

