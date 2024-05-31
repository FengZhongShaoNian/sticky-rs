export class Stack<T> implements Iterable<T>{
    private items: T[] = [];
    private count: number = 0;

    push(item: T): void {
        if(item == null){
            throw new Error("item should not be null");
        }
        this.items.push(item);
        this.count++;
    }

    pop(): T {
        if(this.count > 0){
            let item = this.items.pop() as T;
            this.count--;
            return item;
        }else {
            throw new Error('Failed to pop stack element because stack is empty!');
        }
    }

    peek(): T | undefined {
        if(this.count === 0){
            return undefined;
        }
        return this.items[this.count - 1];
    }

    peekAt(index: number){
        if(index >= 0 && index < this.size()){
            return this.items[index];
        }
        return undefined;
    }

    isEmpty(): boolean {
        return this.count === 0;
    }

    size(): number {
        return this.count;
    }

    clear(): void {
        this.items = [];
        this.count = 0;
    }

    [Symbol.iterator](): Iterator<T> {
        return new StackIterator(this.items, this.count);
    }
}

class StackIterator<T> implements Iterator<T>{
    private readonly items: T[] = [];
    private readonly count: number = 0;
    private index = -1;

    constructor(items: T[], count: number) {
        this.items = items;
        this.count = count;
    }

    next(): IteratorResult<T, any> {
       this.index++;
       if(this.index < this.count){
           return {
               value: this.items[this.index],
               done: false
           }
       }
       return {
           value: null,
           done: true
       }
    }

}