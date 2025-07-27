import React, { useState, useEffect } from 'react';

interface PricingStepProps {
  data: any;
  setData: (d: any) => void;
  onNext: () => void;
  onPrev: () => void;
}

const TIERS = [
  { key: 'basic', label: 'Basic', desc: 'Aftermarket parts' },
  { key: 'standard', label: 'Standard', desc: 'OEM-like quality' },
  { key: 'premium', label: 'Premium', desc: 'Original manufacturer parts' },
];

const PricingStep: React.FC<PricingStepProps> = ({ data, setData, onNext, onPrev }) => {
  // Expect data.selectedCategories, data.selectedBrands, data.selectedModels, data.services (issue mapping)
  const [pricing, setPricing] = useState<any>(data.pricing || {});
  const [warranty, setWarranty] = useState<any>(data.warranty || {});

  // Helper to get all selected models and issues
  const getSelectedModelsAndIssues = () => {
    const result: { category: string; brand: string; model: string; issue: string }[] = [];
    (data.selectedCategories || []).forEach((category: string) => {
      (data.selectedBrands?.[category] || []).forEach((brand: string) => {
        (data.selectedModels?.[category]?.[brand] || []).forEach((model: string) => {
          const issues = Object.keys(data.services?.[category]?.[brand]?.[model] || {});
          issues.forEach(issue => {
            result.push({ category, brand, model, issue });
          });
        });
      });
    });
    return result;
  };

  // Bulk edit state
  const [bulkPrice, setBulkPrice] = useState<{ [tier: string]: number }>({ basic: 0, standard: 0, premium: 0 });
  const [bulkWarranty, setBulkWarranty] = useState<number>(0);

  // Bulk apply handler
  const handleBulkApply = () => {
    const items = getSelectedModelsAndIssues();
    const newPricing = { ...pricing };
    const newWarranty = { ...warranty };
    items.forEach(({ category, brand, model, issue }) => {
      if (!newPricing[category]) newPricing[category] = {};
      if (!newPricing[category][brand]) newPricing[category][brand] = {};
      if (!newPricing[category][brand][model]) newPricing[category][brand][model] = {};
      newPricing[category][brand][model][issue] = { ...bulkPrice };
      if (!newWarranty[category]) newWarranty[category] = {};
      if (!newWarranty[category][brand]) newWarranty[category][brand] = {};
      if (!newWarranty[category][brand][model]) newWarranty[category][brand][model] = {};
      newWarranty[category][brand][model][issue] = bulkWarranty;
    });
    setPricing(newPricing);
    setWarranty(newWarranty);
  };

  // Individual price/warranty change
  const handlePriceChange = (category: string, brand: string, model: string, issue: string, tier: string, value: number) => {
    setPricing((prev: any) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [brand]: {
          ...(prev[category]?.[brand] || {}),
          [model]: {
            ...(prev[category]?.[brand]?.[model] || {}),
            [issue]: {
              ...(prev[category]?.[brand]?.[model]?.[issue] || {}),
              [tier]: value
            }
          }
        }
      }
    }));
  };
  const handleWarrantyChange = (category: string, brand: string, model: string, issue: string, value: number) => {
    setWarranty((prev: any) => ({
      ...prev,
      [category]: {
        ...(prev[category] || {}),
        [brand]: {
          ...(prev[category]?.[brand] || {}),
          [model]: {
            ...(prev[category]?.[brand]?.[model] || {}),
            [issue]: value
          }
        }
      }
    }));
  };

  // Sync to parent
  useEffect(() => {
    setData({ ...data, pricing, warranty });
  }, [pricing, warranty]);

  const items = getSelectedModelsAndIssues();

  return (
    <form className="space-y-6" onSubmit={e => { e.preventDefault(); onNext(); }}>
      <h2 className="text-xl font-bold mb-4">Pricing & Warranty Setup</h2>
      <div className="bg-gray-50 p-4 rounded mb-4">
        <div className="flex flex-wrap gap-4 mb-2">
          {TIERS.map(tier => (
            <div key={tier.key} className="flex flex-col">
              <label className="font-medium mb-1">{tier.label} Price</label>
              <input type="number" min={0} className="input w-24" value={bulkPrice[tier.key] || ''} onChange={e => setBulkPrice(p => ({ ...p, [tier.key]: parseInt(e.target.value) || 0 }))} />
              <span className="text-xs text-gray-500">{tier.desc}</span>
            </div>
          ))}
          <div className="flex flex-col">
            <label className="font-medium mb-1">Warranty (days)</label>
            <input type="number" min={0} className="input w-24" value={bulkWarranty || ''} onChange={e => setBulkWarranty(parseInt(e.target.value) || 0)} />
            <span className="text-xs text-gray-500">For all tiers</span>
          </div>
          <button type="button" className="btn btn-outline mt-6" onClick={handleBulkApply}>Bulk Apply to All</button>
        </div>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="p-2 border">Category</th>
              <th className="p-2 border">Brand</th>
              <th className="p-2 border">Model</th>
              <th className="p-2 border">Issue/Service</th>
              {TIERS.map(tier => (
                <th key={tier.key} className="p-2 border">{tier.label} Price</th>
              ))}
              <th className="p-2 border">Warranty (days)</th>
            </tr>
          </thead>
          <tbody>
            {items.map(({ category, brand, model, issue }) => (
              <tr key={category + brand + model + issue}>
                <td className="p-2 border">{category}</td>
                <td className="p-2 border">{brand}</td>
                <td className="p-2 border">{model}</td>
                <td className="p-2 border">{issue}</td>
                {TIERS.map(tier => (
                  <td key={tier.key} className="p-2 border">
                    <input
                      type="number"
                      min={0}
                      className="input w-20"
                      value={pricing?.[category]?.[brand]?.[model]?.[issue]?.[tier.key] || ''}
                      onChange={e => handlePriceChange(category, brand, model, issue, tier.key, parseInt(e.target.value) || 0)}
                    />
                  </td>
                ))}
                <td className="p-2 border">
                  <input
                    type="number"
                    min={0}
                    className="input w-20"
                    value={warranty?.[category]?.[brand]?.[model]?.[issue] || ''}
                    onChange={e => handleWarrantyChange(category, brand, model, issue, parseInt(e.target.value) || 0)}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-between mt-6">
        <button type="button" className="btn btn-outline" onClick={onPrev}>Previous</button>
        <button type="submit" className="btn btn-primary">Next</button>
      </div>
    </form>
  );
};

export default PricingStep; 