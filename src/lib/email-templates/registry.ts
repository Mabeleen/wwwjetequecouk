import type { ComponentType } from "react";

export interface TemplateEntry {
  component: ComponentType<any>;
  subject: string | ((data: Record<string, any>) => string);
  displayName?: string;
  previewData?: Record<string, any>;
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string;
}

import { template as ticketConfirmation } from "./ticket-confirmation";
import { template as adminSaleNotification } from "./admin-sale-notification";

export const TEMPLATES: Record<string, TemplateEntry> = {
  "ticket-confirmation": ticketConfirmation,
  "admin-sale-notification": adminSaleNotification,
};
