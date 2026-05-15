export const stripAnsi = (value: string) => {
	return value.replace(/\u001b\[[0-9;]*m/g, "");
};
