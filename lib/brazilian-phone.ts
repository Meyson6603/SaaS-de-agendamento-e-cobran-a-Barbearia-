const validAreaCodes = new Set([
  "11",
  "12",
  "13",
  "14",
  "15",
  "16",
  "17",
  "18",
  "19",
  "21",
  "22",
  "24",
  "27",
  "28",
  "31",
  "32",
  "33",
  "34",
  "35",
  "37",
  "38",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
  "47",
  "48",
  "49",
  "51",
  "53",
  "54",
  "55",
  "61",
  "62",
  "63",
  "64",
  "65",
  "66",
  "67",
  "68",
  "69",
  "71",
  "73",
  "74",
  "75",
  "77",
  "79",
  "81",
  "82",
  "83",
  "84",
  "85",
  "86",
  "87",
  "88",
  "89",
  "91",
  "92",
  "93",
  "94",
  "95",
  "96",
  "97",
  "98",
  "99",
]);

export function normalizeBrazilianPhone(input: string): string {
  const digits = input.replace(/\D/g, "");
  const trimmedInput = input.trim();

  if (
    (trimmedInput.startsWith("+55") || trimmedInput.startsWith("0055")) &&
    (digits.length === 12 || digits.length === 13)
  ) {
    return digits.slice(2);
  }

  return digits;
}

export function isValidBrazilianPhone(input: string): boolean {
  const digits = normalizeBrazilianPhone(input);
  const areaCode = digits.slice(0, 2);
  const subscriberNumber = digits.slice(2);

  if (!validAreaCodes.has(areaCode)) {
    return false;
  }

  return (
    (subscriberNumber.length === 8 && /^[2-5]\d{7}$/.test(subscriberNumber)) ||
    (subscriberNumber.length === 9 && /^9\d{8}$/.test(subscriberNumber))
  );
}

export function formatBrazilianPhone(input: string): string {
  const digits = normalizeBrazilianPhone(input).slice(0, 11);

  if (digits.length <= 2) {
    return digits ? `(${digits}` : "";
  }

  const areaCode = digits.slice(0, 2);
  const subscriberNumber = digits.slice(2);
  const isMobile = digits.length > 10;
  const prefixLength = isMobile ? 5 : 4;

  if (!subscriberNumber) {
    return `(${areaCode}) `;
  }

  if (subscriberNumber.length <= prefixLength) {
    return `(${areaCode}) ${subscriberNumber}`;
  }

  return `(${areaCode}) ${subscriberNumber.slice(0, prefixLength)}-${subscriberNumber.slice(prefixLength)}`;
}
