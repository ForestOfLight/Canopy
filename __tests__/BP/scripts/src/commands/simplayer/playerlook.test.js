import { vi, describe, it, expect, beforeEach } from 'vitest';
import { system, Entity, CustomCommandStatus } from '@minecraft/server';
import Understudies from '../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies';
import { playerlookCommand, LOOK_OPTIONS } from '../../../../../../Canopy[BP]/scripts/src/commands/simplayer/playerlook';
import { ServerCommandOrigin } from '../../../../../../Canopy[BP]/scripts/lib/canopy/commands/ServerCommandOrigin';

vi.mock('../../../../../../Canopy[BP]/scripts/src/classes/simplayer/Understudies', () => ({
    default: {
        get: vi.fn(),
        getNotOnlineMessage: vi.fn(name => ({ translate: 'simplayer.notonline', with: [name] })),
    }
}));

vi.mock('../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy', async (importOriginal) => {
    const actual = await importOriginal();
    return { ...actual, VanillaCommand: vi.fn() };
});

describe('playerlookCommand', () => {
    let mockTimeline;
    let mockUnderstudy;
    let mockEntityOrigin;

    beforeEach(() => {
        vi.clearAllMocks();
        mockTimeline = { addOneShot: vi.fn(), removeType: vi.fn() };
        mockUnderstudy = { look: vi.fn(), stopLooking: vi.fn(), name: 'TestBot', actions: { timeline: mockTimeline } };
        const mockEntity = new Entity();
        mockEntity.getBlockFromViewDirection = vi.fn(() => ({ block: { location: { x: 0, y: 64, z: 0 } }, face: 'North', faceLocation: { x: 0.5, y: 0.5, z: 0 } }));
        mockEntity.getEntitiesFromViewDirection = vi.fn(() => [{ entity: new Entity() }]);
        mockEntityOrigin = { getSource: vi.fn(() => mockEntity), sendMessage: vi.fn() };
    });

    it('returns failure when the simplayer is not online', () => {
        vi.mocked(Understudies.get).mockReturnValue(undefined);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.UP);
        expect(result).toBeUndefined();
        expect(mockEntityOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'simplayer.notonline', with: ['TestBot'] });
    });

    it.each([LOOK_OPTIONS.UP, LOOK_OPTIONS.DOWN, LOOK_OPTIONS.NORTH, LOOK_OPTIONS.SOUTH, LOOK_OPTIONS.EAST, LOOK_OPTIONS.WEST])(
        'returns success for cardinal direction: %s',
        (direction) => {
            vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
            const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', direction);
            expect(result.status).toBe(CustomCommandStatus.Success);
            expect(mockTimeline.addOneShot).toHaveBeenCalledWith('look', { target: { kind: 'cardinal', direction } }, { delay: 0 });
        }
    );

    it('returns failure for BLOCK option from a non-entity source', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' });
        const result = playerlookCommand.playerlookCommand(serverOrigin, 'TestBot', LOOK_OPTIONS.BLOCK);
        expect(result.status).toBe(CustomCommandStatus.Failure);
        expect(result.message).toBe('commands.playerlook.block.entityonly');
    });

    it('returns failure for BLOCK option when no block is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        mockEntityOrigin.getSource().getBlockFromViewDirection.mockReturnValue(undefined);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.BLOCK);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for BLOCK option when a block is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.BLOCK);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for ENTITY option from a non-entity source', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' });
        const result = playerlookCommand.playerlookCommand(serverOrigin, 'TestBot', LOOK_OPTIONS.ENTITY);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns failure for ENTITY option when no entity is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        mockEntityOrigin.getSource().getEntitiesFromViewDirection.mockReturnValue([]);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ENTITY);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for ENTITY option when an entity is in view', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ENTITY);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for ME option from server origin', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const serverOrigin = new ServerCommandOrigin({ sourceType: 'Server' });
        const result = playerlookCommand.playerlookCommand(serverOrigin, 'TestBot', LOOK_OPTIONS.ME);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for ME option from entity origin', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ME);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns success for AT option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.AT, 0, 64, 0);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for AT option when no position is provided', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.AT);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for ROTATION option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ROTATION, 0, 0);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for ROTATION option when no rotation is provided', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ROTATION);
        expect(result.status).toBe(CustomCommandStatus.Failure);
    });

    it('returns success for STOP option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.STOP);
        expect(result.status).toBe(CustomCommandStatus.Success);
    });

    it('returns failure for invalid look option', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const result = playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', 'invalid');
        expect(result).toBeUndefined();
        expect(mockEntityOrigin.sendMessage).toHaveBeenCalledWith({ translate: 'commands.playerlook.invalidoption', with: ['invalid'] });
    });

    it('adds a look event at the viewed block face', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        mockEntityOrigin.getSource().getBlockFromViewDirection.mockReturnValue({ block: { location: { x: 1, y: 64, z: 2 } }, face: 'North', faceLocation: { x: 0.5, y: 0.5, z: 0 } });
        playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.BLOCK);
        const [type, params, options] = mockTimeline.addOneShot.mock.calls[0];
        expect(type).toBe('look');
        expect(params.target.kind).toBe('location');
        expect({ x: params.target.location.x, y: params.target.location.y, z: params.target.location.z }).toEqual({ x: 1.5, y: 64.5, z: 2 });
        expect(options).toEqual({ delay: 0 });
    });

    it('adds a look event at the viewed entity', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        const entity = mockEntityOrigin.getSource().getEntitiesFromViewDirection()[0].entity;
        mockEntityOrigin.getSource().getEntitiesFromViewDirection.mockReturnValue([{ entity }]);
        playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ENTITY);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('look', { target: { kind: 'entity', entity } }, { delay: 0 });
    });

    it('adds a look event at the command source for ME', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ME);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('look', { target: { kind: 'entity', entity: mockEntityOrigin.getSource() } }, { delay: 0 });
    });

    it('adds a look event at coordinates for AT', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.AT, 1, 64, 2);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('look', { target: { kind: 'location', location: { x: 1, y: 64, z: 2 } } }, { delay: 0 });
    });

    it('adds a look event at a rotation', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.ROTATION, 10, 90);
        expect(mockTimeline.addOneShot).toHaveBeenCalledWith('look', { target: { kind: 'rotation', rotation: { x: 10, y: 90 } } }, { delay: 0 });
    });

    it('removes look tracks and stops looking for STOP', () => {
        vi.mocked(Understudies.get).mockReturnValue(mockUnderstudy);
        playerlookCommand.playerlookCommand(mockEntityOrigin, 'TestBot', LOOK_OPTIONS.STOP);
        expect(mockTimeline.removeType).toHaveBeenCalledWith('look');
        expect(system.run).toHaveBeenCalled();
        system.run.mock.calls.at(-1)[0]();
        expect(mockUnderstudy.stopLooking).toHaveBeenCalled();
    });
});
