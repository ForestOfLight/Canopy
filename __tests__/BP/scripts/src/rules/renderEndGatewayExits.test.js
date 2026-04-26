import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { renderEndGatewayExits } from '../../../../../Canopy[BP]/scripts/src/rules/renderEndGatewayExits';
import { world, system } from '@minecraft/server';
import { scheduler } from '@forestoflight/minecraft-vitest-mocks';

vi.mock('@minecraft/server', async () => {
    const serverModule = await import('@forestoflight/minecraft-vitest-mocks/server');
    class MockUnloadedChunksError extends Error {}
    return { ...serverModule, UnloadedChunksError: MockUnloadedChunksError };
});

describe('RenderEndGatewayExits', () => {
    let mockDimension;

    beforeEach(() => {
        mockDimension = {
            id: 'minecraft:the_end',
            heightRange: { min: -64, max: 320 },
            getBlocks: vi.fn(() => ({ getCapacity: () => 0 })),
            getBlock: vi.fn(() => ({ id: 'minecraft:end_stone' })),
        };
        world.getDimension.mockReturnValue(mockDimension);
        world.getPlayers.mockReturnValue([]);
        system.runInterval.mockImplementation((callback, interval) => scheduler.scheduleInterval(callback, interval));
        system.runTimeout.mockImplementation((callback, delay) => scheduler.scheduleDelay(callback, delay));
        system.clearRun.mockImplementation((id) => scheduler.delete(id));
        renderEndGatewayExits.stop();
    });

    afterEach(() => {
        renderEndGatewayExits.stop();
    });

    describe('constructor', () => {
        it('has the correct rule identifier', () => {
            expect(renderEndGatewayExits.getID()).toBe('renderEndGatewayExits');
        });
    });

    describe('start', () => {
        it('creates an endGatewayExitFinder', () => {
            renderEndGatewayExits.start();
            expect(renderEndGatewayExits.endGatewayExitFinder).toBeDefined();
        });

        it('destroys the existing finder before creating a new one', () => {
            renderEndGatewayExits.start();
            const destroySpy = vi.spyOn(renderEndGatewayExits.endGatewayExitFinder, 'destroy');
            renderEndGatewayExits.start();
            expect(destroySpy).toHaveBeenCalled();
        });
    });

    describe('stop', () => {
        it('destroys the finder and sets it to undefined', () => {
            renderEndGatewayExits.start();
            const destroySpy = vi.spyOn(renderEndGatewayExits.endGatewayExitFinder, 'destroy');
            renderEndGatewayExits.stop();
            expect(destroySpy).toHaveBeenCalled();
            expect(renderEndGatewayExits.endGatewayExitFinder).toBeUndefined();
        });

        it('does nothing when no finder exists', () => {
            expect(() => renderEndGatewayExits.stop()).not.toThrow();
        });
    });

    describe('enable and disable callbacks', () => {
        it('calls start() when the rule is enabled', () => {
            const startSpy = vi.spyOn(renderEndGatewayExits, 'start');
            renderEndGatewayExits.setValue(true);
            expect(startSpy).toHaveBeenCalled();
        });

        it('calls stop() when the rule is disabled', () => {
            const stopSpy = vi.spyOn(renderEndGatewayExits, 'stop');
            renderEndGatewayExits.setValue(false);
            expect(stopSpy).toHaveBeenCalled();
        });
    });
});
