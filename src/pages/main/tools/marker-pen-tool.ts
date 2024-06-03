import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {Circle, CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Line} from "../graphs/line.ts";

interface StyleContext {
    strokeWidth: number,
    strokeColor: string,
}

export class MarkerPenTool extends AbstractAnnotationTool {
    private line: Line | null = null;
    private mouseDownEvent: MouseEvent | null = null;
    private points: Array<number> | null = null;
    private customCursor: Circle;

    private readonly styleContext: StyleContext;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);

        this.styleContext = {
            strokeWidth: 20,
            strokeColor: 'rgba(255,0,0,0.3)'
        };

        this.customCursor = new Circle(touchpad);
        this.customCursor.style.diameter = this.styleContext.strokeWidth;
        this.customCursor.style.strokeWidth = 0;
        this.customCursor.style.strokeColor = this.styleContext.strokeColor;
    }

    name(): string {
        return ToolName.MARKER_PEN_TOOL;
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
        this.points = [mouseDownEvent.x, mouseDownEvent.y]
        this.line = new Line({
            points: this.points,
            strokeColor: this.styleContext.strokeColor,
            strokeWidth: this.styleContext.strokeWidth,
        });
        this.add(this.line);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }

        if (this.line && this.points) {
            this.points[this.points.length] = mouseMoveEvent.x;
            this.points[this.points.length] = mouseMoveEvent.y;
            this.line.set({
                points: this.points,
                strokeColor: this.styleContext.strokeColor,
                strokeWidth: this.styleContext.strokeWidth
            });
        }
    }

    onWheel(wheelEvent: WheelEvent): void {
        const MIN_STROKE_WIDTH = 1;
        const MAX_STROKE_WIDTH = 50;

        let scrollUp = MarkerPenTool.isScrollUp(wheelEvent);
        if(scrollUp){
            this.styleContext.strokeWidth = Math.min(this.styleContext.strokeWidth+1, MAX_STROKE_WIDTH);
        }else {
            this.styleContext.strokeWidth = Math.max(this.styleContext.strokeWidth-1, MIN_STROKE_WIDTH);
        }
        this.customCursor.style.diameter = this.styleContext.strokeWidth;
    }

}