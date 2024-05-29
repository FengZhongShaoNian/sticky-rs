import {UIContainer} from "../ui-container.ts";
import {Rect, UI} from "leafer-ui";
import {CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";

export interface StyleContext {
    strokeWidth: number,
    strokeColor: string,
}

type MouseEventListener = (event: MouseEvent) => void;
type WheelEventListener = (event: WheelEvent) => void;
export abstract class AbstractAnnotationTool {
    private readonly container: UIContainer;
    // 触摸板，一个大小与窗口等同的HTML元素，用于感知鼠标事件
    protected readonly touchpad: HTMLElement;

    private mouseDownEventListener: MouseEventListener | null = null;
    private mouseMoveEventListener: MouseEventListener | null = null;
    private mouseUpEventListener: MouseEventListener | null = null;
    private mouseOutEventListener: MouseEventListener | null = null;
    private wheelEventListener: WheelEventListener | null = null;

    protected styleContext: StyleContext;

    protected constructor(container: UIContainer, touchpad: HTMLElement) {
        this.container = container;
        this.touchpad = touchpad;

        this.styleContext = {
            strokeWidth: 1,
            strokeColor: 'red',
        }
    }

    /**
     * 每一个标注工具都要有独一无二的名称
     */
    abstract name(): string;

    abstract onMouseDown(mouseDownEvent: MouseEvent): void;

    abstract onMouseMove(mouseMoveEvent: MouseEvent): void;

    onMouseUp(_mouseUpEvent: MouseEvent){
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
    }

    /**
     * 激活标注工具
     */
    active(): void {
        const LEFT_BUTTON = 1;
        this.mouseDownEventListener = (event) => {
            const isTheLeftMouseButtonPressed = (event.buttons == LEFT_BUTTON);
            if (!isTheLeftMouseButtonPressed) {
                return;
            }
            this.onMouseDown(event);
        }
        this.mouseMoveEventListener = (event) => {
            const isTheLeftMouseButtonPressed = (event.buttons == LEFT_BUTTON);
            if (!isTheLeftMouseButtonPressed) {
                return;
            }
            this.onMouseMove(event);
        }
        this.mouseUpEventListener = (event) => {
            const isTheLeftMouseButton = (event.buttons == LEFT_BUTTON);
            if (!isTheLeftMouseButton) {
                return;
            }
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

    add(child: UI) {
        this.container.add(child);
    }
}
