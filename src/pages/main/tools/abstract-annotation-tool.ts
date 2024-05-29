import {UIContainer} from "../ui-container.ts";
import {UI} from "leafer-ui";

export interface StyleContext {
    strokeWidth: number,
    strokeColor: string,
}

/**
 * 判断鼠标事件中鼠标的左键是否处于被按下的状态
 *
 * @param mouseEvent 鼠标事件
 */
export function mouseLeftButtonIsPressed(mouseEvent: MouseEvent) {
    const LEFT_BUTTON = 1;
    return mouseEvent.buttons == LEFT_BUTTON;
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

    add(child: UI) {
        this.container.add(child);
    }
}