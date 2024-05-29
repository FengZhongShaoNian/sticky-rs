import {Group, UI} from "leafer-ui";
import {Stack} from "../../common/stack.ts";

export interface UIContainer {
    add: (child: UI)=>void;
}

export class UndoRedoStack implements UIContainer {

    private group: Group;
    private undoStack: Stack<UI>;
    private redoStack: Stack<UI>;

    constructor(group: Group) {
        this.group = group;
        this.undoStack = new Stack<UI>();
        this.redoStack = new Stack<UI>();
    }

    add(child: UI): void {
        this.group.add(child);
        this.undoStack.push(child);
        this.redoStack.clear();
    }

    undoAdd(){
        if(!this.undoStack.isEmpty()){
            const child = this.undoStack.pop();
            this.redoStack.push(child);
            this.group.remove(child, false);
        }
    }

    redoAdd(){
        console.log('redoAdd invoked，redoStack:', this.redoStack.size())
        if(!this.redoStack.isEmpty()){
            const child = this.redoStack.pop();
            this.group.add(child);
            this.undoStack.push(child);
        }
    }
}