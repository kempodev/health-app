import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMeasurements, getUserPreferences } from './actions';
import { MeasurementWrapper } from './components/MeasurementWrapper';

export default async function MeasurementsPage() {
  const session = await auth();
  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/measurements');
  }

  const measurementsResult = await getMeasurements();
  if (measurementsResult.error) {
    // You might want to show an error UI here
    return <div>Error: {measurementsResult.error}</div>;
  }

  const preferencesResult = await getUserPreferences();
  if (preferencesResult.error) {
    return <div>Error: {preferencesResult.error}</div>;
  }

  const measurements = (measurementsResult.data ?? []).map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));

  return (
    <>
      <MeasurementWrapper
        initialMetric='weight'
        measurements={measurements}
        userPreferences={preferencesResult.data ?? []}
      />
    </>
  );
}
