'use client';

import React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Cloud,
  Shield,
  Zap,
  Users,
  ArrowRight,
  CheckCircle,
  Upload,
  Download,
  FolderOpen,
  Server,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

const fadeInUp = {
  initial: { opacity: 0, y: 40 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: 'easeOut' },
};

const staggerContainer = {
  animate: {
    transition: { staggerChildren: 0.08 },
  },
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.9 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.4, ease: 'easeOut' },
};

const features = [
  {
    icon: <Cloud className="h-6 w-6" />,
    title: 'Multi-Provider Support',
    description: 'Connect AWS S3, Cloudflare R2, Oracle Cloud, MinIO, Backblaze and any S3-compatible service.',
    color: 'text-blue-600 bg-blue-50',
  },
  {
    icon: <Upload className="h-6 w-6" />,
    title: 'Easy File Upload',
    description: 'Drag and drop files or browse to upload. Supports all file types with real-time progress.',
    color: 'text-violet-600 bg-violet-50',
  },
  {
    icon: <FolderOpen className="h-6 w-6" />,
    title: 'Folder Hierarchy',
    description: 'Organize files with a rich folder structure backed by your database. Rename, move, nest.',
    color: 'text-emerald-600 bg-emerald-50',
  },
  {
    icon: <Shield className="h-6 w-6" />,
    title: 'Privacy First',
    description: 'Your credentials are encrypted. Only you control access to your cloud storage accounts.',
    color: 'text-orange-600 bg-orange-50',
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: 'Lightning Fast',
    description: 'Direct pre-signed URLs for uploads and downloads — no data ever passes through our servers.',
    color: 'text-yellow-600 bg-yellow-50',
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: 'Multiple Accounts',
    description: 'Manage all your storage accounts in one unified interface with per-account usage tracking.',
    color: 'text-pink-600 bg-pink-50',
  },
];

const providers = [
  { name: 'AWS S3', icon: '🟠', color: 'bg-orange-50 border-orange-100' },
  { name: 'Cloudflare R2', icon: '🟠', color: 'bg-amber-50 border-amber-100' },
  { name: 'Oracle Cloud', icon: '🔴', color: 'bg-red-50 border-red-100' },
  { name: 'Backblaze B2', icon: '🔴', color: 'bg-red-50 border-red-100' },
  { name: 'MinIO', icon: '🔵', color: 'bg-blue-50 border-blue-100' },
  { name: 'Other S3', icon: '⚫', color: 'bg-slate-50 border-slate-100' },
];

const benefits = [
  'All major S3-compatible providers',
  'Hierarchical folder management',
  'Secure, encrypted credentials',
  'Pre-signed direct download URLs',
  'File preview and details panel',
  'Cross-account file organization',
];

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cloud className="w-4 h-4 text-primary" />
            </div>
            <span className="font-bold text-lg text-foreground">
              Cloud<span className="text-primary">Vault</span>
            </span>
          </div>
          {!isLoading && (
            <div className="flex items-center gap-3">
              {isAuthenticated ? (
                <Link href="/dashboard">
                  <Button size="sm" className="gap-2">
                    Go to Dashboard <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              ) : (
                <>
                  <Link href="/login">
                    <Button variant="ghost" size="sm">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button size="sm">Get Started Free</Button>
                  </Link>
                </>
              )}
            </div>
          )}
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-32">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-violet-50 pointer-events-none" />
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

        <div className="relative container mx-auto px-4 text-center">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="max-w-4xl mx-auto"
          >
            <motion.div variants={fadeInUp} className="mb-6">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
                <Lock className="w-3.5 h-3.5" />
                Open-source &amp; self-hostable
              </span>
            </motion.div>

            <motion.h1
              variants={fadeInUp}
              className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight tracking-tight"
            >
              Your Personal{' '}
              <span className="text-primary">Cloud Storage</span>
            </motion.h1>

            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-2xl mx-auto leading-relaxed"
            >
              Connect all your S3-compatible cloud providers in one place.
              Organize, upload, and manage files with a beautiful, intuitive interface.
            </motion.p>

            {!isLoading && (
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-3 justify-center items-center"
              >
                {isAuthenticated ? (
                  <Link href="/dashboard">
                    <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                      Open Dashboard <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="gap-2 shadow-lg shadow-primary/20">
                        Get Started Free <ArrowRight className="h-5 w-5" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg">
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </motion.div>
            )}

            {isAuthenticated && user && (
              <motion.p variants={fadeInUp} className="mt-4 text-sm text-muted-foreground">
                Welcome back, <span className="font-medium text-foreground">{user.name}</span>!
              </motion.p>
            )}
          </motion.div>

          {/* Provider pill strip */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="mt-16 flex flex-wrap justify-center gap-3"
          >
            {providers.map(p => (
              <div
                key={p.name}
                className={`flex items-center gap-2 px-4 py-2 rounded-full border text-sm font-medium text-foreground ${p.color}`}
              >
                <Server className="w-3.5 h-3.5 text-muted-foreground" />
                {p.name}
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything you need for file management
            </motion.h2>
            <motion.p variants={fadeInUp} className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features to manage all your cloud storage accounts with ease.
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="p-6 bg-white rounded-2xl border border-border shadow-card hover:shadow-card-hover transition-all duration-200 hover:-translate-y-0.5"
              >
                <div className={`w-11 h-11 rounded-xl flex items-center justify-center mb-4 ${feature.color}`}>
                  {feature.icon}
                </div>
                <h3 className="text-base font-semibold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-24 bg-slate-50">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Why choose CloudVault?
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-muted-foreground mb-8 leading-relaxed">
                Built for developers and power users who manage multiple S3-compatible storage accounts
                and want a unified, beautiful experience.
              </motion.p>
              <motion.div variants={staggerContainer} className="space-y-3">
                {benefits.map((benefit, index) => (
                  <motion.div key={index} variants={fadeInUp} className="flex items-center gap-3">
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground text-sm">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5 }}
              className="bg-white rounded-2xl border border-border shadow-card p-8"
            >
              <div className="grid grid-cols-2 gap-4">
                {[
                  { icon: <Upload className="h-6 w-6 text-blue-600" />, label: 'Direct Upload', sub: 'No size limits' },
                  { icon: <Download className="h-6 w-6 text-emerald-600" />, label: 'Direct Download', sub: 'Pre-signed URLs' },
                  { icon: <Shield className="h-6 w-6 text-violet-600" />, label: 'Encrypted', sub: 'AES-256' },
                  { icon: <FolderOpen className="h-6 w-6 text-orange-600" />, label: 'Folders', sub: 'Full hierarchy' },
                ].map(item => (
                  <div key={item.label} className="p-4 bg-slate-50 rounded-xl text-center">
                    <div className="flex justify-center mb-2">{item.icon}</div>
                    <div className="text-sm font-semibold text-foreground">{item.label}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.sub}</div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-24 bg-gradient-to-r from-primary to-blue-700">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-2xl mx-auto"
            >
              <motion.h2 variants={fadeInUp} className="text-3xl md:text-4xl font-bold text-white mb-4">
                Ready to get started?
              </motion.h2>
              <motion.p variants={fadeInUp} className="text-blue-100 mb-8 text-lg">
                Connect your first storage account in minutes.
              </motion.p>
              <motion.div variants={fadeInUp} className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link href="/register">
                  <Button size="lg" variant="secondary" className="gap-2 bg-white text-primary hover:bg-white/90">
                    Create Free Account <ArrowRight className="h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button size="lg" variant="outline" className="border-white/40 text-white hover:bg-white/10">
                    Sign In
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-border py-10">
        <div className="container mx-auto px-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-3">
            <div className="w-7 h-7 bg-primary/10 rounded-lg flex items-center justify-center">
              <Cloud className="w-4 h-4 text-primary" />
            </div>
            <span className="font-semibold text-foreground">CloudVault</span>
          </div>
          <p className="text-sm text-muted-foreground">
            Your personal, secure, multi-provider cloud storage solution.
          </p>
        </div>
      </footer>
    </div>
  );
}
