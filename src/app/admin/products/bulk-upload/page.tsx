'use client';

import { useState, useCallback, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useDropzone } from 'react-dropzone';
import { Upload, X, Check } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { bulkCreateProducts } from '@/lib/actions/products';

interface VariantOption {
  id: string;
  name: string;
}

interface VariantType {
  id: string;
  name: string;
  options: VariantOption[];
}

export default function BulkUploadPage() {
  const router = useRouter();
  const { toast } = useToast();
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadedImages, setUploadedImages] = useState<string[]>([]);
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchVariants();
  }, []);

  const fetchVariants = async () => {
    try {
      const response = await fetch('/api/variants');
      if (response.ok) {
        const data = await response.json();
        // Only show enabled variant types and their enabled options
        const enabledVariants = data
          .filter((vt: any) => vt.enabled)
          .map((vt: any) => ({
            ...vt,
            options: vt.options.filter((opt: any) => opt.enabled),
          }));
        setVariantTypes(enabledVariants);
      }
    } catch (error) {
      console.error('Error fetching variants:', error);
    }
  };

  const toggleVariant = (optionId: string) => {
    const newSelected = new Set(selectedVariants);
    if (newSelected.has(optionId)) {
      newSelected.delete(optionId);
    } else {
      newSelected.add(optionId);
    }
    setSelectedVariants(newSelected);
  };

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setFiles((prev) => [...prev, ...acceptedFiles]);
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.webp'],
    },
  });

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const uploadImages = async () => {
    setUploading(true);
    const uploadedUrls: string[] = [];

    try {
      for (const file of files) {
        const formData = new FormData();
        formData.append('file', file);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });

        if (!response.ok) throw new Error('Upload failed');

        const data = await response.json();
        uploadedUrls.push(data.url);
      }

      setUploadedImages(uploadedUrls);
      return uploadedUrls;
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload images',
        variant: 'destructive',
      });
      setUploading(false);
      return null;
    }
  };

  const createProducts = async () => {
    let imageUrls = uploadedImages;

    if (imageUrls.length === 0) {
      imageUrls = await uploadImages() || [];
      if (imageUrls.length === 0) return;
    }

    try {
      const variantOptionIds = Array.from(selectedVariants);
      const result = await bulkCreateProducts(imageUrls, variantOptionIds);

      if (result.success) {
        toast({
          title: 'Success',
          description: `Created ${result.products?.length} product drafts`,
        });
        router.push('/admin/products');
      } else {
        toast({
          title: 'Error',
          description: result.error || 'Failed to create products',
          variant: 'destructive',
        });
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Bulk Upload Products</h1>
        <p className="text-gray-600">
          Upload multiple images to create product drafts. Each image will create one product.
        </p>
      </div>

      <div className="grid gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload Images</CardTitle>
            <CardDescription>
              Drag and drop images or click to select files. Each image will become a separate product.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div
              {...getRootProps()}
              className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors ${
                isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              <input {...getInputProps()} />
              <Upload className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              {isDragActive ? (
                <p className="text-lg">Drop the images here...</p>
              ) : (
                <>
                  <p className="text-lg mb-2">Drag & drop images here, or click to select</p>
                  <p className="text-sm text-gray-500">PNG, JPG, JPEG, or WebP</p>
                </>
              )}
            </div>

            {files.length > 0 && (
              <div className="mt-6">
                <h3 className="font-semibold mb-3">Selected Files ({files.length})</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {files.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        className="w-full h-32 object-cover rounded-lg"
                      />
                      <button
                        onClick={() => removeFile(index)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-xs mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {files.length > 0 && (
              <div className="mt-6 flex gap-4">
                <Button onClick={createProducts} disabled={uploading} size="lg">
                  {uploading ? 'Creating Products...' : `Create ${files.length} Products`}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => {
                    setFiles([]);
                    setUploadedImages([]);
                  }}
                  disabled={uploading}
                >
                  Clear All
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {variantTypes.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Product Variants (Optional)</CardTitle>
              <CardDescription>
                Select which variants these products should have. This is optional.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {variantTypes.map((variantType) => (
                <div key={variantType.id}>
                  <Label className="text-base font-semibold mb-2 block">
                    {variantType.name}
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {variantType.options.map((option) => (
                      <label
                        key={option.id}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg border cursor-pointer transition-colors ${
                          selectedVariants.has(option.id)
                            ? 'bg-blue-50 border-blue-500'
                            : 'bg-white border-gray-300 hover:border-gray-400'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={selectedVariants.has(option.id)}
                          onChange={() => toggleVariant(option.id)}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="font-medium">{option.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
              {selectedVariants.size > 0 && (
                <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-800">
                    {selectedVariants.size} variant(s) selected - These will be applied to all uploaded products
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>How it works</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">1. Upload Images</h4>
                <p className="text-sm text-gray-600">
                  Select or drag multiple product images
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">2. Auto-Create Drafts</h4>
                <p className="text-sm text-gray-600">
                  Each image creates a product draft with default values (200g weight, Rs. 800 price)
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="bg-blue-100 rounded-full p-2">
                <Check className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-medium">3. Edit & Publish</h4>
                <p className="text-sm text-gray-600">
                  Go to Products page to edit details and enable products
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
