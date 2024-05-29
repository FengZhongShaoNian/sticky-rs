import {Rect} from "leafer-ui";
import {CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {AbstractAnnotationTool, mouseLeftButtonIsPressed} from "./abstract-annotation-tool.ts";
import {UIContainer} from "../ui-container.ts";

export class RectangleTool extends AbstractAnnotationTool {

    private rect: Rect | null = null;

    private mouseDownEvent: MouseEvent | null = null;

    private customCursor: CrossHair;

    constructor(container: UIContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
    }

    name(): string {
        return ToolName.RECTANGLE_TOOL;
    }


    active() {
        super.active();
        this.customCursor.active()
    }


    deactive() {
        super.deactive();
        this.customCursor.deactive();
        this.clearState();
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
        this.add(this.rect);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (!mouseLeftButtonIsPressed(mouseMoveEvent)) {
            // 鼠标左键未按下，如果此时 this.rect 不为null，
            // 意味着此前鼠标可以在绘画过程中移出了touchpad，然后在touchpad之外松开了鼠标左键，
            // 导致touchpad无法监听到mouseup事件，这里需要把之前的状态清除掉
            if (this.rect) {
                this.clearState();
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
        this.clearState();
    }

    // TODO: 想个更好的函数名
    clearState() {
        this.rect = null;
        this.mouseDownEvent = null;
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

        this.customCursor.style.strokeWidth = this.styleContext.strokeWidth;
    }
}