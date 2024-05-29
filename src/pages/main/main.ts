import {emit, Event, listen} from '@tauri-apps/api/event';
import {
    appWindow,
    LogicalPosition,
    LogicalSize,
    PhysicalPosition,
    PhysicalSize,
    WebviewWindow
} from "@tauri-apps/api/window";
import {invoke} from '@tauri-apps/api/tauri';
import logger from "../../common/logger.ts";
import {Editor} from "./editor.ts";
import {CustomEvent} from "../../common/custom-event.ts";
import {generateContextMenuWindowLabel, generateToolbarWindowLabel} from "../../common/window-label.ts";
import {ToolName} from "../../common/tool-name.ts";

const editor = new Editor();
const toolbarWindow = createToolbarWindow();
const customContextMenuWindow = createCustomContextMenu();

// Toolbar窗口顶部距离主窗口底部的距离
const marginMainWindowBottom = 10;

// 根据当前主窗口的位置的大小计算出一个合适的位置用于展示工具条窗口
async function calculateSuitablePositionForToolbarWindow() {
    const mainWindowInnerSize = await appWindow.innerSize();
    const mainWindowInnerPos = await appWindow.innerPosition();
    return new PhysicalPosition(mainWindowInnerPos.x,
        mainWindowInnerPos.y + mainWindowInnerSize.height + marginMainWindowBottom);
}

function createToolbarWindow() {
    const toolbarWindowLabel = generateToolbarWindowLabel(appWindow.label);
    const toolbarSize = new LogicalSize(544, 34);

    const win = new WebviewWindow(toolbarWindowLabel, {
        url: 'toolbar.html',
        width: toolbarSize.width,
        height: toolbarSize.height,
        // https://github.com/tauri-apps/tao/issues/561
        // 不知道为啥Tauri的resizable设置为false会导致窗口大小不对
        // 这里通过设置最大尺寸和最小尺寸来避免调整窗口大小
        minWidth: toolbarSize.width,
        minHeight: toolbarSize.height,
        maxWidth: toolbarSize.width,
        maxHeight: toolbarSize.height,
        skipTaskbar: true,
        decorations: false,
        alwaysOnTop: true,
        visible: false,
    });

    let ignored = appWindow.onMoved(async () => {
        const toolbarPosition = await calculateSuitablePositionForToolbarWindow();
        await toolbarWindow.setPosition(toolbarPosition);
    });

    return win;
}

async function showToolbarWindow(){
    const toolbarPosition = await calculateSuitablePositionForToolbarWindow();
    await toolbarWindow.setPosition(toolbarPosition);
    await toolbarWindow.show();
}

async function getImageSize(base64Image: string): Promise<LogicalSize> {
    return new Promise((resolve) => {
        let img = new Image();
        img.src = base64Image;
        img.onload = async function () {
            let physicalSize = new PhysicalSize(img.width, img.height);
            let scaleFactor = await appWindow.scaleFactor();
            let logicalSize = physicalSize.toLogical(scaleFactor);
            resolve(logicalSize);
        };
    });
}

async function openImage(imagePath: string) {
    let base64Image = await invoke<string>('read_image', {
        path: imagePath
    });
    let logicalSize = await getImageSize(base64Image);

    editor.open({
        dataURL: base64Image,
        width: logicalSize.width,
        height: logicalSize.height
    });
}

function createCustomContextMenu() {
    const popupMenuWindowLabel = generateContextMenuWindowLabel(appWindow.label);
    const size = new LogicalSize(128, 170);
    return  new WebviewWindow(popupMenuWindowLabel, {
        url: 'context-menu.html',
        width: size.width,
        height: size.height,
        // https://github.com/tauri-apps/tao/issues/561
        // 不知道为啥Tauri的resizable设置为false会导致窗口大小不对
        // 这里通过设置最大尺寸和最小尺寸来避免调整窗口大小
        minWidth: size.width,
        minHeight: size.height,
        maxWidth: size.width,
        maxHeight: size.height,
        skipTaskbar: true,
        decorations: false,
        alwaysOnTop: true,
        visible: false,
    });
}

async function delay(milliSeconds: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliSeconds);
    });
}

async function showCustomContextMenu(position: LogicalPosition) {
    await customContextMenuWindow.setPosition(position);
    await customContextMenuWindow.show();

    // 延迟一会儿再设置焦点，目的是让弹出窗口位于主窗口之上，否则主窗口会盖住弹出窗口的一部分
    await delay(100);
    await customContextMenuWindow.setFocus();
}

async function handleCustomContextMenuEvents(){
    await listen(CustomEvent.MENU_TOGGLE_TOOLBAR, async (event) => {
        await logger.trace(`received ${CustomEvent.MENU_TOGGLE_TOOLBAR} from ${event.windowLabel}`)
        const visible = await toolbarWindow.isVisible();
        if(visible){
            await toolbarWindow.hide();
        }else {
            await showToolbarWindow();
        }
    });

    await listen(CustomEvent.MENU_COPY_TO_CLIPBOARD, async (event) => {
        await logger.trace(`received ${CustomEvent.MENU_TOGGLE_TOOLBAR} from ${event.windowLabel}`)
        // TODO
    });

    await listen(CustomEvent.MENU_SAVE_TO_FILE, async (event) => {
        await logger.trace(`received ${CustomEvent.MENU_TOGGLE_TOOLBAR} from ${event.windowLabel}`)
        // TODO
    });

    await listen(CustomEvent.MENU_CLOSE_WINDOW, async (event) => {
        await logger.trace(`received ${CustomEvent.MENU_TOGGLE_TOOLBAR} from ${event.windowLabel}`)
        await toolbarWindow.close();
        await customContextMenuWindow.close();
        await appWindow.close();
    });

    await listen(CustomEvent.MENU_OPEN_DEV_TOOLS, async (event) => {
        await logger.trace(`received ${CustomEvent.MENU_OPEN_DEV_TOOLS} from ${event.windowLabel}`)
        await invoke('open_devtools', {});
    });
}

async function handleToolbarEvents(){
    await listen(CustomEvent.TOOLBAR_BUTTON_CLICK, async (event) => {
        await logger.trace(`received ${CustomEvent.TOOLBAR_BUTTON_CLICK} from ${event.windowLabel}, payload: ${event.payload}`)

        const toolName = event.payload;
        await logger.trace(`${toolName} clicked`)

        if(toolName === ToolName.UNDO_TOOL){
            editor.undo();
        }else if(toolName === ToolName.REDO_TOOL){
            editor.redo();
        }
        // TODO
    });
}

document.addEventListener("DOMContentLoaded", async function () {
    await logger.info('DOMContentLoaded').catch(console.error);

    await listen<string>('open-image', async (event: Event<string>) => {
        const imagePath = event.payload;
        await logger.info('received imagePath: ' + imagePath);

        await openImage(imagePath);
        await showToolbarWindow();
    });

    // 页面DOM加载完成
    await emit('page-loaded', {
        send_from: appWindow.label,
    });

    await logger.info('pageLoaded event sent');

    await handleCustomContextMenuEvents();
    await handleToolbarEvents();
});

document.addEventListener('contextmenu', async (event) => {
    // 阻止默认的右键菜单弹出
    event.preventDefault();

    // 展示自定义右键菜单
    let logicalPosition = new LogicalPosition(event.screenX, event.screenY);
   await showCustomContextMenu(logicalPosition);

}, false);

document.addEventListener('click', async (_event) => {
    await customContextMenuWindow.hide();
});
