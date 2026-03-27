import { describe, it, expect, vi } from 'vitest';
import { 
	calcDistance, isString, isNumeric, parseName, getClosestTarget, stringifyLocation, 
	getColorCode, wait, getInventory, locationInArea, getColoredDimensionName, 
	getScriptEventSourceName, getScriptEventSourceObject, recolor, titleCase, formatColorStr
} from '../../../../Canopy [BP]/scripts/include/utils.js';

vi.mock('@minecraft/server', {
    world: {},
    ItemStack: {},
    DimensionTypes: {}
});

vi.mock("@minecraft/server-ui", () => ({
    ModalFormData: vi.fn()
}));

describe('calcDistance()', () => {
	it.each([
		[false, { x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 4 }, Math.sqrt(3*3 + 4*4)],
		[true, { x: 0, y: 0, z: 0 }, { x: 3, y: 4, z: 4 }, Math.sqrt(3*3 + 4*4 + 4*4)]
	])('returns correct distance (including Y: %s)', (useY, from, to, expected) => {
		const distance = calcDistance(from, to, useY);
		expect(distance).toBe(expected);
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
	it.each([
		[{ x: 1.234, y: 5.678, z: 9.012 }, '[1, 6, 9]'],
		[{ x: 1.234, y: 5.678, z: 9.012 }, '[1.23, 5.68, 9.01]', 2],
		[{ x: 1.234, y: 5.678, z: 9.012 }, '[1, 6, 9]', 0],
		[{ x: 1.23456789, y: 5.67890123, z: 9.01234567 }, '[1.23456789, 5.67890123, 9.01234567]', 8]
	])('returns correct string, respecting precision', (location, expected, precision) => {
		expect(stringifyLocation(location, precision)).toBe(expected);
	});

	it('throws an error when precision is negative', () => {
		const location = { x: 1.234, y: 5.678, z: 9.012 };
		expect(() => stringifyLocation(location, -1)).toThrow('Precision cannot be negative');
	});
});

describe('getColorCode()', () => {
	it.each([
		['red', '§c'],
		['orange', '§6'],
		['yellow', '§e'],
		['lime', '§a'],
		['green', '§2'],
		['cyan', '§3'],
		['light_blue', '§b'],
		['blue', '§9'],
		['purple', '§u'],
		['pink', '§d'],
		['magenta', '§5'],
		['brown', '§n'],
		['black', '§0'],
		['white', '§f'],
		['light_gray', '§7'],
		['gray', '§8']
	])('returns correct color code for %s', (color, expectedCode) => {
		expect(getColorCode(color)).toBe(expectedCode);
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

describe('locationInArea()', () => {
	it.each([
		[
			{ dimensionId: 'minecraft:overworld', posOne: { x: 0, y: 0, z: 0 }, posTwo: { x: 10, y: 10, z: 10 } },
			{ dimensionId: 'minecraft:overworld', location: { x: 5, y: 5, z: 5 } }, 
			true
		],
		[
			{ dimensionId: 'minecraft:overworld', posOne: { x: 0, y: 0, z: 0 }, posTwo: { x: 10, y: 10, z: 10 } },
			{ dimensionId: 'minecraft:overworld', location: { x: 15, y: 15, z: 15 } },
			false
		],
		[
			{ dimensionId: 'minecraft:overworld', posOne: { x: 0, y: 0, z: 0 }, posTwo: { x: 10, y: 10, z: 10 } },
			{ dimensionId: 'minecraft:nether', location: { x: 5, y: 5, z: 5 } },
			false
		],
		[
			{ dimensionId: 'minecraft:overworld', posOne: { x: 0, y: 0, z: 0 }, posTwo: { x: 10, y: 10, z: 10 } },
			{ dimensionId: 'minecraft:overworld', location: { x: 10, y: 10, z: 10 } },
			true
		],
		[
			undefined,
			{ dimensionId: 'minecraft:overworld', location: { x: 5, y: 5, z: 5 } }, 
			false
		],
		[
			{ dimensionId: 'minecraft:overworld', posOne: { x: 0, y: 0, z: 0 }, posTwo: { x: 10, y: 10, z: 10 } },
			undefined,
			false
		]
	])('identifies when the position is inside the area', (area, position, expected) => {
		expect(locationInArea(area, position)).toBe(expected);
	});
});

describe('getColoredDimensionName()', () => {
	it.each([
		[ 'minecraft:overworld', '§aOverworld' ],
		[ 'overworld', '§aOverworld' ],
		[ 'minecraft:nether', '§cNether' ],
		[ 'nether', '§cNether' ],
		[ 'minecraft:the_end', '§dEnd' ],
		[ 'the_end', '§dEnd' ],
		[ 'unknown_dimension', '§funknown_dimension' ]
	])('returns correct colored string for %s', (string, expected) => {
		expect(getColoredDimensionName(string)).toBe(expected);
	});
});

describe('getScriptEventSourceName()', () => {
	it.each([
		['command block', { sourceType: 'Block', sourceBlock: { typeId: 'minecraft:command_block' } }, '!'],
		['non-command block', { sourceType: 'Block', sourceBlock: { typeId: 'minecraft:stone' } }, 'minecraft:stone'],
		['player entity', { sourceType: 'Entity', sourceEntity: { typeId: 'minecraft:player', name: 'Steve' } }, 'Steve'],
		['non-player entity', { sourceType: 'Entity', sourceEntity: { typeId: 'minecraft:cow' } }, 'minecraft:cow'],
		['server', { sourceType: 'Server' }, 'Server'],
		['unknown', { sourceType: 'Unknown' }, 'Unknown']
	])('returns correct name for %s', (type, event, expected) => {
		expect(getScriptEventSourceName(event)).toBe(expected);
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
	it.each([
		['Hello World', 'World', '§c', 'Hello §cWorld§f'],
		['Hello World', 'World', void 0, 'Hello §fWorld§f'],
		['Hello World, World!', 'World', '§c', 'Hello §cWorld§f, §cWorld§f!'],
		['Hello World', 'Universe', '§c', 'Hello World'],
		['Hello World', 'world', '§c', 'Hello §cWorld§f'],
		['Hello §aWorld', 'World', '§c', 'Hello §a§cWorld§a'],
		['Hello World', 'Hello', '§b', '§bHello§f World'],
		['', 'World', '§c', ''],
		['Hello World', '', '§c', 'Hello World'],
		['Hello World', 'World', '', 'Hello World']
	])('recolors the term in the text with the specified color code', (string, term, colorCode, expected) => {
		expect(recolor(string, term, colorCode)).toBe(expected);
	});
});

describe.skip('getEntitiesByType()', () => {
	// Gametest
});

describe.skip('getRaycastResults()', () => {
	// Gametest
});

describe('titleCase()', () => {
	it.each([
		['camelCaseString', 'Camel Case String'],
		['snake_case_string', 'Snake Case String'],
		['mixedCase_string', 'Mixed Case String'],
		['word', 'Word'],
		['', ''],
		['multiple__underscores', 'Multiple  Underscores'],
		['multipleCamelCaseWords', 'Multiple Camel Case Words'],
		['string_with_123_numbers_and_$pecial_characters', 'String With 123 Numbers And $pecial Characters']
	])('converts %s to Title Case', (input, expected) => {
		expect(titleCase(input)).toBe(expected);
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
