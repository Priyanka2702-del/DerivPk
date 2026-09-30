"use client";

import { useEffect, useState } from "react";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Circle,
  UploadCloud,
  Info,
} from "lucide-react";

type KYCStatus =
  | "approved"
  | "pending"
  | "rejected"
  | "not_started";

type KYCData = {
  _id: string;
  userId: string;

  identityStatus: KYCStatus;
  addressStatus: KYCStatus;
  overallStatus: KYCStatus;

  identityDocument?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl?: string;
  };

  addressDocument?: {
    fileName: string;
    fileType: string;
    fileSize: number;
    fileUrl?: string;
  };

  rejectionReason?: string;

  submittedAt?: string;
  reviewedAt?: string;
};

const statusMeta = {
  approved: {
    icon: CheckCircle2,
    color: "text-emerald-600",
    bg: "bg-emerald-50",
    label: "Approved",
  },

  pending: {
    icon: Clock,
    color: "text-amber-600",
    bg: "bg-amber-50",
    label: "Pending Review",
  },

  rejected: {
    icon: XCircle,
    color: "text-red-600",
    bg: "bg-red-50",
    label: "Rejected",
  },

  not_started: {
    icon: Circle,
    color: "text-text-muted",
    bg: "bg-surface-2",
    label: "Not Started",
  },
};

const ALLOWED_TYPES = [
  "image/jpeg",
  "image/png",
  "application/pdf",
];

const MAX_FILE_SIZE = 10 * 1024 * 1024;

export default function VerificationPage() {
  const [kyc, setKyc] = useState<KYCData | null>(null);

  const [identityFile, setIdentityFile] =
    useState<File | null>(null);

  const [addressFile, setAddressFile] =
    useState<File | null>(null);

  const [loading, setLoading] =
    useState(true);

  const [uploadingIdentity, setUploadingIdentity] =
    useState(false);

  const [uploadingAddress, setUploadingAddress] =
    useState(false);

  const [error, setError] =
    useState<string | null>(null);

  const [success, setSuccess] =
    useState<string | null>(null);

  useEffect(() => {
    loadKYC();
  }, []);

  async function loadKYC() {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(
        "/api/kyc",
        {
          method: "GET",
          cache: "no-store",
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to load KYC information"
        );
      }

      setKyc(data.kyc);
    } catch (error) {
      console.error(
        "KYC LOAD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to load KYC information"
      );
    } finally {
      setLoading(false);
    }
  }

  function validateFile(
    file: File
  ): string | null {
    if (!ALLOWED_TYPES.includes(file.type)) {
      return "Invalid file type. Only JPG, PNG and PDF files are allowed.";
    }

    if (file.size === 0) {
      return "The selected file is empty.";
    }

    if (file.size > MAX_FILE_SIZE) {
      return "File size must not exceed 10MB.";
    }

    return null;
  }

  function handleIdentityFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError(null);
    setSuccess(null);

    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      setIdentityFile(null);
      return;
    }

    const validationError =
      validateFile(file);

    if (validationError) {
      setError(validationError);

      event.target.value = "";
      setIdentityFile(null);

      return;
    }

    setIdentityFile(file);
  }

  function handleAddressFileChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    setError(null);
    setSuccess(null);

    const file =
      event.target.files?.[0] ?? null;

    if (!file) {
      setAddressFile(null);
      return;
    }

    const validationError =
      validateFile(file);

    if (validationError) {
      setError(validationError);

      event.target.value = "";
      setAddressFile(null);

      return;
    }

    setAddressFile(file);
  }

  async function handleIdentitySubmit() {
    if (!identityFile) {
      setError(
        "Please select an identity document first."
      );

      return;
    }

    try {
      setUploadingIdentity(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();

      formData.append(
        "document",
        identityFile
      );

      const response = await fetch(
        "/api/kyc/document",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit identity document"
        );
      }

      setKyc((current) => {
        if (!current) {
          return data.kyc;
        }

        return {
          ...current,
          ...data.kyc,
          identityStatus:
            data.kyc.identityStatus,
          overallStatus:
            data.kyc.overallStatus,
          identityDocument:
            data.kyc.identityDocument,
          submittedAt:
            data.kyc.submittedAt,
        };
      });

      setIdentityFile(null);

      const input =
        document.getElementById(
          "kyc-identity-upload"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setSuccess(
        "Identity document submitted successfully."
      );
    } catch (error) {
      console.error(
        "IDENTITY KYC UPLOAD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit identity document"
      );
    } finally {
      setUploadingIdentity(false);
    }
  }

  async function handleAddressSubmit() {
    if (!addressFile) {
      setError(
        "Please select an address document first."
      );

      return;
    }

    try {
      setUploadingAddress(true);
      setError(null);
      setSuccess(null);

      const formData = new FormData();

      formData.append(
        "address_document",
        addressFile
      );

      const response = await fetch(
        "/api/kyc/address",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(
          data.message ||
            "Unable to submit address document"
        );
      }

      setKyc((current) => {
        if (!current) {
          return data.kyc;
        }

        return {
          ...current,
          ...data.kyc,
          addressStatus:
            data.kyc.addressStatus,
          overallStatus:
            data.kyc.overallStatus,
          addressDocument:
            data.kyc.addressDocument,
          submittedAt:
            data.kyc.submittedAt,
        };
      });

      setAddressFile(null);

      const input =
        document.getElementById(
          "kyc-address-upload"
        ) as HTMLInputElement | null;

      if (input) {
        input.value = "";
      }

      setSuccess(
        "Address document submitted successfully."
      );
    } catch (error) {
      console.error(
        "ADDRESS KYC UPLOAD ERROR:",
        error
      );

      setError(
        error instanceof Error
          ? error.message
          : "Unable to submit address document"
      );
    } finally {
      setUploadingAddress(false);
    }
  }

  if (loading) {
    return (
      <div>
        <div className="mb-5">
          <h1 className="font-display text-xl font-semibold text-text">
            Verification
          </h1>

          <p className="text-sm text-text-muted">
            Loading your verification status...
          </p>
        </div>

        <div className="rounded-xl border border-border bg-surface p-6">
          <p className="text-sm text-text-muted">
            Loading KYC information...
          </p>
        </div>
      </div>
    );
  }

  const identityStatus =
    kyc?.identityStatus ??
    "not_started";

  const addressStatus =
    kyc?.addressStatus ??
    "not_started";

  const overallStatus =
    kyc?.overallStatus ??
    "not_started";

  const verificationItems = [
    {
      key: "identity",
      label: "Identity Verification",
      status: identityStatus,
    },
    {
      key: "address",
      label: "Address Verification",
      status: addressStatus,
    },
    {
      key: "overall",
      label: "Overall Verification",
      status: overallStatus,
    },
  ];

  const canUploadIdentity =
    identityStatus === "not_started" ||
    identityStatus === "rejected";

  const canUploadAddress =
    addressStatus === "not_started" ||
    addressStatus === "rejected";

  return (
    <div>
      <div className="mb-5">
        <h1 className="font-display text-xl font-semibold text-text">
          Verification
        </h1>

        <p className="text-sm text-text-muted">
          Complete KYC verification to unlock
          full account features.
        </p>
      </div>

      {error && (
        <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
          {error}
        </div>
      )}

      {success && (
        <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
          {success}
        </div>
      )}

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        {verificationItems.map(
          (item) => {
            const meta =
              statusMeta[item.status];

            const Icon = meta.icon;

            return (
              <div
                key={item.key}
                className="rounded-xl border border-border bg-surface p-5"
              >
                <div
                  className={`mb-3 inline-flex h-9 w-9 items-center justify-center rounded-full ${meta.bg} ${meta.color}`}
                >
                  <Icon size={18} />
                </div>

                <p className="text-sm font-semibold text-text">
                  {item.label}
                </p>

                <p
                  className={`mt-1 text-xs font-medium ${meta.color}`}
                >
                  {meta.label}
                </p>
              </div>
            );
          }
        )}
      </div>

      {/* Identity Verification */}

      <div className="mb-6 rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-text">
          Identity Verification
        </h2>

        <p className="mb-4 flex items-start gap-1.5 text-xs text-text-muted">
          <Info
            size={13}
            className="mt-0.5 shrink-0"
          />

          Upload a valid passport, ID card or
          driving licence for identity
          verification.
        </p>

        {kyc?.identityDocument && (
          <div className="mb-4 rounded-lg border border-border bg-surface-2 px-4 py-3">
            <p className="text-xs text-text-muted">
              Submitted Document
            </p>

            <p className="mt-1 text-sm font-medium text-text">
              {kyc.identityDocument.fileName}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              {kyc.identityDocument.fileType}
              {" · "}
              {formatFileSize(
                kyc.identityDocument.fileSize
              )}
            </p>
          </div>
        )}

        {identityStatus === "pending" && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
            Your identity document is
            currently under review.
          </div>
        )}

        {identityStatus === "approved" && (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            Your identity document has been
            approved.
          </div>
        )}

        {identityStatus === "rejected" &&
          kyc?.rejectionReason && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              <p className="font-medium">
                Verification rejected
              </p>

              <p className="mt-1 text-xs">
                {kyc.rejectionReason}
              </p>
            </div>
          )}

        {canUploadIdentity && (
          <>
            <label
              htmlFor="kyc-identity-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-2 px-6 py-10 text-center transition hover:border-accent-2/50"
            >
              <UploadCloud
                size={28}
                className="text-text-muted"
              />

              <span className="text-sm font-medium text-text">
                {identityFile
                  ? identityFile.name
                  : "Click to select a passport, ID card or driving licence"}
              </span>

              <span className="text-xs text-text-muted">
                JPG, PNG or PDF, up to 10MB
              </span>

              <input
                id="kyc-identity-upload"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={
                  handleIdentityFileChange
                }
                disabled={
                  uploadingIdentity
                }
              />
            </label>

            <button
              type="button"
              disabled={
                !identityFile ||
                uploadingIdentity
              }
              onClick={
                handleIdentitySubmit
              }
              className="mt-4 w-full rounded-lg bg-accent-2/10 py-3 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {uploadingIdentity
                ? "Submitting..."
                : "Submit for Review"}
            </button>
          </>
        )}
      </div>

      {/* Address Verification */}

      <div className="rounded-xl border border-border bg-surface p-6">
        <h2 className="mb-1 font-display text-lg font-semibold text-text">
          Address Verification
        </h2>

        <p className="mb-4 flex items-start gap-1.5 text-xs text-text-muted">
          <Info
            size={13}
            className="mt-0.5 shrink-0"
          />

          Upload a valid address proof such as
          a government-issued document or
          utility bill.
        </p>

        {kyc?.addressDocument && (
          <div className="mb-4 rounded-lg border border-border bg-surface-2 px-4 py-3">
            <p className="text-xs text-text-muted">
              Submitted Document
            </p>

            <p className="mt-1 text-sm font-medium text-text">
              {kyc.addressDocument.fileName}
            </p>

            <p className="mt-1 text-xs text-text-muted">
              {kyc.addressDocument.fileType}
              {" · "}
              {formatFileSize(
                kyc.addressDocument.fileSize
              )}
            </p>
          </div>
        )}

        {addressStatus === "pending" && (
          <div className="mb-4 rounded-lg border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-600">
            Your address document is
            currently under review.
          </div>
        )}

        {addressStatus === "approved" && (
          <div className="mb-4 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-600">
            Your address document has been
            approved.
          </div>
        )}

        {addressStatus === "rejected" &&
          kyc?.rejectionReason && (
            <div className="mb-4 rounded-lg border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-500">
              <p className="font-medium">
                Address verification rejected
              </p>

              <p className="mt-1 text-xs">
                {kyc.rejectionReason}
              </p>
            </div>
          )}

        {canUploadAddress && (
          <>
            <label
              htmlFor="kyc-address-upload"
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border bg-surface-2 px-6 py-10 text-center transition hover:border-accent-2/50"
            >
              <UploadCloud
                size={28}
                className="text-text-muted"
              />

              <span className="text-sm font-medium text-text">
                {addressFile
                  ? addressFile.name
                  : "Click to select an address proof"}
              </span>

              <span className="text-xs text-text-muted">
                JPG, PNG or PDF, up to 10MB
              </span>

              <input
                id="kyc-address-upload"
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={
                  handleAddressFileChange
                }
                disabled={
                  uploadingAddress
                }
              />
            </label>

            <button
              type="button"
              disabled={
                !addressFile ||
                uploadingAddress
              }
              onClick={
                handleAddressSubmit
              }
              className="mt-4 w-full rounded-lg bg-accent-2/10 py-3 text-sm font-semibold text-accent-2 transition hover:bg-accent-2/20 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:px-8"
            >
              {uploadingAddress
                ? "Submitting..."
                : "Submit for Review"}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

function formatFileSize(
  bytes: number
): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  return `${(
    bytes /
    (1024 * 1024)
  ).toFixed(1)} MB`;
}