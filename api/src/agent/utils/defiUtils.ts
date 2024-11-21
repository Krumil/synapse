export function convertAmountToSmallestUnit(amount: string, decimals: number): string {
	const amountNum = parseFloat(amount);
	if (isNaN(amountNum)) {
		throw new Error(`Invalid amount: ${amount}`);
	}
	const factor = 10 ** decimals;
	return (amountNum * factor).toFixed(0);
}

export function splitUint256(amount: string): { low: string; high: string } {
	const amountBigInt = BigInt(amount);
	const maxUint128 = BigInt("0x100000000000000000000000000000000");
	return {
		low: (amountBigInt % maxUint128).toString(),
		high: (amountBigInt / maxUint128).toString()
	};
}

export function hexToDecimalString(hex: string): string {
	return hex.startsWith("0x") ? BigInt(hex).toString(10) : hex;
}

export function replacePlaceholders(str: string, params: Record<string, string | undefined>): string {
	return str.replace(/\{([^}]+)\}/g, (match, p1) => {
		const value = params[p1];
		if (value === undefined) {
			throw new Error(`Missing parameter "${p1}" for transaction generation.`);
		}
		return value;
	});
}

export function getDeadline(bufferMinutes: number = 15): string {
	return (Math.floor(Date.now() / 1000) + bufferMinutes * 60).toString();
}

export function parseUnderlyingTokens(pairKey: string): string[] {
	return pairKey.split('/');
}

export function reconstructUint256(low: string | number | bigint, high: string | number | bigint): bigint {
	const lowBigInt = BigInt(low);
	const highBigInt = BigInt(high);
	return (highBigInt << BigInt(128)) + lowBigInt;
}