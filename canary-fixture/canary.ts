export {};
declare const unsafe: any;
export const assignment: string = unsafe;
unsafe();
unsafe.property;
function needsString(value: string) { return value; }
needsString(unsafe);
export function unsafeReturn(): string { return unsafe; }
export const unsafeMinus = -'not a number';
export async function nonThenable() { await 42; }
const numbers = [1, 2, 3];
delete numbers[0];
for (const key in numbers) { console.log(key); }
export type Duplicate = string | string;
export type Redundant = any | string;
Promise.resolve(42);
if (Promise.resolve(true)) { console.log('promise condition'); }
setTimeout('console.log(1)', 10);
declare const definite: string;
export const redundantAssertion = definite!;
enum Flag { Yes = 1 }
export function compare(flag: Flag) { return flag === 1; }
export function throwString(): never { throw 'failure'; }
void Promise.reject('failure');
export async function missingAwait() { return 42; }
export const mixed = {} + 42;
export const interpolated = `${{}}`;
export const baseString = ({}).toString();
class Counter { value = 0; increment() { return ++this.value; } }
export const detached = new Counter().increment;
