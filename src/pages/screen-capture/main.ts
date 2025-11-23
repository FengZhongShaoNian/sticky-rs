import {invoke} from "@tauri-apps/api/core";
import {getCurrentWindow} from "@tauri-apps/api/window";
import logger from "../../common/logger.ts";
import {getScaleFactor} from "../../common/scale-factor.ts";

const appWindow = getCurrentWindow();

interface ImageContent {
    mimeType: string,
    data: ArrayBuffer,
    size: {
        width: number,
        height: number
    },
}
async function delay(timeout: number){
    return new Promise(resolve => {
        setTimeout(resolve, timeout);
    });
}
async function openImage(image: ImageContent){
    try{
        await invoke<void>('open_image', {
            image
        });
    }catch (e) {
        await logger.error(`Failed to open image: ${JSON.stringify(e)}`);
    }
}

async function captureRegion(x: number, y: number, width: number, height: number){
    const scaleFactor = await getScaleFactor();
    await appWindow.hide();
    await delay(300);
    const scaledX = scaleFactor * x;
    const scaledY = scaleFactor * y;
    const scaledWidth = scaleFactor * width;
    const scaledHeight = scaleFactor * height;
    const image = await invoke<ImageContent>('capture_region', {
        x: Math.round(scaledX),
        y: Math.round(scaledY),
        width: Math.round(scaledWidth),
        height: Math.round(scaledHeight)
    });
    await logger.trace("截图成功: " + JSON.stringify(image));
    await openImage(image);
    await appWindow.close();
}

// 区域选择相关变量
let isSelecting = false;
let startX: number, startY: number, endX: number, endY: number;
const transparentArea = document.getElementById('transparentArea');
const screenCaptureTip = document.getElementById('screenCaptureTip');

// 开始选择函数
function startSelection() {
    isSelecting = true;

    // 添加事件监听器
    document.addEventListener('mousedown', onMouseDown);
    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
}

// 停止选择函数
function stopSelection() {
    isSelecting = false;

    // 移除事件监听器
    document.removeEventListener('mousedown', onMouseDown);
    document.removeEventListener('mousemove', onMouseMove);
    document.removeEventListener('mouseup', onMouseUp);

    const x = Math.min(startX, endX);
    const y = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);
    captureRegion(x, y, width, height);
}

// 鼠标按下事件处理
function onMouseDown(e: MouseEvent) {
    startX = e.clientX;
    startY = e.clientY;

    // 显示透明区域
    transparentArea!.style.display = 'block';
    transparentArea!.style.left = startX + 'px';
    transparentArea!.style.top = startY + 'px';
    transparentArea!.style.width = '0px';
    transparentArea!.style.height = '0px';

    // 隐藏提示信息
    screenCaptureTip!.style.display='none';
}

// 鼠标移动事件处理
function onMouseMove(e: MouseEvent) {
    if (!isSelecting || startX === undefined) return;

    endX = e.clientX;
    endY = e.clientY;

    // 计算选择区域的位置和尺寸
    const left = Math.min(startX, endX);
    const top = Math.min(startY, endY);
    const width = Math.abs(endX - startX);
    const height = Math.abs(endY - startY);

    // 更新透明区域显示
    transparentArea!.style.left = left + 'px';
    transparentArea!.style.top = top + 'px';
    transparentArea!.style.width = width + 'px';
    transparentArea!.style.height = height + 'px';
}

// 鼠标松开事件处理
function onMouseUp(e: MouseEvent) {
    if (!isSelecting || startX === undefined) return;

    endX = e.clientX;
    endY = e.clientY;

    // 确保结束坐标有效
    if (Math.abs(endX - startX) > 20 && Math.abs(endY - startY) > 20) {
        stopSelection();
    } else {
        // 如果区域太小，视为无效选择
        transparentArea!.style.display = 'none';
        screenCaptureTip!.style.display='flex';
    }
}

// 按下Esc键退出截图
document.addEventListener('keydown', (event)=>{
    if (event.code === 'Escape'){
        appWindow.close();
    }
})

startSelection();