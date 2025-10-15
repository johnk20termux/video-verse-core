import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Play } from "lucide-react";
import { StreamSource } from "@/services/addons";

interface SourceSelectorProps {
  sources: StreamSource[];
  onSelectSource: (source: StreamSource) => void;
  onClose: () => void;
}

const SourceSelector = ({ sources, onSelectSource, onClose }: SourceSelectorProps) => {
  if (sources.length === 0) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>No Sources Available</CardTitle>
          <CardDescription>
            No streaming sources found from your addons. Try adding some addons first.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button onClick={onClose} variant="secondary">Close</Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>Select Source</CardTitle>
        <CardDescription>
          Choose a streaming source from your addons
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-2">
        {sources.map((source, index) => (
          <Button
            key={index}
            onClick={() => onSelectSource(source)}
            variant="outline"
            className="w-full justify-start gap-3 h-auto py-3"
          >
            <Play className="w-4 h-4 flex-shrink-0" />
            <div className="flex flex-col items-start text-left flex-1">
              <div className="font-medium">{source.title}</div>
              <div className="text-xs text-muted-foreground flex gap-2">
                {source.quality && <span className="font-semibold text-primary">{source.quality}</span>}
                {source.seeders && source.seeders > 0 && <span>👤 {source.seeders}</span>}
                <span>• {source.addonName}</span>
              </div>
            </div>
          </Button>
        ))}
        <Button onClick={onClose} variant="ghost" className="w-full mt-4">
          Cancel
        </Button>
      </CardContent>
    </Card>
  );
};

export default SourceSelector;
