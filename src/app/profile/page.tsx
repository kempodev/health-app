import { auth } from '@/lib/auth';
import { redirect } from 'next/navigation';
import { PreferencesForm } from './components/PreferencesForm';
import { getUserPreferences } from './actions';

export default async function ProfilePage() {
  const session = await auth();

  if (!session) {
    redirect('/api/auth/signin?callbackUrl=/profile');
  }

  const preferences = await getUserPreferences();
  const weightPref = preferences.find((p) => p.metricType === 'weight');
  const lengthPref = preferences.find((p) =>
    ['chest', 'arm', 'waist', 'hip', 'thigh', 'calf'].includes(p.metricType)
  );

  return (
    <div className='container mx-auto py-8'>
      <h1 className='text-3xl font-bold mb-8'>Profile Settings</h1>
      <PreferencesForm
        initialWeightUnit={weightPref?.unit ?? 'kg'}
        initialLengthUnit={lengthPref?.unit ?? 'cm'}
      />
    </div>
  );
}
