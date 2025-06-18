export interface ValidationAdapter<T = unknown> {
  validate(data: unknown): ValidationResult<T>;
}

export interface ValidationResult<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    issues: Array<{
      path: (string | number)[];
      message: string;
      code: string;
    }>;
  };
} 