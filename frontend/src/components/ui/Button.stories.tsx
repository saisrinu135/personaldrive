import React from 'react';
import { Button } from './Button';
import { Download, Plus, Trash2, Settings, Save } from 'lucide-react';

export default {
  title: 'UI/Button',
  component: Button,
};

export const AllVariants = () => (
  <div className="space-y-4 p-6">
    <h2 className="text-2xl font-bold mb-4">Button Variants</h2>
    
    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Primary</h3>
      <div className="flex gap-2">
        <Button variant="primary" size="sm">Small Primary</Button>
        <Button variant="primary" size="md">Medium Primary</Button>
        <Button variant="primary" size="lg">Large Primary</Button>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Secondary</h3>
      <div className="flex gap-2">
        <Button variant="secondary" size="sm">Small Secondary</Button>
        <Button variant="secondary" size="md">Medium Secondary</Button>
        <Button variant="secondary" size="lg">Large Secondary</Button>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Outline</h3>
      <div className="flex gap-2">
        <Button variant="outline" size="sm">Small Outline</Button>
        <Button variant="outline" size="md">Medium Outline</Button>
        <Button variant="outline" size="lg">Large Outline</Button>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Ghost</h3>
      <div className="flex gap-2">
        <Button variant="ghost" size="sm">Small Ghost</Button>
        <Button variant="ghost" size="md">Medium Ghost</Button>
        <Button variant="ghost" size="lg">Large Ghost</Button>
      </div>
    </div>

    <div className="space-y-2">
      <h3 className="text-lg font-semibold">Danger</h3>
      <div className="flex gap-2">
        <Button variant="danger" size="sm">Small Danger</Button>
        <Button variant="danger" size="md">Medium Danger</Button>
        <Button variant="danger" size="lg">Large Danger</Button>
      </div>
    </div>
  </div>
);

export const WithIcons = () => (
  <div className="space-y-4 p-6">
    <h2 className="text-2xl font-bold mb-4">Buttons with Icons</h2>
    
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" icon={<Download />}>Download</Button>
      <Button variant="secondary" icon={<Plus />}>Add Item</Button>
      <Button variant="outline" icon={<Settings />}>Settings</Button>
      <Button variant="ghost" icon={<Save />}>Save</Button>
      <Button variant="danger" icon={<Trash2 />}>Delete</Button>
    </div>
  </div>
);

export const LoadingStates = () => (
  <div className="space-y-4 p-6">
    <h2 className="text-2xl font-bold mb-4">Loading States</h2>
    
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" loading>Loading Primary</Button>
      <Button variant="secondary" loading>Loading Secondary</Button>
      <Button variant="outline" loading>Loading Outline</Button>
      <Button variant="ghost" loading>Loading Ghost</Button>
      <Button variant="danger" loading>Loading Danger</Button>
    </div>
  </div>
);

export const DisabledStates = () => (
  <div className="space-y-4 p-6">
    <h2 className="text-2xl font-bold mb-4">Disabled States</h2>
    
    <div className="flex flex-wrap gap-2">
      <Button variant="primary" disabled>Disabled Primary</Button>
      <Button variant="secondary" disabled>Disabled Secondary</Button>
      <Button variant="outline" disabled>Disabled Outline</Button>
      <Button variant="ghost" disabled>Disabled Ghost</Button>
      <Button variant="danger" disabled>Disabled Danger</Button>
    </div>
  </div>
);

export const InteractiveDemo = () => {
  const [loading, setLoading] = React.useState(false);

  const handleClick = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  };

  return (
    <div className="space-y-4 p-6">
      <h2 className="text-2xl font-bold mb-4">Interactive Demo</h2>
      <p className="text-gray-600 mb-4">Click the button to see loading state and animations</p>
      
      <Button 
        variant="primary" 
        loading={loading} 
        onClick={handleClick}
        icon={<Download />}
      >
        {loading ? 'Downloading...' : 'Download File'}
      </Button>
    </div>
  );
};