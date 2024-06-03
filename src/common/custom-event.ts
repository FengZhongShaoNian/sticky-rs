import {getMainWindowLabel} from "./window-label.ts";
import {WebviewWindow} from "@tauri-apps/api/window";
import logger from "./logger.ts";

export enum CustomEvent {
    MENU_TOGGLE_TOOLBAR = "popup-menu-event://toggle-toolbar",
    MENU_COPY_TO_CLIPBOARD = "popup-menu-event://copy-to-clipboard",
    MENU_EXPORT_TO_FILE = "popup-menu-event://export-to-file",
    MENU_CLOSE_WINDOW = "popup-menu-event://close-window",
    MENU_OPEN_DEV_TOOLS = "popup-menu-event://open-dev-tools",
    TOOLBAR_BUTTON_CLICK = "toolbar://button-clicked",
}

const mainWindowLabel: string = getMainWindowLabel();
const mainWindow = WebviewWindow.getByLabel(mainWindowLabel);

export async function sendEventToMainWindow(event: string, payload: any){
    await mainWindow?.emit(event, payload);
    await logger.trace(`sent ${event} to ${mainWindowLabel}`);
}