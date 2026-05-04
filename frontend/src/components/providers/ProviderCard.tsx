'use client';

import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Provider, ProviderUsage } from '@/types/provider.types';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Switch } from '@/components/ui/Switch';
import { ConfirmDialog } from '@/components/ui/ConfirmDialog';
import { EditProviderDialog } from './EditProviderDialog';
import { activateProvider, deactivateProvider, deleteProvider } from '@/services/provider.service';
import { useToast } from '@/components/base/Toast';
import { Database, Server, Loader2, Trash2, Edit2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ProviderCardProps {
  provider: Provider;
  onRefresh: () => void;
}

export const ProviderCard: React.FC<ProviderCardProps> = ({ provider, onRefresh }) => {
  const [isToggling, setIsToggling] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const { addToast } = useToast();
  
  const usage = provider.usage;

  const handleToggle = async (checked: boolean) => {
    try {
      setIsToggling(true);
      if (checked) {
        await activateProvider(provider.id);
        addToast({ type: 'success', title: 'Provider Activated', message: `${provider.provider_name || provider.name} is now active.` });
      } else {
        await deactivateProvider(provider.id);
        addToast({ type: 'info', title: 'Provider Deactivated', message: `${provider.provider_name || provider.name} has been disabled.` });
      }
      onRefresh();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Toggle Failed', message: error.message || 'Could not change provider status.' });
    } finally {
      setIsToggling(false);
    }
  };

  const handleDelete = async () => {
    try {
      setIsDeleting(true);
      await deleteProvider(provider.id);
      addToast({ type: 'success', title: 'Provider Removed', message: 'The integration has been successfully deleted.' });
      onRefresh();
    } catch (error: any) {
      addToast({ type: 'error', title: 'Deletion Failed', message: error.message || 'Could not remove provider.' });
    } finally {
      setIsDeleting(false);
      setDeleteOpen(false);
    }
  };

  const limit = provider.storage_limit_gb || usage?.storage_limit_gb || 0;
  const hasLimit = limit > 0;

  return (
    <>
      <Card className={cn(
        "p-6 border-l-4 flex flex-col h-full relative transition-all duration-200",
        provider.is_active ? "border-l-primary shadow-md hover:shadow-lg" : "border-l-muted opacity-80 cursor-default"
      )}>
        <div className="flex justify-between items-start mb-4 gap-4">
          <div className="flex items-center space-x-4 min-w-0">
            <div className={cn(
              "p-3 rounded-xl transition-colors",
              provider.is_active ? "bg-primary/10" : "bg-muted text-muted-foreground"
            )}>
              {provider.provider_type?.toLowerCase().includes('s3') ? (
                <Database className={cn("w-6 h-6", provider.is_active ? "text-primary" : "text-muted-foreground")} />
              ) : (
                <Server className={cn("w-6 h-6", provider.is_active ? "text-primary" : "text-muted-foreground")} />
              )}
            </div>
            <div className="min-w-0">
              <h3 className="font-bold text-lg leading-tight truncate" title={provider.provider_name || provider.name}>
                {provider.provider_name || provider.name}
              </h3>
              <div className="text-xs text-muted-foreground mt-1 truncate">
                {provider.name}
              </div>
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                {provider.is_active ? 'Active' : 'Disabled'}
              </span>
              {isToggling ? (
                <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
              ) : (
                <Switch 
                  checked={provider.is_active} 
                  onCheckedChange={handleToggle}
                  aria-label="Toggle active status"
                />
              )}
            </div>
          </div>
        </div>

        <div className="space-y-3 flex-1 px-1 mt-2">
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground font-medium w-24">Type:</span>
            <span className="font-semibold text-foreground bg-accent/50 px-2 py-0.5 rounded text-xs">{provider.provider_type}</span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground font-medium w-24">Bucket:</span>
            <span className="text-foreground truncate py-0.5" title={provider.bucket_name}>
              {provider.bucket_name}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground font-medium w-24">Storage Limit:</span>
            <span className="text-foreground font-medium py-0.5">
              {hasLimit ? `${limit} GB` : 'Unlimited'}
            </span>
          </div>
          <div className="flex items-center text-sm">
            <span className="text-muted-foreground font-medium w-24">Added:</span>
            <span className="text-foreground">
              {new Date(provider.created_at).toLocaleDateString(undefined, {
                year: 'numeric',
                month: 'short',
                day: 'numeric'
              })}
            </span>
          </div>
        </div>

        {/* Capacity Bar Visualization */}
        {provider.is_active && (
          <div className="mt-4 mb-2 px-1">
            <div className="flex justify-between items-end mb-1.5">
              <span className="text-xs font-medium text-muted-foreground">Capacity Usage</span>
              <span className="text-xs font-semibold">
                {usage ? (
                  hasLimit 
                    ? `${usage.total_size_gb} / ${limit} GB (${usage.usage_percentage}%)`
                    : `${usage.total_size_gb} GB Used`
                ) : 'Unavailable'}
              </span>
            </div>
            <div className="relative h-2 w-full bg-muted/60 rounded-full overflow-hidden">
              {usage && hasLimit && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(usage.usage_percentage || 0, 100)}%` }}
                  transition={{ duration: 1, ease: "easeOut" }}
                  className={cn(
                    "absolute top-0 left-0 h-full rounded-full shrink-0",
                    (usage.usage_percentage || 0) > 90 ? "bg-red-500" :
                    (usage.usage_percentage || 0) > 75 ? "bg-yellow-500" : "bg-primary"
                  )}
                />
              )}
              {usage && !hasLimit && (
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: usage.total_size_bytes > 0 ? "100%" : "0%" }}
                  className="absolute top-0 left-0 h-full rounded-full bg-primary/40 shrink-0"
                />
              )}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-border flex justify-end space-x-2">
          <Button variant="outline" size="sm" onClick={() => setEditOpen(true)} className="gap-1.5 px-3">
            <Edit2 className="w-3.5 h-3.5" />
            Edit
          </Button>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => setDeleteOpen(true)} 
            className="text-red-500 hover:text-red-600 hover:bg-red-50 shadow-none border-red-200 gap-1.5 px-3"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Remove
          </Button>
        </div>
      </Card>

      <EditProviderDialog 
        isOpen={editOpen}
        onClose={() => setEditOpen(false)}
        provider={provider}
        onSuccess={onRefresh}
      />

      <ConfirmDialog
        isOpen={deleteOpen}
        title="Remove Provider"
        message={`Are you absolutely sure you want to completely disconnect '${provider.provider_name || provider.name}'? This backend integration will be deleted permanently.`}
        confirmText="Disconnect"
        cancelText="Cancel"
        isLoading={isDeleting}
        onConfirm={handleDelete}
        onCancel={() => setDeleteOpen(false)}
      />
    </>
  );
};
