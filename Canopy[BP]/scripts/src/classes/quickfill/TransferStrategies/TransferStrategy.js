export class TransferStrategy {
    static peek() {
        throw new Error('peek() must be implemented');
    }

    static consume() {
        throw new Error('consume() must be implemented');
    }

    static put() {
        throw new Error('put() must be implemented');
    }
}
