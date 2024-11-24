import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export const RefreshButton = ({ onRefresh, loading }) => (
  <Button
    variant="outline"
    size="sm"
    onClick={onRefresh}
    disabled={loading}
    className="ml-auto"
  >
    <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
    Refresh
  </Button>
);
