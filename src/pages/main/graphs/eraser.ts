import {AbstractGraph} from "./graph.ts";

export interface EraserData {
    // 矩形左上角的x坐标
    x?: number;
    // 矩形左上角的y坐标
    y?: number;
    // 矩形的宽度
    width?:number;
    // 矩形的高度
    height?: number;
}

export class Eraser extends AbstractGraph{
    private readonly _data: EraserData;

    constructor(data?: EraserData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {}
        }
    }
    render(ctx: CanvasRenderingContext2D): void {
        console.log('EraserData:', this._data);

        if(this._data.x === undefined
            || this._data.y === undefined
            || this._data.width === undefined
            || this._data.height === undefined){
            console.log('Eraser data is incomplete, giving up rendering.');
            return;
        }

        // ctx.strokeRect(this._data.x, this._data.y, this._data.width, this._data.height);
        ctx.clearRect(this._data.x, this._data.y, this._data.width, this._data.height);
    }

    set(data: EraserData){
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