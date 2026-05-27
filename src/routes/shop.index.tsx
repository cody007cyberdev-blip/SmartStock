import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useTranslation } from "react-i18next";
import { ShoppingCart, QrCode, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CustomerQRScanner } from "@/components/shopping/CustomerQRScanner";
import { useState } from "react";

export const Route = createFileRoute("/shop/")({
  component: ShopLandingPage,
  head: () => ({ meta: [{ title: "Compras — SmartStock" }] }),
});

function ShopLandingPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [showScanner, setShowScanner] = useState(false);

  const handleListFound = (listId: string) => {
    navigate({ to: `/shopping-list/${listId}` });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-orange-50">
      {/* Header */}
      <header className="border-b border-orange-100 bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="mx-auto max-w-6xl px-4 md:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="rounded-lg bg-orange-600 p-2">
                <ShoppingCart className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">{t("common.appName")}</h1>
                <p className="text-xs text-gray-600">{t("common.tagline")}</p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto max-w-6xl px-4 md:px-8 py-12 md:py-20">
        {!showScanner ? (
          <>
            {/* Hero Section */}
            <div className="mb-16 text-center">
              <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                Compre sem aplicativo
              </h2>
              <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                Escaneie o código QR da loja e crie sua lista de compras de forma rápida e fácil. Sem necessidade de baixar aplicativo.
              </p>
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="border-orange-100 hover:shadow-lg transition-shadow p-6">
                <div className="rounded-lg bg-orange-100 p-3 w-fit mb-4">
                  <QrCode className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Escaneie QR</h3>
                <p className="text-gray-600">
                  Aponte a câmera do seu celular para o código QR da loja para começar.
                </p>
              </Card>

              <Card className="border-orange-100 hover:shadow-lg transition-shadow p-6">
                <div className="rounded-lg bg-orange-100 p-3 w-fit mb-4">
                  <ShoppingCart className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Crie sua lista</h3>
                <p className="text-gray-600">
                  Adicione produtos à sua lista de compras de forma intuitiva e rápida.
                </p>
              </Card>

              <Card className="border-orange-100 hover:shadow-lg transition-shadow p-6">
                <div className="rounded-lg bg-orange-100 p-3 w-fit mb-4">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Finalize rápido</h3>
                <p className="text-gray-600">
                  Apresente seu QR ao vendedor e finalize a compra em segundos.
                </p>
              </Card>
            </div>

            {/* CTA Section */}
            <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-12 text-center text-white mb-12">
              <h3 className="text-3xl font-bold mb-4">Pronto para começar?</h3>
              <p className="text-orange-100 mb-6 text-lg">
                Escaneie o código QR da loja para criar sua lista de compras.
              </p>
              <Button
                onClick={() => setShowScanner(true)}
                className="bg-white text-orange-600 hover:bg-orange-50 font-semibold px-8 py-3 rounded-lg"
              >
                Escanear QR Code
              </Button>
            </div>
          </>
        ) : (
          <div className="max-w-md mx-auto">
            <Button
              variant="outline"
              onClick={() => setShowScanner(false)}
              className="mb-6 w-full"
            >
              ← Voltar
            </Button>
            <CustomerQRScanner onNavigate={handleListFound} />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-gray-50 py-8 mt-16">
        <div className="mx-auto max-w-6xl px-4 md:px-8 text-center text-gray-600 text-sm">
          <p>© 2026 {t("common.appName")}. Todos os direitos reservados.</p>
        </div>
      </footer>
    </div>
  );
}
