export class HistoryController {

    protected history: string[] = [];
    protected cursor: number = 0;

    constructor(protected maxLength: number = 100) {

    }

    push(entry: string): void {
        if (this.history.length >= this.maxLength) {
            this.history.shift();
        }
        this.history.push(entry);
        this.cursor = this.history.length;
    }

    getPrevious(): string {
        if (this.cursor > 0) {
            this.cursor--;
        }
        return this.history[this.cursor];
    }

    getNext(): string {
        if (this.cursor < this.history.length) {
            this.cursor++;
        }
        return this.history[this.cursor] || null;
    }
}
