import { beforeAll, describe, expect, it, vi } from "vitest";
import { RenderEndGatewayExits } from "../../../../../../Canopy[BP]/scripts/src/rules/infodisplay/RenderEndGatewayExits";
import { InfoDisplayRule } from "../../../../../../Canopy[BP]/scripts/lib/canopy/Canopy";

describe('RenderEndGatewayExits', () => {
    let renderEndGatewayExits;
    beforeAll(() => {
        const player = { id: 'player1', dimension: { getBlock: () => ({}) }, location: {} };
        renderEndGatewayExits = new RenderEndGatewayExits(player);
    });

    describe('constructor', () => {
        it('should create a new infodisplay rule', () => {
            expect(renderEndGatewayExits.rule).toBeInstanceOf(InfoDisplayRule);
        });

        it('should have the correct identifier', () => {
            expect(renderEndGatewayExits.identifier).toBe('renderEndGatewayExits');
        });
    });

    describe('onEnable', () => {
        beforeAll(() => {
            renderEndGatewayExits.startRender();
        });

        it('should start finding and rendering end gateway exits', () => {
            const spy = vi.spyOn(renderEndGatewayExits.endGatewayExitFinder, 'onTickTryFind');
            renderEndGatewayExits.onTick();
            expect(spy).toHaveBeenCalled();
        });

        it('should start finding and rendering end gateway exits', () => {
            const spy = vi.spyOn(renderEndGatewayExits, 'startRender');
            renderEndGatewayExits.rule.onEnable();
            expect(spy).toHaveBeenCalled();
        });
    });

    describe('onDisable', () => {
        beforeAll(() => {
            renderEndGatewayExits.startRender();
        });

        it('should destroy the endGatewayExitFinder', () => {
            const spy = vi.spyOn(renderEndGatewayExits.endGatewayExitFinder, 'destroy');
            renderEndGatewayExits.rule.onDisable();
            expect(spy).toHaveBeenCalled();
        });
    });
});