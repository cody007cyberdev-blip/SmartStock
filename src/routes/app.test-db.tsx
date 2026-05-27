import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { Database, CheckCircle, XCircle, RefreshCw } from "lucide-react";

export const Route = createFileRoute("/app/test-db")({
  component: TestDBPage,
  head: () => ({ meta: [{ title: "Teste de Banco de Dados — SmartStock" }] }),
});

function TestDBPage() {
  const { t } = useTranslation();

  const { data: products, isLoading, error, refetch } = useQuery({
    queryKey: ["test-products"],
    queryFn: async () => {
      const res = await fetch("/api/products");
      if (!res.ok) throw new Error("API Error");
      return res.json();
    },
  });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-foreground">Teste de Sistema Real</h1>
        <p className="text-muted-foreground mt-2">Verificando a conexão com o banco de dados Drizzle + SQLite</p>
      </div>

      <Card className="p-8">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="rounded-full bg-primary/10 p-3">
              <Database className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h2 className="text-xl font-semibold">Status do Banco de Dados</h2>
              <p className="text-sm text-muted-foreground">Conexão via API interna</p>
            </div>
          </div>
          <Button variant="outline" size="icon" onClick={() => refetch()} disabled={isLoading}>
            <RefreshCw className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="mt-4 text-muted-foreground">Consultando banco de dados...</p>
          </div>
        ) : error ? (
          <div className="rounded-lg bg-red-50 p-6 text-center">
            <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-red-900">Erro de Conexão</h3>
            <p className="text-red-700 mt-2">Não foi possível conectar ao banco de dados real.</p>
            <pre className="mt-4 p-3 bg-red-100 rounded text-xs text-red-800 overflow-auto">
              {error.message}
            </pre>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="rounded-lg bg-green-50 p-6 text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h3 className="text-lg font-bold text-green-900">Sistema Online</h3>
              <p className="text-green-700 mt-2">Conexão com banco de dados real estabelecida com sucesso!</p>
            </div>

            <div className="border-t pt-4">
              <h4 className="font-semibold mb-2">Dados Recuperados ({products?.length || 0} produtos):</h4>
              <div className="grid gap-2">
                {products?.map((p: any) => (
                  <div key={p.id} className="flex justify-between p-3 bg-muted rounded-md text-sm">
                    <span className="font-medium">{p.name}</span>
                    <span className="text-muted-foreground">{p.sku} • Estoque: {p.currentStock}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Card>

      <div className="text-center text-sm text-muted-foreground">
        <p>Estrutura profissional Feature-Sliced Design implementada.</p>
      </div>
    </div>
  );
}
