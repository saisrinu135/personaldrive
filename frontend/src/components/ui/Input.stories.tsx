import type { Meta, StoryObj } from '@storybook/react';
import { User, Mail, Lock, Search, Phone } from 'lucide-react';
import { Input } from './Input';

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'error', 'success'],
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
    },
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'tel', 'url'],
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    placeholder: 'Enter text...',
  },
};

export const WithLabel: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter your username',
  },
};

export const Required: Story = {
  args: {
    label: 'Email Address',
    placeholder: 'Enter your email',
    required: true,
  },
};

export const WithIcon: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    icon: <Mail className="h-4 w-4" />,
  },
};

export const WithHelperText: Story = {
  args: {
    label: 'Password',
    placeholder: 'Enter your password',
    helperText: 'Must be at least 8 characters long',
    icon: <Lock className="h-4 w-4" />,
  },
};

export const WithError: Story = {
  args: {
    label: 'Email',
    placeholder: 'Enter your email',
    error: 'Please enter a valid email address',
    icon: <Mail className="h-4 w-4" />,
  },
};

export const Success: Story = {
  args: {
    label: 'Username',
    placeholder: 'Enter username',
    variant: 'success',
    icon: <User className="h-4 w-4" />,
  },
};

export const Disabled: Story = {
  args: {
    label: 'Disabled Input',
    placeholder: 'This input is disabled',
    disabled: true,
    icon: <User className="h-4 w-4" />,
  },
};

export const Sizes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        size="sm"
        label="Small Input"
        placeholder="Small size"
        icon={<Search className="h-3 w-3" />}
      />
      <Input
        size="md"
        label="Medium Input"
        placeholder="Medium size (default)"
        icon={<Search className="h-4 w-4" />}
      />
      <Input
        size="lg"
        label="Large Input"
        placeholder="Large size"
        icon={<Search className="h-5 w-5" />}
      />
    </div>
  ),
};

export const InputTypes: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        type="text"
        label="Text Input"
        placeholder="Enter text"
        icon={<User className="h-4 w-4" />}
      />
      <Input
        type="email"
        label="Email Input"
        placeholder="Enter email"
        icon={<Mail className="h-4 w-4" />}
      />
      <Input
        type="password"
        label="Password Input"
        placeholder="Enter password"
        icon={<Lock className="h-4 w-4" />}
      />
      <Input
        type="tel"
        label="Phone Input"
        placeholder="Enter phone number"
        icon={<Phone className="h-4 w-4" />}
      />
      <Input
        type="number"
        label="Number Input"
        placeholder="Enter number"
      />
    </div>
  ),
};

export const ValidationStates: Story = {
  render: () => (
    <div className="space-y-4 w-80">
      <Input
        label="Default State"
        placeholder="Enter text"
        helperText="This is helper text"
        icon={<User className="h-4 w-4" />}
      />
      <Input
        label="Success State"
        placeholder="Valid input"
        variant="success"
        icon={<User className="h-4 w-4" />}
      />
      <Input
        label="Error State"
        placeholder="Invalid input"
        error="This field is required"
        icon={<User className="h-4 w-4" />}
      />
    </div>
  ),
};

export const FormExample: Story = {
  render: () => (
    <div className="space-y-6 w-96 p-6 border rounded-lg">
      <h3 className="text-lg font-semibold">Sign Up Form</h3>
      <Input
        label="Full Name"
        placeholder="Enter your full name"
        required
        icon={<User className="h-4 w-4" />}
      />
      <Input
        label="Email Address"
        type="email"
        placeholder="Enter your email"
        required
        icon={<Mail className="h-4 w-4" />}
        helperText="We'll never share your email"
      />
      <Input
        label="Password"
        type="password"
        placeholder="Create a password"
        required
        icon={<Lock className="h-4 w-4" />}
        helperText="Must be at least 8 characters"
      />
      <Input
        label="Phone Number"
        type="tel"
        placeholder="Enter your phone number"
        icon={<Phone className="h-4 w-4" />}
      />
    </div>
  ),
};