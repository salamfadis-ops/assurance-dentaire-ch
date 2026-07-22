export type SupportedDialCode = "+41" | "+33";

function digitsOnly(value: string) {
  return value.replace(/\D/g, "");
}

export function formatInternationalPhone(dialCode: SupportedDialCode, nationalNumber: string) {
  let national = digitsOnly(nationalNumber);
  const prefix = dialCode.slice(1);

  if (national.startsWith("00" + prefix)) national = national.slice(prefix.length + 2);
  if (national.startsWith(prefix) && national.length === 11) national = national.slice(2);
  if (national.startsWith("0")) national = national.slice(1);

  return `${dialCode}${national}`;
}

export function normalizeSwissFrenchPhone(value: string): string | null {
  const trimmed = value.trim();
  let digits = digitsOnly(trimmed);

  if (digits.startsWith("00")) digits = digits.slice(2);
  if (digits.startsWith("0") && digits.length === 10) digits = `41${digits.slice(1)}`;

  const isSwiss = digits.startsWith("41") && digits.length === 11;
  const isFrench = digits.startsWith("33") && digits.length === 11;
  const national = digits.slice(2);

  if ((!isSwiss && !isFrench) || /^0{9}$/.test(national)) return null;
  return `+${digits}`;
}

export function isValidSwissFrenchPhone(value: string) {
  return normalizeSwissFrenchPhone(value) !== null;
}
