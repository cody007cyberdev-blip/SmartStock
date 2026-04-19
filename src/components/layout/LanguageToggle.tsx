import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/i18n";

const LABELS: Record<SupportedLanguage, string> = {
  pt: "PT",
  en: "EN",
};

export function LanguageToggle() {
  const { i18n, t } = useTranslation();
  const current = (SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
    ? i18n.resolvedLanguage
    : "pt") as SupportedLanguage;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("language.label")} className="shrink-0">
          <Languages className="h-4 w-4" />
          <span className="sr-only">{LABELS[current]}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {SUPPORTED_LANGUAGES.map((lng) => (
          <DropdownMenuItem
            key={lng}
            onClick={() => i18n.changeLanguage(lng)}
            className={current === lng ? "font-semibold" : ""}
          >
            <span className="font-mono text-xs mr-2">{LABELS[lng]}</span>
            {t(`language.${lng}`)}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
