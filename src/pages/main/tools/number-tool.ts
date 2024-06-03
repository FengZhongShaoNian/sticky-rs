import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {CircleNumber} from "../cursor.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Image} from "../graphs/image.ts";

interface StyleContext {
    strokeWidth: number,
    strokeColor: string,
}

export class NumberTool extends AbstractAnnotationTool {

    private num: number;
    private customCursor: CircleNumber;

    private readonly styleContext: StyleContext;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);

        this.styleContext = {
            strokeWidth: 20,
            strokeColor: 'rgba(255,0,0,0.3)'
        };

        this.num = 1;
        // 1秒中内没有移动则光标自动隐藏
        const autoHideAfterMsNoMove = 1000;
        this.customCursor = new CircleNumber(touchpad, undefined, autoHideAfterMsNoMove);
        this.customCursor.style.num = this.num;
    }

    name(): string {
        return ToolName.NUMBER_TOOL;
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
        let svg = this.customCursor.getSVG();
        console.log('number svg:', svg);
        const diameter = this.customCursor.diameter;
        const imageSource = document.createElement('img');
        imageSource.src = 'data:image/svg+xml,' + encodeURIComponent(svg);
        imageSource.onload = () => {
            const image = new Image({
                x: mouseDownEvent.x - diameter/2,
                y: mouseDownEvent.y- diameter/2,
                width: diameter,
                height: diameter,
                imageSource
            })
            this.add(image);
        }

        this.num++;
        this.customCursor.style.num = this.num;
    }

    onMouseMove(_mouseMoveEvent: MouseEvent): void {
    }


    onWheel(wheelEvent: WheelEvent) {
        super.onWheel(wheelEvent);
        const MIN_NUMBER = 1;
        const MAX_NUMBER = 100;
        if (NumberTool.isScrollUp(wheelEvent)) {
            this.num = Math.min(this.num + 1, MAX_NUMBER);
        }else {
            this.num = Math.max(this.num - 1, MIN_NUMBER);
        }
        this.customCursor.style.num = this.num;
    }
}