import {AbstractGraph} from "./graph.ts";

export interface EllipseData {
    // 椭圆的外接矩形左上角的x坐标
    x?: number;
    // 椭圆的外接矩形左上角的y坐标
    y?: number;
    // 椭圆的外接矩形的宽度
    width?:number;
    // 椭圆的外接矩形的高度
    height?: number;
    // 椭圆的轮廓颜色
    strokeColor?: string;
    // 椭圆的轮廓线条大小
    strokeWidth?: number;
}

export class Ellipse extends AbstractGraph{
    private readonly _data: EllipseData;

    constructor(data?: EllipseData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {}
        }
    }
    render(ctx: CanvasRenderingContext2D): void {
        console.log('EllipseData:', this._data);

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

        const cx = this._data.x + this._data.width/2; // 椭圆中心点的x坐标
        const cy = this._data.y + this._data.height/2; // 椭圆中心点的y坐标
        const rx = this._data.width/2; // 水平半径
        const ry = this._data.height/2; // 垂直半径

        let step = (rx > ry) ? 1 / rx : 1 / ry;
        ctx.beginPath();
        ctx.moveTo(cx + rx, cy);
        for (let i = 0; i < 2 * Math.PI; i += step)
        {
            ctx.lineTo(cx + rx * Math.cos(i), cy + ry * Math.sin(i));
        }
        ctx.closePath();
        ctx.stroke();

        // 恢复之前保存的状态
        ctx.restore();
    }

    set(data: EllipseData){
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