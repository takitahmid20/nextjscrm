/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Paperclip, Upload, Download, Trash2, FileText, Loader2 } from 'lucide-react';
import { Attachment, AttachmentEntityType } from '../types';
import { attachmentsApi } from '../lib/api/attachments';
import { ApiError } from '../lib/api/http';
import { useToast } from '../context/ToastContext';
import { useConfirm } from '../context/ConfirmContext';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB — matches attachmentUploadSchema server-side.

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

interface AttachmentsPanelProps {
  entityType: AttachmentEntityType;
  entityId: string;
}

/**
 * Mock file attachments — files are stored as data URIs inside the mock
 * data layer (src/lib/mock-db.ts), not real object storage. Good enough to
 * demonstrate the UX; a backend should swap in real upload storage (S3, GCS)
 * behind the same /api/attachments contract.
 */
export default function AttachmentsPanel({ entityType, entityId }: AttachmentsPanelProps) {
  const { showToast } = useToast();
  const confirm = useConfirm();
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    attachmentsApi
      .list(entityType, entityId)
      .then((items) => { if (!cancelled) setAttachments(items); })
      .catch(() => { if (!cancelled) showToast('Could not load attachments.', 'error'); })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [entityType, entityId]);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;

    if (file.size > MAX_FILE_SIZE) {
      showToast(`"${file.name}" is too large — files must be 5MB or smaller.`, 'error');
      return;
    }

    setUploading(true);
    try {
      const dataUrl = await readFileAsDataUrl(file);
      const attachment = await attachmentsApi.upload({
        entityType,
        entityId,
        fileName: file.name,
        fileSize: file.size,
        mimeType: file.type || 'application/octet-stream',
        dataUrl,
      });
      setAttachments((prev) => [attachment, ...prev]);
      showToast(`"${file.name}" uploaded.`, 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Upload failed.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (attachment: Attachment) => {
    if (!(await confirm({ description: `Delete "${attachment.fileName}"?`, destructive: true, confirmLabel: 'Delete' }))) return;
    try {
      await attachmentsApi.remove(attachment.id);
      setAttachments((prev) => prev.filter((a) => a.id !== attachment.id));
      showToast('Attachment removed.', 'success');
    } catch (error) {
      showToast(error instanceof ApiError ? error.message : 'Could not remove attachment.', 'error');
    }
  };

  return (
    <div className="bg-card border border-border rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          <Paperclip className="h-4 w-4 text-muted-foreground" />
          Attachments {attachments.length > 0 && <span className="text-muted-foreground font-normal">({attachments.length})</span>}
        </div>
        <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileSelect} aria-label="Choose file to attach" />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="h-8 px-3 text-xs font-semibold rounded-md border border-border bg-background hover:bg-muted text-foreground flex items-center gap-1.5 disabled:opacity-60"
        >
          {uploading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
          Upload
        </button>
      </div>

      {loading ? (
        <p className="text-xs text-muted-foreground">Loading attachments…</p>
      ) : attachments.length === 0 ? (
        <p className="text-xs text-muted-foreground">No files attached yet.</p>
      ) : (
        <ul className="space-y-1.5">
          {attachments.map((attachment) => (
            <li key={attachment.id} className="flex items-center justify-between gap-2 text-xs bg-muted/50 border border-border rounded-md px-2.5 py-2">
              <div className="flex items-center gap-2 min-w-0">
                <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="min-w-0">
                  <p className="font-medium text-foreground truncate" title={attachment.fileName}>{attachment.fileName}</p>
                  <p className="text-[10px] text-muted-foreground">{formatFileSize(attachment.fileSize)} · {attachment.uploadedBy}</p>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <a
                  href={attachment.dataUrl}
                  download={attachment.fileName}
                  aria-label={`Download ${attachment.fileName}`}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-primary/10 text-muted-foreground hover:text-primary"
                >
                  <Download className="h-3.5 w-3.5" />
                </a>
                <button
                  type="button"
                  onClick={() => handleDelete(attachment)}
                  aria-label={`Delete ${attachment.fileName}`}
                  className="h-7 w-7 flex items-center justify-center rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
