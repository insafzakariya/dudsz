'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Plus, Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface VariantOption {
  id: string;
  name: string;
  enabled: boolean;
}

interface VariantType {
  id: string;
  name: string;
  enabled: boolean;
  options: VariantOption[];
}

export default function VariantsPage() {
  const [variantTypes, setVariantTypes] = useState<VariantType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddType, setShowAddType] = useState(false);
  const [showAddOption, setShowAddOption] = useState<string | null>(null);
  const [newTypeName, setNewTypeName] = useState('');
  const [newOptionName, setNewOptionName] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    fetchVariants();
  }, []);

  const fetchVariants = async () => {
    try {
      const response = await fetch('/api/variants');
      if (response.ok) {
        const data = await response.json();
        setVariantTypes(data);
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load variants',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createVariantType = async () => {
    if (!newTypeName.trim()) return;

    try {
      const response = await fetch('/api/variants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newTypeName }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Variant type created successfully',
        });
        setNewTypeName('');
        setShowAddType(false);
        fetchVariants();
      } else {
        throw new Error('Failed to create');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create variant type',
        variant: 'destructive',
      });
    }
  };

  const createVariantOption = async (variantTypeId: string) => {
    if (!newOptionName.trim()) return;

    try {
      const response = await fetch('/api/variants/options', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          variantTypeId,
          name: newOptionName,
        }),
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Variant option created successfully',
        });
        setNewOptionName('');
        setShowAddOption(null);
        fetchVariants();
      } else {
        throw new Error('Failed to create');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create variant option',
        variant: 'destructive',
      });
    }
  };

  const toggleVariantType = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/variants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (response.ok) {
        fetchVariants();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update variant type',
        variant: 'destructive',
      });
    }
  };

  const toggleVariantOption = async (id: string, enabled: boolean) => {
    try {
      const response = await fetch(`/api/variants/options/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ enabled: !enabled }),
      });

      if (response.ok) {
        fetchVariants();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to update variant option',
        variant: 'destructive',
      });
    }
  };

  const deleteVariantType = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant type? All its options will be deleted as well.')) return;

    try {
      const response = await fetch(`/api/variants/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Variant type deleted successfully',
        });
        fetchVariants();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete variant type',
        variant: 'destructive',
      });
    }
  };

  const deleteVariantOption = async (id: string) => {
    if (!confirm('Are you sure you want to delete this variant option?')) return;

    try {
      const response = await fetch(`/api/variants/options/${id}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        toast({
          title: 'Success',
          description: 'Variant option deleted successfully',
        });
        fetchVariants();
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete variant option',
        variant: 'destructive',
      });
    }
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Product Variants</h1>
          <p className="text-gray-600">
            Manage variant types (Size, Color, Model) and their options
          </p>
        </div>
        <Button onClick={() => setShowAddType(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Variant Type
        </Button>
      </div>

      {showAddType && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Create New Variant Type</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="typeName">Variant Type Name</Label>
              <Input
                id="typeName"
                value={newTypeName}
                onChange={(e) => setNewTypeName(e.target.value)}
                placeholder="e.g., Color, Model, Material"
              />
            </div>
            <div className="flex gap-2">
              <Button onClick={createVariantType}>Create</Button>
              <Button variant="outline" onClick={() => {
                setShowAddType(false);
                setNewTypeName('');
              }}>
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6">
        {variantTypes.map((variantType) => (
          <Card key={variantType.id}>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{variantType.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={variantType.enabled}
                      onChange={() => toggleVariantType(variantType.id, variantType.enabled)}
                      className="h-4 w-4 rounded border-gray-300"
                    />
                    <span className="text-sm">Enabled</span>
                  </label>
                  <Button
                    size="sm"
                    onClick={() => setShowAddOption(variantType.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Add Option
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => deleteVariantType(variantType.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {showAddOption === variantType.id && (
                <div className="mb-4 p-4 border rounded-lg bg-gray-50">
                  <Label htmlFor="optionName">Option Name</Label>
                  <div className="flex gap-2 mt-2">
                    <Input
                      id="optionName"
                      value={newOptionName}
                      onChange={(e) => setNewOptionName(e.target.value)}
                      placeholder="e.g., S, M, L"
                    />
                    <Button onClick={() => createVariantOption(variantType.id)}>
                      Add
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setShowAddOption(null);
                        setNewOptionName('');
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}

              {variantType.options.length === 0 ? (
                <p className="text-gray-500 text-sm">No options added yet</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {variantType.options.map((option) => (
                    <div
                      key={option.id}
                      className={`flex items-center gap-2 px-3 py-2 rounded-lg border ${
                        option.enabled
                          ? 'bg-blue-50 border-blue-200'
                          : 'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <span className="font-medium">{option.name}</span>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => toggleVariantOption(option.id, option.enabled)}
                          className="text-xs px-2 py-1 rounded bg-white border"
                        >
                          {option.enabled ? 'Disable' : 'Enable'}
                        </button>
                        <button
                          onClick={() => deleteVariantOption(option.id)}
                          className="text-red-600 hover:text-red-700 p-1"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}

        {variantTypes.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center text-gray-500">
              No variant types created yet. Click "Add Variant Type" to create one.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
