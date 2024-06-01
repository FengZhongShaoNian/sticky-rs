import {CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Mosaic} from "../graphs/mosaic.ts";

export class MosaicTool extends AbstractAnnotationTool {

    private mosaic: Mosaic | null = null;

    private mouseDownEvent: MouseEvent | null = null;

    private customCursor: CrossHair;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
    }

    name(): string {
        return ToolName.MOSAIC_TOOL;
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
        this.mosaic = new Mosaic({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            width: 0,
            height: 0,
        });
        this.add(this.mosaic);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.mosaic) {
            let x = (mouseMoveEvent.x < this.mouseDownEvent.x) ? mouseMoveEvent.x : this.mouseDownEvent.x;
            let y = (mouseMoveEvent.y < this.mouseDownEvent.y) ? mouseMoveEvent.y : this.mouseDownEvent.y;
            let width = Math.abs(mouseMoveEvent.x - this.mouseDownEvent.x);
            let height = Math.abs(mouseMoveEvent.y - this.mouseDownEvent.y);

            this.mosaic.set({
                x,
                y,
                width,
                height,
            });
        }

    }
}