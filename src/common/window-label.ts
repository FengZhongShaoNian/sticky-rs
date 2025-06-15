import {getCurrentWebviewWindow} from "@tauri-apps/api/webviewWindow";
const appWindow = getCurrentWebviewWindow()

// 窗口label命名规则：
// 1. 主窗口的label的命名规则是：`^main-[0-9]+$`
// 2. 工具条窗口的label的命名规则是：`^main-[0-9]+-toolbar$`
// 3. 工具条窗口的webview的label的命名规则是：`^main-[0-9]+-toolbar-webview$`

const currentWindowLabel = appWindow.label;

const toolbarWindowLabelSuffix = '-toolbar';
const toolbarWindowWebviewLabelSuffix = '-toolbar-webview';

export function generateToolbarWindowLabel(mainWindowLabel: string){
    return `${mainWindowLabel}${toolbarWindowLabelSuffix}`
}

export function generateToolbarWindowWebviewLabel(mainWindowLabel: string){
    return `${mainWindowLabel}${toolbarWindowWebviewLabelSuffix}`
}

export function getMainWindowLabel(){
    if(currentWindowLabel.endsWith(toolbarWindowLabelSuffix)){
        let index = currentWindowLabel.indexOf(toolbarWindowLabelSuffix);
        return appWindow.label.substring(0, index);
    }else if(currentWindowLabel.endsWith(toolbarWindowWebviewLabelSuffix)){
        let index = currentWindowLabel.indexOf(toolbarWindowWebviewLabelSuffix);
        return appWindow.label.substring(0, index);
    }else {
        return appWindow.label;
    }
}