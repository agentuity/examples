/**
 * Sample reference files seeded into the workspace for Claude Code to analyze, modify, and execute.
 */
export const SAMPLE_FILES = [
	{
		name: 'fibonacci.ts',
		content: `/** Fibonacci sequence generator with multiple approaches. */

function fibonacciRecursive(n: number): number {
  if (n <= 1) return n;
  return fibonacciRecursive(n - 1) + fibonacciRecursive(n - 2);
}

function fibonacciIterative(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

function* fibonacciGenerator(limit: number): Generator<number> {
  let a = 0, b = 1;
  while (a <= limit) {
    yield a;
    [a, b] = [b, a + b];
  }
}

console.log("First 10 Fibonacci numbers:");
for (let i = 0; i < 10; i++) {
  console.log(\`  F(\${i}) = \${fibonacciIterative(i)}\`);
}
console.log("\\nFibonacci numbers up to 100:");
console.log([...fibonacciGenerator(100)]);
`,
	},
	{
		name: 'math-tricks.ts',
		content: `/** Collection of math utility functions. */

function isPrime(n: number): boolean {
  if (n < 2) return false;
  for (let i = 2; i <= Math.sqrt(n); i++) {
    if (n % i === 0) return false;
  }
  return true;
}

function factorial(n: number): number {
  return Array.from({ length: n }, (_, i) => i + 1).reduce((a, b) => a * b, 1);
}

function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a;
}

function lcm(a: number, b: number): number {
  return Math.abs(a * b) / gcd(a, b);
}

const primes = Array.from({ length: 48 }, (_, i) => i + 2).filter(isPrime);
console.log(\`Primes under 50: [\${primes.join(", ")}]\`);
console.log(\`10! = \${factorial(10)}\`);
console.log(\`GCD(48, 18) = \${gcd(48, 18)}\`);
console.log(\`LCM(12, 8) = \${lcm(12, 8)}\`);
`,
	},
	{
		name: 'class-example.ts',
		content: `/** Example of TypeScript classes with inheritance. */

class Animal {
  constructor(public name: string, public species: string) {}

  speak(): string {
    return \`\${this.name} makes a sound\`;
  }

  toString(): string {
    return \`Animal(name="\${this.name}", species="\${this.species}")\`;
  }
}

class Dog extends Animal {
  constructor(name: string, public breed: string) {
    super(name, "Canis familiaris");
  }

  speak(): string {
    return \`\${this.name} says Woof!\`;
  }

  fetch(item: string): string {
    return \`\${this.name} fetches the \${item}\`;
  }
}

class Cat extends Animal {
  constructor(name: string, public indoor: boolean = true) {
    super(name, "Felis catus");
  }

  speak(): string {
    return \`\${this.name} says Meow!\`;
  }
}

const dog = new Dog("Buddy", "Golden Retriever");
const cat = new Cat("Whiskers", true);
console.log(dog.speak());
console.log(dog.fetch("ball"));
console.log(cat.speak());
console.log(dog.toString());
`,
	},
	{
		name: 'hello.ts',
		content: `/** A simple TypeScript greeting example. */

function greet(name: string): string {
  return \`Hello, \${name}! Welcome to the Claude Code Agent.\`;
}

function fibonacci(n: number): number {
  if (n <= 1) return n;
  let a = 0, b = 1;
  for (let i = 2; i <= n; i++) {
    [a, b] = [b, a + b];
  }
  return b;
}

console.log(greet("World"));
console.log("First 10 Fibonacci numbers:");
for (let i = 0; i < 10; i++) {
  console.log(\`  F(\${i}) = \${fibonacci(i)}\`);
}
`,
	},
];
