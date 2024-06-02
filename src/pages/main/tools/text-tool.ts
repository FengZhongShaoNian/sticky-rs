import {AbstractAnnotationTool} from "./abstract-annotation-tool.ts";
import {ToolName} from "../../../common/tool-name.ts";
import {GraphContainer} from "../graphs/graph.ts";
import {Text} from "../graphs/text.ts";
import {TextCursor} from "../cursor.ts";

export class TextTool extends AbstractAnnotationTool {

    private textEditors: Array<HTMLElement>;

    private customCursor: TextCursor;

    constructor(container: GraphContainer, touchpad: HTMLElement) {
        super(container, touchpad);
        this.textEditors = new Array<HTMLDivElement>();
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
        for (let textEditor of this.textEditors) {
            console.log('移除编辑器', textEditor);
            document.body.removeChild(textEditor);
        }
        this.textEditors = [];
    }

    getTextContent(editor: HTMLElement){
        return editor.textContent == null? '' : editor.textContent;
    }

    onMouseDown(mouseDownEvent: MouseEvent): void {
        const editorMaxWidth = window.innerWidth - mouseDownEvent.x;
        const editor = document.createElement('div');
        editor.classList.add('text-editor');
        editor.setAttribute('contenteditable', 'plaintext-only');
        editor.style.color = this.styleContext.strokeColor;
        editor.style.left = mouseDownEvent.x + 'px';
        editor.style.top = mouseDownEvent.y + 'px';
        editor.style.font = `normal normal ${this.styleContext.strokeWidth}px sans-serif`;
        editor.style.maxWidth = editorMaxWidth + 'px';

        document.body.appendChild(editor);
        this.textEditors.push(editor);

        editor.focus();

        const cssStyle = window.getComputedStyle(editor);
        const editorHeight = Number.parseInt(cssStyle.getPropertyValue('height')
            .replace('px', ''));
        console.log(`文本编辑器的初始高度：${editorHeight}px`);

        editor.style.lineHeight = `${editorHeight}px`;

        const text = new Text({
            x: mouseDownEvent.x,
            y: mouseDownEvent.y + editorHeight / 2,
            font: editor.style.font,
            fontColor: editor.style.color,
            lineHeight: editorHeight,
            maxWidth: editorMaxWidth,
            visible: false
        });
        this.add(text);

        editor.addEventListener('blur', () => {
            const content = this.getTextContent(editor);
            text.set({
                content,
                font: editor.style.font,
                fontColor: editor.style.color,
                lineHeight: editorHeight,
                maxWidth: editorMaxWidth,
                visible: true,
            });
        });

        editor.addEventListener('keydown', (event)=>{
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

    onMouseMove(_mouseMoveEvent: MouseEvent): void {
    }

}