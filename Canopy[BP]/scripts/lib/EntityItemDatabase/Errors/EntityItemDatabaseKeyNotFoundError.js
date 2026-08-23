export class EntityItemDatabaseKeyNotFoundError extends Error {
    constructor(message) {
        super(message);
        this.name = 'EntityItemDatabaseKeyNotFoundError';
    }
}
