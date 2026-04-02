import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import Navigation from "@/components/Navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, FileText, AlertCircle, CheckCircle2, XCircle, Download, ArrowLeft, Users } from "lucide-react";
import Papa from "papaparse";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";

type FileFormat = 'pipedrive' | 'mailchimp' | 'unknown';

interface ImportResult {
  success: boolean
  summary: {
    total: number
    imported: number
    skipped: number
    failed: number
    filteredOut?: number
  }
  skippedRecords: Array<{ row: number; email: string; reason: string }>
  failedRecords: Array<{ row: number; error: string; data: any }>
  salespersonStats: Record<string, number>
  importedRecords?: Array<{ email: string; name: string; salesperson: string }>
}

function detectFormat(headers: string[]): FileFormat {
  if (headers.includes('Person - First name')) return 'pipedrive';
  if (headers.includes('Sähköpostiosoite')) return 'mailchimp';
  return 'unknown';
}

const ImportClients = () => {
  const navigate = useNavigate();
  const [file, setFile] = useState<File | null>(null);
  const [parsedData, setParsedData] = useState<any[]>([]);
  const [fileFormat, setFileFormat] = useState<FileFormat>('unknown');
  const [skipDuplicates, setSkipDuplicates] = useState<boolean>(true);
  const [onlyNewLeads, setOnlyNewLeads] = useState<boolean>(true);
  const [importing, setImporting] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [currentBatch, setCurrentBatch] = useState(0);
  const [totalBatches, setTotalBatches] = useState(0);

  // For Mailchimp, count new leads vs existing
  const mailchimpStats = useMemo(() => {
    if (fileFormat !== 'mailchimp') return null;
    const newLeads = parsedData.filter(r => {
      const m = (r['Match_Method'] || '').trim();
      return !m || m === 'no_match';
    });
    const existing = parsedData.length - newLeads.length;
    return { newLeads: newLeads.length, existing };
  }, [parsedData, fileFormat]);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (selectedFile.size > 5 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 5MB", variant: "destructive" });
      return;
    }

    setFile(selectedFile);
    setResult(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const headers = results.meta.fields || [];
        const format = detectFormat(headers);
        setFileFormat(format);
        setParsedData(results.data as any[]);
        
        if (format === 'unknown') {
          toast({ title: "Unknown format", description: "CSV headers don't match Pipedrive or Mailchimp format", variant: "destructive" });
        } else {
          toast({ title: "File loaded", description: `${results.data.length} records found (${format === 'mailchimp' ? 'Mailchimp' : 'Pipedrive'} format)` });
        }
      },
      error: (error) => {
        toast({ title: "Parse error", description: error.message, variant: "destructive" });
      },
    });
  };

  const handleImport = async () => {
    if (parsedData.length === 0) return;

    setImporting(true);
    setProgress(0);
    setResult(null);

    try {
      const batchSize = 100;
      const batches = Math.ceil(parsedData.length / batchSize);
      setTotalBatches(batches);

      const allResults: ImportResult = {
        success: true,
        summary: { total: parsedData.length, imported: 0, skipped: 0, failed: 0, filteredOut: 0 },
        skippedRecords: [],
        failedRecords: [],
        salespersonStats: {},
        importedRecords: [],
      };

      const functionName = fileFormat === 'mailchimp' ? 'import-mailchimp' : 'import-customers';

      for (let i = 0; i < parsedData.length; i += batchSize) {
        const batch = parsedData.slice(i, i + batchSize);
        setCurrentBatch(Math.floor(i / batchSize) + 1);

        const body: any = { records: batch, skipDuplicates };
        if (fileFormat === 'mailchimp') body.onlyNewLeads = onlyNewLeads;

        const { data, error } = await supabase.functions.invoke(functionName, { body });

        if (error) throw error;

        allResults.summary.imported += data.summary.imported;
        allResults.summary.skipped += data.summary.skipped;
        allResults.summary.failed += data.summary.failed;
        if (data.summary.filteredOut) allResults.summary.filteredOut! += data.summary.filteredOut;
        allResults.skippedRecords.push(...data.skippedRecords);
        allResults.failedRecords.push(...data.failedRecords);
        if (data.importedRecords) allResults.importedRecords!.push(...data.importedRecords);

        Object.entries(data.salespersonStats).forEach(([person, count]) => {
          allResults.salespersonStats[person] = (allResults.salespersonStats[person] || 0) + (count as number);
        });

        const progressPercent = Math.round(((i + batch.length) / parsedData.length) * 100);
        setProgress(progressPercent);
      }

      setResult(allResults);
      toast({ title: "Import complete", description: `${allResults.summary.imported} clients imported successfully` });
    } catch (error: any) {
      console.error('Import error:', error);
      toast({ title: "Import failed", description: error.message, variant: "destructive" });
    } finally {
      setImporting(false);
    }
  };

  const downloadReport = (type: 'skipped' | 'failed') => {
    if (!result) return;
    let csv: string;
    if (type === 'skipped') {
      const records = result.skippedRecords.map(r => ({ row: r.row, email: r.email, reason: r.reason }));
      if (records.length === 0) return;
      csv = Papa.unparse(records);
    } else {
      const records = result.failedRecords.map(r => ({ row: r.row, error: r.error }));
      if (records.length === 0) return;
      csv = Papa.unparse(records);
    }
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `import-${type}-records.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const previewData = parsedData.slice(0, 10);

  const renderPreviewTable = () => {
    if (fileFormat === 'mailchimp') {
      return (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Phone</TableHead>
              <TableHead>Sales Rep</TableHead>
              <TableHead>Match</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {previewData.map((row, idx) => {
              const match = (row['Match_Method'] || '').trim();
              const isNew = !match || match === 'no_match';
              return (
                <TableRow key={idx} className={isNew ? 'bg-green-50' : ''}>
                  <TableCell>{row['Nimi'] || '-'}</TableCell>
                  <TableCell className="text-xs">{row['Sähköpostiosoite'] || '-'}</TableCell>
                  <TableCell>{row['Phone Number'] || '-'}</TableCell>
                  <TableCell className="text-xs">{row['Sales_Rep'] || '-'}</TableCell>
                  <TableCell>
                    <Badge variant={isNew ? 'default' : 'secondary'} className="text-xs">
                      {isNew ? 'New' : match}
                    </Badge>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      );
    }

    return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>First Name</TableHead>
            <TableHead>Last Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead>Owner</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {previewData.map((row, idx) => (
            <TableRow key={idx}>
              <TableCell>{row['Person - First name']}</TableCell>
              <TableCell>{row['Person - Last name']}</TableCell>
              <TableCell className="text-xs">{row['Person - Email - Work'] || row['Person - Email - Home'] || '-'}</TableCell>
              <TableCell>{row['Person - Phone - Mobile'] || '-'}</TableCell>
              <TableCell className="text-xs">{row['Person - Owner']}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      
      <div className="container mx-auto px-6 py-8">
        <div className="mb-6 flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/settings')} className="gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Settings
          </Button>
        </div>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Import Clients from CSV
            </CardTitle>
            <CardDescription>
              Upload a CSV file from Pipedrive or Mailchimp to import clients into the CRM
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* File Upload */}
            <div>
              <Label htmlFor="file-upload" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-primary transition-colors">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-sm text-gray-600 mb-2">
                    {file ? file.name : "Click to upload or drag and drop"}
                  </p>
                  <p className="text-xs text-gray-500">CSV file up to 5MB (Pipedrive or Mailchimp format)</p>
                  <input id="file-upload" type="file" accept=".csv" onChange={handleFileChange} className="hidden" />
                </div>
              </Label>
            </div>

            {/* Format badge */}
            {fileFormat !== 'unknown' && parsedData.length > 0 && (
              <div className="flex items-center gap-2">
                <Badge variant="outline">{fileFormat === 'mailchimp' ? '📧 Mailchimp' : '📊 Pipedrive'} format detected</Badge>
              </div>
            )}

            {/* Mailchimp stats */}
            {mailchimpStats && (
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  <strong>{parsedData.length}</strong> total records: <strong className="text-green-600">{mailchimpStats.newLeads}</strong> new leads, <strong className="text-muted-foreground">{mailchimpStats.existing}</strong> already in CRM.
                  {onlyNewLeads && <span> Only <strong>{mailchimpStats.newLeads}</strong> new leads will be imported.</span>}
                </AlertDescription>
              </Alert>
            )}

            {/* Preview */}
            {parsedData.length > 0 && !result && fileFormat !== 'unknown' && (
              <>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Preview of first {previewData.length} rows. {fileFormat === 'mailchimp' && 'Green rows = new leads.'}
                  </AlertDescription>
                </Alert>

                <div className="border rounded-lg overflow-hidden">
                  {renderPreviewTable()}
                </div>

                {/* Configuration */}
                <div className="space-y-4">
                  <Label className="text-base font-semibold">Import Options</Label>
                  
                  {fileFormat === 'mailchimp' && (
                    <RadioGroup value={onlyNewLeads ? "new" : "all"} onValueChange={(v) => setOnlyNewLeads(v === "new")}>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="new" id="new-only" />
                        <Label htmlFor="new-only" className="font-normal cursor-pointer">
                          Import only new leads ({mailchimpStats?.newLeads} records) — recommended
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="all" id="all-records" />
                        <Label htmlFor="all-records" className="font-normal cursor-pointer">
                          Process all {parsedData.length} records (duplicates checked against Airtable)
                        </Label>
                      </div>
                    </RadioGroup>
                  )}

                  <RadioGroup value={skipDuplicates ? "skip" : "update"} onValueChange={(v) => setSkipDuplicates(v === "skip")}>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="skip" id="skip" />
                      <Label htmlFor="skip" className="font-normal cursor-pointer">
                        Skip duplicate emails (recommended)
                      </Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <RadioGroupItem value="update" id="update" />
                      <Label htmlFor="update" className="font-normal cursor-pointer">
                        Import all records (may create duplicates)
                      </Label>
                    </div>
                  </RadioGroup>
                </div>

                <Button onClick={handleImport} disabled={importing} className="w-full" size="lg">
                  {importing ? 'Importing...' : `Import ${fileFormat === 'mailchimp' && onlyNewLeads ? mailchimpStats?.newLeads : parsedData.length} Clients`}
                </Button>
              </>
            )}

            {/* Progress */}
            {importing && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Processing batch {currentBatch} of {totalBatches}</span>
                    <span>{progress}%</span>
                  </div>
                  <Progress value={progress} />
                </div>
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>Please don't close this window while import is in progress...</AlertDescription>
                </Alert>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Results */}
        {result && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-green-600" />
                  Import Complete
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className={`grid gap-4 ${result.summary.filteredOut ? 'grid-cols-5' : 'grid-cols-4'}`}>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold">{result.summary.total}</div>
                    <div className="text-sm text-gray-600">Total Records</div>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{result.summary.imported}</div>
                    <div className="text-sm text-gray-600">Imported</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{result.summary.skipped}</div>
                    <div className="text-sm text-gray-600">Skipped (duplicates)</div>
                  </div>
                  {!!result.summary.filteredOut && (
                    <div className="text-center p-4 bg-blue-50 rounded-lg">
                      <div className="text-2xl font-bold text-blue-600">{result.summary.filteredOut}</div>
                      <div className="text-sm text-gray-600">Already in CRM</div>
                    </div>
                  )}
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{result.summary.failed}</div>
                    <div className="text-sm text-gray-600">Failed</div>
                  </div>
                </div>

                {/* Salesperson Stats */}
                {Object.keys(result.salespersonStats).length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3">Clients by Salesperson</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {Object.entries(result.salespersonStats)
                        .sort(([, a], [, b]) => (b as number) - (a as number))
                        .map(([person, count]) => (
                          <div key={person} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                            <span className="text-sm">{person}</span>
                            <Badge variant="secondary">{count as number}</Badge>
                          </div>
                        ))}
                    </div>
                  </div>
                )}

                {/* Imported Records List */}
                {result.importedRecords && result.importedRecords.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      New Leads Added ({result.importedRecords.length})
                    </h3>
                    <div className="border rounded-lg overflow-hidden max-h-80 overflow-y-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>#</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Email</TableHead>
                            <TableHead>Salesperson</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {result.importedRecords.map((rec, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="text-muted-foreground">{idx + 1}</TableCell>
                              <TableCell className="font-medium">{rec.name}</TableCell>
                              <TableCell className="text-xs">{rec.email || '-'}</TableCell>
                              <TableCell className="text-xs">{rec.salesperson}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Skipped Records */}
            {result.skippedRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-yellow-600" />
                      Skipped Records ({result.skippedRecords.length})
                    </span>
                    <Button variant="outline" size="sm" onClick={() => downloadReport('skipped')} className="gap-2">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Email</TableHead>
                          <TableHead>Reason</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.skippedRecords.slice(0, 50).map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{record.row}</TableCell>
                            <TableCell className="text-xs">{record.email}</TableCell>
                            <TableCell className="text-xs">{record.reason}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {result.skippedRecords.length > 50 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing first 50 of {result.skippedRecords.length} skipped records.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Failed Records */}
            {result.failedRecords.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center gap-2">
                      <XCircle className="h-5 w-5 text-red-600" />
                      Failed Records ({result.failedRecords.length})
                    </span>
                    <Button variant="outline" size="sm" onClick={() => downloadReport('failed')} className="gap-2">
                      <Download className="h-4 w-4" /> Download
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Row</TableHead>
                          <TableHead>Error</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {result.failedRecords.slice(0, 50).map((record, idx) => (
                          <TableRow key={idx}>
                            <TableCell>{record.row}</TableCell>
                            <TableCell className="text-xs text-red-600">{record.error}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                  {result.failedRecords.length > 50 && (
                    <p className="text-xs text-gray-500 mt-2">
                      Showing first 50 of {result.failedRecords.length} failed records.
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            <Button
              onClick={() => { setFile(null); setParsedData([]); setResult(null); setProgress(0); setFileFormat('unknown'); }}
              variant="outline"
              className="w-full"
            >
              Import Another File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ImportClients;
