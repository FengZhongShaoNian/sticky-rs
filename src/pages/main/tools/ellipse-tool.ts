import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {CrossHair} from "../cursor.ts";
import {Ellipse} from "leafer-ui";
import {UIContainer} from "../ui-container.ts";

export class EllipseTool extends AbstractAnnotationTool{

    private ellipse: Ellipse | null = null;

    private mouseDownEvent: MouseEvent | null = null;

    private customCursor: CrossHair;


    constructor(container: UIContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
    }

    name(): string {
        return ToolName.ELLIPSE_TOOL;
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
        this.ellipse = new Ellipse({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            width: 0,
            height: 0,
            fill: "transparent",
            stroke: this.styleContext.strokeColor,
            strokeWidth: this.styleContext.strokeWidth
        });
        this.add(this.ellipse);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.ellipse) {
            let x = (mouseMoveEvent.x < this.mouseDownEvent.x) ? mouseMoveEvent.x : this.mouseDownEvent.x;
            let y = (mouseMoveEvent.y < this.mouseDownEvent.y) ? mouseMoveEvent.y : this.mouseDownEvent.y;
            let width = Math.abs(mouseMoveEvent.x - this.mouseDownEvent.x);
            let height = Math.abs(mouseMoveEvent.y - this.mouseDownEvent.y);

            this.ellipse.set({
                x,
                y,
                width,
                height,
            });
        }
    }

    onWheel(wheelEvent: WheelEvent): void {
        super.onWheel(wheelEvent);
        this.customCursor.style.strokeWidth = this.styleContext.strokeWidth;
    }

}