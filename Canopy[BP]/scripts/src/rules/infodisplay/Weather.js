import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

class Weather extends InfoDisplayTextElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'weather', description: { translate: 'rules.infoDisplay.weather' }, wikiDescription: 'Shows the current weather in your dimension.' };
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