/**
 * GluMira™ V7 — useDisplayName hook
 * For caregivers: returns the care recipient's name.
 * For self-managing users: returns their own first name.
 * Used in nav, dashboard greetings, and Mira chat.
 */

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { API } from "@/lib/api";

type DisplayNameState = {
  displayName: string;
  caregiverName: string;
  isCaregiver: boolean;
  relationship: string;
  loading: boolean;
}

export function useDisplayName(): DisplayNameState {
  const { session, user } = useAuth();
  const [state, setState] = useState<DisplayNameState>({
    displayName: "",
    caregiverName: "",
    isCaregiver: false,
    relationship: "",
    loading: true,
  });

  useEffect(() => {
    if (!session) { setState((s) => ({ ...s, loading: false })); return; }

    const meta = user?.user_metadata;
    if (meta?.is_caregiver && meta?.patient_name) {
      setState({
        displayName: meta.patient_name,
        caregiverName: meta.full_name ?? "",
        isCaregiver: true,
        relationship: meta.relationship ?? "",
        loading: false,
      });
      return;
    }

    fetch(`${API}/api/profile`, {
      headers: { Authorization: `Bearer ${session.access_token}` },
    })
      .then((r) => r.json())
      .then((data) => {
        const p = data?.profile;
        if (p?.is_caregiver && p?.patient_name) {
          setState({
            displayName: p.patient_name,
            caregiverName: `${p.first_name ?? ""} ${p.last_name ?? ""}`.trim(),
            isCaregiver: true,
            relationship: p.relationship ?? "",
            loading: false,
          });
        } else {
          setState({
            displayName: p?.first_name ?? "",
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
