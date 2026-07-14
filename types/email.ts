export interface Recipient {
  nome?: string;
  email: string;
}

export interface SendResult {
  email: string;
  status: "success" | "error";
  message?: string;
}
