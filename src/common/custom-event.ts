import { getMainWindowLabel } from "./window-label.ts";
import { Window } from "@tauri-apps/api/window";
import logger from "./logger.ts";
import { EventCallback, EventName, listen } from "@tauri-apps/api/event";

export enum CustomEvent {
    MENU_TOGGLE_TOOLBAR = "popup-menu-event://toggle-toolbar",
    MENU_COPY_TO_CLIPBOARD = "popup-menu-event://copy-to-clipboard",
    MENU_EXPORT_TO_FILE = "popup-menu-event://export-to-file",
    MENU_CLOSE_WINDOW = "popup-menu-event://close-window",
    MENU_OPEN_DEV_TOOLS = "popup-menu-event://open-dev-tools",
    TOGGLE_TASKBAR_ICON = "popup-menu-event://toggle-taskbar-icon",
    TOOLBAR_BUTTON_CLICK = "toolbar://button-clicked",
}

export interface CustomEventPayload<T> {
    target: string,
    content: T
}

const mainWindowLabel: string = getMainWindowLabel();


export async function sendEventToMainWindow(event: string, payload?: any) {
    const mainWindow = await Window.getByLabel(mainWindowLabel);
    if (mainWindow) {
        await mainWindow.emitTo(mainWindowLabel, event, {
            target: mainWindowLabel,
            content: payload
        });
        await logger.trace(`sent ${event} to ${mainWindowLabel}`);
    }else{
        await logger.error(`Failed to get mainWindow ${mainWindowLabel} by Label`);
    }
}

// 监听发送到当前主窗口的自定义事件
export async function listenMainWindowCustomEvent<T>(event: CustomEvent, handler: EventCallback<T>) {
    await listen<CustomEventPayload<T>>(event, async (event) => {
        await logger.trace(`received ${CustomEvent.MENU_TOGGLE_TOOLBAR}, target is: ${event.payload.target}`);
        if (event.payload.target != mainWindowLabel) {
            await logger.trace(`Ignored this event since event.payload.target(${event.payload.target}) != mainWindowLabel(${mainWindowLabel})`);
            return;
        }
        handler({
            event: event.event,
            id: event.id,
            payload: event.payload.content
        });
    });
}