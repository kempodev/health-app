import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { MeasurementWrapper } from './components/MeasurementWrapper';

import { getUserPreferences, getTargets } from '@/lib/actions';
import { getMeasurements } from './actions';

export default async function MeasurementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
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
