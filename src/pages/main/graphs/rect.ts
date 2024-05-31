import {AbstractGraph} from "./graph.ts";

export interface RectData {
    // 矩形左上角的x坐标
    x?: number;
    // 矩形左上角的y坐标
    y?: number;
    // 矩形的宽度
    width?:number;
    // 矩形的高度
    height?: number;
    // 轮廓颜色
    strokeColor?: string;
    // 轮廓线条大小
    strokeWidth?: number;
}

export class Rect extends AbstractGraph{
    private readonly _data: RectData;

    constructor(data?: RectData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {}
        }
    }
    render(ctx: CanvasRenderingContext2D): void {
        console.log('RectData:', this._data);

        if(this._data.x === undefined
            || this._data.y === undefined
            || this._data.width === undefined
            || this._data.height === undefined){
            console.log('Ellipse data is incomplete, giving up rendering.');
            return;
        }

        // 保存当前状态，以便之后可以恢复
        ctx.save();


        if(this._data.strokeColor != undefined){
            ctx.strokeStyle = this._data.strokeColor;
        }
        if(this._data.strokeWidth != undefined){
            ctx.lineWidth = this._data.strokeWidth;
        }

        ctx.strokeRect(this._data.x, this._data.y, this._data.width, this._data.height);

        // 恢复之前保存的状态
        ctx.restore();
    }

    set(data: RectData){
        for (let key of Object.keys(data)){
            (this._data as any)[key] = (data as any)[key];
        }
        this.notifyObservers();
    }

    scale(scalingRatio: number): void {
        if(this._data.x != undefined){
            this._data.x = this._data.x * scalingRatio;
        }
        if(this._data.y != undefined){
            this._data.y = this._data.y * scalingRatio;
        }
        if(this._data.width != undefined){
            this._data.width = this._data.width * scalingRatio;
        }
        if(this._data.height != undefined){
            this._data.height = this._data.height * scalingRatio;
        }
    }
}