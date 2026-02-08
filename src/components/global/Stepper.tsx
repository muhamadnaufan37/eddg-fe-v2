import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Step {
  id: string | number;
  label: string;
  description?: string;
}

interface StepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (stepIndex: number) => void;
  allowNavigation?: boolean;
  completedSteps?: number[];
  className?: string;
}

export const Stepper = ({
  steps,
  currentStep,
  onStepClick,
  allowNavigation = false,
  completedSteps = [],
  className,
}: StepperProps) => {
  const handleStepClick = (index: number) => {
    if (allowNavigation && onStepClick) {
      onStepClick(index);
    }
  };

  return (
    <div className={cn("w-full", className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const isActive = index === currentStep;
          const isCompleted = completedSteps.includes(index);
          const isClickable = allowNavigation && onStepClick;

          return (
            <div key={step.id} className="flex items-center flex-1">
              {/* Step circle */}
              <div className="flex flex-col items-center shrink-0">
                <button
                  type="button"
                  onClick={() => handleStepClick(index)}
                  disabled={!isClickable}
                  className={cn(
                    "relative flex items-center justify-center w-10 h-10 rounded-full border-2 transition-all duration-200",
                    isActive &&
                      "border-indigo-600 dark:border-indigo-500 bg-indigo-600 dark:bg-indigo-500 text-white",
                    isCompleted &&
                      !isActive &&
                      "border-green-600 dark:border-green-500 bg-green-600 dark:bg-green-500 text-white",
                    !isActive &&
                      !isCompleted &&
                      "border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-500 dark:text-gray-400",
                    isClickable &&
                      !isActive &&
                      "cursor-pointer hover:border-indigo-400 dark:hover:border-indigo-400",
                    !isClickable && "cursor-default",
                  )}
                  aria-label={`Step ${index + 1}: ${step.label}`}
                >
                  {isCompleted && !isActive ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span className="text-sm font-semibold">{index + 1}</span>
                  )}
                </button>

                {/* Step label */}
                <div className="mt-2 text-center">
                  <div
                    className={cn(
                      "text-xs font-medium",
                      isActive && "text-indigo-600 dark:text-indigo-400",
                      isCompleted &&
                        !isActive &&
                        "text-green-600 dark:text-green-400",
                      !isActive &&
                        !isCompleted &&
                        "text-gray-500 dark:text-gray-400",
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                      {step.description}
                    </div>
                  )}
                </div>
              </div>

              {/* Connector line */}
              {index < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 h-0.5 mx-2 transition-colors duration-200",
                    (isCompleted || isActive) &&
                      "bg-indigo-600 dark:bg-indigo-500",
                    !isCompleted && !isActive && "bg-gray-300 dark:bg-gray-600",
                  )}
                  style={{ marginTop: "-2rem" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default Stepper;
