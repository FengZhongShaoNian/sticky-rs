import {emit, Event, listen} from '@tauri-apps/api/event';
import {appWindow, PhysicalSize} from "@tauri-apps/api/window";
import { invoke } from '@tauri-apps/api/tauri';
import { info } from "tauri-plugin-log-api";
import { Editor } from "./editor.ts";

let editor: Editor | null;

document.addEventListener("DOMContentLoaded", function() {
    info('DOMContentLoaded').catch(console.error);
    // 页面DOM加载完成
    emit('page-loaded', {
        send_from: appWindow.label,
    }).then(()=>info('pageLoaded event sent'));
});

listen<string>('open-image', (event: Event<string>) => {
    const image_path = event.payload;
    invoke<string>('read_image', {
        path: image_path
    }).then(base64Image => {
        let img = new Image();
        img.src = base64Image;
        img.onload = function() {
            let physicalSize = new PhysicalSize(img.width, img.height);
            appWindow.scaleFactor().then(factor => {
                let logicalSize = physicalSize.toLogical(factor);
                editor = new Editor(base64Image, logicalSize.width, logicalSize.height);
            });
        };
    });
}).then(_unlistenFn => {
});


