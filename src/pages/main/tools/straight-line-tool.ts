import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {CrossHair} from "../cursor.ts";
import {UIContainer} from "../ui-container.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {Line} from "leafer-ui";

export class StraightLineTool extends AbstractAnnotationTool {
    private line: Line | null = null;
    private mouseDownEvent: MouseEvent | null = null;
    private customCursor: CrossHair;

    constructor(container: UIContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
    }

    name(): string {
        return ToolName.STRAIGHT_LINE_TOOL;
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
        this.line = new Line({
            points: [mouseDownEvent.x, mouseDownEvent.y],
            stroke: this.styleContext.strokeColor,
            strokeWidth: this.styleContext.strokeWidth
        });
        this.add(this.line);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.line) {
            this.line.set({
                points: [this.mouseDownEvent.x, this.mouseDownEvent.y, mouseMoveEvent.x, mouseMoveEvent.y],
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