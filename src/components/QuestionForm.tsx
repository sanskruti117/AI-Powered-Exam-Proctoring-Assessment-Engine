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
  Code2,
  Terminal,
  Play,
  Clock,
  Cpu,
} from "lucide-react";

export type QuestionType = "MCQ" | "MULTI_SELECT" | "SHORT_ANSWER" | "LONG_ANSWER" | "IMAGE" | "CODING";
export type Difficulty = "EASY" | "MEDIUM" | "HARD";

export interface FormOption {
  id?: string;
  option_text: string;
  is_correct: boolean;
  order: number;
}

export interface FormTestCase {
  id?: string;
  input_data: string;
  expected_output: string;
  is_sample: boolean;
  explanation?: string;
  weightage_marks: number;
  order: number;
}

export interface FormBoilerplate {
  id?: string;
  language: string;
  starter_code: string;
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
  input_format?: string | null;
  output_format?: string | null;
  constraints?: string | null;
  allowed_languages?: string[] | null;
  time_limit_seconds?: number | null;
  memory_limit_mb?: number | null;
  test_cases?: FormTestCase[];
  boilerplates?: FormBoilerplate[];
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

const DEFAULT_BOILERPLATES: Record<string, string> = {
  python: `import sys

def solve():
    # Read inputs from standard input
    input_data = sys.stdin.read().split()
    if not input_data:
        return
    # TODO: Implement your solution here
    print("result")

if __name__ == "__main__":
    solve()
`,
  javascript: `const fs = require('fs');

function solve() {
    const input = fs.readFileSync(0, 'utf-8').trim().split(/\\s+/);
    if (!input || input.length === 0 || input[0] === '') return;
    // TODO: Implement your solution here
    console.log("result");
}

solve();
`,
  cpp: `#include <iostream>
#include <vector>
#include <string>

using namespace std;

int main() {
    ios_base::sync_with_stdio(false);
    cin.tie(NULL);
    
    // TODO: Read inputs and print result
    return 0;
}
`,
  java: `import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        // TODO: Read inputs and print result
        
        sc.close();
    }
}
`,
};

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

  // Coding Specific State
  const [inputFormat, setInputFormat] = useState(initialData?.input_format || "");
  const [outputFormat, setOutputFormat] = useState(initialData?.output_format || "");
  const [constraints, setConstraints] = useState(initialData?.constraints || "");
  const [allowedLanguages, setAllowedLanguages] = useState<string[]>(
    initialData?.allowed_languages || ["python", "javascript", "cpp", "java"]
  );
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(
    initialData?.time_limit_seconds || 2.0
  );
  const [memoryLimitMb, setMemoryLimitMb] = useState<number>(
    initialData?.memory_limit_mb || 256
  );

  // Test Cases State
  const [testCases, setTestCases] = useState<FormTestCase[]>(() => {
    if (initialData?.test_cases && initialData.test_cases.length > 0) {
      return initialData.test_cases;
    }
    return [
      {
        input_data: "3 5",
        expected_output: "8",
        is_sample: true,
        explanation: "3 + 5 = 8",
        weightage_marks: 1.0,
        order: 0,
      },
      {
        input_data: "10 20",
        expected_output: "30",
        is_sample: false,
        explanation: "",
        weightage_marks: 1.0,
        order: 1,
      },
    ];
  });

  // Boilerplates State
  const [boilerplates, setBoilerplates] = useState<Record<string, string>>(() => {
    const bps: Record<string, string> = { ...DEFAULT_BOILERPLATES };
    if (initialData?.boilerplates) {
      for (const bp of initialData.boilerplates) {
        bps[bp.language] = bp.starter_code;
      }
    }
    return bps;
  });
  const [activeCodeLangTab, setActiveCodeLangTab] = useState<string>("python");

  // Live Test Solution state
  const [testRunCustomInput, setTestRunCustomInput] = useState("");
  const [testRunning, setTestRunning] = useState(false);
  const [testRunResult, setTestRunResult] = useState<any>(null);

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
      setInputFormat(initialData.input_format || "");
      setOutputFormat(initialData.output_format || "");
      setConstraints(initialData.constraints || "");
      if (initialData.allowed_languages) setAllowedLanguages(initialData.allowed_languages);
      if (initialData.time_limit_seconds) setTimeLimitSeconds(initialData.time_limit_seconds);
      if (initialData.memory_limit_mb) setMemoryLimitMb(initialData.memory_limit_mb);
      if (initialData.options && initialData.options.length > 0) {
        setOptions(initialData.options);
      }
      if (initialData.test_cases && initialData.test_cases.length > 0) {
        setTestCases(initialData.test_cases);
      }
      if (initialData.boilerplates && initialData.boilerplates.length > 0) {
        const bps: Record<string, string> = { ...DEFAULT_BOILERPLATES };
        for (const bp of initialData.boilerplates) {
          bps[bp.language] = bp.starter_code;
        }
        setBoilerplates(bps);
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

  // Test Case Handlers
  const handleAddTestCase = (isSample: boolean) => {
    setTestCases((prev) => [
      ...prev,
      {
        input_data: "",
        expected_output: "",
        is_sample: isSample,
        explanation: "",
        weightage_marks: 1.0,
        order: prev.length,
      },
    ]);
  };

  const handleRemoveTestCase = (index: number) => {
    if (testCases.length <= 1) {
      setErrorMessage("At least 1 test case is required for coding questions.");
      return;
    }
    setTestCases((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTestCaseChange = (index: number, field: keyof FormTestCase, value: any) => {
    setTestCases((prev) =>
      prev.map((tc, i) => (i === index ? { ...tc, [field]: value } : tc))
    );
  };

  const toggleAllowedLanguage = (lang: string) => {
    setAllowedLanguages((prev) =>
      prev.includes(lang) ? prev.filter((l) => l !== lang) : [...prev, lang]
    );
  };

  // Live Test Solution Run
  const handleRunTestSolution = async () => {
    const codeToRun = boilerplates[activeCodeLangTab] || "";
    if (!codeToRun.trim()) {
      setTestRunResult({
        success: false,
        language: activeCodeLangTab,
        verdict: "EMPTY_CODE",
        stdout: "",
        stderr: "Please enter some code in the editor above before running.",
        execution_time_ms: 0,
      });
      return;
    }

    try {
      setTestRunning(true);
      setTestRunResult(null);

      const res = await fetch("/api/questions/test-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language: activeCodeLangTab,
          code: codeToRun,
          custom_input: testRunCustomInput !== undefined ? testRunCustomInput : "",
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        setTestRunResult({
          success: false,
          language: activeCodeLangTab,
          verdict: "HTTP_ERROR",
          stdout: "",
          stderr: data.detail || data.message || "Failed to execute code on judge server.",
          execution_time_ms: 0,
        });
        return;
      }
      setTestRunResult(data);
    } catch (err: any) {
      setTestRunResult({
        success: false,
        language: activeCodeLangTab,
        verdict: "NETWORK_ERROR",
        stdout: "",
        stderr: err.message || "Failed to connect to execution server.",
        execution_time_ms: 0,
      });
    } finally {
      setTestRunning(false);
    }
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

    if (examId) payload.exam_id = examId;
    if (sectionId) payload.section_id = sectionId;

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
      for (const opt of options) {
        if (!opt.option_text.trim()) {
          setErrorMessage("All option fields must have text.");
          return;
        }
      }
      const hasCorrect = options.some((opt) => opt.is_correct);
      if (!hasCorrect) {
        setErrorMessage("Please mark at least one option as the correct answer.");
        return;
      }
      payload.options = options.map((opt, idx) => ({
        option_text: opt.option_text.trim(),
        is_correct: opt.is_correct,
        order: idx,
      }));
    }

    if (questionType === "CODING") {
      if (allowedLanguages.length === 0) {
        setErrorMessage("Please select at least one allowed programming language.");
        return;
      }
      if (testCases.length === 0) {
        setErrorMessage("Please add at least one test case for code validation.");
        return;
      }
      for (const tc of testCases) {
        if (tc.expected_output === undefined || tc.expected_output === null) {
          setErrorMessage("Each test case must have an expected output.");
          return;
        }
      }

      payload.input_format = inputFormat.trim();
      payload.output_format = outputFormat.trim();
      payload.constraints = constraints.trim();
      payload.allowed_languages = allowedLanguages;
      payload.time_limit_seconds = Number(timeLimitSeconds) || 2.0;
      payload.memory_limit_mb = Number(memoryLimitMb) || 256;

      payload.test_cases = testCases.map((tc, idx) => ({
        input_data: tc.input_data,
        expected_output: tc.expected_output,
        is_sample: tc.is_sample,
        explanation: tc.explanation?.trim() || null,
        weightage_marks: Number(tc.weightage_marks) || 1.0,
        order: idx,
      }));

      payload.boilerplates = allowedLanguages.map((lang) => ({
        language: lang,
        starter_code: boilerplates[lang] || DEFAULT_BOILERPLATES[lang] || "",
      }));
    }

    try {
      setSubmitting(true);
      const url = isEditMode && initialData?.id ? `/api/questions/${initialData.id}` : "/api/questions";
      const method = isEditMode ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      let data: any = {};
      const responseText = await res.text();
      try {
        data = responseText ? JSON.parse(responseText) : {};
      } catch {
        data = { detail: responseText || `Server error (${res.status})` };
      }

      if (!res.ok) {
        throw new Error(data.detail || data.error || data.message || "Failed to save question.");
      }

      setSuccessMessage(
        isEditMode ? "Question updated successfully!" : "Question authored and saved to bank!"
      );

      if (onSuccess) {
        onSuccess();
      } else {
        setTimeout(() => {
          if (examId) {
            router.push(`/examiner/exams/${examId}/manage`);
          } else {
            router.push("/examiner/questions");
          }
        }, 800);
      }
    } catch (err: any) {
      console.error("Submit error:", err);
      setErrorMessage(err.message || "Failed to save question. Please try again.");
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
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
            {(
              [
                { type: "MCQ", label: "Single Choice", sub: "1 correct answer", icon: CheckCircle },
                { type: "MULTI_SELECT", label: "Multi Select", sub: ">=1 correct", icon: Layers },
                { type: "CODING", label: "Coding Problem", sub: "Test suite & IDE", icon: Code2 },
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
              placeholder="e.g. Data Structures & Algorithms"
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

          {/* Marks Allocated */}
          <div className="space-y-2">
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center justify-between">
              <span>Marks Allocated *</span>
              <span className="text-slate-500 font-normal text-[11px]">Min: 1</span>
            </label>
            <div className="relative">
              <input
                type="number"
                min={1}
                max={100}
                required
                value={marks}
                onChange={(e) => setMarks(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 rounded-xl bg-slate-900 border border-slate-700/80 text-sm text-white focus:outline-none focus:border-indigo-500 font-mono"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-500">
                PTS
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Question Statement & Content */}
      <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
        <div className="border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <HelpCircle className="h-5 w-5 text-indigo-400" />
            {questionType === "CODING" ? "Problem Description & Specifications" : "Question Statement"}
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            {questionType === "CODING"
              ? "Detail the algorithm task, input parameters, expected returns, and mathematical constraints."
              : "Formulate the core problem statement clearly."}
          </p>
        </div>

        {/* Statement Textarea */}
        <div className="space-y-2">
          <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
            {questionType === "CODING" ? "Problem Statement / Task Overview *" : "Question Text *"}
          </label>
          <textarea
            rows={questionType === "CODING" ? 6 : 4}
            required
            placeholder={
              questionType === "CODING"
                ? "Given an array of integers `nums` and an integer `target`, return indices of the two numbers such that they add up to `target`..."
                : "Type your question statement here..."
            }
            value={questionText}
            onChange={(e) => setQuestionText(e.target.value)}
            className="w-full p-4 rounded-2xl bg-slate-900 border border-slate-700/80 text-sm text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 transition-colors leading-relaxed font-sans"
          />
        </div>

        {/* Coding Specifications: Input, Output, Constraints */}
        {questionType === "CODING" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 pt-2">
            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Input Format
              </label>
              <textarea
                rows={3}
                placeholder="e.g. First line contains integer N, followed by N space-separated integers."
                value={inputFormat}
                onChange={(e) => setInputFormat(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Output Format
              </label>
              <textarea
                rows={3}
                placeholder="e.g. Print two space-separated indices."
                value={outputFormat}
                onChange={(e) => setOutputFormat(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Constraints
              </label>
              <textarea
                rows={3}
                placeholder="e.g. 1 <= N <= 10^5, -10^9 <= nums[i] <= 10^9"
                value={constraints}
                onChange={(e) => setConstraints(e.target.value)}
                className="w-full p-3 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500 font-mono"
              />
            </div>
          </div>
        )}

        {/* Image Upload for IMAGE question or optional diagram */}
        {canAttachImage && questionType !== "CODING" && (
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

      {/* 3. Coding Test Cases Suite & Starter Code (Online Judge) */}
      {questionType === "CODING" && (
        <>
          {/* Test Cases Manager */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Terminal className="h-5 w-5 text-indigo-400" />
                  Test Case Suite ({testCases.length})
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Provide sample test cases (visible to student) and hidden test cases (for grading & edge cases).
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleAddTestCase(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-emerald-400 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Sample Test Case
                </button>
                <button
                  type="button"
                  onClick={() => handleAddTestCase(false)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 border border-indigo-500/30 transition-colors"
                >
                  <Plus className="h-3.5 w-3.5" />
                  Add Hidden Test Case
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {testCases.map((tc, idx) => (
                <div
                  key={idx}
                  className={`p-4 rounded-2xl border transition-all ${
                    tc.is_sample
                      ? "bg-slate-900/90 border-emerald-500/30"
                      : "bg-slate-950/80 border-slate-800"
                  }`}
                >
                  <div className="flex items-center justify-between pb-3 border-b border-slate-800/80 mb-3">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">
                        Test Case #{idx + 1}
                      </span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                          tc.is_sample
                            ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                            : "bg-indigo-500/20 text-indigo-300 border border-indigo-500/30"
                        }`}
                      >
                        {tc.is_sample ? "Sample (Visible)" : "Hidden (Grading)"}
                      </span>
                    </div>

                    <div className="flex items-center gap-3">
                      <label className="flex items-center gap-1.5 text-xs text-slate-400 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={tc.is_sample}
                          onChange={(e) =>
                            handleTestCaseChange(idx, "is_sample", e.target.checked)
                          }
                          className="rounded border-slate-700 text-indigo-600 focus:ring-indigo-500"
                        />
                        <span>Is Sample</span>
                      </label>

                      <button
                        type="button"
                        onClick={() => handleRemoveTestCase(idx)}
                        className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10"
                        title="Remove Test Case"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Input (stdin)
                      </label>
                      <textarea
                        rows={3}
                        value={tc.input_data}
                        onChange={(e) =>
                          handleTestCaseChange(idx, "input_data", e.target.value)
                        }
                        placeholder="e.g. 4\n2 7 11 15\n9"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Expected Output (stdout) *
                      </label>
                      <textarea
                        rows={3}
                        required
                        value={tc.expected_output}
                        onChange={(e) =>
                          handleTestCaseChange(idx, "expected_output", e.target.value)
                        }
                        placeholder="e.g. 0 1"
                        className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  </div>

                  {tc.is_sample && (
                    <div className="mt-3">
                      <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-1">
                        Explanation (Optional)
                      </label>
                      <input
                        type="text"
                        value={tc.explanation || ""}
                        onChange={(e) =>
                          handleTestCaseChange(idx, "explanation", e.target.value)
                        }
                        placeholder="e.g. nums[0] + nums[1] == 9, so return [0, 1]"
                        className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-800 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Languages & Starter Boilerplate Templates */}
          <div className="glass-card rounded-3xl p-6 sm:p-8 border border-slate-800 space-y-6 shadow-xl">
            <div className="border-b border-slate-800 pb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Code2 className="h-5 w-5 text-indigo-400" />
                Language Settings & Starter Code Templates
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Configure which programming languages candidates can choose from, and provide boilerplate starter code.
              </p>
            </div>

            {/* Allowed Languages Checkboxes */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Allowed Languages *
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  { id: "python", label: "Python 3" },
                  { id: "javascript", label: "JavaScript (Node.js)" },
                  { id: "cpp", label: "C++ (g++)" },
                  { id: "java", label: "Java 17" },
                ].map((lang) => {
                  const isChecked = allowedLanguages.includes(lang.id);
                  return (
                    <button
                      key={lang.id}
                      type="button"
                      onClick={() => toggleAllowedLanguage(lang.id)}
                      className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all flex items-center gap-2 ${
                        isChecked
                          ? "bg-indigo-600 text-white border-indigo-500 shadow-md shadow-indigo-600/20"
                          : "bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700"
                      }`}
                    >
                      {isChecked && <Check className="h-3.5 w-3.5" />}
                      <span>{lang.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Execution Limits */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5 text-indigo-400" />
                  Time Limit per Test Case (Seconds)
                </label>
                <input
                  type="number"
                  step="0.5"
                  min="0.5"
                  max="10"
                  value={timeLimitSeconds}
                  onChange={(e) => setTimeLimitSeconds(parseFloat(e.target.value) || 2.0)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white font-mono"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Cpu className="h-3.5 w-3.5 text-indigo-400" />
                  Memory Limit (MB)
                </label>
                <input
                  type="number"
                  step="64"
                  min="64"
                  max="1024"
                  value={memoryLimitMb}
                  onChange={(e) => setMemoryLimitMb(parseInt(e.target.value) || 256)}
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-900 border border-slate-700/80 text-xs text-white font-mono"
                />
              </div>
            </div>

            {/* Boilerplate Editor */}
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Starter Code Boilerplate
                </label>
                <div className="flex items-center gap-1.5 bg-slate-950 p-1 rounded-xl border border-slate-800">
                  {allowedLanguages.map((lang) => (
                    <button
                      key={lang}
                      type="button"
                      onClick={() => setActiveCodeLangTab(lang)}
                      className={`px-3 py-1 rounded-lg text-xs font-bold capitalize transition-all ${
                        activeCodeLangTab === lang
                          ? "bg-indigo-600 text-white shadow-sm"
                          : "text-slate-400 hover:text-white"
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={10}
                value={boilerplates[activeCodeLangTab] || ""}
                onChange={(e) =>
                  setBoilerplates((prev) => ({
                    ...prev,
                    [activeCodeLangTab]: e.target.value,
                  }))
                }
                className="w-full p-4 rounded-2xl bg-slate-950 border border-slate-800 text-xs text-emerald-400 font-mono focus:outline-none focus:border-indigo-500 leading-relaxed"
              />
            </div>

            {/* Live Test Run Box */}
            <div className="p-4 rounded-2xl bg-slate-950 border border-slate-800/80 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <Play className="h-3.5 w-3.5 text-indigo-400" />
                  Live Test Run (Verify Starter Code / Solution)
                </span>
                <button
                  type="button"
                  onClick={handleRunTestSolution}
                  disabled={testRunning}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition-colors cursor-pointer"
                >
                  {testRunning ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  <span>{testRunning ? "Executing..." : `Run ${activeCodeLangTab}`}</span>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Custom Stdin Input
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter input (e.g. 7 1 8 12 4 6 15 20 10)"
                    value={testRunCustomInput}
                    onChange={(e) => setTestRunCustomInput(e.target.value)}
                    className="w-full p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-xs text-white font-mono placeholder-slate-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    Execution Output & Logs
                  </label>
                  <div className="p-3 rounded-xl bg-slate-900 border border-slate-800 text-xs font-mono text-slate-300 min-h-[76px] flex flex-col justify-center overflow-x-auto">
                    {testRunResult ? (
                      <div className="space-y-1.5">
                        <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1">
                          <span
                            className={`font-bold text-xs ${
                              testRunResult.verdict === "SUCCESS" || testRunResult.verdict === "ACCEPTED"
                                ? "text-emerald-400"
                                : "text-rose-400"
                            }`}
                          >
                            [{testRunResult.verdict}]
                          </span>
                          <span className="text-[10px] text-slate-500">{testRunResult.execution_time_ms}ms</span>
                        </div>
                        {testRunResult.stdout && (
                          <pre className="text-emerald-300 whitespace-pre-wrap">{testRunResult.stdout}</pre>
                        )}
                        {testRunResult.stderr && (
                          <pre className="text-rose-400 whitespace-pre-wrap">{testRunResult.stderr}</pre>
                        )}
                        {!testRunResult.stdout && !testRunResult.stderr && (
                          <span className="text-slate-500 italic">(no stdout/stderr output)</span>
                        )}
                      </div>
                    ) : (
                      <span className="text-slate-600 italic">Click Run to test execution output...</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* 4. MCQ / Descriptive Answer Options */}
      {questionType !== "CODING" && (
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
      )}

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
