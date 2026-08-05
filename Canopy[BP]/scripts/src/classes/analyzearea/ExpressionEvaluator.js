import jsep from '../../../lib/jsep/jsep.js';
import { ItemStack } from '@minecraft/server';
import { readOnlyMethods } from './readOnlyMethods.js';
import { SAFE_JS_METHODS } from './safeJsMethods.js';
import { ExpressionForbiddenError } from './ExpressionForbiddenError.js';

const FORBIDDEN_KEYS = new Set(['constructor', '__proto__', 'prototype']);
const ALLOWED_METHODS = new Set([...readOnlyMethods, ...SAFE_JS_METHODS]);

jsep.plugins.register({
    name: 'analyzearea-new',
    init() {
        jsep.hooks.add('gobble-token', function gobbleNew(env) {
            if (this.expr.substr(this.index, 3) !== 'new' || jsep.isIdentifierPart(this.expr.charCodeAt(this.index + 3)))
                return;
            this.index += 3;
            this.gobbleSpaces();
            const callee = this.gobbleIdentifier();
            this.gobbleSpaces();
            if (this.code !== jsep.OPAREN_CODE)
                this.throwError(`Expected ( after new ${callee.name}`);
            this.index++;
            const args = this.gobbleArguments(jsep.CPAREN_CODE);
            env.node = this.gobbleTokenProperty({ type: 'NewExpression', callee, arguments: args });
        });
    }
});

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
                if (name !== void 0 && !ALLOWED_METHODS.has(name))
                    throw new ExpressionForbiddenError(`Forbidden method call: ${name}`);
                node.arguments.forEach((arg) => this.#assertSafe(arg));
                return;
            }
            case 'NewExpression':
                if (node.callee.type !== 'Identifier' || node.callee.name !== 'ItemStack')
                    throw new ExpressionForbiddenError("Only 'new ItemStack(...)' may be constructed");
                node.arguments.forEach((arg) => this.#assertSafe(arg));
                return;
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
            case 'NewExpression':
                return this.#evalNew(node, block);
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
            if (!ALLOWED_METHODS.has(key))
                throw new ExpressionForbiddenError(`Forbidden method call: ${key}`);
            const args = node.arguments.map((arg) => this.#evalNode(arg, block));
            return fn.apply(object, args);
        }
        const name = node.callee.name;
        if (!ALLOWED_METHODS.has(name))
            throw new ExpressionForbiddenError(`Forbidden method call: ${name}`);
        const fn = this.#evalNode(node.callee, block);
        const args = node.arguments.map((arg) => this.#evalNode(arg, block));
        return fn.apply(block, args);
    }

    #evalNew(node, block) {
        if (node.callee.type !== 'Identifier' || node.callee.name !== 'ItemStack')
            throw new ExpressionForbiddenError("Only 'new ItemStack(...)' may be constructed");
        const args = node.arguments.map((arg) => this.#evalNode(arg, block));
        return new ItemStack(...args);
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
