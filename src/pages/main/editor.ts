import {App, Group, Rect} from "leafer-ui";
import {UndoRedoStack} from "./ui-container.ts";
import {RectangleTool} from "./tools/rectangle-tool.ts";
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

export class Editor {
    private readonly app: App;
    private undoRedoStack: UndoRedoStack;
    private editing: boolean;
    private annotationTool: AbstractAnnotationTool;

    constructor() {
        this.app = new App({
            view: window,
            ground: {type: 'draw'},
            tree: {},
            sky: {type: 'draw'}
        });

        const group = new Group();
        this.app.sky.add(group);
        this.undoRedoStack = new UndoRedoStack(group);

        this.editing = false;
        this.annotationTool = new EllipseTool(this.undoRedoStack, getTouchpad());
    }

    open(image: ImageInfo) {
        const backgroundRect = new Rect({
            width: image.width,
            height: image.height,
            fill: {
                type: 'image',
                url: image.dataURL,
            }
        });
        this.app.ground.add(backgroundRect);

        this.editing = true;
        disableDragRegion();
        this.annotationTool.active();
    }

    isEditing(): boolean {
        return this.editing;
    }

    undo(){
        this.undoRedoStack.undoAdd();
    }

    redo(){
        this.undoRedoStack.redoAdd();
    }
}