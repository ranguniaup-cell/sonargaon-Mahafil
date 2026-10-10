/**
 * Utility functions for handling Bangla and English digits.
 */

export const toEnglishDigits = (str: string | number | undefined | null): string => {
  if (str === undefined || str === null) return '';
  const strVal = String(str);
  const banglaToEnglish: { [key: string]: string } = {
    '০': '0', '১': '1', '২': '2', '৩': '3', '৪': '4',
    '৫': '5', '৬': '6', '৭': '7', '৮': '8', '৯': '9'
  };
  return strVal.replace(/[০-৯]/g, (match) => banglaToEnglish[match]);
};

export const toBanglaDigits = (str: string | number | undefined | null): string => {
  if (str === undefined || str === null) return '';
  const strVal = String(str);
  const englishToBangla: { [key: string]: string } = {
    '0': '০', '1': '১', '2': '২', '3': '৩', '4': '৪',
    '5': '৫', '6': '৬', '7': '৭', '8': '৮', '9': '৯'
  };
  return strVal.replace(/[0-9]/g, (match) => englishToBangla[match]);
};

/**
 * Clean numeric inputs to contain only English digits (for processing and state storage).
 * This allows both Bangla and English digit typing from keyboards.
 */
export const cleanNumericInput = (value: string): string => {
  const englishDigits = toEnglishDigits(value);
  return englishDigits.replace(/[^0-9]/g, '');
};

/**
 * Clean phone inputs to allow '+' and digits (English and Bangla digits converted to English).
 */
export const cleanPhoneInput = (value: string): string => {
  const englishDigits = toEnglishDigits(value);
  return englishDigits.replace(/[^0-9+\- ]/g, '');
};
