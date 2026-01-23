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
        // Always horizontal, slim layout
        'flex items-center gap-3 p-3 lg:gap-4 lg:px-4 lg:py-3',
        // Premium styling
        'border-primary/20 hover:border-primary/40 transition-all hover:glow-primary'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Icon Badge */}
      <div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-2 shrink-0">
        <Bot className="w-5 h-5 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold text-foreground leading-tight">
          WhatsApp IA
        </h3>
        <p className="text-xs text-muted-foreground line-clamp-1 lg:line-clamp-2">
          Registre entradas, saídas e receba alertas no WhatsApp
        </p>
      </div>

      {/* Button */}
      <Button
        asChild
        size="sm"
        className="shrink-0 gap-1.5 h-8 px-3"
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Chamar</span>
          <span className="sm:hidden">Chat</span>
        </a>
      </Button>
    </div>
  );
}
