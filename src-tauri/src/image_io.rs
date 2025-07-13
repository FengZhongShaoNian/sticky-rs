use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use image::GenericImageView;
use image::ImageBuffer;
use image::ImageError;
use image::RgbaImage;
use tauri::image::Image;

use crate::common::Size;

pub struct DataURL {
    pub mime_type: String,
    pub base64_encoded_data: String,
}

impl Clone for DataURL {
    fn clone(&self) -> Self {
        Self {
            mime_type: self.mime_type.clone(),
            base64_encoded_data: self.base64_encoded_data.clone(),
        }
    }
}

impl serde::Serialize for DataURL {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: serde::Serializer,
    {
        serializer.serialize_str(&format!(
            "data:{};base64,{}",
            self.mime_type, self.base64_encoded_data
        ))
    }
}

pub struct ImageContent {
    pub mime_type: String,
    pub data: Vec<u8>,
    pub size: Size<u32>,
}

impl From<Image<'_>> for ImageContent {
    fn from(value: Image) -> Self {
        let buf = value.rgba().to_owned();
        let img: RgbaImage =
            ImageBuffer::from_raw(value.width() as u32, value.height() as u32, buf)
                .expect("创建图像缓冲区失败");

        let mut png_bytes = Vec::new();
        img.write_to(
            &mut std::io::Cursor::new(&mut png_bytes),
            image::ImageFormat::Png,
        )
        .expect("PNG编码失败");

        ImageContent {
            mime_type: "image/png".to_string(),
            data: png_bytes,
            size: Size {
                width: value.width(),
                height: value.height(),
            },
        }
    }
}

impl ImageContent {
    pub fn to_data_url(self) -> DataURL {
        let encoded = BASE64_STANDARD.encode(self.data);
        DataURL {
            mime_type: self.mime_type,
            base64_encoded_data: encoded,
        }
    }
}

pub fn read_image(path: &str) -> Result<ImageContent, Box<dyn std::error::Error>> {
    let data = std::fs::read(path)?;
    let size = get_image_size(&data)?;
    let mime_type = get_image_mime_type(&data)?;
    Ok(ImageContent {
        mime_type: mime_type,
        data: data,
        size: size,
    })
}

#[tauri::command]
pub fn write_image(path: &str, base64_encoded_image: &str) -> Result<(), String> {
    let content = BASE64_STANDARD
        .decode(base64_encoded_image)
        .map_err(|err| err.to_string())?;
    std::fs::write(path, content).map_err(|err| err.to_string())
}

fn get_image_mime_type(data: &Vec<u8>) -> Result<String, ImageError> {
    let format = image::guess_format(data)?;

    let mime_type = format.to_mime_type();
    Ok(mime_type.to_string())
}

fn get_image_size(bytes: &[u8]) -> Result<Size<u32>, Box<dyn std::error::Error>> {
    let img = image::load_from_memory(bytes)?;
    let (width, height) = img.dimensions();
    Ok(Size {
        width: width,
        height: height,
    })
}
