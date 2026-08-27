const base32Alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

const decodeBase32 = (value: string) => {
	const normalized = value.replace(/=+$/u, "").replace(/\s+/gu, "").toUpperCase();
	if (normalized.length < 16 || !/^[A-Z2-7]+$/u.test(normalized)) return null;
	let accumulator = 0;
	let bitCount = 0;
	const bytes: number[] = [];
	for (const character of normalized) {
		accumulator = (accumulator << 5) | base32Alphabet.indexOf(character);
		bitCount += 5;
		while (bitCount >= 8) {
			bitCount -= 8;
			bytes.push((accumulator >> bitCount) & 0xff);
		}
	}
	return new Uint8Array(bytes);
};

const constantTimeEqual = (left: string, right: string) => {
	if (left.length !== right.length) return false;
	let difference = 0;
	for (let index = 0; index < left.length; index += 1) {
		difference |= left.charCodeAt(index) ^ right.charCodeAt(index);
	}
	return difference === 0;
};

const counterBytes = (counter: bigint) => {
	const bytes = new Uint8Array(8);
	let remaining = counter;
	for (let index = 7; index >= 0; index -= 1) {
		bytes[index] = Number(remaining & 0xffn);
		remaining >>= 8n;
	}
	return bytes;
};

export const verifyTotpCode = async (
	secret: string,
	code: string,
	nowMs = Date.now(),
	options: { digits?: 6 | 8; window?: number } = {},
) => {
	const digits = options.digits ?? 6;
	const window = Math.max(0, Math.min(2, options.window ?? 1));
	if (!new RegExp(`^\\d{${digits}}$`, "u").test(code)) return false;
	const keyBytes = decodeBase32(secret);
	if (!keyBytes) return false;
	const key = await crypto.subtle.importKey(
		"raw",
		keyBytes,
		{ name: "HMAC", hash: "SHA-1" },
		false,
		["sign"],
	);
	const currentCounter = BigInt(Math.floor(nowMs / 30_000));
	for (let offset = -window; offset <= window; offset += 1) {
		const counter = currentCounter + BigInt(offset);
		if (counter < 0n) continue;
		const digest = new Uint8Array(
			await crypto.subtle.sign("HMAC", key, counterBytes(counter)),
		);
		const digestOffset = digest[digest.length - 1] & 0x0f;
		const binary =
			((digest[digestOffset] & 0x7f) << 24) |
			(digest[digestOffset + 1] << 16) |
			(digest[digestOffset + 2] << 8) |
			digest[digestOffset + 3];
		const expected = String(binary % 10 ** digits).padStart(digits, "0");
		if (constantTimeEqual(code, expected)) return true;
	}
	return false;
};
