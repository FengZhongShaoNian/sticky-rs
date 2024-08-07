import {AbstractGraph} from "./graph.ts";

export interface TextData {
    // 文本矩形左上角的x坐标
    x?: number,
    // 文本矩形左上角的y坐标
    y?: number,
    // 文本
    content?: string,
    // 字体（同CSS简写属性font ），如：12px/14px sans-serif;
    font?: string,
    // 字体颜色
    fontColor?: string,
    // 行高
    lineHeight: number,
    // 最大宽度
    maxWidth: number,
    // 文本是否可见
    visible?: boolean,

}

export class Text extends AbstractGraph {

    private readonly _data: TextData;

    constructor(data: TextData) {
        super();
        this._data = data;
    }

    render(ctx: CanvasRenderingContext2D, force?: boolean): void {
        console.log('TextData:', this._data);

        if(this._data.x === undefined
            || this._data.y === undefined
            || this._data.content === undefined
            || this._data.content.trim() === ''
            || this._data.lineHeight === undefined
            || this._data.maxWidth === undefined){
            console.log('Text data is incomplete, giving up rendering.');
            return;
        }
        if(!force && this._data.visible === false){
            console.log('force is false and _data.visible is false, giving up rendering. ');
            return;
        }

        ctx.save();

        if(this._data.fontColor){
            ctx.fillStyle = this._data.fontColor;
        }

        if(this._data.font){
            ctx.font = `${this._data.font}`;
        }
        ctx.textBaseline = "middle";

        const maxWidth = this._data.maxWidth;

        const content = this._data.content;
        const rows = new Array<string>();
        let rowBuilder = '';
        let metSpace = false;
        let word = '';
        for (let i = 0; i < content.length; i++){
            const ch = content.charAt(i);
            if(ch === '\n'){
                rows.push(rowBuilder);
                rowBuilder = '';
            }else if(ch === ' '){
                // 遇到空格，说明接下来可能是一个单词
                metSpace = true;
                rowBuilder += ch;
                word = '';
            }
            else {
                if(metSpace){
                    // 之前遇到空格，如果接下来的字符全部是字母，那么认为它们是单词的一部分
                    // 否则认为空格后面的这段字串不是单词
                    if(Text.isLetter(ch)){
                        word += ch;
                    }else {
                        metSpace = false;
                        word = '';
                    }
                }
                const textMetrics = ctx.measureText(rowBuilder + ch);
                const textWidth = textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft;
                if(textWidth > maxWidth){
                    if(metSpace && word !== ''){
                        // 是单词，为了避免单词被截断，将最后一个单词移到下一行
                        rowBuilder += ch;
                        rows.push(rowBuilder.substring(0, rowBuilder.length - word.length));
                        rowBuilder = word;
                    }else {
                        rows.push(rowBuilder);
                        rowBuilder = ch;
                    }
                    metSpace = false;
                    word = '';
                }else {
                    rowBuilder += ch;
                }
            }
        }
        rows.push(rowBuilder);

        console.log(`content:[${content}] 对应的rows:`, rows);

        let x = this._data.x;
        let y = this._data.y;
        for (let row of rows) {
            ctx.fillText(row, x, y);
            y += this._data.lineHeight;
        }

        ctx.restore();
    }

    static isLetter(char: string) {
        return /^[a-zA-Z]$/.test(char);
    }

    set(data: TextData){
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
    }

}