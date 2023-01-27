export type ArgumentType = string | number | boolean;

export interface IDisposable {
    dispose(): void;
}

export interface ITerminalAddon extends IDisposable {
    activate(terminal: ITerminal): void;
}

export interface ITerminal extends IDisposable {
    onData: (cb: (data: string) => any) => IDisposable;
    write(data: string): void;
    writeln(data: string): void;
    loadAddon(addon: ITerminalAddon): void;
}

export interface ICommandArgument {
    label: string;
    length: number;
    inQuote: boolean;
    quoted: boolean;
    id?: ArgumentType;
    masked?: boolean;
    [key: string]: any;
}

export interface ICommandArgs {
    readonly length: number;
    readonly command: string;
    readonly search: string;

    at(index: number): ICommandArgument;
}

export interface ISuggestion {
    id: ArgumentType;
    label?: string;
    error?: string;
    masked?: boolean;
    onAccept?: () => Promise<ISuggestion>;
    showAlways?: boolean;

    [key: string]: any;
}

export interface ISuggestionMap {
    [cmd: string]: (args: ICommandArgs, terminal: ITerminal) => Promise<Array<ISuggestion | string>>;
}

export interface ICommandMap {
    [cmd: string]: (args: ICommandArgs, terminal: ITerminal) => Promise<void>;
}

export interface ICommandsAddonOptions {
    commands: ICommandMap;
    suggestCommands?: () => Promise<string[]>;
    suggestions?: ISuggestionMap;
}
