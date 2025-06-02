import { useState } from 'react';
import { Property } from '@shared/schema';
import { processCSV } from '@/lib/csv-processor';
import { useToast } from './use-toast';

export function useCSVData() {
  const [data, setData] = useState<Property[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [fileName, setFileName] = useState<string>('');
  const [rowCount, setRowCount] = useState<number>(0);
  const { toast } = useToast();

  const uploadCSV = async (file: File) => {
    setIsLoading(true);
    
    try {
      const result = await processCSV(file);
      
      if (result.errors.length > 0) {
        // Show warnings but still proceed if we have data
        result.errors.forEach(error => {
          toast({
            title: "Data Processing Warning",
            description: error,
            variant: "destructive",
          });
        });
      }
      
      if (result.data.length === 0) {
        throw new Error('No valid data found in CSV file');
      }
      
      setData(result.data);
      setFileName(file.name);
      setRowCount(result.data.length);
      
      toast({
        title: "Success",
        description: `Loaded ${result.data.length} properties from ${file.name}`,
      });
      
    } catch (error) {
      toast({
        title: "Upload Failed",
        description: error instanceof Error ? error.message : 'Failed to process CSV file',
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const resetData = () => {
    setData(null);
    setFileName('');
    setRowCount(0);
  };

  return {
    data,
    isLoading,
    fileName,
    rowCount,
    uploadCSV,
    resetData,
  };
}
