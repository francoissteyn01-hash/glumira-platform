// hooks/dashboard-checks.ts
import { useEffect, useState } from 'react';
import { supabase } from '@/hooks/useAuth';

export function useHasProfile(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    supabase.from('patient_profiles').select('id').limit(1).then(res => setHas((res.data?.length ?? 0) > 0));
  }, []);
  return has;
}

export function useHasDoses(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    supabase.from('insulin_doses').select('id').limit(1).then(res => setHas((res.data?.length ?? 0) > 0));
  }, []);
  return has;
}

export function useHasGlucose(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    supabase.from('glucose_readings').select('id').limit(1).then(res => setHas((res.data?.length ?? 0) > 0));
  }, []);
  return has;
}

export function useProfileComplete(): boolean {
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    Promise.all([
      supabase.from('insulin_regimens').select('id'),
      supabase.from('patient_settings').select('profile_id')
    ]).then(([regs, sets]) => setComplete((regs.data?.length ?? 0) > 0 && (sets.data?.length ?? 0) === 1));
  }, []);
  return complete;
}
