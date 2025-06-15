import { emit, Event, listen } from '@tauri-apps/api/event';
import { Image as TauriImage } from '@tauri-apps/api/image';
import { Window } from "@tauri-apps/api/window";
import { CheckMenuItem, Menu, MenuItem } from '@tauri-apps/api/menu';
import {
    getCurrentWebviewWindow
} from "@tauri-apps/api/webviewWindow";
import { invoke } from '@tauri-apps/api/core';
import logger from "../../common/logger.ts";
import { Editor } from "./editor.ts";
import { CustomEvent, listenMainWindowCustomEvent, sendEventToMainWindow } from "../../common/custom-event.ts";
import { generateToolbarWindowLabel, generateToolbarWindowWebviewLabel } from "../../common/window-label.ts";
import { ToolName } from "../../common/tool-name.ts";
import { save } from "@tauri-apps/plugin-dialog";
import {
    isPermissionGranted,
    requestPermission,
    sendNotification,
} from '@tauri-apps/plugin-notification';

import { i18n } from "../../common/translation.ts"
import { LogicalSize, PhysicalSize, PhysicalPosition } from '@tauri-apps/api/window';
import { Webview } from '@tauri-apps/api/webview';
import { writeImage } from '@tauri-apps/plugin-clipboard-manager';
const currentWebviewWindow = getCurrentWebviewWindow()

const isDevEnvironment = import.meta.env.MODE === 'development';

const editor = new Editor();
let toolbarWindow: null | Window = null;

// 是否隐藏任务栏图标
// 由于在隐藏任务栏图标的情况下，窗口会逃离窗口管理器的管理，不方便将窗口移动到其他的工作区，因此增加动态显示/隐藏任务栏图标的支持
let currentWebviewWindowSkipTaskbar = true;

editor.addZoomEventListener((zoomEvent) => {
    const logicalSize = new LogicalSize(zoomEvent.width, zoomEvent.height);
    logger.info('开始调整主窗口大小');
    invoke('set_fixed_size', {
        logicalSize: logicalSize
    }).then(() => {
        logger.info(`调整后主窗口大小：${logicalSize.width.toFixed(1)} x ${logicalSize.height.toFixed(1)}`);
    });
});

// Toolbar窗口顶部距离主窗口底部的距离
const marginMainWindowBottom = 10;

// 根据当前主窗口的位置的大小计算出一个合适的位置用于展示工具条窗口
async function calculateSuitablePositionForToolbarWindow(toolbarSize: PhysicalSize) {
    const mainWindowInnerSize = await currentWebviewWindow.innerSize();
    const mainWindowInnerPos = await currentWebviewWindow.innerPosition();
    // 让工具条的中点和主窗口的中点的x坐标一致（居中显示工具条）
    const centerX = mainWindowInnerPos.x + mainWindowInnerSize.width / 2;
    return new PhysicalPosition(centerX - toolbarSize.width / 2,
        mainWindowInnerPos.y + mainWindowInnerSize.height + marginMainWindowBottom);
}

function createToolbarWindow() {
    const toolbarWindowLabel = generateToolbarWindowLabel(currentWebviewWindow.label);
    const toolbarWindowWebviewLabel = generateToolbarWindowWebviewLabel(currentWebviewWindow.label);
    const toolbarSize = new LogicalSize(544, 34);

    const toolbar = new Window(toolbarWindowLabel, {
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

    toolbar.once('tauri://created', function () {
        logger.info('toolbarWindow successfully created');
        const webview = new Webview(toolbar, toolbarWindowWebviewLabel, {
            url: 'toolbar.html',
            x: 0,
            y: 0,
            width: toolbarSize.width,
            height: toolbarSize.height,
            devtools: true
        });

        webview.once('tauri://created', function () {
            logger.info('toolbarWindow webview successfully created');
        });
        webview.once('tauri://error', function (e) {
            logger.error(`An error happened while creating the toolbarWindow webview,${JSON.stringify(e)}`);
        });
    });
    toolbar.once('tauri://error', function (e) {
        logger.error(`An error happened while creating the toolbarWindow, ${JSON.stringify(e)}`);
    });

    let ignored = currentWebviewWindow.onMoved(async () => {
        const physicalSize = await toolbar.innerSize();
        const toolbarPosition = await calculateSuitablePositionForToolbarWindow(physicalSize);
        await toolbar.setPosition(toolbarPosition);
    });

    return toolbar;
}

async function showToolbarWindow() {
    if (!toolbarWindow) {
        toolbarWindow = createToolbarWindow();
    }
    const physicalSize = await toolbarWindow.innerSize();
    const toolbarPosition = await calculateSuitablePositionForToolbarWindow(physicalSize);
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

async function showCustomContextMenu() {
    let isToolbarVisible = false;
    if (toolbarWindow) {
        isToolbarVisible = await toolbarWindow.isVisible();
    }
    const showHideToolbarMenuItem = await CheckMenuItem.new({
        id: 'SHOW_HIDE_TOOLBAR_MENU_ITEM',
        text: i18n.t('contextMenu.showToolbar'),
        enabled: true,
        checked: isToolbarVisible,
        action: () => {
            sendEventToMainWindow(CustomEvent.MENU_TOGGLE_TOOLBAR);
        }
    });

    const copyToClipboardMenuItem = await MenuItem.new({
        id: 'COPY_TO_CLIPBOARD_MENU_ITEM',
        text: i18n.t('contextMenu.copyToClipboard'),
        enabled: true,
        action: () => {
            sendEventToMainWindow(CustomEvent.MENU_COPY_TO_CLIPBOARD);
        }
    });

    const exportToFileMenuItem = await MenuItem.new({
        id: 'EXPORT_TO_FILE_MENU_ITEM',
        text: i18n.t('contextMenu.exportToFile'),
        enabled: true,
        action: () => {
            sendEventToMainWindow(CustomEvent.MENU_EXPORT_TO_FILE);
        }
    });

    const closeWindowMenuItem = await MenuItem.new({
        id: 'CLOSE_WINDOW_MENU_ITEM',
        text: i18n.t('contextMenu.closeWindow'),
        enabled: true,
        action: () => {
            sendEventToMainWindow(CustomEvent.MENU_CLOSE_WINDOW);
        }
    });

    const toggleTaskbarIconMenuItem = await CheckMenuItem.new({
        id: 'TOGGLE_TASKBAR_ICON_MENU_ITEM',
        text: i18n.t('contextMenu.hideTaskbarIcon'),
        enabled: true,
        checked: currentWebviewWindowSkipTaskbar,
        action: () => {
            sendEventToMainWindow(CustomEvent.TOGGLE_TASKBAR_ICON);
        }
    });

    const menuItems = [
        showHideToolbarMenuItem,
        copyToClipboardMenuItem,
        exportToFileMenuItem,
        closeWindowMenuItem,
        toggleTaskbarIconMenuItem
    ];

    if (isDevEnvironment) {
        const openDevToolsMenuItem = await MenuItem.new({
            id: 'OPEN_DEV_TOOLS_MENU_ITEM',
            text: i18n.t('contextMenu.openDevTools'),
            enabled: true,
            action: () => {
                sendEventToMainWindow(CustomEvent.MENU_OPEN_DEV_TOOLS);
            }
        });
        menuItems.push(openDevToolsMenuItem);
    }
    const contextMenu = await Menu.new({
        items: menuItems
    });
    await contextMenu.popup();
}

async function closeCurrentWindow() {
    await toolbarWindow?.close();
    await currentWebviewWindow.close();
}

async function handleCustomContextMenuEvents() {
    await listenMainWindowCustomEvent<void>(CustomEvent.MENU_TOGGLE_TOOLBAR, async () => {
        const visible = await toolbarWindow?.isVisible();
        if (visible) {
            await exitEditModeAndHideToolbar();
        } else {
            await showToolbarWindow();
        }
    });

    await listenMainWindowCustomEvent<void>(CustomEvent.MENU_COPY_TO_CLIPBOARD, async () => {
        return await exportImageToClipboard();
    });

    await listenMainWindowCustomEvent<void>(CustomEvent.MENU_EXPORT_TO_FILE, async () => {
        return await exportImageToFile();
    });

    await listenMainWindowCustomEvent<void>(CustomEvent.MENU_CLOSE_WINDOW, async () => {
        await closeCurrentWindow();
    });

    await listenMainWindowCustomEvent<void>(CustomEvent.TOGGLE_TASKBAR_ICON, async () => {
        if (currentWebviewWindowSkipTaskbar) {
            currentWebviewWindow.setSkipTaskbar(false);
            currentWebviewWindowSkipTaskbar = false;
        }else {
            currentWebviewWindow.setSkipTaskbar(true);
            currentWebviewWindowSkipTaskbar = true;
        }

    });

    await listenMainWindowCustomEvent<void>(CustomEvent.MENU_OPEN_DEV_TOOLS, async () => {
        await invoke('open_devtools', {});
    });
}

async function tryToSendNotification(title: string, body: string) {
    //参考：https://v2.tauri.app/plugin/notification/

    // 目前通知功能在较新版本的Gnome上存在问题，官方尚未修复：https://github.com/tauri-apps/plugins-workspace/issues/2566

    // 你有发送通知的权限吗？
    let permissionGranted = await isPermissionGranted();

    // 如果没有，我们需要请求它
    if (!permissionGranted) {
        const permission = await requestPermission();
        permissionGranted = permission === 'granted';
    }

    // 一旦获得许可，我们就可以发送通知
    if (permissionGranted) {
        sendNotification({ title, body });
    } else {
        logger.error('Failed to get permissionGranted');
    }
}

async function exportImageToClipboard() {
    try {
        const image = await editor.exportPngImage();
        const buffer = await image.arrayBuffer();
        const data = await TauriImage.fromBytes(buffer)
        return writeImage(data)
            .then(() => tryToSendNotification(i18n.t('notifications.titleOK'), i18n.t('notifications.exportImageToClipboardOK')));
    } catch (e) {
        logger.error(`Failed to exportImageToClipboard: ${JSON.stringify(e)}`);
        return tryToSendNotification(i18n.t('notifications.titleErr'), i18n.t('notifications.exportImageToClipboardErr'));
    }
}

async function exportImageToFile() {
    const dataURL = editor.exportPngImageToDataURL();
    console.log('导出的图片:', dataURL);
    if (dataURL) {
        const base64 = dataURL.split(',')[1];
        return saveImageFile(base64)
            .then(filePath => {
                if (filePath) {
                    tryToSendNotification(i18n.t('notifications.titleOK'), i18n.t('notifications.exportImageToFileOK'));
                }
            });
    } else {
        return tryToSendNotification(i18n.t('notifications.titleErr'), i18n.t('notifications.exportImageToFileErr'));
    }
}

async function handleToolbarEvents() {
    await listenMainWindowCustomEvent<string>(CustomEvent.TOOLBAR_BUTTON_CLICK, async (event) => {
        await logger.trace(`received ${CustomEvent.TOOLBAR_BUTTON_CLICK}, payload: ${JSON.stringify(event.payload)}`)

        const toolName = event.payload;
        await logger.trace(`${toolName} clicked`)

        if (toolName === ToolName.UNDO_TOOL) {
            editor.undo();
        } else if (toolName === ToolName.REDO_TOOL) {
            editor.redo();
        } else if (toolName === ToolName.COPY_TOOL) {
            await exportImageToClipboard();
            return await exitEditModeAndHideToolbar();
        } else if (toolName === ToolName.SAVE_TOOL) {
            return await exportImageToFile();
        } else if (toolName === ToolName.OK_TOOL) {
            exitEditModeAndHideToolbar().catch(console.error);
        }
        else {
            editor.activeTool(toolName);
        }
    });
}

async function exitEditModeAndHideToolbar() {
    editor.exitEditMode();
    await toolbarWindow?.hide();
}

async function saveImageFile(base64EncodedImage: string) {
    let filePath = await save({
        filters: [{
            name: 'Image',
            extensions: ['png']
        }]
    });
    if (filePath) {
        if (!filePath.endsWith('.png')) {
            filePath = filePath + '.png';
        }
        await invoke('write_image', {
            path: filePath,
            base64EncodedImage
        });
        return filePath;
    }
    return null;
}

interface OpenImageEventPayload {
    // label of receiver window
    send_to: string,

    // path of image to open
    image_path: string,
}

document.addEventListener("DOMContentLoaded", async function () {
    await logger.info('DOMContentLoaded').catch(console.error);

    await listen<OpenImageEventPayload>('open-image', async (event: Event<OpenImageEventPayload>) => {
        const openImageEventPayload = event.payload;
        if (openImageEventPayload.send_to != currentWebviewWindow.label) {
            return;
        }
        const imagePath = openImageEventPayload.image_path;
        await logger.info('received imagePath: ' + imagePath);

        await openImage(imagePath);
        try {
            await showToolbarWindow();
        } catch (e) {
            await logger.error(`Failed to showToolbarWindow, ${JSON.stringify(e)}`);
        }

    });

    // 页面DOM加载完成
    await emit('page-loaded', {
        send_from: currentWebviewWindow.label,
    });

    await logger.info('pageLoaded event sent');

    await handleCustomContextMenuEvents();
    await handleToolbarEvents();
});

document.addEventListener('contextmenu', async (event) => {
    // 阻止默认的右键菜单弹出
    event.preventDefault();

    // 展示自定义右键菜单
    try {
        await showCustomContextMenu();
    } catch (e) {
        logger.error(`Failed to show context menu: ${e}`);
    }

}, false);

document.addEventListener('dblclick', async (_event) => {
    if (!editor.isEditing()) {
        await closeCurrentWindow();
    }
});