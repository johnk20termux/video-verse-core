import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Plus, Trash2, Link as LinkIcon } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";

interface Addon {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

const Addons = () => {
  const [addons, setAddons] = useState<Addon[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [url, setUrl] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchAddons();
  }, []);

  const fetchAddons = async () => {
    try {
      const { data, error } = await supabase
        .from("addons")
        .select("*")
        .order("added_at", { ascending: false });

      if (error) throw error;
      setAddons(data || []);
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAddAddon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase
        .from("addons")
        .insert({ user_id: user.id, name, url, enabled: true });

      if (error) throw error;

      toast.success("Add-on added successfully!");
      setName("");
      setUrl("");
      setDialogOpen(false);
      fetchAddons();
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleToggleAddon = async (id: string, enabled: boolean) => {
    try {
      const { error } = await supabase
        .from("addons")
        .update({ enabled })
        .eq("id", id);

      if (error) throw error;

      setAddons(addons.map(addon => 
        addon.id === id ? { ...addon, enabled } : addon
      ));
      toast.success(enabled ? "Add-on enabled" : "Add-on disabled");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  const handleDeleteAddon = async (id: string) => {
    try {
      const { error } = await supabase
        .from("addons")
        .delete()
        .eq("id", id);

      if (error) throw error;

      setAddons(addons.filter(addon => addon.id !== id));
      toast.success("Add-on removed");
    } catch (error: any) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 pt-24">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-4xl font-bold mb-2">Add-ons</h1>
            <p className="text-muted-foreground">Extend functionality with custom add-ons</p>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Add Add-on
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Add-on</DialogTitle>
                <DialogDescription>
                  Add a custom add-on by providing a name and URL
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleAddAddon} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Name</Label>
                  <Input
                    id="name"
                    placeholder="My Custom Add-on"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="url">URL</Label>
                  <Input
                    id="url"
                    type="url"
                    placeholder="https://example.com/addon"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    required
                  />
                </div>
                <Button type="submit" className="w-full">Add Add-on</Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        <div className="space-y-4">
          {addons.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <LinkIcon className="w-12 h-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-center">
                  No add-ons yet. Add your first add-on to get started!
                </p>
              </CardContent>
            </Card>
          ) : (
            addons.map((addon) => (
              <Card key={addon.id}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <CardTitle>{addon.name}</CardTitle>
                      <CardDescription className="mt-1 break-all">
                        {addon.url}
                      </CardDescription>
                    </div>
                    <div className="flex items-center gap-4">
                      <Switch
                        checked={addon.enabled}
                        onCheckedChange={(enabled) => handleToggleAddon(addon.id, enabled)}
                      />
                      <Button
                        variant="destructive"
                        size="icon"
                        onClick={() => handleDeleteAddon(addon.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
              </Card>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Addons;
