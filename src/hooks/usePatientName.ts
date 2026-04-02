/**
 * GluMira™ V7 — usePatientName hook
 * For caregivers: returns the PATIENT name (e.g. "Anouk").
 * For non-caregivers: returns the user's own first name.
 * Used in nav, dashboard greetings, and Mira chat.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";

interface PatientNameState {
  patientName: string;      // The name shown in the UI ("Anouk" for caregivers, first_name for patients)
  caregiverName: string;    // The caregiver's own name (empty for non-caregivers)
  isCaregiver: boolean;
  relationship: string;
  loading: boolean;
}

export function usePatientName(): PatientNameState {
  const { session, user } = useAuth();
  const [state, setState] = useState<PatientNameState>({
    patientName: "",
    caregiverName: "",
    isCaregiver: false,
    relationship: "",
    loading: true,
  });

  useEffect(() => {
    if (!session) { setState((s) => ({ ...s, loading: false })); return; }

    // First check user metadata (set during registration)
    const meta = user?.user_metadata;
    if (meta?.is_caregiver && meta?.patient_name) {
      setState({
        patientName: meta.patient_name,
        caregiverName: meta.full_name ?? "",
        isCaregiver: true,
        relationship: meta.relationship ?? "",
        loading: false,
      });
      return;
    }

    // Otherwise load from profile
    fetch("/api/profile", {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.profile;
        if (p?.is_caregiver && p?.patient_name) {
          setState({
            patientName: p.patient_name,
            caregiverName: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
            isCaregiver: true,
            relationship: p.relationship ?? "",
            loading: false,
          });
        } else {
          setState({
            patientName: p?.first_name ?? user?.email?.split("@")[0] ?? "",
            caregiverName: "",
            isCaregiver: false,
            relationship: "",
            loading: false,
          });
        }
      })
      .catch(() => {
        setState((s) => ({ ...s, loading: false }));
      });
  }, [session, user]);

  return state;
}
