import {AbstractAnnotationTool} from "./tools/abstract-annotation-tool.ts";
import {EllipseTool} from "./tools/ellipse-tool.ts";
import {GraphContainer, Graph, Renderer, TypedObservable} from "./graphs/graph.ts";
import {Image} from "./graphs/image.ts";
import {RectangleTool} from "./tools/rectangle-tool.ts";
import {StraightLineTool} from "./tools/straight-line-tool.ts";
import {FreeCurveTool} from "./tools/free-curve-tool.ts";
import {MarkerPenTool} from "./tools/marker-pen-tool.ts";
import {NumberTool} from "./tools/number-tool.ts";
import {ArrowTool} from "./tools/arrow-tool.ts";

function getDragRegion(){
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

function getCanvas() {
    let element = document.getElementById('canvas');
    if (element == null) {
        throw new Error('HTMLElement whose id="canvas" not found');
    }
    return element as HTMLCanvasElement;
}

let zoomTipsTimeout: NodeJS.Timeout | null = null;
function showZoomTips(tips: string, duration: number){
    let element = document.getElementById("zoom-tip");
    if(element == null){
        throw new Error('HTMLElement whose id="zoom-tip" not found');
    }
    element.innerText = tips;
    element.style.display='block';
    if(zoomTipsTimeout){
        clearTimeout(zoomTipsTimeout);
    }
    zoomTipsTimeout = setTimeout(()=>{
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
    private canvas: HTMLCanvasElement;
    private readonly ctx: CanvasRenderingContext2D;
    private readonly backgroundImage: HTMLImageElement;
    private readonly annotationContainer: GraphContainer;
    private readonly backgroundImageWidth: number;
    private readonly backgroundImageHeight: number;
    private readonly backgroundImageGraph: Image;

    // 缩放比例
    private scalingRatio: number;

    constructor(canvas: HTMLCanvasElement, background: HTMLImageElement, annotationContainer: GraphContainer) {
        this.canvas = canvas;

        const ctx = this.canvas.getContext("2d");
        if(ctx == null){
            throw new Error('Failed to get context2d from canvas');
        }
        this.ctx = ctx;
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
        this.resizeCanvas(this.backgroundImageWidth, this.backgroundImageHeight);

        // 按 devicePixelRatio 缩放所有绘图操作
        this.ctx.scale(devicePixelRatio, devicePixelRatio);

        // 获取画布的大小（以 CSS 像素为单位）。
        const rect = this.canvas.getBoundingClientRect();
        this.backgroundImageGraph = new Image({
            x: 0,
            y: 0,
            width: rect.width,
            height: rect.height,
            imageSource: this.backgroundImage
        });
    }

    render(graph: Graph): void {
        this.annotationContainer.add(graph);
        this.renderAll();
    }

    renderAll(){
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

        this.backgroundImageGraph.render(this.ctx);

        for (let graph of this.annotationContainer) {
            graph.render(this.ctx);
        }
    }

    exportImageToDataURL(type?: string | undefined, quality?: any){
        this.renderAll();
        return this.canvas.toDataURL(type, quality);
    }

    update(_observable: TypedObservable): void {
        // 暂时先每次都全部渲染
       this.renderAll();
    }

    zoom(type: ZoomType): ZoomResult{
        const step = 0.1;
        let newScalingRationForGraph;
        if(type === ZoomType.IN){
            this.scalingRatio += step;
            newScalingRationForGraph =  this.scalingRatio / (this.scalingRatio - step);
        }else {
            this.scalingRatio -= step;
            newScalingRationForGraph = this.scalingRatio / (this.scalingRatio + step);
        }
        console.log(`画布即将缩放到${this.scalingRatio * 100}%`);

        const newWidth = this.backgroundImageWidth * this.scalingRatio;
        const newHeight = this.backgroundImageHeight * this.scalingRatio;

        this.resizeCanvas(newWidth, newHeight);

        this.backgroundImageGraph.scale(newScalingRationForGraph);
        for (let graph of this.annotationContainer) {
            graph.scale(newScalingRationForGraph);
        }

        // 按 devicePixelRatio 缩放所有绘图操作
        this.ctx.scale(devicePixelRatio, devicePixelRatio);

        // 重新渲染
        this.renderAll();

        showZoomTips(`${(this.scalingRatio*100).toFixed(0)}%`, 1000);

        return {
            width: newWidth,
            height: newHeight
        }
    }

    private resizeCanvas(newWidth: number, newHeight: number){
        console.log('开始调整画布大小')
        // 获取设备像素比
        const devicePixelRatio = window.devicePixelRatio || 1;

        console.log('设备的像素比：%d', devicePixelRatio);

        // canvas.width和canvas.height设置的是Canvas元素的内部渲染缓冲区的逻辑像素尺寸
        this.canvas.width = newWidth * devicePixelRatio;
        this.canvas.height = newHeight * devicePixelRatio;

        console.log(`调整后画布的逻辑宽度：${this.canvas.width}，逻辑高度：${this.canvas.height}`);

        this.canvas.style.width = `${newWidth}px`;
        this.canvas.style.height = `${newHeight}px`;

        console.log(`调整后画布的物理宽度：${this.canvas.style.width}，物理高度：${this.canvas.style.height}`);
        console.log(`调整后画布的BoundingClientRect`, this.canvas.getBoundingClientRect());
    }

}

export class Editor {
    private readonly canvas: HTMLCanvasElement;
    private renderer?: CanvasRenderer;
    private editing: boolean;
    private readonly annotationTools: Map<string, AbstractAnnotationTool>;
    private currentActiveAnnotationTool?: AbstractAnnotationTool;
    private annotationContainer?: GraphContainer;
    private readonly zoomEventListeners: Set<ZoomEventListener>;

    constructor() {
        this.canvas = getCanvas();
        this.editing = false;
        this.annotationTools = new Map<string, AbstractAnnotationTool>();
        this.zoomEventListeners = new Set<ZoomEventListener>();
    }

    open(image: HTMLImageElement) {
        console.log('进入Editor.open方法, image:', image)

        this.annotationContainer = new GraphContainer();

        this.registerAnnotationTool(new RectangleTool(this.annotationContainer, this.canvas));
        this.registerAnnotationTool(new EllipseTool(this.annotationContainer, this.canvas));
        this.registerAnnotationTool(new StraightLineTool(this.annotationContainer, this.canvas));
        this.registerAnnotationTool(new FreeCurveTool(this.annotationContainer, this.canvas));
        this.registerAnnotationTool(new MarkerPenTool(this.annotationContainer, this.canvas));
        this.registerAnnotationTool(new NumberTool(this.annotationContainer, this.canvas));
        this.registerAnnotationTool(new ArrowTool(this.annotationContainer, this.canvas));

        this.renderer = new CanvasRenderer(this.canvas, image, this.annotationContainer);
        this.renderer.renderAll();

        getDragRegion().addEventListener('wheel', (event) => {
            if(!this.editing && this.renderer){
                const zoomType = (event.deltaY < 0)? ZoomType.IN : ZoomType.OUT;
                const result = this.renderer.zoom(zoomType);
                console.log('zoomResult:', result);
                this.zoomEventListeners.forEach(callback => callback(result));
            }
        });
    }

    exportPngImage(){
        return this.renderer?.exportImageToDataURL('image/png', 1);
    }

    isEditing(): boolean {
        return this.editing;
    }

    registerAnnotationTool(tool: AbstractAnnotationTool){
        const toolName = tool.name();
        if(this.annotationTools.has(toolName)){
            throw new Error(`A tool with the same name "${toolName}" already exists`)
        }
        this.annotationTools.set(tool.name(), tool);
    }

    activeTool(toolName: string){
        let tool = this.annotationTools.get(toolName);
        if(!tool){
            throw new Error(`A tool with name "${toolName}" not found`)
        }
        if(this.currentActiveAnnotationTool){
            this.currentActiveAnnotationTool.deactive();
        }
        this.currentActiveAnnotationTool = tool;
        this.currentActiveAnnotationTool.active();
        this.editing = true;
        disableDragRegion();
    }

    exitEditMode(){
        if(this.currentActiveAnnotationTool){
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