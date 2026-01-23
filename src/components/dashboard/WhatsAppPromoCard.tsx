import { Bot, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface WhatsAppPromoCardProps {
  delay?: number;
}

export function WhatsAppPromoCard({ delay = 0 }: WhatsAppPromoCardProps) {
  const whatsappUrl = "https://api.whatsapp.com/send/?phone=5566992457182&text=Ol%C3%A1%2C+gostaria+de+ativar+meu+n%C3%BAmero.&type=phone_number&app_absent=0";

  return (
    <div
      className={cn(
        'card-float opacity-0 animate-fade-up',
        // Mobile: Vertical, compact (icon + button only)
        'flex flex-col items-center gap-2 p-2',
        // Desktop: Horizontal, slim layout
        'lg:flex-row lg:gap-4 lg:px-4 lg:py-3',
        // Premium styling
        'border-primary/20 hover:border-primary/40 transition-all hover:glow-primary'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Icon Badge */}
      <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-2 shrink-0">
        <Bot className="w-5 h-5 text-primary" />
      </div>

      {/* Content - Hidden on mobile, visible on desktop */}
      <div className="hidden lg:block flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground leading-tight">
          WhatsApp IA
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-2">
          Registre entradas, saídas e receba alertas no WhatsApp
        </p>
      </div>

      {/* Button */}
      <Button
        asChild
        size="sm"
        className="shrink-0 gap-1.5 h-7 px-2 text-xs lg:h-8 lg:px-3 lg:text-sm"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="w-3.5 h-3.5 lg:w-4 lg:h-4" />
          <span className="hidden lg:inline">Chamar</span>
          <span className="lg:hidden">Chat</span>
        </a>
      </Button>
    </div>
  );
}
