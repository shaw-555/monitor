import { _global, _support } from "./global";
const PREFIX = 'Monitor Logger';

export class Logger {
    private enabled = false;
    private _console: Console = {} as Console;
    constructor() {
        _global.console = console || _global.console;
        if (console || _global.console) {
            const logType = ['log', 'debug', 'info', 'warn', 'error', 'assert'];
            logType.forEach((level) => {
                if (!(level in _global.console)) return;
                this._console[level] = _global.console[level]
            })
        }
    }
    disable(): void {
        this.enabled = false;
    }
    bindOptions(debug: boolean): void {
        this.enabled = debug ? true : false;
    }
    enable(): void {
        this.enabled = true;
    }
    getEnableStatus() {
        return this.enable;
    }
    log (...args: any[]): void {
        if (!this.enabled) {
            return
        }
        this._console.log(`${PREFIX}[Log]:`, ...args);
    }
    warn (...args: any[]): void {
        if (!this.enabled) {
            return
        }
        this._console.log(`${PREFIX}[Warn]:`, ...args);
    }
    error (...args: any[]): void {
        if (!this.enabled) {
            return
        }
        this._console.log(`${PREFIX}[Error]:`, ...args);
    }
}

const logger = _support.logger || (_support.lopger = new Logger());
export { logger  }