const frames = "⣾⣽⣻⢿⡿⣟⣯⣷";

export class Spinner {

    protected index: number;
    protected interval: any;

    get running(): boolean {
        return !!this.interval;
    }

    constructor(protected cb: (frame: string) => void) {
        this.index = 0;
        this.interval = null;
    }

    start(): void {
        if (this.interval) return;
        this.index = 0;
        this.interval = setInterval(() => {
            this.cb(frames[this.index++ % frames.length]);
        }, 100);
    }

    stop(): void {
        if (!this.interval) return;
        clearInterval(this.interval);
        this.interval = null;
    }
}
