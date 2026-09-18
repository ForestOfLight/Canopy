export class QuickFillContainerPolicy {
    static AdaptiveShape = 'adaptive';

    static SpecialShapes = Object.freeze({
        'minecraft:furnace': 'furnace:3',
        'minecraft:lit_furnace': 'furnace:3',
        'minecraft:smoker': 'smoker:3',
        'minecraft:lit_smoker': 'smoker:3',
        'minecraft:blast_furnace': 'blast_furnace:3',
        'minecraft:lit_blast_furnace': 'blast_furnace:3',
        'minecraft:brewing_stand': 'brewing:5',
        'minecraft:chiseled_bookshelf': 'bookshelf:6',
        'minecraft:crafter': 'crafter:9'
    });

    static getShape(block, container) {
        if (!block || !container)
            return;

        return this.SpecialShapes[block.typeId] ??
            `generic:${container.size}`;
    }

    static isCompatible(sourceShape, targetShape) {
        if (!sourceShape || !targetShape)
            return false;

        if (sourceShape === this.AdaptiveShape)
            return true;

        return sourceShape === targetShape;
    }

    static isGeneric(shape) {
        return shape?.startsWith('generic:') ?? false;
    }

    static canDirectFill(block, container) {
        return this.isGeneric(
            this.getShape(block, container)
        );
    }
}