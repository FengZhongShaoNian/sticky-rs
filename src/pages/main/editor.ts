import {App, Rect} from "leafer-ui";

export class Editor {
    private app: App;
    private _editing: boolean;

    constructor(backgroundImage: string, width: number, height: number) {
        this.app = new App({
            view: window,
            ground: { type: 'draw' },
            tree: {},
            sky:  { type: 'draw' }
        });
        const backgroundRect = new Rect({
            width,
            height,
            fill: {
                type: 'image',
                url: backgroundImage,
            }
        });
        this.app.ground.add(backgroundRect);
        this._editing=false;
    }

    get editing(): boolean {
        return this._editing;
    }
}

export class AnnotationTool{

}