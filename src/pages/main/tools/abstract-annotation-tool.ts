import {GraphContainer, Graph} from "../graphs/graph.ts";

type MouseEventListener = (event: MouseEvent) => void;
type WheelEventListener = (event: WheelEvent) => void;
export abstract class AbstractAnnotationTool {
    protected readonly container: GraphContainer;
    // 触摸板，一个大小与窗口等同的HTML元素，用于感知鼠标事件
    protected readonly touchpad: HTMLElement;

    // 是否忽略鼠标左键没有被按下的鼠标事件。子类可以通过设置这个属性的值来告知自己是否需要忽略与鼠标左键无关的事件。默认是true。
    // （如果为true，那么只有鼠标左键被按下/松开的事件、鼠标左键被按下的情况下发生的鼠标移动事件会被传递给子类，而其它键的事件则不会被传递给子类）
    protected ignoreNonLeftMouseButtonEvents: boolean;

    private mouseDownEventListener: MouseEventListener | null = null;
    private mouseMoveEventListener: MouseEventListener | null = null;
    private mouseUpEventListener: MouseEventListener | null = null;
    private wheelEventListener: WheelEventListener | null = null;

    protected constructor(container: GraphContainer, touchpad: HTMLElement) {
        this.container = container;
        this.touchpad = touchpad;
        this.ignoreNonLeftMouseButtonEvents = true;
    }

    /**
     * 每一个标注工具都要有独一无二的名称
     */
    abstract name(): string;

    abstract onMouseDown(mouseDownEvent: MouseEvent): void;

    abstract onMouseMove(mouseMoveEvent: MouseEvent): void;

    onMouseUp(_mouseUpEvent: MouseEvent){
    }

    onWheel(_wheelEvent: WheelEvent): void {
    }

    // 判断滚轮是否是向上滚动
    static isScrollUp(wheelEvent: WheelEvent){
        return wheelEvent.deltaY < 0;
    }

    /**
     * 激活标注工具
     */
    active(): void {
        const LEFT_BUTTON = 1;
        this.mouseDownEventListener = (event) => {
            const isTheLeftMouseButtonPressed = (event.buttons == LEFT_BUTTON);
            if (this.ignoreNonLeftMouseButtonEvents && !isTheLeftMouseButtonPressed) {
                return;
            }
            console.log('mouseDown event', event);
            this.onMouseDown(event);
        }
        this.mouseMoveEventListener = (event) => {
            const isTheLeftMouseButtonPressed = (event.buttons == LEFT_BUTTON);
            if (this.ignoreNonLeftMouseButtonEvents && !isTheLeftMouseButtonPressed) {
                return;
            }
            console.log('mouseMove event', event);
            this.onMouseMove(event);
        }
        this.mouseUpEventListener = (event) => {
            const isTheLeftMouseButton = (event.buttons == LEFT_BUTTON);
            if (this.ignoreNonLeftMouseButtonEvents && !isTheLeftMouseButton) {
                return;
            }
            console.log('mouseUp event', event);
            this.onMouseUp(event);
        }
        this.wheelEventListener = (event) => {
            console.log('wheel event', event);
            this.onWheel(event);
        }

        this.touchpad.addEventListener('mousedown', this.mouseDownEventListener);
        this.touchpad.addEventListener('mousemove', this.mouseMoveEventListener);
        this.touchpad.addEventListener('mouseup', this.mouseUpEventListener);
        this.touchpad.addEventListener('wheel', this.wheelEventListener);

        console.log(`annotation tool ${this.name()} activated`);
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
        if(this.wheelEventListener != null){
            this.touchpad.removeEventListener('wheel', this.wheelEventListener);
        }
        console.log(`annotation tool ${this.name()} deactivated`);
    }

    add(graph: Graph) {
        this.container.add(graph);
    }
}
