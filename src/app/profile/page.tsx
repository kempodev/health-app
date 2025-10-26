import { auth } from '@/lib/auth';
import { type MetricType, type UnitType } from '@/app/types';
import { redirect } from 'next/navigation';
import { PreferencesForm } from './components/PreferencesForm';
import { getUserPreferences, getTargets } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TargetSettings } from './components/TargetSettings';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/profile');
  }

  const preferencesResult = await getUserPreferences();
  if (preferencesResult.error) {
    return <div>Error: {preferencesResult.error}</div>;
  }
  const preferences = (preferencesResult.data ?? []) as {
    metricType: MetricType;
    unit: UnitType;
  }[];
  const weightPref = preferences.find((p) => p.metricType === 'weight');
  const lengthPref = preferences.find((p) =>
    ['chest', 'arm', 'waist', 'hip', 'thigh', 'calf'].includes(p.metricType)
  );

  const targetsResult = await getTargets();
  const targets = targetsResult.data ?? [];

  return (
    <>
      <h1 className='text-3xl font-bold mb-8'>Profile Settings</h1>
      <div className='space-y-8'>
        <Card className='max-w-2xl'>
          <CardHeader>
            <CardTitle>Measurement Preferences</CardTitle>
          </CardHeader>
          <CardContent>
            <PreferencesForm
              initialWeightUnit={weightPref?.unit ?? 'kg'}
              initialLengthUnit={lengthPref?.unit ?? 'cm'}
            />
          </CardContent>
        </Card>

        <Card className='max-w-2xl'>
          <CardHeader>
            <CardTitle>Measurement Targets</CardTitle>
          </CardHeader>
          <CardContent>
            <TargetSettings
              initialTargets={targets}
              userPreferences={preferences}
            />
          </CardContent>
        </Card>
      </div>
    </>
  );
}
