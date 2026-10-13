import { Types } from 'mongoose';
import { AuditLog } from '../models/AuditLog';
import { isDatabaseConnected } from '../config/database';
import { mockAuditLogStore, MockAuditLogItem } from '../controllers/auditLogMockStore';

export interface RecordAuditLogParams {
  adminId: string;
  adminName?: string;
  action: string;
  targetType: 'merchant' | 'rest_stop' | 'job' | 'deal';
  targetId: string;
  targetName?: string;
  prevStatus?: string;
  newStatus?: string;
  reason?: string;
}

/**
 * Creates a persistent audit log entry for admin actions.
 * Automatically handles connected MongoDB or offline mock store fallback.
 */
export async function recordAuditLog(params: RecordAuditLogParams): Promise<void> {
  const {
    adminId,
    adminName = 'Admin',
    action,
    targetType,
    targetId,
    targetName,
    prevStatus,
    newStatus,
    reason,
  } = params;

  if (isDatabaseConnected()) {
    await AuditLog.create({
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      targetName,
      prevStatus,
      newStatus,
      reason,
    });
  } else {
    const mockId = `audit-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const now = new Date();
    const item: MockAuditLogItem = {
      _id: mockId,
      id: mockId,
      adminId,
      adminName,
      action,
      targetType,
      targetId,
      targetName,
      prevStatus,
      newStatus,
      reason,
      createdAt: now,
      updatedAt: now,
    };
    mockAuditLogStore.set(mockId, item);
  }
}
