import type { Meta, StoryObj } from '@storybook/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';
import { Button } from './Button';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    padding: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    shadow: {
      control: 'select',
      options: ['none', 'sm', 'md', 'lg'],
    },
    hover: {
      control: 'boolean',
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    children: (
      <>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>
            This is a description of the card content.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p>This is the main content of the card. It can contain any React elements.</p>
        </CardContent>
        <CardFooter>
          <Button variant="primary">Action</Button>
        </CardFooter>
      </>
    ),
  },
};

export const NoPadding: Story = {
  args: {
    padding: 'none',
    children: (
      <div className="p-4">
        <h3 className="text-lg font-semibold">No Padding Card</h3>
        <p className="text-sm text-muted-foreground mt-2">
          This card has no default padding, so we add our own.
        </p>
      </div>
    ),
  },
};

export const SmallPadding: Story = {
  args: {
    padding: 'sm',
    children: (
      <>
        <CardHeader>
          <CardTitle>Small Padding</CardTitle>
          <CardDescription>This card uses small padding (p-4).</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Compact content area.</p>
        </CardContent>
      </>
    ),
  },
};

export const LargePadding: Story = {
  args: {
    padding: 'lg',
    children: (
      <>
        <CardHeader>
          <CardTitle>Large Padding</CardTitle>
          <CardDescription>This card uses large padding (p-8).</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Spacious content area with generous padding.</p>
        </CardContent>
      </>
    ),
  },
};

export const NoShadow: Story = {
  args: {
    shadow: 'none',
    children: (
      <>
        <CardHeader>
          <CardTitle>No Shadow</CardTitle>
          <CardDescription>This card has no shadow effect.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Clean, flat appearance without depth.</p>
        </CardContent>
      </>
    ),
  },
};

export const MediumShadow: Story = {
  args: {
    shadow: 'md',
    children: (
      <>
        <CardHeader>
          <CardTitle>Medium Shadow</CardTitle>
          <CardDescription>This card has a medium shadow effect.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Moderate depth and elevation.</p>
        </CardContent>
      </>
    ),
  },
};

export const LargeShadow: Story = {
  args: {
    shadow: 'lg',
    children: (
      <>
        <CardHeader>
          <CardTitle>Large Shadow</CardTitle>
          <CardDescription>This card has a large shadow effect.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Strong depth and prominent elevation.</p>
        </CardContent>
      </>
    ),
  },
};

export const NoHover: Story = {
  args: {
    hover: false,
    children: (
      <>
        <CardHeader>
          <CardTitle>No Hover Animation</CardTitle>
          <CardDescription>This card doesn't animate on hover.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Static card without hover effects.</p>
        </CardContent>
      </>
    ),
  },
};

export const SimpleContent: Story = {
  args: {
    children: (
      <div>
        <h3 className="text-lg font-semibold mb-2">Simple Card</h3>
        <p className="text-sm text-muted-foreground">
          A card with just basic content, no sub-components.
        </p>
      </div>
    ),
  },
};

export const WithImage: Story = {
  args: {
    padding: 'none',
    children: (
      <>
        <div className="h-48 bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-lg"></div>
        <div className="p-6">
          <CardTitle>Image Card</CardTitle>
          <CardDescription className="mt-2">
            A card with an image header and content below.
          </CardDescription>
          <CardFooter className="px-0 pb-0">
            <Button variant="outline" size="sm">
              Learn More
            </Button>
          </CardFooter>
        </div>
      </>
    ),
  },
};

export const Grid: Story = {
  render: () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl">
      <Card>
        <CardHeader>
          <CardTitle>Feature 1</CardTitle>
          <CardDescription>Description of the first feature.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for feature 1.</p>
        </CardContent>
      </Card>
      
      <Card shadow="md">
        <CardHeader>
          <CardTitle>Feature 2</CardTitle>
          <CardDescription>Description of the second feature.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for feature 2.</p>
        </CardContent>
      </Card>
      
      <Card shadow="lg">
        <CardHeader>
          <CardTitle>Feature 3</CardTitle>
          <CardDescription>Description of the third feature.</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Content for feature 3.</p>
        </CardContent>
      </Card>
    </div>
  ),
};

export const ResponsiveDemo: Story = {
  render: () => (
    <div className="space-y-4">
      <Card className="w-full max-w-sm mx-auto sm:max-w-md md:max-w-lg lg:max-w-xl">
        <CardHeader>
          <CardTitle>Responsive Card</CardTitle>
          <CardDescription>
            This card adapts to different screen sizes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm sm:text-base">
            The content and layout adjust based on the viewport size.
          </p>
        </CardContent>
        <CardFooter className="flex-col sm:flex-row gap-2">
          <Button variant="primary" className="w-full sm:w-auto">
            Primary Action
          </Button>
          <Button variant="outline" className="w-full sm:w-auto">
            Secondary Action
          </Button>
        </CardFooter>
      </Card>
    </div>
  ),
};