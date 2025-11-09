import { system, world } from '@minecraft/server';

import Coords from './Coords';
import CardinalFacing from './CardinalFacing';
import Facing from './Facing';
import { ChunkCoords } from './ChunkCoords';
import { SlimeChunk } from './SlimeChunk';
import { Velocity } from './Velocity';
import { Speed } from './Speed';
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
import { Target } from './Target';
import SignalStrength from './SignalStrength';
import { PeekInventory } from './PeekInventory';
import { BlockStates } from './BlockStates';
import { Structures } from './Structures';
import { Dimension } from './Dimension';
import { Weather } from './Weather';
import { LiquidTarget } from './LiquidTarget';
import { LiquidStates } from './LiquidStates';

const playerToInfoDisplayMap = {};
let currentTickWorldwideElementData = {};

class InfoDisplay {
	player;
	elements = [];
	infoMessage = { rawtext: [] };

	constructor(player) {
		this.player = player;
		this.elements = [
			new TPS(1),
			new Dimension(player, 2),
			new Coords(player, 3),
			new CardinalFacing(player, 3),
			new ChunkCoords(player, 4),
			new SlimeChunk(player, 5),
			new Light(player, 6),
			new Biome(player, 7),
			new Structures(player, 8),
			new Velocity(player, 9),
			new Speed(player, 10),
			new Facing(player, 11),
			new Entities(player, 12),
			new MoonPhase(13),
			new Weather(player, 14),
			new WorldDay(15),
			new TimeOfDay(16),
			new SessionTime(player, 16),
			new EventTrackers(17),
			new HopperCounterCounts(18),
			new SimulationMap(player, 19),
			new Target(player, 20),
			new SignalStrength(player, 20),
			new BlockStates(player, 21),
			new PeekInventory(player, 22),
			new LiquidTarget(player, 23),
			new LiquidStates(player, 24)
		];
		playerToInfoDisplayMap[player.id] = this;
	}

	update() {
		this.infoMessage = { rawtext: [] };
		const enabledElements = this.getEnabledElements();

		for (let i = 0; i < enabledElements.length; i++) 
			this.updateElementData(enabledElements, i);
		

		this.trimTrailingWhitespace();
		this.sendInfoMessage();
	}
	
	updateElementData(elements, currIndex) {
		const element = elements[currIndex];
		
		if (element.isWorldwide) {
			if (!currentTickWorldwideElementData[element.identifier]) 
				currentTickWorldwideElementData[element.identifier] = { own: element.getFormattedDataOwnLine(), shared: element.getFormattedDataSharedLine() };
			
		}
		
		let data;
		if (this.getElementsOnLine(elements, element.lineNumber).length === 1) 
			data = currentTickWorldwideElementData[element.identifier]?.own || element.getFormattedDataOwnLine();
		 else 
			data = currentTickWorldwideElementData[element.identifier]?.shared || element.getFormattedDataSharedLine();
		

		if (currIndex !== 0 && this.isOnNewLine(elements, currIndex) && !this.dataIsWhitespace(data)) 
			this.infoMessage.rawtext.push({ text: '\n§r' });
		
		if (!this.isOnNewLine(elements, currIndex) && !this.dataIsWhitespace(data)) 
			this.infoMessage.rawtext.push({ text: ' ' });
		
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
		this.infoMessage.rawtext[this.infoMessage.rawtext.length - 1]?.text?.trim();
	}

	sendInfoMessage() {
		if (this.infoMessage.rawtext.length === 0)
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
