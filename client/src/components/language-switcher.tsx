import { useTranslation } from 'react-i18next';
import { languages } from '@/i18n/i18n';
import { Globe } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';

interface LanguageSwitcherProps {
  variant?: 'default' | 'compact' | 'footer';
}

export default function LanguageSwitcher({ variant = 'default' }: LanguageSwitcherProps) {
  const { i18n } = useTranslation();
  const currentLang = languages.find(l => l.code === i18n.language) || languages[0];

  const handleChange = (code: string) => {
    i18n.changeLanguage(code);
  };

  if (variant === 'compact') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button className="flex items-center gap-1 text-green-400 hover:text-green-300 font-mono text-xs tracking-wide transition-colors p-1">
            <Globe className="w-3.5 h-3.5" />
            <span>{currentLang.flag}</span>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-black/95 border-green-400/30 backdrop-blur-md min-w-[140px]">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`font-mono text-xs cursor-pointer ${
                i18n.language === lang.code
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-green-300/70 hover:text-green-400 hover:bg-green-400/5'
              }`}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  if (variant === 'footer') {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="outline"
            size="sm"
            className="bg-black/60 border-green-400/30 text-green-400 hover:bg-green-400/10 font-mono transition-all duration-300 hover:scale-110 hover:shadow-lg"
          >
            <Globe className="w-4 h-4 mr-1" />
            <span>{currentLang.flag}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-black/95 border-green-400/30 backdrop-blur-md min-w-[160px]">
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => handleChange(lang.code)}
              className={`font-mono text-sm cursor-pointer ${
                i18n.language === lang.code
                  ? 'text-green-400 bg-green-400/10'
                  : 'text-green-300/70 hover:text-green-400 hover:bg-green-400/5'
              }`}
            >
              <span className="mr-2">{lang.flag}</span>
              {lang.name}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className="bg-black/60 border-green-400/30 text-green-400 hover:bg-green-400/10 font-mono text-xs tracking-wide transition-all duration-200"
        >
          <Globe className="w-4 h-4 mr-1.5" />
          <span>{currentLang.flag} {currentLang.name}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-black/95 border-green-400/30 backdrop-blur-md min-w-[160px]">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleChange(lang.code)}
            className={`font-mono text-sm cursor-pointer ${
              i18n.language === lang.code
                ? 'text-green-400 bg-green-400/10'
                : 'text-green-300/70 hover:text-green-400 hover:bg-green-400/5'
            }`}
          >
            <span className="mr-2">{lang.flag}</span>
            {lang.name}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
