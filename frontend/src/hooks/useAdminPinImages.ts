import { useState, useEffect, useRef, useCallback } from "react";
import {
  getPinImages,
  uploadPinImage,
  updateImageCaption,
  deletePinImage,
  syncPinImages,
  updateImageOrder,
  type Pin,
  type PinImage,
} from "../services/travelPinService";

interface Params {
  editingPinId: string | null;
  panelPin: Pin | undefined;
  token: string;
  handleAuthError: () => void;
  setSubmitError: (msg: string) => void;
  setSubmitSuccess: (msg: string) => void;
}

export function useAdminPinImages({
  editingPinId,
  panelPin,
  token,
  handleAuthError,
  setSubmitError,
  setSubmitSuccess,
}: Params) {
  const [pinImages, setPinImages] = useState<PinImage[]>([]);
  const [imagesLoading, setImagesLoading] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [editingImage, setEditingImage] = useState<PinImage | null>(null);
  const [captionDraft, setCaptionDraft] = useState("");
  const [captionSaving, setCaptionSaving] = useState(false);
  const [deletingImage, setDeletingImage] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [brokenImages, setBrokenImages] = useState<Set<string>>(new Set());
  const [cropFile, setCropFile] = useState<File | null>(null);
  const [reEditingImage, setReEditingImage] = useState<PinImage | null>(null);
  const [fetchingForReEdit, setFetchingForReEdit] = useState(false);
  const [draggingPublicId, setDraggingPublicId] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragIndexRef = useRef<number | null>(null);
  const dragOriginRef = useRef<PinImage[] | null>(null);
  const dropSucceededRef = useRef(false);

  useEffect(() => {
    if (!editingPinId) {
      setPinImages([]);
      setBrokenImages(new Set());
      setEditingImage(null);
      return;
    }
    setImagesLoading(true);
    setBrokenImages(new Set());
    getPinImages(editingPinId)
      .then(setPinImages)
      .catch(() => {})
      .finally(() => setImagesLoading(false));
  }, [editingPinId]);

  const handleUploadImage = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !panelPin) return;
    e.target.value = "";
    setCropFile(file);
  };

  const handleCropConfirm = async (blob: Blob) => {
    if (!panelPin) return;
    const origFile = cropFile;
    const reCropTarget = reEditingImage;
    setCropFile(null);
    setReEditingImage(null);
    setUploadingImage(true);
    setSubmitError("");

    if (reCropTarget) {
      try {
        const file = new File([blob], "recrop.jpg", { type: blob.type });
        let newImg = await uploadPinImage(panelPin.id, file, token);
        if (reCropTarget.caption) {
          try {
            await updateImageCaption(
              panelPin.id,
              newImg.cloudinaryPublicId,
              reCropTarget.caption,
              token,
            );
            newImg = { ...newImg, caption: reCropTarget.caption };
          } catch {
            /* caption copy failed — continue */
          }
        }
        await deletePinImage(panelPin.id, reCropTarget.cloudinaryPublicId, token);
        const newList = pinImages.map((img) =>
          img.cloudinaryPublicId === reCropTarget.cloudinaryPublicId ? newImg : img,
        );
        setPinImages(newList);
        await updateImageOrder(
          panelPin.id,
          newList.map((i) => i.cloudinaryPublicId),
          token,
        );
        setSubmitSuccess("image updated.");
      } catch (err) {
        if (err instanceof Error && err.message === "unauthorized")
          handleAuthError();
        else setSubmitError("Failed to re-crop image.");
      } finally {
        setUploadingImage(false);
      }
    } else {
      try {
        const file = new File([blob], origFile?.name ?? "upload.jpg", {
          type: blob.type,
        });
        const img = await uploadPinImage(panelPin.id, file, token);
        setPinImages((prev) => [...prev, img]);
      } catch (err) {
        if (err instanceof Error && err.message === "unauthorized")
          handleAuthError();
        else setSubmitError("Failed to upload image.");
      } finally {
        setUploadingImage(false);
      }
    }
  };

  const handleReCropClick = async () => {
    if (!editingImage) return;
    setFetchingForReEdit(true);
    setSubmitError("");
    try {
      // Fetch image bytes from Cloudinary CDN to create a local File for the crop UI
      const resp = await fetch(editingImage.cloudinarySecureUrl);
      const blob = await resp.blob();
      const file = new File([blob], "recrop.jpg", {
        type: blob.type || "image/jpeg",
      });
      setReEditingImage(editingImage);
      setEditingImage(null);
      setCropFile(file);
    } catch {
      setSubmitError("Failed to load image for editing.");
    } finally {
      setFetchingForReEdit(false);
    }
  };

  const handleSaveCaption = async () => {
    if (!editingImage || !panelPin) return;
    setCaptionSaving(true);
    try {
      await updateImageCaption(
        panelPin.id,
        editingImage.cloudinaryPublicId,
        captionDraft,
        token,
      );
      setPinImages((prev) =>
        prev.map((img) =>
          img.cloudinaryPublicId === editingImage.cloudinaryPublicId
            ? { ...img, caption: captionDraft }
            : img,
        ),
      );
      setEditingImage(null);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
    } finally {
      setCaptionSaving(false);
    }
  };

  const handleDeleteImage = async () => {
    if (!editingImage || !panelPin) return;
    if (!window.confirm("Delete this image? This cannot be undone.")) return;
    setDeletingImage(true);
    try {
      await deletePinImage(panelPin.id, editingImage.cloudinaryPublicId, token);
      setPinImages((prev) =>
        prev.filter(
          (img) => img.cloudinaryPublicId !== editingImage.cloudinaryPublicId,
        ),
      );
      setEditingImage(null);
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Failed to delete image.");
    } finally {
      setDeletingImage(false);
    }
  };

  const handleSync = async () => {
    if (!panelPin) return;
    setSyncing(true);
    setSubmitError("");
    try {
      const pruned = await syncPinImages(panelPin.id, token);
      const fresh = await getPinImages(panelPin.id);
      setPinImages(fresh);
      setBrokenImages(new Set());
      if (pruned > 0)
        setSubmitSuccess(
          `Synced! Removed ${pruned} deleted image${pruned === 1 ? "" : "s"}.`,
        );
    } catch (err) {
      if (err instanceof Error && err.message === "unauthorized")
        handleAuthError();
      else setSubmitError("Sync failed. Please try again.");
    } finally {
      setSyncing(false);
    }
  };

  const handleDragStart = useCallback(
    (index: number, publicId: string) => {
      dragIndexRef.current = index;
      dragOriginRef.current = [...pinImages];
      dropSucceededRef.current = false;
      setDraggingPublicId(publicId);
    },
    [pinImages],
  );

  const handleDragOver = useCallback((e: React.DragEvent, targetIndex: number) => {
    e.preventDefault();
    const fromIndex = dragIndexRef.current;
    if (fromIndex === null || fromIndex === targetIndex) return;
    setPinImages((prev) => {
      const imgs = [...prev];
      const [item] = imgs.splice(fromIndex, 1);
      imgs.splice(targetIndex, 0, item);
      dragIndexRef.current = targetIndex;
      return imgs;
    });
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      dropSucceededRef.current = true;
      if (!panelPin) return;
      try {
        await updateImageOrder(
          panelPin.id,
          pinImages.map((img) => img.cloudinaryPublicId),
          token,
        );
        dragOriginRef.current = null;
      } catch (err) {
        if (err instanceof Error && err.message === "unauthorized")
          handleAuthError();
        else if (dragOriginRef.current) setPinImages(dragOriginRef.current);
      }
      setDraggingPublicId(null);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [panelPin, pinImages, token],
  );

  const handleDragEnd = useCallback(() => {
    if (!dropSucceededRef.current && dragOriginRef.current) {
      setPinImages(dragOriginRef.current);
    }
    dragIndexRef.current = null;
    dragOriginRef.current = null;
    setDraggingPublicId(null);
  }, []);

  return {
    pinImages,
    setPinImages,
    imagesLoading,
    uploadingImage,
    editingImage,
    setEditingImage,
    captionDraft,
    setCaptionDraft,
    captionSaving,
    deletingImage,
    syncing,
    brokenImages,
    setBrokenImages,
    cropFile,
    setCropFile,
    reEditingImage,
    setReEditingImage,
    fetchingForReEdit,
    draggingPublicId,
    fileInputRef,
    handleUploadImage,
    handleCropConfirm,
    handleReCropClick,
    handleSaveCaption,
    handleDeleteImage,
    handleSync,
    handleDragStart,
    handleDragOver,
    handleDrop,
    handleDragEnd,
  };
}
