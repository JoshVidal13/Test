"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Progress } from "@/components/ui/progress"
import { Alert, AlertDescription } from "@/components/ui/alert"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Trash2,
  Download,
  BarChart3,
  Plus,
  AlertCircle,
} from "lucide-react"
import { format } from "date-fns"
import { es } from "date-fns/locale"
import Link from "next/link"
import { useEntries } from "@/hooks/use-entries"
import { ConnectionStatus } from "@/components/connection-status"
import { RealtimeStatus } from "@/components/realtime-status"
import type { Entry } from "@/lib/supabase"

interface CategoryTotals {
  [key: string]: number
}

const CATEGORIES = {
  gasto: ["Carne", "Agua", "Gas", "Salarios", "Insumos", "Transporte", "Servicios", "Refresco", "Otros"],
  ingreso: ["Efectivo", "Transferencia", "Ventas", "Servicios", "Otros"],
}

export default function ExpenseIncomeManager() {
  const { entries, loading, error, addEntry, deleteEntry, refetch } = useEntries()
  const [newEntry, setNewEntry] = useState({
    type: "gasto" as "gasto" | "ingreso",
    category: "",
    amount: "",
    date: format(new Date(), "yyyy-MM-dd"),
    description: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleAddEntry = async () => {
    if (!newEntry.category || !newEntry.amount || isSubmitting) return

    setIsSubmitting(true)
    try {
      const entryData: Omit<Entry, "id" | "created_at" | "updated_at"> = {
        type: newEntry.type,
        category: newEntry.category,
        amount: Number.parseFloat(newEntry.amount),
        date: newEntry.date,
        description: newEntry.description || undefined,
      }

      const result = await addEntry(entryData)
      if (result) {
        setNewEntry({
          type: "gasto",
          category: "",
          amount: "",
          date: format(new Date(), "yyyy-MM-dd"),
          description: "",
        })
      }
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleDeleteEntry = async (id: string) => {
    if (!id) return
    await deleteEntry(id)
  }

  const exportData = () => {
    const dataStr = JSON.stringify(entries, null, 2)
    const dataBlob = new Blob([dataStr], { type: "application/json" })
    const url = URL.createObjectURL(dataBlob)
    const link = document.createElement("a")
    link.href = url
    link.download = `gastos-ingresos-${format(new Date(), "yyyy-MM-dd")}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  // Calculate totals
  const totals = useMemo(() => {
    const gastos = entries.filter((e) => e.type === "gasto").reduce((sum, e) => sum + e.amount, 0)
    const ingresos = entries.filter((e) => e.type === "ingreso").reduce((sum, e) => sum + e.amount, 0)
    return { gastos, ingresos, balance: ingresos - gastos }
  }, [entries])

  // Calculate category totals
  const categoryTotals = useMemo(() => {
    const gastoTotals: CategoryTotals = {}
    const ingresoTotals: CategoryTotals = {}

    entries.forEach((entry) => {
      if (entry.type === "gasto") {
        gastoTotals[entry.category] = (gastoTotals[entry.category] || 0) + entry.amount
      } else {
        ingresoTotals[entry.category] = (ingresoTotals[entry.category] || 0) + entry.amount
      }
    })

    return { gastos: gastoTotals, ingresos: ingresoTotals }
  }, [entries])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 flex items-center justify-center">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
              <span>Cargando datos...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex items-center justify-center gap-4 mb-2">
            <h1 className="text-4xl font-bold text-gray-800">Gestión de Gastos e Ingresos</h1>
            <div className="flex flex-col gap-1">
              <ConnectionStatus />
              <RealtimeStatus />
            </div>
          </div>
          <p className="text-gray-600">Controla tus finanzas de manera eficiente - Sincronizado en tiempo real</p>

          {error && (
            <Alert variant="destructive" className="max-w-md mx-auto">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex justify-center gap-4">
            <Link href="/calendar/" className="text-blue-600 hover:text-blue-800 font-medium flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Ver Calendario
            </Link>
            <Link
              href="/reports/"
              className="text-purple-600 hover:text-purple-800 font-medium flex items-center gap-2"
            >
              <BarChart3 className="w-4 h-4" />
              Reportes Detallados
            </Link>
            <Button onClick={exportData} variant="outline" size="sm" className="flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exportar Datos
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-800">Ingresos Totales</CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-700">${totals.ingresos.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className="bg-red-50 border-red-200">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-red-800">Gastos Totales</CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-700">${totals.gastos.toLocaleString()}</div>
            </CardContent>
          </Card>

          <Card className={`${totals.balance >= 0 ? "bg-blue-50 border-blue-200" : "bg-orange-50 border-orange-200"}`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className={`text-sm font-medium ${totals.balance >= 0 ? "text-blue-800" : "text-orange-800"}`}>
                Balance
              </CardTitle>
              <DollarSign className={`h-4 w-4 ${totals.balance >= 0 ? "text-blue-600" : "text-orange-600"}`} />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold ${totals.balance >= 0 ? "text-blue-700" : "text-orange-700"}`}>
                ${totals.balance.toLocaleString()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Add New Entry Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Agregar Nueva Entrada
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Tipo</Label>
                <Select
                  value={newEntry.type}
                  onValueChange={(value: "gasto" | "ingreso") =>
                    setNewEntry({ ...newEntry, type: value, category: "" })
                  }
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="gasto">Gasto</SelectItem>
                    <SelectItem value="ingreso">Ingreso</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Categoría</Label>
                <Select
                  value={newEntry.category}
                  onValueChange={(value) => setNewEntry({ ...newEntry, category: value })}
                  disabled={isSubmitting}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Seleccionar categoría" />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORIES[newEntry.type].map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">Monto</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={newEntry.amount}
                  onChange={(e) => setNewEntry({ ...newEntry, amount: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="date">Fecha</Label>
                <Input
                  id="date"
                  type="date"
                  value={newEntry.date}
                  onChange={(e) => setNewEntry({ ...newEntry, date: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Descripción</Label>
                <Input
                  id="description"
                  placeholder="Opcional"
                  value={newEntry.description}
                  onChange={(e) => setNewEntry({ ...newEntry, description: e.target.value })}
                  disabled={isSubmitting}
                />
              </div>
            </div>

            <Button onClick={handleAddEntry} className="w-full md:w-auto" disabled={isSubmitting}>
              {isSubmitting ? "Agregando..." : "Agregar Entrada"}
            </Button>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="entries" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="entries">Entradas Recientes</TabsTrigger>
            <TabsTrigger value="categories">Por Categorías</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>

          <TabsContent value="entries" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Entradas Recientes ({entries.length} total)</CardTitle>
                  <Button onClick={() => refetch()} variant="outline" size="sm" disabled={loading}>
                    {loading ? "Cargando..." : "🔄"}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {entries.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No hay entradas registradas</p>
                  ) : (
                    entries.map((entry) => (
                      <div key={entry.id} className="flex items-center justify-between p-3 bg-white rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Badge variant={entry.type === "ingreso" ? "default" : "destructive"}>
                            {entry.type === "ingreso" ? "Ingreso" : "Gasto"}
                          </Badge>
                          <div>
                            <p className="font-medium">{entry.category}</p>
                            <p className="text-sm text-gray-500">
                              {format(new Date(entry.date), "dd/MM/yyyy", { locale: es })}
                              {entry.description && ` • ${entry.description}`}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${entry.type === "ingreso" ? "text-green-600" : "text-red-600"}`}>
                            ${entry.amount.toLocaleString()}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => entry.id && handleDeleteEntry(entry.id)}
                            className="text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="categories" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-700">Gastos por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(categoryTotals.gastos).map(([category, amount]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm font-bold text-red-600">${amount.toLocaleString()}</span>
                      </div>
                      <Progress value={totals.gastos > 0 ? (amount / totals.gastos) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-green-700">Ingresos por Categoría</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {Object.entries(categoryTotals.ingresos).map(([category, amount]) => (
                    <div key={category} className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-sm font-medium">{category}</span>
                        <span className="text-sm font-bold text-green-600">${amount.toLocaleString()}</span>
                      </div>
                      <Progress value={totals.ingresos > 0 ? (amount / totals.ingresos) * 100 : 0} className="h-2" />
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="w-5 h-5" />
                  Análisis Financiero
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h3 className="font-semibold">Resumen del Período</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Total de entradas: <span className="font-medium">{entries.length}</span>
                      </p>
                      <p>
                        Promedio de gastos:{" "}
                        <span className="font-medium">
                          $
                          {entries.filter((e) => e.type === "gasto").length > 0
                            ? (totals.gastos / entries.filter((e) => e.type === "gasto").length).toLocaleString()
                            : 0}
                        </span>
                      </p>
                      <p>
                        Promedio de ingresos:{" "}
                        <span className="font-medium">
                          $
                          {entries.filter((e) => e.type === "ingreso").length > 0
                            ? (totals.ingresos / entries.filter((e) => e.type === "ingreso").length).toLocaleString()
                            : 0}
                        </span>
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h3 className="font-semibold">Estado Financiero</h3>
                    <div className="space-y-1 text-sm">
                      <p>
                        Ratio Ingreso/Gasto:{" "}
                        <span className="font-medium">
                          {totals.gastos > 0 ? (totals.ingresos / totals.gastos).toFixed(2) : "∞"}
                        </span>
                      </p>
                      <p>
                        Tasa de ahorro:{" "}
                        <span className="font-medium">
                          {totals.ingresos > 0 ? ((totals.balance / totals.ingresos) * 100).toFixed(1) : 0}%
                        </span>
                      </p>
                      <p className={`font-medium ${totals.balance >= 0 ? "text-green-600" : "text-red-600"}`}>
                        {totals.balance >= 0 ? "✓ Superávit" : "⚠ Déficit"}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
