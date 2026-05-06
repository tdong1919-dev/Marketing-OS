"use client";
import { useState } from "react";
import StatusBadge from "./StatusBadge";
import InsightTag from "./InsightTag";
import Button from "./Button";

export type MessageStatus = "auto" | "review" | "escalated" | "approved" | "sent";

export interface Message {
  id: string;
  username: string;
  platform: "instagram" | "facebook";
  comment: string;
  aiReply: string;
  status: MessageStatus;
  confidenceScore: number;
  detectedIntent: string;
  tags: string[];
  timestamp: string;
}

interface MessageCardProps {
  message: Message;
  isSelected?: boolean;
  compact?: boolean;
  onSelect?: (msg: Message) => void;
  onApprove?: (id: string) => void;
  onEscalate?: (id: string) => void;
  onSend?: (id: string, reply: string) => void;
}

const platformIcon = {
  instagram: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
    </svg>
  ),
  facebook: (
    <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="currentColor">
      <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
    </svg>
  ),
};

const confidenceColor = (score: number) =>
  score >= 85 ? "text-primary" : score >= 65 ? "text-warning" : "text-error";

export default function MessageCard({
  message, isSelected, compact, onSelect, onApprove, onEscalate, onSend,
}: MessageCardProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.aiReply);
  const [localStatus, setLocalStatus] = useState(message.status);

  const handleApprove = () => {
    setLocalStatus("approved");
    onApprove?.(message.id);
  };

  const handleSend = () => {
    setLocalStatus("sent");
    onSend?.(message.id, draft);
    setEditing(false);
  };

  const handleEscalate = () => {
    setLocalStatus("escalated");
    onEscalate?.(message.id);
  };

  if (compact) {
    return (
      <button
        onClick={() => onSelect?.(message)}
        className={`w-full text-left p-4 rounded-xl border transition-all duration-150
          ${isSelected
            ? "border-primary/40 bg-primary/5 shadow-[0_0_16px_rgba(123,63,242,0.08)]"
            : "border-border bg-surface hover:border-border/80 hover:bg-surface-elevated"
          }`}
      >
        <div className="flex items-start justify-between gap-2 mb-2">
          <div className="flex items-center gap-2 min-w-0">
            <span className="text-sm font-semibold text-text-primary truncate">{message.username}</span>
            <span className="text-text-muted shrink-0">{platformIcon[message.platform]}</span>
          </div>
          <StatusBadge status={localStatus} />
        </div>
        <p className="text-xs text-text-secondary truncate mb-1">{message.comment}</p>
        <p className="text-xs text-text-muted">{message.timestamp}</p>
      </button>
    );
  }

  return (
    <div className={`rounded-2xl border transition-all duration-200
      ${isSelected
        ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_rgba(123,63,242,0.1)]"
        : "border-border bg-surface-elevated"
      }`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3 p-5 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-accent-purple to-accent-pink flex items-center justify-center text-white text-xs font-bold shrink-0">
            {message.username.replace("@", "").slice(0, 2).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-text-primary">{message.username}</span>
              <span className="text-text-muted">{platformIcon[message.platform]}</span>
            </div>
            <p className="text-xs text-text-muted">{message.timestamp}</p>
          </div>
        </div>
        <StatusBadge status={localStatus} />
      </div>

      {/* Comment */}
      <div className="px-5 pb-3">
        <div className="rounded-xl bg-surface border border-border p-3">
          <p className="text-xs text-text-muted uppercase tracking-wider mb-1.5">Comment</p>
          <p className="text-sm text-text-primary leading-relaxed">{message.comment}</p>
        </div>
      </div>

      {/* AI Reply */}
      <div className="px-5 pb-3">
        <div className="rounded-xl bg-primary/5 border border-primary/15 p-3">
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs text-primary/70 uppercase tracking-wider font-medium">AI Reply</p>
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-text-muted">Confidence:</span>
              <span className={`text-xs font-bold ${confidenceColor(message.confidenceScore)}`}>
                {message.confidenceScore}%
              </span>
            </div>
          </div>
          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={3}
              className="w-full bg-surface border border-border rounded-lg px-3 py-2 text-sm text-text-primary resize-none outline-none focus:border-primary/50 mt-1"
            />
          ) : (
            <p className="text-sm text-text-primary leading-relaxed">{draft}</p>
          )}
        </div>
      </div>

      {/* Tags */}
      <div className="px-5 pb-3 flex flex-wrap gap-1.5">
        {message.tags.map((tag) => <InsightTag key={tag} tag={tag} />)}
        <span className="inline-flex items-center px-2 py-0.5 rounded-lg text-xs text-text-muted border border-border bg-surface">
          {message.detectedIntent}
        </span>
      </div>

      {/* Actions */}
      <div className="px-5 pb-5 flex flex-wrap gap-2">
        {localStatus !== "sent" && localStatus !== "approved" ? (
          <>
            {editing ? (
              <>
                <Button size="sm" variant="primary" onClick={handleSend}>Send</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(false)}>Cancel</Button>
              </>
            ) : (
              <>
                <Button size="sm" variant="primary" onClick={handleApprove}>✓ Approve</Button>
                <Button size="sm" variant="secondary" onClick={() => setEditing(true)}>✎ Edit</Button>
                <Button size="sm" variant="secondary" onClick={handleSend}>⤴ Send</Button>
                <Button size="sm" variant="danger" onClick={handleEscalate}>⚑ Escalate</Button>
              </>
            )}
          </>
        ) : (
          <p className="text-xs text-text-muted">
            {localStatus === "sent" ? "✓ Reply sent" : "✓ Approved — waiting to send"}
          </p>
        )}
      </div>
    </div>
  );
}
