import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Arrow} from "../graphs/arrow.ts";

interface StyleContext {
    strokeWidth: number,
    strokeColor: string,
}

export class ArrowTool extends AbstractAnnotationTool {
    private arrow: Arrow | null = null;
    private readonly arrowSize: number;
    private mouseDownEvent: MouseEvent | null = null;
    private customCursor: CrossHair;
    private readonly styleContext: StyleContext;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
        this.arrowSize = 10;
        this.styleContext = {
            strokeWidth: 1,
            strokeColor: 'red'
        }
    }

    name(): string {
        return ToolName.ARROW_TOOL;
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
        this.arrow = new Arrow({
            strokeWidth: this.styleContext.strokeWidth,
            strokeColor: this.styleContext.strokeColor
        });
        this.add(this.arrow);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.arrow) {
            this.arrow.set({
                points: [this.mouseDownEvent.x, this.mouseDownEvent.y, mouseMoveEvent.x, mouseMoveEvent.y],
                strokeColor: this.styleContext.strokeColor,
                strokeWidth: this.styleContext.strokeWidth
            });
        }
    }

    onWheel(wheelEvent: WheelEvent): void {
        super.onWheel(wheelEvent);

        super.onWheel(wheelEvent);
        const MIN_STROKE_WIDTH = 1;
        const MAX_STROKE_WIDTH = 10;

        let scrollUp = ArrowTool.isScrollUp(wheelEvent);
        if(scrollUp){
            this.styleContext.strokeWidth = Math.min(this.styleContext.strokeWidth+1, MAX_STROKE_WIDTH);
        }else {
            this.styleContext.strokeWidth = Math.max(this.styleContext.strokeWidth-1, MIN_STROKE_WIDTH);
        }
        this.customCursor.style.strokeWidth = this.styleContext.strokeWidth;
    }

}