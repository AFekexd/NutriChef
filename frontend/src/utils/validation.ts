/**
 * Form validation utilities
 */

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate email format
 */
export function validateEmail(email: string): ValidationResult {
  const errors: string[] = [];

  if (!email) {
    errors.push("Email is required");
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push("Invalid email format");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate password strength
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];

  if (!password) {
    errors.push("Password is required");
  } else {
    if (password.length < 8) {
      errors.push("Password must be at least 8 characters");
    }
    if (!/[A-Z]/.test(password)) {
      errors.push("Password must contain at least one uppercase letter");
    }
    if (!/[a-z]/.test(password)) {
      errors.push("Password must contain at least one lowercase letter");
    }
    if (!/[0-9]/.test(password)) {
      errors.push("Password must contain at least one number");
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      errors.push("Password must contain at least one special character");
    }
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate phone number
 */
export function validatePhone(phone: string): ValidationResult {
  const errors: string[] = [];
  const cleaned = phone.replace(/\D/g, "");

  if (!phone) {
    errors.push("Phone number is required");
  } else if (cleaned.length < 10) {
    errors.push("Phone number must be at least 10 digits");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Generic field validator
 */
export function validateField(
  value: any,
  rules: ValidationRule
): ValidationResult {
  const errors: string[] = [];

  if (rules.required && !value) {
    errors.push(rules.message || "This field is required");
    return { isValid: false, errors };
  }

  if (value && typeof value === "string") {
    if (rules.minLength && value.length < rules.minLength) {
      errors.push(
        rules.message || `Minimum length is ${rules.minLength} characters`
      );
    }

    if (rules.maxLength && value.length > rules.maxLength) {
      errors.push(
        rules.message || `Maximum length is ${rules.maxLength} characters`
      );
    }

    if (rules.pattern && !rules.pattern.test(value)) {
      errors.push(rules.message || "Invalid format");
    }
  }

  if (rules.custom && !rules.custom(value)) {
    errors.push(rules.message || "Validation failed");
  }

  return { isValid: errors.length === 0, errors };
}

/**
 * Validate entire form
 */
export function validateForm(
  data: Record<string, any>,
  rules: Record<string, ValidationRule>
): { isValid: boolean; errors: Record<string, string[]> } {
  const errors: Record<string, string[]> = {};
  let isValid = true;

  Object.keys(rules).forEach((field) => {
    const result = validateField(data[field], rules[field]);
    if (!result.isValid) {
      errors[field] = result.errors;
      isValid = false;
    }
  });

  return { isValid, errors };
}
