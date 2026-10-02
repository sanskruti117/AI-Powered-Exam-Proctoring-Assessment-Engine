"use client";

import React from "react";
import { AlertTriangle, Trash2, X, RefreshCw } from "lucide-react";
import { useLanguage } from "@/lib/i18n/LanguageContext";

interface DeleteConfirmationModalProps {
  isOpen: boolean;
  title?: string;
  message?: string;
  itemName?: string;
  isDeleting: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

export function DeleteConfirmationModal({
  isOpen,
  title,
  message,
  itemName,
  isDeleting,
  onConfirm,
  onClose,
}: DeleteConfirmationModalProps) {
  const { t } = useLanguage();
  if (!isOpen) return null;

  const modalTitle = title || t("examiner.deleteConfirmTitle", "Delete Confirmation");
  const modalMessage = message || t("examiner.deleteConfirmText", "Are you sure you want to permanently remove this item? This action cannot be undone.");

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="glass-card w-full max-w-md rounded-3xl border border-rose-500/30 shadow-2xl overflow-hidden p-6 space-y-6 bg-white dark:bg-slate-900">
        <div className="flex items-start gap-4">
          <div className="h-12 w-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
            <AlertTriangle className="h-6 w-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-slate-900 dark:text-white">{modalTitle}</h3>
            <p className="text-sm text-slate-600 dark:text-slate-400 leading-relaxed">{modalMessage}</p>
          </div>
        </div>

        {itemName && (
          <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 text-xs text-slate-800 dark:text-slate-300 italic line-clamp-3 font-medium">
            &ldquo;{itemName}&rdquo;
          </div>
        )}

        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isDeleting}
            className="px-5 py-2.5 rounded-xl text-sm font-semibold text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white bg-slate-100 hover:bg-slate-200 dark:bg-slate-900 dark:hover:bg-slate-800 border border-slate-200 dark:border-slate-700 transition-colors disabled:opacity-50 cursor-pointer"
          >
            {t("common.cancel", "Cancel")}
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={isDeleting}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white bg-rose-600 hover:bg-rose-500 shadow-lg shadow-rose-600/25 transition-all disabled:opacity-50 cursor-pointer"
          >
            {isDeleting ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin" />
                <span>{t("examiner.saving", "Deleting...")}</span>
              </>
            ) : (
              <>
                <Trash2 className="h-4 w-4" />
                <span>{t("examiner.confirmDelete", "Confirm Delete")}</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
