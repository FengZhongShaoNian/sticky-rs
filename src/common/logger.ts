import {info as _info, debug as _debug, error as _error,  trace as _trace} from "@tauri-apps/plugin-log";

import { getCurrentWebviewWindow } from "@tauri-apps/api/webviewWindow";
const appWindow = getCurrentWebviewWindow()

const label = appWindow.label;
export default {
    async info(message: string){
        return await _info(`[${label}]: ${message}`);
    },

    async debug(message: string){
        return await _debug(`[${label}]: ${message}`);
    },

    async error(message: string){
        return await _error(`[${label}]: ${message}`);
    },

    async trace(message: string){
        return await _trace(`[${label}]: ${message}`);
    }
}