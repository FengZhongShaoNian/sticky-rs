import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {CrossHair} from "../cursor.ts";
import {UIContainer} from "../ui-container.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {Path} from "leafer-ui";

export class ArrowTool extends AbstractAnnotationTool {
    private path: Path | null = null;
    private readonly arrowSize: number;
    private mouseDownEvent: MouseEvent | null = null;
    private customCursor: CrossHair;

    constructor(container: UIContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
        this.arrowSize = 10;
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
        this.path = new Path({
            strokeWidth: this.styleContext.strokeWidth,
            stroke: this.styleContext.strokeColor
        });
        this.add(this.path);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.path) {
            const line ={
                start: {
                    x: this.mouseDownEvent.x,
                    y: this.mouseDownEvent.y
                },
                end: {
                    x: mouseMoveEvent.x,
                    y: mouseMoveEvent.y
                }
            };

            // 计算直线的角度
            const angle = Math.atan2(line.end.y-line.start.y, line.end.x-line.start.x);
            const arrowP1 = {
                x: line.end.x - this.arrowSize * Math.cos(angle - Math.PI / 6),
                y: line.end.y - this.arrowSize * Math.sin(angle - Math.PI / 6)
            };
            const arrowP2 = {
                x: line.end.x - this.arrowSize * Math.cos(angle + Math.PI / 6),
                y: line.end.y - this.arrowSize * Math.sin(angle + Math.PI / 6)
            };

            const pen = this.path.pen;
            pen.clearPath();
            pen.moveTo(line.start.x, line.start.y);
            pen.lineTo(line.end.x, line.end.y);

            pen.lineTo(arrowP1.x, arrowP1.y);
            pen.moveTo(line.end.x, line.end.y);
            pen.lineTo(arrowP2.x, arrowP2.y);
        }
    }

    onWheel(wheelEvent: WheelEvent): void {
        super.onWheel(wheelEvent);
        this.customCursor.style.strokeWidth = this.styleContext.strokeWidth;
    }

}