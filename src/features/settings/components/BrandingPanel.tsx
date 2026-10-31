import { RotateCcw } from 'lucide-react'
import { Button, Card, Input, SegmentedControl } from '@/components/ui'
import { DEFAULT_BRANDING } from '@/config/branding'
import { DISPLAY_DARK_BACKGROUND, MIN_TEXT_CONTRAST, WHITE } from '@/config/contrast'
import { contrastRatio } from '@/lib/color'
import { DISPLAY_THEME_OPTIONS } from '@/features/settings/config'
import { useBrandingEditor } from '@/features/settings/hooks/useBrandingEditor'
import { BrandingPreview } from './BrandingPreview'
import { ColorField } from './ColorField'
import { LogoUploadField } from './LogoUploadField'
import { SettingsSection } from './SettingsSection'

/** Ajustes → Marca. Every change autosaves and shows live in the preview. */
export function BrandingPanel() {
  const { branding, update, endEdit, reset } = useBrandingEditor()
  const lowContrast = contrastRatio(branding.accentColor, WHITE) < MIN_TEXT_CONTRAST
  const lowOnDark = contrastRatio(branding.primaryColor, DISPLAY_DARK_BACKGROUND) < MIN_TEXT_CONTRAST

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
      <div className="flex min-w-0 flex-col gap-6">
        <SettingsSection title="Gimnasio" description="Aparece en el menú, en la pestaña del navegador y en las pantallas.">
          <div className="grid gap-4 sm:grid-cols-2">
            <Input label="Nombre" value={branding.gymName} onChange={(e) => update({ gymName: e.target.value })} onBlur={endEdit} />
            <Input label="Lema" value={branding.tagline} onChange={(e) => update({ tagline: e.target.value })} onBlur={endEdit} />
          </div>
        </SettingsSection>
        <SettingsSection title="Logotipos" description="Imágenes de hasta 1,5 MB.">
          <LogoUploadField
            label="Logo para fondo negro"
            hint="Mejor en PNG con fondo transparente. Se usa en el menú y en la tele."
            value={branding.logoUrl}
            defaultValue={DEFAULT_BRANDING.logoUrl}
            onChange={(logoUrl) => update({ logoUrl })}
            surface="dark"
          />
          <LogoUploadField
            label="Icono cuadrado"
            hint="Para la pestaña del navegador y el móvil."
            value={branding.iconUrl}
            defaultValue={DEFAULT_BRANDING.iconUrl}
            onChange={(iconUrl) => update({ iconUrl })}
            surface="light"
          />
        </SettingsSection>
        <SettingsSection title="Colores">
          <div className="grid gap-5 sm:grid-cols-2">
            <ColorField label="Color principal" hint="Sobre negro: menú y pantallas." value={branding.primaryColor} onChange={(primaryColor) => update({ primaryColor })} onEditEnd={endEdit} warning={lowOnDark ? 'Poco contraste sobre negro (pantalla): en la tele se usará un tono más claro.' : undefined} />
            <ColorField
              label="Color de botones y textos"
              hint="Sobre blanco: botones y enlaces del panel."
              value={branding.accentColor}
              onChange={(accentColor) => update({ accentColor })}
              onEditEnd={endEdit}
              warning={lowContrast ? 'Poco contraste sobre blanco: elige un tono más oscuro.' : undefined}
            />
          </div>
        </SettingsSection>
        <SettingsSection title="Pantalla del gimnasio" description="Fondo de las ventanas que se ven en la tele.">
          <SegmentedControl ariaLabel="Tema de la pantalla" options={DISPLAY_THEME_OPTIONS} value={branding.displayTheme} onChange={(displayTheme) => update({ displayTheme })} className="self-start" />
        </SettingsSection>
        <Button variant="ghost" leftIcon={RotateCcw} onClick={reset} className="self-start">
          Restablecer la marca original
        </Button>
      </div>
      <Card padding="md" className="h-fit lg:sticky lg:top-24">
        <BrandingPreview branding={branding} />
      </Card>
    </div>
  )
}
