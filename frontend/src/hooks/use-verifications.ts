import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

import { userKeys } from "@/hooks/use-users";
import { verificationsService } from "@/services/verifications.service";

export const verificationKeys = { all: ["verifications"] as const };

export function useVerifications() {
  return useQuery({ queryKey: verificationKeys.all, queryFn: verificationsService.list });
}

export function useVerificationMutations() {
  const client = useQueryClient();
  const invalidate = () => {
    client.invalidateQueries({ queryKey: verificationKeys.all });
    client.invalidateQueries({ queryKey: userKeys.all });
  };
  return {
    approve: useMutation({ mutationFn: verificationsService.approve, onSuccess: invalidate }),
    reject: useMutation({ mutationFn: verificationsService.reject, onSuccess: invalidate }),
    requestChanges: useMutation({ mutationFn: verificationsService.requestChanges, onSuccess: invalidate }),
  };
}
