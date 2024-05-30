import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {CrossHair} from "../cursor.ts";
import {UIContainer} from "../ui-container.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {Line} from "leafer-ui";

export class FreeCurveTool extends AbstractAnnotationTool {
    private line: Line | null = null;
    private mouseDownEvent: MouseEvent | null = null;
    private points: Array<number> | null = null;
    private customCursor: CrossHair;

    constructor(container: UIContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
    }

    name(): string {
        return ToolName.FREE_CURVE_TOOL;
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
            stroke: this.styleContext.strokeColor,
            strokeWidth: this.styleContext.strokeWidth,
            curve: true
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
                stroke: this.styleContext.strokeColor,
                strokeWidth: this.styleContext.strokeWidth
            });
        }
    }

    onWheel(wheelEvent: WheelEvent): void {
        super.onWheel(wheelEvent);
        this.customCursor.style.strokeWidth = this.styleContext.strokeWidth;
    }

}