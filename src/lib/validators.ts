// Basic validators for Brazilian CPF/CNPJ and phone, using simple checks

export function isEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

export function onlyDigits(value: string): string {
  return (value || "").replace(/\D+/g, "");
}

export function isCPF(value: string): boolean {
  const cpf = onlyDigits(value);
  if (!cpf || cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false; // repeated digits
  // Validate check digits
  let sum = 0;
  for (let i = 0; i < 9; i++) sum += parseInt(cpf.charAt(i)) * (10 - i);
  let rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  if (rev !== parseInt(cpf.charAt(9))) return false;
  sum = 0;
  for (let i = 0; i < 10; i++) sum += parseInt(cpf.charAt(i)) * (11 - i);
  rev = 11 - (sum % 11);
  if (rev === 10 || rev === 11) rev = 0;
  return rev === parseInt(cpf.charAt(10));
}

export function isCNPJ(value: string): boolean {
  const cnpj = onlyDigits(value);
  if (!cnpj || cnpj.length !== 14) return false;
  if (/^(\d)\1{13}$/.test(cnpj)) return false; // repeated digits
  const calc = (x: number) => {
    let n = 0;
    const nums = cnpj.substring(0, x);
    const posInit = x - 7;
    let pos = posInit;
    for (let i = x; i >= 1; i--) {
      n += parseInt(nums.charAt(x - i)) * pos--;
      if (pos < 2) pos = 9;
    }
    const r = n % 11;
    return r < 2 ? 0 : 11 - r;
  };
  const d1 = calc(12);
  const d2 = calc(13);
  return d1 === parseInt(cnpj.charAt(12)) && d2 === parseInt(cnpj.charAt(13));
}

export function isCpfOrCnpj(value: string): boolean {
  const digits = onlyDigits(value);
  return digits.length === 11 ? isCPF(digits) : digits.length === 14 ? isCNPJ(digits) : false;
}

export function isBrazilPhone(value: string): boolean {
  // Very permissive: country or area code optional, 10-11 digits total
  const digits = onlyDigits(value);
  return digits.length >= 10 && digits.length <= 11;
}

