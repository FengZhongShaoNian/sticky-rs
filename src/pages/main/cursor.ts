
type MouseEventListener = (event: MouseEvent) => void;

type CursorLeftTopPos = { left: number, top: number };

export abstract class Cursor {
    protected mouse: HTMLElement;

    // 光标应用于该元素，该元素提供鼠标移动相关事件的HTML元素，光标通过监听它从而移动自己
    private cursorEffectElement: HTMLElement;

    private mouseMoveEventListener: MouseEventListener | null = null;
    private mouseOutEventListener: MouseEventListener | null = null;

    protected constructor(cursorEffectElement: HTMLElement) {
        // TODO：动态创建mouse元素
        let mouse = document.getElementById('mouse');
        if (mouse == null) {
            throw new Error('HTMLElement with id "mouse" not found');
        }
        this.mouse = mouse;
        this.cursorEffectElement = cursorEffectElement;
    }

    active() {
        this.updateCursorShape();
        this.mouseMoveEventListener = (event) => {
            this.onMouseMove(event);
        };
        this.mouseOutEventListener = () => {
            this.onMouseOut();
        }
        this.cursorEffectElement.style.cursor = 'none';
        this.cursorEffectElement.addEventListener('mousemove', this.mouseMoveEventListener);
        this.cursorEffectElement.addEventListener('mouseout', this.mouseOutEventListener);
    }

    deactive() {
        if (this.mouseMoveEventListener != null) {
            this.cursorEffectElement.removeEventListener('mousemove', this.mouseMoveEventListener);
        }
        if (this.mouseOutEventListener != null) {
            this.cursorEffectElement.removeEventListener('mouseout', this.mouseOutEventListener);
        }
        this.cursorEffectElement.style.cursor = 'auto';
    }

    onMouseMove(event: MouseEvent) {
        const {left, top} = this.calculateCursorLeftTopPos(event);
        this.mouse.style.left = left + 'px';
        this.mouse.style.top = top + 'px';
    }

    onMouseOut() {
        this.mouse.style.left = '-50%';
        this.mouse.style.top = '-50%';
    }

    // 更新光标的形状
    abstract updateCursorShape(): void;

    // 计算光标的位置
    abstract calculateCursorLeftTopPos(event: MouseEvent): CursorLeftTopPos;
}

export interface BoundingRect {
    width: number,
    height: number
}

// 十字形光标的样式
export interface CrossHairStyle {
    // 线条的宽度
    strokeWidth: number,
    // 线条的颜色
    strokeColor: string,
    // 光标外接矩形（可以想象十字形光标是“田”中的“十”，而boundingRectWidth表示其中的“口”的宽度）
    boundingRectWidth: number,
    // 光标外接矩形（可以想象十字形光标是“田”中的“十”，而boundingRectHeight表示其中的“口”的高度）
    boundingRectHeight: number,
}

// 十字形光标
export class CrossHair extends Cursor {

    private readonly _style: CrossHairStyle;

    constructor(cursorEffectElement: HTMLElement, style?: CrossHairStyle) {
        super(cursorEffectElement);

        const cursor = this;
        const handler: ProxyHandler<CrossHairStyle> = {
            get(target: CrossHairStyle, propKey: string) {
                return Reflect.get(target, propKey);
            },
            set(target: CrossHairStyle, propKey: string , newValue: any) {
                Reflect.set(target, propKey, newValue);
                cursor.updateCursorShape();
                return true;
            }
        };
        if(style){
            this._style = new Proxy(style, handler);
        }else {
            this._style = new Proxy({
                strokeWidth: 1,
                strokeColor: 'red',
                boundingRectWidth: 24,
                boundingRectHeight: 24
            }, handler);
        }
    }

    getShape() {
        return `
          <svg xmlns="http://www.w3.org/2000/svg">
            <line
              x1="0"    
              y1="${this._style.boundingRectHeight / 2}" 
              x2="${this._style.boundingRectWidth}"     
              y2="${this._style.boundingRectHeight / 2}"    
              stroke="${this._style.strokeColor}"        
              stroke-width="${this._style.strokeWidth}"  
            />
            <line
              x1="${this._style.boundingRectWidth / 2}"    
              y1="0"     
              x2="${this._style.boundingRectWidth / 2}"     
              y2="${this._style.boundingRectHeight}"    
              stroke="${this._style.strokeColor}"        
              stroke-width="${this._style.strokeWidth}"
            />
          </svg>
    `;
    }

    calculateCursorLeftTopPos(event: MouseEvent): CursorLeftTopPos {
        const left = (event.pageX - this._style.boundingRectWidth / 2);
        const top = (event.pageY - this._style.boundingRectHeight / 2);
        return {
            left, top
        }
    }

    updateCursorShape(): void {
        const shape = this.getShape();
        console.log('CrossHair shape:', shape);

        const encoded = btoa(shape);
        const dataURL = `data:image/svg+xml;base64,${encoded}`

        this.mouse.style.background = `url(${dataURL}) no-repeat center center`;
        this.mouse.style.width = this._style.boundingRectWidth + 'px';
        this.mouse.style.height = this._style.boundingRectHeight + 'px';
    }

    get style(){
        return this._style;
    }
}

// 圆形光标的样式
interface CircleStyle {
    // 直径
    diameter: number,
    // 圆圈的线条宽度
    strokeWidth: number,
    // 圆圈的线条颜色
    strokeColor: string,
    // 圆圈的填充颜色
    fillColor: string,
}

// 圆形光标
export class Circle extends Cursor{
    private readonly _style: CircleStyle;

    constructor(cursorEffectElement: HTMLElement, style?: CircleStyle) {
        super(cursorEffectElement);

        const cursor = this;
        const handler: ProxyHandler<CircleStyle> = {
            get(target: CircleStyle, propKey: string) {
                return Reflect.get(target, propKey);
            },
            set(target: CircleStyle, propKey: string , newValue: any) {
                Reflect.set(target, propKey, newValue);
                cursor.updateCursorShape();
                return true;
            }
        };
        if(style){
            this._style = new Proxy(style, handler);
        }else {
            this._style = new Proxy({
                diameter: 10,
                strokeWidth: 0,
                strokeColor: 'red',
                fillColor: 'red',
            }, handler);
        }
    }

    getShape() {
        const radius = this._style.diameter/2;
        return `
          <svg xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="${radius}"
              cy="${radius}"
              r="${radius}"
              fill="${this._style.fillColor}"
              stroke="${this._style.strokeColor}"
              stroke-width="${this._style.strokeWidth}" 
            />
          </svg>
    `;
    }

    calculateCursorLeftTopPos(event: MouseEvent): CursorLeftTopPos {
        const left = (event.pageX - this._style.diameter / 2);
        const top = (event.pageY - this._style.diameter / 2);
        return {
            left, top
        }
    }

    updateCursorShape(): void {
        const shape = this.getShape();
        console.log('Circle shape:', shape);

        const encoded = btoa(shape);
        const dataURL = `data:image/svg+xml;base64,${encoded}`

        this.mouse.style.background = `url(${dataURL}) no-repeat center center`;
        this.mouse.style.width = this._style.diameter + 'px';
        this.mouse.style.height = this._style.diameter + 'px';
    }

    get style(){
        return this._style;
    }
}

// 带圆圈的数字光标的样式
interface CircleNumberStyle {
    // 圆圈中的数字
    num: number,
    // 圆圈的线条宽度
    strokeWidth: number,
    // 圆圈的线条颜色
    strokeColor: string,
    // 圆圈的填充颜色
    fillColor: string,
    // 圆圈中数字的字体，如：'Arial'
    fontName: string,
    // 圆圈中数字的字体大小，如：'16px'
    fontSize: string,
    // 圆圈中数字的字体颜色
    fontColor: string,
    // 圆圈中的数字到圆圈之间的空隙的最小值
    padding: number
}

// 带圆圈的数字光标
export class CircleNumber extends Cursor {

    private readonly _style: CircleNumberStyle;
    private _diameter: number;

    constructor(cursorEffectElement: HTMLElement, style?: CircleNumberStyle) {
        super(cursorEffectElement);
        const cursor = this;
        const handler: ProxyHandler<CircleNumberStyle> = {
            get(target: CircleNumberStyle, propKey: string) {
                return Reflect.get(target, propKey);
            },
            set(target: CircleNumberStyle, propKey: string , newValue: any) {
                Reflect.set(target, propKey, newValue);
                cursor.updateCursorShape();
                return true;
            }
        };
        if(style){
            this._style = new Proxy(style, handler);
        }else {
            this._style = new Proxy({
                num: 1,
                strokeWidth: 0,
                strokeColor: 'red',
                fillColor: 'red',
                fontName: 'Arial',
                fontSize: '16px',
                fontColor: 'white',
                padding: 8
            }, handler);
        }
        const textMetrics = this.detectTextWidth();
        this._diameter = this.calculateDiameter(textMetrics);
    }

    getShape(textMetrics: TextMetrics) {
        const diameter = this.calculateDiameter(textMetrics);

        // 半径
        const radius = this._diameter / 2;
        return `
          <svg xmlns="http://www.w3.org/2000/svg">
            <circle
              cx="${radius}"
              cy="${radius}"
              r="${radius}"
              fill="${this._style.fillColor}"
              stroke="${this._style.strokeColor}"
              stroke-width="${this._style.strokeWidth}" 
            />
            <text
              x="${radius}" 
              y="${radius+(textMetrics.actualBoundingBoxAscent)/2}"  
              font-family="${this._style.fontName}"  
              font-size="${this._style.fontSize}"        
              fill="${this._style.fontColor}"        
              text-anchor="middle"     
            >
              ${this._style.num}
            </text>
          </svg>
       `;
    }

    getSVG(){
        const textMetrics = this.detectTextWidth();
        const shape = this.getShape(textMetrics);
        const parser = new DOMParser();
        const svgDoc = parser.parseFromString(shape, "image/svg+xml");

        // 获取解析后的SVG根元素
        const svgElement = svgDoc.documentElement;
        svgElement.setAttribute('width', `${this._diameter}`);
        svgElement.setAttribute('height', `${this._diameter}`);

        // 创建一个XMLSerializer实例
        const serializer = new XMLSerializer();

        // 序列化SVG内容为字符串
        return serializer.serializeToString(svgElement);
    }

    // 计算圆圈的直径
    private calculateDiameter(textMetrics: TextMetrics) {
        const textWidth = textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft;
        const textHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
        let max = Math.max(textWidth, textHeight)

        return max + this._style.padding * 2;
    }

    detectTextWidth(): TextMetrics {
        const canvas = document.createElement('canvas');
        const context= canvas.getContext('2d');
        if (context == null) {
            throw new Error('Failed to getContext 2d');
        }
        context.font = `${this._style.fontSize} ${this._style.fontName}`;
        context.textAlign= 'center';
        return context.measureText(`${this._style.num}`);
    }

    calculateCursorLeftTopPos(event: MouseEvent): CursorLeftTopPos {
        const diameter = this._diameter;
        const left = (event.pageX - diameter/2);
        const top = (event.pageY - diameter/2);
        return {
            left, top
        }
    }

    updateCursorShape(): void {
        const textMetrics = this.detectTextWidth();
        console.log('textMetrics', textMetrics);

        const shape = this.getShape(textMetrics);
        console.log('CircleNumber shape:', shape);

        const encoded = btoa(shape);
        const dataURL = `data:image/svg+xml;base64,${encoded}`

        this._diameter = this.calculateDiameter(textMetrics);
        this.mouse.style.background = `url(${dataURL}) no-repeat center center`;
        this.mouse.style.width = this._diameter + 'px';
        this.mouse.style.height = this._diameter + 'px';
    }

    get style(){
        return this._style;
    }

    get diameter(): number {
        return this._diameter;
    }
}