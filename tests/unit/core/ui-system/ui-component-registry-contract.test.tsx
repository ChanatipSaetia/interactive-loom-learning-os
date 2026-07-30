import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  Badge,
  Modal,
  ModalHeader,
  ModalTitle,
  ModalDescription,
  ModalContent,
  ModalFooter,
  RangeSlider,
  UIComponentRegistry,
} from '../../../../src/core/ui-system/UIComponentRegistryContract'

describe('UIComponentRegistryContract', () => {
  describe('Card', () => {
    it('renders with elevated variant by default', () => {
      render(<Card data-testid="card">Card content</Card>)
      const card = screen.getByTestId('card')
      expect(card).toBeInTheDocument()
      expect(card.className).toContain('bg-card')
    })

    it('renders with outlined variant', () => {
      render(<Card variant="outlined" data-testid="card">Card content</Card>)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('bg-transparent')
    })

    it('renders with ghost variant', () => {
      render(<Card variant="ghost" data-testid="card">Card content</Card>)
      const card = screen.getByTestId('card')
      expect(card.className).toContain('border-0')
    })

    it('renders CardHeader with padding', () => {
      render(<CardHeader data-testid="header">Header</CardHeader>)
      const header = screen.getByTestId('header')
      expect(header.className).toContain('p-5')
    })

    it('renders CardTitle with semibold font', () => {
      render(<CardTitle data-testid="title">Title</CardTitle>)
      const title = screen.getByTestId('title')
      expect(title.className).toContain('font-semibold')
    })

    it('renders CardDescription with muted text', () => {
      render(<CardDescription data-testid="desc">Description</CardDescription>)
      const desc = screen.getByTestId('desc')
      expect(desc.className).toContain('text-muted-foreground')
    })

    it('renders CardContent without top padding', () => {
      render(<CardContent data-testid="content">Content</CardContent>)
      const content = screen.getByTestId('content')
      expect(content.className).toContain('pt-0')
    })

    it('renders CardFooter with flex layout', () => {
      render(<CardFooter data-testid="footer">Footer</CardFooter>)
      const footer = screen.getByTestId('footer')
      expect(footer.className).toContain('flex')
    })
  })

  describe('Badge', () => {
    it('renders with default variant', () => {
      render(<Badge data-testid="badge">Default</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-primary')
    })

    it('renders with secondary variant', () => {
      render(<Badge variant="secondary" data-testid="badge">Secondary</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-secondary')
    })

    it('renders with destructive variant', () => {
      render(<Badge variant="destructive" data-testid="badge">Destructive</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-destructive')
    })

    it('renders with success variant', () => {
      render(<Badge variant="success" data-testid="badge">Success</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('ctp-green')
    })

    it('renders with warning variant', () => {
      render(<Badge variant="warning" data-testid="badge">Warning</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('ctp-yellow')
    })

    it('renders with outline variant', () => {
      render(<Badge variant="outline" data-testid="badge">Outline</Badge>)
      const badge = screen.getByTestId('badge')
      expect(badge.className).toContain('bg-transparent')
    })
  })

  describe('Modal', () => {
    it('does not render when closed', () => {
      const { container } = render(
        <Modal open={false} onClose={() => {}}>Content</Modal>,
      )
      expect(container.firstChild).toBeNull()
    })

    it('renders when open', () => {
      render(
        <Modal open={true} onClose={() => {}} title="Test Modal">
          <p data-testid="modal-content">Modal body</p>
        </Modal>,
      )
      expect(screen.getByTestId('modal-content')).toBeInTheDocument()
      expect(screen.getByText('Test Modal')).toBeInTheDocument()
    })

    it('renders ModalHeader with flex layout', () => {
      render(<ModalHeader data-testid="modal-header">Header</ModalHeader>)
      expect(screen.getByTestId('modal-header').className).toContain('flex')
    })

    it('renders ModalTitle with semibold font', () => {
      render(<ModalTitle data-testid="modal-title">Title</ModalTitle>)
      expect(screen.getByTestId('modal-title').className).toContain('font-semibold')
    })

    it('renders ModalDescription with muted text', () => {
      render(<ModalDescription data-testid="modal-desc">Description</ModalDescription>)
      expect(screen.getByTestId('modal-desc').className).toContain('text-muted-foreground')
    })

    it('renders ModalContent', () => {
      render(<ModalContent data-testid="modal-content">Content</ModalContent>)
      expect(screen.getByTestId('modal-content')).toBeInTheDocument()
    })

    it('renders ModalFooter with flex layout', () => {
      render(<ModalFooter data-testid="modal-footer">Footer</ModalFooter>)
      expect(screen.getByTestId('modal-footer').className).toContain('flex')
    })
  })

  describe('RangeSlider', () => {
    it('renders range input with label', () => {
      render(
        <RangeSlider
          label="Volume"
          min={0}
          max={100}
          value={50}
          data-testid="slider"
        />,
      )
      expect(screen.getByText('Volume')).toBeInTheDocument()
      expect(screen.getByTestId('slider')).toBeInTheDocument()
      expect(screen.getByDisplayValue('50')).toBeInTheDocument()
    })

    it('renders with suffix', () => {
      render(
        <RangeSlider
          label="Volume"
          min={0}
          max={100}
          value={75}
          suffix="%"
          data-testid="slider"
        />,
      )
      expect(screen.getByText('75%')).toBeInTheDocument()
    })

    it('renders with custom formatValue', () => {
      render(
        <RangeSlider
          label="Size"
          min={0}
          max={100}
          value={16}
          formatValue={(v) => `${v}px`}
          data-testid="slider"
        />,
      )
      expect(screen.getByText('16px')).toBeInTheDocument()
    })
  })

  describe('UIComponentRegistry', () => {
    it('contains all required components', () => {
      expect(UIComponentRegistry.Card).toBe(Card)
      expect(UIComponentRegistry.CardHeader).toBe(CardHeader)
      expect(UIComponentRegistry.CardTitle).toBe(CardTitle)
      expect(UIComponentRegistry.CardDescription).toBe(CardDescription)
      expect(UIComponentRegistry.CardContent).toBe(CardContent)
      expect(UIComponentRegistry.CardFooter).toBe(CardFooter)
      expect(UIComponentRegistry.Badge).toBe(Badge)
      expect(UIComponentRegistry.RangeSlider).toBe(RangeSlider)
      expect(UIComponentRegistry.Modal).toBe(Modal)
      expect(UIComponentRegistry.ModalHeader).toBe(ModalHeader)
      expect(UIComponentRegistry.ModalTitle).toBe(ModalTitle)
      expect(UIComponentRegistry.ModalDescription).toBe(ModalDescription)
      expect(UIComponentRegistry.ModalContent).toBe(ModalContent)
      expect(UIComponentRegistry.ModalFooter).toBe(ModalFooter)
    })
  })
})
