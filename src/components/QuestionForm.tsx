"use client";

import React, { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  HelpCircle,
  BookOpen,
  Award,
  BarChart,
  Layers,
  Plus,
  Trash2,
  Upload,
  CheckCircle,
  AlertCircle,
  RefreshCw,
  ImageIcon,
  FileText,
  Check,
  X,
  Sparkles,
} from "lucide-react";

export type QuestionType = "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER" | "IMAGE";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface FormOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order: number;
}

export interface QuestionFormInitialData {
  id?: string;
  question_text: string;
  subject: string;
  difficulty: Difficulty;
  question_type: QuestionType;
  marks: number;
  expected_answer?: string | null;
  image_url?: string | null;
  options?: FormOption[];
}

interface QuestionFormProps {
  initialData?: QuestionFormInitialData;
  isEditMode?: boolean;
  examId?: string;
  sectionId?: string;
  onSuccess?: () => void;
}

const COMMON_SUBJECTS = [
  "Computer Science",
  "Data Structures & Algorithms",
  "Database Systems",
  "Artificial Intelligence",
  "Operating Systems",
  "Software Engineering",
  "Computer Networks",
  "Cybersecurity",
  "Mathematics",
  "Physics",
];

export function QuestionForm({
  initialData,
  isEditMode = false,
  examId,
  sectionId,
  onSuccess,
}: QuestionFormProps) {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const sourceInputRef = useRef<HTMLInputElement>(null);

  // Form states
  const [questionType, setQuestionType] = useState<QuestionType>(
    initialData?.question_type || "MCQ"
  );
  const [subject, setSubject] = useState(initialData?.subject || "");
  const [difficulty, setDifficulty] = useState<Difficulty>(
    initialData?.difficulty || "MEDIUM"
  );
  const [marks, setMarks] = useState<number>(initialData?.marks || 1);
  const [questionText, setQuestionText] = useState(initialData?.question_text || "");
  const [expectedAnswer, setExpectedAnswer] = useState(
    initialData?.expected_answer || ""
  );
  const [imageUrl, setImageUrl] = useState(initialData?.image_url || "");

  // Options state for MCQ / MULTI_SELECT / IMAGE
  const [options, setOptions] = useState<FormOption[]>(() => {
    if (initialData?.options && initialData.options.length > 0) {
      return initialData.options;
    }
    return [
      { option_text: "", is_correct: true, order: 0 },
      { option_text: "", is_correct: false, order: 1 },
      { option_text: "", is_correct: false, order: 2 },
      { option_text: "", is_correct: false, order: 3 },
    ];
  });

  // UI status
  const [uploadingImage, setUploadingImage] = useState(false);
  const [importingSource, setImportingSource] = useState(false);
  const [googleDocUrl, setGoogleDocUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const canAttachImage = true;

  // Sync state whenever initialData changes
  React.useEffect(() => {
    if (initialData) {
      setQuestionType(initialData.question_type || "MCQ");
      setSubject(initialData.subject || "");
      setDifficulty(initialData.difficulty || "MEDIUM");
      setMarks(initialData.marks || 1);
      setQuestionText(initialData.question_text || "");
      setExpectedAnswer(initialData.expected_answer || "");
      setImageUrl(initialData.image_url || "");
      if (initialData.options && initialData.options.length > 0) {
        setOptions(initialData.options);
      } else {
        setOptions([
          { option_text: "", is_correct: true, order: 0 },
          { option_text: "", is_correct: false, order: 1 },
          { option_text: "", is_correct: false, order: 2 },
          { option_text: "", is_correct: false, order: 3 },
        ]);
      }
    }
  }, [initialData]);

  // Option handlers
  const handleAddOption = () => {
    setOptions((prev) => [
      ...prev,
      {
        option_text: "",
        is_correct: false,
        order: prev.length,
      },
    ]);
  };

  const handleRemoveOption = (index: number) => {
    if (options.length <= 2) {
      setErrorMessage("At least 2 options are required for multiple choice questions.");
      return;
    }
    setOptions((prev) => prev.filter((_, i) => i !== index));
  };

  const handleOptionTextChange = (index: number, text: string) => {
    setOptions((prev) =>
      prev.map((opt, i) => (i === index ? { ...opt, option_text: text } : opt))
    );
  };

  const handleRadioCorrect = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) => ({
        ...opt,
        is_correct: i === index,
      }))
    );
  };

  const handleCheckboxCorrect = (index: number) => {
    setOptions((prev) =>
      prev.map((opt, i) =>
        i === index ? { ...opt, is_correct: !opt.is_correct } : opt
      )
    );
  };

  // Image upload handler
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploadingImage(true);
      setErrorMessage(null);

      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/questions/upload-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.detail || data.error || "Failed to upload image.");
      }

      setImageUrl(data.image_url);
    } catch (err: any) {
      console.error("Upload error:", err);
      setErrorMessage(err.message || "Failed to upload image. Please try again.");
    } finally {
      setUploadingImage(false);
    }
  };

  const handleTextSourceImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImportingSource(true);
    setErrorMessage(null);
    const formData = new FormData();
    formData.append("file", file);
    fetch("/api/questions/import-source", { method: "POST", body: formData })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.detail || "Unable to import this source.");
        setQuestionText(data.text);
      })
      .catch((error) => setErrorMessage(error.message || "Unable to import this source."))
      .finally(() => setImportingSource(false));
  };

  const handleGoogleDocImport = async () => {
    if (!googleDocUrl.trim()) return;
    try {
      setImportingSource(true);
      setErrorMessage(null);
      const formData = new FormData();
      formData.append("google_doc_url", googleDocUrl.trim());
      const response = await fetch("/api/questions/import-source", { method: "POST", body: formData });
      const data = await response.json();
      if (!response.ok) throw new Error(data.detail || "Unable to import this Google Doc.");
      setQuestionText(data.text);
    } catch (error: any) {
      setErrorMessage(error.message || "Unable to import this Google Doc.");
    } finally {
      setImportingSource(false);
    }
  };

  // Form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Validation
    if (!subject.trim()) {
      setErrorMessage("Please enter or select a Subject.");
      return;
    }

    if (!questionText.trim() || questionText.trim().length < 3) {
      setErrorMessage("Question statement must be at least 3 characters long.");
      return;
    }

    if (marks < 1) {
      setErrorMessage("Marks must be at least 1.");
      return;
    }

    const payload: any = {
      subject: subject.trim(),
      question_text: questionText.trim(),
      difficulty,
      question_type: questionType,
      marks: Number(marks),
    };

    if (questionType === "IMAGE") {
      if (!imageUrl) {
        setErrorMessage("Please upload an image for this Image-Based question.");
        return;
      }
      payload.image_url = imageUrl;
    }

    if (questionType === "SHORT_ANSWER" || questionType === "LONG_ANSWER") {
      if (!expectedAnswer.trim()) {
        setErrorMessage(
          questionType === "SHORT_ANSWER"
            ? "Please provide an expected answer for automated or examiner grading."
            : "Please provide the evaluation rubric or sample answer for long response questions."
        );
        return;
      }
      payload.expected_answer = expectedAnswer.trim();
    }

    if (
      questionType === "MCQ" ||
      questionType === "MULTI_SELECT" ||
      (questionType === "IMAGE" && options.length > 0)
    ) {
      // Validate option contents
      const emptyOpt = options.find((opt) => !opt.option_text.trim());
      if (emptyOpt) {
        setErrorMessage("All option choices must have text content.");
        return;
      }

      const correctCount = options.filter((opt) => opt.is_correct).length;

      if (questionType === "MCQ" && correctCount !== 1) {
        setErrorMessage("Single Choice (MCQ) must have exactly 1 correct answer selected.");
        return;
      }

      if (questionType === "MULTI_SELECT" && correctCount < 1) {
        setErrorMessage("Multiple Select questions must have at least 1 correct answer selected.");
        return;
      }

      payload.options = options.map((opt, idx) => ({
        option_text: opt.option_text.trim(),
        is_correct: opt.is_correct,
        order: idx,
      }));
    }

    if (examId) {
      payload.exam_id = examId;
    }
    if (sectionId) {
      payload.section_id = sectionId;
    }

    try {
      setSubmitting(true);
      const url = isEditMode
        ? `/api/questions/${initialData?.id}`
        : "/api/questions";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const resData = await res.json();
      if (!res.ok) {
        throw new Error(
          resData.detail || resData.error || "Failed to save question."
        );
      }

      setSuccessMessage(
        isEditMode
          ? "Question updated successfully!"
          : "Question created successfully!"
      );

      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 800);
      } else {
        setTimeout(() => {
          router.push("/examiner/questions");
          router.refresh();
        }, 1200);
      }
    } catch (err: any) {
      console.error("Submission error:", err);
      setErrorMessage(err.message || "Failed to save question. Please check inputs.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8 animate-fadeIn">
      {/* Notifications */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-sm flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            type="button"
            onClick={() => setErrorMessage(null)}
            className="p-1 text-rose-400 hover:text-rose-200"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-sm flex items-center gap-2.5">
          <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {/* 1. Question Modality & Metadata */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-indigo-400" />
            Question Type & Classification
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Choose the examination format and taxonomy for this question.
          </p>
        </div>

        {/* Question Type Tabs */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center justify-between">
            <span>Select Question Format *</span>
            <span className="text-[11px] font-semibold text-indigo-400">
              Active: {questionType.replace("_", " ")}
            </span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {(
              [
                { type: "MCQ", label: "Single Choice", sub: "1 correct answer", icon: CheckCircle },
                { type: "MULTI_SELECT", label: "Multi Select", sub: ">=1 correct", icon: Layers },
                { type: "SHORT_ANSWER", label: "Short Answer", sub: "Brief response", icon: FileText },
                { type: "LONG_ANSWER", label: "Long Essay", sub: "Rubric based", icon: BookOpen },
                { type: "IMAGE", label: "Image / Diagram", sub: "Visual prompt", icon: ImageIcon },
              ] as const
            ).map((item) => {
              const Icon = item.icon;
              const isSelected = questionType === item.type;
              return (
                <button
                  key={item.type}
                  type="button"
                  onClick={() => setQuestionType(item.type)}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden flex flex-col justify-between gap-2 ${
                    isSelected
                      ? "bg-indigo-600/25 border-indigo-500 text-white shadow-lg shadow-indigo-500/20 ring-1 ring-indigo-500"
                      : "bg-slate-900/90 border-slate-800 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div
                      className={`h-7 w-7 rounded-lg flex items-center justify-center ${
                        isSelected ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    {isSelected && (
                      <span className="h-2 w-2 rounded-full bg-indigo-400 animate-pulse" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm text-white">{item.label}</div>
                    <div className="text-[11px] text-slate-400 mt-0.5">{item.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject, Difficulty, Marks Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-2">
          {/* Subject Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Subject / Course *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. Computer Networks"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />

            {/* Quick Suggestions */}
            <div className="flex flex-wrap gap-1.5 pt-1">
              {COMMON_SUBJECTS.slice(0, 4).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSubject(s)}
                  className="text-[10px] px-2 py-0.5 rounded-md bg-slate-800/80 hover:bg-indigo-900/40 text-slate-400 hover:text-indigo-300 transition-colors"
                >
                  +{s.split(" ")[0]}
                </button>
              ))}
            </div>
          </div>

          {/* Difficulty Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Difficulty Level
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(["EASY", "MEDIUM", "HARD"] as const).map((lvl) => (
                <button
                  key={lvl}
                  type="button"
                  onClick={() => setDifficulty(lvl)}
                  className={`py-3 rounded-xl text-xs font-bold uppercase tracking-wider border transition-all cursor-pointer ${
                    difficulty === lvl
                      ? lvl === "EASY"
                        ? "bg-emerald-500/20 text-emerald-300 border-emerald-500/40"
                        : lvl === "MEDIUM"
                        ? "bg-amber-500/20 text-amber-300 border-amber-500/40"
                        : "bg-rose-500/20 text-rose-300 border-rose-500/40"
                      : "bg-slate-900 border-slate-800 text-slate-400 hover:text-white"
                  }`}
                >
                  {lvl}
                </button>
              ))}
            </div>
          </div>

          {/* Marks Field */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Allocated Marks *
            </label>
            <div className="relative">
              <Award className="h-5 w-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="number"
                min={1}
                max={100}
                required
                value={marks}
                onChange={(e) => setMarks(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full pl-11 pr-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Question Statement & Visual Prompts */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-400" />
            Question Prompt & Media
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Write the full question statement and attach diagrams if required.
          </p>
        </div>

        {/* Question Text */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-dashed border-indigo-500/30 bg-indigo-500/5 p-3">
            <div>
              <p className="text-xs font-bold text-indigo-200">Import question source</p>
              <p className="mt-0.5 text-[11px] text-slate-400">Import a PDF, text file, or public Google Doc. Review the extracted text before saving.</p>
            </div>
            <button type="button" onClick={() => sourceInputRef.current?.click()} className="inline-flex items-center gap-2 rounded-xl border border-indigo-500/30 bg-indigo-500/10 px-3 py-2 text-xs font-bold text-indigo-300 hover:bg-indigo-500/20">
              <Upload className="h-3.5 w-3.5" />{importingSource ? "Importing…" : "Choose source file"}
            </button>
            <input ref={sourceInputRef} type="file" accept=".pdf,.txt,.md,.csv,application/pdf,text/plain,text/markdown,text/csv" onChange={handleTextSourceImport} className="hidden" />
            <div className="flex w-full gap-2">
              <input value={googleDocUrl} onChange={(event) => setGoogleDocUrl(event.target.value)} placeholder="Paste a public Google Docs link" className="min-w-0 flex-1 rounded-xl border border-slate-700 bg-slate-900 px-3 py-2 text-xs text-white placeholder-slate-500 focus:border-indigo-500 focus:outline-none" />
              <button type="button" disabled={!googleDocUrl.trim() || importingSource} onClick={handleGoogleDocImport} className="rounded-xl border border-slate-700 px-3 py-2 text-xs font-bold text-slate-300 hover:border-indigo-500 hover:text-white disabled:opacity-50">Import link</button>
            </div>
          </div>
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            Question Statement / Problem Description *
          </label>
          <textarea
            rows={4}
            required
            placeholder="Type your question statement here..."
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-sans"
          />
        </div>

        {/* Image Upload for IMAGE question or optional diagram */}
        {canAttachImage && (
          <div className="space-y-3 pt-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
              <ImageIcon className="h-4 w-4 text-indigo-400" />
              Diagram / Image Attachment {questionType === "IMAGE" && "*"}
            </label>

            {imageUrl ? (
              <div className="relative rounded-2xl border border-slate-700 bg-slate-900/80 p-4 flex flex-col items-center gap-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={imageUrl}
                  alt="Question Diagram"
                  className="rounded-xl max-h-64 object-contain"
                />
                <button
                  type="button"
                  onClick={() => setImageUrl("")}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-rose-400 bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 transition-colors"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Remove Image
                </button>
              </div>
            ) : (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500/60 rounded-2xl p-8 text-center bg-slate-900/40 hover:bg-slate-900 transition-all cursor-pointer group"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                <div className="h-12 w-12 rounded-2xl bg-indigo-600/20 text-indigo-400 flex items-center justify-center mx-auto mb-3 group-hover:scale-110 transition-transform">
                  {uploadingImage ? (
                    <RefreshCw className="h-6 w-6 animate-spin" />
                  ) : (
                    <Upload className="h-6 w-6" />
                  )}
                </div>
                <p className="text-sm font-semibold text-white">
                  {uploadingImage ? "Uploading diagram..." : "Click or Drag to Upload Diagram"}
                </p>
                <p className="text-xs text-slate-500 mt-1">
                  Supports PNG, JPG, WEBP, GIF, SVG (up to 10MB)
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Answer Configuration & Evaluation */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Layers className="h-5 w-5 text-indigo-400" />
            Answer Evaluation & Options
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Configure candidate answer options or provide reference rubrics.
          </p>
        </div>

        {/* MCQ & MULTI_SELECT Options */}
        {(questionType === "MCQ" ||
          questionType === "MULTI_SELECT" ||
          questionType === "IMAGE") && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                Options & Correct Answer Selection
              </span>
              <button
                type="button"
                onClick={handleAddOption}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-400 hover:text-indigo-300 bg-indigo-500/10 hover:bg-indigo-500/20 px-3 py-1.5 rounded-lg border border-indigo-500/30 transition-colors cursor-pointer"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Option
              </button>
            </div>

            <div className="space-y-3">
              {options.map((option, index) => {
                const labelLetter = String.fromCharCode(65 + index);
                const isSelected = option.is_correct;

                return (
                  <div
                    key={index}
                    className={`p-3.5 rounded-2xl border flex items-center gap-3 transition-all ${
                      isSelected
                        ? "bg-indigo-950/30 border-indigo-500/50"
                        : "bg-slate-900/90 border-slate-800"
                    }`}
                  >
                    {/* Correct Selector (Radio for MCQ, Checkbox for MULTI_SELECT) */}
                    <button
                      type="button"
                      onClick={() =>
                        questionType === "MULTI_SELECT"
                          ? handleCheckboxCorrect(index)
                          : handleRadioCorrect(index)
                      }
                      title={isSelected ? "Marked as correct" : "Click to mark as correct"}
                      className={`h-9 w-9 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-all cursor-pointer ${
                        isSelected
                          ? "bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/25"
                          : "bg-slate-800 text-slate-400 hover:bg-slate-700 hover:text-white"
                      }`}
                    >
                      {isSelected ? <Check className="h-4 w-4 stroke-[3]" /> : labelLetter}
                    </button>

                    {/* Option Text Input */}
                    <input
                      type="text"
                      required
                      placeholder={`Option ${labelLetter} text...`}
                      value={option.option_text}
                      onChange={(e) => handleOptionTextChange(index, e.target.value)}
                      className="flex-1 px-3.5 py-2.5 rounded-xl bg-slate-950/60 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
                    />

                    {/* Remove Option Button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(index)}
                      className="p-2.5 rounded-xl text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                      title="Remove option"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <p className="text-[11px] text-slate-500 italic">
              * Click the letter badge on the left to mark an option as the correct answer.
            </p>
          </div>
        )}

        {/* Short Answer Field */}
        {questionType === "SHORT_ANSWER" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Expected Answer / Key Phrase *
            </label>
            <input
              type="text"
              required
              placeholder="e.g. O(log n) or Depth-First Search"
              value={expectedAnswer}
              onChange={(e) => setExpectedAnswer(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors"
            />
            <p className="text-xs text-slate-500">
              This will be used for automated pattern matching or reference grading.
            </p>
          </div>
        )}

        {/* Long Answer / Essay Rubric */}
        {questionType === "LONG_ANSWER" && (
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
              Scoring Rubric / Model Answer / Key Points *
            </label>
            <textarea
              rows={4}
              required
              placeholder="Detail key conceptual points, edge cases, and grading breakdown..."
              value={expectedAnswer}
              onChange={(e) => setExpectedAnswer(e.target.value)}
              className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed"
            />
            <p className="text-xs text-slate-500">
              Used by examiners during manual assessment or for AI candidate evaluation.
            </p>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end gap-4 pt-4">
        <button
          type="button"
          onClick={() => router.push("/examiner/questions")}
          disabled={submitting}
          className="px-6 py-3.5 rounded-2xl text-sm font-semibold text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-700 transition-colors cursor-pointer"
        >
          Cancel
        </button>

        <button
          type="submit"
          disabled={submitting || uploadingImage}
          className="inline-flex items-center gap-2.5 px-8 py-3.5 rounded-2xl text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-500 shadow-xl shadow-indigo-600/25 transition-all disabled:opacity-50 cursor-pointer hover:scale-[1.02]"
        >
          {submitting ? (
            <>
              <RefreshCw className="h-4 w-4 animate-spin" />
              <span>{isEditMode ? "Updating Question..." : "Saving Question..."}</span>
            </>
          ) : (
            <>
              <CheckCircle className="h-4 w-4" />
              <span>{isEditMode ? "Save Changes" : "Create Question"}</span>
            </>
          )}
        </button>
      </div>
    </form>
  );
}
