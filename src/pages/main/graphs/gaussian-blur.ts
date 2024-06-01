import {AbstractGraph, BackgroundImageExtractor} from "./graph.ts";
import * as StackBlur from 'stackblur-canvas';

export interface GaussianBlurData {
    // 矩形左上角的x坐标
    x?: number;
    // 矩形左上角的y坐标
    y?: number;
    // 矩形的宽度
    width?:number;
    // 矩形的高度
    height?: number;
}

interface RGB {
    red: number,
    green: number,
    blue: number
}

export class GaussianBlur extends AbstractGraph{
    private readonly _data: GaussianBlurData;
    private _backgroundImageExtractor?: BackgroundImageExtractor;

    // 模糊半径（Blur Radius）在高斯模糊中起着非常重要的作用。它决定了模糊的程度，也就是说，模糊半径越大，图像的模糊效果就越强。
    // 在高斯模糊中，每个像素的新值是其周围像素的加权平均值，权重由高斯函数确定。模糊半径决定了这个加权平均值的计算范围，
    // 也就是说，它决定了每个像素的新值由其周围多大范围的像素共同决定。
    // 具体来说，如果模糊半径为1，那么每个像素的新值只由其自身和紧邻的像素决定；
    // 如果模糊半径为2，那么每个像素的新值不仅由其自身和紧邻的像素决定，还由距离其2个像素距离的像素决定，以此类推。
    // 因此，模糊半径越大，每个像素的新值由更大范围的像素决定，图像的模糊效果就越强。
    private readonly _blurRadius = 30;

    constructor(data?: GaussianBlurData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {}
        }
    }
    render(ctx: CanvasRenderingContext2D): void {
        console.log('GaussianBlurData:', this._data);

        if(this._data.x === undefined
            || this._data.y === undefined
            || this._data.width === undefined
            || this._data.height === undefined
            || this._data.width === 0
            || this._data.height === 0){
            console.log('GaussianBlur data is incomplete, giving up rendering.');
            return;
        }
        if(this._backgroundImageExtractor === undefined){
            console.log('GaussianBlurData _backgroundImageExtractor is undefined, giving up rendering.');
            return;
        }

        const width = this._data.width;
        const height = this._data.height;

        // 获取指定区域的背景图片
        const selectedRegionImageData = this._backgroundImageExtractor.getImageData(this._data.x, this._data.y, width, height);
        if(selectedRegionImageData == undefined){
            console.error('Failed to get image data from selected region');
            return;
        }
        console.log('获取到的指定区域的图像数据：', selectedRegionImageData);

        StackBlur.imageDataRGBA(selectedRegionImageData, 0, 0, selectedRegionImageData.width, selectedRegionImageData.height, this._blurRadius);
        if(selectedRegionImageData.width != this._data.width || selectedRegionImageData.height != this._data.height){
            console.log('检测到selectedRegionImageData的图片是经过缩放的');

            const scalingXRatio = selectedRegionImageData.width / this._data.width;
            const scalingYRatio = selectedRegionImageData.height / this._data.height;
            const scaledX = scalingXRatio * this._data.x;
            const scaledY = scalingYRatio * this._data.y;

            console.log(`计算出经过缩放后的坐标：scaledX:${scaledX}, scaledY:${scaledY}`);

            ctx.putImageData(selectedRegionImageData, scaledX, scaledY);
        }else {
            ctx.putImageData(selectedRegionImageData, this._data.x, this._data.y);
        }
    }

    backgroundImageAware(backgroundImageExtractor: BackgroundImageExtractor): void {
        this._backgroundImageExtractor = backgroundImageExtractor;
    }

    set(data: GaussianBlurData){
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