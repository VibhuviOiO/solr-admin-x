import { ReactNode } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"

interface MetricCardProps {
  title: string
  description?: string
  value: string | ReactNode
  percentage?: number
  icon?: ReactNode
  variant?: "default" | "warning" | "success" | "destructive"
}

export function MetricCard({ 
  title, 
  description, 
  value, 
  percentage, 
  icon, 
  variant = "default" 
}: MetricCardProps) {
  const getVariantClasses = () => {
    switch (variant) {
      case "warning":
        return "border-admin-warning/20 bg-admin-warning/5"
      case "success":
        return "border-admin-success/20 bg-admin-success/5"
      case "destructive":
        return "border-destructive/20 bg-destructive/5"
      default:
        return "border-border bg-admin-card"
    }
  }

  return (
    <Card className={`${getVariantClasses()} transition-all hover:shadow-lg`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        {icon && <div className="w-4 h-4 text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-foreground mb-1">{value}</div>
        {description && (
          <CardDescription className="text-xs text-muted-foreground mb-2">
            {description}
          </CardDescription>
        )}
        {percentage !== undefined && (
          <div className="space-y-1">
            <Progress 
              value={percentage} 
              className="h-2"
              aria-label={`${title} usage: ${percentage}%`}
            />
            <p className="text-xs text-muted-foreground">{percentage.toFixed(1)}% used</p>
          </div>
        )}
      </CardContent>
    </Card>
  )
}