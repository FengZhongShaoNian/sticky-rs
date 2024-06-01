import {CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Eraser} from "../graphs/eraser.ts";

export class EraserTool extends AbstractAnnotationTool {

    private eraser: Eraser | null = null;

    private mouseDownEvent: MouseEvent | null = null;

    private customCursor: CrossHair;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
    }

    name(): string {
        return ToolName.ERASER_TOOL;
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
        this.eraser = new Eraser({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            width: 0,
            height: 0,
        });
        this.add(this.eraser);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.eraser) {
            let x = (mouseMoveEvent.x < this.mouseDownEvent.x) ? mouseMoveEvent.x : this.mouseDownEvent.x;
            let y = (mouseMoveEvent.y < this.mouseDownEvent.y) ? mouseMoveEvent.y : this.mouseDownEvent.y;
            let width = Math.abs(mouseMoveEvent.x - this.mouseDownEvent.x);
            let height = Math.abs(mouseMoveEvent.y - this.mouseDownEvent.y);

            this.eraser.set({
                x,
                y,
                width,
                height,
            });
        }

    }
}