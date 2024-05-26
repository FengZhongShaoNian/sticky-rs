import {emit, Event, listen} from '@tauri-apps/api/event';
import {
    appWindow,
    LogicalSize,
    PhysicalPosition,
    PhysicalSize,
    WebviewWindow
} from "@tauri-apps/api/window";
import {invoke} from '@tauri-apps/api/tauri';
import logger from "./logger.ts";
import {Editor} from "./editor.ts";

let editor: Editor | null;

// Toolbar窗口顶部距离主窗口底部的距离
const marginMainWindowBottom = 10;

async function createToolbarWindow() {
    const toolbarWindowLabel = appWindow.label + "-toolbar";

    const toolbarSize = new LogicalSize(500, 34);

    let toolbarWindow = new WebviewWindow(toolbarWindowLabel, {
        url: 'toolbar.html',
        width: toolbarSize.width,
        height: toolbarSize.height,
        skipTaskbar: true,
        decorations: false,
        alwaysOnTop: true,
        visible: false,
    });
    const mainWindowInnerSize = await appWindow.innerSize();
    const mainWindowInnerPos = await appWindow.innerPosition();
    const toolbarPos = new PhysicalPosition(mainWindowInnerPos.x, mainWindowInnerPos.y + mainWindowInnerSize.height + marginMainWindowBottom);

    await toolbarWindow.setPosition(toolbarPos);
    await toolbarWindow.once('tauri://error', async function (e) {
        // an error occurred during webview window creation
        await logger.error(`an error occurred during webview window creation: ${e.payload}`)
    });

    // 由于Tauri的resizable设置为false时有bug，会导致窗口大小不对
    // 这里通过设置最大尺寸和最小尺寸来避免调整窗口大小
    await toolbarWindow.setMaxSize(toolbarSize);
    await toolbarWindow.setMinSize(toolbarSize);

    await toolbarWindow.show();
    return toolbarWindow;
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

async function openImage(imagePath: string): Promise<Editor>{
    let base64Image = await invoke<string>('read_image', {
        path: imagePath
    });
    let logicalSize = await getImageSize(base64Image);

    const toolbarWindow = await createToolbarWindow();
    editor = new Editor({
            dataURL: base64Image,
            width: logicalSize.width,
            height: logicalSize.height},
        toolbarWindow);

    await appWindow.onMoved(async (event) => {
        const {x, y} = event.payload;
        const mainWindowInnerSize = await appWindow.innerSize();
        const toolbarPos = new PhysicalPosition(x, y + mainWindowInnerSize.height + marginMainWindowBottom);
        await toolbarWindow.setPosition(toolbarPos);
    });

    return editor;
}

document.addEventListener("DOMContentLoaded", async function () {
    await logger.info('DOMContentLoaded').catch(console.error);

    await listen<string>('open-image', async (event: Event<string>) => {
        const imagePath = event.payload;
        await logger.info('received imagePath: ' + imagePath);

        editor = await openImage(imagePath);
    });

    // 页面DOM加载完成
    await emit('page-loaded', {
        send_from: appWindow.label,
    });

    await logger.info('pageLoaded event sent');


});


