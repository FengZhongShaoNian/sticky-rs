import {invoke} from "@tauri-apps/api/core";
import logger from "../../common/logger.ts";

export async function getScaleFactor(){
    let scaleFactor = await invoke<number>('get_scale_factor', {});
    await logger.info(`scaleFactor：${scaleFactor}`);
    return scaleFactor;
}