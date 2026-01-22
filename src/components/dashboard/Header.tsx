import { LogOut, Settings, Target, FileText } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import octopusLogo from '@/assets/octopus-logo.svg';
import { Button } from '@/components/ui/button';

interface HeaderProps {
  onSignOut?: () => void;
}

export function Header({ onSignOut }: HeaderProps) {
  const navigate = useNavigate();
  return (
    <header className="fixed top-0 left-0 right-0 z-50 h-20 sm:h-22 bg-background/80 backdrop-blur-xl border-b border-border">
      <div className="container px-4 sm:px-6 lg:px-8 h-full flex items-center justify-between">
        <div className="flex items-center gap-2 sm:gap-3">
          <div className="relative">
            <img src={octopusLogo} alt="Octopus IA" className="w-7 h-7 sm:w-8 sm:h-8" />
            <div className="absolute inset-0 blur-lg bg-primary/30 rounded-full" />
          </div>
          <div className="flex flex-col">
            <span className="text-lg sm:text-xl font-bold tracking-tight text-foreground">
              Octopus <span className="text-primary">IA</span>
            </span>
            <span className="hidden sm:block text-[10px] text-muted-foreground uppercase tracking-widest">
              smartFinance - Controle Financeiro
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-full bg-secondary/50 border border-border">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-muted-foreground">Sincronizado</span>
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/goals')}
            className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Target className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Metas</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/records')}
            className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Registros</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/settings')}
            className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
          >
            <Settings className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Configurações</span>
          </Button>

          {onSignOut && (
            <Button
              variant="outline"
              size="sm"
              onClick={onSignOut}
              className="gap-1 sm:gap-2 h-8 sm:h-9 px-2 sm:px-3 text-xs sm:text-sm"
            >
              <LogOut className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Sair</span>
            </Button>
          )}
        </div>
      </div>
    </header>
  );
}
