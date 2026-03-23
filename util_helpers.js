window.UtilHelpers = class UtilHelpers {
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }

    static randomChoice(array) {
        if (!array || array.length === 0) return null;
        return array[Math.floor(Math.random() * array.length)];
    }

    static shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    static clamp(value, min, max) {
        return Math.min(max, Math.max(min, value));
    }

    static formatNumber(num, decimals = 0) {
        return num.toLocaleString(undefined, { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
    }

    static formatChips(chips) {
        if (chips >= 1000000) return (chips / 1000000).toFixed(1) + 'M';
        if (chips >= 1000) return (chips / 1000).toFixed(0) + 'K';
        return chips.toString();
    }

    static formatDate(date, format = 'HH:MM:SS') {
        const d = new Date(date);
        const hours = d.getHours().toString().padStart(2, '0');
        const minutes = d.getMinutes().toString().padStart(2, '0');
        const seconds = d.getSeconds().toString().padStart(2, '0');
        const day = d.getDate().toString().padStart(2, '0');
        const month = (d.getMonth() + 1).toString().padStart(2, '0');
        const year = d.getFullYear();
        return format
            .replace('HH', hours)
            .replace('MM', minutes)
            .replace('SS', seconds)
            .replace('DD', day)
            .replace('MMM', month)
            .replace('YYYY', year);
    }

    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    static async waitForCondition(condition, interval = 100, timeout = 5000) {
        const start = Date.now();
        while (Date.now() - start < timeout) {
            if (condition()) return true;
            await this.delay(interval);
        }
        return false;
    }

    static deepClone(obj) {
        if (obj === null || typeof obj !== 'object') return obj;
        if (obj instanceof Date) return new Date(obj);
        if (obj instanceof Array) return obj.map(item => this.deepClone(item));
        if (obj instanceof Map) {
            const map = new Map();
            for (let [key, val] of obj) map.set(this.deepClone(key), this.deepClone(val));
            return map;
        }
        if (obj instanceof Set) {
            const set = new Set();
            for (let val of obj) set.add(this.deepClone(val));
            return set;
        }
        const cloned = {};
        for (let key in obj) {
            if (obj.hasOwnProperty(key)) cloned[key] = this.deepClone(obj[key]);
        }
        return cloned;
    }

    static deepMerge(target, source) {
        const output = this.deepClone(target);
        for (let key in source) {
            if (source.hasOwnProperty(key)) {
                if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key]) && source[key] !== null) {
                    output[key] = this.deepMerge(output[key] || {}, source[key]);
                } else {
                    output[key] = source[key];
                }
            }
        }
        return output;
    }

    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }

    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }

    static once(func) {
        let called = false;
        return function(...args) {
            if (!called) {
                called = true;
                return func.apply(this, args);
            }
        };
    }

    static memoize(func, resolver = null) {
        const cache = new Map();
        return function(...args) {
            const key = resolver ? resolver(...args) : JSON.stringify(args);
            if (cache.has(key)) return cache.get(key);
            const result = func.apply(this, args);
            cache.set(key, result);
            return result;
        };
    }

    static generateId(prefix = 'id') {
        return `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }

    static capitalize(str) {
        if (!str) return str;
        return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
    }

    static truncate(str, length, suffix = '...') {
        if (str.length <= length) return str;
        return str.substring(0, length) + suffix;
    }

    static escapeHtml(str) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;'
        };
        return str.replace(/[&<>"']/g, m => map[m]);
    }

    static unescapeHtml(str) {
        const map = {
            '&amp;': '&',
            '&lt;': '<',
            '&gt;': '>',
            '&quot;': '"',
            '&#39;': "'"
        };
        return str.replace(/&amp;|&lt;|&gt;|&quot;|&#39;/g, m => map[m]);
    }

    static parseQueryString(query) {
        const params = new URLSearchParams(query);
        const result = {};
        for (let [key, value] of params.entries()) result[key] = value;
        return result;
    }

    static buildQueryString(params) {
        return Object.entries(params)
            .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
            .join('&');
    }

    static getCookie(name) {
        const value = `; ${document.cookie}`;
        const parts = value.split(`; ${name}=`);
        if (parts.length === 2) return parts.pop().split(';').shift();
        return null;
    }

    static setCookie(name, value, days = 365) {
        const expires = new Date(Date.now() + days * 864e5).toUTCString();
        document.cookie = `${name}=${encodeURIComponent(value)}; expires=${expires}; path=/`;
    }

    static deleteCookie(name) {
        document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
    }

    static localStorageSupported() {
        try {
            const test = '__storage_test__';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch(e) {
            return false;
        }
    }

    static saveToLocalStorage(key, value) {
        if (!this.localStorageSupported()) return false;
        try {
            localStorage.setItem(key, JSON.stringify(value));
            return true;
        } catch(e) {
            return false;
        }
    }

    static loadFromLocalStorage(key, defaultValue = null) {
        if (!this.localStorageSupported()) return defaultValue;
        try {
            const item = localStorage.getItem(key);
            return item ? JSON.parse(item) : defaultValue;
        } catch(e) {
            return defaultValue;
        }
    }

    static removeFromLocalStorage(key) {
        if (!this.localStorageSupported()) return;
        localStorage.removeItem(key);
    }

    static clearLocalStorage() {
        if (!this.localStorageSupported()) return;
        localStorage.clear();
    }

    static isMobileDevice() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    }

    static isTouchDevice() {
        return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
    }

    static getViewportSize() {
        return {
            width: window.innerWidth,
            height: window.innerHeight
        };
    }

    static getScrollPosition() {
        return {
            x: window.scrollX,
            y: window.scrollY
        };
    }

    static scrollToTop(smooth = true) {
        window.scrollTo({ top: 0, behavior: smooth ? 'smooth' : 'auto' });
    }

    static scrollToElement(element, smooth = true) {
        if (!element) return;
        element.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
    }

    static getElementPosition(element) {
        const rect = element.getBoundingClientRect();
        return {
            top: rect.top + window.scrollY,
            left: rect.left + window.scrollX,
            width: rect.width,
            height: rect.height
        };
    }

    static isElementInViewport(element, fullyVisible = false) {
        const rect = element.getBoundingClientRect();
        const windowHeight = window.innerHeight || document.documentElement.clientHeight;
        const windowWidth = window.innerWidth || document.documentElement.clientWidth;
        if (fullyVisible) {
            return rect.top >= 0 && rect.left >= 0 && rect.bottom <= windowHeight && rect.right <= windowWidth;
        } else {
            return rect.top < windowHeight && rect.bottom > 0 && rect.left < windowWidth && rect.right > 0;
        }
    }

    static copyToClipboard(text) {
        if (navigator.clipboard && navigator.clipboard.writeText) {
            return navigator.clipboard.writeText(text);
        } else {
            const textarea = document.createElement('textarea');
            textarea.value = text;
            document.body.appendChild(textarea);
            textarea.select();
            const success = document.execCommand('copy');
            document.body.removeChild(textarea);
            return success ? Promise.resolve() : Promise.reject();
        }
    }

    static detectBrowser() {
        const ua = navigator.userAgent;
        if (ua.indexOf('Chrome') > -1) return 'Chrome';
        if (ua.indexOf('Firefox') > -1) return 'Firefox';
        if (ua.indexOf('Safari') > -1) return 'Safari';
        if (ua.indexOf('Edge') > -1) return 'Edge';
        if (ua.indexOf('MSIE') > -1 || ua.indexOf('Trident') > -1) return 'IE';
        return 'Unknown';
    }

    static getPerformanceNow() {
        return performance ? performance.now() : Date.now();
    }

    static measureTime(fn) {
        const start = this.getPerformanceNow();
        const result = fn();
        const duration = this.getPerformanceNow() - start;
        return { result, duration };
    }

    static async measureAsyncTime(fn) {
        const start = this.getPerformanceNow();
        const result = await fn();
        const duration = this.getPerformanceNow() - start;
        return { result, duration };
    }

    static groupBy(array, keyFn) {
        const result = {};
        for (let item of array) {
            const key = keyFn(item);
            if (!result[key]) result[key] = [];
            result[key].push(item);
        }
        return result;
    }

    static unique(array, keyFn = null) {
        if (!keyFn) return [...new Set(array)];
        const seen = new Set();
        return array.filter(item => {
            const key = keyFn(item);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    static sum(array, fn = null) {
        return array.reduce((acc, item) => acc + (fn ? fn(item) : item), 0);
    }

    static average(array, fn = null) {
        const total = this.sum(array, fn);
        return array.length ? total / array.length : 0;
    }

    static minBy(array, fn) {
        if (!array.length) return null;
        return array.reduce((min, item) => fn(item) < fn(min) ? item : min, array[0]);
    }

    static maxBy(array, fn) {
        if (!array.length) return null;
        return array.reduce((max, item) => fn(item) > fn(max) ? item : max, array[0]);
    }

    static chunk(array, size) {
        const result = [];
        for (let i = 0; i < array.length; i += size) {
            result.push(array.slice(i, i + size));
        }
        return result;
    }

    static flatten(array, depth = 1) {
        if (depth === 0) return array;
        return array.reduce((acc, val) => acc.concat(Array.isArray(val) ? this.flatten(val, depth - 1) : val), []);
    }

    static range(start, end, step = 1) {
        const result = [];
        for (let i = start; i <= end; i += step) result.push(i);
        return result;
    }

    static padNumber(num, length) {
        return num.toString().padStart(length, '0');
    }

    static toRoman(num) {
        const map = [
            [1000, 'M'], [900, 'CM'], [500, 'D'], [400, 'CD'],
            [100, 'C'], [90, 'XC'], [50, 'L'], [40, 'XL'],
            [10, 'X'], [9, 'IX'], [5, 'V'], [4, 'IV'], [1, 'I']
        ];
        let result = '';
        for (let [value, symbol] of map) {
            while (num >= value) {
                result += symbol;
                num -= value;
            }
        }
        return result;
    }

    static ordinal(num) {
        const s = ['th', 'st', 'nd', 'rd'];
        const v = num % 100;
        return num + (s[(v - 20) % 10] || s[v] || s[0]);
    }

    static bytesToSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    static getRandomColor() {
        const letters = '0123456789ABCDEF';
        let color = '#';
        for (let i = 0; i < 6; i++) color += letters[Math.floor(Math.random() * 16)];
        return color;
    }

    static getContrastColor(hex) {
        const r = parseInt(hex.substr(1,2), 16);
        const g = parseInt(hex.substr(3,2), 16);
        const b = parseInt(hex.substr(5,2), 16);
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        return brightness > 125 ? '#000000' : '#ffffff';
    }

    static rgbToHex(r, g, b) {
        return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
    }

    static hexToRgb(hex) {
        const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
        return result ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16)
        } : null;
    }

    static downloadFile(content, filename, mimeType = 'text/plain') {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    static readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    static compareVersions(v1, v2) {
        const parts1 = v1.split('.').map(Number);
        const parts2 = v2.split('.').map(Number);
        for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
            const n1 = i < parts1.length ? parts1[i] : 0;
            const n2 = i < parts2.length ? parts2[i] : 0;
            if (n1 > n2) return 1;
            if (n1 < n2) return -1;
        }
        return 0;
    }

    static getRandomElementWeighted(items, weightFn) {
        const totalWeight = this.sum(items, weightFn);
        let random = Math.random() * totalWeight;
        for (let item of items) {
            const weight = weightFn(item);
            if (random < weight) return item;
            random -= weight;
        }
        return items[0];
    }

    static sampleSize(array, size) {
        const shuffled = this.shuffleArray([...array]);
        return shuffled.slice(0, size);
    }

    static rotateArray(array, positions) {
        const len = array.length;
        if (len === 0) return array;
        const shift = ((positions % len) + len) % len;
        return [...array.slice(shift), ...array.slice(0, shift)];
    }

    static binarySearch(sortedArray, value, compareFn = (a,b) => a - b) {
        let left = 0;
        let right = sortedArray.length - 1;
        while (left <= right) {
            const mid = Math.floor((left + right) / 2);
            const cmp = compareFn(sortedArray[mid], value);
            if (cmp === 0) return mid;
            if (cmp < 0) left = mid + 1;
            else right = mid - 1;
        }
        return -1;
    }

    static objectToArray(obj) {
        return Object.entries(obj).map(([key, value]) => ({ key, value }));
    }

    static arrayToObject(arr, keyFn, valueFn = null) {
        const obj = {};
        for (let item of arr) {
            const key = keyFn(item);
            obj[key] = valueFn ? valueFn(item) : item;
        }
        return obj;
    }

    static isEmpty(value) {
        if (value === null || value === undefined) return true;
        if (typeof value === 'string') return value.trim() === '';
        if (Array.isArray(value)) return value.length === 0;
        if (typeof value === 'object') return Object.keys(value).length === 0;
        return false;
    }

    static isNumeric(str) {
        return !isNaN(parseFloat(str)) && isFinite(str);
    }

    static isFunction(value) {
        return typeof value === 'function';
    }

    static isPromise(value) {
        return value && typeof value.then === 'function';
    }

    static safeJSONParse(str, defaultValue = null) {
        try {
            return JSON.parse(str);
        } catch(e) {
            return defaultValue;
        }
    }

    static getGlobal(name) {
        return window[name];
    }

    static setGlobal(name, value) {
        window[name] = value;
    }

    static log(...args) {
        if (window.util_logger && window.util_logger.log) {
            window.util_logger.log(...args);
        } else {
            console.log(...args);
        }
    }

    static warn(...args) {
        if (window.util_logger && window.util_logger.warn) {
            window.util_logger.warn(...args);
        } else {
            console.warn(...args);
        }
    }

    static error(...args) {
        if (window.util_logger && window.util_logger.error) {
            window.util_logger.error(...args);
        } else {
            console.error(...args);
        }
    }
};

window.random = UtilHelpers.random.bind(UtilHelpers);
window.randomInt = UtilHelpers.randomInt.bind(UtilHelpers);
window.randomChoice = UtilHelpers.randomChoice.bind(UtilHelpers);
window.shuffleArray = UtilHelpers.shuffleArray.bind(UtilHelpers);
window.clamp = UtilHelpers.clamp.bind(UtilHelpers);
window.formatNumber = UtilHelpers.formatNumber.bind(UtilHelpers);
window.formatChips = UtilHelpers.formatChips.bind(UtilHelpers);
window.formatDate = UtilHelpers.formatDate.bind(UtilHelpers);
window.delay = UtilHelpers.delay.bind(UtilHelpers);
window.deepClone = UtilHelpers.deepClone.bind(UtilHelpers);
window.deepMerge = UtilHelpers.deepMerge.bind(UtilHelpers);
window.debounce = UtilHelpers.debounce.bind(UtilHelpers);
window.throttle = UtilHelpers.throttle.bind(UtilHelpers);
window.once = UtilHelpers.once.bind(UtilHelpers);
window.generateId = UtilHelpers.generateId.bind(UtilHelpers);
window.capitalize = UtilHelpers.capitalize.bind(UtilHelpers);
window.escapeHtml = UtilHelpers.escapeHtml.bind(UtilHelpers);
window.unescapeHtml = UtilHelpers.unescapeHtml.bind(UtilHelpers);
window.getCookie = UtilHelpers.getCookie.bind(UtilHelpers);
window.setCookie = UtilHelpers.setCookie.bind(UtilHelpers);
window.deleteCookie = UtilHelpers.deleteCookie.bind(UtilHelpers);
window.saveToLocalStorage = UtilHelpers.saveToLocalStorage.bind(UtilHelpers);
window.loadFromLocalStorage = UtilHelpers.loadFromLocalStorage.bind(UtilHelpers);
window.removeFromLocalStorage = UtilHelpers.removeFromLocalStorage.bind(UtilHelpers);
window.clearLocalStorage = UtilHelpers.clearLocalStorage.bind(UtilHelpers);
window.isMobileDevice = UtilHelpers.isMobileDevice.bind(UtilHelpers);
window.isTouchDevice = UtilHelpers.isTouchDevice.bind(UtilHelpers);
window.getViewportSize = UtilHelpers.getViewportSize.bind(UtilHelpers);
window.copyToClipboard = UtilHelpers.copyToClipboard.bind(UtilHelpers);
window.getRandomColor = UtilHelpers.getRandomColor.bind(UtilHelpers);
window.getContrastColor = UtilHelpers.getContrastColor.bind(UtilHelpers);
window.downloadFile = UtilHelpers.downloadFile.bind(UtilHelpers);
window.readFile = UtilHelpers.readFile.bind(UtilHelpers);
window.compareVersions = UtilHelpers.compareVersions.bind(UtilHelpers);
window.getRandomElementWeighted = UtilHelpers.getRandomElementWeighted.bind(UtilHelpers);
window.sampleSize = UtilHelpers.sampleSize.bind(UtilHelpers);
window.rotateArray = UtilHelpers.rotateArray.bind(UtilHelpers);
window.isEmpty = UtilHelpers.isEmpty.bind(UtilHelpers);
window.isNumeric = UtilHelpers.isNumeric.bind(UtilHelpers);
window.isFunction = UtilHelpers.isFunction.bind(UtilHelpers);
window.isPromise = UtilHelpers.isPromise.bind(UtilHelpers);
window.safeJSONParse = UtilHelpers.safeJSONParse.bind(UtilHelpers);

console.log('util_helpers.js loaded');
