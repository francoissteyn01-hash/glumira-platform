// hooks/dashboard-checks.ts
import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';

const supabase = createClient();

export function useHasProfile(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    supabase.from('patient_profiles').select('*').limit(1).then(res => setHas(res.data?.length > 0));
  }, []);
  return has;
}

export function useHasDoses(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    supabase.from('insulin_doses').select('*').limit(1).then(res => setHas(res.data?.length > 0));
  }, []);
  return has;
}

export function useHasGlucose(): boolean {
  const [has, setHas] = useState(false);
  useEffect(() => {
    supabase.from('glucose_readings').select('*').limit(1).then(res => setHas(res.data?.length > 0));
  }, []);
  return has;
}

export function useProfileComplete(): boolean {
  const [complete, setComplete] = useState(false);
  useEffect(() => {
    Promise.all([
      supabase.from('insulin_regimens').select('*'),
      supabase.from('patient_settings').select('*')
    ]).then(([regs, sets]) => setComplete(regs.data?.length > 0 && sets.data?.length === 1));
  }, []);
  return complete;
}
