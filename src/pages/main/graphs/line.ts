import {AbstractGraph} from "./graph.ts";

export interface LineData {
    points?: number[],
    // 线条的颜色
    strokeColor?: string;
    // 线条的大小
    strokeWidth?: number;
}

export class Line extends AbstractGraph{

    private readonly _data: LineData;

    constructor(data?: LineData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {};
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        console.log('LineData:', this._data);
        console.log('LineData.points:', this._data.points);

        if(this._data.points === undefined){
            console.log('Line data is incomplete, giving up rendering.');
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

        let start = true;
        ctx.beginPath();
        for (let i = 0; i <= this._data.points.length - 2; i = i+2) {
            let x = this._data.points[i];
            let y = this._data.points[i+1];
            if(start){
                console.log(`moveTo(${x}, ${y})`);
                ctx.moveTo(x, y);
                start = false;
            }else {
                console.log(`lineTo(${x}, ${y})`)
                ctx.lineTo(x, y);
            }
        }
        ctx.stroke();
        ctx.restore();
    }

    set(data: LineData){
        for (let key of Object.keys(data)){
            (this._data as any)[key] = (data as any)[key];
        }
        this.notifyObservers();
    }

    scale(scalingRatio: number): void {
        if(this._data.points){
            for (let i = 0; i < this._data.points.length; i++) {
                this._data.points[i] *= scalingRatio;
            }
        }
    }

}