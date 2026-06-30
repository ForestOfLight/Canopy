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
import { HeldItemDurability } from './HeldItemDurability';

import { RenderSignalStrength } from './RenderSignalStrength';
import { NoFog } from './NoFog';
import { Ping } from './Ping';
import { RenderLightLevel } from './RenderLightLevel';

class InfoDisplay {
	player;
	elements = [];
	infoMessage = { rawtext: [] };
	clearedPreviousMessage = false;
	static playerToInfoDisplayMap = {};
	static currentTickWorldwideElementData = {};

	static elementSpecs = [
		[TPS, () => [1]],
		[Ping, (player) => [player, 2]],
		[Dimension, (player) => [player, 3]],
		[Coords, (player) => [player, 4]],
		[CardinalFacing, (player) => [player, 4]],
		[ChunkCoords, (player) => [player, 5]],
		[SlimeChunk, (player) => [player, 6]],
		[Light, (player) => [player, 7]],
		[Biome, (player) => [player, 8]],
		[Structures, (player) => [player, 9]],
		[Velocity, (player) => [player, 10]],
		[Speed, (player) => [player, 11]],
		[Facing, (player) => [player, 12]],
		[Entities, (player) => [player, 13]],
		[MoonPhase, () => [14]],
		[Weather, (player) => [player, 15]],
		[WorldDay, () => [16]],
		[TimeOfDay, () => [17]],
		[SessionTime, (player) => [player, 17]],
		[EventTrackers, () => [18]],
		[HopperCounterCounts, () => [19]],
		[SimulationMap, (player) => [player, 20]],
		[HeldItemDurability, (player) => [player, 21]],
		[Target, (player) => [player, 22]],
		[SignalStrength, (player) => [player, 22]],
		[BlockStates, (player) => [player, 23]],
		[PeekInventory, (player) => [player, 24]],
		[LiquidTarget, (player) => [player, 25]],
		[LiquidStates, (player) => [player, 26]],
		[RenderSignalStrength, (player) => [player]],
		[RenderLightLevel, (player) => [player]],
		[NoFog, (player) => [player]]
	];

	static getRuleIdentifiers() {
		return InfoDisplay.elementSpecs.map(([ElementClass]) => ElementClass.getRuleIdentifier());
	}

	constructor(player) {
		this.player = player;
		this.elements = InfoDisplay.elementSpecs.map(([ElementClass, makeArgs]) => new ElementClass(...makeArgs(player)));
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
