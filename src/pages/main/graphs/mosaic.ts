import {AbstractGraph, BackgroundImageExtractor} from "./graph.ts";

export interface MosaicData {
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

export class Mosaic extends AbstractGraph{
    private readonly _data: MosaicData;
    private _backgroundImageExtractor?: BackgroundImageExtractor;
    private _timeout?: NodeJS.Timeout;

    // 马赛克块大小为16x16像素
    private readonly _mosaicBlockSize = 16;

    constructor(data?: MosaicData) {
        super();
        if(data){
            this._data = data;
        }else {
            this._data = {}
        }
    }
    render(ctx: CanvasRenderingContext2D): void {
        console.log('MosaicData:', this._data);

        if(this._data.x === undefined
            || this._data.y === undefined
            || this._data.width === undefined
            || this._data.height === undefined
            || this._data.width === 0
            || this._data.height === 0){
            console.log('Mosaic data is incomplete, giving up rendering.');
            return;
        }
        if(this._backgroundImageExtractor === undefined){
            console.log('Mosaic _backgroundImageExtractor is undefined, giving up rendering.');
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

        // 马赛克的原理
        // 将图片分成一个个的小方格，然后将每个小方格中包含的像素的颜色设置为同一颜色，该颜色是该小方格原来的像素所有颜色的平均值）
        for (let y = 0; y < selectedRegionImageData.height; y += this._mosaicBlockSize) {
            for (let x = 0; x < selectedRegionImageData.width; x += this._mosaicBlockSize) {
                let blockRed = 0, blockGreen = 0, blockBlue = 0, pixelCount = 0;

                // 遍历当前马赛克块内的所有像素
                for (let offsetY = 0; offsetY < this._mosaicBlockSize && y + offsetY < selectedRegionImageData.height; offsetY++) {
                    for (let offsetX = 0; offsetX < this._mosaicBlockSize && x + offsetX < selectedRegionImageData.width; offsetX++) {
                        let index = 4 * ((y + offsetY) * selectedRegionImageData.width + (x + offsetX));
                        blockRed += selectedRegionImageData.data[index];
                        blockGreen += selectedRegionImageData.data[index + 1];
                        blockBlue += selectedRegionImageData.data[index + 2];
                        pixelCount++;
                    }
                }

                // 计算平均值并设置给马赛克块内的所有像素
                let avgRed = Math.floor(blockRed / pixelCount);
                let avgGreen = Math.floor(blockGreen / pixelCount);
                let avgBlue = Math.floor(blockBlue / pixelCount);

                for (let offsetY = 0; offsetY < this._mosaicBlockSize && y + offsetY < selectedRegionImageData.height; offsetY++) {
                    for (let offsetX = 0; offsetX < this._mosaicBlockSize && x + offsetX < selectedRegionImageData.width; offsetX++) {
                        let index = 4 * ((y + offsetY) * selectedRegionImageData.width + (x + offsetX));
                        selectedRegionImageData.data[index] = avgRed;
                        selectedRegionImageData.data[index + 1] = avgGreen;
                        selectedRegionImageData.data[index + 2] = avgBlue;
                    }
                }
            }
        }
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

    set(data: MosaicData){
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