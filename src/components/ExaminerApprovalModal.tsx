"use client";

import React, { useState } from "react";
import { X, CheckCircle, AlertTriangle, Building, Briefcase, Mail, Calendar, UserCheck } from "lucide-react";

interface ExaminerData {
  id: string;
  fullName: string;
  email: string;
  institution?: string | null;
  department?: string | null;
  createdAt: string;
  status: string;
}

interface ExaminerApprovalModalProps {
  examiner: ExaminerData | null;
  isOpen: boolean;
  onClose: () => void;
  onApprove: (id: string) => Promise<void>;
  onReject: (id: string, reason: string) => Promise<void>;
}

export function ExaminerApprovalModal({
  examiner,
  isOpen,
  onClose,
  onApprove,
  onReject,
}: ExaminerApprovalModalProps) {
  const [actionType, setActionType] = useState<"view" | "approve" | "reject">("view");
  const [rejectionReason, setRejectionReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !examiner) return null;

  const handleApprove = async () => {
    try {
      setSubmitting(true);
      setError(null);
      await onApprove(examiner.id);
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to approve examiner.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Please provide a reason for rejecting this application.");
      return;
    }
    try {
      setSubmitting(true);
      setError(null);
      await onReject(examiner.id, rejectionReason.trim());
      onClose();
    } catch (err: any) {
      setError(err.message || "Failed to reject examiner.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-xl rounded-3xl bg-slate-900 border border-slate-800 shadow-2xl p-8 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-5">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-2xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <UserCheck className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-white">Examiner Application</h3>
              <p className="text-sm text-slate-400">Review credential verification request</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Body Content */}
        <div className="py-6 space-y-5">
          {error && (
            <div className="p-4 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-sm flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 shrink-0 text-rose-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Examiner Profile Card */}
          <div className="p-5 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-bold text-white">{examiner.fullName}</h4>
                <div className="flex items-center gap-2 text-sm text-slate-400 mt-1">
                  <Mail className="h-4 w-4 text-slate-500" />
                  <span>{examiner.email}</span>
                </div>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                examiner.status === "PENDING"
                  ? "bg-amber-500/15 text-amber-300 border border-amber-500/30"
                  : examiner.status === "ACTIVE"
                  ? "bg-emerald-500/15 text-emerald-300 border border-emerald-500/30"
                  : "bg-rose-500/15 text-rose-300 border border-rose-500/30"
              }`}>
                {examiner.status}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-800 text-sm">
              <div className="flex items-center gap-2 text-slate-200">
                <Building className="h-4 w-4 text-indigo-400 shrink-0" />
                <span className="font-medium">{examiner.institution || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-200">
                <Briefcase className="h-4 w-4 text-violet-400 shrink-0" />
                <span className="font-medium">{examiner.department || "Not specified"}</span>
              </div>
              <div className="flex items-center gap-2 text-slate-400 sm:col-span-2 pt-1 text-xs">
                <Calendar className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Requested: {new Date(examiner.createdAt).toLocaleDateString()} at {new Date(examiner.createdAt).toLocaleTimeString()}</span>
              </div>
            </div>
          </div>

          {/* Rejection Form */}
          {actionType === "reject" && (
            <div className="space-y-2.5 animate-fadeIn">
              <label className="block text-sm font-semibold text-slate-200">
                Reason for Rejection (Required)
              </label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Unverified academic affiliation, invalid department details, etc."
                rows={3}
                className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-rose-500 focus:ring-1 focus:ring-rose-500"
              />
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="border-t border-slate-800 pt-5 flex items-center justify-end gap-3.5">
          {actionType === "view" ? (
            <>
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Close
              </button>
              {examiner.status === "PENDING" && (
                <>
                  <button
                    type="button"
                    onClick={() => setActionType("reject")}
                    className="px-5 py-2.5 rounded-xl text-sm font-semibold text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-colors cursor-pointer"
                  >
                    Reject Application
                  </button>
                  <button
                    type="button"
                    onClick={handleApprove}
                    disabled={submitting}
                    className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-emerald-600 hover:bg-emerald-500 shadow-lg shadow-emerald-600/25 transition-all flex items-center gap-2 cursor-pointer"
                  >
                    <CheckCircle className="h-4 w-4" />
                    <span>{submitting ? "Approving..." : "Approve & Activate"}</span>
                  </button>
                </>
              )}
            </>
          ) : actionType === "reject" ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setActionType("view");
                  setError(null);
                }}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              >
                Back
              </button>
              <button
                type="button"
                onClick={handleReject}
                disabled={submitting}
                className="px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all cursor-pointer"
              >
                {submitting ? "Rejecting..." : "Confirm Rejection"}
              </button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
