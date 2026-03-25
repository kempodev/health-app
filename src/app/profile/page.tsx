import { createClient } from '@/lib/supabase/server';
import { type MetricType, type UnitType } from '@/app/types';
import { redirect } from 'next/navigation';
import { PreferencesForm } from './components/PreferencesForm';
import { getUserPreferences, getTargets } from '@/lib/actions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { TargetSettings } from './components/TargetSettings';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const preferencesResult = await getUserPreferences();
  if (preferencesResult.error) {
    return <div>Error: {preferencesResult.error}</div>;
  }
  const preferences = (preferencesResult.data ?? []) as {
    metric_type: MetricType;
    unit: UnitType;
  }[];
  const weightPref = preferences.find((p) => p.metric_type === 'weight');
  const lengthPref = preferences.find((p) =>
    ['chest', 'arm', 'waist', 'hip', 'thigh', 'calf'].includes(p.metric_type)
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
