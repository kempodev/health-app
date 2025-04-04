import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { getMeasurements, getUserPreferences } from './actions';
import { MeasurementWrapper } from './components/MeasurementWrapper';
import { MetricType } from './types';

export default async function MeasurementsPage() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/measurements');
  }

  const rawMeasurements = await getMeasurements();
  const measurements = rawMeasurements.map((m) => ({
    ...m,
    createdAt: m.createdAt.toISOString(),
    updatedAt: m.updatedAt.toISOString(),
  }));
  const userPreferences = await getUserPreferences();
  const initialMetric: MetricType = 'weight';

  return (
    <div className='container mx-auto px-4 py-8'>
      <MeasurementWrapper
        initialMetric={initialMetric}
        measurements={measurements}
        userPreferences={userPreferences}
      />
    </div>
  );
}
