import { AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

interface ErrorAlertProps {
  title?: string
  message: string
  onRetry?: () => void
  className?: string
}

export function ErrorAlert({ 
  title = "Erro", 
  message, 
  onRetry, 
  className 
}: ErrorAlertProps) {
  return (
    <Alert variant="destructive" className={className}>
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="flex items-center justify-between">
        <span>{message}</span>
        {onRetry && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRetry}
            className="ml-4"
          >
            Tentar Novamente
          </Button>
        )}
      </AlertDescription>
    </Alert>
  )
}