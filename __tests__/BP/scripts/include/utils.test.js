import { describe, it, expect, vi } from 'vitest';
import { 
	calcDistance, isString, isNumeric, parseName, getClosestTarget, stringifyLocation, 
	populateItems, getColorCode, wait, getInventory, locationInArea, getColoredDimensionName, 
	getScriptEventSourceName, getScriptEventSourceObject, recolor, titleCase, formatColorStr
} from '../../../../Canopy [BP]/scripts/include/utils.js';

vi.mock('@minecraft/server', {
    world: {},
    ItemStack: {},
    DimensionTypes: {}
});

describe('calcDistance()', () => {
	it('returns correct distance (no Y)', () => {
		const distance = calcDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 4 }, false);
		expect(distance).toBe(Math.sqrt(3*3 + 4*4));
	});

	it('returns correct distance (with Y)', () => {
		const distance = calcDistance({ x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 4 }, true);
		expect(distance).toBe(Math.sqrt(3*3 + 4*4 + 4*4));
	});
});

describe('isString()', () => {
	it('returns true for strings', () => {
		expect(isString('hello')).toBe(true);
		expect(isString(new String('hello'))).toBe(true);
	});

	it('returns false for non-strings', () => {
		expect(isString(123)).toBe(false);
		expect(isString({})).toBe(false);
		expect(isString(null)).toBe(false);
		expect(isString(undefined)).toBe(false);
		expect(isString(true)).toBe(false);
	});
});

describe('isNumeric()', () => {
	it('returns true for numeric strings', () => {
		expect(isNumeric('123')).toBe(true);
		expect(isNumeric('123.45')).toBe(true);
	});

	it('returns true for numbers', () => {
		expect(isNumeric(123)).toBe(true);
		expect(isNumeric(123.45)).toBe(true);
	});

	it('returns false for non-numeric strings', () => {
		expect(isNumeric('abc')).toBe(false);
		expect(isNumeric(null)).toBe(false);
		expect(isNumeric(undefined)).toBe(false);
		expect(isNumeric('NaN')).toBe(false);
	});

	it('returns false for non-strings & non-numbers', () => {
		expect(isNumeric({})).toBe(false);
		expect(isNumeric(undefined)).toBe(false);
		expect(isNumeric(true)).toBe(false);
	});
});

describe('getClosestTarget()', () => {    
	it('returns the block when only block is present', () => {
		const player = {
			getHeadLocation: () => ({ x: 0, y: 0, z: 0 })
		};
		const block = { location: { x: 2, y: 2, z: 2 } };
		const blockRayResult = { block };
		expect(getClosestTarget(player, blockRayResult, [])).toBe(block);
	});

	it('returns the entity when only entity is present', () => {
		const player = {
			getHeadLocation: () => ({ x: 0, y: 0, z: 0 })
		};
		const entity = { location: { x: 1, y: 1, z: 1 } };
		const entityRayResult = [{ entity }];
		expect(getClosestTarget(player, null, entityRayResult)).toBe(entity);
	});

	it('returns undefined when neither entity nor block is present', () => {
		const player = {
			getHeadLocation: () => ({ x: 0, y: 0, z: 0 })
		};
		expect(getClosestTarget(player, null, [])).toBeUndefined();
	});

	it('returns the entity when entity and block are at the same distance', () => {
		const player = {
			getHeadLocation: () => ({ x: 0, y: 0, z: 0 })
		};
		const entity = { location: { x: 1, y: 1, z: 1 } };
		const block = { location: { x: 1, y: 1, z: 1 } };
		const entityRayResult = [{ entity }];
		const blockRayResult = { block };
		expect(getClosestTarget(player, blockRayResult, entityRayResult)).toBe(entity);
	});

	it('returns the entity when both entity and block are present and the entity is closer', () => {
		const player = {
			getHeadLocation: () => ({ x: 0, y: 0, z: 0 })
		};
		const entity = { location: { x: 1, y: 1, z: 1 } };
		const block = { location: { x: 2, y: 2, z: 2 } };
		const entityRayResult = [{ entity }];
		const blockRayResult = { block };
		expect(getClosestTarget(player, blockRayResult, entityRayResult)).toBe(entity);
	});

	it('returns the block when both entity and block are present and the block is closer', () => {
		const player = {
			getHeadLocation: () => ({ x: 0, y: 0, z: 0 })
		};
		const entity = { location: { x: 2, y: 2, z: 2 } };
		const block = { location: { x: 1, y: 1, z: 1 } };
		const entityRayResult = [{ entity }];
		const blockRayResult = { block };
		expect(getClosestTarget(player, blockRayResult, entityRayResult)).toBe(block);
	});
});

describe('parseName()', () => {
	it('returns entity type for non-player entities', () => {
		const target = { typeId: 'minecraft:cow' };
		expect(parseName(target)).toBe('minecraft:cow');
	});

	it('returns player name for player entities', () => {
		const player = { typeId: 'minecraft:player', name: 'Steve' };
		expect(parseName(player)).toBe('§oSteve§r');
	});

	it('returns name without \'minecraft:\' when arg includePrefix=true', () => {
		const target = { typeId: 'minecraft:cow' };
		expect(parseName(target, false)).toBe('cow');
	});
});

describe('stringifyLocation()', () => {
	it('returns correct string with default precision', () => {
		const location = { x: 1.234, y: 5.678, z: 9.012 };
		expect(stringifyLocation(location)).toBe('[1, 6, 9]');
	});

	it('returns correct string with specified precision', () => {
		const location = { x: 1.234, y: 5.678, z: 9.012 };
		expect(stringifyLocation(location, 2)).toBe('[1.23, 5.68, 9.01]');
	});

	it('returns correct string with zero precision', () => {
		const location = { x: 1.234, y: 5.678, z: 9.012 };
		expect(stringifyLocation(location, 0)).toBe('[1, 6, 9]');
	});

	it('throws an error when precision is negative', () => {
		const location = { x: 1.234, y: 5.678, z: 9.012 };
		expect(() => stringifyLocation(location, -1)).toThrow('Precision cannot be negative');
	});

	it('returns correct string with large precision', () => {
		const location = { x: 1.23456789, y: 5.67890123, z: 9.01234567 };
		expect(stringifyLocation(location, 8)).toBe('[1.23456789, 5.67890123, 9.01234567]');
	});
});

describe('populateItems()', () => {
	it('returns correct item counts for non-empty inventory', () => {
		const inventory = {
			container: {
				size: 3,
				getSlot: vi.fn((i) => {
					if (i === 0) return { typeId: 'minecraft:stone', amount: 10 };
					if (i === 1) return { typeId: 'minecraft:dirt', amount: 5 };
					if (i === 2) return { typeId: 'minecraft:stone', amount: 15 };
				})
			}
		};
		const items = populateItems(inventory);
		expect(items).toEqual({ stone: 25, dirt: 5 });
	});

	it('returns empty object for empty inventory', () => {
		const inventory = {
			container: {
				size: 3,
				getSlot: vi.fn(() => undefined)
			}
		};
		const items = populateItems(inventory);
		expect(items).toEqual({});
	});

	it('handles inventory with undefined slots', () => {
		const inventory = {
			container: {
				size: 3,
				getSlot: vi.fn((i) => {
					if (i === 0) return { typeId: 'minecraft:stone', amount: 10 };
					if (i === 1) return undefined;
					if (i === 2) return { typeId: 'minecraft:stone', amount: 15 };
				})
			}
		};
		const items = populateItems(inventory);
		expect(items).toEqual({ stone: 25 });
	});

	it('handles inventory with different item types', () => {
		const inventory = {
			container: {
				size: 4,
				getSlot: vi.fn((i) => {
					if (i === 0) return { typeId: 'minecraft:stone', amount: 10 };
					if (i === 1) return { typeId: 'minecraft:dirt', amount: 5 };
					if (i === 2) return { typeId: 'minecraft:wood', amount: 20 };
					if (i === 3) return { typeId: 'minecraft:stone', amount: 15 };
				})
			}
		};
		const items = populateItems(inventory);
		expect(items).toEqual({ stone: 25, dirt: 5, wood: 20 });
	});
});

describe('getColorCode()', () => {
	it('returns correct color code for red', () => {
		expect(getColorCode('red')).toBe('§c');
	});

	it('returns correct color code for orange', () => {
		expect(getColorCode('orange')).toBe('§6');
	});

	it('returns correct color code for yellow', () => {
		expect(getColorCode('yellow')).toBe('§e');
	});

	it('returns correct color code for lime', () => {
		expect(getColorCode('lime')).toBe('§a');
	});

	it('returns correct color code for green', () => {
		expect(getColorCode('green')).toBe('§2');
	});

	it('returns correct color code for cyan', () => {
		expect(getColorCode('cyan')).toBe('§3');
	});

	it('returns correct color code for light_blue', () => {
		expect(getColorCode('light_blue')).toBe('§b');
	});

	it('returns correct color code for blue', () => {
		expect(getColorCode('blue')).toBe('§9');
	});

	it('returns correct color code for purple', () => {
		expect(getColorCode('purple')).toBe('§5');
	});

	it('returns correct color code for pink', () => {
		expect(getColorCode('pink')).toBe('§d');
	});

	it('returns correct color code for magenta', () => {
		expect(getColorCode('magenta')).toBe('§d');
	});

	it('returns correct color code for brown', () => {
		expect(getColorCode('brown')).toBe('§6');
	});

	it('returns correct color code for black', () => {
		expect(getColorCode('black')).toBe('§0');
	});

	it('returns correct color code for white', () => {
		expect(getColorCode('white')).toBe('§f');
	});

	it('returns correct color code for light_gray', () => {
		expect(getColorCode('light_gray')).toBe('§7');
	});

	it('returns correct color code for gray', () => {
		expect(getColorCode('gray')).toBe('§8');
	});

	it('returns empty string for unknown color', () => {
		expect(getColorCode('unknown')).toBe('');
	});
});

describe('wait()', () => {
	it('waits for the specified time', () => {
		const { startTime, endTime } = wait(100);
		const duration = endTime - startTime;
		expect(duration).toBeGreaterThanOrEqual(100);
		expect(duration).toBeLessThan(150);
	});

	it('returns the correct start and end times', () => {
		const { startTime, endTime } = wait(50);
		expect(endTime - startTime).toBeGreaterThanOrEqual(50);
		expect(endTime - startTime).toBeLessThan(100);
	});
});

describe('getInventory()', () => {
	it('returns correct inventory items', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue({
				container: {
					size: 3,
					getItem: vi.fn((i) => {
						if (i === 0) return { type: { id: 'minecraft:stone' }, amount: 10 };
						if (i === 1) return { type: { id: 'minecraft:dirt' }, amount: 5 };
						if (i === 2) return { type: { id: 'minecraft:stone' }, amount: 15 };
					})
				}
			})
		};
		const items = getInventory(block);
		expect(items).toEqual({
			0: { typeId: 'minecraft:stone', amount: 10 },
			1: { typeId: 'minecraft:dirt', amount: 5 },
			2: { typeId: 'minecraft:stone', amount: 15 }
		});
	});

	it('returns empty object for block without inventory', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue(undefined)
		};
		const items = getInventory(block);
		expect(items).toEqual({});
	});

	it('returns empty object for empty inventory', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue({
				container: {
					size: 3,
					getItem: vi.fn(() => undefined)
				}
			})
		};
		const items = getInventory(block);
		expect(items).toEqual({});
	});

	it('handles inventory with undefined (air) slots', () => {
		const block = {
			getComponent: vi.fn().mockReturnValue({
				container: {
					size: 3,
					getItem: vi.fn((i) => {
						if (i === 0) return { type: { id: 'minecraft:stone' }, amount: 10 };
						if (i === 1) return undefined;
						if (i === 2) return { type: { id: 'minecraft:stone' }, amount: 15 };
					})
				}
			})
		};
		const items = getInventory(block);
		expect(items).toEqual({
			0: { typeId: 'minecraft:stone', amount: 10 },
			2: { typeId: 'minecraft:stone', amount: 15 }
		});
	});
});

describe.skip('restoreInventory()', () => {
	// Gametest
});

describe.skip('broadcastActionBar()', () => {
	// Gametest
});

describe.skip('broadcastActionBar()', () => {
	// Gametest  
});

describe('locationInArea()', () => {
	it('returns true when position is within the area', () => {
		const area = {
			dimensionId: 'minecraft:overworld',
			posOne: { x: 0, y: 0, z: 0 },
			posTwo: { x: 10, y: 10, z: 10 }
		};
		const position = {
			dimensionId: 'minecraft:overworld',
			location: { x: 5, y: 5, z: 5 }
		};
		expect(locationInArea(area, position)).toBe(true);
	});

	it('returns false when position is outside the area', () => {
		const area = {
			dimensionId: 'minecraft:overworld',
			posOne: { x: 0, y: 0, z: 0 },
			posTwo: { x: 10, y: 10, z: 10 }
		};
		const position = {
			dimensionId: 'minecraft:overworld',
			location: { x: 15, y: 15, z: 15 }
		};
		expect(locationInArea(area, position)).toBe(false);
	});

	it('returns false when position is in a different dimension', () => {
		const area = {
			dimensionId: 'minecraft:overworld',
			posOne: { x: 0, y: 0, z: 0 },
			posTwo: { x: 10, y: 10, z: 10 }
		};
		const position = {
			dimensionId: 'minecraft:nether',
			location: { x: 5, y: 5, z: 5 }
		};
		expect(locationInArea(area, position)).toBe(false);
	});

	it('returns true when position is on the boundary of the area', () => {
		const area = {
			dimensionId: 'minecraft:overworld',
			posOne: { x: 0, y: 0, z: 0 },
			posTwo: { x: 10, y: 10, z: 10 }
		};
		const position = {
			dimensionId: 'minecraft:overworld',
			location: { x: 10, y: 10, z: 10 }
		};
		expect(locationInArea(area, position)).toBe(true);
	});

	it('returns false when area is undefined', () => {
		const position = {
			dimensionId: 'minecraft:overworld',
			location: { x: 5, y: 5, z: 5 }
		};
		expect(locationInArea(undefined, position)).toBe(false);
	});

	it('returns false when position is undefined', () => {
		const area = {
			dimensionId: 'minecraft:overworld',
			posOne: { x: 0, y: 0, z: 0 },
			posTwo: { x: 10, y: 10, z: 10 }
		};
		expect(locationInArea(area, undefined)).toBe(false);
	});
});

describe('getColoredDimensionName()', () => {
	it('returns correct color code for overworld', () => {
		expect(getColoredDimensionName('minecraft:overworld')).toBe('§aOverworld');
		expect(getColoredDimensionName('overworld')).toBe('§aOverworld');
	});

	it('returns correct color code for nether', () => {
		expect(getColoredDimensionName('minecraft:nether')).toBe('§cNether');
		expect(getColoredDimensionName('nether')).toBe('§cNether');
	});

	it('returns correct color code for the end', () => {
		expect(getColoredDimensionName('minecraft:the_end')).toBe('§dEnd');
		expect(getColoredDimensionName('the_end')).toBe('§dEnd');
	});

	it('returns correct color code for unknown dimension', () => {
		expect(getColoredDimensionName('unknown_dimension')).toBe('§7Unknown');
	});
});

describe('getScriptEventSourceName()', () => {
	it('returns correct name for command block', () => {
		const event = {
			sourceType: 'Block',
			sourceBlock: { typeId: 'minecraft:command_block' }
		};
		expect(getScriptEventSourceName(event)).toBe('!');
	});

	it('returns correct name for non-command block', () => {
		const event = {
			sourceType: 'Block',
			sourceBlock: { typeId: 'minecraft:stone' }
		};
		expect(getScriptEventSourceName(event)).toBe('minecraft:stone');
	});

	it('returns correct name for player entity', () => {
		const event = {
			sourceType: 'Entity',
			sourceEntity: { typeId: 'minecraft:player', name: 'Steve' }
		};
		expect(getScriptEventSourceName(event)).toBe('Steve');
	});

	it('returns correct name for non-player entity', () => {
		const event = {
			sourceType: 'Entity',
			sourceEntity: { typeId: 'minecraft:cow' }
		};
		expect(getScriptEventSourceName(event)).toBe('minecraft:cow');
	});

	it('returns "Server" for server source type', () => {
		const event = {
			sourceType: 'Server'
		};
		expect(getScriptEventSourceName(event)).toBe('Server');
	});

	it('returns "Unknown" for unknown source type', () => {
		const event = {
			sourceType: 'Unknown'
		};
		expect(getScriptEventSourceName(event)).toBe('Unknown');
	});
});

describe('getScriptEventSourceObject()', () => {
	it('returns the source block for Block source type', () => {
		const event = {
			sourceType: 'Block',
			sourceBlock: { typeId: 'minecraft:stone' }
		};
		expect(getScriptEventSourceObject(event)).toBe(event.sourceBlock);
	});

	it('returns the source entity for Entity source type', () => {
		const event = {
			sourceType: 'Entity',
			sourceEntity: { typeId: 'minecraft:cow' }
		};
		expect(getScriptEventSourceObject(event)).toBe(event.sourceEntity);
	});

	it('returns "Server" for Server source type', () => {
		const event = {
			sourceType: 'Server'
		};
		expect(getScriptEventSourceObject(event)).toBe('Server');
	});

	it('returns "Unknown" for unknown source type', () => {
		const event = {
			sourceType: 'Unknown'
		};
		expect(getScriptEventSourceObject(event)).toBe('Unknown');
	});
});

describe('recolor()', () => {
	it('recolors the term in the text with the specified color code', () => {
		const result = recolor('Hello World', 'World', '§c');
		expect(result).toBe('Hello §cWorld§f');
	});

	it('recolors the term in the text with the default color code', () => {
		const result = recolor('Hello World', 'World');
		expect(result).toBe('Hello §fWorld§f');
	});

	it('recolors multiple occurrences of the term in the text', () => {
		const result = recolor('Hello World, World!', 'World', '§c');
		expect(result).toBe('Hello §cWorld§f, §cWorld§f!');
	});

	it('returns the original text if the term is not found', () => {
		const result = recolor('Hello World', 'Universe', '§c');
		expect(result).toBe('Hello World');
	});

	it('is case insensitive when searching for the term', () => {
		const result = recolor('Hello World', 'world', '§c');
		expect(result).toBe('Hello §cWorld§f');
	});

	it('preserves existing color codes in the text', () => {
		const result = recolor('Hello §aWorld', 'World', '§c');
		expect(result).toBe('Hello §a§cWorld§a');
	});

	it('handles text with no color codes correctly', () => {
		const result = recolor('Hello World', 'Hello', '§b');
		expect(result).toBe('§bHello§f World');
	});

	it('handles empty text correctly', () => {
		const result = recolor('', 'World', '§c');
		expect(result).toBe('');
	});

	it('handles empty term correctly', () => {
		const result = recolor('Hello World', '', '§c');
		expect(result).toBe('Hello World');
	});

	it('handles empty color code correctly', () => {
		const result = recolor('Hello World', 'World', '');
		expect(result).toBe('Hello World');
	});
});

describe.skip('getEntitiesByType()', () => {
	// Gametest
});

describe.skip('getRaycastResults()', () => {
	// Gametest
});

describe('titleCase()', () => {
	it('converts camelCase to Title Case', () => {
		expect(titleCase('camelCaseString')).toBe('Camel Case String');
	});

	it('converts snake_case to Title Case', () => {
		expect(titleCase('snake_case_string')).toBe('Snake Case String');
	});

	it('converts mixedCase to Title Case', () => {
		expect(titleCase('mixedCase_string')).toBe('Mixed Case String');
	});

	it('converts single word to Title Case', () => {
		expect(titleCase('word')).toBe('Word');
	});

	it('converts empty string to empty string', () => {
		expect(titleCase('')).toBe('');
	});

	it('converts string with multiple underscores to Title Case', () => {
		expect(titleCase('multiple__underscores')).toBe('Multiple  Underscores');
	});

	it('converts string with multiple camelCase words to Title Case', () => {
		expect(titleCase('multipleCamelCaseWords')).toBe('Multiple Camel Case Words');
	});

	it('converts string with numbers and special characters to Title Case', () => {
		expect(titleCase('string_with_123_numbers_and_$pecial_characters')).toBe('String With 123 Numbers And $pecial Characters');
	});
});

describe('formatColorStr', () => {
	it('returns the formatted color name', () => {
		expect(formatColorStr('red')).toBe('§cred§r');
	});

	it('returns an uncolored name if the color is not found', () => {
		expect(formatColorStr('unknown')).toBe('unknown§r');
	});
});
