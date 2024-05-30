import {Group, Leafer, Rect} from "leafer-ui";
import {UndoRedoStack} from "./ui-container.ts";
import {AbstractAnnotationTool} from "./tools/abstract-annotation-tool.ts";
import {EllipseTool} from "./tools/ellipse-tool.ts";
import {RectangleTool} from "./tools/rectangle-tool.ts";
import {StraightLineTool} from "./tools/straight-line-tool.ts";
import {FreeCurveTool} from "./tools/free-curve-tool.ts";
import {MarkerPenTool} from "./tools/marker-pen-tool.ts";
import {NumberTool} from "./tools/number-tool.ts";
import {ArrowTool} from "./tools/arrow-tool.ts";

function disableDragRegion() {
    const element = document.getElementById('drag-region');
    (element as HTMLDivElement).style.display = "none";
}

function enableDragRegion() {
    const element = document.getElementById('drag-region');
    (element as HTMLDivElement).style.display = "absolute";
}

function getTouchpad() {
    let element = document.getElementById('touchpad');
    if (element == null) {
        throw new Error('HTMLElement whose id="touchpad" not found');
    }
    return element;
}

export interface ImageInfo {
    dataURL: string,
    width: number,
    height: number
}

interface ZoomEvent {
    width: number,
    height: number
}

type ZoomEventListener = (zoomEvent: ZoomEvent) => void;

export class Editor {
    private readonly leafer: Leafer;
    private readonly background: Group;
    private readonly undoRedoStack: UndoRedoStack;
    private editing: boolean;
    private readonly annotationTools: Map<string, AbstractAnnotationTool>;
    private currentActiveAnnotationTool: AbstractAnnotationTool | null;
    private readonly zoomEventListeners: Set<ZoomEventListener>;

    constructor() {
        this.leafer = new Leafer({
            view: window, type: 'draw'
        });

        this.background = new Group();
        this.leafer.add(this.background);

        const annotations = new Group();
        this.leafer.add(annotations);
        this.undoRedoStack = new UndoRedoStack(annotations);

        this.editing = false;

        this.annotationTools = new Map<string, AbstractAnnotationTool>();
        this.currentActiveAnnotationTool = null;

        this.registerAnnotationTool(new RectangleTool(this.undoRedoStack, getTouchpad()));
        this.registerAnnotationTool(new EllipseTool(this.undoRedoStack, getTouchpad()));
        this.registerAnnotationTool(new StraightLineTool(this.undoRedoStack, getTouchpad()));
        this.registerAnnotationTool(new FreeCurveTool(this.undoRedoStack, getTouchpad()));
        this.registerAnnotationTool(new MarkerPenTool(this.undoRedoStack, getTouchpad()));
        this.registerAnnotationTool(new NumberTool(this.undoRedoStack, getTouchpad()));
        this.registerAnnotationTool(new ArrowTool(this.undoRedoStack, getTouchpad()));

        this.zoomEventListeners = new Set<ZoomEventListener>();
    }

    open(image: ImageInfo) {
        const backgroundRect = new Rect({
            width: image.width, height: image.height, fill: {
                type: 'image', url: image.dataURL,
            }
        });
        this.background.add(backgroundRect);

        getTouchpad().addEventListener('wheel', (event) => {
            if(!this.editing){
                // 以窗口中心为原点进行缩放
                const center = {
                    x: window.innerWidth / 2, y: window.innerHeight / 2
                }
                if (event.deltaY < 0) {
                    this.leafer.scaleOfWorld(center, 1.1);
                } else {
                    this.leafer.scaleOfWorld(center, 0.9);
                }
                // 缩放后移动画布左上角的位置到窗口的(0,0)，同时调整视口的大小，从而使得之前放大后被遮掩的内容显示出来
                this.leafer.x = 0;
                this.leafer.y = 0;
                this.leafer.width = this.leafer.worldBoxBounds.width;
                this.leafer.height = this.leafer.worldBoxBounds.height;
                this.zoomEventListeners.forEach(listener => {
                    listener({
                        width: this.leafer.worldBoxBounds.width, height: this.leafer.worldBoxBounds.height
                    });
                });
            }
        });
    }

    exportPngImage(){
        return this.leafer.export('png', { screenshot: true, pixelRatio: 2 });
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
        if(tool == null){
            throw new Error(`A tool with name "${toolName}" not found`)
        }
        if(this.currentActiveAnnotationTool != null){
            this.currentActiveAnnotationTool.deactive();
        }
        this.currentActiveAnnotationTool = tool;
        this.currentActiveAnnotationTool.active();
        this.editing = true;
        disableDragRegion();
    }

    exitEditMode(){
        if(this.currentActiveAnnotationTool != null){
            this.currentActiveAnnotationTool.deactive();
            this.currentActiveAnnotationTool = null;
        }
        this.editing = false;
        enableDragRegion();
    }

    addZoomEventListener(listener: ZoomEventListener) {
        this.zoomEventListeners.add(listener);
    }

    undo() {
        this.undoRedoStack.undoAdd();
    }

    redo() {
        this.undoRedoStack.redoAdd();
    }
}