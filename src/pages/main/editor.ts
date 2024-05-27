import {App, Rect, Leafer, PointerEvent} from "leafer-ui";
import logger from "../../common/logger.ts";

function disableDragRegion(){
    document.querySelector('#drag-region')?.removeAttribute('data-tauri-drag-region');
}

function enableDragRegion(){
    document.querySelector('#drag-region')?.setAttribute('data-tauri-drag-region', '');
}

export interface ImageInfo{
    dataURL: string,
    width: number,
    height: number
}

export class Editor {
    private _app: App;
    private _editing: boolean;

    constructor() {
        this._app = new App({
            view: window,
            ground: { type: 'draw' },
            tree: {},
            sky:  { type: 'draw' }
        });

        this._editing=false;
    }

    open(image: ImageInfo){
        const backgroundRect = new Rect({
            width: image.width,
            height: image.height,
            fill: {
                type: 'image',
                url: image.dataURL,
            }
        });
        // this._app.ground.add(backgroundRect);
        this._app.sky.add(backgroundRect);

        disableDragRegion();

        backgroundRect.on(PointerEvent.LONG_PRESS, (event: PointerEvent)=>{
            logger.info('backgroundRect PointerEvent.LONG_PRESS, event:' + event).then()
        });
    }

    get editing(): boolean {
        return this._editing;
    }
}

export interface Context {

    /**
     * 鼠标光标
     */
    readonly cursor: string;

    /**
     * 颜色
     */
    readonly color: string;

    readonly fontName: string;

    readonly fontSize: number;

}

export abstract class AnnotationTool{
    protected drawingBoard: Leafer | null = null;

    /**
     * 每一个标注工具都要有独一无二的名称
     */
    abstract name(): string;

    active(drawingBoard: Leafer): void{
        this.drawingBoard = drawingBoard;
    }

    /**
     * 按下鼠标左键
     * @param x 鼠标的x坐标
     * @param y 鼠标的y坐标
     */
    abstract pressTheLeftMouseButton(x: number, y: number): void;
}

// class RectangleTool implements AnnotationTool {
//
//     name(): string {
//         return "RectangleTool";
//     }
//
//
// }