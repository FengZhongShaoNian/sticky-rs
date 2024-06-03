import {CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Rect} from "../graphs/rect.ts";

interface StyleContext {
    strokeWidth: number,
    strokeColor: string,
}

export class RectangleTool extends AbstractAnnotationTool {

    private rect: Rect | null = null;
    private mouseDownEvent: MouseEvent | null = null;
    private customCursor: CrossHair;

    private readonly styleContext: StyleContext;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
        this.styleContext = {
            strokeWidth: 1,
            strokeColor: 'red'
        };
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
    }

    onMouseDown(mouseDownEvent: MouseEvent): void {
        this.mouseDownEvent = mouseDownEvent;
        this.rect = new Rect({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            width: 0,
            height: 0,
            strokeColor: this.styleContext.strokeColor,
            strokeWidth: this.styleContext.strokeWidth
        });
        this.add(this.rect);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
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
                strokeColor: this.styleContext.strokeColor,
                strokeWidth: this.styleContext.strokeWidth
            });
        }

    }

    onWheel(wheelEvent: WheelEvent): void {
        const MIN_STROKE_WIDTH = 1;
        const MAX_STROKE_WIDTH = 10;

        let scrollUp = RectangleTool.isScrollUp(wheelEvent);
        if(scrollUp){
            this.styleContext.strokeWidth = Math.min(this.styleContext.strokeWidth+1, MAX_STROKE_WIDTH);
        }else {
            this.styleContext.strokeWidth = Math.max(this.styleContext.strokeWidth-1, MIN_STROKE_WIDTH);
        }
        this.customCursor.style.strokeWidth = this.styleContext.strokeWidth;
    }
}