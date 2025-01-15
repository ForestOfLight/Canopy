import { system, world } from '@minecraft/server';

import Coords from './Coords';
import CardinalFacing from './CardinalFacing';
import Facing from './Facing';
import ChunkCoords from './ChunkCoords';
import SlimeChunk from './SlimeChunk';
import TPS from './TPS';
import Entities from './Entities';
import Light from './Light';
import Biome from './Biome';
import WorldDay from './WorldDay';
import TimeOfDay from './TimeOfDay';
import SessionTime from './SessionTime';
import MoonPhase from './MoonPhase';
import EventTrackers from './EventTrackers';
import HopperCounterCounts from './HopperCounterCounts';
import SimulationMap from './SimulationMap';
import LookingAt from './LookingAt';
import SignalStrength from './SignalStrength';
import PeekInventory from './PeekInventory';

const playerToInfoDisplayMap = {};
let currentTickWorldwideElementData = {};

class InfoDisplay {
	player;
	elements = [];
	infoMessage = { rawtext: [] };

	constructor(player) {
		this.player = player;
		this.elements = [
			new Coords(player),
			new CardinalFacing(player),
			new Facing(player),
			new ChunkCoords(player),
			new SlimeChunk(player),
			new TPS(),
			new Entities(player),
			new Light(player),
			new Biome(player),
			new WorldDay(),
			new TimeOfDay(),
			new SessionTime(player),
			new MoonPhase(),
			new EventTrackers(),
			new HopperCounterCounts(),
			new SimulationMap(player),
			new LookingAt(player),
			new SignalStrength(player),
			new PeekInventory(player)
		];
		playerToInfoDisplayMap[player.id] = this;
	}

	update() {
		this.infoMessage = { rawtext: [] };
		const enabledElements = this.getEnabledElements();

		for (let i = 0; i < enabledElements.length; i++) {
			this.updateElementData(enabledElements, i);
		}

		this.trimTrailingWhitespace();
		this.sendInfoMessage();
	}
	
	updateElementData(elements, currIndex) {
		const element = elements[currIndex];
		
		if (element.isWorldwide) {
			if (!currentTickWorldwideElementData[element.identifier]) {
				currentTickWorldwideElementData[element.identifier] = { own: element.getFormattedDataOwnLine(), shared: element.getFormattedDataSharedLine() };
			}
		}
		
		let data = {};
		if (this.getElementsOnLine(elements, element.lineNumber).length === 1) {
			data = currentTickWorldwideElementData[element.identifier]?.own || element.getFormattedDataOwnLine();
		} else {
			data = currentTickWorldwideElementData[element.identifier]?.shared || element.getFormattedDataSharedLine();
		}

		if (currIndex !== 0 && this.isOnNewLine(elements, currIndex) && !this.dataIsWhitespace(data)) {
			this.infoMessage.rawtext.push({ text: '\n' });
		}
		if (!this.isOnNewLine(elements, currIndex) && !this.dataIsWhitespace(data)) {
			this.infoMessage.rawtext.push({ text: ' ' });
		}
		this.infoMessage.rawtext.push(data);
	}

	getEnabledElements() {
		return this.elements.filter(element => element.rule.getValue(this.player));
	}
	
	getElementsOnLine(elements, lineNumber) {
		return elements.filter(element => element.lineNumber === lineNumber);
	}

	isOnNewLine(elements, currIndex) {
		return elements[currIndex].lineNumber !== elements[currIndex - 1]?.lineNumber;
	}

	dataIsWhitespace(data) {
		return data.text === '' || data.text === ' ' || data.text === '\n';
	}

	lastElementHasNewline() {
		return this.infoMessage.rawtext[this.infoMessage.rawtext.length - 1]?.text === '\n';
	}

	trimTrailingWhitespace() {
		this.infoMessage.rawtext[this.infoMessage.rawtext.length - 1]?.text.trim();
	}

	sendInfoMessage() {
		if (this.infoMessage.rawtext.length == 0)
			return;
		this.player.onScreenDisplay.setTitle(this.infoMessage);
	}
}

system.runInterval(() => {
	currentTickWorldwideElementData = {};
	const players = world.getAllPlayers();
	for (const player of players) {
		if (!player) continue;
		const infoDisplay = playerToInfoDisplayMap[player.id] || new InfoDisplay(player);
		infoDisplay.update();
	}
});

world.beforeEvents.playerLeave.subscribe((event) => {
	if (!event.player) return;
	delete playerToInfoDisplayMap[event.player.id];
});
