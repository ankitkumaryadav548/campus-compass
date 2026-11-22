"use client";
// components/modules/community/InviteModal.jsx
// Modal for adding an optional note (max 150 chars) when inviting a student.

import { useState, useEffect, useRef } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
const INVITE_NOTE_MAX = 150;

export default function InviteModal({ open, isOpen, onClose, onSend, personName, sending }) {
  const isModalOpen = Boolean(isOpen ?? open);
  const [note, setNote] = useState("");
  const textareaRef = useRef(null);

  useEffect(() => {
    if (isModalOpen) {
      setNote("");
      const timer = setTimeout(() => {
        textareaRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isModalOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSend(note.trim());
  };

  const firstName = personName?.split(" ")[0] || "them";

  return (
    <Modal isOpen={isModalOpen} open={isModalOpen} onClose={onClose} title={`Invite ${firstName} to chat`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <p className="text-xs text-slate-500 dark:text-slate-400">
          Add an optional note to introduce yourself. {firstName} will see it with your invitation.
        </p>

        <div className="space-y-1">
          <label htmlFor="invite-note" className="text-xs font-semibold text-slate-700 dark:text-slate-300">
            Note (optional)
          </label>
          <textarea
            id="invite-note"
            ref={textareaRef}
            rows={3}
            value={note}
            onChange={(e) => setNote(e.target.value.slice(0, INVITE_NOTE_MAX))}
            placeholder={`Hi ${firstName}, I'd like to connect on Campus Compass!`}
            className="w-full text-xs p-3 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
          />
          <div className="text-right text-[10px] text-slate-400">
            {note.length} / {INVITE_NOTE_MAX}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-1">
          <Button type="button" variant="secondary" size="sm" disabled={sending} onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={sending} disabled={sending}>
            Send invitation
          </Button>
        </div>
      </form>
    </Modal>
  );
}
