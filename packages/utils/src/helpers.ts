import { IAnyObject, IntegrationError } from "encode-monitor-types";
import { globalVar, HttpCodes, ErrorTypes} from 'encode-monitor-shared';
import { logger } from './logger';
import { nativeToString, variableTypeDetection } from "./is";

export function getLocationHref(): string {
    if (typeof document === 'undefined' || document.location == null) return '';
    return document.location.href;
}

type TotalEventName =
  | keyof GlobalEventHandlersEventMap
  | keyof XMLHttpRequestEventTargetEventMap
  | keyof WindowEventMap;


export function on(
    target: { addEventListener: Function },
    eventName: TotalEventName,
    handler: Function,
    options: boolean | unknown = false
): void {
    target.addEventListener(eventName, handler, options)
}

export function replaceOld(
    source: IAnyObject,
    name: string,
    replacement: (...args: any[]) => any,
    isForced = false
): void {
    if (source === undefined) return;
    if (name in source || isForced) {
        const original = source[name];
        const wrapped = replacement(original);
        if (typeof wrapped === 'function') {
            source[name] =  wrapped;
        }
    }
}

export function splitObjToQuery(obj: Record<string, unknown>): string {
    return Object.entries(obj).reduce((result, [key, value], index) => {
        if (index !== 0) {
            result += '&';
        }
        const valueStr = 
            variableTypeDetection.isObject(value) || variableTypeDetection.isArray(value)
            ? JSON.stringify(value)
            : value;
        result += `${key} = ${valueStr}`
        return result
    }, '')
}

export const defaultFunctionName = '<anonymous>';

export function getFunctionName(fn: unknown): string {
    if (!fn || typeof fn !== 'function') {
        return defaultFunctionName
    }
    return fn.name || defaultFunctionName;
}

export const throttle = (fn: Function, delay: number): Function => {
    let canRun = true;
    return function (...args: any) {
        if (!canRun) return;
        fn.apply(this, args);
        canRun = false;
        setTimeout(() => {
            canRun = true;
        }, delay)
    }
}

export function  getTimeStamp(): number {
    return Date.now();
}

export function typeofAny(target: any, type: string): boolean {
    return typeof target === type;
}

export function toStringAny(target: any, type: string): boolean {
    return nativeToString.call(target) === type;
}

export function validateOption(target: any, targetName: string, expectType: string): boolean {
    if (typeofAny(target, expectType)) return true;
    typeof target !== 'undefined' &&
    logger.error(`${targetName}期望传入${expectType}类型，目前是${typeof target}类型`);
    return false;
}

export function toStringValidateOption(
    target: any,
    targetName: string,
    expectType: string,
): boolean {
    if (toStringAny(target, expectType)) return true;
    typeof target !== 'undefined' &&
        logger.error(
            `${targetName}期望传入${expectType},   目前是${nativeToString.call(target)}类型`
        )
}

export function silentConsoleScope(callback: Function) {
    globalVar.isLogAddBreadcrumb = false;
    callback();
    globalVar.isLogAddBreadcrumb = true;
}

export function generateUUID(): string {
    let d = new Date().getTime();
    const uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      const r = (d + Math.random() * 16) % 16 | 0;
    d = Math.floor(d / 16);
    return (c == 'x' ? r : (r & 0x3) | 0x8).toString(16);
    });
    return uuid;
}

export function unknownToString(target: unknown):string {
    if (variableTypeDetection.isString(target)) {
        return target as string;
    }
    if (variableTypeDetection.isUndefined(target)) {
        return 'undefined'
    }
    return JSON.stringify(target);
}

export function getBigVersion(version: string) {
    return Number(version.split('.')[0]);
}

export function isHttpFail(code: number) {
    return code === 0 || code === HttpCodes.BAD_REQUEST || code > HttpCodes.UNAUTHORIZED;
}

/**
 * 给url添加query
 * @param url
 * @param query
 */
export function setUrlQuery(url: string, query: object) {
    const queryArr = [];
    Object.keys(query).forEach((k) => {
      queryArr.push(`${k}=${query[k]}`);
    });
    if (url.indexOf('?') !== -1) {
      url = `${url}&${queryArr.join('&')}`;
    } else {
      url = `${url}?${queryArr.join('&')}`;
    }
    return url;
  }
  
  export function interceptStr(str: string, interceptLength: number): string {
    if (variableTypeDetection.isString(str)) {
      return (
        str.slice(0, interceptLength) +
        (str.length > interceptLength ? `:截取前${interceptLength}个字符` : '')
      );
    }
    return '';
  }

  /**
 * 解析字符串错误信息，返回message、name、stack
 * @param str error string
 */
export function parseErrorString(str: string): IntegrationError {
    const splitLine: string[] = str.split('\n');
    if (splitLine.length < 2) return null;
    if (splitLine[0].indexOf('MiniProgramError') !== -1) {
      splitLine.splice(0, 1);
    }
    const message = splitLine.splice(0, 1)[0];
    const name = splitLine.splice(0, 1)[0].split(':')[0];
    const stack = [];
    splitLine.forEach((errorLine: string) => {
      const regexpGetFun = /at\s+([\S]+)\s+\(/; // 获取 [ 函数名 ]
      const regexGetFile = /\(([^)]+)\)/; // 获取 [ 有括号的文件 , 没括号的文件 ]
      const regexGetFileNoParenthese = /\s+at\s+(\S+)/; // 获取 [ 有括号的文件 , 没括号的文件 ]
  
      const funcExec = regexpGetFun.exec(errorLine);
      let fileURLExec = regexGetFile.exec(errorLine);
      if (!fileURLExec) {
        // 假如为空尝试解析无括号的URL
        fileURLExec = regexGetFileNoParenthese.exec(errorLine);
      }
  
      const funcNameMatch = Array.isArray(funcExec) && funcExec.length > 0 ? funcExec[1].trim() : '';
      const fileURLMatch = Array.isArray(fileURLExec) && fileURLExec.length > 0 ? fileURLExec[1] : '';
      const lineInfo = fileURLMatch.split(':');
      stack.push({
        args: [], // 请求参数
        func: funcNameMatch || ErrorTypes.UNKNOWN_FUNCTION, // 前端分解后的报错
        column: Number(lineInfo.pop()), // 前端分解后的列
        line: Number(lineInfo.pop()), // 前端分解后的行
        url: lineInfo.join(':'), // 前端分解后的URL
      });
    });
    return {
      message,
      name,
      stack,
    };
  }
  