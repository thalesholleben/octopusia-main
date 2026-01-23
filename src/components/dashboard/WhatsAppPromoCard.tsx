import { Bot, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

interface WhatsAppPromoCardProps {
  delay?: number;
}

export function WhatsAppPromoCard({ delay = 0 }: WhatsAppPromoCardProps) {
  const [whatsappUrl, setWhatsappUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch(`${API_URL}/config/whatsapp-url`)
      .then(res => res.json())
      .then(data => setWhatsappUrl(data.url))
      .catch(() => setWhatsappUrl(null));
  }, []);

  // Não renderiza se não tiver URL configurada
  if (!whatsappUrl) return null;

  return (
    <div
      className={cn(
        'card-float opacity-0 animate-fade-up',
        // Mobile: Just the button, minimal padding
        'flex items-center p-1.5',
        // Desktop: Horizontal, slim layout
        'lg:gap-4 lg:px-4 lg:py-3',
        // Premium styling
        'border-primary/20 hover:border-primary/40 transition-all hover:glow-primary'
      )}
      style={{ animationDelay: `${delay}ms`, animationFillMode: 'forwards' }}
    >
      {/* Icon Badge - Small on mobile, normal on desktop */}
<div className="rounded-lg bg-gradient-to-br from-primary/10 to-primary/5 p-1 lg:p-2 shrink-0 mr-[5px] lg:mr-0">
  <Bot className="w-4 h-4 lg:w-5 lg:h-5 text-primary" />
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
