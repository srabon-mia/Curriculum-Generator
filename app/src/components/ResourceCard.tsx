"use client";

import { useState } from "react";
import type { Resource } from "@/lib/curriculum-data";

const LICENSE_LABEL: Record<Resource["license_status"], string> = {
  cc_open: "Open license — embeddable",
  link_only: "Link only",
  unknown_review_needed: "Needs license review",
};

const LICENSE_COLOR: Record<Resource["license_status"], string> = {
  cc_open: "bg-[#E8F2EA] text-[#3D7A4F]",
  link_only: "bg-[#F0EDE3] text-[#5A564A]",
  unknown_review_needed: "bg-[#FBEAE5] text-[#B8453D]",
};

const STATUS_COLOR: Record<Resource["status"], string> = {
  draft: "bg-[#FBF3E6] text-[#B8753D]",
  approved: "bg-[#E8F2EA] text-[#3D7A4F]",
  rejected: "bg-[#F2F2F2] text-[#8A8578] line-through",
};

function DeleteModal({
  title,
  onConfirm,
  onCancel,
}: {
  title: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/30"
        onClick={onCancel}
      />
      {/* Modal */}
      <div className="relative bg-white rounded-lg border border-[#E7E3D7] shadow-lg px-6 py-5 max-w-sm w-full mx-4">
        <h3 className="font-serif text-lg text-[#1A1A18] mb-1">
          Delete resource?
        </h3>
        <p className="text-sm text-[#5A564A] mb-5">
          &ldquo;{title}&rdquo; will be permanently removed. This can&rsquo;t
          be undone.
        </p>
        <div className="flex gap-2 justify-end">
          <button
            onClick={onCancel}
            className="text-sm px-4 py-2 rounded-md border border-[#D8D4C8] text-[#5A564A] hover:border-[#1A1A18] transition"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="text-sm px-4 py-2 rounded-md bg-[#B8453D] text-white hover:bg-[#9A3A33] transition"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export function ResourceCard({
  resource,
  onApprove,
  onReject,
  onDelete,
}: {
  resource: Resource;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  return (
    <>
      {showDeleteModal && (
        <DeleteModal
          title={resource.title}
          onConfirm={() => {
            setShowDeleteModal(false);
            onDelete(resource.id);
          }}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}

      <div className="rounded-md border border-[#E7E3D7] bg-white p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <a
              href={resource.url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-[#1A1A18] hover:text-[#B8753D] underline decoration-[#D8D4C8] underline-offset-2 break-words"
            >
              {resource.title}
            </a>
            {resource.source_domain && (
              <p className="text-xs text-[#8A8578] mt-0.5">
                {resource.source_domain}
              </p>
            )}
            {resource.ai_note && (
              <p className="text-sm text-[#5A564A] mt-2 italic">
                &ldquo;{resource.ai_note}&rdquo;
              </p>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs px-2 py-1 rounded-full bg-[#F0EDE3] text-[#5A564A] capitalize">
              {resource.resource_type.replace("_", " ")}
            </span>
            <button
              onClick={() => setShowDeleteModal(true)}
              className="text-[#8A8578] hover:text-[#B8453D] transition text-sm"
              title="Delete resource"
            >
              ✕
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 mt-3 flex-wrap">
          <span
            className={`text-xs px-2 py-1 rounded-full ${LICENSE_COLOR[resource.license_status]}`}
          >
            {LICENSE_LABEL[resource.license_status]}
          </span>
          <span
            className={`text-xs px-2 py-1 rounded-full ${STATUS_COLOR[resource.status]}`}
          >
            {resource.status}
          </span>
        </div>

        {resource.status === "draft" && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={() => onApprove(resource.id)}
              className="text-sm px-3 py-1.5 rounded-md bg-[#1A1A18] text-white hover:bg-[#3D3A30] transition"
            >
              Approve
            </button>
            <button
              onClick={() => onReject(resource.id)}
              className="text-sm px-3 py-1.5 rounded-md border border-[#D8D4C8] text-[#5A564A] hover:border-[#B8453D] hover:text-[#B8453D] transition"
            >
              Reject
            </button>
          </div>
        )}
      </div>
    </>
  );
}