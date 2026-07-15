// Generic ApiResponse


export interface ApiResponse<T> {
  endpoint: string;
  statusCode: number;
  status: string;
  success: boolean;
  message: string;
  timeStamp: string;
  data: T;  // Generic data
}

// Specific response types
// OR

// For other APIs
