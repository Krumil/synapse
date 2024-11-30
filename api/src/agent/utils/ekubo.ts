// Ekubo constants
export const EKUBO_TICK_SIZE = 1.000001;
export const EKUBO_TICK_SIZE_LOG = Math.log(EKUBO_TICK_SIZE);
export const EKUBO_TICK_SPACING = 5982; // Updated tick spacing
export const EKUBO_MAX_PRICE =
	"0x100000000000000000000000000000000"; // 2 ** 128
export const EKUBO_FEES_MULTIPLICATOR = '0x100000000000000000000000000000000';
export const DECIMALS = 18;

export const getStartingTick = (initialPrice: number) =>
	Math.floor(
		Math.log(initialPrice) / EKUBO_TICK_SIZE_LOG / EKUBO_TICK_SPACING
	) * EKUBO_TICK_SPACING;

export const EKUBO_BOUND = getStartingTick(Number(EKUBO_MAX_PRICE)); // Calculate EKUBO_BOUND

export const decimalsScale = (decimals: number) => `1${Array(decimals).fill('0').join('')}`