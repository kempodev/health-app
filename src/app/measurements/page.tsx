import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { MeasurementWrapper } from './components/MeasurementWrapper';

import { getUserPreferences, getTargets } from '@/lib/actions';
import { getMeasurements } from './actions';

export default async function MeasurementsPage() {
  const session = await auth();
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/measurements');
  }

  const [measurementsResult, preferencesResult, targetsResult] =
    await Promise.all([getMeasurements(), getUserPreferences(), getTargets()]);

  if (measurementsResult.error) {
    return <div>Error: {measurementsResult.error}</div>;
  }

  if (preferencesResult.error) {
    return <div>Error: {preferencesResult.error}</div>;
  }

  if (targetsResult.error) {
    return <div>Error: {targetsResult.error}</div>;
  }

  const measurements = (measurementsResult.data ?? []).map((m) => ({
    ...m,
  }));

  return (
    <>
      <MeasurementWrapper
        initialMetric='weight'
        measurements={measurements}
        userPreferences={preferencesResult.data ?? []}
        targets={targetsResult.data ?? []}
      />
    </>
  );
}
