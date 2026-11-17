import { Check } from "lucide-react";

export default function StepProgress({ steps, currentStep, onStepClick }) {
  return (
    <div className="w-full max-w-xl mx-auto mb-8">
      <div className="flex items-center justify-between relative">
        <div
          aria-hidden="true"
          className="absolute left-6 right-6 top-4 h-0.5 bg-slate-200 dark:bg-slate-700 -z-0"
        />
        <div
          aria-hidden="true"
          className="absolute left-6 top-4 h-0.5 bg-primary-600 transition-all duration-300 -z-0"
          style={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`
          }}
        />

        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = stepNumber < currentStep;
          const isCurrent = stepNumber === currentStep;

          return (
            <div key={step.title} className="flex flex-col items-center relative z-10">
              <button
                type="button"
                onClick={() => onStepClick && isCompleted && onStepClick(stepNumber)}
                disabled={!isCompleted}
                aria-current={isCurrent ? "step" : undefined}
                className={`w-9 h-9 rounded-full flex items-center justify-center font-semibold text-xs transition-all duration-200 ${
                  isCompleted
                    ? "bg-primary-600 text-white cursor-pointer hover:bg-primary-700 shadow-sm"
                    : isCurrent
                    ? "bg-primary-600 text-white ring-4 ring-primary-100 dark:ring-primary-900/40 shadow"
                    : "bg-white dark:bg-slate-800 text-slate-400 border border-slate-300 dark:border-slate-600 cursor-default"
                }`}
              >
                {isCompleted ? <Check size={16} strokeWidth={2.5} /> : stepNumber}
              </button>
              <span
                className={`mt-2 text-xs font-medium text-center hidden sm:block ${
                  isCurrent
                    ? "text-primary-600 dark:text-primary-400 font-semibold"
                    : isCompleted
                    ? "text-slate-700 dark:text-slate-300"
                    : "text-slate-400 dark:text-slate-500"
                }`}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

