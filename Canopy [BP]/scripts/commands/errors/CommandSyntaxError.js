class CommandSyntaxError extends Error {
    constructor(message, cursor = null, command = null) {
        this.name = 'CommandSyntaxError';
        this.command = command;
        this.cursor = cursor;
        if (command === null)
            super(message);
        super(`[${command.name}] ${message}`);
    }

    getChatMessage() {
        return '§c' + this.message + ' ' + this.command.getUsage();
    }
}

export default CommandSyntaxError;