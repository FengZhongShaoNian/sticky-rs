import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {GraphContainer, Observer, TypedObservable} from "../graphs/graph.ts";
import {Text} from "../graphs/text.ts";
import {TextCursor} from "../cursor.ts";
import {i18n} from "../../../common/translation.ts";

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
    // element是否获得了焦点
    private _isFocus: boolean;

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
        this.element.title = i18n.t('graph.textEditorMovementTips');

        document.body.appendChild(this.element);
        this.element.focus();
        this._isFocus = true;

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

        this.handleEvents();
    }

    private handleEvents() {
        this.element.addEventListener('input', ()=>{
            this.updateText(false);
        });

        this.element.addEventListener('focus', ()=> {
            this._isFocus = true;
        })
        this.element.addEventListener('focusout', () => {
            this.updateText(true);
            // 在失去焦点的情况下隐藏编辑器
            this.hide();
            this._isFocus = false;
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

    addWheelEventListener(listener: EventListenerOrEventListenerObject){
        this.element.addEventListener('wheel', listener);
    }

    updateText(visible: boolean){
        const style = window.getComputedStyle(this.element);
        const left = parseInt(style.left.replace('px', ''));
        const top = parseInt(style.top.replace('px', ''));
        const lineHeight = parseInt(style.lineHeight.replace('px', ''));
        const content = this.getElementTextContent();

        this.text.set({
            x: left,
            y: top + lineHeight / 2,
            content,
            font: style.font,
            fontColor: style.color,
            lineHeight,
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

    setFontSize(fontSize: number) {
        this.element.style.fontSize = fontSize + 'px';
        const lineHeight = this.calculateLineHeight();
        this.element.style.lineHeight = lineHeight + 'px';
    }

    private calculateLineHeight(){
        if(this.initialHeight === undefined){
            throw new Error('initialHeight === undefined');
        }

        const fontSize = TextEditor.getFontSize(this.element);
        let lineHeight = Math.floor(fontSize * 1.35);
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

    isFocus(){
        return this._isFocus;
    }

    moveTo(x: number, y: number) {
        this.style.x = x;
        this.style.y = y;
        this.element.style.left = x + 'px';
        this.element.style.top = y + 'px';
        this.element.style.maxWidth = this.calculateElementMaxWidth() + 'px';
        this.updateText(false);
    }
}

interface StyleContext {
    fontColor: string,
    fontSize: number
}
export class TextTool extends AbstractAnnotationTool implements Observer {

    private readonly styleContext: StyleContext;

    private readonly editors: Map<TextEditor, Text>;
    private customCursor: TextCursor;

    // 记录由于对应的Text被UndoAdd而导致被隐藏的TextEditor
    private readonly editorsHiddenByUndoAdd: Set<TextEditor>;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.ignoreNonLeftMouseButtonEvents = false;
        this.styleContext = {
            fontColor: 'red',
            fontSize: 14
        }
        this.editors = new Map<TextEditor, Text>;
        this.customCursor = new TextCursor(touchpad);
        this.editorsHiddenByUndoAdd = new Set<TextEditor>();
    }

    name(): string {
        return ToolName.TEXT_TOOL;
    }

    active() {
        super.active();
        this.customCursor.active();
        this.container.addObserver(this);
    }

    deactive() {
        super.deactive();
        this.customCursor.deactive();
        this.removeAllEditors();
        this.container.removeObserver(this);
    }


    removeAllEditors() {
        for (let [editor, text] of this.editors) {
            editor.remove();
        }
        this.editors.clear();
        this.editorsHiddenByUndoAdd.clear();
    }

    // 移除所有由于UndoAdd而被隐藏的编辑器
    removeHiddenEditors(){
        for (let hiddenEditor of this.editorsHiddenByUndoAdd) {
            hiddenEditor.remove();
            this.editors.delete(hiddenEditor);
        }
        this.editorsHiddenByUndoAdd.clear();
    }

    findTextEditorByCursor(x: number, y: number){
        for (let editor of this.editors.keys()) {
            let boundingClientRect = editor.getBoundingClientRect();
            if(x >= boundingClientRect.x && x <= boundingClientRect.x + boundingClientRect.width
                && y >= boundingClientRect.y && y <= boundingClientRect.y + boundingClientRect.height){
                return editor;
            }
        }
    }

    findFocusEditor(){
        for (let editor of this.editors.keys()) {
            if(editor.isFocus()){
                return editor;
            }
        }
    }

    onMouseDown(mouseDownEvent: MouseEvent): void {
        if(mouseDownEvent.buttons != 1){
            // 由于按下的不是鼠标左键，所以忽略
            return;
        }
        // 避免编辑器失去焦点
        mouseDownEvent.preventDefault();

        if(this.editors.size > 0){
            // 检查鼠标下面是否存在编辑器
            const cursorHeight = this.customCursor.style.height;
            let x = mouseDownEvent.x;
            let y = mouseDownEvent.y;
            let editor = this.findTextEditorByCursor(x, y) ||
                this.findTextEditorByCursor(x, y + cursorHeight/2) ||
                this.findTextEditorByCursor(x, y + cursorHeight);

            // 之所以要判断editor是否是由于UndoAdd而被隐藏起来的编辑器，是因为由于UndoAdd而被隐藏的编辑器只应由RedoAdd操作而重新展示
            if(editor && !this.editorsHiddenByUndoAdd.has(editor)){
                console.log('鼠标点击的位置存在编辑器', editor);
                editor.show();
                return;
            }
        }

        const editor = new TextEditor({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y,
            color: this.styleContext.fontColor,
            font: `normal normal ${this.styleContext.fontSize}px sans-serif`
        });

        editor.addWheelEventListener((wheelEvent)=>{
            this.onWheel(wheelEvent as WheelEvent);
        });

        const text = editor.getText();
        this.editors.set(editor, text);
        this.add(text);

        // 如果此前存在由于被UndoAdd隐藏的编辑器，那么移除它，因为一旦往容器中添加新的图形，RedoAdd将不可用
        // 所以这些由于UndoAdd而被隐藏的编辑器已经没用了
        this.removeHiddenEditors();
    }

    onMouseMove(mouseMoveEvent: MouseEvent): void {
        if(mouseMoveEvent.altKey){
            const editor = this.findFocusEditor();
            if(editor){
                editor.moveTo(mouseMoveEvent.x, mouseMoveEvent.y);
            }
        }
    }

    update(_observable: TypedObservable): void {
        // 当某个Text被UndoAdd或者RedoAdd的时候，把对应的编辑器隐藏/展示
        const textsInContainer = new Set<Text>();
        for (let containerElement of this.container) {
            if(containerElement instanceof Text){
                textsInContainer.add(containerElement);
            }
        }

        this.editors.forEach((text, editor)=>{
            if(!textsInContainer.has(text)){
                // 说明Text已经被UndoAdd了
                // 需要确保对应的编辑器也被隐藏
                console.log('检测到Text已经被UndoAdd了：', text);
                if(!this.editorsHiddenByUndoAdd.has(editor)){
                    editor.hide();
                    this.editorsHiddenByUndoAdd.add(editor);
                }
            }
        });

        for (let hiddenEditor of this.editorsHiddenByUndoAdd) {
            const text = this.editors.get(hiddenEditor);
            if(text && textsInContainer.has(text)){
                // 说明Text被RedoAdd
                // 重新展示对应的编辑器
                console.log('检测到Text已经被RedoAdd了：', text);
                hiddenEditor.show();
                this.editorsHiddenByUndoAdd.delete(hiddenEditor);
            }
        }
    }


    onWheel(wheelEvent: WheelEvent): void {
        const MIN_FONT_SIZE = 14;
        const MAX_FONT_SIZE = 32;
        console.log('onWheel ', wheelEvent);

        let scrollUp = TextTool.isScrollUp(wheelEvent);
        if(scrollUp){
            this.styleContext.fontSize = Math.min(this.styleContext.fontSize+1, MAX_FONT_SIZE);
        }else {
            this.styleContext.fontSize = Math.max(this.styleContext.fontSize-1, MIN_FONT_SIZE);
        }
        const editor = this.findFocusEditor();
        console.log('获得焦点的编辑器', editor);
        if(editor){
            editor.setFontSize(this.styleContext.fontSize);
        }
    }
}