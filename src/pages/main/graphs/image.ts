import {AbstractGraph} from "./graph.ts";

export interface ImageData {
    // 图片的左上角的x坐标
    x?: number;

    // 图片的左上角的y坐标
    y?: number;

    // 图片的宽度
    width?:number;

    // 图片的高度
    height?: number;

    // 图片
    imageSource?: CanvasImageSource;
}

export class Image extends AbstractGraph{
    private readonly _data: ImageData;


    constructor(data?: ImageData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {};
        }
    }

    render(ctx: CanvasRenderingContext2D): void {
        console.log('ImageData:', this._data);

        if(this._data.x === undefined
            || this._data.y === undefined
            || this._data.imageSource === undefined){
            console.log('Image data is incomplete, giving up rendering.');
            return;
        }

        if(this._data.width === undefined
            || this._data.height === undefined){
            ctx.drawImage(this._data.imageSource, this._data.x, this._data.y);
        }else {
            ctx.drawImage(this._data.imageSource, this._data.x, this._data.y,
                this._data.width, this._data.height);
        }
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