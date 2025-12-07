/**
 * バリデーションユーティリティ
 * 入力データの検証機能を提供
 */

/**
 * バリデーション結果
 */
export interface ValidationResult {
  isValid: boolean;
  error?: string;
}

/**
 * ISBN形式を検証
 * ISBN-10またはISBN-13の形式をチェック
 * @param isbn 検証するISBN文字列
 * @returns バリデーション結果
 */
export const validateISBN = (isbn: string): ValidationResult => {
  if (!isbn || isbn.trim() === '') {
    return {
      isValid: false,
      error: 'ISBNを入力してください',
    };
  }

  // ハイフンとスペースを除去
  const cleanISBN = isbn.replace(/[-\s]/g, '');

  // ISBN-10の検証
  if (cleanISBN.length === 10) {
    return validateISBN10(cleanISBN);
  }

  // ISBN-13の検証
  if (cleanISBN.length === 13) {
    return validateISBN13(cleanISBN);
  }

  return {
    isValid: false,
    error: 'ISBNは10桁または13桁である必要があります',
  };
};

/**
 * ISBN-10形式を検証
 * @param isbn クリーンなISBN-10文字列（10桁）
 * @returns バリデーション結果
 */
const validateISBN10 = (isbn: string): ValidationResult => {
  // 最初の9桁は数字、最後の1桁は数字またはX
  if (!/^\d{9}[\dX]$/.test(isbn)) {
    return {
      isValid: false,
      error: '無効なISBN-10形式です',
    };
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(isbn[i]) * (10 - i);
  }

  // 最後の桁（チェックディジット）
  const checkDigit = isbn[9] === 'X' ? 10 : parseInt(isbn[9]);
  sum += checkDigit;

  // 合計が11で割り切れる必要がある
  if (sum % 11 !== 0) {
    return {
      isValid: false,
      error: '無効なISBN-10チェックサムです',
    };
  }

  return { isValid: true };
};

/**
 * ISBN-13形式を検証
 * @param isbn クリーンなISBN-13文字列（13桁）
 * @returns バリデーション結果
 */
const validateISBN13 = (isbn: string): ValidationResult => {
  // 13桁すべてが数字である必要がある
  if (!/^\d{13}$/.test(isbn)) {
    return {
      isValid: false,
      error: '無効なISBN-13形式です',
    };
  }

  let sum = 0;
  for (let i = 0; i < 12; i++) {
    const digit = parseInt(isbn[i]);
    // 偶数位置（0-indexed）は1倍、奇数位置は3倍
    sum += i % 2 === 0 ? digit : digit * 3;
  }

  // チェックディジット
  const checkDigit = parseInt(isbn[12]);
  const calculatedCheckDigit = (10 - (sum % 10)) % 10;

  if (checkDigit !== calculatedCheckDigit) {
    return {
      isValid: false,
      error: '無効なISBN-13チェックサムです',
    };
  }

  return { isValid: true };
};

/**
 * メールアドレス形式を検証
 * @param email 検証するメールアドレス
 * @returns バリデーション結果
 */
export const validateEmail = (email: string): ValidationResult => {
  if (!email || email.trim() === '') {
    return {
      isValid: false,
      error: 'メールアドレスを入力してください',
    };
  }

  // 基本的なメールアドレス形式の検証
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(email)) {
    return {
      isValid: false,
      error: '有効なメールアドレスを入力してください',
    };
  }

  // より厳密な検証（オプション）
  // - @の前に少なくとも1文字
  // - @の後にドメイン名
  // - ドットの後にトップレベルドメイン（2文字以上）
  const strictEmailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;

  if (!strictEmailRegex.test(email)) {
    return {
      isValid: false,
      error: 'メールアドレスの形式が正しくありません',
    };
  }

  return { isValid: true };
};

/**
 * 必須フィールドを検証
 * @param value 検証する値
 * @param fieldName フィールド名
 * @returns バリデーション結果
 */
export const validateRequired = (value: string, fieldName: string = 'この項目'): ValidationResult => {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName}を入力してください`,
    };
  }

  return { isValid: true };
};

/**
 * 文字列の長さを検証
 * @param value 検証する値
 * @param minLength 最小長
 * @param maxLength 最大長
 * @param fieldName フィールド名
 * @returns バリデーション結果
 */
export const validateLength = (
  value: string,
  minLength: number,
  maxLength: number,
  fieldName: string = 'この項目'
): ValidationResult => {
  if (value.length < minLength) {
    return {
      isValid: false,
      error: `${fieldName}は${minLength}文字以上で入力してください`,
    };
  }

  if (value.length > maxLength) {
    return {
      isValid: false,
      error: `${fieldName}は${maxLength}文字以内で入力してください`,
    };
  }

  return { isValid: true };
};

/**
 * 数値形式を検証
 * @param value 検証する値
 * @param fieldName フィールド名
 * @returns バリデーション結果
 */
export const validateNumber = (value: string, fieldName: string = 'この項目'): ValidationResult => {
  if (!value || value.trim() === '') {
    return {
      isValid: false,
      error: `${fieldName}を入力してください`,
    };
  }

  if (isNaN(Number(value))) {
    return {
      isValid: false,
      error: `${fieldName}は数値で入力してください`,
    };
  }

  return { isValid: true };
};

/**
 * 複数のバリデーションを実行
 * @param validations バリデーション結果の配列
 * @returns 最初のエラー、またはすべて成功の場合は成功
 */
export const combineValidations = (...validations: ValidationResult[]): ValidationResult => {
  for (const validation of validations) {
    if (!validation.isValid) {
      return validation;
    }
  }

  return { isValid: true };
};
