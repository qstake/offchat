import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useTheme, ThemeVariant, ThemeColors } from '@/contexts/theme-context';
import { Palette, Check, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface MobileThemeSelectorProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MobileThemeSelector({ isOpen, onClose }: MobileThemeSelectorProps) {
  const { t } = useTranslation();
  const { currentTheme, themes, setTheme } = useTheme();
  const [selectedTheme, setSelectedTheme] = useState<ThemeVariant>(currentTheme);

  const handleThemeChange = (themeId: ThemeVariant) => {
    setSelectedTheme(themeId);
    setTheme(themeId);
    
    // Add haptic feedback for mobile
    if (navigator.vibrate) {
      navigator.vibrate(20);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="mobile-theme-selector-overlay" onClick={onClose}>
      <div 
        className="mobile-theme-selector-container"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mobile-theme-header">
          <div className="mobile-theme-header-content">
            <div className="flex items-center space-x-3">
              <div className="mobile-theme-icon-container">
                <Palette className="mobile-theme-icon" />
                <Sparkles className="mobile-theme-sparkle" />
              </div>
              <div>
                <h2 className="mobile-theme-title" data-testid="text-theme-title">
                  {t('settings.chooseTheme')}
                </h2>
                <p className="mobile-theme-subtitle" data-testid="text-theme-subtitle">
                  {t('settings.customizeExperience')}
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="mobile-theme-close-button"
              data-testid="button-close-theme-selector"
              aria-label="Close theme selector"
            >
              ×
            </button>
          </div>
        </div>

        {/* Theme Grid */}
        <div className="mobile-theme-grid">
          {Object.values(themes).map((theme) => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              isSelected={selectedTheme === theme.id}
              onClick={() => handleThemeChange(theme.id)}
            />
          ))}
        </div>

        {/* Footer */}
        <div className="mobile-theme-footer">
          <div className="mobile-theme-footer-content">
            <div className="flex items-center space-x-2">
              <div className="mobile-theme-status-dot" />
              <span className="mobile-theme-status-text">
                {themes[selectedTheme].name} {t('settings.active')}
              </span>
            </div>
            <div className="mobile-theme-preview-line" />
          </div>
        </div>
      </div>
    </div>
  );
}

interface ThemeCardProps {
  theme: ThemeColors;
  isSelected: boolean;
  onClick: () => void;
}

function ThemeCard({ theme, isSelected, onClick }: ThemeCardProps) {
  return (
    <div
      className={cn(
        "mobile-theme-card",
        isSelected && "selected"
      )}
      onClick={onClick}
      data-testid={`theme-card-${theme.id}`}
    >
      {/* Theme Preview */}
      <div className="mobile-theme-preview">
        <div 
          className="mobile-theme-preview-bg"
          style={{ background: theme.preview }}
        />
        <div className="mobile-theme-preview-overlay" />
        
        {/* Selection Indicator */}
        {isSelected && (
          <div className="mobile-theme-selected-indicator">
            <Check className="mobile-theme-check-icon" strokeWidth={3} />
          </div>
        )}
      </div>

      {/* Theme Info */}
      <div className="mobile-theme-info">
        <h3 className="mobile-theme-name" data-testid={`text-theme-name-${theme.id}`}>
          {theme.name}
        </h3>
        <p className="mobile-theme-description" data-testid={`text-theme-description-${theme.id}`}>
          {theme.description}
        </p>
      </div>

      {/* Interactive Effects */}
      <div className="mobile-theme-ripple" />
    </div>
  );
}