import { AbstractAnnotationTool } from "./tools/abstract-annotation-tool.ts";
import { EllipseTool } from "./tools/ellipse-tool.ts";
import { GraphContainer, Graph, Renderer, TypedObservable } from "./graphs/graph.ts";
import { Image } from "./graphs/image.ts";
import { RectangleTool } from "./tools/rectangle-tool.ts";
import { StraightLineTool } from "./tools/straight-line-tool.ts";
import { FreeCurveTool } from "./tools/free-curve-tool.ts";
import { MarkerPenTool } from "./tools/marker-pen-tool.ts";
import { NumberTool } from "./tools/number-tool.ts";
import { ArrowTool } from "./tools/arrow-tool.ts";
import { EraserTool } from "./tools/eraser-tool.ts";
import { MosaicTool } from "./tools/mosaic-tool.ts";
import { GaussianBlurTool } from "./tools/gaussian-blur-tool.ts";
import { TextTool } from "./tools/text-tool.ts";
import { resolve } from "path";

function getDragRegion() {
    const element = document.getElementById('drag-region');
    if (element == null) {
        throw new Error('HTMLElement whose id="drag-region" not found');
    }
    return (element as HTMLDivElement);
}
function disableDragRegion() {
    console.log('disable drag region');
    const element = getDragRegion();
    console.log('drag-region element', element);
    element.style.display = "none";
}

function enableDragRegion() {
    console.log('enable drag region');
    const element = getDragRegion();
    console.log('drag-region element', element);
    element.removeAttribute("style");
}

function getCanvas(canvasId: string) {
    let element = document.getElementById(canvasId);
    if (element == null) {
        throw new Error('HTMLElement whose id="canvas" not found');
    }
    return element as HTMLCanvasElement;
}

let zoomTipsTimeout: NodeJS.Timeout | null = null;
function showZoomTips(tips: string, duration: number) {
    let element = document.getElementById("zoom-tip");
    if (element == null) {
        throw new Error('HTMLElement whose id="zoom-tip" not found');
    }
    element.innerText = tips;
    element.style.display = 'block';
    if (zoomTipsTimeout) {
        clearTimeout(zoomTipsTimeout);
    }
    zoomTipsTimeout = setTimeout(() => {
        element.removeAttribute('style');
    }, duration);
}

interface ZoomResult {
    width: number,
    height: number
}

type ZoomEventListener = (zoomEvent: ZoomResult) => void;

enum ZoomType {
    // 放大
    IN,

    // 缩小
    OUT
}

class CanvasRenderer implements Renderer {
    // 用于绘制背景
    private backgroundCanvas: HTMLCanvasElement;
    private readonly backgroundCtx: CanvasRenderingContext2D;

    // 用于绘制标注
    private annotationCanvas: HTMLCanvasElement;
    private readonly annotationCtx: CanvasRenderingContext2D;

    // 用于导出渲染结果
    private mergeCanvas: HTMLCanvasElement;
    private readonly mergeCtx: CanvasRenderingContext2D;

    private readonly backgroundImage: HTMLImageElement;
    private readonly annotationContainer: GraphContainer;
    private readonly backgroundImageWidth: number;
    private readonly backgroundImageHeight: number;
    private readonly backgroundImageGraph: Image;

    // 缩放比例
    private scalingRatio: number;

    requireContext(canvas: HTMLCanvasElement) {
        const ctx = canvas.getContext("2d");
        if (ctx == null) {
            throw new Error('Failed to get context2d from canvas');
        }
        return ctx;
    }

    constructor(backgroundCanvas: HTMLCanvasElement,
        annotationCanvas: HTMLCanvasElement,
        mergeCanvas: HTMLCanvasElement,
        background: HTMLImageElement,
        annotationContainer: GraphContainer) {
        this.backgroundCanvas = backgroundCanvas;
        this.annotationCanvas = annotationCanvas;
        this.mergeCanvas = mergeCanvas;

        this.backgroundCtx = this.requireContext(backgroundCanvas);
        this.annotationCtx = this.requireContext(annotationCanvas);
        this.mergeCtx = this.requireContext(mergeCanvas);

        this.backgroundImage = background;
        this.annotationContainer = annotationContainer;
        this.annotationContainer.addObserver(this);

        // 获取设备像素比
        const devicePixelRatio = window.devicePixelRatio || 1;

        // 在高分辨率的屏幕上，缩小图片尺寸以避免图片模糊
        this.backgroundImageWidth = background.width / devicePixelRatio;
        this.backgroundImageHeight = background.height / devicePixelRatio;

        console.log(`按照设备像素比进行调整后，图片的宽度是：${this.backgroundImageWidth}，图片的高度是：${this.backgroundImageHeight}`);

        this.scalingRatio = 1; // 无缩放

        // 调整画布尺寸
        this.resizeAllCanvas(this.backgroundImageWidth, this.backgroundImageHeight);

        // 按 devicePixelRatio 缩放所有绘图操作
        this.scaleAllContextsWithDevicePixelRatio(devicePixelRatio);

        // 获取画布的大小（以 CSS 像素为单位）。
        const rect = this.backgroundCanvas.getBoundingClientRect();
        this.backgroundImageGraph = new Image({
            x: 0,
            y: 0,
            width: rect.width,
            height: rect.height,
            imageSource: this.backgroundImage
        });
    }

    private scaleAllContextsWithDevicePixelRatio(devicePixelRatio: number) {
        this.backgroundCtx.scale(devicePixelRatio, devicePixelRatio);
        this.annotationCtx.scale(devicePixelRatio, devicePixelRatio);
        this.mergeCtx.scale(devicePixelRatio, devicePixelRatio);
    }

    render(graph: Graph): void {
        this.annotationContainer.add(graph);
        this.renderAnnotations();
    }

    renderBackground() {
        this.backgroundCtx.clearRect(0, 0, this.backgroundCanvas.width, this.backgroundCanvas.height);
        this.backgroundImageGraph.render(this.backgroundCtx);
    }

    renderAnnotations(force?: boolean) {
        this.annotationCtx.clearRect(0, 0, this.annotationCanvas.width, this.annotationCanvas.height);
        for (let graph of this.annotationContainer) {
            if (graph.backgroundImageAware) {
                const getImageData = (x: number, y: number, width: number, height: number) => {
                    console.log(`试图提取(x: ${x}, y: ${y}, width: ${width}, height: ${height})的背景图像`);
                    const devicePixelRatio = window.devicePixelRatio || 1;
                    const scaledX = x * devicePixelRatio;
                    const scaledY = y * devicePixelRatio;
                    const scaledWidth = width * devicePixelRatio;
                    const scaledHeight = height * devicePixelRatio;
                    console.log(`根据设备像素比进行换算后，提取(x: ${scaledX}, y: ${scaledY}, width: ${scaledWidth}, height: ${scaledHeight})的背景图像`);
                    return this.backgroundCtx.getImageData(scaledX, scaledY, scaledWidth, scaledHeight);
                }
                graph.backgroundImageAware({ getImageData: getImageData });
            }
            graph.render(this.annotationCtx, force);
        }
    }

    renderAll(force?: boolean) {
        this.renderBackground();
        this.renderAnnotations(force);
    }

    exportImageToDataURL(type?: string | undefined, quality?: any) {
        this.renderAll(true);

        const rect = this.mergeCanvas.getBoundingClientRect();
        this.mergeCtx.clearRect(0, 0, this.mergeCanvas.width, this.mergeCanvas.height);
        this.mergeCtx.drawImage(this.backgroundCanvas, 0, 0, rect.width, rect.height);
        this.mergeCtx.drawImage(this.annotationCanvas, 0, 0, rect.width, rect.height);

        return this.mergeCanvas.toDataURL(type, quality);
    }

    async exportImage(type?: string | undefined, quality?: any): Promise<Blob> {
        this.renderAll(true);

        const rect = this.mergeCanvas.getBoundingClientRect();
        this.mergeCtx.clearRect(0, 0, this.mergeCanvas.width, this.mergeCanvas.height);
        this.mergeCtx.drawImage(this.backgroundCanvas, 0, 0, rect.width, rect.height);
        this.mergeCtx.drawImage(this.annotationCanvas, 0, 0, rect.width, rect.height);

        return new Promise((resolve, reject) => {
            this.mergeCanvas.toBlob((blob) => {
                if(blob){
                    resolve(blob);
                }else{
                    reject(new Error('将画布中的图片转成Blob失败'));
                }
            }, type, quality);
        })

    }

    update(_observable: TypedObservable): void {
        this.renderAnnotations();
    }

    zoom(type: ZoomType): ZoomResult {
        const step = 0.1;
        let newScalingRationForGraph;
        if (type === ZoomType.IN) {
            this.scalingRatio += step;
            newScalingRationForGraph = this.scalingRatio / (this.scalingRatio - step);
        } else {
            this.scalingRatio -= step;
            newScalingRationForGraph = this.scalingRatio / (this.scalingRatio + step);
        }
        console.log(`画布即将缩放到${this.scalingRatio * 100}%`);

        const newWidth = this.backgroundImageWidth * this.scalingRatio;
        const newHeight = this.backgroundImageHeight * this.scalingRatio;

        this.resizeAllCanvas(newWidth, newHeight);

        this.backgroundImageGraph.scale(newScalingRationForGraph);
        for (let graph of this.annotationContainer) {
            graph.scale(newScalingRationForGraph);
        }

        // 按 devicePixelRatio 缩放所有绘图操作
        this.scaleAllContextsWithDevicePixelRatio(devicePixelRatio);

        // 重新渲染
        this.renderAll();

        showZoomTips(`${(this.scalingRatio * 100).toFixed(0)}%`, 1000);

        return {
            width: newWidth,
            height: newHeight
        }
    }

    /**
     * 调整画布的大小
     *
     * @param newWidth 画布的物理尺寸（画布的CSS尺寸）
     * @param newHeight 画布的物理尺寸（画布的CSS尺寸）
     */
    private resizeAllCanvas(newWidth: number, newHeight: number) {
        this.resizeCanvas(this.backgroundCanvas, newWidth, newHeight);
        this.resizeCanvas(this.annotationCanvas, newWidth, newHeight);
        this.resizeCanvas(this.mergeCanvas, newWidth, newHeight);
    }

    private resizeCanvas(canvas: HTMLCanvasElement, newWidth: number, newHeight: number) {
        console.log(`开始调整画布${canvas.id}的大小`)
        // 获取设备像素比
        const devicePixelRatio = window.devicePixelRatio || 1;

        console.log('设备的像素比：%d', devicePixelRatio);

        // canvas.width和canvas.height设置的是Canvas元素的内部渲染缓冲区的逻辑像素尺寸
        canvas.width = newWidth * devicePixelRatio;
        canvas.height = newHeight * devicePixelRatio;

        console.log(`调整后画布的逻辑宽度：${canvas.width}，逻辑高度：${canvas.height}`);

        canvas.style.width = `${newWidth}px`;
        canvas.style.height = `${newHeight}px`;

        console.log(`调整后画布的物理宽度：${canvas.style.width}，物理高度：${canvas.style.height}`);
        console.log(`调整后画布的BoundingClientRect`, canvas.getBoundingClientRect());
    }

}

export class Editor {
    private readonly backgroundCanvas: HTMLCanvasElement;
    private readonly annotationCanvas: HTMLCanvasElement;
    private readonly mergeCanvas: HTMLCanvasElement;
    private renderer?: CanvasRenderer;
    private editing: boolean;
    private readonly annotationTools: Map<string, AbstractAnnotationTool>;
    private currentActiveAnnotationTool?: AbstractAnnotationTool;
    private annotationContainer?: GraphContainer;
    private readonly zoomEventListeners: Set<ZoomEventListener>;

    constructor() {
        this.backgroundCanvas = getCanvas("background-canvas")
        this.annotationCanvas = getCanvas("annotation-canvas");
        this.mergeCanvas = getCanvas("merge-canvas");
        this.editing = false;
        this.annotationTools = new Map<string, AbstractAnnotationTool>();
        this.zoomEventListeners = new Set<ZoomEventListener>();
    }

    open(image: HTMLImageElement) {
        console.log('进入Editor.open方法, image:', image)

        this.annotationContainer = new GraphContainer();

        this.registerAnnotationTool(new RectangleTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new EllipseTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new StraightLineTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new FreeCurveTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new MarkerPenTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new NumberTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new ArrowTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new EraserTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new MosaicTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new GaussianBlurTool(this.annotationContainer, this.annotationCanvas));
        this.registerAnnotationTool(new TextTool(this.annotationContainer, this.annotationCanvas));

        this.renderer = new CanvasRenderer(this.backgroundCanvas, this.annotationCanvas, this.mergeCanvas, image, this.annotationContainer);
        this.renderer.renderBackground();

        getDragRegion().addEventListener('wheel', (event) => {
            if (!this.editing && this.renderer) {
                const zoomType = (event.deltaY < 0) ? ZoomType.IN : ZoomType.OUT;
                const result = this.renderer.zoom(zoomType);
                console.log('zoomResult:', result);
                this.zoomEventListeners.forEach(callback => callback(result));
            }
        });
    }

    exportPngImageToDataURL() {
        return this.renderer?.exportImageToDataURL('image/png', 1);
    }

    async exportPngImage(): Promise<Blob> {
        return new Promise((resolve, reject)=>{
            if(!this.renderer){
                reject(new Error('rederer is undefined'));
            }else{
                this.renderer.exportImage('image/png', 1)
                .then(resolve)
                .catch(reject);
            }
        });
    }

    isEditing(): boolean {
        return this.editing;
    }

    registerAnnotationTool(tool: AbstractAnnotationTool) {
        const toolName = tool.name();
        if (this.annotationTools.has(toolName)) {
            throw new Error(`A tool with the same name "${toolName}" already exists`)
        }
        this.annotationTools.set(tool.name(), tool);
    }

    activeTool(toolName: string) {
        let tool = this.annotationTools.get(toolName);
        if (!tool) {
            throw new Error(`A tool with name "${toolName}" not found`)
        }
        if (this.currentActiveAnnotationTool) {
            this.currentActiveAnnotationTool.deactive();
        }
        this.currentActiveAnnotationTool = tool;
        this.currentActiveAnnotationTool.active();
        this.editing = true;
        disableDragRegion();
    }

    exitEditMode() {
        if (this.currentActiveAnnotationTool) {
            this.currentActiveAnnotationTool.deactive();
            this.currentActiveAnnotationTool = undefined;
        }
        this.editing = false;
        enableDragRegion();
    }

    addZoomEventListener(listener: ZoomEventListener) {
        this.zoomEventListeners.add(listener);
    }

    undo() {
        this.annotationContainer?.undoAdd();
    }

    redo() {
        this.annotationContainer?.redoAdd();
    }
}