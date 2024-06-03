import {emit, Event, listen} from '@tauri-apps/api/event';
import {
    appWindow,
    LogicalPosition,
    LogicalSize,
    PhysicalPosition,
    WebviewWindow
} from "@tauri-apps/api/window";
import {invoke} from '@tauri-apps/api/tauri';
import clipboard from "tauri-plugin-clipboard-api";
import logger from "../../common/logger.ts";
import {Editor} from "./editor.ts";
import {CustomEvent} from "../../common/custom-event.ts";
import {generateContextMenuWindowLabel, generateToolbarWindowLabel} from "../../common/window-label.ts";
import {ToolName} from "../../common/tool-name.ts";
import {save} from "@tauri-apps/api/dialog";
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/api/notification';


const editor = new Editor();
const toolbarWindow = createToolbarWindow();
const customContextMenuWindow = createCustomContextMenu();

editor.addZoomEventListener((zoomEvent)=>{
    const logicalSize = new LogicalSize(zoomEvent.width, zoomEvent.height);
    console.log('开始调整主窗口大小');
    invoke('set_fixed_size', {
        logicalSize: logicalSize
    }).then(()=>{
        console.log(`调整后主窗口大小：${logicalSize.width.toFixed(1)} x ${logicalSize.height.toFixed(1)}`);
    });
});

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

async function openImage(imagePath: string) {
    const base64Image = await invoke<string>('read_image', {
        path: imagePath
    });

    const img = new Image();
    img.src = base64Image;
    img.onload = () => {
        editor.open(img);
    }
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
            await exitEditModeAndHideToolbar();
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

async function tryToSendNotification(title: string, body: string){
    // 你有发送通知的权限吗？
    let permissionGranted = await isPermissionGranted();

    // 如果没有，我们需要请求它
    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }

    // 一旦获得许可，我们就可以发送通知
    if (permissionGranted) {
        sendNotification({ title, body});
    }
}

async function handleToolbarEvents(){
    await listen(CustomEvent.TOOLBAR_BUTTON_CLICK, async (event) => {
        await logger.trace(`received ${CustomEvent.TOOLBAR_BUTTON_CLICK} from ${event.windowLabel}, payload: ${event.payload}`)

        const toolName = event.payload as string;
        await logger.trace(`${toolName} clicked`)

        if(toolName === ToolName.UNDO_TOOL){
            editor.undo();
        }else if(toolName === ToolName.REDO_TOOL){
            editor.redo();
        }else if(toolName === ToolName.COPY_TOOL){
            const dataURL = editor.exportPngImage();
            console.log('导出的图片:', dataURL);
            if(dataURL){
                const base64 = dataURL.split(',')[1];
                return clipboard.writeImageBase64(base64)
                    .then(()=>tryToSendNotification('提示', '图片已经成功复制到剪切板'));
            }else {
                return tryToSendNotification('错误', '复制图片失败');
            }

        } else if(toolName === ToolName.SAVE_TOOL){
            const dataURL = editor.exportPngImage();
            console.log('导出的图片:', dataURL);
            if(dataURL){
                const base64 = dataURL.split(',')[1];
                return saveImageFile(base64)
                    .then(()=>tryToSendNotification('提示', '图片已经成功导出'));
            }else {
                return tryToSendNotification('错误', '图片导出失败');
            }
        }else if(toolName === ToolName.OK_TOOL){
            exitEditModeAndHideToolbar().catch(console.error);
        }
        else {
            editor.activeTool(toolName);
        }
        // TODO
    });
}

async function exitEditModeAndHideToolbar(){
    editor.exitEditMode();
    await toolbarWindow.hide();
}

async function saveImageFile(base64EncodedImage: string){
    let filePath = await save({
        filters: [{
            name: 'Image',
            extensions: ['png']
        }]
    });
    if(filePath){
        if(!filePath.endsWith('.png')){
            filePath = filePath + '.png';
        }
        return invoke('write_image', {
            path: filePath,
            base64EncodedImage
        });
    }
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
