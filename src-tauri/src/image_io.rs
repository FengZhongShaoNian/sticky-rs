use base64::prelude::*;
use base64::prelude::BASE64_STANDARD;
use image::{ImageError, ImageResult};
use image::io::Reader as ImageReader;

/// DataURL string
pub type DataURL = String;

/// Describe the dimensions (width and height) of the image
pub struct ImageSize {
    pub width: u32,
    pub height: u32
}

/// Read image file and encode it into DataURL string
/// The format of DataURL:
/// ```
/// data:[<mime_type>][;base64],<data>
/// ```
#[tauri::command]
pub fn read_image(path: &str) -> Result<DataURL, String> {
    let result = std::fs::read(path);
    return match result {
        Ok(data)=> {
            match to_data_url(&data) {
                Ok(data_url) => Ok(data_url),
                Err(error) => Err(error.to_string())
            }
        },
        Err(error) => Err(error.to_string())
    };
}

#[tauri::command]
pub fn write_image(path: &str, base64_encoded_image: &str) -> Result<(),String> {
    let content = BASE64_STANDARD.decode(base64_encoded_image).map_err(|err| err.to_string())?;
    std::fs::write(path, content).map_err(|err| err.to_string())
}

/// Get size (width and height) of the image
pub fn get_image_size(path: &str) -> Result<ImageSize, String> {
    match read_image_dimensions(path) {
        Ok((width, height)) => Ok(ImageSize{width, height}),
        Err(error) => Err(error.to_string())
    }
}

fn to_data_url(data: &Vec<u8>) -> Result<DataURL, ImageError>{
    let format = image::guess_format(data)?;

    let mime_type = format.to_mime_type();
    let encoded = BASE64_STANDARD.encode(data);
    Ok(format!("data:{};base64,{}", mime_type, encoded))
}

fn read_image_dimensions(path: &str) -> ImageResult<(u32, u32)>{
    let reader = ImageReader::open(path)?;
    reader.into_dimensions()
}