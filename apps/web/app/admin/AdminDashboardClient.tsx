'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { 
  Users, 
  MapPin, 
  Store, 
  Briefcase, 
  Tag, 
  ShieldAlert, 
  CheckCircle2, 
  Clock, 
  RefreshCw,
  AlertCircle,
  ArrowRight,
  History,
  FileCheck2,
  FileX2,
  FileClock
} from 'lucide-react';
import { Container, PageHeader, Card, Button, Badge } from '@/components/ui';
import { fetchAdminStats } from '@/lib/api/admin';
import { AdminStatsResponse, UserPublicProfile } from 'shared-types';

interface AdminDashboardClientProps {
  adminUser: UserPublicProfile;
}

export default function AdminDashboardClient({ adminUser }: AdminDashboardClientProps) {
  const [stats, setStats] = useState<AdminStatsResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadStats = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetchAdminStats();
      if (res.success && res.data) {
        setStats(res.data);
      } else {
        setError(res.message || 'Failed to retrieve administrative metrics.');
      }
    } catch {
      setError('Network communication failure. Please check your connection and retry.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  return (
    <main id="main-content" className="pb-20 md:pb-12 bg-pitstop-bg min-h-[calc(100vh-64px)]">
      <PageHeader
        title="Platform Administration Console"
        description={`Logged in as ${adminUser.name}. Supervise rest stops, verify merchant registrations, and moderate community activity with live database metrics.`}
        badge="Live System Metrics"
        action={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="md"
              onClick={loadStats}
              isLoading={isLoading}
              leftIcon={<RefreshCw className="h-4 w-4" />}
            >
              Refresh Metrics
            </Button>
            <Link href="/admin/rest-stops?status=pending_approval">
              <Button variant="primary" size="md" leftIcon={<MapPin className="h-4 w-4" />}>
                Review Rest Stops
              </Button>
            </Link>
          </div>
        }
      />

      <section className="py-6 sm:py-8" aria-label="Administrative metrics overview">
        <Container size="xl">
          {/* Error Banner with Retry */}
          {error && (
            <div 
              role="alert" 
              className="mb-8 rounded-xl border border-red-200 bg-red-50 p-5 shadow-subtle flex items-start justify-between gap-4"
            >
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-bold text-red-800">Operational Metrics Unavailable</h3>
                  <p className="text-sm text-red-700 mt-0.5">{error}</p>
                </div>
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadStats} 
                className="shrink-0 bg-white hover:bg-red-100"
              >
                Retry
              </Button>
            </div>
          )}

          {/* Quick Action Pending Moderation Alerts */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
              <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                stats.users.pendingMerchants > 0 
                  ? 'bg-amber-50/80 border-amber-300' 
                  : 'bg-white border-pitstop-border'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    stats.users.pendingMerchants > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <Store className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pitstop-charcoal text-sm">
                      Merchant Verifications
                    </h3>
                    <p className="text-xs text-pitstop-secondary">
                      {stats.users.pendingMerchants > 0 
                        ? `${stats.users.pendingMerchants} partner(s) awaiting trade credential review` 
                        : 'No pending merchant verifications'}
                    </p>
                  </div>
                </div>
                <Link href="/admin/merchants?status=pending_review">
                  <Button variant={stats.users.pendingMerchants > 0 ? 'primary' : 'outline'} size="sm">
                    Review {stats.users.pendingMerchants > 0 ? `(${stats.users.pendingMerchants})` : ''}
                  </Button>
                </Link>
              </div>

              <div className={`p-4 rounded-xl border flex items-center justify-between gap-4 transition-colors ${
                stats.restStops.pendingApproval > 0 
                  ? 'bg-amber-50/80 border-amber-300' 
                  : 'bg-white border-pitstop-border'
              }`}>
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                    stats.restStops.pendingApproval > 0 ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'
                  }`}>
                    <MapPin className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-pitstop-charcoal text-sm">
                      Rest Stop Approvals
                    </h3>
                    <p className="text-xs text-pitstop-secondary">
                      {stats.restStops.pendingApproval > 0 
                        ? `${stats.restStops.pendingApproval} physical venue(s) awaiting safety inspection` 
                        : 'All rest stops reviewed'}
                    </p>
                  </div>
                </div>
                <Link href="/admin/rest-stops?status=pending_approval">
                  <Button variant={stats.restStops.pendingApproval > 0 ? 'primary' : 'outline'} size="sm">
                    Inspect {stats.restStops.pendingApproval > 0 ? `(${stats.restStops.pendingApproval})` : ''}
                  </Button>
                </Link>
              </div>
            </div>
          )}

          {/* Metric KPI Cards Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
            {/* Users Card */}
            <Card className="p-5 shadow-card border-pitstop-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-pitstop-secondary uppercase tracking-wider">
                  Platform Users
                </span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-pitstop-charcoal mb-2">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  stats?.users.total ?? 0
                )}
              </div>
              <div className="space-y-1 text-xs text-pitstop-secondary border-t border-pitstop-border/60 pt-2.5">
                <div className="flex justify-between">
                  <span>Delivery Riders:</span>
                  <span className="font-semibold text-pitstop-charcoal">{stats?.users.riders ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Merchant Partners:</span>
                  <span className="font-semibold text-pitstop-charcoal">{stats?.users.merchants ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>System Admins:</span>
                  <span className="font-semibold text-pitstop-charcoal">{stats?.users.admins ?? 0}</span>
                </div>
              </div>
            </Card>

            {/* Rest Stops Card */}
            <Card className="p-5 shadow-card border-pitstop-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-pitstop-secondary uppercase tracking-wider">
                  Rest Stops
                </span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <MapPin className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-pitstop-charcoal mb-2">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  stats?.restStops.total ?? 0
                )}
              </div>
              <div className="space-y-1 text-xs text-pitstop-secondary border-t border-pitstop-border/60 pt-2.5">
                <div className="flex justify-between">
                  <span className="text-emerald-700 font-medium">Active & Public:</span>
                  <span className="font-semibold text-emerald-700">{stats?.restStops.active ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-amber-700 font-medium">Pending Review:</span>
                  <span className="font-semibold text-amber-700">{stats?.restStops.pendingApproval ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-red-700 font-medium">Suspended:</span>
                  <span className="font-semibold text-red-700">{stats?.restStops.suspended ?? 0}</span>
                </div>
              </div>
            </Card>

            {/* Micro-Jobs Card */}
            <Card className="p-5 shadow-card border-pitstop-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-pitstop-secondary uppercase tracking-wider">
                  Micro-Jobs
                </span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Briefcase className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-pitstop-charcoal mb-2">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  stats?.jobs.total ?? 0
                )}
              </div>
              <div className="space-y-1 text-xs text-pitstop-secondary border-t border-pitstop-border/60 pt-2.5">
                <div className="flex justify-between">
                  <span>Open & Active:</span>
                  <span className="font-semibold text-pitstop-charcoal">{stats?.jobs.open ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>In Progress:</span>
                  <span className="font-semibold text-pitstop-charcoal">{stats?.jobs.inProgress ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Completed:</span>
                  <span className="font-semibold text-emerald-600">{stats?.jobs.completed ?? 0}</span>
                </div>
              </div>
            </Card>

            {/* Community Deals Card */}
            <Card className="p-5 shadow-card border-pitstop-border">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-pitstop-secondary uppercase tracking-wider">
                  Merchant Deals
                </span>
                <div className="w-8 h-8 rounded-lg bg-pitstop-yellow/20 text-pitstop-charcoal flex items-center justify-center">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <div className="text-2xl font-bold text-pitstop-charcoal mb-2">
                {isLoading ? (
                  <div className="h-8 w-16 bg-gray-200 animate-pulse rounded" />
                ) : (
                  stats?.deals.total ?? 0
                )}
              </div>
              <div className="space-y-1 text-xs text-pitstop-secondary border-t border-pitstop-border/60 pt-2.5">
                <div className="flex justify-between">
                  <span>Active Listings:</span>
                  <span className="font-semibold text-emerald-600">{stats?.deals.active ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Paused / Expired:</span>
                  <span className="font-semibold text-pitstop-charcoal">{stats?.deals.inactive ?? 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Applications Total:</span>
                  <span className="font-semibold text-pitstop-charcoal">{stats?.applications.total ?? 0}</span>
                </div>
              </div>
            </Card>
          </div>

          {/* Applications Breakdown & Recent Moderation Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Job Application Status Breakdown */}
            <Card className="p-5 shadow-card border-pitstop-border">
              <h2 className="text-base font-bold text-pitstop-charcoal mb-4 flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-pitstop-yellow" />
                Rider Applications Health
              </h2>
              {isLoading ? (
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded" />
                  <div className="h-4 bg-gray-200 animate-pulse rounded" />
                </div>
              ) : (
                <div className="space-y-3 text-sm">
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-pitstop-border/60">
                    <span className="flex items-center gap-2 text-pitstop-charcoal">
                      <Clock className="w-4 h-4 text-amber-500" /> Pending Review
                    </span>
                    <Badge variant="warning">{stats?.applications.pending ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-pitstop-border/60">
                    <span className="flex items-center gap-2 text-pitstop-charcoal">
                      <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Accepted & Hired
                    </span>
                    <Badge variant="success">{stats?.applications.accepted ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-pitstop-border/60">
                    <span className="flex items-center gap-2 text-pitstop-charcoal">
                      <FileX2 className="w-4 h-4 text-red-500" /> Rejected
                    </span>
                    <Badge variant="danger">{stats?.applications.rejected ?? 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between p-2.5 rounded-lg bg-gray-50 border border-pitstop-border/60">
                    <span className="flex items-center gap-2 text-pitstop-secondary">
                      <FileClock className="w-4 h-4 text-gray-400" /> Withdrawn by Rider
                    </span>
                    <Badge variant="neutral">{stats?.applications.withdrawn ?? 0}</Badge>
                  </div>
                </div>
              )}
            </Card>

            {/* Moderation Audit Log Activity Table */}
            <Card className="p-5 shadow-card border-pitstop-border lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-base font-bold text-pitstop-charcoal flex items-center gap-2">
                  <History className="w-4 h-4 text-pitstop-yellow" />
                  Recent Moderation Activity
                </h2>
                <span className="text-xs text-pitstop-secondary">
                  Persistent Audit Trail
                </span>
              </div>

              {isLoading ? (
                <div className="space-y-2.5">
                  <div className="h-10 bg-gray-100 animate-pulse rounded" />
                  <div className="h-10 bg-gray-100 animate-pulse rounded" />
                  <div className="h-10 bg-gray-100 animate-pulse rounded" />
                </div>
              ) : !stats?.recentActivity || stats.recentActivity.length === 0 ? (
                <div className="py-8 text-center text-sm text-pitstop-secondary">
                  <p>No administrative moderation events recorded yet.</p>
                  <p className="text-xs text-gray-400 mt-1">Actions taken on merchants, rest stops, jobs, and deals will appear here in real time.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-pitstop-charcoal">
                    <thead>
                      <tr className="border-b border-pitstop-border text-pitstop-secondary font-semibold">
                        <th className="pb-2">Time</th>
                        <th className="pb-2">Admin</th>
                        <th className="pb-2">Target</th>
                        <th className="pb-2">Action / Status</th>
                        <th className="pb-2">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-pitstop-border/60">
                      {stats.recentActivity.map((log) => (
                        <tr key={log.id} className="hover:bg-gray-50/60">
                          <td className="py-2.5 pr-2 text-gray-500 whitespace-nowrap">
                            {new Date(log.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </td>
                          <td className="py-2.5 pr-2 font-medium whitespace-nowrap">
                            {log.adminName || 'Admin'}
                          </td>
                          <td className="py-2.5 pr-2 whitespace-nowrap">
                            <span className="uppercase text-[10px] font-bold px-1.5 py-0.5 rounded bg-gray-100 text-gray-700 mr-1.5">
                              {log.targetType.replace('_', ' ')}
                            </span>
                            <span className="truncate max-w-[120px] inline-block align-bottom font-medium">
                              {log.targetName || log.targetId}
                            </span>
                          </td>
                          <td className="py-2.5 pr-2 whitespace-nowrap">
                            <span className="font-semibold text-emerald-700">
                              {log.newStatus || log.action}
                            </span>
                            {log.prevStatus && (
                              <span className="text-[10px] text-gray-400 ml-1">
                                (was {log.prevStatus})
                              </span>
                            )}
                          </td>
                          <td className="py-2.5 text-gray-500 truncate max-w-[150px]" title={log.reason}>
                            {log.reason || '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </Card>
          </div>
        </Container>
      </section>
    </main>
  );
}
