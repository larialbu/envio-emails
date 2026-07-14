import { Recipient, SendResult } from "../types/email";

export type SendEmailsOptions = {
  subject: string;
  recipients: any[];
  htmlTemplate: string;
  attachments?: { filename: string; path: string; cid: string }[];
  batchSize: number;
  intervalSeconds: number;
  onProgress: (sentCount: number, results: SendResult[]) => void;
  onFinish: () => void;
  onError: (error: string) => void;
};

export async function startSendingEmails({
  subject,
  recipients,
  htmlTemplate,
  attachments,
  batchSize,
  intervalSeconds,
  onProgress,
  onFinish,
  onError,
}: SendEmailsOptions) {
  let sentCount = 0;
  let allResults: SendResult[] = [];

  for (let i = 0; i < recipients.length; i += batchSize) {
    const batch = recipients.slice(i, i + batchSize);

    try {
      const response = await fetch("/api/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ batch, subject, htmlTemplate, attachments }),
      });

      if (!response.ok) {
        throw new Error("Falha ao enviar lote.");
      }

      const data = await response.json();
      
      sentCount += batch.length;
      if (data.results) {
        allResults = [...allResults, ...data.results];
      }

      onProgress(sentCount, data.results || []);

      // Aguardar o intervalo antes de enviar o próximo lote, exceto no último
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, intervalSeconds * 1000));
      }
    } catch (error: any) {
      onError(error.message || "Ocorreu um erro ao processar os envios.");
      break; // Abortar em caso de erro crítico
    }
  }

  onFinish();
}
