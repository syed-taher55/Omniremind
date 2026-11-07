export const verticals = ["hospital", "school", "retail"] as const;

export type Vertical = (typeof verticals)[number];

export type Role = "owner" | "staff";

export type Tenant = {
  id: string;
  name: string;
  slug: string;
  vertical: Vertical;
  timezone: string;
  currency: string;
};

export type Wallet = {
  balance_credits: number;
  credit_cost_per_message: number;
};

export type ActionState = {
  error?: string;
  notice?: string;
  token?: string;
};

export const verticalCopy: Record<
  Vertical,
  { label: string; recovery: string }
> = {
  hospital: {
    label: "Hospital",
    recovery: "Estimated value of visits whose reminders were read",
  },
  school: {
    label: "School",
    recovery: "Estimated value of fees whose reminders were read",
  },
  retail: {
    label: "Retail shop",
    recovery: "Estimated value of orders whose reminders were read",
  },
};

export type ScheduleDraft = {
  name: string;
  phone: string;
  sendAt: string;
  params: string[];
  estimatedValue: string | number | null;
  externalId?: string | null;
};

export type ValidReminder = {
  name: string;
  phone: string;
  sendAtIso: string;
  params: string[];
  estimatedValueCents: number;
  externalId: string | null;
};
