import {ICommandArgs, ICommandArgument, ISuggestion} from "../common-types";

const defaultArg: ICommandArgument = {label: "", length: 0, inQuote: false, quoted: false};

export class CommandArgs implements ICommandArgs {

    protected args: ICommandArgument[];

    get length(): number {
        return this.args.length;
    }

    get command(): string {
        return `${this.at(0).label}`;
    }

    get search(): string {
        return this.last.label.toLowerCase();
    }

    get hasInput(): boolean {
        return this.last.label.length > 0;
    }

    get inQuote(): boolean {
        return this.last.inQuote;
    }

    get quoted(): boolean {
        return this.last.quoted;
    }

    protected get last(): ICommandArgument {
        return this.args[this.args.length - 1] || defaultArg;
    }

    constructor() {
        this.args = [];
    }

    at(index: number): ICommandArgument {
        return this.args[index] || defaultArg;
    }

    parse(cmd: string): void {
        const args: ICommandArgument[] = [];
        let arg: ICommandArgument = this.createArg(args.length);
        for (let i = 0; i < cmd.length; i++) {
            const c = cmd[i];
            if (c == `"`) {
                arg.inQuote = !arg.inQuote;
                arg.quoted = true;
            } else if (c == ` ` && !arg.inQuote) {
                args.push(arg);
                arg = this.createArg(args.length);
            } else {
                arg.label += c;
                arg.length++;
            }
        }
        args.push(arg);
        this.args = args;
    }

    async replace(s: ISuggestion): Promise<string> {
        const arg = this.last;
        if (s.onAccept) {
            try {
                s = await s.onAccept() ?? s;
            } catch (e) {
                s = {
                    id: s.id,
                    error: `${e}`
                };
            }
        }
        s.label = s.label || s.error || "Error";
        Object.assign(arg, s);
        arg.inQuote = false;
        arg.quoted = arg.quoted || s.label.indexOf(" ") >= 0;
        arg.length = arg.label.length;
        const suffix = s.error ? "" : " ";
        return this.args.map(arg => {
            return arg.quoted ? `"${arg.label}"` : arg.label;
        }).join(" ") + suffix;
    }

    removeLast(): string {
        const count = !this.hasInput ? 2 : 1;
        for (let i = 0; i < count; i++) {
            if (this.args.length > 1) {
                this.args.pop();
            } else {
                this.args[0] = Object.assign({}, defaultArg);
            }
        }
        const suffix = this.last.length > 0 ? " " : "";
        return this.args.map(arg => {
            return arg.quoted ? `"${arg.label}"` : arg.label;
        }).join(" ") + suffix;
    }

    forEach(cb: (arg: ICommandArgument, ix?: number) => void): void {
        this.args.forEach(cb);
    }

    protected createArg(ix: number): ICommandArgument {
        const arg = this.args[ix];
        return Object.assign({}, arg ?? {}, defaultArg);
    }
}
