import {CrossHair} from "../cursor.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {GaussianBlur} from "../graphs/gaussian-blur.ts";

export class GaussianBlurTool extends AbstractAnnotationTool {

    private gaussianBlur: GaussianBlur | null = null;

    private mouseDownEvent: MouseEvent | null = null;

    private customCursor: CrossHair;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.customCursor = new CrossHair(touchpad);
    }

    name(): string {
        return ToolName.GAUSSIAN_BLUR_TOOL;
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
        this.gaussianBlur = new GaussianBlur({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            width: 0,
            height: 0,
        });
        this.add(this.gaussianBlur);
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if (this.mouseDownEvent == null) {
            return;
        }
        if (this.gaussianBlur) {
            let x = (mouseMoveEvent.x < this.mouseDownEvent.x) ? mouseMoveEvent.x : this.mouseDownEvent.x;
            let y = (mouseMoveEvent.y < this.mouseDownEvent.y) ? mouseMoveEvent.y : this.mouseDownEvent.y;
            let width = Math.abs(mouseMoveEvent.x - this.mouseDownEvent.x);
            let height = Math.abs(mouseMoveEvent.y - this.mouseDownEvent.y);

            this.gaussianBlur.set({
                x,
                y,
                width,
                height,
            });
        }

    }
}