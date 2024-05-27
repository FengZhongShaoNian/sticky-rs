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

let editor: Editor | null;
let toolbarWindow: WebviewWindow | null;
let popupMenuWindow: WebviewWindow | null;

// Toolbar窗口顶部距离主窗口底部的距离
const marginMainWindowBottom = 10;

// 根据当前主窗口的位置的大小计算出一个合适的位置用于展示工具条窗口
async function calculatePositionForToolbarWindow() {
    const mainWindowInnerSize = await appWindow.innerSize();
    const mainWindowInnerPos = await appWindow.innerPosition();
    return new PhysicalPosition(mainWindowInnerPos.x,
        mainWindowInnerPos.y + mainWindowInnerSize.height + marginMainWindowBottom);
}

async function createToolbarWindow() {
    if(toolbarWindow != null){
        await logger.info(`toolbarWindow is not null, ignore the creation request!`);
        return ;
    }
    const toolbarWindowLabel = appWindow.label + "-toolbar";
    const toolbarSize = new LogicalSize(544, 34);

    toolbarWindow = new WebviewWindow(toolbarWindowLabel, {
        url: 'toolbar.html',
        width: toolbarSize.width,
        height: toolbarSize.height,
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
    const toolbarPosition = await calculatePositionForToolbarWindow();
    await toolbarWindow.setPosition(toolbarPosition);

    await toolbarWindow.once('tauri://error', async function (e) {
        // an error occurred during webview window creation
        await logger.error(`an error occurred during webview window creation: ${e.payload}`)
    });

    await appWindow.onMoved(async (event) => {
        const {x, y} = event.payload;
        const mainWindowInnerSize = await appWindow.innerSize();
        const toolbarPos = new PhysicalPosition(x, y + mainWindowInnerSize.height + marginMainWindowBottom);
        if(toolbarWindow != null){
            await toolbarWindow.setPosition(toolbarPos);
        }
    });
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

async function openImage(imagePath: string): Promise<Editor> {
    let base64Image = await invoke<string>('read_image', {
        path: imagePath
    });
    let logicalSize = await getImageSize(base64Image);

    editor = new Editor({
            dataURL: base64Image,
            width: logicalSize.width,
            height: logicalSize.height
        });

    return editor;
}

function createCustomContextMenu() {
    if(popupMenuWindow != null){
        return;
    }
    const popupMenuWindowLabel = `${appWindow.label}-contextMenu`;
    const size = new LogicalSize(128, 132);
    popupMenuWindow = new WebviewWindow(popupMenuWindowLabel, {
        url: 'popup-menu.html',
        width: size.width,
        height: size.height,
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
    let ignore = popupMenuWindow.once('tauri://error', async function (e) {
        // an error occurred during webview window creation
        await logger.error(`an error occurred during popupMenuWindow creation: ${e.payload}`)
    });
}

async function delay(milliSeconds: number) {
    return new Promise((resolve) => {
        setTimeout(resolve, milliSeconds);
    });
}

async function showCustomContextMenu(position: LogicalPosition) {
    if (popupMenuWindow == null) {
        createCustomContextMenu();
    }
    await popupMenuWindow?.setPosition(position);
    await popupMenuWindow?.show();

    // 延迟一会儿再设置焦点，目的是让弹出窗口位于主窗口之上，否则主窗口会盖住弹出窗口的一部分
    await delay(100);
    await popupMenuWindow?.setFocus();
}

document.addEventListener("DOMContentLoaded", async function () {
    await logger.info('DOMContentLoaded').catch(console.error);

    await listen<string>('open-image', async (event: Event<string>) => {
        const imagePath = event.payload;
        await logger.info('received imagePath: ' + imagePath);

        editor = await openImage(imagePath);

        // 创建toolbar
        await createToolbarWindow();
    });

    // 页面DOM加载完成
    await emit('page-loaded', {
        send_from: appWindow.label,
    });

    await logger.info('pageLoaded event sent');

    // 创建自定义的右键菜单
    createCustomContextMenu();
});

document.addEventListener('contextmenu', async (event) => {
    // 阻止默认的右键菜单弹出
    event.preventDefault();

    // 展示自定义右键菜单
    let logicalPosition = new LogicalPosition(event.screenX, event.screenY);
    await showCustomContextMenu(logicalPosition);

}, false);

document.addEventListener('click', async (_event) => {
    await popupMenuWindow?.hide();
});
