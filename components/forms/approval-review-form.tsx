"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import {
  reviewTransportRequest,
  type ApprovalFormState,
} from "@/app/actions/approvals";
import { useRouter } from "next/navigation";

type ApprovalReviewFormProps = {
  requestId: string;
};

const initialState: ApprovalFormState = {};

export function ApprovalReviewForm({
  requestId,
}: ApprovalReviewFormProps) {
  const [state, formAction, pending] = useActionState(
    reviewTransportRequest,
    initialState
  );

  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
        toast.success(state.success);

        setTimeout(() => {
        router.push("/approver/requests/pending");
        router.refresh();
        }, 700);
    }

    if (state?.error) {
        toast.error(state.error);
    }
    }, [state, router]);

  return (
    <form action={formAction} className="mt-6 space-y-5">
      <input type="hidden" name="requestId" value={requestId} />

      <div className="space-y-2">
        <label
          htmlFor="comment"
          className="text-sm font-medium text-slate-700"
        >
          Comment / Reason
        </label>
        <textarea
          id="comment"
          name="comment"
          rows={5}
          placeholder="Add an approval note or explain why the request is rejected..."
          className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-100"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          name="decision"
          value="approved"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-emerald-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Processing..." : "Approve Request"}
        </button>

        <button
          type="submit"
          name="decision"
          value="rejected"
          disabled={pending}
          className="inline-flex h-11 items-center justify-center rounded-2xl bg-red-600 px-5 text-sm font-semibold text-white shadow-sm transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {pending ? "Processing..." : "Reject Request"}
        </button>
      </div>
    </form>
  );
}