import jsep from '../../../lib/jsep/jsep.js';
import { readOnlyMethods } from './readOnlyMethods.js';
import { ExpressionForbiddenError } from './ExpressionForbiddenError.js';

const FORBIDDEN_KEYS = new Set(['constructor', '__proto__', 'prototype']);

export class ExpressionEvaluator {
    constructor(expression) {
        this.expression = expression;
        this.ast = jsep(expression);
        this.#assertSafe(this.ast);
    }

    #assertSafe(node) {
        switch (node.type) {
            case 'Literal':
            case 'Identifier':
                return;
            case 'MemberExpression':
                if (!node.computed && FORBIDDEN_KEYS.has(node.property.name)) {
                    console.warn(`[Canopy] Forbidden property access in expression: ${this.expression}, property: ${node.property.name}`);
                    throw new ExpressionForbiddenError(`Forbidden property access: ${node.property.name}`);
                }
                this.#assertSafe(node.object);
                this.#assertSafe(node.property);
                return;
            case 'CallExpression': {
                this.#assertSafe(node.callee);
                const name = this.#staticCalleeName(node.callee);
                if (name !== void 0 && !readOnlyMethods.has(name))
                    throw new ExpressionForbiddenError(`Forbidden method call: ${name}`);
                node.arguments.forEach((arg) => this.#assertSafe(arg));
                return;
            }
            case 'UnaryExpression':
                this.#assertSafe(node.argument);
                return;
            case 'BinaryExpression':
            case 'LogicalExpression':
                this.#assertSafe(node.left);
                this.#assertSafe(node.right);
                return;
            default:
                throw new Error(`Unsupported expression node: ${node.type}`);
        }
    }

    #staticCalleeName(callee) {
        if (callee.type === 'Identifier')
            return callee.name;
        if (callee.type === 'MemberExpression' && !callee.computed)
            return callee.property.name;
        return void 0;
    }

    evaluate(block) {
        return this.#evalNode(this.ast, block);
    }

    #evalNode(node, block) {
        switch (node.type) {
            case 'Literal':
                return node.value;
            case 'Identifier':
                return node.name === 'block' ? block : block[node.name];
            case 'MemberExpression':
                return this.#evalMember(node, block).value;
            case 'CallExpression':
                return this.#evalCall(node, block);
            case 'UnaryExpression':
                return this.#evalUnary(node, block);
            case 'BinaryExpression':
            case 'LogicalExpression':
                return this.#evalBinary(node, block);
            default:
                throw new Error(`Unsupported expression node: ${node.type}`);
        }
    }

    #evalMember(node, block) {
        const object = this.#evalNode(node.object, block);
        const key = node.computed ? this.#evalNode(node.property, block) : node.property.name;
        if (FORBIDDEN_KEYS.has(key))
            throw new ExpressionForbiddenError(`Forbidden property access: ${key}`);
        return { object, key, value: object?.[key] };
    }

    #evalCall(node, block) {
        if (node.callee.type === 'MemberExpression') {
            const { object, key, value: fn } = this.#evalMember(node.callee, block);
            if (!readOnlyMethods.has(key))
                throw new ExpressionForbiddenError(`Forbidden method call: ${key}`);
            const args = node.arguments.map((arg) => this.#evalNode(arg, block));
            return fn.apply(object, args);
        }
        const name = node.callee.name;
        if (!readOnlyMethods.has(name))
            throw new ExpressionForbiddenError(`Forbidden method call: ${name}`);
        const fn = this.#evalNode(node.callee, block);
        const args = node.arguments.map((arg) => this.#evalNode(arg, block));
        return fn.apply(block, args);
    }

    #evalUnary(node, block) {
        const arg = this.#evalNode(node.argument, block);
        switch (node.operator) {
            case '!': return !arg;
            case '-': return -arg;
            case '+': return +arg;
            default: throw new Error(`Unsupported unary operator: ${node.operator}`);
        }
    }

    #evalBinary(node, block) {
        const op = node.operator;
        if (op === '&&') return this.#evalNode(node.left, block) && this.#evalNode(node.right, block);
        if (op === '||') return this.#evalNode(node.left, block) || this.#evalNode(node.right, block);
        const left = this.#evalNode(node.left, block);
        const right = this.#evalNode(node.right, block);
        switch (op) {
            case '===': return left === right;
            case '!==': return left !== right;
            case '==': return left === right;
            case '!=': return left !== right;
            case '<': return left < right;
            case '>': return left > right;
            case '<=': return left <= right;
            case '>=': return left >= right;
            case '+': return left + right;
            case '-': return left - right;
            case '*': return left * right;
            case '/': return left / right;
            case '%': return left % right;
            default: throw new Error(`Unsupported binary operator: ${op}`);
        }
    }
}
