/**
 * constants_ranks.js
 * Определение рангов карт, их числовых значений, функций сравнения и вспомогательных утилит для стритов.
 * Все функции и константы глобально доступны через window.
 */

// --- Основные константы рангов ---
// Числовые значения рангов от 2 до 14 (2..10, J=11, Q=12, K=13, A=14)
window.RANK_VALUES = {
    '2': 2, '3': 3, '4': 4, '5': 5, '6': 6, '7': 7, '8': 8, '9': 9, '10': 10,
    'J': 11, 'Q': 12, 'K': 13, 'A': 14
};

// Обратное отображение: значение -> символ
window.RANK_SYMBOLS = {
    2: '2', 3: '3', 4: '4', 5: '5', 6: '6', 7: '7', 8: '8', 9: '9', 10: '10',
    11: 'J', 12: 'Q', 13: 'K', 14: 'A'
};

// Массив всех возможных рангов в порядке возрастания (для удобства)
window.ALL_RANKS = ['2', '3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A'];

// Минимальное и максимальное числовое значение ранга
window.MIN_RANK_VALUE = 2;
window.MAX_RANK_VALUE = 14;

// --- Функции для работы с рангами ---

/**
 * Получить числовое значение ранга по его символу.
 * @param {string} rankSymbol - Символ ранга ('2'...'A')
 * @returns {number} Числовое значение (2-14) или -1, если символ не распознан
 */
window.getRankValue = function(rankSymbol) {
    if (window.RANK_VALUES.hasOwnProperty(rankSymbol)) {
        return window.RANK_VALUES[rankSymbol];
    }
    console.warn(`getRankValue: неизвестный ранг "${rankSymbol}"`);
    return -1;
};

/**
 * Получить символ ранга по его числовому значению.
 * @param {number} value - Числовое значение (2-14)
 * @returns {string} Символ ранга или '?' при некорректном значении
 */
window.getRankSymbol = function(value) {
    if (window.RANK_SYMBOLS.hasOwnProperty(value)) {
        return window.RANK_SYMBOLS[value];
    }
    console.warn(`getRankSymbol: неизвестное значение "${value}"`);
    return '?';
};

/**
 * Сравнить два ранга.
 * @param {string|number} rankA - Первый ранг (символ или числовое значение)
 * @param {string|number} rankB - Второй ранг
 * @returns {number} -1 если rankA < rankB, 0 если равны, 1 если rankA > rankB
 */
window.compareRanks = function(rankA, rankB) {
    let valA = (typeof rankA === 'string') ? window.getRankValue(rankA) : rankA;
    let valB = (typeof rankB === 'string') ? window.getRankValue(rankB) : rankB;
    if (valA === valB) return 0;
    return valA > valB ? 1 : -1;
};

/**
 * Проверить, образуют ли переданные ранги стрит (последовательность).
 * @param {number[]} rankValues - Массив числовых значений рангов (может содержать дубликаты, но для стрита они уникальны)
 * @returns {boolean} true, если значения образуют последовательность из 5 или более чисел без пропусков
 */
window.isSequential = function(rankValues) {
    if (!Array.isArray(rankValues) || rankValues.length < 5) return false;
    // Убираем дубликаты и сортируем по возрастанию
    let uniqueSorted = [...new Set(rankValues)].sort((a,b) => a - b);
    if (uniqueSorted.length < 5) return false;
    
    // Ищем последовательность из 5 подряд идущих чисел
    for (let i = 0; i <= uniqueSorted.length - 5; i++) {
        let start = uniqueSorted[i];
        let isSeq = true;
        for (let j = 1; j < 5; j++) {
            if (uniqueSorted[i + j] !== start + j) {
                isSeq = false;
                break;
            }
        }
        if (isSeq) return true;
    }
    return false;
};

/**
 * Проверить, является ли стрит с тузом в качестве младшей карты (A-2-3-4-5).
 * Для этого нужно, чтобы в наборе были значения 14,2,3,4,5.
 * @param {number[]} rankValues - Массив числовых значений рангов
 * @returns {boolean}
 */
window.isWheelStraight = function(rankValues) {
    let required = [14,2,3,4,5];
    return required.every(v => rankValues.includes(v));
};

/**
 * Получить старшую карту стрита из набора рангов.
 * Если стрит с тузом-пятёркой, старшей считается 5 (чтобы не путать со стритом 10-A).
 * @param {number[]} rankValues - Массив числовых значений рангов (уникальных)
 * @returns {number|null} Значение старшей карты стрита или null, если стрита нет
 */
window.getStraightHigh = function(rankValues) {
    if (!window.isSequential(rankValues)) {
        // Проверяем специальный случай A-2-3-4-5
        if (window.isWheelStraight(rankValues)) return 5;
        return null;
    }
    // Сортируем и ищем последовательность из 5
    let uniqueSorted = [...new Set(rankValues)].sort((a,b) => a - b);
    for (let i = uniqueSorted.length - 1; i >= 4; i--) {
        let start = uniqueSorted[i-4];
        let isSeq = true;
        for (let j = 1; j < 5; j++) {
            if (uniqueSorted[i-4+j] !== start + j) {
                isSeq = false;
                break;
            }
        }
        if (isSeq) return uniqueSorted[i];
    }
    return null;
};

/**
 * Получить массив уникальных рангов, отсортированных по убыванию.
 * @param {number[]} rankValues - Массив числовых значений рангов
 * @returns {number[]} Уникальные значения, отсортированные по убыванию
 */
window.getUniqueRanksDesc = function(rankValues) {
    return [...new Set(rankValues)].sort((a,b) => b - a);
};

/**
 * Подсчитать количество вхождений каждого ранга в наборе.
 * @param {number[]} rankValues - Массив числовых значений рангов
 * @returns {Map<number, number>} Map, где ключ - ранг, значение - количество
 */
window.getRankCounts = function(rankValues) {
    const counts = new Map();
    for (let val of rankValues) {
        counts.set(val, (counts.get(val) || 0) + 1);
    }
    return counts;
};

/**
 * Получить ранги, сгруппированные по кратности, отсортированные по приоритету.
 * Возвращает объект { quads: [], trips: [], pairs: [], singles: [] }
 * @param {number[]} rankValues - Массив числовых значений рангов
 * @returns {Object}
 */
window.getGroupedRanks = function(rankValues) {
    const counts = window.getRankCounts(rankValues);
    const quads = [];
    const trips = [];
    const pairs = [];
    const singles = [];
    
    for (let [rank, count] of counts.entries()) {
        if (count === 4) quads.push(rank);
        else if (count === 3) trips.push(rank);
        else if (count === 2) pairs.push(rank);
        else singles.push(rank);
    }
    
    // Сортируем каждую группу по убыванию ранга
    quads.sort((a,b) => b - a);
    trips.sort((a,b) => b - a);
    pairs.sort((a,b) => b - a);
    singles.sort((a,b) => b - a);
    
    return { quads, trips, pairs, singles };
};

/**
 * Получить массив рангов для сравнения комбинаций (например, для фулл-хауса: сначала трипс, потом пара).
 * @param {number[]} rankValues - Массив числовых значений рангов
 * @returns {number[]} Массив рангов в порядке убывания значимости для сравнения
 */
window.getComparisonRanks = function(rankValues) {
    const grouped = window.getGroupedRanks(rankValues);
    let result = [];
    // Каре: добавляем 4 одинаковых, затем остальные по убыванию
    if (grouped.quads.length) {
        result.push(grouped.quads[0]);
        result.push(...grouped.singles);
        return result;
    }
    // Фулл-хаус: трипс, затем пара
    if (grouped.trips.length && grouped.pairs.length) {
        result.push(grouped.trips[0]);
        result.push(grouped.pairs[0]);
        return result;
    }
    // Трипс: трипс, затем все синглы
    if (grouped.trips.length) {
        result.push(grouped.trips[0]);
        result.push(...grouped.singles);
        return result;
    }
    // Две пары: старшая пара, младшая пара, сингл
    if (grouped.pairs.length >= 2) {
        result.push(grouped.pairs[0]);
        result.push(grouped.pairs[1]);
        result.push(...grouped.singles);
        return result;
    }
    // Одна пара: пара, затем синглы
    if (grouped.pairs.length === 1) {
        result.push(grouped.pairs[0]);
        result.push(...grouped.singles);
        return result;
    }
    // Старшая карта: все синглы
    return grouped.singles;
};

/**
 * Преобразовать массив рангов в строку для отладки.
 * @param {number[]} rankValues
 * @returns {string}
 */
window.ranksToString = function(rankValues) {
    return rankValues.map(v => window.getRankSymbol(v)).join(',');
};

// --- Расширенные утилиты для определения стритов с учётом туза ---

/**
 * Получить старшую карту для стрита, если он есть, с учётом колеса.
 * @param {number[]} rankValues - Массив числовых значений рангов
 * @returns {number|null}
 */
window.getStraightHighValue = function(rankValues) {
    // Сначала проверяем обычный стрит
    let high = window.getStraightHigh(rankValues);
    if (high !== null) return high;
    // Проверяем колесо
    if (window.isWheelStraight(rankValues)) return 5;
    return null;
};

/**
 * Проверить, есть ли в наборе стрит (любой длины >=5).
 * @param {number[]} rankValues
 * @returns {boolean}
 */
window.hasStraight = function(rankValues) {
    return window.getStraightHighValue(rankValues) !== null;
};

// --- Экспорт в глобальную область (уже через window) ---
console.log('constants_ranks.js загружен. Доступны ранги и функции сравнения.');
