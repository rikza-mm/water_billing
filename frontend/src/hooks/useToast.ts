import { useCallback } from 'react';
import { toast } from 'react-hot-toast';

type ToastType = 'success' | 'error' | 'info' | 'warning';

export const useToast = () => {
  const showToast = useCallback((type: ToastType, message: string) => {
    switch (type) {
      case 'success':
        toast.success(message);
        break;
      case 'error':
        toast.error(message);
        break;
      case 'info':
        toast(message);
        break;
      case 'warning':
        toast(message, {
          icon: '⚠️',
        });
        break;
      default:
        toast(message);
    }
  }, []);

  return { showToast };
};