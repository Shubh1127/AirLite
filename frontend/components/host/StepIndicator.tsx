export default function StepIndicator({
  currentStep,
  totalSteps,
}: {
  currentStep: number;
  totalSteps: number;
}) {
  const percentage = (currentStep / totalSteps) * 100;

  return (
    <div className="flex items-center gap-3">
      <div className="w-48 h-1 bg-gray-200 rounded-full overflow-hidden">
        <div
          className="h-full bg-gray-900 transition-all duration-300"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600">
        {currentStep} / {totalSteps}
      </span>
    </div>
  );
}
