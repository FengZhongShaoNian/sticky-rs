#[derive(Clone, serde::Deserialize, Debug)]
pub struct PageLoadedEvent {
    /// label of sender window
    pub send_from: String,
}