import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Mail, Send, Loader2 } from "lucide-react";

type LogRow = {
  id: string;
  email_type: string;
  recipient_email: string;
  send_date: string;
  task_count: number;
  status: "sent" | "failed" | "skipped";
  error_message: string | null;
  created_at: string;
};

const EmailReminders = () => {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [sendingTest, setSendingTest] = useState(false);

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ["email-send-log"],
    queryFn: async (): Promise<LogRow[]> => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const cutoff = sevenDaysAgo.toISOString().slice(0, 10);
      const { data, error } = await supabase
        .from("email_send_log")
        .select("*")
        .gte("send_date", cutoff)
        .order("created_at", { ascending: false })
        .limit(100);
      if (error) throw error;
      return (data ?? []) as LogRow[];
    },
  });

  const sendTestEmail = async () => {
    setSendingTest(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-daily-task-emails", {
        body: { test: true },
      });
      if (error) throw error;
      const result = data?.summary?.[0];
      if (result?.status === "sent") {
        toast({
          title: "Testimeili lähetetty",
          description: `Lähetetty osoitteeseen ${result.recipient}. Tarkista postilaatikkosi.`,
        });
      } else if (result?.status === "failed") {
        toast({
          title: "Testimeili epäonnistui",
          description: result.error || "Tuntematon virhe",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Testimeili käsitelty",
          description: JSON.stringify(data),
        });
      }
      qc.invalidateQueries({ queryKey: ["email-send-log"] });
    } catch (err: any) {
      toast({
        title: "Virhe testimeiliä lähettäessä",
        description: err?.message || String(err),
        variant: "destructive",
      });
    } finally {
      setSendingTest(false);
    }
  };

  const statusBadge = (status: LogRow["status"]) => {
    if (status === "sent") return <Badge className="bg-green-600 hover:bg-green-600">Lähetetty</Badge>;
    if (status === "failed") return <Badge variant="destructive">Epäonnistui</Badge>;
    return <Badge variant="secondary">Ohitettu</Badge>;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Sähköpostimuistutukset
          </CardTitle>
          <CardDescription>
            Päivittäinen tehtävämuistutus myyjille klo 07:00 (arkisin). Viimeisten 7 päivän lähetyshistoria.
          </CardDescription>
        </div>
        <Button onClick={sendTestEmail} disabled={sendingTest} className="gap-2 shrink-0">
          {sendingTest ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
          Lähetä testimeili itselleni
        </Button>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Ladataan lähetyshistoriaa...</div>
        ) : logs.length === 0 ? (
          <div className="text-sm text-muted-foreground py-4">
            Ei lähetyksiä viimeisen 7 päivän aikana. Cron lähettää meilit automaattisesti seuraavana arkiaamuna klo 07:00.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Päivä</TableHead>
                <TableHead>Vastaanottaja</TableHead>
                <TableHead className="text-center">Tehtäviä</TableHead>
                <TableHead>Tila</TableHead>
                <TableHead>Lähetetty</TableHead>
                <TableHead>Virhe</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.map((log) => (
                <TableRow key={log.id}>
                  <TableCell>{log.send_date}</TableCell>
                  <TableCell className="font-mono text-xs">{log.recipient_email}</TableCell>
                  <TableCell className="text-center">{log.task_count}</TableCell>
                  <TableCell>{statusBadge(log.status)}</TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {new Date(log.created_at).toLocaleString("fi-FI")}
                  </TableCell>
                  <TableCell className="text-xs text-destructive max-w-xs truncate" title={log.error_message ?? ""}>
                    {log.error_message ?? ""}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  );
};

export default EmailReminders;
