export const nativeToString = Object.prototype.toString;
function isType(type: string) {
    return function(value: any):  boolean {
        return nativeToString.call(value) === `[object ${type}]`;
    }
}

/** *
* check type
*  @param type
*/
export const variableTypeDetection = {
    isNumber: isType('Number'),
    isString: isType('String'),
    isBoolean: isType('Boolean'),
    isNull: isType('Null'),
    isUndefined: isType('Undefined'),
    isSymbol: isType('Symbol'),
    isFunction: isType('Function'),
    isObject: isType('Object'),
    isArray: isType('Array'),
    isProcess: isType('process'),
    isWindow: isType('window'),
}

export function isError(what: any): boolean {
    switch (nativeToString.call(what)) {
        case '[object Error]':
            return true;
        case '[object Exception]':
            return true;
        case '[object DOMException]':
            return true;
        default:
            return isInstanceOf(what, Error);
    }
}

export function isInstanceOf(what: any, base: any): boolean {
    try {
        return what instanceof base;
    } catch (_e) {
        return false;
    }
}

export  function isEmptyObject(obj: Object): boolean {
    return variableTypeDetection.isObject(obj) && Object.keys(obj).length === 0;
}

export function isEmpty(what: any): boolean {
    return (
        (variableTypeDetection.isString(what) && what.trim() === '') || what === undefined || what === null
    )
}

export function isExistProperty(obj: Object, key: string | number | symbol): boolean {
    return obj.hasOwnProperty(key);
}