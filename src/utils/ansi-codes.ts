const ESC = "\u001B[";
const OSC = "\u001B]";
const BEL = "\u0007";
const SEP = ";";

export enum ConsoleColor {
    Reset = "\x1b[0m",
    Bright = "\x1b[1m",
    Dim = "\x1b[2m",
    Underscore = "\x1b[4m",
    Blink = "\x1b[5m",
    Reverse = "\x1b[7m",
    Hidden = "\x1b[8m",

    FgBlack = "\x1b[30m",
    FgRed = "\x1b[31m",
    FgGreen = "\x1b[32m",
    FgYellow = "\x1b[33m",
    FgBlue = "\x1b[34m",
    FgMagenta = "\x1b[35m",
    FgCyan = "\x1b[36m",
    FgWhite = "\x1b[37m",
    FgDefault = "\x1b[38m",

    FgLightBlack = "\x1b[90m",
    FgLightRed = "\x1b[91m",
    FgLightGreen = "\x1b[92m",
    FgLightYellow = "\x1b[93m",
    FgLightBlue = "\x1b[94m",
    FgLightMagenta = "\x1b[95m",
    FgLightCyan = "\x1b[96m",
    FgLightWhite = "\x1b[97m",

    BgBlack = "\x1b[40m",
    BgRed = "\x1b[41m",
    BgGreen = "\x1b[42m",
    BgYellow = "\x1b[43m",
    BgBlue = "\x1b[44m",
    BgMagenta = "\x1b[45m",
    BgCyan = "\x1b[46m",
    BgWhite = "\x1b[47m",
    BgDefault = "\x1b[48m",

    BgLightBlack = "\x1b[100m",
    BgLightRed = "\x1b[101m",
    BgLightGreen = "\x1b[102m",
    BgLightYellow = "\x1b[103m",
    BgLightBlue = "\x1b[104m",
    BgLightMagenta = "\x1b[105m",
    BgLightCyan = "\x1b[106m",
    BgLightWhite = "\x1b[107m"
}

export enum Keys {
    Enter = "enter",
    Escape = "escape",
    Backspace = "backspace",
    Tab = "tab",
    Up = "up",
    Down = "down",
    Left = "left",
    Right = "right",
    Delete = "delete"
}

export class AnsiCodes {

    static readonly eraseLine = ESC + "2K";

    static readonly cursorNextLine = ESC + "E";

    static readonly cursorPrevLine = ESC + "F";

    static readonly clear = "\x1bc";

    static readonly prompt = "$ ";

    static cursorUp(count: number = 1): string {
        return count < 1 ? "" : ESC + count + "A";
    }

    static cursorDown(count: number = 1): string {
        return count < 1 ? "" : ESC + count + "B";
    }

    static cursorForward(count: number = 1): string {
        return count < 1 ? "" : ESC + count + "C";
    }

    static cursorBackward(count: number = 1): string {
        return count < 1 ? "" : ESC + count + "D";
    }

    static colorize(text: string, color: ConsoleColor | ConsoleColor[], reset: ConsoleColor = ConsoleColor.Reset): string {
        const colors = (Array.isArray(color) ? color : [color]).join("");
        return `${colors}${text}${reset}`;
    }

    static parseKey(data: string): Keys {
        const code = data.charCodeAt(0);
        switch (code) {
            case 13: // enter
                return Keys.Enter;
            case 27: // escape
                const start = data.substring(1, 3);
                switch (start) {
                    case "[A": // Up arrow
                        return Keys.Up;
                    case "[B": // Down arrow
                        return Keys.Down;
                    case "[C": // Right arrow
                        return Keys.Right;
                    case "[D": // Left arrow
                        return Keys.Left;
                    case "[3": // Delete
                        return Keys.Delete;
                }
                return Keys.Escape;
            case 127: // backspace
                return Keys.Backspace;
            case 9: // tab
                return Keys.Tab;
        }
        return null;
    }
}
