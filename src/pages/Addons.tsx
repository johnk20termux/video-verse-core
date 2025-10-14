import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Trash2, Plus, Link as LinkIcon } from "lucide-react";
import { toast } from "sonner";

const Addons = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");

  const { data: addons = [] } = useQuery({
    queryKey: ["addons", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("addons")
        .select("*")
        .eq("user_id", user?.id)
        .order("added_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const addAddonMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("addons").insert({
        user_id: user?.id,
        name,
        url,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      setName("");
      setUrl("");
      toast.success("Add-on added successfully!");
    },
    onError: () => {
      toast.error("Failed to add add-on");
    },
  });

  const toggleAddonMutation = useMutation({
    mutationFn: async ({ id, enabled }: { id: string; enabled: boolean }) => {
      const { error } = await supabase
        .from("addons")
        .update({ enabled })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
    },
  });

  const deleteAddonMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("addons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["addons"] });
      toast.success("Add-on removed");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !url) {
      toast.error("Please fill in all fields");
      return;
    }
    addAddonMutation.mutate();
  };

  return (
    <div className="container mx-auto px-4 py-24">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold mb-8 bg-gradient-to-r from-primary via-orange-400 to-accent bg-clip-text text-transparent">
          Add-ons
        </h1>

        <Card className="mb-8 border-border/50 shadow-elegant">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              Add New Add-on
            </CardTitle>
            <CardDescription>
              Add custom streaming sources or extensions
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Add-on Name</Label>
                <Input
                  id="name"
                  placeholder="My Custom Source"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="url">Add-on URL</Label>
                <Input
                  id="url"
                  type="url"
                  placeholder="https://example.com/addon"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                />
              </div>
              <Button type="submit" disabled={addAddonMutation.isPending}>
                {addAddonMutation.isPending ? "Adding..." : "Add Add-on"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <div className="space-y-4">
          {addons.length === 0 ? (
            <Card className="border-border/50">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <LinkIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No add-ons yet</p>
              </CardContent>
            </Card>
          ) : (
            addons.map((addon) => (
              <Card key={addon.id} className="border-border/50 shadow-elegant">
                <CardContent className="flex items-center justify-between p-6">
                  <div className="flex-1">
                    <h3 className="font-semibold">{addon.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {addon.url}
                    </p>
                  </div>
                  <div className="flex items-center gap-4">
                    <Switch
                      checked={addon.enabled}
                      onCheckedChange={(enabled) =>
                        toggleAddonMutation.mutate({ id: addon.id, enabled })
                      }
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => deleteAddonMutation.mutate(addon.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Addons;
