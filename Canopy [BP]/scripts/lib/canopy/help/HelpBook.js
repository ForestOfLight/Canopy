import { HelpPage } from "./HelpPage";
import Utils from "../../../include/utils";

class HelpBook {
    constructor() {
        this.helpPages = [];
        this.numNativeCommandPages = 0;
    }

    newPage(page) {
        if (!(page instanceof HelpPage)) 
            throw new Error('[HelpBook] Page must be an instance of HelpPage');
        
        this.helpPages[page.title] = page;
    }

    getPage(pageName) {
        if (!this.helpPages[pageName]) 
            throw new Error('[HelpBook] Page does not exist');
        
        return this.helpPages[pageName];
    }

    addEntry(pageName, entry, player = false) {
        if (!this.helpPages[pageName]) 
            throw new Error('[HelpBook] Page does not exist');
        
        if (pageName === 'InfoDisplay')
            this.helpPages[pageName].addEntry(entry, player);
        else
            this.helpPages[pageName].addEntry(entry);
    }

    getPages() {
        return Object.values(this.helpPages);
    }

    getPageNames() {
        return Object.keys(this.helpPages);
    }

    getNumPages() {
        return Object.keys(this.helpPages).length;
    }

    async print(player) {
        for (const page of Object.values(this.helpPages)) 
            player.sendMessage(await page.toRawMessage());
        
    }

    async printPage(pageName, player) {
        for (const page of Object.values(this.helpPages)) {
            if (String(page.title).toLowerCase() === String(pageName).toLowerCase()) {
                player.sendMessage(await page.toRawMessage());
                return;
            }
        }
        throw new Error('[HelpBook] Page does not exist');
    }

    async printSearchResults(searchTerm, player) {
        const results = [];
        for (const page of Object.values(this.helpPages)) {
            for (const entry of page.entries) {
                if (entry.title.toLowerCase().includes(searchTerm.toLowerCase())) 
                    results.push(entry);
                
            }
        }

        if (results.length === 0)
            player.sendMessage({ translate: 'commands.help.search.noresult', with: [searchTerm] });
        else
            player.sendMessage(await this.processSearchResults(searchTerm, results));
    }

    async processSearchResults(searchTerm, results) {
        let message = { rawtext: [{ translate: 'commands.help.search.results', with: [searchTerm] }] };
        for (const entry of results) {
            const entryRawMessage = await this.formatEntryHeader(entry, searchTerm, message);
            message = this.formatEntryHelp(entryRawMessage, searchTerm, message);
        }
        return message;
    }

    async formatEntryHeader(entry, searchTerm, message) {
        const entryRawMessage = await entry.toRawMessage();
        const newEntryTitle = Utils.recolor(entryRawMessage.rawtext[0].text, searchTerm, '§a');
        const newEntry = {
            rawtext: [
                { text: '\n  ' }, { text: newEntryTitle }
            ]
        };

        const description = entryRawMessage.rawtext[1];
        if (description.translate) {
            newEntry.rawtext.push({
                translate: description.translate,
                with: description.with
            });
        } else if (description.text) {
            newEntry.rawtext.push({
                text: description.text
            });
        }

        message.rawtext.push(newEntry);
        return entryRawMessage;
    }

    formatEntryHelp(entryRawMessage, searchTerm, message) {
        for (let i = 2; i < entryRawMessage.rawtext.length; i++) {
            const newEntryText = Utils.recolor(entryRawMessage.rawtext[i].rawtext[0].text, searchTerm, '§a');
            const newEntry = { rawtext: [{ text: newEntryText }] };

            const description = entryRawMessage.rawtext[i].rawtext[1];
            if (description.translate) {
                newEntry.rawtext.push({
                    translate: description.translate,
                    with: description.with
                });
            } else if (description.text) {
                newEntry.rawtext.push({
                    text: description.text
                });
            }

            message.rawtext.push(newEntry);
        }
        return message;
    }
}

export default HelpBook;