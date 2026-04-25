import { useRef, useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { View } from 'react-native';
import { captureRef } from 'react-native-view-shot';
import * as Sharing from 'expo-sharing';
import { addShareHistory } from '../db/queries';

interface UseShareScheduleResult {
  viewRef: React.RefObject<View | null>;
  isCapturing: boolean;
  isSending: boolean;
  previewUri: string | null;
  previewVisible: boolean;
  capturePreview: (dayFilter: string | null, showCount: number) => Promise<void>;
  confirmShare: () => Promise<void>;
  cancelPreview: () => void;
}

export function useShareSchedule(): UseShareScheduleResult {
  const viewRef = useRef<View | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [previewUri, setPreviewUri] = useState<string | null>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const pendingRef = useRef<{ dayFilter: string | null; showCount: number } | null>(null);

  const capturePreview = useCallback(
    async (dayFilter: string | null, showCount: number): Promise<void> => {
      if (isCapturing) return;
      setIsCapturing(true);

      try {
        const available = await Sharing.isAvailableAsync();
        if (!available) {
          Alert.alert(
            'Sharing Not Available',
            'Sharing is not available on this device.'
          );
          return;
        }

        if (!viewRef.current) {
          Alert.alert('Error', 'Could not capture the schedule image.');
          return;
        }

        const uri = await captureRef(viewRef, {
          format: 'png',
          quality: 1.0,
          result: 'tmpfile',
          width: 1080,
        });

        pendingRef.current = { dayFilter, showCount };
        setPreviewUri(uri);
        setPreviewVisible(true);
      } catch (error) {
        Alert.alert(
          'Capture Failed',
          'Something went wrong while generating the image. Please try again.'
        );
      } finally {
        setIsCapturing(false);
      }
    },
    [isCapturing]
  );

  const confirmShare = useCallback(async (): Promise<void> => {
    if (!previewUri || isSending) return;
    setIsSending(true);

    try {
      await Sharing.shareAsync(previewUri, {
        mimeType: 'image/png',
        dialogTitle: 'Share your Mad Cool schedule',
      });

      if (pendingRef.current) {
        await addShareHistory(
          pendingRef.current.dayFilter,
          pendingRef.current.showCount
        );
      }
    } catch (error) {
      Alert.alert(
        'Share Failed',
        'Something went wrong while sharing. Please try again.'
      );
    } finally {
      setIsSending(false);
      setPreviewVisible(false);
      setPreviewUri(null);
      pendingRef.current = null;
    }
  }, [previewUri, isSending]);

  const cancelPreview = useCallback(() => {
    setPreviewVisible(false);
    setPreviewUri(null);
    pendingRef.current = null;
  }, []);

  return {
    viewRef,
    isCapturing,
    isSending,
    previewUri,
    previewVisible,
    capturePreview,
    confirmShare,
    cancelPreview,
  };
}
