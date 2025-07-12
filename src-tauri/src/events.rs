#[derive(Clone, serde::Deserialize, Debug)]
pub struct PageLoadedEventPayload {
    /// label of sender window
    pub send_from: String,
}
