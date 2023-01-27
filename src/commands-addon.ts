import {ICommandMap, ICommandsAddonOptions, ITerminal, ITerminalAddon} from "./common-types";
import {AnsiCodes, ConsoleColor, Keys} from "./utils/ansi-codes";
import {HistoryController} from "./utils/history";
import {CommandArgs} from "./utils/command-args";
import {Spinner} from "./utils/spinner";
import {SuggestionEngine} from "./utils/suggestion-engine";

export class CommandsAddon implements ITerminalAddon {

    protected commandMap: ICommandMap;
    protected commands: string[];
    protected suggestions: SuggestionEngine;
    protected current: string;
    protected shadow: string;
    protected args: CommandArgs;
    protected history: HistoryController;
    protected spinner: Spinner;
    protected terminal: ITerminal;

    constructor(options: ICommandsAddonOptions) {
        this.commandMap = options.commands;
        this.commands = Object.keys(this.commandMap);
        this.suggestions = new SuggestionEngine(
            options.suggestCommands || (async () => this.commands),
            options.suggestions || {},
            suggestion => {
                const label = suggestion?.label || "";
                const masked = suggestion?.masked || false;
                const showAlways = suggestion?.showAlways || false;
                const underScore = masked ? "" as ConsoleColor : ConsoleColor.Underscore;
                // Clear line always and add prompt
                this.terminal.write("\r\x1B[K" + AnsiCodes.prompt);
                const last = this.args.length - 1;
                this.args.forEach((arg, ix) => {
                    if (ix > 0) {
                        this.terminal.write(" ");
                    }
                    if (last == ix) {
                        const down = AnsiCodes.cursorDown();
                        const {suggestions, maxLength} = this.suggestions.suggestAround();
                        const textLength = !label || showAlways ? arg.label.length : label.length;

                        // Write first quote
                        const quoted = arg.quoted || (label !== " " && label?.indexOf(" ") >= 0);
                        if (quoted) {
                            this.terminal.write(AnsiCodes.colorize(`"`, arg.quoted ? ConsoleColor.Reset : ConsoleColor.Dim));
                        }

                        // Write suggestions "dropdown"
                        const listWidth = Math.max(maxLength, textLength);
                        const listCursorBack = AnsiCodes.cursorBackward(listWidth);
                        suggestions.forEach(s => {
                            const label = s.error || s.label || "";
                            this.terminal.write(down + AnsiCodes.eraseLine);
                            if (label.length === 0) return;
                            let colors = s.id === suggestion.id
                                ? [ConsoleColor.BgGreen, ConsoleColor.FgLightGreen, ConsoleColor.Bright]
                                : ConsoleColor.BgBlack;
                            if (s.error) {
                                colors = [ConsoleColor.BgRed, ConsoleColor.FgLightRed, ConsoleColor.Bright];
                            }
                            this.terminal.write(
                                AnsiCodes.colorize(label.padEnd(listWidth), colors)
                                + listCursorBack
                            );
                        });
                        this.terminal.write(AnsiCodes.cursorUp(suggestions.length));

                        // Write suggestion or invalid arg
                        const done = this.suggestions.done;
                        if (!label) {
                            this.terminal.write(
                                AnsiCodes.colorize(
                                    masked ? arg.label.replace(/./g, "*") : arg.label,
                                    done ? ConsoleColor.Reset : [underScore, ConsoleColor.FgRed]
                                )
                            );
                        } else {
                            const markLabel = showAlways ? arg.label : label;
                            this.terminal.write(
                                AnsiCodes.colorize(
                                    masked ? markLabel.replace(/./g, "*") : markLabel,
                                    [underScore, ConsoleColor.Dim]
                                )
                            );
                        }

                        // Write last quote
                        if (quoted) {
                            const color = [arg.quoted && !arg.inQuote ? ConsoleColor.Reset : ConsoleColor.Dim];
                            if (label) {
                                color.push(underScore);
                            }
                            this.terminal.write(AnsiCodes.colorize(`"`, color));
                        }

                        // Move cursor back to end of input
                        const length = maxLength - (textLength + (quoted ? 1 : 0));
                        if (length > 0) {
                            this.terminal.write(
                                AnsiCodes.colorize(" ".repeat(length), [ConsoleColor.Reset, underScore])
                            );
                            this.terminal.write(AnsiCodes.cursorBackward(length));
                        }

                        if (!showAlways) {
                            this.terminal.write(AnsiCodes.cursorBackward(label.length + (quoted ? 1 : 0)));
                        }

                        // Write current matches
                        if (0 < arg.length && label && !showAlways) {
                            // Empty string exists infinite times in suggestion, so check length
                            const escapedLabel = (arg.label || "").replace(/[-[\]{}()*+?.,\\^$|#\s]/g, "\\$&");
                            const regex = new RegExp(`(${escapedLabel})`, "gi");
                            let res: RegExpExecArray;
                            let ix = 0;
                            while (res = regex.exec(label)) {
                                const match = masked ? res[0].replace(/./g, "*") : res[0];
                                this.terminal.write(AnsiCodes.cursorForward(res.index - ix));
                                this.terminal.write(AnsiCodes.colorize(match, [ConsoleColor.Reset, underScore]));
                                ix = res.index + res[0].length;
                            }
                        }
                        if (arg.quoted && !arg.inQuote) {
                            this.terminal.write(AnsiCodes.cursorForward());
                        }
                        if (done) {
                            this.terminal.write(`✓`);
                            this.terminal.write(AnsiCodes.cursorBackward());
                        }
                        return;
                    }
                    const argLabel = arg.masked ? arg.label.replace(/./g, "*") : arg.label;
                    this.terminal.write(arg.quoted ? `"${argLabel}"` : argLabel);
                });
            }
        )
        this.current = "";
        this.shadow = "";
        this.args = new CommandArgs();
        this.history = new HistoryController();
        this.spinner = new Spinner(frame => {
            this.terminal.write(AnsiCodes.colorize(frame, ConsoleColor.FgLightGreen));
            this.terminal.write(AnsiCodes.cursorBackward(frame.length));
        });
    }

    activate(term: ITerminal): void {
        this.terminal = term;
        this.suggest();
        // term key event for Input & Enter & Backspace
        this.terminal.onData((data) => {
            if (this.spinner.running) return;
            const code = AnsiCodes.parseKey(data);
            switch (code) {
                case Keys.Enter:
                    // Accept any suggestion
                    this.acceptSuggestion();
                    // Execute command
                    this.triggerCommand().then(res => {
                        if (!res) return;
                        this.current = "";
                        this.shadow = "";
                        this.suggest();
                    });
                    return;
                case Keys.Tab:
                    this.acceptSuggestion();
                    return;
                case Keys.Escape:
                    return;
                case Keys.Left:
                    // Move to previous history entry
                    // this.current = this.history.getPrevious() || this.current;
                    return;
                case Keys.Right:
                    // Move to next history entry
                    // this.current = this.history.getNext() || this.shadow;
                    return;
                case Keys.Up:
                    this.suggestions.prev();
                    return;
                case Keys.Down:
                    this.suggestions.next();
                    return;
                case Keys.Backspace:
                    // Remove last character
                    if (this.current.length > 0) {
                        this.current = this.current.substring(0, this.current.length - 1);
                    }
                    break;
                case Keys.Delete:
                    // Remove last argument
                    this.current = this.args.removeLast();
                    break;
                default:
                    if (this.suggestions.done) return;
                    switch (data) {
                        case ` `:
                            if (!this.args.inQuote && !this.args.quoted) {
                                this.acceptSuggestion();
                                return;
                            }
                            break;
                        case `"`:
                            if (this.args.inQuote) {
                                this.acceptSuggestion();
                                return;
                            } else if (this.args.hasInput && !this.args.quoted) {
                                return;
                            }
                            break;
                    }
                    this.current += data;
                    break;
            }
            this.suggest();
        });
    }

    dispose(): void {

    }

    suggest(): void {
        this.args.parse(this.current);
        this.spinner.start();
        this.suggestions.suggest(this.args, this.terminal).then(() => {
            this.spinner.stop();
        });
    }

    acceptSuggestion(): void {
        const suggestion = this.suggestions.current;
        if (suggestion && !suggestion.error) {
            this.spinner.start();
            this.args.replace(suggestion).then(res => {
                this.current = res;
                this.spinner.stop();
                this.suggest();
            });
        }
    }

    async triggerCommand(): Promise<boolean> {
        if (this.suggestions.done) {
            this.terminal.write(AnsiCodes.cursorNextLine);
            this.history.push(this.current.trim());
            this.spinner.start();
            try {
                await this.commandMap[this.args.command](this.args, this.terminal);
            } catch (e) {
                this.terminal.writeln(AnsiCodes.colorize(`${e}`, ConsoleColor.FgRed));
            }
            this.spinner.stop();
            return true;
        }
        return false;
    }
}
