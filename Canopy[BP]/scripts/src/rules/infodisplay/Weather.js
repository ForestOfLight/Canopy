import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

class Weather extends InfoDisplayTextElement {
    static getRuleIdentifier() {
        return 'weather';
    }

    constructor(player, displayLine) {
        const ruleData = { description: { translate: 'rules.infoDisplay.weather' }, wikiDescription: 'Shows the current weather in your dimension.' };
        super(ruleData, displayLine);
        this.player = player;
    }

    getFormattedDataOwnLine() {
        return { translate: 'rules.infoDisplay.weather.display', with: [this.player.dimension.getWeather()] };
    }

    getFormattedDataSharedLine() {
        return this.getFormattedDataOwnLine();
    }
}

export { Weather };