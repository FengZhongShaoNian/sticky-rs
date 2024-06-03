import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Text} from "../graphs/text.ts";
import {TextCursor} from "../cursor.ts";

interface TextEditorStyle {
    x: number,
    y: number
    color: string,
    // 字体，例如：'normal normal 14px sans-serif'
    font: string
}
class TextEditor {
    private readonly element: HTMLElement;
    private readonly text: Text;
    private style: TextEditorStyle;
    private readonly initialHeight: number;

    constructor(style: TextEditorStyle) {
        this.style = style;
        this.element = document.createElement('div');
        this.element.classList.add('text-editor');
        this.element.setAttribute('contenteditable', 'plaintext-only');
        this.element.style.color = this.style.color;
        this.element.style.left = style.x + 'px';
        this.element.style.top = style.y + 'px';
        this.element.style.font = this.style.font;
        this.element.style.maxWidth = this.calculateElementMaxWidth() + 'px';

        document.body.appendChild(this.element);
        this.element.focus();

        this.initialHeight = TextEditor.getElementHeight(this.element);
        console.log('编辑器元素的初始高度：%d', this.initialHeight);

        const lineHeight = this.calculateLineHeight();
        this.element.style.lineHeight = lineHeight + 'px';

        this.text = new Text({
            x: style.x,
            y: style.y + lineHeight / 2,
            font: style.font,
            fontColor: style.color,
            lineHeight: lineHeight,
            maxWidth: this.element.offsetWidth,
            visible: false
        });

        this.handleInput();
    }

    private handleInput() {
        this.element.addEventListener('input', ()=>{
            this.updateText(false);
        });

        this.element.addEventListener('focusout', () => {
            this.updateText(true);
            // 在失去焦点的情况下隐藏编辑器
            this.hide();
        });

        this.element.addEventListener('keydown', (event)=>{
            // 在回车换行时插入换行符
            if (event.key === 'Enter') {
                // 获取当前光标位置的文本节点
                let selection = window.getSelection();
                if (selection && selection.rangeCount > 0) {
                    let range = selection.getRangeAt(0);
                    let node = range.startContainer;

                    // 如果节点是文本节点，则在其末尾插入换行符
                    if (node.nodeType === Node.TEXT_NODE) {
                        let newNode = document.createTextNode('\n');
                        range.deleteContents(); // 删除当前选中的内容（如果有）
                        range.insertNode(newNode); // 插入新的文本节点

                        // 更新光标位置
                        range.setStartAfter(newNode);
                        range.collapse(true);
                        selection.removeAllRanges();
                        selection.addRange(range);
                    }
                }
            }
        }, true);
    }

    updateText(visible: boolean){
        const content = this.getElementTextContent();
        this.text.set({
            content,
            font: this.style.font,
            fontColor: this.style.color,
            lineHeight: this.calculateLineHeight(),
            maxWidth: this.element.offsetWidth,
            visible,
        });
    }

    remove(){
        this.updateText(true);
        document.body.removeChild(this.element);
    }

    getText(){
        return this.text;
    }

    private getElementTextContent(){
        return this.element.textContent == null? '' : this.element.textContent;
    }

    private calculateElementMaxWidth(){
        return window.innerWidth - this.style.x;
    }

    static getElementHeight(element: HTMLElement){
        const cssStyle = window.getComputedStyle(element);
        return parseInt(cssStyle.getPropertyValue('height').replace('px', ''));
    }

    private static getFontSize(element: HTMLElement) {
        const style = window.getComputedStyle(element);
        return parseInt(style.fontSize);
    }

    private calculateLineHeight(){
        if(this.initialHeight === undefined){
            throw new Error('initialHeight === undefined');
        }

        const fontSize = TextEditor.getFontSize(this.element);
        let lineHeight = fontSize * 1.4;
        if(this.initialHeight > lineHeight){
            lineHeight = this.initialHeight;
        }
        return lineHeight;
    }

    show(){
        if(this.element.classList.contains('hidden-text-editor')){
            this.element.classList.remove('hidden-text-editor');
            console.log('重新显示编辑器', this.element);
        }
        this.element.focus();
    }

    hide(){
        if(!this.element.classList.contains('hidden-text-editor')){
            this.element.classList.add('hidden-text-editor');
            console.log('已经隐藏编辑器', this.element);
        }
    }

    getBoundingClientRect() {
        return this.element.getBoundingClientRect();
    }
}

export class TextTool extends AbstractAnnotationTool {

    private editors: Array<TextEditor>;
    private customCursor: TextCursor;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.editors = new Array<TextEditor>();
        this.styleContext.strokeWidth = 14;
        this.styleContext.strokeColor = 'red';
        this.customCursor = new TextCursor(touchpad);
    }

    name(): string {
        return ToolName.TEXT_TOOL;
    }

    active() {
        super.active();
        this.customCursor.active();
    }

    deactive() {
        super.deactive();
        this.customCursor.deactive();
        this.removeAllEditors();
    }


    removeAllEditors() {
        for (let editor of this.editors) {
            editor.remove();
        }
        this.editors = [];
    }

    findTextEditorByCursor(x: number, y: number){
        for (let i = this.editors.length - 1; i >= 0; i--) {
            const editor = this.editors[i];
            let boundingClientRect = editor.getBoundingClientRect();
            if(x >= boundingClientRect.x && x <= boundingClientRect.x + boundingClientRect.width
            && y >= boundingClientRect.y && y <= boundingClientRect.y + boundingClientRect.height){
                return editor;
            }
        }
    }

    onMouseDown(mouseDownEvent: MouseEvent): void {
        // 避免编辑器失去焦点
        mouseDownEvent.preventDefault();

        if(this.editors.length > 0){
            // 检查鼠标下面是否存在编辑器
            const cursorHeight = this.customCursor.style.height;
            let x = mouseDownEvent.x;
            let y = mouseDownEvent.y;
            let editor = this.findTextEditorByCursor(x, y) ||
                this.findTextEditorByCursor(x, y + cursorHeight/2) ||
                this.findTextEditorByCursor(x, y + cursorHeight);
            if(editor){
                console.log('鼠标点击的位置存在编辑器', editor);
                editor.show();
                return;
            }
        }

        const editor = new TextEditor({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            color: this.styleContext.strokeColor,
            font: 'normal normal 14px sans-serif'
        });

        this.editors.push(editor);
        this.add(editor.getText());
    }

    onMouseMove(_mouseMoveEvent: MouseEvent): void {
    }

}