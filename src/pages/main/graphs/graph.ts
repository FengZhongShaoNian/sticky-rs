import {Stack} from "../../../common/stack.ts";

export interface TypedObservable{
    // 用于识别当前的 Observable 的类型
    typeName(): string;

    addObserver(observer: Observer): void;
    removeObserver(observer: Observer): void;
    notifyObservers(): void;
}

export interface Observer {
    update(observable: TypedObservable): void;
}

export enum ObservableTypeName {
    Graph = "Graph",
    GraphContainer = "GraphContainer"
}

export interface Renderer extends Observer{
    render(graph: Graph): void;
}

abstract class AbstractObservable implements TypedObservable {
    private readonly observers: Set<Observer> = new Set<Observer>();

    abstract typeName(): string;

    addObserver(observer: Observer): void {
        this.observers.add(observer);
    }

    notifyObservers(): void {
        for (let observer of this.observers){
            observer.update(this);
        }
    }

    removeObserver(observer: Observer): void {
        this.observers.delete(observer);
    }
}

export interface BackgroundImageExtractor {
    getImageData(x: number, y: number, width: number, height: number): ImageData;
}

export interface Graph extends TypedObservable{
    render(ctx: CanvasRenderingContext2D): void;
    scale(scalingRatio: number): void;
    // 当该方法存在的时候，每次渲染的时候，渲染器都会先调用该方法传入BackgroundImageExtractor，使得该Graph可以获取背景的指定区域的画面
    backgroundImageAware?(backgroundImageExtractor: BackgroundImageExtractor): void;
}

export abstract class AbstractGraph extends AbstractObservable implements Graph {

    protected constructor() {
        super();
    }

    typeName(): string {
        return ObservableTypeName.Graph;
    }

    update(): void {
        this.notifyObservers();
    }

    abstract render(ctx: CanvasRenderingContext2D): void;
    abstract scale(scalingRatio: number): void;
}

export class GraphContainer extends AbstractObservable implements Iterable<Graph>, Observer{
    private readonly undoStack: Stack<Graph>;
    private readonly redoStack: Stack<Graph>;

    constructor() {
        super();
        this.undoStack = new Stack<Graph>();
        this.redoStack = new Stack<Graph>();
    }

    typeName(): string {
        return ObservableTypeName.GraphContainer;
    }

    add(graph: Graph): void {
        graph.addObserver(this);
        this.undoStack.push(graph);
        this.redoStack.clear();
        this.notifyObservers();
    }

    undoAdd(){
        if(!this.undoStack.isEmpty()){
            const graph = this.undoStack.pop();
            this.redoStack.push(graph);
            this.notifyObservers();
        }
    }

    redoAdd(){
        if(!this.redoStack.isEmpty()){
            const graph = this.redoStack.pop();
            this.undoStack.push(graph);
            this.notifyObservers();
        }
    }

    [Symbol.iterator](): Iterator<Graph> {
        return this.undoStack[Symbol.iterator]();
    }

    update(_observable: TypedObservable): void {
        this.notifyObservers();
    }

}
