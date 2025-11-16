import { InfoDisplayElement } from './InfoDisplayElement.js';

class Weather extends InfoDisplayElement {
    constructor(player, displayLine) {
        const ruleData = { identifier: 'weather', description: { translate: 'rules.infoDisplay.weather' } };
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