import {Group, Leafer, Rect} from "leafer-ui";
import {UndoRedoStack} from "./ui-container.ts";
import {AbstractAnnotationTool} from "./tools/abstract-annotation-tool.ts";
import {EllipseTool} from "./tools/ellipse-tool.ts";

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
    private undoRedoStack: UndoRedoStack;
    private editing: boolean;
    private annotationTool: AbstractAnnotationTool;
    private zoomEventListeners: Set<ZoomEventListener> = new Set<ZoomEventListener>();

    constructor() {
        this.leafer = new Leafer({
            view: window, type: 'draw'
        });

        const group = new Group();
        this.leafer.add(group);
        this.undoRedoStack = new UndoRedoStack(group);

        this.editing = false;
        this.annotationTool = new EllipseTool(this.undoRedoStack, getTouchpad());
    }

    open(image: ImageInfo) {
        const backgroundRect = new Rect({
            width: image.width, height: image.height, fill: {
                type: 'image', url: image.dataURL,
            }
        });
        this.leafer.add(backgroundRect);

        this.editing = true;
        disableDragRegion();
        // this.annotationTool.active();

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

    isEditing(): boolean {
        return this.editing;
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