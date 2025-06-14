import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
const appWindow = getCurrentWebviewWindow()

// 窗口命名规则：
// 1. 主窗口的label的命名规则是：`^main-[0-9]+$`
// 2. 工具条窗口的label的命名规则是：`^main-[0-9]+-toolbar$`
// 3. 右键菜单窗口的label的命名规则是：`^main-[0-9]+--contextMenu$`

const currentWindowLabel = appWindow.label;

const toolbarWindowLabelSuffix = '-toolbar';
const contextMenuWindowLabelSuffix = '-contextMenu';

export function generateToolbarWindowLabel(mainWindowLabel: string){
    return `${mainWindowLabel}${toolbarWindowLabelSuffix}`
}
export function generateContextMenuWindowLabel(mainWindowLabel: string){
    return `${mainWindowLabel}${contextMenuWindowLabelSuffix}`
}

export function getMainWindowLabel(){
    if(currentWindowLabel.endsWith(toolbarWindowLabelSuffix)){
        let index = currentWindowLabel.indexOf(toolbarWindowLabelSuffix);
        return appWindow.label.substring(0, index);
    }else if(currentWindowLabel.endsWith(contextMenuWindowLabelSuffix)){
        let index = currentWindowLabel.indexOf(contextMenuWindowLabelSuffix);
        return appWindow.label.substring(0, index);
    }else {
        return appWindow.label;
    }
}