import {AbstractGraph} from "./graph.ts";

export interface ArrowData {
    points?: number[],
    // 线条的颜色
    strokeColor?: string;
    //线条的大小
    strokeWidth?: number;
}

export class Arrow extends AbstractGraph{

    private readonly _data: ArrowData;
    private readonly _arrowSize= 10;

    constructor(data?: ArrowData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {};
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        console.log('ArrowData:', this._data);
        console.log('ArrowData.points:', this._data.points);

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

        const line ={
            start: {
                x: this._data.points[0],
                y:this._data.points[1]
            },
            end: {
                x: this._data.points[2],
                y: this._data.points[3],
            }
        };

        // 计算直线的角度
        const angle = Math.atan2(line.end.y-line.start.y, line.end.x-line.start.x);
        const arrowP1 = {
            x: line.end.x - this._arrowSize * Math.cos(angle - Math.PI / 6),
            y: line.end.y - this._arrowSize * Math.sin(angle - Math.PI / 6)
        };
        const arrowP2 = {
            x: line.end.x - this._arrowSize * Math.cos(angle + Math.PI / 6),
            y: line.end.y - this._arrowSize * Math.sin(angle + Math.PI / 6)
        };

        ctx.beginPath();
        ctx.moveTo(line.start.x, line.start.y);
        ctx.lineTo(line.end.x, line.end.y);

        ctx.lineTo(arrowP1.x, arrowP1.y);
        ctx.moveTo(line.end.x, line.end.y);
        ctx.lineTo(arrowP2.x, arrowP2.y);

        ctx.stroke();
        ctx.restore();
    }

    set(data: ArrowData){
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