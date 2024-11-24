import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const ErrorState = ({ error, onRetry }) => (
  <Alert variant="destructive" className="mx-auto max-w-lg mt-8">
    <AlertTitle>Error</AlertTitle>
    <AlertDescription className="mt-2">
      <p className="mb-4">{error}</p>
      <Button
        variant="outline"
        size="sm"
        onClick={onRetry}
        className="flex items-center gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        Try again
      </Button>
    </AlertDescription>
  </Alert>
);
