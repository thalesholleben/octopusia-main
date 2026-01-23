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
        // Mobile: Horizontal layout, slim
        'flex items-center gap-3 p-3',
        // Desktop: Vertical layout, centered
        'lg:flex-col lg:items-center lg:text-center lg:gap-3 lg:p-4 lg:w-[300px]',
        // Premium styling
        'border-primary/20 hover:border-primary/40 transition-all hover:glow-primary'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Icon Badge */}
      <div className={cn(
        'rounded-lg bg-gradient-to-br from-primary/10 to-primary/5',
        'p-2 lg:p-3 shrink-0'
      )}>
        <Bot className="w-5 h-5 lg:w-6 lg:h-6 text-primary" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 lg:flex-auto">
        <h3 className="text-sm lg:text-base font-bold text-foreground mb-1">
          WhatsApp IA
        </h3>
        <p className="text-xs lg:text-sm text-muted-foreground line-clamp-2 lg:line-clamp-3">
          Registre entradas e saídas, tire dúvidas e receba alertas direto no WhatsApp
        </p>
      </div>

      {/* Button */}
      <Button
        asChild
        size="sm"
        className={cn(
          'shrink-0 gap-1.5 h-8 px-3',
          'lg:w-full lg:mt-1 lg:h-9'
        )}
      >
        <a
          href={whatsappUrl}
          target="_blank"
          rel="noopener noreferrer"
        >
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline lg:inline">Chamar</span>
          <span className="sm:hidden lg:hidden">Chat</span>
        </a>
      </Button>
    </div>
  );
}
