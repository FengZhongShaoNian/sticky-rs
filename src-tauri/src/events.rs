#[derive(Clone, serde::Deserialize, Debug)]
pub struct PageLoadedEventPayload {
    /// label of sender window
    pub send_from: String,
}

#[derive(Clone, serde::Serialize, Debug)]
pub struct OpenImageEventPayload {
    /// label of receiver window
    pub send_to: String,

    /// path of image to open
    pub image_path: String,
}
