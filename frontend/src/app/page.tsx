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
  Smartphone,
  Monitor,
  Tablet
} from 'lucide-react';
import { Button } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

// Animation variants
const fadeInUp = {
  initial: { opacity: 0, y: 60 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6, ease: 'easeOut' }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const scaleIn = {
  initial: { opacity: 0, scale: 0.8 },
  animate: { opacity: 1, scale: 1 },
  transition: { duration: 0.5, ease: 'easeOut' }
};

// Feature data
const features = [
  {
    icon: <Cloud className="h-8 w-8" />,
    title: 'Secure Cloud Storage',
    description: 'Store your files safely in the cloud with enterprise-grade security and encryption.'
  },
  {
    icon: <Upload className="h-8 w-8" />,
    title: 'Easy File Upload',
    description: 'Drag and drop files or browse to upload. Support for all file types with progress tracking.'
  },
  {
    icon: <FolderOpen className="h-8 w-8" />,
    title: 'Smart Organization',
    description: 'Organize files in folders, search by name, and manage your storage efficiently.'
  },
  {
    icon: <Shield className="h-8 w-8" />,
    title: 'Privacy First',
    description: 'Your data is encrypted and secure. Only you have access to your personal files.'
  },
  {
    icon: <Zap className="h-8 w-8" />,
    title: 'Lightning Fast',
    description: 'Quick uploads, instant downloads, and responsive interface for seamless experience.'
  },
  {
    icon: <Users className="h-8 w-8" />,
    title: 'Multi-Provider',
    description: 'Connect multiple cloud providers like AWS, Oracle, and Cloudflare for flexibility.'
  }
];

const benefits = [
  'Unlimited file types supported',
  'Advanced search and filtering',
  'Real-time sync across devices',
  'Automatic backup and versioning',
  'Mobile-responsive interface',
  'Enterprise-grade security'
];

export default function Home() {
  const { isAuthenticated, user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background decoration */}
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-primary/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
        
        <div className="relative container mx-auto px-4 py-20 lg:py-32">
          <motion.div
            initial="initial"
            animate="animate"
            variants={staggerContainer}
            className="text-center max-w-4xl mx-auto"
          >
            {/* Main heading */}
            <motion.h1
              variants={fadeInUp}
              className="text-4xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-6"
            >
              Your Personal
              <span className="block text-primary">Cloud Storage</span>
            </motion.h1>

            {/* Tagline */}
            <motion.p
              variants={fadeInUp}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed"
            >
              Store, organize, and access your files from anywhere. 
              Secure, fast, and designed for your personal needs.
            </motion.p>

            {/* CTA Buttons */}
            <motion.div
              variants={fadeInUp}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12"
            >
              {!isLoading && (
                <>
                  {isAuthenticated ? (
                    <Link href="/dashboard">
                      <Button size="lg" className="w-full sm:w-auto group">
                        Go to Dashboard
                        <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  ) : (
                    <>
                      <Link href="/register">
                        <Button size="lg" className="w-full sm:w-auto group">
                          Get Started Free
                          <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                      <Link href="/login">
                        <Button variant="outline" size="lg" className="w-full sm:w-auto">
                          Sign In
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
            </motion.div>

            {/* User greeting for authenticated users */}
            {isAuthenticated && user && (
              <motion.div
                variants={fadeInUp}
                className="bg-card border rounded-lg p-4 max-w-md mx-auto"
              >
                <p className="text-sm text-muted-foreground">Welcome back,</p>
                <p className="font-semibold text-lg">{user.name}</p>
              </motion.div>
            )}

            {/* Device mockups */}
            <motion.div
              variants={scaleIn}
              className="flex justify-center items-center gap-4 mt-16 opacity-60"
            >
              <Monitor className="h-8 w-8 text-muted-foreground" />
              <Tablet className="h-6 w-6 text-muted-foreground" />
              <Smartphone className="h-5 w-5 text-muted-foreground" />
              <span className="text-sm text-muted-foreground ml-2">
                Works on all devices
              </span>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 lg:py-32 bg-muted/30">
        <div className="container mx-auto px-4">
          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="text-center mb-16"
          >
            <motion.h2
              variants={fadeInUp}
              className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4"
            >
              Everything you need for
              <span className="block text-primary">file management</span>
            </motion.h2>
            <motion.p
              variants={fadeInUp}
              className="text-lg text-muted-foreground max-w-2xl mx-auto"
            >
              Powerful features designed to make file storage and management effortless and secure.
            </motion.p>
          </motion.div>

          <motion.div
            initial="initial"
            whileInView="animate"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
          >
            {features.map((feature, index) => (
              <motion.div
                key={index}
                variants={scaleIn}
                className="bg-card border rounded-xl p-6 hover:shadow-lg transition-all duration-300 hover:-translate-y-1"
              >
                <div className="text-primary mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold mb-6"
              >
                Why choose our
                <span className="block text-primary">storage solution?</span>
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg text-muted-foreground mb-8 leading-relaxed"
              >
                Built with modern technology and security best practices, 
                our platform provides everything you need for personal file management.
              </motion.p>
              
              <motion.div
                variants={staggerContainer}
                className="space-y-4"
              >
                {benefits.map((benefit, index) => (
                  <motion.div
                    key={index}
                    variants={fadeInUp}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                    <span className="text-foreground">{benefit}</span>
                  </motion.div>
                ))}
              </motion.div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 60 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
              className="relative"
            >
              <div className="bg-gradient-to-br from-primary/20 to-accent/20 rounded-2xl p-8 lg:p-12">
                <div className="grid grid-cols-2 gap-6">
                  <div className="bg-card border rounded-lg p-4 text-center">
                    <Upload className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">Fast</div>
                    <div className="text-sm text-muted-foreground">Upload</div>
                  </div>
                  <div className="bg-card border rounded-lg p-4 text-center">
                    <Download className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">Instant</div>
                    <div className="text-sm text-muted-foreground">Download</div>
                  </div>
                  <div className="bg-card border rounded-lg p-4 text-center">
                    <Shield className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">Secure</div>
                    <div className="text-sm text-muted-foreground">Storage</div>
                  </div>
                  <div className="bg-card border rounded-lg p-4 text-center">
                    <Cloud className="h-8 w-8 text-primary mx-auto mb-2" />
                    <div className="text-2xl font-bold">Cloud</div>
                    <div className="text-sm text-muted-foreground">Sync</div>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-20 lg:py-32 bg-primary/5">
          <div className="container mx-auto px-4 text-center">
            <motion.div
              initial="initial"
              whileInView="animate"
              viewport={{ once: true }}
              variants={staggerContainer}
              className="max-w-3xl mx-auto"
            >
              <motion.h2
                variants={fadeInUp}
                className="text-3xl md:text-4xl font-bold mb-6"
              >
                Ready to get started?
              </motion.h2>
              <motion.p
                variants={fadeInUp}
                className="text-lg text-muted-foreground mb-8"
              >
                Join thousands of users who trust us with their personal file storage. 
                Start your journey today with our free account.
              </motion.p>
              <motion.div
                variants={fadeInUp}
                className="flex flex-col sm:flex-row gap-4 justify-center"
              >
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto group">
                    Create Free Account
                    <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Sign In to Existing Account
                  </Button>
                </Link>
              </motion.div>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-4">
              <div className="h-8 w-8 bg-primary rounded-lg flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-sm">CS</span>
              </div>
              <span className="font-semibold text-lg">CloudStore</span>
            </div>
            <p className="text-sm text-muted-foreground">
              Your personal cloud storage solution. Secure, fast, and reliable.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
