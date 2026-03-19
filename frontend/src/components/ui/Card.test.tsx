import React from 'react';
import { render, screen } from '@testing-library/react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from './Card';

describe('Card Component', () => {
  it('renders children correctly', () => {
    render(
      <Card>
        <div>Test content</div>
      </Card>
    );
    
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies default padding and shadow variants', () => {
    const { container } = render(
      <Card>
        <div>Test content</div>
      </Card>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-6'); // default md padding
    expect(card).toHaveClass('shadow-sm'); // default sm shadow
  });

  it('applies custom padding variant', () => {
    const { container } = render(
      <Card padding="lg">
        <div>Test content</div>
      </Card>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('p-8');
  });

  it('applies custom shadow variant', () => {
    const { container } = render(
      <Card shadow="lg">
        <div>Test content</div>
      </Card>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('shadow-lg');
  });

  it('applies no padding when padding is none', () => {
    const { container } = render(
      <Card padding="none">
        <div>Test content</div>
      </Card>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('p-4');
    expect(card).not.toHaveClass('p-6');
    expect(card).not.toHaveClass('p-8');
  });

  it('applies no shadow when shadow is none', () => {
    const { container } = render(
      <Card shadow="none">
        <div>Test content</div>
      </Card>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).not.toHaveClass('shadow-sm');
    expect(card).not.toHaveClass('shadow-md');
    expect(card).not.toHaveClass('shadow-lg');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Card className="custom-class">
        <div>Test content</div>
      </Card>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toHaveClass('custom-class');
  });

  it('forwards ref correctly', () => {
    const ref = React.createRef<HTMLDivElement>();
    render(
      <Card ref={ref}>
        <div>Test content</div>
      </Card>
    );
    
    expect(ref.current).toBeInstanceOf(HTMLDivElement);
  });

  it('disables hover animations when hover is false', () => {
    const { container } = render(
      <Card hover={false}>
        <div>Test content</div>
      </Card>
    );
    
    const card = container.firstChild as HTMLElement;
    expect(card).toBeInTheDocument();
  });
});

describe('Card Sub-components', () => {
  it('renders CardHeader with correct styling', () => {
    const { container } = render(
      <CardHeader>
        <div>Header content</div>
      </CardHeader>
    );
    
    const header = container.firstChild as HTMLElement;
    expect(header).toHaveClass('flex', 'flex-col', 'space-y-1.5', 'pb-6');
    expect(screen.getByText('Header content')).toBeInTheDocument();
  });

  it('renders CardTitle with correct styling', () => {
    render(<CardTitle>Test Title</CardTitle>);
    
    const title = screen.getByRole('heading', { level: 3 });
    expect(title).toHaveClass('text-2xl', 'font-semibold', 'leading-none', 'tracking-tight');
    expect(title).toHaveTextContent('Test Title');
  });

  it('renders CardDescription with correct styling', () => {
    render(<CardDescription>Test description</CardDescription>);
    
    const description = screen.getByText('Test description');
    expect(description).toHaveClass('text-sm', 'text-muted-foreground');
  });

  it('renders CardContent with correct styling', () => {
    const { container } = render(
      <CardContent>
        <div>Content</div>
      </CardContent>
    );
    
    const content = container.firstChild as HTMLElement;
    expect(content).toHaveClass('pt-0');
    expect(screen.getByText('Content')).toBeInTheDocument();
  });

  it('renders CardFooter with correct styling', () => {
    const { container } = render(
      <CardFooter>
        <div>Footer content</div>
      </CardFooter>
    );
    
    const footer = container.firstChild as HTMLElement;
    expect(footer).toHaveClass('flex', 'items-center', 'pt-6');
    expect(screen.getByText('Footer content')).toBeInTheDocument();
  });

  it('renders complete card composition', () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>Card Title</CardTitle>
          <CardDescription>Card description</CardDescription>
        </CardHeader>
        <CardContent>
          <p>Card content goes here</p>
        </CardContent>
        <CardFooter>
          <button>Action</button>
        </CardFooter>
      </Card>
    );

    expect(screen.getByRole('heading', { level: 3 })).toHaveTextContent('Card Title');
    expect(screen.getByText('Card description')).toBeInTheDocument();
    expect(screen.getByText('Card content goes here')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'Action' })).toBeInTheDocument();
  });

  it('applies custom className to sub-components', () => {
    const { container } = render(
      <div>
        <CardHeader className="custom-header">Header</CardHeader>
        <CardTitle className="custom-title">Title</CardTitle>
        <CardDescription className="custom-desc">Description</CardDescription>
        <CardContent className="custom-content">Content</CardContent>
        <CardFooter className="custom-footer">Footer</CardFooter>
      </div>
    );

    expect(container.querySelector('.custom-header')).toBeInTheDocument();
    expect(container.querySelector('.custom-title')).toBeInTheDocument();
    expect(container.querySelector('.custom-desc')).toBeInTheDocument();
    expect(container.querySelector('.custom-content')).toBeInTheDocument();
    expect(container.querySelector('.custom-footer')).toBeInTheDocument();
  });
});