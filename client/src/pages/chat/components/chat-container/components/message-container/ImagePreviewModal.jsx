import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Download, X } from "lucide-react";

export const ImagePreviewModal = ({ imageUrl, onClose, onDownload }) => (
  <Dialog open={!!imageUrl} onOpenChange={() => onClose()}>
    <DialogContent className="sm:max-w-[90vw] max-h-[90vh] p-0 bg-transparent border-none">
      <div className="relative w-full h-full">
        <div className="absolute top-4 right-4 flex gap-2 z-10">
          <button
            onClick={() => onDownload(imageUrl)}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <Download className="w-6 h-6 text-white" />
          </button>
          <button
            onClick={onClose}
            className="p-2 bg-black/50 hover:bg-black/70 rounded-full transition-colors"
          >
            <X className="w-6 h-6 text-white" />
          </button>
        </div>
        <img
          src={imageUrl}
          alt="Preview"
          className="max-w-full max-h-[85vh] object-contain mx-auto"
        />
      </div>
    </DialogContent>
  </Dialog>
);
