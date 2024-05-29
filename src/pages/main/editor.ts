import {App, Rect} from "leafer-ui";
import {UI} from "@leafer-ui/display";
import {CircleNumber, CrossHair, Cursor} from "./cursor.ts";

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
    private editing: boolean;
    private annotationTool: AnnotationTool;

    constructor() {
        this.app = new App({
            view: window,
            ground: {type: 'draw'},
            tree: {},
            sky: {type: 'draw'}
        });

        this.editing = false;
        this.annotationTool = new RectangleTool(this.app, getTouchpad());
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
}

interface StyleContext {
    strokeWidth: number,
    strokeColor: string,
    // fontName: string,
    // fontSize: number,
}

type MouseEventListener = (event: MouseEvent) => void;
type WheelEventListener = (event: WheelEvent) => void;
export abstract class AnnotationTool {
    private readonly app: App;
    // 触摸板，一个大小与窗口等同的HTML元素，用于感知鼠标事件
    protected readonly touchpad: HTMLElement;

    private mouseDownEventListener: MouseEventListener | null = null;
    private mouseMoveEventListener: MouseEventListener | null = null;
    private mouseUpEventListener: MouseEventListener | null = null;
    private mouseOutEventListener: MouseEventListener | null = null;
    private wheelEventListener: WheelEventListener | null = null;

    protected styleContext: StyleContext;

    protected constructor(app: App, touchpad: HTMLElement) {
        this.app = app;
        this.touchpad = touchpad;

        this.styleContext = {
            strokeWidth: 1,
            strokeColor: 'red',
            // fontName: '',
            // fontSize: 1,
        }
    }

    /**
     * 每一个标注工具都要有独一无二的名称
     */
    abstract name(): string;

    abstract onMouseDown(mouseDownEvent: MouseEvent): void;

    abstract onMouseMove(mouseMoveEvent: MouseEvent): void;

    abstract onMouseUp(mouseUpEvent: MouseEvent): void;

    abstract onWheel(wheelEvent: WheelEvent): void;

    /**
     * 激活标注工具
     */
    active(): void {
        this.mouseDownEventListener = (event) => {
            this.onMouseDown(event);
        }
        this.mouseMoveEventListener = (event) => {
            this.onMouseMove(event);
        }
        this.mouseUpEventListener = (event) => {
            this.onMouseUp(event);
        }
        this.wheelEventListener = (event) => {
            this.onWheel(event);
        }

        this.touchpad.addEventListener('mousedown', this.mouseDownEventListener);
        this.touchpad.addEventListener('mousemove', this.mouseMoveEventListener);
        this.touchpad.addEventListener('mouseup', this.mouseUpEventListener);
        this.touchpad.addEventListener('wheel', this.wheelEventListener);
    }

    /**
     * 停用标注工具
     */
    deactive() {
        if (this.mouseDownEventListener != null) {
            this.touchpad.removeEventListener('mousedown', this.mouseDownEventListener);
        }
        if (this.mouseMoveEventListener != null) {
            this.touchpad.removeEventListener('mousemove', this.mouseMoveEventListener);
        }
        if (this.mouseUpEventListener != null) {
            this.touchpad.removeEventListener('mouseup', this.mouseUpEventListener);
        }
        if(this.mouseOutEventListener != null){
            this.touchpad.removeEventListener('mouseout', this.mouseOutEventListener);
        }
        if(this.wheelEventListener != null){
            this.touchpad.removeEventListener('wheel', this.wheelEventListener);
        }
    }

    addToSky(child: UI) {
        this.app.sky.add(child);
    }

    clearSky() {
        this.app.sky.clear();
    }

    addToTree(child: UI) {
        this.app.tree.add(child);
    }
}

/**
 * 判断鼠标事件中鼠标的左键是否处于被按下的状态
 *
 * @param mouseEvent 鼠标事件
 */
function mouseLeftButtonIsPressed(mouseEvent: MouseEvent) {
    const LEFT_BUTTON = 1;
    return mouseEvent.buttons == LEFT_BUTTON;
}

class RectangleTool extends AnnotationTool {

    private rect: Rect | null = null;

    private mouseDownEvent: MouseEvent | null = null;

    // private customCursor: CrossHair;
    private customCursor: CircleNumber;

    constructor(app: App, touchpad: HTMLElement) {
        super(app, touchpad);
        // this.customCursor = new CrossHair(touchpad);
        this.customCursor = new CircleNumber(touchpad);
    }

    name(): string {
        return "RectangleTool";
    }


    active() {
        super.active();
        this.customCursor.active()
    }


    deactive() {
        super.deactive();
        this.customCursor.deactive();
    }

    onMouseDown(mouseDownEvent: MouseEvent): void {
        if (!mouseLeftButtonIsPressed(mouseDownEvent)) {
            return;
        }
        this.mouseDownEvent = mouseDownEvent;
        this.rect = new Rect({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: this.styleContext.strokeColor,
            strokeWidth: this.styleContext.strokeWidth
        });
        this.addToSky(this.rect);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (!mouseLeftButtonIsPressed(mouseMoveEvent)) {
            // 鼠标左键未按下，如果此时 this.rect 不为null，
            // 意味着此前鼠标可以在绘画过程中移出了touchpad，然后在touchpad之外松开了鼠标左键，
            // 导致touchpad无法监听到mouseup事件，这里需要把之前绘制的图形提交到tree
            if (this.rect) {
                this.submit(this.rect);
            }
            return;
        }
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.rect) {
            let x = (mouseMoveEvent.x < this.mouseDownEvent.x) ? mouseMoveEvent.x : this.mouseDownEvent.x;
            let y = (mouseMoveEvent.y < this.mouseDownEvent.y) ? mouseMoveEvent.y : this.mouseDownEvent.y;
            let width = Math.abs(mouseMoveEvent.x - this.mouseDownEvent.x);
            let height = Math.abs(mouseMoveEvent.y - this.mouseDownEvent.y);

            this.rect.set({
                x,
                y,
                width,
                height,
            });
        }

    }

    onMouseUp(mouseUpEvent: MouseEvent): void {
        if (!mouseLeftButtonIsPressed(mouseUpEvent)) {
            return;
        }
        if (this.rect) {
            this.submit(this.rect);
        }
    }

    submit(rect: Rect) {
        this.addToTree(rect);
        this.rect = null;
        this.clearSky();
    }

    onWheel(wheelEvent: WheelEvent): void {
        const MIN_STROKE_WIDTH = 1;
        const MAX_STROKE_WIDTH = 10;

        // 向上滚动
        let scrollUp = wheelEvent.deltaY < 0;
        if(scrollUp){
            this.styleContext.strokeWidth += 1;
            if(this.styleContext.strokeWidth > MAX_STROKE_WIDTH){
                this.styleContext.strokeWidth = MAX_STROKE_WIDTH;
            }
        }else {
            this.styleContext.strokeWidth -= 1;
            if(this.styleContext.strokeWidth < MIN_STROKE_WIDTH){
                this.styleContext.strokeWidth = MIN_STROKE_WIDTH;
            }
        }

        // this.customCursor.style.strokeWidth = this.styleContext.strokeWidth;
    }
}