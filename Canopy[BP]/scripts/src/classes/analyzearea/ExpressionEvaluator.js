import jsep from '../../../lib/jsep/jsep.js';

export class ExpressionEvaluator {
    constructor(expression) {
        this.expression = expression;
        this.ast = jsep(expression); // throws on syntax error
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

    // Returns { object, value } so CallExpression can bind `this` to `object`.
    #evalMember(node, block) {
        const object = this.#evalNode(node.object, block);
        const key = node.computed ? this.#evalNode(node.property, block) : node.property.name;
        return { object, value: object?.[key] };
    }

    #evalCall(node, block) {
        if (node.callee.type === 'MemberExpression') {
            const { object, value: fn } = this.#evalMember(node.callee, block);
            const args = node.arguments.map((arg) => this.#evalNode(arg, block));
            return fn.apply(object, args);
        }
        // bare-identifier call, e.g. getTags() -> block.getTags(), bound to block
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
            case '==': return left == right;
            case '!=': return left != right;
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
