import {ICommandArgs, ISuggestion, ISuggestionMap, ITerminal} from "../common-types";

export class SuggestionEngine {

    protected suggestions: Array<ISuggestion>;
    protected suggestionIx: number;
    protected masked: boolean;

    get done(): boolean {
        return this.suggestions === null;
    }

    get current(): ISuggestion {
        return !this.suggestions ? null : this.suggestions[this.suggestionIx] || null;
    }

    constructor(protected commands: () => Promise<string[]>,
                protected suggestionMap: ISuggestionMap,
                protected cb: (suggestion: ISuggestion) => void) {
        this.suggestions = [];
        this.suggestionIx = 0;
    }

    async suggest(args: ICommandArgs, terminal: ITerminal): Promise<void> {
        this.suggestions = [];
        this.cb({id: null, label: " "});
        try {
            if (args.length < 2) {
                this.suggestions = (await this.commands()).map(t => ({id: t, label: t}))
            } else {
                const cb = this.suggestionMap[args.command];
                const suggestions = !cb ? null : await cb(args, terminal);
                this.suggestions = suggestions?.map(t => {
                    const suggestion = typeof t === "string" ? {id: t, label: t} : t;
                    suggestion.label = suggestion.label || (suggestion.id ?? "").toString();
                    return suggestion;
                }) || null;
            }
            this.masked = this.suggestions?.some(t => t.masked) || false;
        } catch (e) {
            this.suggestions = [{
                id: "error",
                error: `${e}`,
                masked: this.masked
            }];
        }
        if (this.suggestions) {
            const last = args.search;
            this.suggestions = this.suggestions.filter(s => {
                return !last || s.showAlways || s.error || s.label.toLowerCase().indexOf(last) >= 0;
            });
            this.suggestionIx = Math.min(Math.max(0, this.suggestions.length - 1), this.suggestionIx);
        }
        this.cb(this.current);
    }

    suggestAround(max: number = 9): {suggestions: Array<ISuggestion>, maxLength: number} {
        const suggestions = Array.from(this.suggestions || []).filter(t => t.error || !t.masked);
        if (suggestions.length < max) {
            for (let i = suggestions.length; i < max; i++) {
                suggestions.push({id: "", label: ""});
            }
        } else {
            const ix = this.suggestionIx;
            const len = Math.floor(max / 2);
            const all = this.suggestions.length;
            suggestions.length = 0;
            suggestions.push(this.suggestions[ix]);
            for (let i = 1; i < len; i++) {
                suggestions.unshift(this.suggestions[(ix - i + all) % all]);
                suggestions.push(this.suggestions[(ix + i) % all]);
            }
        }
        const itemsMax = (this.suggestions || suggestions).reduce((max, s) => {
            return Math.max(max,s.error?.length ?? 0, s.label?.length ?? 0);
        }, 0);
        const maxLength = itemsMax > 0 ? Math.max(itemsMax + 1, 5) : 0;
        return {suggestions, maxLength};
    }

    prev(): void {
        if (this.suggestions && this.suggestions.length > 0) {
            this.suggestionIx = (this.suggestionIx - 1 + this.suggestions.length) % this.suggestions.length;
            this.cb(this.current);
        }
    }

    next(): void {
        if (this.suggestions && this.suggestions.length > 0) {
            this.suggestionIx = (this.suggestionIx + 1) % this.suggestions.length;
            this.cb(this.current);
        }
    }
}
