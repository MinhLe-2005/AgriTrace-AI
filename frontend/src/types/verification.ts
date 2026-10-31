export type VerificationStatus =
  | "PENDING"
  | "UNDER_REVIEW"
  | "APPROVED"
  | "REJECTED"
  | "CHANGES_REQUESTED"
  | "SUSPENDED"
  | "EXPIRED";

export type VerificationType = "FARMER" | "DISTRIBUTOR";

export interface VerificationRequest {
  id: string;
  subjectId: string;
  subjectEmail: string;
  subjectName: string;
  type: VerificationType;
  status: VerificationStatus;
  organizationName: string;
  documentType: string;
  documentUrl: string;
  note?: string | null;
  decisionReason?: string | null;
  createdAt: string;
  reviewedAt?: string | null;
}
