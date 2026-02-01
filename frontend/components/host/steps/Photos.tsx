import { Upload, X } from "lucide-react";
import { useState } from "react";

export default function Photos({
  images,
  setImages,
}: {
  images: any[];
  setImages: (value: any[]) => void;
}) {
  const [uploading, setUploading] = useState(false);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    setUploading(true);
    // Store actual File objects for upload
    const newImages = Array.from(files).map((file) => ({
      file: file,
      url: URL.createObjectURL(file),
      filename: file.name,
    }));

    setImages([...images, ...newImages]);
    setUploading(false);
  };

  const removeImage = (index: number) => {
    setImages(images.filter((_, i) => i !== index));
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-4xl font-semibold text-gray-900 mb-2">
          Add some photos of your place
        </h1>
        <p className="text-lg text-gray-600">
          You'll need at least 5 photos to get started. You can add more or make changes later.
        </p>
      </div>

      <div className="space-y-6">
        {images.length > 0 && (
          <div className="grid grid-cols-3 gap-4">
            {images.map((image, index) => (
              <div key={index} className="relative aspect-square">
                <img
                  src={image.url}
                  alt={`Property ${index + 1}`}
                  className="w-full h-full object-cover rounded-lg"
                />
                <button
                  onClick={() => removeImage(index)}
                  className="absolute top-2 right-2 w-8 h-8 bg-white rounded-full flex items-center justify-center shadow-lg hover:bg-gray-100"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <label className="block">
          <div className="border-2 border-dashed border-gray-300 rounded-xl p-12 text-center cursor-pointer hover:border-gray-400 transition-colors">
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <div className="text-lg font-medium text-gray-900 mb-1">
              {uploading ? "Uploading..." : "Upload photos"}
            </div>
            <div className="text-sm text-gray-500">
              Drag and drop or click to browse
            </div>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileChange}
            className="hidden"
            disabled={uploading}
          />
        </label>
      </div>
    </div>
  );
}
