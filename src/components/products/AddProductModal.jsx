import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { X, Plus } from 'lucide-react';

const categories = [
  { value: 'cleanser', label: 'Cleanser', icon: '🧴' },
  { value: 'toner', label: 'Toner', icon: '💧' },
  { value: 'serum', label: 'Serum', icon: '✨' },
  { value: 'moisturizer', label: 'Moisturizer', icon: '🧈' },
  { value: 'sunscreen', label: 'Sunscreen', icon: '☀️' },
  { value: 'eye_cream', label: 'Eye Cream', icon: '👁️' },
  { value: 'face_mask', label: 'Face Mask', icon: '🎭' },
];

export default function AddProductModal({ open, onClose, onSave }) {
  const [form, setForm] = useState({
    product_name: '',
    category: '',
    benefits: '',
    price_range: 'mid',
    key_ingredients: [],
  });
  const [ingredientInput, setIngredientInput] = useState('');

  const addIngredient = () => {
    const val = ingredientInput.trim();
    if (val && !form.key_ingredients.includes(val)) {
      setForm(f => ({ ...f, key_ingredients: [...f.key_ingredients, val] }));
      setIngredientInput('');
    }
  };

  const removeIngredient = (ing) => {
    setForm(f => ({ ...f, key_ingredients: f.key_ingredients.filter(i => i !== ing) }));
  };

  const handleSubmit = () => {
    if (!form.product_name || !form.category) return;
    onSave(form);
    setForm({ product_name: '', category: '', benefits: '', price_range: 'mid', key_ingredients: [] });
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Add Product to My Shelf</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label>Product Name *</Label>
            <Input
              placeholder="e.g. CeraVe Hydrating Cleanser"
              value={form.product_name}
              onChange={e => setForm(f => ({ ...f, product_name: e.target.value }))}
            />
          </div>

          <div>
            <Label>Category *</Label>
            <Select value={form.category} onValueChange={v => setForm(f => ({ ...f, category: v }))}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.icon} {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Key Ingredients</Label>
            <div className="flex gap-2 mb-2">
              <Input
                placeholder="e.g. Niacinamide"
                value={ingredientInput}
                onChange={e => setIngredientInput(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), addIngredient())}
              />
              <Button type="button" size="icon" variant="outline" onClick={addIngredient}>
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-1">
              {form.key_ingredients.map(ing => (
                <Badge key={ing} variant="secondary" className="gap-1">
                  {ing}
                  <button onClick={() => removeIngredient(ing)}>
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label>Notes / Benefits</Label>
            <Textarea
              placeholder="Why you use this product, what it does for your skin..."
              value={form.benefits}
              onChange={e => setForm(f => ({ ...f, benefits: e.target.value }))}
              rows={2}
            />
          </div>

          <div>
            <Label>Price Range</Label>
            <Select value={form.price_range} onValueChange={v => setForm(f => ({ ...f, price_range: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="budget">Budget</SelectItem>
                <SelectItem value="mid">Mid-Range</SelectItem>
                <SelectItem value="premium">Premium</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 pt-2">
            <Button variant="outline" className="flex-1" onClick={onClose}>Cancel</Button>
            <Button
              className="flex-1 bg-gradient-to-r from-pink-500 to-amber-500"
              onClick={handleSubmit}
              disabled={!form.product_name || !form.category}
            >
              Add to Shelf
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}