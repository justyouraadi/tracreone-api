// Prisma maps BigInt columns (e.g. legacy `timestamp` fields) to JS BigInt,
// which JSON.stringify cannot serialize by default. Serialize as strings
// globally so any route returning such a field doesn't crash.
declare global {
  interface BigInt {
    toJSON(): string;
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
(BigInt.prototype as any).toJSON = function () {
  return this.toString();
};

export {};
