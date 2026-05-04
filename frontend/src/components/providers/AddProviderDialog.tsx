'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  X, Loader2, Cloud, ShieldAlert, Check,
  ArrowRight, ArrowLeft, ShieldCheck, Server,
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { ProviderType, CreateProviderRequest } from '@/types/provider.types';
import { useProviderMutations } from '@/hooks/useProviderMutations';

interface AddProviderDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const providerOptions = [
  { type: ProviderType.AWS, name: 'AWS S3', icon: '☁️', description: 'Amazon Web Services S3' },
  { type: ProviderType.CLOUDFLARE, name: 'Cloudflare R2', icon: '🔶', description: 'Cloudflare R2 Storage' },
  { type: ProviderType.ORACLE, name: 'Oracle Cloud', icon: '🔴', description: 'Oracle Cloud Storage' },
  { type: ProviderType.OTHERS, name: 'Backblaze B2', icon: '🔥', description: 'Backblaze B2 Cloud' },
  { type: ProviderType.OTHERS, name: 'Wasabi', icon: '🟢', description: 'Wasabi Hot Storage' },
  { type: ProviderType.OTHERS, name: 'MinIO', icon: '🔵', description: 'Self-hosted MinIO' },
  { type: ProviderType.OTHERS, name: 'Azure Blob', icon: '🔷', description: 'Azure Blob Storage' },
  { type: ProviderType.OTHERS, name: 'Other S3', icon: '⚙️', description: 'Any S3-Compatible' },
];

export const AddProviderDialog: React.FC<AddProviderDialogProps> = ({ isOpen, onClose, onSuccess }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [error, setError] = useState<string>('');
  const [successMsg, setSuccessMsg] = useState<string>('');
  const [selectedProvider, setSelectedProvider] = useState<typeof providerOptions[0] | null>(null);
  const [useIAMRole, setUseIAMRole] = useState(false);

  // Use the provider mutations hook
  const { createProvider, testConnection } = useProviderMutations();

  const [formData, setFormData] = useState<CreateProviderRequest>({
    name: '',
    provider_name: '',
    provider_type: ProviderType.AWS,
    endpoint_url: '',
    access_key: '',
    secret_key: '',
    bucket_name: '',
    region: 'us-east-1',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: name === 'storage_limit_gb' ? (value === '' ? undefined : Number(value)) : value,
    }));
    setError('');
    setSuccessMsg('');
  };

  const handleSelectProvider = (provider: typeof providerOptions[0]) => {
    setSelectedProvider(provider);
    setFormData(prev => ({
      ...prev,
      provider_type: provider.type,
      provider_name: provider.name,
    }));
  };

  const handleNext = () => {
    if (step === 1) {
      if (!selectedProvider) {
        setError('Please select a provider');
        return;
      }
      setError('');
      setStep(2);
    } else if (step === 2) {
      if (!formData.name || !formData.access_key || !formData.secret_key || !formData.bucket_name) {
        setError('Please fill out all required fields.');
        return;
      }
      setError('');
      setStep(3);
    }
  };

  const handleBack = () => {
    setError('');
    setSuccessMsg('');
    setStep(prev => Math.max(1, prev - 1));
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setError('');
      setSuccessMsg('');
      const res = await testConnection(formData);
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

  const handleSubmit = async () => {
    try {
      setLoading(true);
      setError('');
      await createProvider({
        ...formData,
        provider_name: formData.provider_name || formData.name,
      });
      // Cache will be automatically invalidated by the mutation hook
      onSuccess();
      handleClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to create provider.');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep(1);
    setSelectedProvider(null);
    setError('');
    setSuccessMsg('');
    setFormData({
      name: '', provider_name: '', provider_type: ProviderType.AWS,
      endpoint_url: '', access_key: '', secret_key: '',
      bucket_name: '', region: 'us-east-1',
    });
    onClose();
  };

  const stepLabels = ['Provider', 'Configure', 'Review'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 z-40 backdrop-blur-sm"
            onClick={handleClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="pointer-events-auto w-full max-w-2xl bg-white border border-border shadow-2xl rounded-2xl flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 pt-6 pb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Cloud className="w-4 h-4 text-primary" />
                    </div>
                    <h2 className="text-lg font-bold text-foreground">
                      {step === 1 ? 'Add Storage Account' : step === 2 ? `Configure ${selectedProvider?.name || ''}` : 'Review & Connect'}
                    </h2>
                  </div>
                  <p className="text-sm text-muted-foreground ml-10">
                    {step === 1 ? 'Connect your cloud storage to start managing your files.' :
                     step === 2 ? `Enter your ${selectedProvider?.name} credentials to connect your account.` :
                     'Please review your details before connecting.'}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={handleClose} className="rounded-full w-8 h-8 p-0">
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Step indicator */}
              <div className="px-6 pb-4">
                <div className="flex items-center justify-center gap-1">
                  {stepLabels.map((label, i) => {
                    const stepNum = i + 1;
                    const isActive = stepNum === step;
                    const isComplete = stepNum < step;
                    return (
                      <React.Fragment key={label}>
                        <div className="flex flex-col items-center gap-1">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${
                            isComplete ? 'bg-primary text-white' :
                            isActive ? 'bg-primary text-white' :
                            'bg-secondary text-muted-foreground'
                          }`}>
                            {isComplete ? <Check className="w-4 h-4" /> : stepNum}
                          </div>
                          <span className={`text-xs ${isActive || isComplete ? 'text-primary font-medium' : 'text-muted-foreground'}`}>
                            {label}
                          </span>
                        </div>
                        {i < stepLabels.length - 1 && (
                          <div className={`w-16 h-0.5 rounded mb-5 ${stepNum < step ? 'bg-primary' : 'bg-border'}`} />
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              </div>

              {/* Content */}
              <div className="px-6 pb-4 overflow-y-auto flex-1">
                {error && (
                  <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm flex items-center gap-2 border border-red-100">
                    <ShieldAlert className="w-4 h-4 shrink-0" />
                    {error}
                  </div>
                )}
                {successMsg && (
                  <div className="mb-4 p-3 bg-emerald-50 text-emerald-700 rounded-lg text-sm flex items-center gap-2 border border-emerald-100">
                    <ShieldCheck className="w-4 h-4 shrink-0" />
                    {successMsg}
                  </div>
                )}

                {/* Step 1: Provider Selection */}
                {step === 1 && (
                  <div>
                    <p className="text-sm font-medium text-foreground mb-3">Select Provider</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {providerOptions.map((p, idx) => {
                        const isSelected = selectedProvider?.name === p.name;
                        return (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => handleSelectProvider(p)}
                            className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all text-center hover:shadow-card ${
                              isSelected ? 'border-primary bg-primary/5 shadow-card' : 'border-border hover:border-primary/30'
                            }`}
                          >
                            <div className="text-2xl">{p.icon}</div>
                            <span className="text-xs font-medium text-foreground">{p.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Step 2: Configuration Form */}
                {step === 2 && (
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Account Name *</label>
                      <Input name="name" value={formData.name} onChange={handleChange} placeholder="Personal AWS" required />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">AWS Access Key ID *</label>
                        <Input name="access_key" value={formData.access_key} onChange={handleChange} type="password" placeholder="AKIAIOSFODNN7EXAMPLE" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">AWS Secret Access Key *</label>
                        <Input name="secret_key" value={formData.secret_key} onChange={handleChange} type="password" placeholder="••••••••••••••••••••" required />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Region (Optional)</label>
                        <Input name="region" value={formData.region} onChange={handleChange} placeholder="us-east-1" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-foreground mb-1.5">Default Bucket (Optional)</label>
                        <Input name="bucket_name" value={formData.bucket_name} onChange={handleChange} placeholder="my-bucket" />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Endpoint URL (Optional)</label>
                      <Input name="endpoint_url" value={formData.endpoint_url} onChange={handleChange} placeholder="https://s3.amazonaws.com" />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-foreground mb-1.5">Storage Limit (GB, Optional)</label>
                      <Input type="number" min="1" step="1" name="storage_limit_gb" value={formData.storage_limit_gb || ''} onChange={handleChange} placeholder="Leave empty for unlimited storage" />
                    </div>

                    {/* IAM Role toggle */}
                    <div className="flex items-center gap-3 pt-2">
                      <button
                        type="button"
                        onClick={() => setUseIAMRole(!useIAMRole)}
                        className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${useIAMRole ? 'bg-primary' : 'bg-border'}`}
                      >
                        <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform ${useIAMRole ? 'translate-x-4' : 'translate-x-0.5'}`} />
                      </button>
                      <span className="text-sm text-muted-foreground">Use IAM Role (Advanced)</span>
                    </div>
                  </div>
                )}

                {/* Step 3: Review */}
                {step === 3 && (
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-xl p-5 space-y-3 border border-border">
                      {[
                        { label: 'Provider', value: selectedProvider?.name || '' },
                        { label: 'Account Name', value: formData.name },
                        { label: 'Region', value: formData.region || 'Default' },
                        { label: 'Default Bucket', value: formData.bucket_name || 'None' },
                        { label: 'Access Key ID', value: formData.access_key ? formData.access_key.slice(0, 8) + '••••••••' : 'Not set' },
                        { label: 'Encryption', value: 'AES-256 (SSE-S3)' },
                      ].map(row => (
                        <div key={row.label} className="flex items-center justify-between py-1">
                          <span className="text-sm text-muted-foreground">{row.label}</span>
                          <span className="text-sm font-medium text-foreground">{row.value}</span>
                        </div>
                      ))}
                    </div>

                    {/* Security notice */}
                    <div className="p-3 bg-emerald-50 border border-emerald-100 rounded-xl flex items-start gap-2.5">
                      <ShieldCheck className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-emerald-800">Your credentials are secure</p>
                        <p className="text-xs text-emerald-600 mt-0.5">We use industry standard encryption to keep your data safe.</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="px-6 py-4 border-t border-border bg-slate-50 rounded-b-2xl flex items-center justify-between">
                <div>
                  {step === 1 ? (
                    <Button type="button" variant="outline" onClick={handleClose}>Cancel</Button>
                  ) : (
                    <Button type="button" variant="outline" onClick={handleBack} className="gap-1.5">
                      <ArrowLeft className="w-4 h-4" /> Back
                    </Button>
                  )}
                </div>
                <div className="flex gap-2">
                  {step === 3 && (
                    <Button type="button" variant="outline" onClick={handleTestConnection} disabled={testing || loading}>
                      {testing ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Server className="w-4 h-4 mr-2" />}
                      Test Connection
                    </Button>
                  )}
                  {step < 3 ? (
                    <Button type="button" onClick={handleNext} className="gap-1.5">
                      Next <ArrowRight className="w-4 h-4" />
                    </Button>
                  ) : (
                    <Button type="button" onClick={handleSubmit} disabled={loading || testing}>
                      {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                      Connect Account
                    </Button>
                  )}
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};
