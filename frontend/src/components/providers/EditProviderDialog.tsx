'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, Save, Settings2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Provider, ProviderType, ProviderUpdateRequest } from '@/types/provider.types';
import { updateProvider, testConnection } from '@/services/provider.service';

interface EditProviderDialogProps {
  isOpen: boolean;
  provider: Provider | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditProviderDialog: React.FC<EditProviderDialogProps> = ({ 
  isOpen, 
  provider, 
  onClose, 
  onSuccess 
}) => {
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  
  const [formData, setFormData] = useState<ProviderUpdateRequest>({});

  useEffect(() => {
    if (provider && isOpen) {
      setFormData({
        name: provider.name || '',
        provider_name: provider.provider_name || '',
        provider_type: provider.provider_type,
        endpoint_url: provider.endpoint_url || '',
        bucket_name: provider.bucket_name || '',
        region: provider.region || '',
        // We do not pre-fill access_key and secret_key for security reasons.
        // User must re-enter them if they want to update them, or leave blank to keep existing.
        access_key: '',
        secret_key: '',
      });
      setError('');
      setSuccessMsg('');
    }
  }, [provider, isOpen]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError('');
    setSuccessMsg('');
  };

  const handleTestConnection = async () => {
    if (!provider) return;
    try {
      setTesting(true);
      setError('');
      setSuccessMsg('');
      
      const res = await testConnection({
        name: formData.name || provider.name,
        provider_type: formData.provider_type || provider.provider_type,
        endpoint_url: formData.endpoint_url || provider.endpoint_url,
        bucket_name: formData.bucket_name || provider.bucket_name,
        region: (formData.region || provider.region) as string,
        access_key: formData.access_key || provider.access_key,
        secret_key: formData.secret_key || provider.secret_key,
      });

      if (res.success) {
        setSuccessMsg('Connection successful!');
      } else {
        setError(res.message || 'Connection test failed.');
      }
    } catch (err: any) {
      setError(err?.message || 'Failed to test connection.');
    } finally {
      setTesting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!provider) return;
    
    // Clean up empty security fields so backend doesn't overwrite with blanks
    const updatePayload = { ...formData };
    if (!updatePayload.access_key) delete updatePayload.access_key;
    if (!updatePayload.secret_key) delete updatePayload.secret_key;

    try {
      setLoading(true);
      setError('');
      await updateProvider(provider.id, updatePayload);
      onSuccess();
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to update provider.');
    } finally {
      setLoading(false);
    }
  };

  if (!provider) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/50 z-40 backdrop-blur-sm" onClick={onClose} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="pointer-events-auto w-full max-w-2xl bg-card border border-border shadow-2xl rounded-xl flex flex-col max-h-[90vh]"
            >
              <div className="flex items-center justify-between p-6 border-b border-border">
                <div>
                  <h2 className="text-xl font-bold flex items-center gap-2">
                    <Settings2 className="w-5 h-5 text-primary" />
                    Edit Storage Provider
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Update connection credentials or display settings.</p>
                </div>
                <Button variant="ghost" size="sm" onClick={onClose} className="rounded-full w-8 h-8 p-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <div className="p-6 overflow-y-auto">
                <form id="edit-provider-form" onSubmit={handleSubmit} className="space-y-4">
                  {error && (
                    <div className="p-3 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400 rounded-lg text-sm flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 shrink-0" />
                      {error}
                    </div>
                  )}

                  {successMsg && (
                    <div className="p-3 bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400 rounded-lg text-sm">
                      {successMsg}
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Internal Name *</label>
                      <Input name="name" value={formData.name} onChange={handleChange} required />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Display Name</label>
                      <Input name="provider_name" value={formData.provider_name} onChange={handleChange} />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Provider Type *</label>
                      <select
                        name="provider_type"
                        value={formData.provider_type}
                        onChange={handleChange}
                        className="w-full flex h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value={ProviderType.AWS}>Amazon Web Services (S3)</option>
                        <option value={ProviderType.CLOUDFLARE}>Cloudflare R2</option>
                        <option value={ProviderType.ORACLE}>Oracle Cloud Storage</option>
                        <option value={ProviderType.OTHERS}>Generic S3 / Others</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Bucket Name *</label>
                      <Input name="bucket_name" value={formData.bucket_name} onChange={handleChange} required />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1 flex justify-between">
                        Access Key 
                        <span className="text-xs text-muted-foreground font-normal">(Leave blank to keep current)</span>
                      </label>
                      <Input name="access_key" value={formData.access_key} onChange={handleChange} type="password" placeholder="••••••••" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1 flex justify-between">
                        Secret Key
                        <span className="text-xs text-muted-foreground font-normal">(Leave blank to keep current)</span>
                      </label>
                      <Input name="secret_key" value={formData.secret_key} onChange={handleChange} type="password" placeholder="••••••••" />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Region</label>
                      <Input name="region" value={formData.region} onChange={handleChange} />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1">Endpoint URL</label>
                      <Input name="endpoint_url" value={formData.endpoint_url} onChange={handleChange} />
                    </div>
                  </div>
                </form>
              </div>

              <div className="p-6 border-t border-border bg-muted/20 flex items-center justify-between mt-auto">
                <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing || loading}>
                  {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Test Connection
                </Button>
                <div className="flex space-x-3">
                  <Button type="button" variant="ghost" onClick={onClose} disabled={loading}>
                    Cancel
                  </Button>
                  <Button type="submit" form="edit-provider-form" disabled={loading || testing}>
                    {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
                    Save Changes
                  </Button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
