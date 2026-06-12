/**
 * Sandboxed tool framework for workflow `tool` nodes.
 *
 * Node input format: "<tool>: <args>", e.g. "calc: (40 + 2) * 10".
 * Tools are pure functions over their argument string — no eval, no
 * filesystem, no network. Unknown tools fail the node explicitly.
 */

type ToolFn = (args: string) => string;

const registry: Record<string, { run: ToolFn; description: string }> = {
  calc: {
    description: "Evaluate an arithmetic expression (+ - * / % and parentheses)",
    run: (args) => String(evaluateArithmetic(args)),
  },
  timestamp: {
    description: "Current UTC timestamp (ISO 8601)",
    run: () => new Date().toISOString(),
  },
  echo: {
    description: "Return the argument unchanged (pipeline plumbing/testing)",
    run: (args) => args,
  },
  uppercase: {
    description: "Uppercase the argument",
    run: (args) => args.toUpperCase(),
  },
  word_count: {
    description: "Count words in the argument",
    run: (args) => String(args.trim() ? args.trim().split(/\s+/).length : 0),
  },
};

export function listTools(): string[] {
  return Object.keys(registry);
}

export function executeTool(input: string): string {
  const sep = input.indexOf(":");
  const name = (sep === -1 ? input : input.slice(0, sep)).trim().toLowerCase();
  const args = sep === -1 ? "" : input.slice(sep + 1).trim();

  const tool = registry[name];
  if (!tool) {
    throw new Error(`Unknown tool "${name}". Available: ${listTools().join(", ")}`);
  }
  return tool.run(args);
}

/* ------------------------------------------------------------------
   Safe arithmetic: recursive-descent parser, numbers + - * / % ( ).
   Strictly no eval / Function — the grammar IS the sandbox.
   ------------------------------------------------------------------ */
function evaluateArithmetic(expr: string): number {
  if (expr.length > 500) throw new Error("Expression too long");
  let pos = 0;

  const peek = () => expr[pos];
  const skipWs = () => { while (pos < expr.length && /\s/.test(expr[pos])) pos++; };

  function parseExpression(): number {
    let value = parseTerm();
    skipWs();
    while (pos < expr.length && (peek() === "+" || peek() === "-")) {
      const op = expr[pos++];
      const rhs = parseTerm();
      value = op === "+" ? value + rhs : value - rhs;
      skipWs();
    }
    return value;
  }

  function parseTerm(): number {
    let value = parseFactor();
    skipWs();
    while (pos < expr.length && (peek() === "*" || peek() === "/" || peek() === "%")) {
      const op = expr[pos++];
      const rhs = parseFactor();
      if (op === "*") value *= rhs;
      else if (op === "/") {
        if (rhs === 0) throw new Error("Division by zero");
        value /= rhs;
      } else {
        if (rhs === 0) throw new Error("Modulo by zero");
        value %= rhs;
      }
      skipWs();
    }
    return value;
  }

  function parseFactor(): number {
    skipWs();
    if (peek() === "-") { pos++; return -parseFactor(); }
    if (peek() === "(") {
      pos++;
      const value = parseExpression();
      skipWs();
      if (peek() !== ")") throw new Error("Missing closing parenthesis");
      pos++;
      return value;
    }
    const start = pos;
    while (pos < expr.length && /[\d.]/.test(expr[pos])) pos++;
    if (start === pos) throw new Error(`Unexpected character "${expr[pos] ?? 'end'}" at position ${pos}`);
    const num = Number(expr.slice(start, pos));
    if (Number.isNaN(num)) throw new Error(`Invalid number at position ${start}`);
    return num;
  }

  const result = parseExpression();
  skipWs();
  if (pos < expr.length) throw new Error(`Unexpected trailing input "${expr.slice(pos, pos + 10)}"`);
  if (!Number.isFinite(result)) throw new Error("Result is not finite");
  return result;
}
