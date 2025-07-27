import React from 'react';

interface StepIndicatorProps {
  currentStep: number;
  totalSteps: number;
  labels: string[];
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep, totalSteps, labels }) => {
  return (
    <nav aria-label="Progress" className="mb-6">
      <div className="flex items-center justify-between mb-2">
        <span className="text-sm font-medium">Step {currentStep} of {totalSteps}</span>
        <span className="text-sm font-medium">{labels[currentStep - 1]}</span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2">
        <div
          className="bg-blue-600 h-2 rounded-full transition-all"
          style={{ width: `${(currentStep / totalSteps) * 100}%` }}
        />
      </div>
      <div className="flex justify-between mt-2 text-xs text-gray-500">
        {labels.map((label, idx) => (
          <span key={label} className={idx + 1 === currentStep ? 'font-bold text-blue-700' : ''}>
            {label}
          </span>
        ))}
      </div>
    </nav>
  );
};

export default StepIndicator; 