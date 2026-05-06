import { HelpPage } from "./HelpPage";
import { CommandHelpEntry } from "./CommandHelpEntry";
import { Command } from "../commands/Command";

class CommandHelpPage extends HelpPage {
    constructor({ title, description = null }, extensionName = false) {
        super(title, description, extensionName);
    }

    addEntry(command) {
        if (!(command instanceof Command))
            throw new Error('[HelpPage] Entry must be an instance of Command');
        
        if (this.hasEntry(command))
            return;
        this.entries.push(new CommandHelpEntry(command));
    }

    hasEntry(command) {
        return this.entries.some(entry => entry.command.getName() === command.getName());
    }

    toRawMessage() {
        const message = this.getPrintStarter();
        if (this.description !== null)
            message.rawtext.push({ rawtext: [ { text: `\n§2` }, this.description ] });
        for (const entry of this.entries) 
            message.rawtext.push({ rawtext: [ { text: '\n  ' }, entry.toRawMessage() ] });
        
        return message;
    }
}

export { CommandHelpPage };