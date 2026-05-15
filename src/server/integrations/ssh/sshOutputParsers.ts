export const firstLine = (value: string, fallback = "") => {
	return (
		value
			.split(/\r?\n/)
			.map((line) => line.trim())
			.find(Boolean) || fallback
	);
};

export const parseNumber = (value: string | undefined, fallback = 0) => {
	const parsed = Number(value);
	return Number.isFinite(parsed) ? parsed : fallback;
};

export const parseJsonLines = <T>(raw: string): T[] => {
	return raw
		.split(/\r?\n/)
		.map((line) => line.trim())
		.filter(Boolean)
		.flatMap((line) => {
			try {
				return [JSON.parse(line) as T];
			} catch {
				return [];
			}
		});
};

export const parsePercent = (value?: string) => {
	if (!value) return undefined;

	const parsed = Number(value.replace("%", ""));
	return Number.isFinite(parsed) ? parsed : undefined;
};
