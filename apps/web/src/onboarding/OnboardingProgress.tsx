export function OnboardingProgress({
  step,
  total,
}: {
  step: number;
  total: number;
}) {
  return (
    <p className="onboarding-progress">
      Step {step} of {total}
    </p>
  );
}
