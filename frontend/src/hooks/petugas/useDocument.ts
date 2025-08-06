// file: hooks/petugas/useDocument.ts

import { useState, useCallback } from 'react';
import axios from '@/lib/axios';
import { toast } from 'react-hot-toast';

export function useDocument() {
    const [isLoading, setIsLoading] = useState(false);

    const fetchDocumentUrl = useCallback(async (paymentId: string, docType: 'receipt' | 'history'): Promise<string | null> => {
        setIsLoading(true);
        try {
            const response = await axios.get(`/petugas/documents/payment/${paymentId}/${docType}`);
            if (response.data.success && response.data.data.url) {
                return response.data.data.url;
            }
            toast.error(`Arsip ${docType} tidak ditemukan.`);
            return null;
        } catch {
            toast.error(`Gagal mengambil arsip ${docType}.`);
            return null;
        } finally {
            setIsLoading(false);
        }
    }, []);

    return { isLoading, fetchDocumentUrl };
}