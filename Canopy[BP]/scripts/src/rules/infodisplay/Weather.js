import { InfoDisplayTextElement } from './InfoDisplayTextElement.js';

export const WEATHER_IDENTIFIER = 'weather';

class Weather extends InfoDisplayTextElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: WEATHER_IDENTIFIER, description: { translate: 'rules.infoDisplay.weather' }, wikiDescription: 'Shows the current weather in your dimension.' };
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