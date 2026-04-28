import { system, world } from '@minecraft/server';
import { InfoDisplayTextElement } from './InfoDisplayTextElement';
import { InfoDisplayShapeElement } from './InfoDisplayShapeElement';

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
import { HandDurability } from './HandDurability';

import { RenderSignalStrength } from './RenderSignalStrength';

class InfoDisplay {
	player;
	elements = [];
	infoMessage = { rawtext: [] };
	clearedPreviousMessage = false;
	static playerToInfoDisplayMap = {};
	static currentTickWorldwideElementData = {};

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
			new TimeOfDay(15),
			new SessionTime(player, 16),
			new EventTrackers(17),
			new HopperCounterCounts(18),
			new SimulationMap(player, 19),
			new HandDurability(player, 20),
			new Target(player, 21),
			new SignalStrength(player, 21),
			new BlockStates(player, 22),
			new PeekInventory(player, 23),
			new LiquidTarget(player, 24),
			new LiquidStates(player, 25),

			new RenderSignalStrength(player)
		];
		InfoDisplay.playerToInfoDisplayMap[player.id] = this;
		this.enableEnabledRules();
	}

	update() {
		this.infoMessage = { rawtext: [] };
		const enabledElements = this.getEnabledElements();
		for (let i = 0; i < enabledElements.length; i++)
			this.updateElements(enabledElements, i);
		this.sendInfoMessage();
	}
	
	updateElements(elements, currIndex) {
		const element = elements[currIndex];
		if (element instanceof InfoDisplayTextElement)
			this.updateTextElement(element, elements, currIndex);
		else if (element instanceof InfoDisplayShapeElement)
			this.updateShapeElement(element, elements, currIndex);
	}

	updateTextElement(element, elements, currIndex) {
		if (element.isWorldwide && !InfoDisplay.currentTickWorldwideElementData[element.identifier])
			InfoDisplay.currentTickWorldwideElementData[element.identifier] = { own: element.getFormattedDataOwnLine(), shared: element.getFormattedDataSharedLine() };
		let data;
		if (this.getElementsOnLine(elements, element.lineNumber).length === 1)
			data = InfoDisplay.currentTickWorldwideElementData[element.identifier]?.own || element.getFormattedDataOwnLine();
		else
			data = InfoDisplay.currentTickWorldwideElementData[element.identifier]?.shared || element.getFormattedDataSharedLine();
		if (this.infoMessage.rawtext.length !== 0 && this.isOnNewLine(elements, currIndex) && !this.dataIsWhitespace(data))
			this.infoMessage.rawtext.push({ text: '\n§r' });
		if (!this.isOnNewLine(elements, currIndex) && !this.dataIsWhitespace(data))
			this.infoMessage.rawtext.push({ text: ' ' });
		if (this.dataIsWhitespace(data))
			return;
		this.infoMessage.rawtext.push(data);
	}

	updateShapeElement(element) {
		if (!element.shouldRender())
			return;
		if (element.isWorldwide && !InfoDisplay.currentTickWorldwideElementData[element.identifier]) {
			InfoDisplay.currentTickWorldwideElementData[element.identifier] = true;
			element.onTick();
		} else if (!element.isWorldwide) {
			element.onTick();
		}
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
		const success = data.text === '' || data.text === ' ' || data.text === '\n';
		return success;
	}

	lastElementHasNewline() {
		return this.infoMessage.rawtext[this.infoMessage.rawtext.length - 1]?.text === '\n';
	}

	sendInfoMessage() {
		this.prepInfoMessage();
		if (this.infoMessage.rawtext?.length === 0)
			return;
		this.player.onScreenDisplay.setTitle(this.infoMessage);
	}

	prepInfoMessage() {
		this.trimWhitespace();
		// If the message is a fully empty RawMessage, it will not flush the last infoMessage.
		if (this.isEndOfMessages())
			this.setToClearMessage();
		if (this.isStartOfMessages())
			this.clearedPreviousMessage = false;
	}

	trimWhitespace() {
		this.infoMessage.rawtext[0]?.text?.trim();
		this.infoMessage.rawtext[this.infoMessage.rawtext.length - 1]?.text?.trim();
	}

	isEndOfMessages() {
		return this.infoMessage.rawtext.length === 0 && !this.clearedPreviousMessage;
	}

	isStartOfMessages() {
		return this.infoMessage.rawtext?.length > 0 && this.clearedPreviousMessage;
	}

	setToClearMessage() {
		this.infoMessage = '';
		this.clearedPreviousMessage = true;
	}

	enableEnabledRules() {
		for (const element of this.elements) {
			const rule = element.rule;
			if (rule.getValue(this.player))
				rule.onEnable();
		}
	}
}

system.runInterval(() => {
	InfoDisplay.currentTickWorldwideElementData = {};
	const players = world.getAllPlayers();
	for (const player of players) {
		if (!player)
			continue;
		const infoDisplay = InfoDisplay.playerToInfoDisplayMap[player.id] || new InfoDisplay(player);
		infoDisplay.update();
	}
});

world.beforeEvents.playerLeave.subscribe((event) => {
	if (!event.player)
		return;
	delete InfoDisplay.playerToInfoDisplayMap[event.player.id];
});

export { InfoDisplay };
