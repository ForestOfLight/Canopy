/**
 * Clase para manejar bases de datos en Minecraft Bedrock Edition.
 */
declare class BDatabase {
    private tableName: string;
    private QUEUE: Function[];
    private onLoadCallback?: (data: any) => void;

    /**
     * Crea una nueva instancia de la base de datos.
     * @param {string} value El nombre de la tabla.
     */
    constructor(value: string);

    /**
     * Resetea el almacenamiento de la base de datos.
     */
    resetStorage(): void;

    /**
     * Obtiene los datos de la base de datos.
     * @returns {object} Los datos de la base de datos.
     */
    fetch(): object;

    /**
     * Añade una tarea a la cola de tareas.
     * @returns {Promise<void>}
     */
    addQueueTask(): Promise<void>;

    /**
     * Guarda los datos en la base de datos.
     * @returns {Promise<void>}
     */
    saveData(): Promise<void>;

    /**
     * Callback para ejecutar cuando se carga la base de datos.
     * @param {Function} value La función a ejecutar.
     * @returns {Promise<void>}
     */
    onLoad(value: (data: any) => void): Promise<void>;

    /**
     * Obtiene todas las bases de datos con el prefijo especificado.
     * @param {string} table El prefijo de la tabla.
     * @returns {string[]} Las bases de datos encontradas.
     */
    getDBS(table: string): string[];

    /**
     * Establece un valor en la base de datos.
     * @param {string} value La clave del valor.
     * @param {*} e El valor a establecer.
     * @returns {Promise<void>}
     */
    set(value: string, e: any): Promise<void>;

    /**
     * Guarda valores o actualiza valores en el registro bajo clave(s).
     * @param {{ [key: string]: any }} data Datos a escribir.
     * @returns {Promise<void>}
     */
    setMany(data: { [key: string]: any }): Promise<void>;

    /**
     * Elimina la(s) clave(s) de la tabla.
     * @param {string[]} keys Arreglo de claves a eliminar.
     * @returns {Promise<void>}
     */
    deleteMany(keys: string[]): Promise<void>;

    /**
     * Ejecuta un bucle forEach en cada clave de la base de datos.
     * @param {(key: string, value: any) => void} callback La función que desea ejecutar en las claves.
     * @returns {BDatabase}
     */
    forEach(callback: (key: string, value: any) => void): BDatabase;

    /**
     * Re-mapea todas las claves en la base de datos.
     * @param {(key: string, value: any) => [string, any] | undefined} callback La función que desea ejecutar en las claves.
     * @returns {BDatabase}
     */
    map(callback: (key: string, value: any) => [string, any] | undefined): BDatabase;

    /**
     * Obtiene un valor de la base de datos.
     * @param {string} value La clave del valor.
     * @returns {*}
     */
    get(value: string): any;

    /**
     * Obtiene un valor de la base de datos de forma asincrónica.
     * @param {string} value La clave del valor.
     * @returns {Promise<any>}
     */
    getSync(value: string): Promise<any>;

    /**
     * Obtiene el valor de muchas claves.
     * @param {string[]} keys Las claves a obtener.
     * @returns {any[]}
     */
    getMany(keys: string[]): any[];

    /**
     * Obtiene el valor de muchas claves de forma asincrónica.
     * @param {string[]} keys Las claves a obtener.
     * @returns {Promise<any[]>}
     */
    getManySync(keys: string[]): Promise<any[]>;

    /**
     * Devuelve una lista iterable de claves almacenadas en esta tabla.
     * @returns {string[]}
     */
    keys(): string[];

    /**
     * Devuelve una lista iterable de claves almacenadas en esta tabla de forma asincrónica.
     * @returns {Promise<string[]>}
     */
    keysSync(): Promise<string[]>;

    /**
     * Obtiene todas las claves presentes en la memoria de la base de datos.
     * @returns {string[]} Un array con todas las claves.
     */
    allKeysP(): string[];

    /**
     * Obtiene todas las claves presentes en la base de datos y les da formato.
     * @returns {Promise<string[] | undefined>} Un array de strings con las claves formateadas o undefined si no hay claves.
     */
    allKeys(): Promise<string[] | undefined>;

    /**
     * Devuelve una lista iterable de todos los valores almacenados en esta tabla.
     * @returns {any[]}
     */
    values(): any[];

    /**
     * Devuelve una lista iterable de todos los valores almacenados en esta tabla de forma asincrónica.
     * @returns {Promise<any[]>}
     */
    valuesSync(): Promise<any[]>;

    /**
     * Comprueba si existe una clave en esta tabla y devuelve un booleano.
     * @param {string} value La clave a comprobar.
     * @returns {boolean}
     */
    has(value: string): boolean;

    /**
     * Comprueba si existe una clave en esta tabla y devuelve un booleano de forma asincrónica.
     * @param {string} value La clave a comprobar.
     * @returns {Promise<boolean>}
     */
    hasSync(value: string): Promise<boolean>;

    /**
     * Encuentra la primera clave asignada al valor especificado en la memoria de la base de datos.
     * @param {number} value El valor a buscar.
     * @returns {string | number} La clave encontrada.
     */
    find(value: number): string | number;

    /**
     * Encuentra todas las claves asignadas al valor especificado en la memoria de la base de datos.
     * @param {number} value El valor a buscar.
     * @returns {string[] | number[]} Un array con todas las claves encontradas.
     */
    findMany(value: number): string[] | number[];

    /**
     * Devuelve un objeto con todas las claves y valores de esta tabla.
     * @returns {{ [key: string]: any }}
     */
    collection(): { [key: string]: any };

    /**
     * Devuelve un objeto con todas las claves y valores de esta tabla de forma asincrónica.
     * @returns {Promise<{ [key: string]: any }>}
     */
    collectionSync(): Promise<{ [key: string]: any }>;

    /**
     * Elimina una clave de esta tabla y devuelve un booleano si ha eliminado correctamente la clave.
     * @param {string} value La clave a eliminar.
     * @returns {Promise<boolean>}
     */
    delete(value: string): Promise<boolean>;

    /**
     * Borra toda la tabla y la devuelve a un objeto vacío.
     * @returns {Promise<void>}
     */
    clear(): Promise<void>;

    /**
     * Obtiene la clave asociada a un valor específico.
     * @param {any} value El valor a buscar.
     * @returns {string | null} La clave asociada al valor, o null si no se encuentra.
     */
    getKeyByValue(value: any): string | null;
}

export default BDatabase;